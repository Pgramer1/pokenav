import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('.', import.meta.url));
const files = readdirSync(directory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.test\.(?:[cm]?js|tsx?)$/.test(entry.name))
  .map((entry) => fileURLToPath(new URL(entry.name, import.meta.url)))
  .sort();

if (files.length === 0) {
  throw new Error(`No test files found in ${directory}`);
}

const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...files], {
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
