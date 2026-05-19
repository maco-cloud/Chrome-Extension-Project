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
    "[role='navigation']",
    "[role='banner']",
    "[role='contentinfo']",
    "[role='complementary']",
    ".nav",
    ".navbar",
    ".menu",
    ".sidebar",
    ".ad",
    ".ads",
    ".advert",
    ".advertisement",
    ".cookie",
    ".cookies",
    ".newsletter",
    ".popup",
    ".modal",
    ".social-share",
    ".comments",
    "#comments",
  ];

  const NOISE_PATTERNS = [
    /accept (all )?cookies/i,
    /subscribe to our newsletter/i,
    /sign up for/i,
    /advertisement/i,
    /sponsored content/i,
    /skip to (main )?content/i,
  ];

  function cloneDocumentRoot() {
    const clone = document.body.cloneNode(true);
    REMOVE_SELECTORS.forEach((selector) => {
      clone.querySelectorAll(selector).forEach((node) => node.remove());
    });
    return clone;
  }

  function pickRoot(clone) {
    const candidates = [
      clone.querySelector("article"),
      clone.querySelector("main"),
      clone.querySelector("[role='main']"),
      clone.querySelector(".post-content"),
      clone.querySelector(".article-body"),
      clone.querySelector(".entry-content"),
      clone.querySelector("#content"),
      clone,
    ].filter(Boolean);

    let best = candidates[0];
    let bestScore = 0;

    candidates.forEach((node) => {
      const paragraphs = node.querySelectorAll("p");
      let score = 0;
      paragraphs.forEach((p) => {
        const len = (p.textContent || "").trim().length;
        if (len > 40) {
          score += len;
        }
      });
      if (score > bestScore) {
        bestScore = score;
        best = node;
      }
    });

    return best;
  }

  function collectParagraphs(root) {
    const blocks = [];
    const elements = root.querySelectorAll("p, h1, h2, h3, h4, li, blockquote");

    elements.forEach((el) => {
      const text = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (text.length < 40) {
        return;
      }
      if (NOISE_PATTERNS.some((pattern) => pattern.test(text))) {
        return;
      }
      if (!blocks.includes(text)) {
        blocks.push(text);
      }
    });

    if (blocks.length < 3) {
      const fallback = (root.innerText || "")
        .split(/\n+/)
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter((line) => line.length > 50)
        .filter((line) => !NOISE_PATTERNS.some((pattern) => pattern.test(line)));
      return [...new Set([...blocks, ...fallback])];
    }

    return blocks;
  }

  function countWords(text) {
    return text.split(/\s+/).filter(Boolean).length;
  }

  const clone = cloneDocumentRoot();
  const root = pickRoot(clone);
  const paragraphs = collectParagraphs(root);
  const text = paragraphs.join("\n\n").trim();
  const wordCount = countWords(text);
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 225));

  return {
    title: document.title || "Untitled page",
    url: location.href,
    text,
    wordCount,
    characterCount: text.length,
    readingTimeMinutes,
  };
})();
