#!/usr/bin/env node
/**
 * Generate a production QuickDigest AI lifetime license key.
 * Usage: node scripts/generate-license-key.js [count]
 *
 * Format: QD-AB12-CD34-EF56-GH78
 * (excludes ambiguous characters 0, O, I, 1)
 */

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomBlock() {
  let block = "";
  for (let i = 0; i < 4; i += 1) {
    const index = Math.floor(Math.random() * CHARSET.length);
    block += CHARSET[index];
  }
  return block;
}

function generateKey() {
  return `QD-${randomBlock()}-${randomBlock()}-${randomBlock()}-${randomBlock()}`;
}

const count = Math.min(Math.max(parseInt(process.argv[2] || "1", 10) || 1, 1), 50);

console.log(`QuickDigest AI — license keys (${count})\n`);
for (let i = 0; i < count; i += 1) {
  console.log(generateKey());
}
console.log("\nStore each key with the customer email. Do not publish keys publicly.");
console.log(
  "Production: keys are created automatically by the Cloudflare Worker on Stripe payment.",
);
console.log("See worker/DEPLOYMENT.md");
