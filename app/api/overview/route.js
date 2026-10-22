import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BOT_DIR = (() => {
  if (process.env.VERCEL) return '/tmp';
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

const GUILD_ID_DEFAULT = '1562039371090362398';

function getDiscordCredentials() {
  const token = process.env.DISCORD_TOKEN;
  const guildId = process.env.GUILD_ID || GUILD_ID_DEFAULT;
  return { token, guildId };
}

export async function GET() {
  const { token, guildId } = getDiscordCredentials();
  if (!token) {
    return NextResponse.json({ error: 'DISCORD_TOKEN missing' }, { status: 500 });
  }

  const headers = { Authorization: `Bot ${token}` };

  try {
    const [guildRes, membersRes, channelsRes, rolesRes, bansRes] = await Promise.all([
      fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, { headers }),
      fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`, { headers }),
      fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, { headers }),
      fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, { headers }),
      fetch(`https://discord.com/api/v10/guilds/${guildId}/bans`, { headers }).catch(() => null),
    ]);

    const guild = guildRes.ok ? await guildRes.json() : {};
    const members = membersRes.ok ? await membersRes.json() : [];
    const channels = channelsRes.ok ? await channelsRes.json() : [];
    const roles = rolesRes.ok ? await rolesRes.json() : [];
    const bans = bansRes && bansRes.ok ? await bansRes.json() : [];

    // Categorize members
    const bots = members.filter(m => m.user?.bot);
    const humans = members.filter(m => !m.user?.bot);

    // Channel types
    const textChannels = channels.filter(c => c.type === 0 || c.type === 5);
    const voiceChannels = channels.filter(c => c.type === 2 || c.type === 13);
    const categories = channels.filter(c => c.type === 4);

    // Filter server roles
    const formattedRoles = roles
      .filter(r => r.name !== '@everyone')
      .sort((a, b) => b.position - a.position)
      .map(r => ({
        id: r.id,
        name: r.name,
        color: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#94a3b8',
        position: r.position,
        permissions: r.permissions,
      }));

    // Formatted members list (up to 50 for performance)
    const formattedMembers = members.slice(0, 50).map(m => {
      const avatarUrl = m.user?.avatar
        ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.webp?size=64`
        : `https://cdn.discordapp.com/embed/avatars/${(BigInt(m.user.id) >> 22n) % 6n}.png`;

      return {
        id: m.user?.id,
        username: m.user?.username,
        globalName: m.user?.global_name || m.nick || m.user?.username,
        avatar: avatarUrl,
        isBot: Boolean(m.user?.bot),
        joinedAt: m.joined_at,
        roles: m.roles,
        premiumSince: m.premium_since,
      };
    });

    // Local stats from files if available
    let totalTickets = 0;
    let openTickets = 0;
    try {
      const ticketFile = path.join(BOT_DIR, 'ticketData.json');
      if (fs.existsSync(ticketFile)) {
        const td = JSON.parse(fs.readFileSync(ticketFile, 'utf8'));
        totalTickets = (td.tickets || []).length;
        openTickets = (td.tickets || []).filter(t => t.status === 'open').length;
      }
    } catch {}

    let totalWarnings = 0;
    try {
      const warnFile = path.join(BOT_DIR, 'warnings.json');
      if (fs.existsSync(warnFile)) {
        const wd = JSON.parse(fs.readFileSync(warnFile, 'utf8'));
        totalWarnings = (wd.warnings || []).length;
      }
    } catch {}

    const totalMembers = guild.approximate_member_count || members.length || 0;
    const onlineMembers = guild.approximate_presence_count || 0;
    const offlineMembers = Math.max(0, totalMembers - onlineMembers);

    const iconUrl = guild.icon
      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=128`
      : null;

    return NextResponse.json({
      success: true,
      server: {
        id: guild.id,
        name: guild.name || 'Discord Community',
        icon: iconUrl,
        description: guild.description || null,
        ownerId: guild.owner_id,
        boostTier: guild.premium_tier || 0,
        boostCount: guild.premium_subscription_count || 0,
        verificationLevel: guild.verification_level,
        preferredLocale: guild.preferred_locale,
      },
      counts: {
        totalMembers,
        onlineMembers,
        offlineMembers,
        humansCount: humans.length,
        botsCount: bots.length,
        totalChannels: channels.length,
        textChannelsCount: textChannels.length,
        voiceChannelsCount: voiceChannels.length,
        categoriesCount: categories.length,
        rolesCount: formattedRoles.length,
        bansCount: Array.isArray(bans) ? bans.length : 0,
        totalTickets,
        openTickets,
        totalWarnings,
      },
      members: formattedMembers,
      roles: formattedRoles,
      channels: {
        categories: categories.map(c => ({ id: c.id, name: c.name })),
        text: textChannels.map(c => ({ id: c.id, name: c.name, parentId: c.parent_id })),
        voice: voiceChannels.map(c => ({ id: c.id, name: c.name, parentId: c.parent_id })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
