import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Locate the bot directory (where inboxConfig.json lives)
const possibleBotDirs = [
  path.resolve(process.cwd(), '..', 'bot'),
  path.resolve('F:', 'FYPDISBOT', 'bot'),
  process.cwd(),
];

function getBotDir() {
  for (const d of possibleBotDirs) {
    // prefer a dir that already has welcomeConfig.json (confirms it's the bot dir)
    if (fs.existsSync(path.join(d, 'welcomeConfig.json'))) return d;
  }
  return possibleBotDirs[0];
}

function getInboxConfigPath() {
  return path.join(getBotDir(), 'inboxConfig.json');
}

let memoryInboxConfig = { channelId: '' };

function loadInboxConfig() {
  try {
    const p = getInboxConfigPath();
    if (fs.existsSync(p)) {
      memoryInboxConfig = JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch {}
  return memoryInboxConfig;
}

function saveInboxConfig(cfg) {
  memoryInboxConfig = { ...memoryInboxConfig, ...cfg };
  try {
    const p = getInboxConfigPath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(memoryInboxConfig, null, 2), 'utf8');
  } catch {}
  return memoryInboxConfig;
}

export async function GET() {
  const config = loadInboxConfig();
  return NextResponse.json(config);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const updated = saveInboxConfig(body);
    return NextResponse.json({ success: true, config: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
