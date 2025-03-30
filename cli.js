#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const binary = join(__dirname, 'bin', 'stellar');

const args = process.argv.slice(2);
const result = spawnSync(binary, args, { stdio: 'inherit' });

process.exit(result.status ?? 1);