# QuickDigest AI Privacy Policy

**Last updated:** May 18, 2026

QuickDigest AI ("the Extension") helps you summarize webpages using OpenAI. This policy explains what data the Extension handles and how.

## Data we process

When you click **Summarize this page**, the Extension:

1. Reads the active tab URL and page title
2. Extracts readable article text from the page
3. Sends that text to OpenAI to generate a summary

The Extension does **not** operate its own backend servers.

## Data stored on your device

The Extension stores the following locally using `chrome.storage.local`:

- Your OpenAI API key (if you provide one)
- Dark mode preference
- Recent summary history (title, URL, preview, summary content, timestamp)

You can clear history or remove your API key at any time in Settings.

## Third-party services

Summaries are generated using the **OpenAI API**. Content you submit is processed according to [OpenAI's Privacy Policy](https://openai.com/policies/privacy-policy) and [Terms of Use](https://openai.com/policies/terms-of-use).

## Data we do not collect

The Extension does not:

- Sell your data
- Run analytics trackers
- Collect passwords, payment details, or form inputs
- Access browsing history beyond the active tab you summarize

## Permissions

| Permission | Why it is needed |
|------------|------------------|
| `storage` | Save API key, settings, and summary history locally |
| `activeTab` | Access the current tab only when you invoke the Extension |
| `scripting` | Extract readable page content on demand |
| `https://api.openai.com/*` | Send summarization requests to OpenAI |

## Security

- API keys are stored locally on your device
- Use a restricted OpenAI API key when possible
- Do not share your API key

## Children's privacy

The Extension is not directed to children under 13.

## Changes

We may update this policy as the Extension evolves. Material changes will be reflected in the repository and Chrome Web Store listing.

## Contact

For privacy questions, open an issue in the project repository:
https://github.com/maco-cloud/Chrome-Extension-Project
