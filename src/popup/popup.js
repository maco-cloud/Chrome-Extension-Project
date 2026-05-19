import {
  ENGINE_BADGES,
  MESSAGE_TYPES,
  SENTIMENT_LABELS,
  SESSION_KEYS,
} from "../utils/constants.js";
import {
  formatSummaryForClipboard,
  formatSummaryForDownload,
} from "../utils/export-format.js";
import { sendMessage } from "../utils/messaging.js";
import { formatRelativeTime } from "../utils/url.js";

const els = {
  summarizeBtn: document.getElementById("summarizeBtn"),
  summarizeSelectionBtn: document.getElementById("summarizeSelectionBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  copyAllBtn: document.getElementById("copyAllBtn"),
  exportBtn: document.getElementById("exportBtn"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  resultActions: document.getElementById("resultActions"),
  historySearchRow: document.getElementById("historySearchRow"),
  historySearch: document.getElementById("historySearch"),
  emptyState: document.getElementById("emptyState"),
  results: document.getElementById("results"),
  skeletonWrap: document.getElementById("skeletonWrap"),
  tldrText: document.getElementById("tldrText"),
  summaryText: document.getElementById("summaryText"),
  bulletsList: document.getElementById("bulletsList"),
  takeawaysList: document.getElementById("takeawaysList"),
  actionsList: document.getElementById("actionsList"),
  metaRow: document.getElementById("metaRow"),
  engineChip: document.getElementById("engineChip"),
  sentimentChip: document.getElementById("sentimentChip"),
  languageChip: document.getElementById("languageChip"),
  readingChip: document.getElementById("readingChip"),
  charsChip: document.getElementById("charsChip"),
  recentSection: document.getElementById("recentSection"),
  recentList: document.getElementById("recentList"),
  historySection: document.getElementById("historySection"),
  historyList: document.getElementById("historyList"),
  toast: document.getElementById("toast"),
};

let currentResult = null;
let historyCache = [];
let toastTimer = null;
let searchDebounce = null;

function applyTheme(darkMode) {
  document.documentElement.setAttribute(
    "data-theme",
    darkMode ? "dark" : "light",
  );
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("visible"), 2400);
}

function setLoading(isLoading, label = "Summarize page") {
  els.summarizeBtn.disabled = isLoading;
  els.summarizeSelectionBtn.disabled = isLoading;
  els.skeletonWrap.classList.toggle("visible", isLoading);
  els.skeletonWrap.setAttribute("aria-hidden", String(!isLoading));

  if (isLoading) {
    els.summarizeBtn.innerHTML =
      '<span class="spinner" aria-hidden="true"></span>Working…';
    els.emptyState.style.display = "none";
    els.results.classList.remove("visible");
    els.resultActions.hidden = true;
  } else {
    els.summarizeBtn.textContent = label;
  }
}

function renderList(target, items) {
  target.innerHTML = "";
  if (!items?.length) {
    const li = document.createElement("li");
    li.textContent = "No items available.";
    target.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function renderResults(data) {
  currentResult = data;
  els.tldrText.textContent = data.tldr || data.summary;
  els.summaryText.textContent = data.summary;
  renderList(els.bulletsList, data.bullets);
  renderList(els.takeawaysList, data.takeaways);
  renderList(els.actionsList, data.actionItems);

  els.engineChip.textContent = ENGINE_BADGES[data.engine] || ENGINE_BADGES.local;
  els.sentimentChip.textContent =
    SENTIMENT_LABELS[data.sentiment] || SENTIMENT_LABELS.neutral;
  els.languageChip.textContent = (data.language || "en").toUpperCase();
  els.readingChip.textContent = `${data.readingTimeMinutes} min`;
  els.charsChip.textContent = `${data.characterCount.toLocaleString()} chars`;

  els.metaRow.hidden = false;
  els.emptyState.style.display = "none";
  els.results.classList.add("visible");
  els.resultActions.hidden = false;
}

function buildCopyText(section) {
  if (!currentResult) {
    return "";
  }

  if (section === "all") {
    return formatSummaryForClipboard(currentResult);
  }
  if (section === "tldr") {
    return currentResult.tldr || currentResult.summary;
  }
  if (section === "summary") {
    return currentResult.summary;
  }
  if (section === "bullets") {
    return (currentResult.bullets || []).map((item) => `• ${item}`).join("\n");
  }
  if (section === "takeaways") {
    return currentResult.takeaways.map((item, i) => `${i + 1}. ${item}`).join("\n");
  }
  if (section === "actions") {
    return currentResult.actionItems
      .map((item, i) => `${i + 1}. ${item}`)
      .join("\n");
  }
  return "";
}

async function copySection(section) {
  const text = buildCopyText(section);
  if (!text) {
    showToast("Nothing to copy yet");
    return;
  }
  await navigator.clipboard.writeText(text);
  showToast(section === "all" ? "Copied full summary" : "Copied to clipboard");
}

function exportSummary() {
  if (!currentResult) {
    showToast("Nothing to export yet");
    return;
  }

  const blob = new Blob([formatSummaryForDownload(currentResult)], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeTitle = (currentResult.title || "summary")
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .slice(0, 40);
  anchor.href = url;
  anchor.download = `quickdigest-${safeTitle || "summary"}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("Exported .txt file");
}

function filterHistory(history, query) {
  if (!query) {
    return history;
  }
  const q = query.toLowerCase();
  return history.filter(
    (item) =>
      item.title?.toLowerCase().includes(q) ||
      item.preview?.toLowerCase().includes(q) ||
      item.url?.toLowerCase().includes(q),
  );
}

function renderHistory(history) {
  historyCache = history || [];
  const query = els.historySearch.value.trim();
  const filtered = filterHistory(historyCache, query);

  if (!historyCache.length) {
    els.historySection.hidden = true;
    els.historySearchRow.hidden = true;
    els.historyList.innerHTML = "";
    return;
  }

  els.historySection.hidden = false;
  els.historySearchRow.hidden = false;
  els.historyList.innerHTML = "";

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "No summaries match your search.";
    els.historyList.appendChild(empty);
    return;
  }

  filtered.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-item";
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute(
      "aria-label",
      `Open summary for ${item.title}${item.pinned ? ", pinned" : ""}`,
    );

    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.title;
    const preview = document.createElement("p");
    preview.textContent = item.preview;
    content.appendChild(title);
    content.appendChild(preview);

    const aside = document.createElement("div");
    aside.className = "history-actions";

    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = `pin-btn${item.pinned ? " active" : ""}`;
    pin.setAttribute("aria-label", item.pinned ? "Unpin summary" : "Pin summary");
    pin.textContent = item.pinned ? "★" : "☆";
    pin.addEventListener("click", async (event) => {
      event.stopPropagation();
      const updated = await sendMessage(MESSAGE_TYPES.TOGGLE_PIN, { id: item.id });
      renderHistory(updated);
    });

    const del = document.createElement("button");
    del.type = "button";
    del.className = "history-delete";
    del.setAttribute("aria-label", "Delete summary");
    del.textContent = "×";
    del.addEventListener("click", async (event) => {
      event.stopPropagation();
      const updated = await sendMessage(MESSAGE_TYPES.DELETE_HISTORY_ITEM, {
        id: item.id,
      });
      renderHistory(updated);
      showToast("Removed from history");
    });

    const meta = document.createElement("span");
    meta.className = "history-meta";
    meta.textContent = formatRelativeTime(item.timestamp);

    aside.appendChild(pin);
    aside.appendChild(meta);
    aside.appendChild(del);

    row.appendChild(content);
    row.appendChild(aside);

    const open = () => {
      renderResults({
        ...item,
        engine: item.engine || "local",
      });
    };
    row.addEventListener("click", open);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });

    els.historyList.appendChild(row);
  });
}

function renderRecentPages(pages) {
  if (!pages?.length) {
    els.recentSection.hidden = true;
    els.recentList.innerHTML = "";
    return;
  }

  els.recentSection.hidden = false;
  els.recentList.innerHTML = "";

  pages.slice(0, 6).forEach((page) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "recent-item";
    row.textContent = page.title || page.url;
    row.title = page.url;
    row.addEventListener("click", () => {
      chrome.tabs.create({ url: page.url });
    });
    els.recentList.appendChild(row);
  });
}

async function loadSessionPayload() {
  const data = await chrome.storage.session.get(SESSION_KEYS.POPUP_PAYLOAD);
  const entry = data[SESSION_KEYS.POPUP_PAYLOAD];
  if (!entry) {
    return;
  }

  await chrome.storage.session.remove(SESSION_KEYS.POPUP_PAYLOAD);

  if (entry.error) {
    showToast(entry.error);
    return;
  }
  if (entry.payload) {
    renderResults(entry.payload);
    showToast("Summary ready");
  }
}

async function loadInitialState() {
  const settings = await sendMessage(MESSAGE_TYPES.GET_SETTINGS);
  applyTheme(settings.darkMode);

  const [history, recent] = await Promise.all([
    sendMessage(MESSAGE_TYPES.GET_HISTORY),
    sendMessage(MESSAGE_TYPES.GET_RECENT_PAGES),
  ]);

  renderHistory(history);
  renderRecentPages(recent);
  await loadSessionPayload();
}

async function runSummarize(type) {
  try {
    setLoading(true);
    const data = await sendMessage(type);
    renderResults(data);
    const history = await sendMessage(MESSAGE_TYPES.GET_HISTORY);
    renderHistory(history);
    const recent = await sendMessage(MESSAGE_TYPES.GET_RECENT_PAGES);
    renderRecentPages(recent);
    showToast("Summary ready");
  } catch (error) {
    els.emptyState.style.display = "block";
    els.results.classList.remove("visible");
    els.resultActions.hidden = true;
    showToast(error.message || "Summarization failed");
  } finally {
    setLoading(false);
  }
}

els.summarizeBtn.addEventListener("click", () =>
  runSummarize(MESSAGE_TYPES.SUMMARIZE),
);
els.summarizeSelectionBtn.addEventListener("click", () =>
  runSummarize(MESSAGE_TYPES.SUMMARIZE_SELECTION),
);
els.settingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
els.copyAllBtn.addEventListener("click", () =>
  copySection("all").catch(() => showToast("Clipboard permission denied")),
);
els.exportBtn.addEventListener("click", exportSummary);
els.clearHistoryBtn.addEventListener("click", async () => {
  const confirmed = confirm("Clear all saved summaries?");
  if (!confirmed) {
    return;
  }
  const history = await sendMessage(MESSAGE_TYPES.CLEAR_HISTORY);
  renderHistory(history);
  showToast("History cleared");
});

document.querySelectorAll(".copy-btn").forEach((button) => {
  button.addEventListener("click", () => {
    copySection(button.dataset.copy).catch(() =>
      showToast("Clipboard permission denied"),
    );
  });
});

els.historySearch.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => renderHistory(historyCache), 180);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") {
    return;
  }
  if (changes.darkMode) {
    applyTheme(changes.darkMode.newValue);
  }
  if (changes.summaryHistory) {
    renderHistory(changes.summaryHistory.newValue || []);
  }
  if (changes.recentPages) {
    renderRecentPages(changes.recentPages.newValue || []);
  }
});

loadInitialState().catch((error) => {
  showToast(error.message || "Failed to load extension");
});
