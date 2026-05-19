import { ENGINE_BADGES, MESSAGE_TYPES } from "../utils/constants.js";
import { sendMessage } from "../utils/messaging.js";
import { formatRelativeTime } from "../utils/url.js";

const els = {
  app: document.getElementById("app"),
  summarizeBtn: document.getElementById("summarizeBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  emptyState: document.getElementById("emptyState"),
  results: document.getElementById("results"),
  skeletonWrap: document.getElementById("skeletonWrap"),
  summaryText: document.getElementById("summaryText"),
  takeawaysList: document.getElementById("takeawaysList"),
  actionsList: document.getElementById("actionsList"),
  metaRow: document.getElementById("metaRow"),
  engineChip: document.getElementById("engineChip"),
  readingChip: document.getElementById("readingChip"),
  charsChip: document.getElementById("charsChip"),
  historySection: document.getElementById("historySection"),
  historyList: document.getElementById("historyList"),
  toast: document.getElementById("toast"),
};

let currentResult = null;
let toastTimer = null;

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
  toastTimer = setTimeout(() => {
    els.toast.classList.remove("visible");
  }, 2200);
}

function setLoading(isLoading) {
  els.summarizeBtn.disabled = isLoading;
  els.skeletonWrap.classList.toggle("visible", isLoading);
  els.skeletonWrap.setAttribute("aria-hidden", String(!isLoading));

  if (isLoading) {
    els.summarizeBtn.innerHTML =
      '<span class="spinner" aria-hidden="true"></span>Summarizing…';
    els.emptyState.style.display = "none";
    els.results.classList.remove("visible");
  } else {
    els.summarizeBtn.textContent = "Summarize this page";
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
  els.summaryText.textContent = data.summary;
  renderList(els.takeawaysList, data.takeaways);
  renderList(els.actionsList, data.actionItems);

  els.engineChip.textContent =
    ENGINE_BADGES[data.engine] || ENGINE_BADGES.local;
  els.readingChip.textContent = `${data.readingTimeMinutes} min read`;
  els.charsChip.textContent = `${data.characterCount.toLocaleString()} chars`;
  els.metaRow.hidden = false;

  els.emptyState.style.display = "none";
  els.results.classList.add("visible");
}

function buildCopyText(section) {
  if (!currentResult) {
    return "";
  }
  if (section === "summary") {
    return currentResult.summary;
  }
  if (section === "takeaways") {
    return currentResult.takeaways.map((item, i) => `${i + 1}. ${item}`).join("\n");
  }
  if (section === "actions") {
    return currentResult.actionItems
      .map((item, i) => `${i + 1}. ${item}`)
      .join("\n");
  }
  return [
    `Summary: ${currentResult.summary}`,
    "",
    "Key Takeaways:",
    ...currentResult.takeaways.map((item) => `- ${item}`),
    "",
    "Action Items:",
    ...currentResult.actionItems.map((item) => `- ${item}`),
  ].join("\n");
}

async function copySection(section) {
  const text = buildCopyText(section);
  if (!text) {
    showToast("Nothing to copy yet");
    return;
  }
  await navigator.clipboard.writeText(text);
  showToast("Copied to clipboard");
}

function renderHistory(history) {
  if (!history?.length) {
    els.historySection.hidden = true;
    els.historyList.innerHTML = "";
    return;
  }

  els.historySection.hidden = false;
  els.historyList.innerHTML = "";

  history.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-item";
    row.dataset.id = item.id;

    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.title;
    const preview = document.createElement("p");
    preview.textContent = item.preview;
    content.appendChild(title);
    content.appendChild(preview);

    const aside = document.createElement("div");
    const meta = document.createElement("span");
    meta.className = "history-meta";
    meta.textContent = formatRelativeTime(item.timestamp);

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

    aside.appendChild(meta);
    aside.appendChild(del);

    row.appendChild(content);
    row.appendChild(aside);

    row.addEventListener("click", () => {
      renderResults({
        summary: item.summary,
        takeaways: item.takeaways,
        actionItems: item.actionItems,
        readingTimeMinutes: item.readingTimeMinutes,
        characterCount: item.characterCount,
        engine: item.engine || "local",
      });
    });

    els.historyList.appendChild(row);
  });
}

async function loadInitialState() {
  const settings = await sendMessage(MESSAGE_TYPES.GET_SETTINGS);
  applyTheme(settings.darkMode);

  const history = await sendMessage(MESSAGE_TYPES.GET_HISTORY);
  renderHistory(history);
}

async function handleSummarize() {
  try {
    setLoading(true);
    const data = await sendMessage(MESSAGE_TYPES.SUMMARIZE);
    renderResults(data);
    const history = await sendMessage(MESSAGE_TYPES.GET_HISTORY);
    renderHistory(history);
    showToast("Summary ready");
  } catch (error) {
    els.emptyState.style.display = "block";
    els.results.classList.remove("visible");
    showToast(error.message || "Summarization failed");
  } finally {
    setLoading(false);
  }
}

els.summarizeBtn.addEventListener("click", handleSummarize);

els.settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.querySelectorAll(".copy-btn").forEach((button) => {
  button.addEventListener("click", () => {
    copySection(button.dataset.copy).catch(() => {
      showToast("Clipboard permission denied");
    });
  });
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
});

loadInitialState().catch((error) => {
  showToast(error.message || "Failed to load extension");
});
