import {
  BILLING,
  getCheckoutLifetimeUrl,
  LICENSE_ACTIVATION_STEPS,
  LICENSE_MODAL_COPY,
  PLAN_COMPARISON,
  PRICING,
  PURCHASE_PROMISE,
  PURCHASE_STEPS,
  TRUST_POINTS,
} from "../config/billing.js";
import {
  CONTENT_SOURCE_TYPES,
  EXTENSION_VERSION,
  FREE_DAILY_SUMMARY_LIMIT,
  FREE_HISTORY_LIMIT,
  MESSAGE_TYPES,
  SENTIMENT_LABELS,
  SESSION_KEYS,
  STORAGE_KEYS,
} from "../utils/constants.js";
import {
  engineLabel,
  LICENSE_MESSAGES,
  SUMMARIZE_STATUS,
  toUserMessage,
} from "../utils/user-messages.js";
import { getFromStorage, setInStorage } from "../utils/storage.js";
import { canUseFeature } from "../utils/entitlements.js";
import {
  formatSummaryForClipboard,
  formatSummaryForDownload,
  formatSummaryMarkdown,
} from "../utils/export-format.js";
import { sendMessage } from "../utils/messaging.js";
import {
  getSummaryModeById,
  isModeAvailable,
  SUMMARY_MODE_CATALOG,
} from "../utils/summary-modes.js";
import { formatRelativeTime } from "../utils/url.js";

const els = {
  app: document.getElementById("app"),
  summarizeBtn: document.getElementById("summarizeBtn"),
  summarizeSelectionBtn: document.getElementById("summarizeSelectionBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  youtubeBadge: document.getElementById("youtubeBadge"),
  brandSubtitle: document.getElementById("brandSubtitle"),
  statusBanner: document.getElementById("statusBanner"),
  statusText: document.getElementById("statusText"),
  sourceChip: document.getElementById("sourceChip"),
  emptyIcon: document.getElementById("emptyIcon"),
  emptyTitle: document.getElementById("emptyTitle"),
  emptyDescription: document.getElementById("emptyDescription"),
  keyMomentsCard: document.getElementById("keyMomentsCard"),
  keyMomentsList: document.getElementById("keyMomentsList"),
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
  planBar: document.getElementById("planBar"),
  planLabel: document.getElementById("planLabel"),
  planUsage: document.getElementById("planUsage"),
  planMeterFill: document.getElementById("planMeterFill"),
  modeGrid: document.getElementById("modeGrid"),
  modeHint: document.getElementById("modeHint"),
  upgradeBtn: document.getElementById("upgradeBtn"),
  upgradeModal: document.getElementById("upgradeModal"),
  closeUpgradeModal: document.getElementById("closeUpgradeModal"),
  checkoutLifetime: document.getElementById("checkoutLifetime"),
  openLicenseFromUpgrade: document.getElementById("openLicenseFromUpgrade"),
  licenseModal: document.getElementById("licenseModal"),
  closeLicenseModal: document.getElementById("closeLicenseModal"),
  licenseKeyInput: document.getElementById("licenseKeyInput"),
  licenseError: document.getElementById("licenseError"),
  activateLicenseBtn: document.getElementById("activateLicenseBtn"),
  historyLockedMsg: document.getElementById("historyLockedMsg"),
  shareBtn: document.getElementById("shareBtn"),
  exportMdBtn: document.getElementById("exportMdBtn"),
  historyLocked: document.getElementById("historyLocked"),
  main: document.getElementById("main"),
  regenerateBtn: document.getElementById("regenerateBtn"),
  copyMarkdownBtn: document.getElementById("copyMarkdownBtn"),
  onboardingBackdrop: document.getElementById("onboardingBackdrop"),
  onboardingStartBtn: document.getElementById("onboardingStartBtn"),
  onboardingDismissBtn: document.getElementById("onboardingDismissBtn"),
  footerVersion: document.getElementById("footerVersion"),
  planCompareBody: document.getElementById("planCompareBody"),
  purchaseStepsList: document.getElementById("purchaseStepsList"),
  pricingPrice: document.getElementById("pricingPrice"),
  pricingBadge: document.getElementById("pricingBadge"),
  pricingSub: document.getElementById("pricingSub"),
  licenseWhereHint: document.getElementById("licenseWhereHint"),
  licenseSuccess: document.getElementById("licenseSuccess"),
  proSuccessBackdrop: document.getElementById("proSuccessBackdrop"),
  proSuccessTitle: document.getElementById("proSuccessTitle"),
  proSuccessSubtitle: document.getElementById("proSuccessSubtitle"),
  proSuccessDismiss: document.getElementById("proSuccessDismiss"),
  onboardingUpgradeBtn: document.getElementById("onboardingUpgradeBtn"),
  onboardingProPrice: document.getElementById("onboardingProPrice"),
  purchasePromiseHeadline: document.getElementById("purchasePromiseHeadline"),
  purchasePromiseDetail: document.getElementById("purchasePromiseDetail"),
  trustPointsList: document.getElementById("trustPointsList"),
  checkoutNote: document.getElementById("checkoutNote"),
  licenseLead: document.getElementById("licenseLead"),
  licensePostCheckout: document.getElementById("licensePostCheckout"),
  licenseWhereTitle: document.getElementById("licenseWhereTitle"),
  activationStepsList: document.getElementById("activationStepsList"),
};

let checkoutInFlight = false;

let currentResult = null;
let historyCache = [];
let toastTimer = null;
let searchDebounce = null;
let pageContext = { isYouTube: false };
let summarizeInFlight = false;
let entitlements = { isPro: false, usedToday: 0, remaining: FREE_DAILY_SUMMARY_LIMIT };
let selectedModeId = "quick";
let lastSummarizeType = MESSAGE_TYPES.SUMMARIZE;

const YOUTUBE_EMPTY = {
  icon: "▶",
  title: "YouTube video detected",
  description:
    "Summarize this video from its transcript—TL;DR, key moments with timestamps, bullets, and action items. All on your device.",
  buttonLabel: "Summarize video",
};

const DEFAULT_EMPTY = {
  icon: "✦",
  title: "Ready when you are",
  description:
    "Summarize any article instantly. No sign-in, no API key, no tracking.",
  buttonLabel: "Summarize page",
};

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

function initBillingUi() {
  const { lifetime } = PRICING;
  if (els.pricingPrice) {
    els.pricingPrice.textContent = lifetime.priceDisplay;
  }
  if (els.pricingBadge) {
    els.pricingBadge.textContent = lifetime.badge;
  }
  if (els.pricingSub) {
    els.pricingSub.textContent = `${lifetime.headline} · no subscription`;
  }
  const checkoutLabel = els.checkoutLifetime?.querySelector(".pricing-label");
  if (checkoutLabel) {
    checkoutLabel.textContent = lifetime.label;
  }
  if (els.onboardingProPrice) {
    els.onboardingProPrice.textContent = `${lifetime.priceDisplay} once · all features`;
  }
  if (els.purchasePromiseHeadline) {
    els.purchasePromiseHeadline.textContent = PURCHASE_PROMISE.headline;
  }
  if (els.purchasePromiseDetail) {
    els.purchasePromiseDetail.textContent = PURCHASE_PROMISE.detail;
  }
  if (els.trustPointsList) {
    els.trustPointsList.innerHTML = "";
    TRUST_POINTS.forEach((point) => {
      const li = document.createElement("li");
      li.textContent = point;
      els.trustPointsList.appendChild(li);
    });
  }
  if (els.licenseLead) {
    els.licenseLead.textContent = LICENSE_MODAL_COPY.lead;
  }
  if (els.licensePostCheckout) {
    els.licensePostCheckout.textContent = LICENSE_MODAL_COPY.postCheckoutNote;
  }
  if (els.licenseWhereTitle) {
    els.licenseWhereTitle.textContent = LICENSE_MESSAGES.whereToFindTitle;
  }
  if (els.licenseWhereHint) {
    els.licenseWhereHint.textContent = LICENSE_MESSAGES.whereToFind;
  }
  if (els.activationStepsList) {
    els.activationStepsList.innerHTML = "";
    LICENSE_ACTIVATION_STEPS.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      els.activationStepsList.appendChild(li);
    });
  }

  if (els.planCompareBody) {
    els.planCompareBody.innerHTML = "";
    PLAN_COMPARISON.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row.feature}</td><td>${row.free}</td><td><strong>${row.pro}</strong></td>`;
      els.planCompareBody.appendChild(tr);
    });
  }

  if (els.purchaseStepsList) {
    els.purchaseStepsList.innerHTML = "";
    PURCHASE_STEPS.forEach((step, index) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="step-num">${index + 1}</span><span class="step-body"><strong>${step.title}</strong><span>${step.detail}</span></span>`;
      els.purchaseStepsList.appendChild(li);
    });
  }
}

function openUpgradeModal() {
  els.upgradeModal.hidden = false;
  document.body.classList.add("modal-open");
  if (els.checkoutLifetime && checkoutInFlight) {
    els.checkoutLifetime.disabled = false;
    els.checkoutLifetime.classList.remove("is-loading");
    checkoutInFlight = false;
  }
}

function closeUpgradeModal() {
  els.upgradeModal.hidden = true;
  if (els.licenseModal.hidden) {
    document.body.classList.remove("modal-open");
  }
}

function openLicenseModal(options = {}) {
  closeUpgradeModal();
  els.licenseError.hidden = true;
  els.licenseError.textContent = "";
  els.licenseError.classList.remove("is-expired");
  if (els.licenseSuccess) {
    els.licenseSuccess.hidden = true;
    els.licenseSuccess.textContent = "";
  }
  if (els.licensePostCheckout) {
    els.licensePostCheckout.hidden = !options.afterCheckout;
  }
  els.licenseModal.hidden = false;
  document.body.classList.add("modal-open");
  els.licenseKeyInput.focus();
}

function closeLicenseModal() {
  els.licenseModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function proPlanLabel(state) {
  if (!state.isPro) {
    return "Free";
  }
  return "Pro · Lifetime";
}

function renderEntitlements(state = entitlements) {
  entitlements = state || entitlements;
  els.app.classList.toggle("is-pro", entitlements.isPro);
  els.upgradeBtn.hidden = entitlements.isPro;
  els.planLabel.textContent = proPlanLabel(entitlements);
  els.planBar.classList.toggle("is-pro", entitlements.isPro);

  if (entitlements.isPro) {
    els.planUsage.textContent = "Unlimited summaries & history";
    els.planMeterFill.style.width = "100%";
  } else {
    const remaining = entitlements.remaining ?? 0;
    els.planUsage.textContent =
      remaining > 0
        ? `${remaining} of ${FREE_DAILY_SUMMARY_LIMIT} summaries left today`
        : `Daily limit reached — unlock Lifetime Pro (${PRICING.lifetime.priceDisplay} once)`;
    const pct = Math.min(
      100,
      (entitlements.usedToday / FREE_DAILY_SUMMARY_LIMIT) * 100,
    );
    els.planMeterFill.style.width = `${pct}%`;
  }

  if (els.historyLockedMsg) {
    if (entitlements.isPro) {
      els.historyLocked.hidden = true;
    } else {
      els.historyLocked.hidden = false;
      const count = entitlements.historyCount ?? 0;
      const limit = entitlements.historyLimit ?? FREE_HISTORY_LIMIT;
      const rem = entitlements.historyRemaining ?? 0;
      if (rem === 0 && count >= limit) {
        els.historyLockedMsg.innerHTML =
          `History full (${limit}/${limit}). <strong>Lifetime Pro</strong> unlocks unlimited saves.`;
      } else {
        els.historyLockedMsg.innerHTML =
          `Free plan: ${count}/${limit} saved summaries. <strong>Lifetime Pro</strong> = unlimited history.`;
      }
    }
  }

  els.clearHistoryBtn.disabled = !entitlements.isPro && !entitlements.historyCount;
  els.exportBtn.classList.toggle("is-locked", !canUseFeature("export_txt", entitlements));
  els.exportMdBtn.classList.toggle("is-locked", !canUseFeature("export_md", entitlements));
  els.copyAllBtn.classList.toggle("is-locked", !canUseFeature("copy_all", entitlements));
  els.copyMarkdownBtn.classList.toggle(
    "is-locked",
    !canUseFeature("copy_markdown", entitlements),
  );
}

function renderModeGrid() {
  els.modeGrid.innerHTML = "";
  SUMMARY_MODE_CATALOG.forEach((mode) => {
    const locked = !isModeAvailable(mode.id, entitlements.isPro);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `mode-chip${mode.id === selectedModeId ? " active" : ""}${
      locked ? " locked" : ""
    }`;
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", String(mode.id === selectedModeId));
    btn.innerHTML = `<span class="mode-icon">${mode.icon}</span><span class="mode-label">${mode.label}</span>${
      locked ? '<span class="mode-lock">Pro</span>' : ""
    }`;
    btn.title = mode.description;
    btn.addEventListener("click", async () => {
      if (locked) {
        openUpgradeModal();
        return;
      }
      selectedModeId = mode.id;
      els.modeHint.textContent = mode.label;
      await sendMessage(MESSAGE_TYPES.SET_SUMMARY_MODE, { modeId: mode.id });
      renderModeGrid();
    });
    els.modeGrid.appendChild(btn);
  });
  const current = getSummaryModeById(selectedModeId);
  els.modeHint.textContent = current.label;
}

function requirePro(featureLabel) {
  showToast(`${featureLabel} requires Lifetime Pro — ${PRICING.lifetime.priceDisplay} one-time`);
  openUpgradeModal();
  return false;
}

function dismissProSuccessCelebration() {
  if (els.proSuccessBackdrop) {
    els.proSuccessBackdrop.hidden = true;
    els.proSuccessBackdrop.setAttribute("hidden", "");
  }
  document.body.classList.remove("modal-open");
}

async function showProUnlockedCelebration(title, subtitle) {
  if (els.proSuccessTitle) {
    els.proSuccessTitle.textContent = title || LICENSE_MESSAGES.successTitle;
  }
  if (els.proSuccessSubtitle) {
    els.proSuccessSubtitle.textContent = subtitle || LICENSE_MESSAGES.successSubtitle;
  }
  if (els.proSuccessBackdrop) {
    els.proSuccessBackdrop.removeAttribute("hidden");
    els.proSuccessBackdrop.hidden = false;
    document.body.classList.add("modal-open");
  }
  els.app.classList.add("pro-celebrate");
  setTimeout(() => els.app.classList.remove("pro-celebrate"), 2400);
}

async function applyProUnlockUi(result) {
  const ent = await sendMessage(MESSAGE_TYPES.GET_ENTITLEMENTS);
  renderEntitlements(ent);
  renderModeGrid();
  const history = await sendMessage(MESSAGE_TYPES.GET_HISTORY);
  renderHistory(history);
  els.historySearchRow.hidden = !entitlements.isPro || !history.length;

  await showProUnlockedCelebration(result?.message, result?.subtitle);

  if (ent.licenseTransferWarning) {
    showToast(LICENSE_MESSAGES.transferWarning);
  }
}

function startCheckout() {
  if (checkoutInFlight) {
    return;
  }
  checkoutInFlight = true;
  const btn = els.checkoutLifetime;
  const originalLabel = btn?.querySelector(".pricing-label")?.textContent;
  if (btn) {
    btn.disabled = true;
    btn.classList.add("is-loading");
    const priceEl = btn.querySelector(".pricing-price");
    if (priceEl) {
      priceEl.textContent = PRICING.lifetime.checkoutLoading;
    }
  }

  chrome.tabs.create({ url: getCheckoutLifetimeUrl() }, () => {
    closeUpgradeModal();
    showToast(LICENSE_MESSAGES.checkoutNextStep);
    openLicenseModal({ afterCheckout: true });
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("is-loading");
      const priceEl = btn.querySelector(".pricing-price");
      if (priceEl) {
        priceEl.textContent = PRICING.lifetime.priceDisplay;
      }
    }
    checkoutInFlight = false;
  });
}

async function submitLicenseKey() {
  const key = els.licenseKeyInput.value.trim();
  if (!key) {
    els.licenseError.textContent = LICENSE_MESSAGES.empty;
    els.licenseError.hidden = false;
    return;
  }

  els.activateLicenseBtn.disabled = true;
  els.activateLicenseBtn.textContent = "Verifying…";
  els.licenseError.hidden = true;

  try {
    const result = await sendMessage(MESSAGE_TYPES.ACTIVATE_LICENSE, {
      licenseKey: key,
    });

    if (!result?.ok) {
      const failMsg = result?.message || LICENSE_MESSAGES.invalid;
      els.licenseError.textContent = failMsg;
      els.licenseError.hidden = false;
      if (els.licenseSuccess) {
        els.licenseSuccess.hidden = true;
        els.licenseSuccess.textContent = "";
      }
      if (result?.status === "expired") {
        els.licenseError.classList.add("is-expired");
      }
      return;
    }

    if (els.licenseSuccess) {
      els.licenseSuccess.textContent = `${LICENSE_MESSAGES.successTitle} ${LICENSE_MESSAGES.successSubtitle}`;
      els.licenseSuccess.hidden = false;
    }

    await new Promise((resolve) => setTimeout(resolve, 900));

    closeLicenseModal();
    els.licenseKeyInput.value = "";
    await applyProUnlockUi(result);
  } catch (error) {
    els.licenseError.textContent = toUserMessage(error, LICENSE_MESSAGES.network);
    els.licenseError.hidden = false;
  } finally {
    els.activateLicenseBtn.disabled = false;
    els.activateLicenseBtn.textContent = "Activate Lifetime Pro";
  }
}

function setStatus(message, visible = false) {
  els.statusBanner.classList.toggle("is-visible", visible);
  els.statusBanner.hidden = !visible;
  if (visible && message) {
    els.statusText.textContent = message;
  }
}

function clearLoadingState() {
  setLoading(false);
}

function applyPageContext(context) {
  pageContext = context || { isYouTube: false };
  const copy = pageContext.isYouTube ? YOUTUBE_EMPTY : DEFAULT_EMPTY;

  els.app.classList.toggle("is-youtube", pageContext.isYouTube);
  els.youtubeBadge.hidden = !pageContext.isYouTube;
  els.emptyIcon.textContent = copy.icon;
  els.emptyTitle.textContent = copy.title;
  els.emptyDescription.textContent = copy.description;
  els.brandSubtitle.textContent = pageContext.isYouTube
    ? "Private video summaries on your device"
    : "Private summaries on your device";
  els.summarizeBtn.textContent = copy.buttonLabel;
}

function setLoading(isLoading, options = {}) {
  const label =
    options.label ||
    (pageContext.isYouTube ? YOUTUBE_EMPTY.buttonLabel : DEFAULT_EMPTY.buttonLabel);
  const statusMessage = options.statusMessage || SUMMARIZE_STATUS.generating;

  els.summarizeBtn.disabled = isLoading;
  els.summarizeSelectionBtn.disabled = isLoading;
  els.skeletonWrap.classList.toggle("visible", isLoading);
  els.skeletonWrap.setAttribute("aria-hidden", String(!isLoading));

  if (isLoading) {
    setStatus(statusMessage, true);
    els.summarizeBtn.innerHTML =
      '<span class="spinner" aria-hidden="true"></span> Working…';
    els.emptyState.style.display = "none";
    els.results.classList.remove("visible");
    els.resultActions.hidden = true;
    els.keyMomentsCard.hidden = true;
  } else {
    els.summarizeBtn.textContent = label;
    setStatus("", false);
    els.skeletonWrap.classList.remove("visible");
  }
}

function renderKeyMoments(moments) {
  els.keyMomentsList.innerHTML = "";

  if (!moments?.length) {
    els.keyMomentsCard.hidden = true;
    return;
  }

  els.keyMomentsCard.hidden = false;
  moments.forEach((moment) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.className = "moment-link";
    link.href = moment.url || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = moment.timestamp;
    link.title = `Jump to ${moment.timestamp}`;

    const label = document.createElement("span");
    label.className = "moment-label";
    label.textContent = moment.label;

    li.appendChild(link);
    li.appendChild(label);
    els.keyMomentsList.appendChild(li);
  });
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
  const isYouTube = data.sourceType === CONTENT_SOURCE_TYPES.YOUTUBE;

  els.tldrText.textContent = data.tldr || data.summary;
  const structuredModes = new Set(["study", "executive", "detailed", "social", "beginner", "actions"]);
  els.summaryText.classList.toggle("preformatted", structuredModes.has(data.summaryMode));
  els.summaryText.textContent = data.summary;
  renderList(els.bulletsList, data.bullets);
  renderList(els.takeawaysList, data.takeaways);
  renderList(els.actionsList, data.actionItems);
  renderKeyMoments(data.keyMoments);

  els.sourceChip.hidden = !isYouTube;
  els.app.classList.toggle("is-youtube", isYouTube);

  const label = engineLabel(data.engine, data.usedFallback);
  els.engineChip.textContent = label;
  els.engineChip.title = data.usedFallback
    ? "Chrome AI was unavailable; local processing was used."
    : label;
  if (data.summaryModeLabel) {
    els.modeHint.textContent = data.summaryModeLabel;
  }
  els.sentimentChip.textContent =
    SENTIMENT_LABELS[data.sentiment] || SENTIMENT_LABELS.neutral;
  els.languageChip.textContent = (data.language || "en").toUpperCase();
  els.readingChip.textContent = `${data.readingTimeMinutes} min`;
  els.charsChip.textContent = `${data.characterCount.toLocaleString()} chars`;

  els.metaRow.hidden = false;
  els.emptyState.style.display = "none";
  els.results.classList.add("visible");
  els.app.classList.add("has-results");
  els.resultActions.hidden = false;
  clearLoadingState();
  requestAnimationFrame(() => {
    els.main.scrollTop = 0;
  });
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
  if (section === "moments") {
    return (currentResult.keyMoments || [])
      .map((moment) => `${moment.timestamp} — ${moment.label}`)
      .join("\n");
  }
  return "";
}

async function copySection(section) {
  if (section === "all" && !canUseFeature("copy_all", entitlements)) {
    requirePro("Copy all");
    return;
  }
  const text = buildCopyText(section);
  if (!text) {
    showToast("Nothing to copy yet");
    return;
  }
  await navigator.clipboard.writeText(text);
  showToast(section === "all" ? "Copied full summary" : "Copied to clipboard");
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeFilename(title) {
  return (title || "summary").replace(/[^\w\- ]+/g, "").trim().slice(0, 40) || "summary";
}

function exportSummary() {
  if (!currentResult) {
    showToast("Nothing to export yet");
    return;
  }
  if (!canUseFeature("export_txt", entitlements)) {
    requirePro("Export");
    return;
  }

  const blob = new Blob([formatSummaryForDownload(currentResult)], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `quickdigest-${safeFilename(currentResult.title)}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("Exported .txt file");
}

function exportMarkdown() {
  if (!currentResult) {
    showToast("Nothing to export yet");
    return;
  }
  if (!canUseFeature("export_md", entitlements)) {
    requirePro("Markdown export");
    return;
  }
  downloadBlob(
    formatSummaryMarkdown(currentResult),
    `quickdigest-${safeFilename(currentResult.title)}.md`,
    "text/markdown;charset=utf-8",
  );
  showToast("Exported .md file");
}

async function shareSummary() {
  if (!currentResult) {
    showToast("Nothing to share yet");
    return;
  }
  const text = formatSummaryForClipboard(currentResult, { includeFooter: true });
  const shareData = {
    title: currentResult.title || "QuickDigest summary",
    text,
    url: currentResult.url || undefined,
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      showToast("Shared");
      return;
    }
  } catch {
    // fall through to clipboard
  }
  await navigator.clipboard.writeText(text);
  showToast("Copied shareable summary");
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
  dismissProSuccessCelebration();

  const settings = await sendMessage(MESSAGE_TYPES.GET_SETTINGS);
  selectedModeId = settings.summaryMode || selectedModeId;
  applyTheme(settings.darkMode);

  const [history, recent, context, ent] = await Promise.all([
    sendMessage(MESSAGE_TYPES.GET_HISTORY),
    sendMessage(MESSAGE_TYPES.GET_RECENT_PAGES),
    sendMessage(MESSAGE_TYPES.GET_PAGE_CONTEXT).catch(() => ({ isYouTube: false })),
    sendMessage(MESSAGE_TYPES.GET_ENTITLEMENTS),
  ]);

  renderEntitlements(ent);
  if (!entitlements.isPro && !isModeAvailable(selectedModeId, false)) {
    selectedModeId = "quick";
    await sendMessage(MESSAGE_TYPES.SET_SUMMARY_MODE, { modeId: "quick" });
  }
  renderModeGrid();
  applyPageContext(context);
  renderHistory(history);
  els.historySearchRow.hidden = !entitlements.isPro || !history.length;
  els.historySection.hidden = !history.length;
  renderRecentPages(recent);
  await loadSessionPayload();
  if (els.footerVersion) {
    els.footerVersion.textContent = `QuickDigest AI v${EXTENSION_VERSION}`;
  }
  initBillingUi();
  await maybeShowOnboarding();

  if (ent?.licenseTransferWarning) {
    showToast(LICENSE_MESSAGES.transferWarning);
  }
}

async function copyMarkdown() {
  if (!currentResult) {
    showToast("Nothing to copy yet");
    return;
  }
  if (!canUseFeature("copy_markdown", entitlements)) {
    requirePro("Markdown copy");
    return;
  }
  const text = formatSummaryMarkdown(currentResult);
  await navigator.clipboard.writeText(text);
  showToast("Copied as Markdown");
}

async function dismissOnboarding(startSummarize = false) {
  els.onboardingBackdrop.hidden = true;
  document.body.classList.remove("modal-open");
  await setInStorage({ [STORAGE_KEYS.ONBOARDING_SEEN]: true });
  if (startSummarize) {
    runSummarize(MESSAGE_TYPES.SUMMARIZE);
  }
}

async function maybeShowOnboarding() {
  const data = await getFromStorage([STORAGE_KEYS.ONBOARDING_SEEN]);
  if (data[STORAGE_KEYS.ONBOARDING_SEEN]) {
    return;
  }
  els.onboardingBackdrop.hidden = false;
  document.body.classList.add("modal-open");
}

async function runSummarize(type, options = {}) {
  if (summarizeInFlight) {
    return;
  }

  lastSummarizeType = type;
  summarizeInFlight = true;
  try {
    const isRegenerate = options.regenerate;
    setLoading(true, {
      statusMessage: isRegenerate
        ? SUMMARIZE_STATUS.regenerating
        : pageContext.isYouTube
          ? SUMMARIZE_STATUS.youtube
          : SUMMARIZE_STATUS.generating,
    });
    const data = await sendMessage(type);
    if (data.entitlements) {
      renderEntitlements(data.entitlements);
      renderModeGrid();
    }
    renderResults(data);
    if (entitlements.isPro) {
      const history = await sendMessage(MESSAGE_TYPES.GET_HISTORY);
      renderHistory(history);
    }
    const recent = await sendMessage(MESSAGE_TYPES.GET_RECENT_PAGES);
    renderRecentPages(recent);
    showToast("Summary ready");
  } catch (error) {
    els.emptyState.style.display = "block";
    els.results.classList.remove("visible");
    els.app.classList.remove("has-results");
    els.resultActions.hidden = true;
    els.keyMomentsCard.hidden = true;
    const msg = toUserMessage(
      error,
      "Could not summarize this page. Refresh the page and try again.",
    );
    showToast(msg);
    if (
      msg.includes("Lifetime Pro") ||
      msg.includes("limit") ||
      msg.includes("Free limit")
    ) {
      openUpgradeModal();
    }
  } finally {
    summarizeInFlight = false;
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
els.upgradeBtn.addEventListener("click", openUpgradeModal);
els.closeUpgradeModal.addEventListener("click", closeUpgradeModal);
els.upgradeModal.addEventListener("click", (event) => {
  if (event.target === els.upgradeModal) {
    closeUpgradeModal();
  }
});
els.checkoutLifetime?.addEventListener("click", () => startCheckout());
els.openLicenseFromUpgrade.addEventListener("click", openLicenseModal);
els.closeLicenseModal.addEventListener("click", closeLicenseModal);
els.licenseModal.addEventListener("click", (event) => {
  if (event.target === els.licenseModal) {
    closeLicenseModal();
  }
});
els.activateLicenseBtn.addEventListener("click", () => submitLicenseKey());
els.licenseKeyInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitLicenseKey();
  }
});
document.querySelectorAll("[data-open-upgrade]").forEach((btn) => {
  btn.addEventListener("click", openUpgradeModal);
});
document.querySelectorAll("[data-open-license]").forEach((btn) => {
  btn.addEventListener("click", openLicenseModal);
});
els.regenerateBtn?.addEventListener("click", () => {
  if (!currentResult) {
    showToast("Summarize a page first");
    return;
  }
  runSummarize(lastSummarizeType, { regenerate: true });
});
els.copyMarkdownBtn?.addEventListener("click", () =>
  copyMarkdown().catch(() => showToast("Clipboard permission denied")),
);
els.onboardingStartBtn?.addEventListener("click", () => dismissOnboarding(true));
els.onboardingUpgradeBtn?.addEventListener("click", async () => {
  await dismissOnboarding(false);
  openUpgradeModal();
});
els.onboardingDismissBtn?.addEventListener("click", () => dismissOnboarding(false));
function onProSuccessDismiss(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  dismissProSuccessCelebration();
}

els.proSuccessDismiss?.addEventListener("click", onProSuccessDismiss);
els.proSuccessBackdrop?.addEventListener("click", (event) => {
  if (event.target === els.proSuccessBackdrop) {
    dismissProSuccessCelebration();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && els.proSuccessBackdrop && !els.proSuccessBackdrop.hidden) {
    dismissProSuccessCelebration();
  }
});
els.shareBtn.addEventListener("click", () =>
  shareSummary().catch(() => showToast("Share failed")),
);
els.copyAllBtn.addEventListener("click", () =>
  copySection("all").catch(() => showToast("Clipboard permission denied")),
);
els.exportMdBtn.addEventListener("click", exportMarkdown);
els.exportBtn.addEventListener("click", exportSummary);
els.clearHistoryBtn.addEventListener("click", async () => {
  if (!entitlements.isPro) {
    requirePro("History");
    return;
  }
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
  if (changes.summaryHistory && entitlements.isPro) {
    renderHistory(changes.summaryHistory.newValue || []);
  }
  if (changes.license || changes.proEntitlement || changes.dailyUsage) {
    sendMessage(MESSAGE_TYPES.GET_ENTITLEMENTS)
      .then((ent) => {
        renderEntitlements(ent);
        renderModeGrid();
      })
      .catch(() => {});
  }
  if (changes.recentPages) {
    renderRecentPages(changes.recentPages.newValue || []);
  }
});

loadInitialState().catch((error) => {
  showToast(toUserMessage(error, "Failed to load extension"));
});
