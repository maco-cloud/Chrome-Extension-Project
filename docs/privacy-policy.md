# QuickDigest AI Privacy Policy

**Last updated:** May 18, 2026

QuickDigest AI ("the Extension") summarizes webpages on your device. This policy explains what data is handled and how.

## Summary

- **No account required**
- **No paid API keys**
- **No cloud backend operated by us**
- Summaries are generated locally and/or with Chrome on-device AI when available

## Data we process

When you click **Summarize this page**, the Extension:

1. Reads the active tab URL and page title
2. Extracts readable article text from the page
3. Generates a summary on your device using:
   - **Local engine** (always available): algorithmic extractive summarization
   - **Chrome on-device AI** (optional, when supported by your browser/device)

Article text is not sent to QuickDigest servers because we do not operate any.

## Third-party processing

- **Local engine:** processing stays entirely on your device.
- **Chrome on-device AI:** when enabled and available, Chrome may process text using on-device models according to Google's policies. See [Google Chrome Privacy Notice](https://policies.google.com/privacy).

We do **not** send your content to OpenAI or other paid third-party APIs.

## Data stored on your device

Using `chrome.storage.local`, the Extension may store:

- Dark mode preference
- Summary engine preference (auto / local / Chrome AI)
- Recent summary history (title, URL, preview, summary content, timestamp)

You can clear history anytime in Settings.

## Data we do not collect

The Extension does not:

- Require sign-in
- Sell your data
- Run advertising trackers
- Collect passwords, payment details, or form field contents
- Upload page content to our servers

## Permissions

| Permission | Why it is needed |
|------------|------------------|
| `storage` | Save settings and summary history locally |
| `activeTab` | Access the current tab only when you invoke the Extension |
| `scripting` | Extract readable page content on demand |
| `offscreen` | Run Chrome on-device AI summarizer when available |

## Security

- Processing is designed to stay on-device
- Clear history removes saved summaries from local storage
- Use current Chrome releases for best on-device AI support

## Children's privacy

The Extension is not directed to children under 13.

## Changes

We may update this policy as the Extension evolves. Updates will be reflected in the repository and Chrome Web Store listing.

## Contact

For privacy questions, open an issue in the project repository:
https://github.com/maco-cloud/Chrome-Extension-Project
