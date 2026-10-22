import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─── BOT DIRECTORY (same as inbox API) ───────────────────────────────────────
const BOT_DIR = (() => {
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
      return (cfg.channelId || '').trim();
    }
  } catch {}
  return '';
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

// ─── GET: Return all conversations ────────────────────────────────────────────
export async function GET() {
  return NextResponse.json(readHistory());
}

// ─── POST: Handle actions ─────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const token = process.env.DISCORD_TOKEN;
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
