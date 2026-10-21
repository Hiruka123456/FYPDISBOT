import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Discord Bot Moderation Dashboard (Next.js)',
    framework: 'Next.js / React',
    timestamp: new Date().toISOString(),
  });
}
