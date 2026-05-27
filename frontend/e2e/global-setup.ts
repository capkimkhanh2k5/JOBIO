import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const backendDir = path.join(rootDir, 'backend');
const venvPython = path.join(backendDir, '.venv/bin/python');
const python = process.env.E2E_BACKEND_PYTHON ?? (existsSync(venvPython) ? venvPython : 'python');

export default async function globalSetup() {
  const env = { ...process.env, DEBUG: '1' };
  execFileSync(python, ['manage.py', 'seed_cv_blog_e2e', '--reset'], {
    cwd: backendDir,
    stdio: 'inherit',
    env,
  });
}
