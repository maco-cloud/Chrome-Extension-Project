# Privacy Policy — HTML for Google Sites

**Chrome Web Store URL (GitHub Pages — recommended):**  
`https://maco-cloud.github.io/Chrome-Extension-Project/privacy-policy.html`

**Legacy (Google Sites):**  
`https://sites.google.com/view/maco-apps/privacy-policy`

## How to paste

1. Open your **Privacy Policy** page in the Google Sites editor.
2. **Insert** → **Embed** → **Embed code**.
3. Copy **all** of the HTML below (from `<div class="qd-privacy">` through the closing `</div>`).
4. Paste into the embed box → **Next** → **Insert**.
5. **Publish** the site (Anyone on the web).

> Google Sites may strip `<style>` on some themes. If formatting looks plain, the text is still valid for the Chrome Web Store. You can also paste section by section using **Text box** instead of embed.

---

## Copy from here ↓

```html
<div class="qd-privacy">
  <style>
    .qd-privacy {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
        sans-serif;
      line-height: 1.65;
      color: #1d1d1f;
      max-width: 42rem;
      margin: 0 auto;
      padding: 1rem 0.5rem 2rem;
    }
    .qd-privacy h1 {
      font-size: 1.75rem;
      margin: 0 0 0.5rem;
      line-height: 1.2;
    }
    .qd-privacy .meta {
      color: #6e6e73;
      font-size: 0.95rem;
      margin: 0 0 1.5rem;
    }
    .qd-privacy h2 {
      font-size: 1.15rem;
      margin: 1.75rem 0 0.65rem;
      color: #1d1d1f;
    }
    .qd-privacy p,
    .qd-privacy li {
      color: #6e6e73;
      font-size: 0.95rem;
    }
    .qd-privacy ul,
    .qd-privacy ol {
      padding-left: 1.25rem;
      margin: 0.5rem 0 1rem;
    }
    .qd-privacy li {
      margin-bottom: 0.35rem;
    }
    .qd-privacy a {
      color: #0071e3;
    }
    .qd-privacy table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      margin: 0.75rem 0 1rem;
    }
    .qd-privacy th,
    .qd-privacy td {
      border: 1px solid rgba(0, 0, 0, 0.12);
      padding: 0.5rem 0.65rem;
      text-align: left;
      vertical-align: top;
    }
    .qd-privacy th {
      color: #1d1d1f;
      background: #f5f5f7;
    }
    .qd-privacy footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      font-size: 0.85rem;
      color: #6e6e73;
    }
  </style>

  <h1>QuickDigest AI Privacy Policy</h1>
  <p class="meta">
    <strong>Last updated:</strong> May 18, 2026 (v2.1.0)<br />
    <strong>Publisher:</strong> Maco Apps / Maco Crafts<br />
    <strong>Extension:</strong> QuickDigest AI (Chrome)
  </p>

  <p>
    QuickDigest AI (&quot;the Extension&quot;) summarizes webpages on your device. This policy
    explains what data is handled and how.
  </p>

  <h2>Summary</h2>
  <ul>
    <li><strong>No account required</strong></li>
    <li><strong>No paid API keys</strong></li>
    <li><strong>No cloud backend operated by us</strong></li>
    <li>Summaries are generated locally and/or with Chrome on-device AI when available</li>
  </ul>

  <h2>Data we process</h2>
  <p>When you click <strong>Summarize this page</strong> (or summarize a selection or video), the Extension:</p>
  <ol>
    <li>Reads the active tab URL and page title</li>
    <li>Extracts readable article text or YouTube captions on the page</li>
    <li>
      Generates a summary on your device using:
      <ul>
        <li><strong>Local engine</strong> (always available): on-device extractive summarization</li>
        <li>
          <strong>Chrome on-device AI</strong> (optional, when supported by your browser/device)
        </li>
      </ul>
    </li>
  </ol>
  <p>Article and transcript text is <strong>not</strong> sent to Maco Apps servers because we do not operate any.</p>

  <h2>Third-party processing</h2>
  <ul>
    <li><strong>Local engine:</strong> processing stays entirely on your device.</li>
    <li>
      <strong>Chrome on-device AI:</strong> when enabled and available, Google Chrome may process
      text using on-device models under
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.
    </li>
  </ul>
  <p>We do <strong>not</strong> send your content to OpenAI or other paid third-party summarization APIs.</p>

  <h2>Data stored on your device</h2>
  <p>Using <code>chrome.storage.local</code>, the Extension may store:</p>
  <ul>
    <li>Dark mode and engine preferences (auto / local / Chrome AI)</li>
    <li>Recent summary history (title, URL, preview, summary content, timestamp)</li>
  </ul>
  <p>You can clear history anytime in the extension Settings.</p>

  <h2>Data we do not collect</h2>
  <p>The Extension does <strong>not</strong>:</p>
  <ul>
    <li>Require sign-in</li>
    <li>Sell your data</li>
    <li>Run advertising or analytics trackers</li>
    <li>Collect passwords, payment details, or form field contents</li>
    <li>Upload page content to our servers</li>
  </ul>

  <h2>Permissions</h2>
  <table>
    <thead>
      <tr>
        <th>Permission</th>
        <th>Why it is needed</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>storage</code></td>
        <td>Save settings and summary history locally</td>
      </tr>
      <tr>
        <td><code>activeTab</code></td>
        <td>Access the current tab only when you invoke the Extension</td>
      </tr>
      <tr>
        <td><code>scripting</code></td>
        <td>Extract readable page content on demand</td>
      </tr>
      <tr>
        <td><code>offscreen</code></td>
        <td>Run Chrome on-device AI summarizer when available</td>
      </tr>
      <tr>
        <td><code>contextMenus</code></td>
        <td>Right-click actions to summarize page or selection</td>
      </tr>
    </tbody>
  </table>

  <h2>Security</h2>
  <ul>
    <li>Processing is designed to stay on-device</li>
    <li>Clearing history removes saved summaries from local storage</li>
    <li>Use an up-to-date version of Google Chrome for best on-device AI support</li>
  </ul>

  <h2>Children&apos;s privacy</h2>
  <p>The Extension is not directed to children under 13.</p>

  <h2>Changes</h2>
  <p>
    We may update this policy as the Extension evolves. Updates will be posted on this page and
    reflected in the Chrome Web Store listing.
  </p>

  <h2>Contact</h2>
  <p>
    For privacy questions or support:<br />
    <strong>GitHub Issues:</strong>
    <a
      href="https://github.com/maco-cloud/Chrome-Extension-Project/issues"
      target="_blank"
      rel="noopener noreferrer"
      >github.com/maco-cloud/Chrome-Extension-Project/issues</a
    ><br />
    <strong>Website:</strong>
    <a
      href="https://sites.google.com/view/maco-apps"
      target="_blank"
      rel="noopener noreferrer"
      >sites.google.com/view/maco-apps</a
    >
  </p>

  <footer>
    <p>&copy; 2026 Maco Apps. All rights reserved.</p>
  </footer>
</div>
```

## Copy to here ↑
