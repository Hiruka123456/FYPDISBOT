import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BOT_DIR = path.join(process.cwd(), '..', 'bot');
const TICKET_DATA_PATH   = path.join(BOT_DIR, 'ticketData.json');
const TICKET_CONFIG_PATH = path.join(BOT_DIR, 'ticketConfig.json');

// ─── Default fallback paths (Vercel / temp) ──────────────────────────────────
const TMP_DATA_PATH   = '/tmp/ticketData.json';
const TMP_CONFIG_PATH = '/tmp/ticketConfig.json';

function resolveDataPath() {
  try { if (fs.existsSync(BOT_DIR)) return TICKET_DATA_PATH; } catch {}
  return TMP_DATA_PATH;
}
function resolveConfigPath() {
  try { if (fs.existsSync(BOT_DIR)) return TICKET_CONFIG_PATH; } catch {}
  return TMP_CONFIG_PATH;
}

function loadData() {
  try {
    const p = resolveDataPath();
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    if (fs.existsSync(TICKET_DATA_PATH)) return JSON.parse(fs.readFileSync(TICKET_DATA_PATH, 'utf8'));
  } catch {}
  return { tickets: [] };
}
function saveData(d) {
  try { fs.writeFileSync(resolveDataPath(), JSON.stringify(d, null, 2), 'utf8'); } catch {}
  try { fs.writeFileSync(TICKET_DATA_PATH, JSON.stringify(d, null, 2), 'utf8'); } catch {}
}

function loadConfig() {
  try {
    const p = resolveConfigPath();
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    if (fs.existsSync(TICKET_CONFIG_PATH)) return JSON.parse(fs.readFileSync(TICKET_CONFIG_PATH, 'utf8'));
  } catch {}
  return {
    enabled: true,
    categoryId: '',
    transcriptChannelId: '',
    supportRoleId: '',
    maxOpenPerUser: 1,
    openMessage: 'Welcome to your support ticket! A staff member will be with you shortly.',
    autoCloseHours: 0,
  };
}
function saveConfig(c) {
  try { fs.writeFileSync(resolveConfigPath(), JSON.stringify(c, null, 2), 'utf8'); } catch {}
  try { fs.writeFileSync(TICKET_CONFIG_PATH, JSON.stringify(c, null, 2), 'utf8'); } catch {}
}

// ─── Fetch Discord server roles ───────────────────────────────────────────────
async function fetchServerRoles() {
  const token   = process.env.DISCORD_TOKEN;
  const guildId = process.env.GUILD_ID;
  if (!token || !guildId) return [];
  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!res.ok) return [];
    const roles = await res.json();
    return roles
      .filter(r => r.name !== '@everyone')
      .sort((a, b) => b.position - a.position)
      .map(r => ({
        id: r.id,
        name: r.name,
        color: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : null,
        position: r.position,
      }));
  } catch { return []; }
}

// ─── Send message to ticket channel via Discord REST ─────────────────────────
async function sendDiscordMessage(channelId, content, authorName) {
  const token = process.env.DISCORD_TOKEN;
  if (!token || !channelId) return false;
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `**[${authorName} via Dashboard]** ${content}` }),
    });
    return res.ok;
  } catch { return false; }
}

// ─── Fetch messages from a Discord channel ───────────────────────────────────
async function fetchChannelMessages(channelId) {
  const token = process.env.DISCORD_TOKEN;
  if (!token || !channelId) return [];
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=100`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!res.ok) return [];
    const msgs = await res.json();
    return msgs.reverse().map(m => ({
      id: m.id,
      author: m.author.bot ? `🤖 ${m.author.username}` : m.author.username,
      authorTag: m.author.username,
      authorId: m.author.id,
      content: m.content || (m.embeds?.[0]?.description || ''),
      timestamp: m.timestamp,
      isBot: m.author.bot,
    }));
  } catch { return []; }
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action    = searchParams.get('action');
  const ticketId  = searchParams.get('ticketId');
  const channelId = searchParams.get('channelId');

  if (action === 'messages' && channelId) {
    const msgs = await fetchChannelMessages(channelId);
    return NextResponse.json({ messages: msgs });
  }

  const data   = loadData();
  const config = loadConfig();
  const roles  = await fetchServerRoles();

  // Enrich tickets with stats
  const tickets = data.tickets.map(t => ({
    ...t,
    messageCount: (t.messages || []).length,
  }));

  return NextResponse.json({ tickets, config, roles });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request) {
  const body = await request.json();
  const { action } = body;

  // Save config
  if (action === 'save_config') {
    const cfg = loadConfig();
    const updated = { ...cfg, ...body.config };
    saveConfig(updated);
    return NextResponse.json({ success: true, config: updated });
  }

  // Send web message to ticket
  if (action === 'send_message') {
    const { ticketId, content, authorName = 'Staff (Web)' } = body;
    const data   = loadData();
    const ticket = data.tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status !== 'open') {
      return NextResponse.json({ success: false, error: 'Ticket not found or closed' }, { status: 404 });
    }

    // Send to Discord channel
    const sent = await sendDiscordMessage(ticket.channelId, content, authorName);

    // Save to ticket messages
    const msg = {
      id: `web-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      author: `🌐 ${authorName}`,
      content,
      timestamp: new Date().toISOString(),
      isBot: true,
      fromWeb: true,
    };
    ticket.messages.push(msg);
    ticket.lastActivity = msg.timestamp;
    saveData(data);

    return NextResponse.json({ success: true, message: msg, discordSent: sent });
  }

  // Close ticket via web
  if (action === 'close_ticket') {
    const { ticketId, reason = 'Closed from dashboard' } = body;
    const data   = loadData();
    const ticket = data.tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status !== 'open') {
      return NextResponse.json({ success: false, error: 'Ticket not found or already closed' }, { status: 404 });
    }

    // Fetch live messages
    const liveMsgs = await fetchChannelMessages(ticket.channelId);
    const existing = ticket.messages || [];
    const msgMap   = new Map();
    [...existing, ...liveMsgs].forEach(m => msgMap.set(m.id || m.timestamp, m));
    const sorted = [...msgMap.values()].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    ticket.status       = 'closed';
    ticket.closedAt     = new Date().toISOString();
    ticket.closedBy     = 'dashboard';
    ticket.closedByName = 'Staff (Web Dashboard)';
    ticket.closeReason  = reason;
    ticket.messages     = sorted;
    saveData(data);

    // Notify Discord channel
    const token = process.env.DISCORD_TOKEN;
    if (token && ticket.channelId) {
      await fetch(`https://discord.com/api/v10/channels/${ticket.channelId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `🔒 **Ticket closed from web dashboard.**\nReason: ${reason}` }),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, ticket });
  }

  // Delete ticket record
  if (action === 'delete_ticket') {
    const { ticketId } = body;
    const data = loadData();
    data.tickets = data.tickets.filter(t => t.id !== ticketId);
    saveData(data);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
