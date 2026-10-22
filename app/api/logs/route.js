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

const DEFAULT_CONFIG = {
  globalEnabled: true,
  defaultChannelId: '',
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

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function readLogsConfig() {
  try {
    if (fs.existsSync(LOGS_CONFIG_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(LOGS_CONFIG_PATH, 'utf8'));
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
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

// ─── ENDPOINTS ────────────────────────────────────────────────────────────────
export async function GET() {
  const config = readLogsConfig();
  const recentLogs = readRecentLogs();
  return NextResponse.json({ config, recentLogs });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const current = readLogsConfig();

    const updated = {
      globalEnabled: body.globalEnabled !== undefined ? Boolean(body.globalEnabled) : current.globalEnabled,
      defaultChannelId: (body.defaultChannelId !== undefined ? body.defaultChannelId : current.defaultChannelId || '').trim(),
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
