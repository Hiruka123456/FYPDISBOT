import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─── FIND BOT DIRECTORY ───────────────────────────────────────────────────────
// The bot directory is always alongside the web directory
const BOT_DIR = (() => {
  if (process.env.VERCEL) {
    return '/tmp';
  }
  const candidates = [
    path.resolve(process.cwd(), '..', 'bot'),   // running from web/
    path.resolve('F:', 'FYPDISBOT', 'bot'),      // absolute fallback
    path.resolve(process.cwd(), 'bot'),          // running from root
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'welcomeConfig.json')) ||
        fs.existsSync(path.join(dir, 'index.js'))) {
      return dir;
    }
  }
  return candidates[0];
})();

const INBOX_CONFIG_PATH = path.join(BOT_DIR, 'inboxConfig.json');

console.log('[inbox API] BOT_DIR:', BOT_DIR);
console.log('[inbox API] inboxConfig path:', INBOX_CONFIG_PATH);

// ─── READ / WRITE ─────────────────────────────────────────────────────────────
function readInboxConfig() {
  try {
    if (fs.existsSync(INBOX_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(INBOX_CONFIG_PATH, 'utf8'));
    }
  } catch {}
  return { channelId: '' };
}

function writeInboxConfig(data) {
  try {
    if (!fs.existsSync(BOT_DIR)) fs.mkdirSync(BOT_DIR, { recursive: true });
    fs.writeFileSync(INBOX_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('[inbox API] Saved:', data);
    return true;
  } catch (e) {
    console.error('[inbox API] Write error:', e.message);
    return false;
  }
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json(readInboxConfig());
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newConfig = { channelId: (body.channelId || '').trim() };
    const ok = writeInboxConfig(newConfig);
    if (ok) {
      return NextResponse.json({ success: true, config: newConfig });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to write config file' }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
