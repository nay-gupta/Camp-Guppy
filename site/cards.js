/* Camp Guppy — printable character cards, generated from data.js */
(function () {
  "use strict";

  const STORAGE_URL = "mm_print_url";
  const cardsEl = document.getElementById("cards");
  const urlInput = document.getElementById("siteUrl");
  const printBtn = document.getElementById("printBtn");

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function baseUrl() {
    return (urlInput.value || "").trim().replace(/\/+$/, "");
  }

  function playerLink(c) {
    const b = baseUrl();
    if (!b) return "";
    return b + "/?c=" + encodeURIComponent(c.code);
  }

  function render() {
    cardsEl.innerHTML = "";
    CHARACTERS.forEach((c) => {
      const isHost = c.role === "host";
      const link = playerLink(c);
      const card = document.createElement("article");
      card.className = "card" + (isHost ? " card-host" : "");
      card.innerHTML = `
        <div class="card-top">
          <div class="card-emoji">${c.emoji}</div>
          <div class="card-camp">Camp Guppy</div>
          <div class="card-tag">${isHost ? "Host / Game Master" : "Your character"}</div>
        </div>
        <h2 class="card-name">${escapeHtml(c.name)}</h2>
        <p class="card-line">${escapeHtml(c.tagline)}</p>
        <div class="card-qr" data-link="${escapeHtml(link)}"></div>
        <div class="card-code-wrap">
          <div class="card-code-label">Your codeword</div>
          <div class="card-code">${escapeHtml(c.code)}</div>
        </div>
        <p class="card-foot">${
          link
            ? "Scan the code, or go to the site and enter your codeword."
            : "Go to the party site and enter your codeword."
        }</p>
      `;
      cardsEl.appendChild(card);
    });
    renderQRCodes();
    renderClues();
  }

  function renderClues() {
    const cluesEl = document.getElementById("clues");
    if (!cluesEl || typeof CLUES === "undefined") return;
    cluesEl.innerHTML = "";
    CLUES.forEach((clue) => {
      const card = document.createElement("article");
      card.className = "card clue-card";
      card.innerHTML = `
        <div class="card-top">
          <div class="card-emoji">${clue.emoji}</div>
          <div class="card-camp">Evidence</div>
        </div>
        <h2 class="card-name">${escapeHtml(clue.title)}</h2>
        <p class="clue-body">${escapeHtml(clue.body)}</p>
        <div class="clue-reveal">
          <span class="clue-reveal-label">Reveal</span>
          <span class="clue-reveal-when">${escapeHtml(clue.reveal)}</span>
        </div>
      `;
      cluesEl.appendChild(card);
    });
  }

  function renderQRCodes() {
    const hasQR = typeof window.QRCode !== "undefined";
    document.querySelectorAll(".card-qr").forEach((box) => {
      box.innerHTML = "";
      const link = box.getAttribute("data-link");
      if (!link) {
        box.classList.add("empty");
        return;
      }
      box.classList.remove("empty");
      if (hasQR) {
        // eslint-disable-next-line no-new
        new window.QRCode(box, {
          text: link,
          width: 132,
          height: 132,
          correctLevel: window.QRCode.CorrectLevel.M,
        });
      } else {
        box.classList.add("empty");
        box.textContent = "(QR needs internet)";
      }
    });
  }

  // Persist the URL so a reload keeps it.
  try {
    urlInput.value = localStorage.getItem(STORAGE_URL) || "";
  } catch (e) {
    /* ignore */
  }

  let t = null;
  urlInput.addEventListener("input", () => {
    try {
      localStorage.setItem(STORAGE_URL, urlInput.value);
    } catch (e) {
      /* ignore */
    }
    clearTimeout(t);
    t = setTimeout(render, 250);
  });

  printBtn.addEventListener("click", () => window.print());

  render();
})();
