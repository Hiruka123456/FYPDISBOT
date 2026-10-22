import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─── BOT DIRECTORY ────────────────────────────────────────────────────────────
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

const LOGS_CONFIG_PATH = path.join(BOT_DIR, 'logsConfig.json');
const RECENT_LOGS_PATH = path.join(BOT_DIR, 'recentLogs.json');

// Default fallback configuration pointing to real #logs channel (1562687171079708784)
const DEFAULT_CONFIG = {
  globalEnabled: true,
  defaultChannelId: '1562687171079708784',
  categories: {
    messages: {
      enabled: true,
      channelId: '',
      name: 'Message Events',
      description: 'Message deletions, edits, and bulk message purges',
      icon: '💬',
    },
    members: {
      enabled: true,
      channelId: '',
      name: 'Member Events',
      description: 'Member joins, leaves, role assignments, and nickname changes',
      icon: '👥',
    },
    moderation: {
      enabled: true,
      channelId: '',
      name: 'Moderation Events',
      description: 'Bans, unbans, kicks, and timeouts / mutes',
      icon: '🔨',
    },
    channels: {
      enabled: true,
      channelId: '',
      name: 'Channel Events',
      description: 'Channel creations, deletions, and permission changes',
      icon: '📁',
    },
    roles: {
      enabled: true,
      channelId: '',
      name: 'Role Events',
      description: 'Role creations, deletions, and permission modifications',
      icon: '🏷️',
    },
    voice: {
      enabled: true,
      channelId: '',
      name: 'Voice Events',
      description: 'Voice channel joins, leaves, and channel switches',
      icon: '🔊',
    },
    server: {
      enabled: true,
      channelId: '',
      name: 'Server Updates',
      description: 'Server name, icon, invite, and community updates',
      icon: '🌐',
    },
  },
};

// ─── TOKEN HELPER ─────────────────────────────────────────────────────────────
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

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function readLogsConfig() {
  try {
    if (fs.existsSync(LOGS_CONFIG_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(LOGS_CONFIG_PATH, 'utf8'));
      const channelId = parsed.defaultChannelId && parsed.defaultChannelId !== '1562655416062705815'
        ? parsed.defaultChannelId
        : DEFAULT_CONFIG.defaultChannelId;

      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        defaultChannelId: channelId,
        categories: {
          ...DEFAULT_CONFIG.categories,
          ...(parsed.categories || {}),
        },
      };
    }
  } catch (e) {
    console.error('[logs API] readLogsConfig error:', e.message);
  }
  return DEFAULT_CONFIG;
}

function writeLogsConfig(data) {
  try {
    if (!fs.existsSync(BOT_DIR)) fs.mkdirSync(BOT_DIR, { recursive: true });
    fs.writeFileSync(LOGS_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[logs API] writeLogsConfig error:', e.message);
    return false;
  }
}

function readRecentLogs() {
  try {
    if (fs.existsSync(RECENT_LOGS_PATH)) {
      const data = JSON.parse(fs.readFileSync(RECENT_LOGS_PATH, 'utf8'));
      if (Array.isArray(data.logs)) return data.logs;
    }
  } catch {}
  return [];
}

// Parse Discord channel messages from #logs into live audit events
function parseDiscordLogMessage(msg) {
  if (!msg.embeds || msg.embeds.length === 0) return null;
  const embed = msg.embeds[0];
  const title = embed.author?.name || embed.title || 'Audit Event';
  const desc = embed.description || '';
  const time = embed.timestamp || msg.timestamp;

  let category = 'server';
  const tLower = title.toLowerCase();
  if (tLower.includes('message')) category = 'messages';
  else if (tLower.includes('member') || tLower.includes('nickname')) category = 'members';
  else if (tLower.includes('banned') || tLower.includes('kicked') || tLower.includes('timeout')) category = 'moderation';
  else if (tLower.includes('channel')) category = 'channels';
  else if (tLower.includes('role')) category = 'roles';
  else if (tLower.includes('voice')) category = 'voice';

  // Extract metadata from description
  const userMatch = desc.match(/\*\*User:\*\*\s*(?:<@!?)?(\d+)>?\s*\(([^)]+)\)/) ||
                    desc.match(/\*\*Target:\*\*\s*(?:<@!?)?(\d+)>?\s*\(([^)]+)\)/);
  const user = userMatch ? `${userMatch[2]} (${userMatch[1]})` : null;

  const execMatch = desc.match(/\*\*Deleted By:\*\*\s*([^\n]+)/) ||
                    desc.match(/\*\*Updated By:\*\*\s*([^\n]+)/) ||
                    desc.match(/\*\*Banned By:\*\*\s*([^\n]+)/) ||
                    desc.match(/\*\*Kicked By:\*\*\s*([^\n]+)/) ||
                    desc.match(/\*\*Created By:\*\*\s*([^\n]+)/) ||
                    desc.match(/\*\*Executed By:\*\*\s*([^\n]+)/);
  const executor = execMatch ? execMatch[1].replace(/[<@!>]/g, '').trim() : null;

  const chMatch = desc.match(/\*\*Channel:\*\*\s*(?:<#)?(\d+)>?\s*\(([^)]+)\)/) ||
                  desc.match(/\*\*Channel:\*\*\s*([^\n]+)/);
  const channel = chMatch ? (chMatch[2] || chMatch[1]) : null;

  return {
    id: msg.id,
    timestamp: time,
    category,
    title,
    user,
    executor,
    channel,
    details: desc.length > 300 ? desc.slice(0, 297) + '...' : desc,
  };
}

// ─── ENDPOINTS ────────────────────────────────────────────────────────────────
export async function GET() {
  const config = readLogsConfig();
  let recentLogs = readRecentLogs();
  const token = getDiscordToken();
  const targetChannelId = config.defaultChannelId || '1562687171079708784';

  // If running in Vercel or local, pull real log embeds from Discord #logs channel
  if (token && targetChannelId) {
    try {
      const res = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages?limit=50`, {
        headers: { Authorization: `Bot ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const discordMsgs = await res.json();
        if (Array.isArray(discordMsgs)) {
          const parsedDiscordLogs = [];
          for (const m of discordMsgs) {
            const parsed = parseDiscordLogMessage(m);
            if (parsed) parsedDiscordLogs.push(parsed);
          }

          // Merge without duplicates
          const seen = new Set();
          const merged = [];
          for (const l of [...parsedDiscordLogs, ...recentLogs]) {
            if (!seen.has(l.id)) {
              seen.add(l.id);
              merged.push(l);
            }
          }
          recentLogs = merged;
        }
      }
    } catch (e) {
      console.error('[logs API] Discord live sync error:', e.message);
    }
  }

  return NextResponse.json({ config, recentLogs });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const token = getDiscordToken();

    // ── ACTION: TEST AUDIT LOG DIRECTLY IN DISCORD ─────────────────────────────
    if (body.action === 'test') {
      const channelId = (body.channelId || readLogsConfig().defaultChannelId || '1562687171079708784').trim();

      if (!token) {
        return NextResponse.json({ error: 'DISCORD_TOKEN is missing in environment variables.' }, { status: 500 });
      }

      const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '🧪 **[Audit Log Connection Test]**',
          embeds: [
            {
              title: '🛡️ Audit Logging System Connected!',
              description: 'This is a live test triggered from your **Discord Bot Moderation Portal**.\n\nAll enabled server events (messages, members, moderation, channels, roles, voice, server updates) will be automatically dispatched here in real-time.',
              color: 0x10b981,
              fields: [
                { name: 'Channel ID', value: `\`${channelId}\``, inline: true },
                { name: 'Auditing Status', value: '🟢 Active & Listening', inline: true },
                { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
              ],
              footer: { text: 'FYP Discord Bot • Audit Logging Pipeline' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `Discord API error: ${errText}` }, { status: 400 });
      }

      const result = await res.json();
      return NextResponse.json({
        success: true,
        message: 'Test audit log sent to Discord successfully!',
        messageId: result.id,
      });
    }

    // ── ACTION: SAVE CONFIGURATION ─────────────────────────────────────────────
    const current = readLogsConfig();
    const updated = {
      globalEnabled: body.globalEnabled !== undefined ? Boolean(body.globalEnabled) : current.globalEnabled,
      defaultChannelId: (body.defaultChannelId !== undefined ? body.defaultChannelId : current.defaultChannelId || '1562687171079708784').trim(),
      categories: {
        ...current.categories,
        ...(body.categories || {}),
      },
    };

    writeLogsConfig(updated);
    return NextResponse.json({ success: true, config: updated });
  } catch (e) {
    console.error('[logs API] POST error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
