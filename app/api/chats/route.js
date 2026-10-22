import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─── BOT DIRECTORY (same as inbox API) ───────────────────────────────────────
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
        fs.existsSync(path.join(dir, 'index.js'))) {
      return dir;
    }
  }
  return candidates[0];
})();

const CHAT_HISTORY_PATH = path.join(BOT_DIR, 'chatHistory.json');
const INBOX_CONFIG_PATH = path.join(BOT_DIR, 'inboxConfig.json');

// ─── HISTORY HELPERS ──────────────────────────────────────────────────────────
function readHistory() {
  try {
    if (fs.existsSync(CHAT_HISTORY_PATH)) {
      return JSON.parse(fs.readFileSync(CHAT_HISTORY_PATH, 'utf8'));
    }
  } catch {}
  return { conversations: [] };
}

function writeHistory(data) {
  try {
    if (!fs.existsSync(BOT_DIR)) fs.mkdirSync(BOT_DIR, { recursive: true });
    fs.writeFileSync(CHAT_HISTORY_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[chats API] writeHistory error:', e.message);
  }
}

function getInboxChannelId() {
  try {
    if (fs.existsSync(INBOX_CONFIG_PATH)) {
      const cfg = JSON.parse(fs.readFileSync(INBOX_CONFIG_PATH, 'utf8'));
      if (cfg && cfg.channelId && cfg.channelId.trim()) return cfg.channelId.trim();
    }
  } catch {}
  if (process.env.INBOX_CHANNEL_ID && process.env.INBOX_CHANNEL_ID.trim()) {
    return process.env.INBOX_CHANNEL_ID.trim();
  }
  return '1562655416062705815'; // Default to #inbox channel
}

// ─── DISCORD HELPERS ──────────────────────────────────────────────────────────
async function sendDiscordDM(token, userId, text) {
  // Step 1: Open/get DM channel
  const chRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
    method: 'POST',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_id: userId }),
  });
  if (!chRes.ok) {
    const errText = await chRes.text();
    let parsed;
    try { parsed = JSON.parse(errText); } catch {}
    if (parsed?.code === 50007) {
      throw new Error('User has DMs disabled in privacy settings, does not share a server with the bot, or the ID is a bot.');
    }
    if (parsed?.code === 50033 || parsed?.code === 10013) {
      throw new Error('Unknown User ID: No Discord user exists with this ID.');
    }
    throw new Error(parsed?.message || errText);
  }
  const { id: channelId } = await chRes.json();

  // Step 2: Send message
  const msgRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text }),
  });
  if (!msgRes.ok) {
    const errText = await msgRes.text();
    let parsed;
    try { parsed = JSON.parse(errText); } catch {}
    if (parsed?.code === 50007) {
      throw new Error('User has DMs disabled in privacy settings, does not share a server with the bot, or the ID is a bot.');
    }
    throw new Error(parsed?.message || errText);
  }
  return await msgRes.json();
}

async function postToInboxChannel(token, channelId, embed) {
  if (!token || !channelId) return;
  try {
    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch {}
}

async function fetchDiscordUser(token, userId) {
  try {
    const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

function getDiscordToken() {
  if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN.trim()) {
    return process.env.DISCORD_TOKEN.trim();
  }
  const envPaths = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
    path.join(BOT_DIR, '.env'),
    path.join(process.cwd(), '..', 'bot', '.env'),
  ];
  for (const p of envPaths) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        const match = content.match(/^DISCORD_TOKEN\s*=\s*(.+)$/m);
        if (match && match[1]) {
          const val = match[1].trim().replace(/^['"]|['"]$/g, '');
          if (val) return val;
        }
      }
    } catch {}
  }
  return '';
}

function parseInboxEmbed(embed, msgTime, msgId) {
  if (!embed || !embed.description) return null;
  const desc = embed.description;
  const authorName = embed.author?.name || '';
  const avatar = embed.author?.icon_url || '';

  // Case 1: Customer DM
  if (authorName.includes('DM from')) {
    const idMatch = desc.match(/\(ID:\s*`?(\d{15,22})`?\)/);
    const textMatch = desc.match(/\n\n>\s*([\s\S]+?)$/);
    if (idMatch) {
      const userId = idMatch[1];
      const username = authorName.replace(/^📩\s*DM from\s*/, '').trim() || ('User-' + userId.slice(-4));
      const text = textMatch ? textMatch[1].trim() : desc;
      return {
        userId, username, avatar, text, sender: 'customer', senderName: username,
        timestamp: embed.timestamp || msgTime, id: msgId
      };
    }
  }

  // Case 2: Staff Reply or New Chat
  if (authorName.includes('Reply') || authorName.includes('New Chat')) {
    const idMatch = desc.match(/\*\*To:\*\*\s*<@!?(\d{15,22})>/) || desc.match(/\(`?(\d{15,22})`?\)/);
    const textMatch = desc.match(/\n\n>\s*([\s\S]+?)(?:\n\n[✅⚠️]|$)/);
    if (idMatch) {
      const userId = idMatch[1];
      let username = authorName.replace(/^📤\s*(?:Dashboard )?Reply (?:→|to)\s*/, '')
                               .replace(/^🆕\s*New Chat Started with\s*/, '').trim() || ('User-' + userId.slice(-4));
      const text = textMatch ? textMatch[1].trim() : '';
      return {
        userId, username, avatar: '', text, sender: 'bot', senderName: 'Support Agent',
        timestamp: embed.timestamp || msgTime, id: msgId
      };
    }
  }
  return null;
}

// ─── GET: Return all conversations (synced with Discord #inbox) ─────────────────
export async function GET() {
  const history = readHistory();
  const token = getDiscordToken();
  const inboxId = getInboxChannelId();

  // Real-time synchronization from Discord #inbox channel
  if (token && inboxId) {
    try {
      const res = await fetch(`https://discord.com/api/v10/channels/${inboxId}/messages?limit=100`, {
        headers: { Authorization: `Bot ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const discordMsgs = await res.json();
        if (Array.isArray(discordMsgs) && discordMsgs.length > 0) {
          // Process messages oldest to newest
          const chronological = [...discordMsgs].reverse();
          for (const dm of chronological) {
            for (const embed of (dm.embeds || [])) {
              const parsed = parseInboxEmbed(embed, dm.timestamp, dm.id);
              if (parsed && parsed.text) {
                let conv = history.conversations.find(c => c.userId === parsed.userId);
                if (!conv) {
                  conv = {
                    userId: parsed.userId,
                    username: parsed.username,
                    avatar: parsed.avatar || '',
                    lastMessage: parsed.text,
                    lastUpdated: parsed.timestamp,
                    messages: []
                  };
                  history.conversations.unshift(conv);
                } else {
                  if (parsed.username && !conv.username.startsWith('User-')) conv.username = parsed.username;
                  if (parsed.avatar && !conv.avatar) conv.avatar = parsed.avatar;
                  conv.lastMessage = parsed.text;
                  conv.lastUpdated = parsed.timestamp;
                }
                const exists = conv.messages.some(m => m.id === parsed.id || (m.timestamp === parsed.timestamp && m.text === parsed.text));
                if (!exists) {
                  conv.messages.push({
                    id: parsed.id,
                    sender: parsed.sender,
                    senderName: parsed.senderName,
                    text: parsed.text,
                    timestamp: parsed.timestamp,
                  });
                }
              }
            }
          }
          history.conversations.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
          writeHistory(history);
        }
      }
    } catch (e) {
      console.error('[chats API] Inbox sync error:', e.message);
    }
  }

  return NextResponse.json(history);
}

// ─── POST: Handle actions ─────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const token = getDiscordToken();
    const now = new Date().toISOString();

    // ── ACTION: REPLY to existing customer ─────────────────────────────────────
    if (body.action === 'reply') {
      const { userId, text } = body;
      if (!userId || !text?.trim()) {
        return NextResponse.json({ error: 'Missing userId or text' }, { status: 400 });
      }

      const history = readHistory();
      let conv = history.conversations.find(c => c.userId === userId);

      // Try to send DM to customer on Discord
      let dmSent = false;
      let dmError = null;
      if (token && /^\d{15,22}$/.test(userId)) {
        try {
          await sendDiscordDM(token, userId, `📨 **Support Reply:** ${text.trim()}`);
          dmSent = true;
        } catch (e) {
          dmError = e.message;
          console.error('[chats API] DM error:', e.message);
        }
      }

      // Add to local history
      if (!conv) {
        conv = { userId, username: `User-${userId.slice(-4)}`, avatar: '', lastMessage: text, lastUpdated: now, messages: [] };
        history.conversations.unshift(conv);
      } else {
        conv.lastMessage = text.trim();
        conv.lastUpdated = now;
      }
      const newMsg = {
        id: `msg-${Date.now()}`, sender: 'bot', senderName: 'Support Agent (Dashboard)',
        text: text.trim(), timestamp: now,
      };
      conv.messages.push(newMsg);
      writeHistory(history);

      // Forward to inbox channel
      const inboxId = getInboxChannelId();
      if (inboxId && token) {
        await postToInboxChannel(token, inboxId, {
          color: 0x10b981,
          author: { name: `📤 Dashboard Reply to ${conv.username}` },
          description:
            `**To:** <@${userId}> (\`${userId}\`)\n**From:** Dashboard Support\n\n> ${text}\n\n` +
            (dmSent ? '✅ DM delivered to customer' : `⚠️ DM failed: ${dmError}`),
          timestamp: now,
        });
      }

      return NextResponse.json({
        success: true, message: newMsg, dmSent,
        note: dmSent ? '✅ DM sent to customer on Discord!' : `Saved locally (DM error: ${dmError})`,
      });
    }

    // ── ACTION: START new conversation ─────────────────────────────────────────
    if (body.action === 'start') {
      const { target, initialMessage } = body;
      if (!target?.trim()) {
        return NextResponse.json({ error: 'Please provide a Discord User ID' }, { status: 400 });
      }

      const cleanTarget = target.trim().replace(/[<@!>]/g, '');
      const firstMsg = initialMessage?.trim() || 'Hello! How can we assist you today?';

      // Validate numeric Discord Snowflake ID
      if (!/^\d{15,22}$/.test(cleanTarget)) {
        return NextResponse.json({
          error: 'Invalid User ID! You must enter a numeric Discord User ID (17-20 digits). Discord cannot send DMs by username. Example: 496682662522519563',
        }, { status: 400 });
      }

      if (!token) {
        return NextResponse.json({
          error: 'DISCORD_TOKEN is missing in web/.env. Please configure your bot token.',
        }, { status: 500 });
      }

      const history = readHistory();
      let userId = cleanTarget;
      let username = cleanTarget;
      let avatar = '';

      // Fetch Discord user profile
      const discordUser = await fetchDiscordUser(token, cleanTarget);
      if (discordUser) {
        if (discordUser.bot) {
          return NextResponse.json({
            error: `This User ID belongs to a bot (@${discordUser.username})! Discord bots cannot DM other bots or themselves. Please enter a real customer's Discord User ID.`,
          }, { status: 400 });
        }
        userId = discordUser.id;
        username = discordUser.global_name || discordUser.username;
        if (discordUser.avatar) {
          avatar = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;
        }
      }

      let conv = history.conversations.find(c => c.userId === userId);
      if (!conv) {
        conv = { userId, username, avatar, lastMessage: firstMsg, lastUpdated: now, messages: [] };
        history.conversations.unshift(conv);
      } else {
        conv.username = username || conv.username;
        if (avatar) conv.avatar = avatar;
        conv.lastMessage = firstMsg;
        conv.lastUpdated = now;
      }

      const newMsg = { id: `msg-${Date.now()}`, sender: 'bot', senderName: 'Support Agent (Dashboard)', text: firstMsg, timestamp: now };
      conv.messages.push(newMsg);
      writeHistory(history);

      // Send DM to user
      let dmSent = false;
      let dmError = null;
      try {
        await sendDiscordDM(token, userId, `📨 **Support:** ${firstMsg}`);
        dmSent = true;
      } catch (e) {
        dmError = e.message;
        console.error('[chats API] start DM error:', e.message);
      }

      // Forward to inbox channel
      const inboxId = getInboxChannelId();
      if (inboxId && token) {
        await postToInboxChannel(token, inboxId, {
          color: 0x6366f1,
          author: { name: `🆕 New Chat Started with ${conv.username}` },
          description:
            `**To:** <@${userId}> (\`${userId}\`)\n**Initiated by:** Dashboard Support\n\n> ${firstMsg}\n\n` +
            (dmSent ? '✅ DM delivered to customer' : `⚠️ DM failed: ${dmError || 'DM blocked / unavailable'}`),
          timestamp: now,
        });
      }

      return NextResponse.json({
        success: true,
        conversation: conv,
        dmSent,
        dmError: dmError || null,
        note: dmSent
          ? '✅ Chat started & message sent to customer on Discord!'
          : `⚠️ Chat created in dashboard (DM not delivered: ${dmError || 'DMs closed or mutual server missing'})`,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('[chats API] Error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
