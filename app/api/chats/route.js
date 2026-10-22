import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to shared chatHistory.json
const possibleChatPaths = [
  path.resolve(process.cwd(), '..', 'bot', 'chatHistory.json'),
  path.resolve('F:', 'FYPDISBOT', 'bot', 'chatHistory.json'),
  path.resolve(process.cwd(), 'chatHistory.json'),
];

function getChatHistoryPath() {
  for (const p of possibleChatPaths) {
    if (fs.existsSync(p)) return p;
  }
  return possibleChatPaths[0];
}

let inMemoryHistory = {
  conversations: [
    {
      userId: 'demo-customer-1',
      username: 'SampleCustomer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      lastMessage: 'Hi! Can you help me check my order status?',
      lastUpdated: new Date().toISOString(),
      messages: [
        {
          id: 'msg-1',
          sender: 'customer',
          senderName: 'SampleCustomer',
          text: 'Hi! Can you help me check my order status?',
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: 'msg-2',
          sender: 'bot',
          senderName: 'Support Agent',
          text: 'Hello! Welcome to our support desk. Please provide your order ID.',
          timestamp: new Date().toISOString(),
        },
      ],
    },
  ],
};

function readHistory() {
  try {
    const filePath = getChatHistoryPath();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (data && Array.isArray(data.conversations)) {
        inMemoryHistory = data;
      }
    }
  } catch {
    // Handled in serverless
  }
  return inMemoryHistory;
}

function writeHistory(data) {
  inMemoryHistory = data;
  try {
    const filePath = getChatHistoryPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(inMemoryHistory, null, 2), 'utf8');
  } catch {
    // Handled in serverless
  }
}

// Send DM via Discord REST API
async function sendDiscordDM(token, userId, messageContent) {
  if (!token || !userId || !messageContent) {
    throw new Error('Missing token, userId, or messageContent');
  }

  // 1. Open or get existing DM channel with user
  const channelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipient_id: userId }),
  });

  if (!channelRes.ok) {
    const errText = await channelRes.text();
    throw new Error(`Failed to open DM channel with user (${userId}): ${errText}`);
  }

  const channelData = await channelRes.json();
  const dmChannelId = channelData.id;

  // 2. Post the DM message into the channel
  const sendRes = await fetch(`https://discord.com/api/v10/channels/${dmChannelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: messageContent }),
  });

  if (!sendRes.ok) {
    const errText = await sendRes.text();
    throw new Error(`Failed to send message: ${errText}`);
  }

  return await sendRes.json();
}

// Fetch Discord User Profile via REST API
async function fetchDiscordUser(token, userId) {
  const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function GET() {
  const history = readHistory();
  return NextResponse.json(history);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const token = process.env.DISCORD_TOKEN;
    const history = readHistory();
    const now = new Date().toISOString();

    // ACTION: REPLY TO EXISTING CUSTOMER
    if (body.action === 'reply') {
      const { userId, text } = body;
      if (!userId || !text?.trim()) {
        return NextResponse.json({ error: 'Missing userId or text' }, { status: 400 });
      }

      // Try sending live DM on Discord if valid numeric Discord ID
      let discordSent = false;
      let discordError = null;
      if (token && /^\d{15,22}$/.test(userId)) {
        try {
          await sendDiscordDM(token, userId, text);
          discordSent = true;
        } catch (err) {
          discordError = err.message;
          console.error('Discord DM error:', err.message);
        }
      }

      let conv = history.conversations.find((c) => c.userId === userId);
      if (!conv) {
        conv = {
          userId,
          username: `User-${userId.slice(-4)}`,
          avatar: '',
          lastMessage: text,
          lastUpdated: now,
          messages: [],
        };
        history.conversations.unshift(conv);
      } else {
        conv.lastMessage = text;
        conv.lastUpdated = now;
      }

      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        senderName: 'Support Agent (Bot)',
        text: text.trim(),
        timestamp: now,
      };

      conv.messages.push(newMsg);
      writeHistory(history);

      return NextResponse.json({
        success: true,
        message: newMsg,
        discordSent,
        discordNote: discordError ? `Logged locally (Discord error: ${discordError})` : 'Sent directly to customer on Discord!',
      });
    }

    // ACTION: START NEW CONVERSATION BY USERNAME OR USER ID
    if (body.action === 'start') {
      const { target, initialMessage } = body;
      if (!target?.trim()) {
        return NextResponse.json({ error: 'Please provide a User ID or Username' }, { status: 400 });
      }

      const cleanTarget = target.trim().replace(/[<@!>]/g, '');
      let userId = cleanTarget;
      let username = cleanTarget;
      let avatar = '';

      // If valid numeric Discord ID, fetch their live profile from Discord
      if (token && /^\d{15,22}$/.test(cleanTarget)) {
        const discordUser = await fetchDiscordUser(token, cleanTarget);
        if (discordUser) {
          username = discordUser.global_name || discordUser.username;
          if (discordUser.avatar) {
            avatar = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;
          }
        }
      }

      // Check if conversation already exists
      let conv = history.conversations.find((c) => c.userId === userId);
      const firstMsgText = initialMessage?.trim() || 'Hello! How can we assist you today?';

      if (!conv) {
        conv = {
          userId,
          username,
          avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          lastMessage: firstMsgText,
          lastUpdated: now,
          messages: [
            {
              id: `msg-${Date.now()}`,
              sender: 'bot',
              senderName: 'Support Agent (Bot)',
              text: firstMsgText,
              timestamp: now,
            },
          ],
        };
        history.conversations.unshift(conv);
      } else {
        conv.lastMessage = firstMsgText;
        conv.lastUpdated = now;
        conv.messages.push({
          id: `msg-${Date.now()}`,
          sender: 'bot',
          senderName: 'Support Agent (Bot)',
          text: firstMsgText,
          timestamp: now,
        });
      }

      // Attempt sending the initial DM to customer on Discord
      let discordSent = false;
      if (token && /^\d{15,22}$/.test(userId)) {
        try {
          await sendDiscordDM(token, userId, firstMsgText);
          discordSent = true;
        } catch (e) {
          console.error('Could not send initial DM:', e.message);
        }
      }

      writeHistory(history);
      return NextResponse.json({
        success: true,
        conversation: conv,
        discordSent,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
