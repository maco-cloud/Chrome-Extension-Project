export function buildPurchaseEmailHtml({ licenseKey, productName, supportEmail }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#1a1d27;border-radius:12px;border:1px solid #2a2f3d;overflow:hidden;">
        <tr><td style="padding:28px 28px 16px;text-align:center;background:linear-gradient(135deg,#0071e3,#5ac8fa);">
          <div style="width:48px;height:48px;margin:0 auto 12px;border-radius:12px;background:#fff;color:#0071e3;font-weight:700;font-size:22px;line-height:48px;">Q</div>
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Thank you for your purchase!</h1>
        </td></tr>
        <tr><td style="padding:28px;color:#e8eaed;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Your <strong>${escapeHtml(productName)}</strong> license is ready. This is a <strong>one-time lifetime purchase</strong> — no subscription.</p>
          <p style="margin:0 0 8px;font-size:13px;color:#9aa0a6;text-transform:uppercase;letter-spacing:0.05em;">Your license key</p>
          <div style="margin:0 0 20px;padding:16px;background:#0f1117;border:1px solid #0071e3;border-radius:8px;text-align:center;">
            <code style="font-size:18px;font-weight:700;color:#5ac8fa;letter-spacing:0.05em;">${escapeHtml(licenseKey)}</code>
          </div>
          <h2 style="margin:0 0 12px;font-size:16px;color:#fff;">How to activate</h2>
          <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7;color:#c4c7c5;">
            <li>Install or open <strong>QuickDigest AI</strong> in Chrome</li>
            <li>Click <strong>Unlock Lifetime Pro</strong></li>
            <li>Choose <strong>Enter your license key</strong></li>
            <li>Paste the key above and tap <strong>Activate Lifetime Pro</strong></li>
          </ol>
          <p style="margin:0;font-size:13px;color:#9aa0a6;line-height:1.6;">Need help? Reply to this email or contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#5ac8fa;">${escapeHtml(supportEmail)}</a></p>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #2a2f3d;text-align:center;">
          <p style="margin:0;font-size:11px;color:#6b7280;">QuickDigest AI · Private summaries on your device</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildPurchaseEmailText({ licenseKey, productName, supportEmail }) {
  return `Thank you for purchasing ${productName}!

Your lifetime license key (one-time purchase, no subscription):

${licenseKey}

HOW TO ACTIVATE:
1. Open QuickDigest AI in Chrome
2. Click Unlock Lifetime Pro
3. Enter your license key
4. Tap Activate Lifetime Pro

Support: ${supportEmail}

— QuickDigest AI`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
