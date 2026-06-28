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
    return `<details class="section section-fold"><summary><span class="fold-title">⏱️ Run of Show — Host Timing</span></summary><div class="fold-body">
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

  // Host-only: a drop schedule for the printable evidence cards, grouped by the
  // phase each clue should be revealed in so nothing gets handed out too early.
  function cluesBlock(isHost) {
    const clues = typeof CLUES !== "undefined" ? CLUES : [];
    if (!isHost || !clues.length) return "";
    const groups = {};
    const order = [];
    clues.forEach((cl) => {
      const idx = phaseIndex(cl.reveal);
      const label = PHASES[idx] || PHASES[0];
      if (!groups[label]) {
        groups[label] = [];
        order.push({ idx, label });
      }
      groups[label].push(cl);
    });
    order.sort((a, b) => a.idx - b.idx);
    const sections = order
      .map(({ label }) => {
        const cards = groups[label]
          .map(
            (cl) => `<div class="clue-row">
              <div class="clue-head"><span class="clue-emoji">${cl.emoji}</span><span class="clue-title">${escapeHtml(cl.title)}</span></div>
              <p class="clue-when">${escapeHtml(cl.reveal)}</p>
              <p class="clue-text">${escapeHtml(cl.body)}</p>
            </div>`
          )
          .join("");
        return `<div class="clue-group"><h4>${escapeHtml(label)}</h4><div class="clue-list">${cards}</div></div>`;
      })
      .join("");
    return `<details class="section section-fold"><summary><span class="fold-title">🔍 Evidence — When to Reveal</span></summary><div class="fold-body">
      <p class="tl-intro">Drop each clue on its cue so the mystery is something players DISCOVER. Print the physical cards from cards.html and hand them out on these beats.</p>
      <div class="clue-groups">${sections}</div></div></details>`;
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

  // Map a cue-sheet line (e.g. "ACT II · showing the body") to its phase
  // index, or -1 when it isn't tagged to a phase. Lets the "Right now" panel
  // surface only the current phase's paired moments.
  function cuePhase(line) {
    const s = String(line).toUpperCase();
    if (/^\s*BLACKOUT\b/.test(s)) return 1; // the blackout happens in Act I
    if (/^\s*ACT III\b/.test(s)) return 3;
    if (/^\s*ACT II\b/.test(s)) return 2;
    if (/^\s*ACT I\b/.test(s)) return 1;
    if (/^\s*ACCUSATION\b/.test(s)) return 4;
    if (/^\s*FINALE\b/.test(s)) return 5;
    if (/^\s*INTRO\b/.test(s)) return 0;
    return -1;
  }

  // Host-only: a focused, phase-aware briefing pinned to the top of the
  // dossier. Shows only what matters for the CURRENT phase — what to run, what
  // to hand out, which paired moments to trigger — so the host isn't digging
  // through the whole playbook mid-party.
  function hostNowPanel(c) {
    const phase = PHASES[currentAct] || PHASES[0];

    const ros = (c.runOfShow || []).filter(
      (b) => phaseIndex(b.block) === currentAct
    );
    const runHtml = ros
      .map((b) => {
        const notes = (b.notes || [])
          .map((n) => `<li>${escapeHtml(n)}</li>`)
          .join("");
        const time = b.time
          ? `<span class="now-time">${escapeHtml(b.time)}</span>`
          : "";
        return `<div class="now-ros"><div class="now-ros-head"><span class="now-ros-block">${escapeHtml(
          b.block
        )}</span>${time}</div><ul>${notes}</ul></div>`;
      })
      .join("");

    const clues = typeof CLUES !== "undefined" ? CLUES : [];
    const due = clues.filter((cl) => phaseIndex(cl.reveal) === currentAct);
    const clueHtml = due.length
      ? `<ul class="now-clues">${due
          .map(
            (cl) =>
              `<li><span class="now-clue-emoji">${cl.emoji}</span>` +
              `<span class="now-clue-title">${escapeHtml(cl.title)}</span>` +
              `<span class="now-clue-when">${escapeHtml(cl.reveal)}</span></li>`
          )
          .join("")}</ul>`
      : `<p class="now-empty">Nothing new to hand out this phase.</p>`;

    const cueKey = Object.keys(c.acts || {}).find((k) => /cue sheet/i.test(k));
    const cues = (cueKey ? c.acts[cueKey] : []).filter(
      (line) => cuePhase(line) === currentAct
    );
    const cueHtml = cues.length
      ? `<div class="now-block"><h4>🔔 Shepherd these moments</h4><ul class="now-cues">${cues
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("")}</ul></div>`
      : "";

    return `<section class="now-panel">
      <div class="now-head"><span class="now-eyebrow">You are here</span><span class="now-phase">${escapeHtml(
        phase
      )}</span></div>
      ${
        runHtml
          ? `<div class="now-block"><h4>▶ Run this phase</h4><div class="now-ros-list">${runHtml}</div></div>`
          : ""
      }
      <div class="now-block"><h4>🔍 Hand out this phase</h4>${clueHtml}</div>
      ${cueHtml}
    </section>`;
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
    // Only the storm/blackout (Act I) needs this expanded; tuck it away after.
    const open = currentAct <= 1 ? " open" : "";
    return `<details class="section blackout-panel"${open}>
      <summary class="bo-summary"><span class="bo-summary-title">\uD83C\uDF29\uFE0F Blackout Control</span><span class="bo-summary-hint">Act I</span></summary>
      <div class="bo-body">
        <div class="bo-controls">
          <button class="btn" id="boStart">\u26A1 Start Blackout (3:00)</button>
          <button class="btn-ghost" id="boPlus">+1 min</button>
          <button class="btn-ghost" id="boStop">End blackout</button>
          <span class="bo-panel-clock" id="boPanelClock">Ready</span>
        </div>
        <p class="bo-panel-note">Hit Start to drop a synced countdown on every player's screen. Quietly shepherd each blackout action below as the room plays it out in the dark:</p>
        <ol class="bo-actions">${rows}</ol>
      </div>
    </details>`;
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
      ${isHost ? hostNowPanel(c) : ""}
      ${isHost ? hostBlackoutPanel() : ""}
      ${!isHost ? blackoutLiveBlock(c) : ""}
      ${c.note ? `<p class="callout">${escapeHtml(c.note)}</p>` : ""}
      ${listBlock("Who you are", c.personality, { collapsible: true, open: !isHost && currentAct === 0 })}
      ${listBlock("Your secrets", c.secrets, isHost ? undefined : { collapsible: true, open: currentAct === 0 })}
      ${listBlock("Relationships", c.relationships, isHost ? undefined : { collapsible: true, open: currentAct === 0 })}
      ${objectivesBlock(c.objectives, isHost)}
      ${!isHost ? blackoutBlock() : ""}
      ${actsBlock(c.acts, isHost)}
      ${cluesBlock(isHost)}
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
