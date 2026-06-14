/* Camp Guppy — front-end logic. Static site + Azure Functions act sync. */
(function () {
  "use strict";

  const STORAGE_CODE = "mm_code";
  const STORAGE_HOSTKEY = "mm_hostkey";
  const POLL_MS = 3000;
  const PHASES = ["Intro", "Act I", "Act II", "Act III", "Accusation", "Finale"];

  const lock = document.getElementById("lock");
  const sheet = document.getElementById("sheet");
  const form = document.getElementById("codeForm");
  const input = document.getElementById("codeInput");
  const error = document.getElementById("error");
  const lockCard = document.querySelector(".lock-card");
  const sheetCard = document.getElementById("sheetCard");
  const backBtn = document.getElementById("backBtn");
  const setting = document.getElementById("setting");
  const toast = document.getElementById("toast");

  setting.textContent = GAME.setting;

  // Build a lookup keyed by normalized codeword.
  const byCode = {};
  CHARACTERS.forEach((c) => {
    byCode[normalize(c.code)] = c;
  });

  let active = null; // currently open character
  let currentAct = 0; // global phase index, driven by the host via the server
  let lastServerAct = null; // last value we saw from the server
  let pollTimer = null;

  function normalize(s) {
    return String(s || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  function show(el) {
    el.hidden = false;
  }
  function hide(el) {
    el.hidden = true;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Map a playbook section title (e.g. "Act II — Your Entrance") to a phase index.
  function phaseIndex(title) {
    const t = String(title).toLowerCase();
    if (t.includes("finale")) return 5;
    if (t.includes("accusation")) return 4;
    if (t.includes("act iii")) return 3;
    if (t.includes("act ii")) return 2;
    if (t.includes("act i")) return 1;
    if (t.includes("intro")) return 0;
    return 0;
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    // restart the entrance animation
    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.hidden = true;
      }, 300);
    }, 4000);
  }

  function listBlock(title, items) {
    if (!items || !items.length) return "";
    const lis = items.map((i) => `<li>${escapeHtml(i)}</li>`).join("");
    return `<section class="section"><h3>${escapeHtml(title)}</h3><ul>${lis}</ul></section>`;
  }

  function objectivesBlock(objectives, isHost) {
    if (!objectives) return "";
    const keys = Object.keys(objectives);
    if (!keys.length) return "";
    let future = 0;
    const groups = keys
      .map((phaseName) => {
        const idx = phaseIndex(phaseName);
        if (!isHost && idx > currentAct) {
          future++;
          return "";
        }
        const lis = (objectives[phaseName] || [])
          .map((i) => `<li>${escapeHtml(i)}</li>`)
          .join("");
        return `<div class="obj-group"><h4>${escapeHtml(phaseName)}</h4><ul>${lis}</ul></div>`;
      })
      .join("");
    const note = future
      ? `<p class="obj-future">\uD83D\uDD12 More goals unlock as the host moves the night forward.</p>`
      : "";
    return `<section class="section objectives"><h3>\uD83C\uDFAF Your secret goals</h3>
      <p class="obj-intro">Chase these through the night \u2014 they're what make the party fun. Don't read them aloud.</p>
      <div class="obj-groups">${groups}</div>${note}</section>`;
  }

  function runOfShowBlock(runOfShow) {
    if (!runOfShow || !runOfShow.length) return "";
    const rows = runOfShow
      .map((b) => {
        const notes = (b.notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join("");
        return `<div class="ros-row">
          <div class="ros-head"><span class="ros-block">${escapeHtml(b.block)}</span><span class="ros-time">${escapeHtml(b.time)}</span></div>
          <ul class="ros-notes">${notes}</ul></div>`;
      })
      .join("");
    return `<section class="section run-of-show"><h3>⏱️ Run of Show — Host Timing</h3>
      <p class="tl-intro">Suggested pacing for a ~2 hour party. Use the Advance button to move everyone between phases.</p>
      <div class="ros-list">${rows}</div></section>`;
  }

  function timelineBlock(timeline) {
    if (!timeline || !timeline.length) return "";
    const groups = timeline
      .map((g) => {
        const beats = (g.beats || [])
          .map((line) => {
            const isKill = /🔪|💀|KILL|murder|choke|spike|hammer|dead|dies|body/i.test(line);
            return `<li class="${isKill ? "kill" : ""}">${escapeHtml(line)}</li>`;
          })
          .join("");
        return `<div class="tl-group"><h4>${escapeHtml(g.phase)}</h4><ol class="tl-beats">${beats}</ol></div>`;
      })
      .join("");
    return `<section class="section timeline"><h3>📜 Full Timeline — What Really Happened</h3>
      <p class="tl-intro">The complete chronological truth. For your eyes only.</p>
      <div class="tl-groups">${groups}</div></section>`;
  }

  function actsBlock(acts, isHost) {
    if (!acts) return "";
    const blocks = Object.keys(acts)
      .map((actName) => {
        const idx = phaseIndex(actName);
        const locked = !isHost && idx > currentAct;
        if (locked) {
          return `<div class="act locked"><h4>${escapeHtml(actName)} 🔒</h4>
            <p class="locked-msg">The host will reveal this when the story gets here.</p></div>`;
        }
        const lis = acts[actName]
          .map((line) => {
            const isKill = /🔪|💀|KILL|murder|choke|spike/i.test(line);
            return `<li class="${isKill ? "kill" : ""}">${escapeHtml(line)}</li>`;
          })
          .join("");
        return `<div class="act"><h4>${escapeHtml(actName)}</h4><ul>${lis}</ul></div>`;
      })
      .join("");
    return `<section class="section"><h3>Your Playbook</h3><div class="acts">${blocks}</div></section>`;
  }

  function hostBar() {
    const phase = PHASES[currentAct] || PHASES[0];
    const atStart = currentAct <= 0;
    const atEnd = currentAct >= PHASES.length - 1;
    return `
      <section class="host-bar">
        <div class="host-bar-row">
          <span class="host-bar-label">Live phase for everyone</span>
          <span class="host-phase">${escapeHtml(phase)}</span>
        </div>
        <div class="host-bar-actions">
          <button class="btn-ghost" id="prevAct" ${atStart ? "disabled" : ""}>&larr; Previous</button>
          <button class="btn" id="nextAct" ${atEnd ? "disabled" : ""}>Advance to next act &rarr;</button>
        </div>
        <p class="host-bar-note" id="hostStatus"></p>
      </section>`;
  }

  function render(c) {
    active = c;
    const isHost = c.role === "host";
    sheetCard.className = "sheet-card" + (isHost ? " host" : "");
    const phaseLabel = PHASES[currentAct] || PHASES[0];
    sheetCard.innerHTML = `
      <header class="sheet-head">
        <div class="sheet-emoji">${c.emoji}</div>
        <div>
          <h2 class="sheet-name">${escapeHtml(c.name)}</h2>
          <p class="sheet-tagline">${escapeHtml(c.tagline)}</p>
          <span class="badge ${isHost ? "host" : ""}">${isHost ? "Host / Game Master" : "Your character"}</span>
        </div>
      </header>
      ${
        isHost
          ? hostBar()
          : `<p class="phase-pill">Now playing: <strong>${escapeHtml(phaseLabel)}</strong></p>`
      }
      ${c.note ? `<p class="callout">${escapeHtml(c.note)}</p>` : ""}
      ${listBlock("Who you are", c.personality)}
      ${listBlock("Your secrets", c.secrets)}
      ${objectivesBlock(c.objectives, isHost)}
      ${listBlock("Relationships", c.relationships)}
      ${actsBlock(c.acts, isHost)}
      ${isHost ? runOfShowBlock(c.runOfShow) : ""}
      ${isHost ? timelineBlock(c.timeline) : ""}
      <p class="footer-note">Keep this to yourself. The fun dies if the secrets get out early.</p>
    `;
    if (isHost) wireHostControls();
    window.scrollTo(0, 0);
  }

  function openSheet(c, opts) {
    opts = opts || {};
    render(c);
    hide(lock);
    show(sheet);
    if (opts.persist !== false) {
      try {
        localStorage.setItem(STORAGE_CODE, c.code);
      } catch (e) {
        /* private mode — fine */
      }
    }
    startPolling();
  }

  function backToLock() {
    stopPolling();
    try {
      localStorage.removeItem(STORAGE_CODE);
    } catch (e) {
      /* ignore */
    }
    active = null;
    hide(sheet);
    show(lock);
    input.value = "";
    error.hidden = true;
    input.focus();
  }

  /* ---------- Server sync (Azure Functions + Table Storage) ---------- */
  async function fetchState() {
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      if (!r.ok) return null;
      const data = await r.json();
      return typeof data.act === "number" ? data.act : 0;
    } catch (e) {
      return null; // offline / local preview without the API
    }
  }

  function applyAct(act) {
    if (act === null || act === currentAct) return;
    const advanced = lastServerAct !== null && act !== lastServerAct;
    currentAct = act;
    lastServerAct = act;
    if (active) render(active);
    if (advanced && active && active.role !== "host") {
      showToast("📣 The host moved the story to: " + (PHASES[act] || "Act " + act));
    }
  }

  function startPolling() {
    stopPolling();
    fetchState().then((a) => {
      if (a !== null) {
        lastServerAct = a;
        applyAct(a);
      }
    });
    pollTimer = setInterval(async () => {
      const a = await fetchState();
      if (a !== null) applyAct(a);
    }, POLL_MS);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function getHostKey() {
    let k = "";
    try {
      k = localStorage.getItem(STORAGE_HOSTKEY) || "";
    } catch (e) {
      /* ignore */
    }
    if (!k) {
      k = window.prompt("Enter the host key (set as HOST_KEY in Azure) to control the game:") || "";
      if (k) {
        try {
          localStorage.setItem(STORAGE_HOSTKEY, k);
        } catch (e) {
          /* ignore */
        }
      }
    }
    return k;
  }

  async function setAct(act) {
    const statusEl = document.getElementById("hostStatus");
    const key = getHostKey();
    if (!key) return;
    if (statusEl) statusEl.textContent = "Updating…";
    try {
      const r = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-host-key": key },
        body: JSON.stringify({ act }),
      });
      if (r.status === 401) {
        try {
          localStorage.removeItem(STORAGE_HOSTKEY);
        } catch (e) {
          /* ignore */
        }
        if (statusEl) statusEl.textContent = "Host key rejected. Tap a button again to re-enter it.";
        return;
      }
      if (!r.ok) {
        if (statusEl) statusEl.textContent = "Couldn't reach the server. Try again.";
        return;
      }
      const data = await r.json();
      lastServerAct = data.act;
      applyAct(data.act);
      if (statusEl)
        statusEl.textContent =
          "✅ Everyone is now on: " + (PHASES[data.act] || "Act " + data.act);
    } catch (e) {
      if (statusEl) statusEl.textContent = "Network error. Try again.";
    }
  }

  function wireHostControls() {
    const next = document.getElementById("nextAct");
    const prev = document.getElementById("prevAct");
    if (next)
      next.addEventListener("click", () =>
        setAct(Math.min(PHASES.length - 1, currentAct + 1))
      );
    if (prev)
      prev.addEventListener("click", () => setAct(Math.max(0, currentAct - 1)));
  }

  /* ---------- Lock form ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const c = byCode[normalize(input.value)];
    if (c) {
      openSheet(c);
    } else {
      error.hidden = false;
      lockCard.classList.remove("shake");
      // reflow to restart animation
      void lockCard.offsetWidth;
      lockCard.classList.add("shake");
      input.select();
    }
  });

  backBtn.addEventListener("click", backToLock);

  /* ---------- Boot: remember the player's device ---------- */
  (function boot() {
    const params = new URLSearchParams(window.location.search);
    const direct = params.get("c");
    let saved = "";
    try {
      saved = localStorage.getItem(STORAGE_CODE) || "";
    } catch (e) {
      /* ignore */
    }
    const code = direct || saved;
    if (code && byCode[normalize(code)]) {
      openSheet(byCode[normalize(code)]);
    } else {
      input.focus();
    }
  })();
})();
