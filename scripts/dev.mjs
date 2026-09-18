import { spawn } from 'node:child_process';

const children = [];
const run = (cmd, args) => {
  const child = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', env: process.env });
  children.push(child);
  child.on('exit', (code) => {
    if (code && code !== 0) {
      for (const other of children) if (other !== child && !other.killed) other.kill('SIGTERM');
      process.exitCode = code;
    }
  });
  return child;
};

run('npm', ['run', 'dev:api']);
run('npm', ['run', 'dev:web']);

const shutdown = () => {
  for (const child of children) if (!child.killed) child.kill('SIGTERM');
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
