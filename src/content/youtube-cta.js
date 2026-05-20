(function initYouTubeCta() {
  if (document.getElementById("qd-youtube-cta")) {
    return;
  }

  const btn = document.createElement("button");
  btn.id = "qd-youtube-cta";
  btn.type = "button";
  btn.textContent = "Summarize This Video";
  btn.title = "QuickDigest AI — summarize transcript on your device";
  btn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "SUMMARIZE", openPopup: true }, () => {
      void chrome.runtime.lastError;
    });
  });

  document.documentElement.appendChild(btn);
})();
