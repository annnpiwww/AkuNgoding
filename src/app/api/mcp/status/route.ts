import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execFileAsync = promisify(execFile);

export async function GET() {
  const mcpRoot = path.join(process.cwd(), 'mcp-server');
  const entry = path.join(mcpRoot, 'dist', 'index.js');
  const healthScript = path.join(mcpRoot, 'health.cjs');

  if (!fs.existsSync(entry) || !fs.existsSync(healthScript)) {
    return NextResponse.json({
      connected: false,
      error: 'MCP server belum di-build. Jalankan: cd mcp-server && npm install && npm run build',
      mcpRoot,
    });
  }

  try {
    const { stdout } = await execFileAsync('node', [healthScript], {
      cwd: mcpRoot,
      timeout: 15000,
      env: { ...process.env },
      maxBuffer: 1024 * 1024,
    });
    const result = JSON.parse(stdout.trim());
    return NextResponse.json({
      ...result,
      command: `node ${entry}`,
      supabaseProject: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^https?:\/\//, ''),
    });
  } catch (e: any) {
    return NextResponse.json({ connected: false, error: e?.message || 'Gagal mengecek MCP server' });
  }
}
