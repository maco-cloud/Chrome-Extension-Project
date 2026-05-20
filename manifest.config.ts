import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'AI Reply Anywhere',
  version: pkg.version,
  description:
    'AI reply & rewrite for Gmail, LinkedIn, Slack, X, Reddit, dating apps, and any textarea. No API keys required.',
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'AI Reply Anywhere',
    default_icon: {
      '16': 'public/icons/icon16.png',
      '48': 'public/icons/icon48.png',
      '128': 'public/icons/icon128.png',
    },
  },
  icons: {
    '16': 'public/icons/icon16.png',
    '48': 'public/icons/icon48.png',
    '128': 'public/icons/icon128.png',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  permissions: ['storage', 'activeTab'],
  host_permissions: ['https://*/*', 'http://*/*'],
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/main.tsx'],
      run_at: 'document_idle',
      exclude_matches: [
        '*://chrome.google.com/*',
        '*://chromewebstore.google.com/*',
        '*://chrome-extension/*',
      ],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['assets/*'],
      matches: ['<all_urls>'],
    },
  ],
});
