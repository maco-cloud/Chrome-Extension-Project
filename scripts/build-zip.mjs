import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const out = join(dist, 'ai-reply-anywhere-store.zip');

if (!existsSync(dist)) {
  console.error('Run npm run build first.');
  process.exit(1);
}

mkdirSync(join(dist, 'zip-staging'), { recursive: true });
const staging = join(dist, 'zip-staging');
rmSync(staging, { recursive: true, force: true });
mkdirSync(staging);

cpSync(dist, staging, {
  recursive: true,
  filter: (src) => !src.includes('zip-staging') && !src.endsWith('.zip'),
});

try {
  if (process.platform === 'win32') {
    execSync(
      `powershell Compress-Archive -Path "${join(staging, '*')}" -DestinationPath "${out}" -Force`,
      { stdio: 'inherit' },
    );
  } else {
    execSync(`cd "${staging}" && zip -r "../ai-reply-anywhere-store.zip" .`, { stdio: 'inherit' });
  }
  console.log('Created', out);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
