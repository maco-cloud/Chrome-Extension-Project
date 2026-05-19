(function extractPageContent() {
  const REMOVE_SELECTORS = [
    "script",
    "style",
    "noscript",
    "iframe",
    "svg",
    "canvas",
    "nav",
    "footer",
    "header",
    "aside",
    "form",
    "[role='navigation']",
    "[role='banner']",
    "[role='contentinfo']",
    "[role='complementary']",
    "[aria-hidden='true']",
    ".nav",
    ".navbar",
    ".menu",
    ".sidebar",
    ".ad",
    ".ads",
    ".advert",
    ".advertisement",
    ".sponsored",
    ".promo",
    ".cookie",
    ".cookies",
    ".cookie-banner",
    ".newsletter",
    ".subscribe",
    ".popup",
    ".modal",
    ".social-share",
    ".share-buttons",
    ".comments",
    ".comment",
    "#comments",
    "#sidebar",
    "#footer",
    ".related-posts",
    ".recommended",
  ];

  const NOISE_PATTERNS = [
    /accept (all )?cookies/i,
    /subscribe to our newsletter/i,
    /sign up for/i,
    /advertisement/i,
    /sponsored content/i,
    /skip to (main )?content/i,
    /all rights reserved/i,
    /privacy policy/i,
    /terms of (use|service)/i,
  ];

  function normalize(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function isNoisy(text) {
    return NOISE_PATTERNS.some((pattern) => pattern.test(text));
  }

  function linkDensity(node) {
    const textLength = normalize(node.textContent).length || 1;
    const linkLength = [...node.querySelectorAll("a")].reduce(
      (sum, link) => sum + normalize(link.textContent).length,
      0,
    );
    return linkLength / textLength;
  }

  function cloneDocumentRoot() {
    const clone = document.body.cloneNode(true);
    REMOVE_SELECTORS.forEach((selector) => {
      clone.querySelectorAll(selector).forEach((node) => node.remove());
    });
    return clone;
  }

  function scoreNode(node) {
    const paragraphs = node.querySelectorAll("p, li, blockquote");
    let score = 0;
    paragraphs.forEach((p) => {
      const len = normalize(p.textContent).length;
      if (len > 45 && !isNoisy(p.textContent)) {
        score += len;
      }
    });
    if (linkDensity(node) > 0.55) {
      score *= 0.55;
    }
    return score;
  }

  function pickRoot(clone) {
    const candidates = [
      clone.querySelector("article"),
      clone.querySelector("main"),
      clone.querySelector("[role='main']"),
      clone.querySelector(".post-content"),
      clone.querySelector(".article-body"),
      clone.querySelector(".entry-content"),
      clone.querySelector(".story-body"),
      clone.querySelector("#content"),
      clone,
    ].filter(Boolean);

    let best = candidates[0];
    let bestScore = 0;

    candidates.forEach((node) => {
      const score = scoreNode(node);
      if (score > bestScore) {
        bestScore = score;
        best = node;
      }
    });

    return best;
  }

  function dedupeBlocks(blocks) {
    const unique = [];
    blocks.forEach((block) => {
      const lower = block.toLowerCase();
      const exists = unique.some((item) => {
        if (item.toLowerCase() === lower) {
          return true;
        }
        const shorter = item.length < block.length ? item : block;
        const longer = item.length < block.length ? block : item;
        return longer.includes(shorter) && shorter.length / longer.length > 0.75;
      });
      if (!exists) {
        unique.push(block);
      }
    });
    return unique;
  }

  function collectBlocks(root) {
    const blocks = [];
    const elements = root.querySelectorAll(
      "p, h1, h2, h3, h4, li, blockquote, pre",
    );

    elements.forEach((el) => {
      const text = normalize(el.textContent);
      if (text.length < 40 || isNoisy(text)) {
        return;
      }
      blocks.push(text);
    });

    if (blocks.length < 3) {
      const fallback = normalize(root.innerText)
        .split(/\n+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 55 && !isNoisy(line));
      return dedupeBlocks([...blocks, ...fallback]);
    }

    return dedupeBlocks(blocks);
  }

  function countWords(text) {
    return text.split(/\s+/).filter(Boolean).length;
  }

  const clone = cloneDocumentRoot();
  const root = pickRoot(clone);
  const paragraphs = collectBlocks(root);
  const text = paragraphs.join("\n\n").trim();
  const wordCount = countWords(text);
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 225));
  const language =
    (document.documentElement.lang || "").trim() ||
    (document.querySelector("html")?.getAttribute("lang") || "").trim();

  return {
    title: document.title || "Untitled page",
    url: location.href,
    text,
    wordCount,
    characterCount: text.length,
    readingTimeMinutes,
    language,
  };
})();
