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

const MOD_CONFIG_PATH = path.join(BOT_DIR, 'moderationConfig.json');
const WARNINGS_PATH = path.join(BOT_DIR, 'warnings.json');

// Default configuration with admin role (1562687268739747850)
const DEFAULT_CONFIG = {
  globalEnabled: true,
  adminRoleId: '1562687268739747850',
  logChannelId: '1562687171079708784',
  dmOnAction: true,
  commands: {
    kick: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'Kick Member',
      description: 'Kick a member from the server with an optional reason',
      category: 'punishment',
      icon: '👢',
    },
    ban: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'Ban Member',
      description: 'Permanently ban a member with optional message purge',
      category: 'punishment',
      icon: '🔨',
    },
    unban: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'Unban User',
      description: 'Revoke a ban for a user by their numeric Discord User ID',
      category: 'punishment',
      icon: '🔓',
    },
    timeout: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'Timeout / Mute',
      description: 'Temporarily timeout a member (e.g. 5m, 1h, 1d, 7d)',
      category: 'punishment',
      icon: '⏳',
    },
    untimeout: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'Remove Timeout',
      description: 'Clear the timeout/mute on a member immediately',
      category: 'punishment',
      icon: '🔊',
    },
    warn: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'Warn Member',
      description: 'Issue an official logged warning to a member',
      category: 'warnings',
      icon: '⚠️',
    },
    warnings: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'View Warnings',
      description: 'List all active warnings and history for a user',
      category: 'warnings',
      icon: '📋',
    },
    clearwarn: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'Clear Warnings',
      description: 'Delete all or a specific warning for a user',
      category: 'warnings',
      icon: '🧹',
    },
    purge: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'Purge Messages',
      description: 'Bulk delete up to 100 messages in the current channel',
      category: 'channel',
      icon: '🗑️',
    },
    slowmode: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'Set Slowmode',
      description: 'Set slowmode rate limit for chat (0s to disable)',
      category: 'channel',
      icon: '⏱️',
    },
    lock: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'Lock Channel',
      description: 'Prevent @everyone from sending messages in the channel',
      category: 'channel',
      icon: '🔒',
    },
    unlock: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'Unlock Channel',
      description: 'Restore message sending permissions for @everyone',
      category: 'channel',
      icon: '🔓',
    },
    nick: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'Change Nickname',
      description: "Change or reset a member's server nickname",
      category: 'member',
      icon: '👤',
    },
    role: {
      enabled: true,
      allowedRoles: ['1562687268739747850'],
      name: 'Manage Roles',
      description: 'Add or remove a role from a member',
      category: 'member',
      icon: '🏷️',
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

// ─── CONFIG FILE HELPERS ──────────────────────────────────────────────────────
function readModConfig() {
  try {
    if (fs.existsSync(MOD_CONFIG_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(MOD_CONFIG_PATH, 'utf8'));
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        adminRoleId: parsed.adminRoleId || DEFAULT_CONFIG.adminRoleId,
        commands: {
          ...DEFAULT_CONFIG.commands,
          ...(parsed.commands || {}),
        },
      };
    }
  } catch (e) {
    console.error('[moderation API] readModConfig error:', e.message);
  }
  return DEFAULT_CONFIG;
}

function writeModConfig(data) {
  try {
    if (!fs.existsSync(BOT_DIR)) fs.mkdirSync(BOT_DIR, { recursive: true });
    fs.writeFileSync(MOD_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[moderation API] writeModConfig error:', e.message);
    return false;
  }
}

function readWarnings() {
  try {
    if (fs.existsSync(WARNINGS_PATH)) {
      const data = JSON.parse(fs.readFileSync(WARNINGS_PATH, 'utf8'));
      if (Array.isArray(data.warnings)) return data.warnings;
    }
  } catch {}
  return [];
}

// ─── FETCH SERVER ROLES FROM DISCORD ──────────────────────────────────────────
async function fetchServerRoles(token) {
  if (!token) return [];
  try {
    // 1. Get bot's guilds
    const gRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!gRes.ok) return [];
    const guilds = await gRes.json();
    if (!Array.isArray(guilds) || guilds.length === 0) return [];

    const guildId = guilds[0].id;

    // 2. Fetch roles for this guild
    const rRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!rRes.ok) return [];
    const roles = await rRes.json();

    // Map into clean objects sorted by position
    return roles
      .filter((r) => r.name !== '@everyone')
      .sort((a, b) => b.position - a.position)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#94a3b8',
        position: r.position,
        isAdmin: Boolean((BigInt(r.permissions || 0) & 8n) === 8n),
      }));
  } catch (e) {
    console.error('[moderation API] fetchServerRoles error:', e.message);
    return [];
  }
}

// ─── ENDPOINTS ────────────────────────────────────────────────────────────────
export async function GET() {
  const config = readModConfig();
  const warnings = readWarnings();
  const token = getDiscordToken();
  const roles = await fetchServerRoles(token);

  return NextResponse.json({
    config,
    roles,
    warnings,
  });
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Action: Clear warnings
    if (body.action === 'clear_warn') {
      const { warnId, userId } = body;
      let list = readWarnings();
      if (warnId) {
        list = list.filter((w) => w.id !== warnId);
      } else if (userId) {
        list = list.filter((w) => w.userId !== userId);
      }
      try {
        fs.writeFileSync(WARNINGS_PATH, JSON.stringify({ warnings: list }, null, 2), 'utf8');
      } catch {}
      return NextResponse.json({ success: true, warnings: list });
    }

    // Action: Save moderation configuration
    const current = readModConfig();
    const updated = {
      globalEnabled: body.globalEnabled !== undefined ? Boolean(body.globalEnabled) : current.globalEnabled,
      adminRoleId: (body.adminRoleId !== undefined ? body.adminRoleId : current.adminRoleId || '1562687268739747850').trim(),
      logChannelId: (body.logChannelId !== undefined ? body.logChannelId : current.logChannelId || '1562687171079708784').trim(),
      dmOnAction: body.dmOnAction !== undefined ? Boolean(body.dmOnAction) : current.dmOnAction,
      commands: {
        ...current.commands,
        ...(body.commands || {}),
      },
    };

    writeModConfig(updated);
    return NextResponse.json({ success: true, config: updated });
  } catch (e) {
    console.error('[moderation API] POST error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
