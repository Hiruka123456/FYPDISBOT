import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─── BOT DIRECTORY RESOLVER ───────────────────────────────────────────────────
const BOT_DIR = (() => {
  if (process.env.VERCEL) {
    return '/tmp';
  }
  const candidates = [
    path.resolve(process.cwd(), '..', 'bot'),
    path.resolve('F:', 'FYPDISBOT', 'bot'),
    path.resolve(process.cwd(), 'bot'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'welcomeConfig.json')) ||
        fs.existsSync(path.join(dir, 'ticketData.json')) ||
        fs.existsSync(path.join(dir, 'index.js'))) {
      return dir;
    }
  }
  return candidates[0];
})();

const TICKET_DATA_PATH   = path.join(BOT_DIR, 'ticketData.json');
const TICKET_CONFIG_PATH = path.join(BOT_DIR, 'ticketConfig.json');
const TMP_DATA_PATH      = '/tmp/ticketData.json';
const TMP_CONFIG_PATH    = '/tmp/ticketConfig.json';

const DEFAULT_CONFIG = {
  enabled: true,
  categoryId: '1562822100903923854',          // Default to server "Tickets" category
  transcriptChannelId: '1562822217186803754', // Default to server "#transcript" channel
  supportRoleId: '1562687268739747850',       // Default to server "admin" role
  maxOpenPerUser: 5,
  openMessage: 'Welcome to your support ticket! A staff member will be with you shortly. Please describe your issue.',
  autoCloseHours: 0,
};

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
    if (fs.existsSync(p)) {
      const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
      return { ...DEFAULT_CONFIG, ...cfg };
    }
    if (fs.existsSync(TICKET_CONFIG_PATH)) {
      const cfg = JSON.parse(fs.readFileSync(TICKET_CONFIG_PATH, 'utf8'));
      return { ...DEFAULT_CONFIG, ...cfg };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(c) {
  try { fs.writeFileSync(resolveConfigPath(), JSON.stringify(c, null, 2), 'utf8'); } catch {}
  try { fs.writeFileSync(TICKET_CONFIG_PATH, JSON.stringify(c, null, 2), 'utf8'); } catch {}
}

// ─── DISCORD GUILD DATA FETCHERS ──────────────────────────────────────────────
const GUILD_ID_DEFAULT = '1562039371090362398';

function getDiscordCredentials() {
  const token = process.env.DISCORD_TOKEN;
  const guildId = process.env.GUILD_ID || GUILD_ID_DEFAULT;
  return { token, guildId };
}

async function fetchServerRoles() {
  const { token, guildId } = getDiscordCredentials();
  if (!token) return [];
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

async function fetchServerChannels() {
  const { token, guildId } = getDiscordCredentials();
  if (!token) return { categories: [], textChannels: [] };
  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!res.ok) return { categories: [], textChannels: [] };
    const channels = await res.json();
    if (!Array.isArray(channels)) return { categories: [], textChannels: [] };

    const categories = channels
      .filter(c => c.type === 4)
      .map(c => ({ id: c.id, name: c.name }));

    const textChannels = channels
      .filter(c => c.type === 0)
      .map(c => ({ id: c.id, name: c.name, parentId: c.parent_id }));

    return { categories, textChannels, all: channels };
  } catch {
    return { categories: [], textChannels: [] };
  }
}

async function fetchChannelMessages(channelId) {
  const { token } = getDiscordCredentials();
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

async function sendDiscordMessage(channelId, content, authorName) {
  const { token } = getDiscordCredentials();
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

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action    = searchParams.get('action');
  const channelId = searchParams.get('channelId');

  if (action === 'messages' && channelId) {
    const msgs = await fetchChannelMessages(channelId);
    return NextResponse.json({ messages: msgs });
  }

  const data       = loadData();
  const config     = loadConfig();
  const [roles, channelData] = await Promise.all([
    fetchServerRoles(),
    fetchServerChannels(),
  ]);

  // Discover any active ticket channels in Discord not yet in database
  const activeDiscordTicketChannels = (channelData.all || []).filter(c =>
    c.type === 0 && (c.name.startsWith('ticket-') || (config.categoryId && c.parent_id === config.categoryId && c.name.startsWith('ticket-')))
  );

  let updated = false;
  for (const ch of activeDiscordTicketChannels) {
    const exists = data.tickets.some(t => t.channelId === ch.id);
    if (!exists) {
      const numMatch = ch.name.match(/ticket-(\d+)/);
      const num = numMatch ? parseInt(numMatch[1]) : data.tickets.length + 1;
      data.tickets.push({
        id: `ticket-${num}-${Date.now()}`,
        number: num,
        channelId: ch.id,
        channelName: ch.name,
        openedBy: 'discord-user',
        openedByName: ch.name.replace(/^ticket-\d+-?/, '') || 'Discord User',
        openedByTag: ch.name,
        subject: ch.topic || 'Support Ticket',
        status: 'open',
        createdAt: new Date().toISOString(),
        closedAt: null,
        participants: [],
        messages: [],
        guildId: GUILD_ID_DEFAULT,
      });
      updated = true;
    }
  }
  if (updated) saveData(data);

  // Enrich tickets with stats
  const tickets = data.tickets.map(t => ({
    ...t,
    messageCount: (t.messages || []).length,
  }));

  return NextResponse.json({
    tickets,
    config,
    roles,
    categories: channelData.categories,
    textChannels: channelData.textChannels,
  });
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
    ticket.messages = ticket.messages || [];
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

    // Notify Discord channel and delete channel
    const { token } = getDiscordCredentials();
    if (token && ticket.channelId) {
      await fetch(`https://discord.com/api/v10/channels/${ticket.channelId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `🔒 **Ticket closed from web dashboard.**\nReason: ${reason}` }),
      }).catch(() => {});

      // Delete ticket channel after 5s
      setTimeout(async () => {
        try {
          await fetch(`https://discord.com/api/v10/channels/${ticket.channelId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bot ${token}` },
          });
        } catch {}
      }, 5000);
    }

    return NextResponse.json({ success: true, ticket });
  }

  // Delete ticket record from web
  if (action === 'delete_ticket') {
    const { ticketId } = body;
    const data = loadData();
    data.tickets = data.tickets.filter(t => t.id !== ticketId);
    saveData(data);
    return NextResponse.json({ success: true });
  }

  // Sync tickets from bot
  if (action === 'sync_from_bot') {
    if (Array.isArray(body.tickets)) {
      const data = loadData();
      data.tickets = body.tickets;
      saveData(data);
    }
    if (body.config) {
      saveConfig(body.config);
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
