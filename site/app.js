/* Camp Guppy — front-end logic. Static site + Azure Functions act sync. */
(function () {
  "use strict";

  const STORAGE_CODE = "mm_code";
  const POLL_MS = 3000;
  const DEFAULT_BLACKOUT_MS = 3 * 60 * 1000; // 3 minutes
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
  let blackoutUntil = 0; // epoch ms the blackout ends (0 = none), synced via server
  let blackoutTicker = null; // local interval that refreshes the countdown UI
  let wasBlackout = false; // tracks the active->ended transition

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

  function listBlock(title, items, opts) {
    if (!items || !items.length) return "";
    opts = opts || {};
    const lis = items.map((i) => `<li>${escapeHtml(i)}</li>`).join("");
    if (opts.collapsible) {
      return `<details class="section section-fold"${opts.open ? " open" : ""}>
        <summary><span class="fold-title">${escapeHtml(title)}</span></summary>
        <ul>${lis}</ul></details>`;
    }
    return `<section class="section"><h3>${escapeHtml(title)}</h3><ul>${lis}</ul></section>`;
  }

  function blackoutBlock() {
    // Shared, spoiler-free explainer of how the blackout is handled.
    // Only relevant while the night is at Intro / Act I.
    if (!GAME.blackout || currentAct > 1) return "";
    return `<section class="section blackout"><h3>\uD83C\uDF29\uFE0F The Blackout</h3>
      <p>${escapeHtml(GAME.blackout)}</p></section>`;
  }

  function blackoutLiveBlock(c) {
    // Live, highlighted callout shown on a player's own sheet WHILE the
    // blackout timer is running. Shows their personal action + countdown.
    if (!c || c.role === "host" || !blackoutActive()) return "";
    const action = c.blackoutPlayer || GAME.blackout || "";
    return `<section class="section blackout-live">
      <div class="bo-live-head">
        <span class="bo-live-title">\u26A1 BLACKOUT \u2014 lights are out</span>
        <span class="bo-live-clock" id="boLiveClock">${fmtClock(remainingMs())}</span>
      </div>
      <p class="bo-live-action">${escapeHtml(action)}</p>
      <p class="bo-live-hint">Quietly do your thing in the dark. Don't peek at what anyone else is up to.</p>
    </section>`;
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
    return `<details class="section section-fold" open><summary><span class="fold-title">⏱️ Run of Show — Host Timing</span></summary><div class="fold-body">
      <p class="tl-intro">Suggested pacing for a ~2 hour party. Use the Advance button to move everyone between phases.</p>
      <div class="ros-list">${rows}</div></div></details>`;
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
    return `<details class="section section-fold"><summary><span class="fold-title">📜 Full Timeline — What Really Happened</span></summary><div class="fold-body">
      <p class="tl-intro">The complete chronological truth. For your eyes only.</p>
      <div class="tl-groups">${groups}</div></div></details>`;
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
        // Players: foreground the current act, fold away past ones.
        if (!isHost) {
          if (idx === currentAct) {
            return `<div class="act act-now"><h4>${escapeHtml(actName)} <span class="act-now-tag">Now</span></h4><ul>${lis}</ul></div>`;
          }
          return `<details class="act act-fold"><summary><span class="act-fold-title">${escapeHtml(actName)}</span><span class="act-fold-hint">done</span></summary><ul>${lis}</ul></details>`;
        }
        return `<div class="act"><h4>${escapeHtml(actName)}</h4><ul>${lis}</ul></div>`;
      })
      .join("");
    if (isHost) {
      return `<details class="section section-fold"><summary><span class="fold-title">📋 Master Playbook & Cue Sheet</span></summary><div class="fold-body"><div class="acts">${blocks}</div></div></details>`;
    }
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

  function hostBlackoutPanel() {
    const players = CHARACTERS.filter((c) => c.role !== "host" && c.blackoutAction);
    const rows = players
      .map(
        (c) =>
          `<li><span class="bo-emoji">${c.emoji}</span>` +
          `<span class="bo-name">${escapeHtml(c.name)}</span>` +
          `<span class="bo-act">${escapeHtml(c.blackoutAction)}</span></li>`
      )
      .join("");
    return `<section class="section blackout-panel">
      <h3>\uD83C\uDF29\uFE0F Blackout Control</h3>
      <div class="bo-controls">
        <button class="btn" id="boStart">\u26A1 Start Blackout (3:00)</button>
        <button class="btn-ghost" id="boPlus">+1 min</button>
        <button class="btn-ghost" id="boStop">End blackout</button>
        <span class="bo-panel-clock" id="boPanelClock">Ready</span>
      </div>
      <p class="bo-panel-note">Hit Start to drop a synced countdown on every player's screen. Quietly shepherd each blackout action below as the room plays it out in the dark:</p>
      <ol class="bo-actions">${rows}</ol>
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
      ${isHost ? hostBlackoutPanel() : ""}
      ${!isHost ? blackoutLiveBlock(c) : ""}
      ${c.note ? `<p class="callout">${escapeHtml(c.note)}</p>` : ""}
      ${listBlock("Who you are", c.personality, { collapsible: true, open: !isHost && currentAct === 0 })}
      ${listBlock("Your secrets", c.secrets, isHost ? undefined : { collapsible: true, open: currentAct === 0 })}
      ${listBlock("Relationships", c.relationships, isHost ? undefined : { collapsible: true, open: currentAct === 0 })}
      ${objectivesBlock(c.objectives, isHost)}
      ${!isHost ? blackoutBlock() : ""}
      ${actsBlock(c.acts, isHost)}
      ${isHost ? runOfShowBlock(c.runOfShow) : ""}
      ${isHost ? timelineBlock(c.timeline) : ""}
      <p class="footer-note">Keep this to yourself. The fun dies if the secrets get out early.</p>
    `;
    if (isHost) wireHostControls();
    updateBlackoutUI();
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
      return {
        act: typeof data.act === "number" ? data.act : 0,
        blackoutUntil:
          typeof data.blackoutUntil === "number" ? data.blackoutUntil : 0,
      };
    } catch (e) {
      return null; // offline / local preview without the API
    }
  }

  function applyState(s) {
    if (!s) return;
    applyAct(s.act);
    applyBlackout(s.blackoutUntil);
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

  /* ---------- Blackout timer (synced to all players) ---------- */
  function remainingMs() {
    return Math.max(0, blackoutUntil - Date.now());
  }

  function blackoutActive() {
    return blackoutUntil > Date.now();
  }

  function fmtClock(ms) {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, "0");
    return m + ":" + ss;
  }

  function applyBlackout(until) {
    blackoutUntil = Number(until) || 0;
    updateBlackoutUI();
  }

  function updateBlackoutUI() {
    const isActive = blackoutActive();

    // When the blackout starts or ends, re-render so the player's live
    // action block appears/disappears on their own sheet.
    if (isActive !== wasBlackout) {
      if (wasBlackout && !isActive && active && active.role !== "host") {
        showToast("💡 The lights flicker back on. Everyone drifts back inside…");
      }
      wasBlackout = isActive;
      if (active) render(active); // render() calls updateBlackoutUI() again
      return;
    }

    // Keep the live countdown clocks ticking (player sheet + host panel).
    const clockText = isActive ? fmtClock(remainingMs()) : "Ready";
    const live = document.getElementById("boLiveClock");
    if (live) live.textContent = fmtClock(remainingMs());
    const hc = document.getElementById("boPanelClock");
    if (hc) hc.textContent = clockText;

    // Run a light ticker only while a blackout is active.
    if (isActive && !blackoutTicker) {
      blackoutTicker = setInterval(updateBlackoutUI, 500);
    } else if (!isActive && blackoutTicker) {
      clearInterval(blackoutTicker);
      blackoutTicker = null;
    }
  }

  async function setBlackout(until) {
    try {
      const r = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blackoutUntil: until }),
      });
      if (!r.ok) return;
      const data = await r.json();
      applyBlackout(
        typeof data.blackoutUntil === "number" ? data.blackoutUntil : 0
      );
    } catch (e) {
      /* offline — ignore */
    }
  }

  function startPolling() {
    stopPolling();
    fetchState().then((s) => {
      if (s) {
        lastServerAct = s.act;
        applyState(s);
      }
    });
    pollTimer = setInterval(async () => {
      const s = await fetchState();
      if (s) applyState(s);
    }, POLL_MS);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (blackoutTicker) {
      clearInterval(blackoutTicker);
      blackoutTicker = null;
    }
  }

  async function setAct(act) {
    const statusEl = document.getElementById("hostStatus");
    if (statusEl) statusEl.textContent = "Updating…";
    try {
      const r = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ act }),
      });
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

    const boStart = document.getElementById("boStart");
    const boPlus = document.getElementById("boPlus");
    const boStop = document.getElementById("boStop");
    if (boStart)
      boStart.addEventListener("click", () =>
        setBlackout(Date.now() + DEFAULT_BLACKOUT_MS)
      );
    if (boPlus)
      boPlus.addEventListener("click", () => {
        const base = blackoutUntil > Date.now() ? blackoutUntil : Date.now();
        setBlackout(base + 60 * 1000);
      });
    if (boStop) boStop.addEventListener("click", () => setBlackout(0));
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
