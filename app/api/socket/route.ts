import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Socket.io server will be initialized in the Next.js server
  return NextResponse.json({ message: 'Socket server endpoint' });
}
