import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to shared welcomeConfig.json in the bot directory
const botConfigPath = path.join(process.cwd(), '..', 'bot', 'welcomeConfig.json');

// Default fallback config
let memoryConfig = {
  enabled: true,
  channelId: '',
  title: 'Welcome to {server}!',
  message: 'Hey {user}, welcome to the server! We are thrilled to have you here. You are our #{memberCount} member! 🚀',
  imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  embedColor: '#6366f1',
};

// Read config from file or memory
function loadConfig() {
  try {
    if (fs.existsSync(botConfigPath)) {
      const data = fs.readFileSync(botConfigPath, 'utf8');
      memoryConfig = JSON.parse(data);
    }
  } catch {
    // If running standalone or on Vercel where sibling folder isn't mounted, memoryConfig is used
  }
  return memoryConfig;
}

// Save config to file and memory
function saveConfig(newConfig) {
  memoryConfig = { ...memoryConfig, ...newConfig };
  try {
    const dir = path.dirname(botConfigPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(botConfigPath, JSON.stringify(memoryConfig, null, 2), 'utf8');
  } catch {
    // Handled in serverless environment
  }
  return memoryConfig;
}

export async function GET() {
  const config = loadConfig();
  return NextResponse.json(config);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const updated = saveConfig(body);
    return NextResponse.json({ success: true, config: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
