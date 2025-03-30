// install.js
import { platform } from 'os';
import { chmodSync, copyFileSync } from 'fs';
import { join } from 'path';

const os = platform();

const BIN_PATH = {
  darwin: 'stellar-mcp-macos',
  linux: 'stellar-mcp-linux',
  win32: 'stellar-mcp-win.exe',
}[os];

if (!BIN_PATH) {
  console.error(`Unsupported OS: ${os}`);
  process.exit(1);
}

const source = join('bin', BIN_PATH);
const target = join('bin', 'stellar');

copyFileSync(source, target);
chmodSync(target, 0o755);

console.log(`✔ Installed binary: ${BIN_PATH}`);