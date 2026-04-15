// ── Helpers ──────────────────────────────────────────────────────
function msToDisplay(ms) {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return "<1m";
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getDayKey() {
  return new Date().toISOString().slice(0, 10);
}

function computeFocusScore(totals) {
  const productive = totals.productive || 0;
  const distracting = totals.distracting || 0;
  const total = productive + (totals.neutral || 0) + distracting;
  if (total === 0) return 0;

  // Score: productive% boosted, distracting% penalized
  const prodRatio = productive / total;
  const distRatio = distracting / total;
  const raw = prodRatio * 100 - distRatio * 50;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function getScoreColor(score) {
  if (score >= 70) return "#34D399"; // green
  if (score >= 40) return "#FBBF24"; // amber
  return "#F87171"; // red
}

// ── Render ───────────────────────────────────────────────────────
async function render() {
  const key = getDayKey();
  const data = await chrome.storage.local.get(key);
  const dayData = data[key];

  // Date display
  const dateEl = document.getElementById("date");
  const today = new Date();
  dateEl.textContent = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (!dayData || Object.keys(dayData.sites).length === 0) return;

  const { sites, totals } = dayData;
  const score = computeFocusScore(totals);
  const scoreColor = getScoreColor(score);

  // Sort sites by time
  const sorted = Object.entries(sites)
    .sort(([, a], [, b]) => b.time - a.time)
    .slice(0, 6);

  // Ring circumference math
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const content = document.getElementById("content");
  content.innerHTML = `
    <!-- Focus Score -->
    <div class="score-section">
      <div class="score-ring">
        <svg width="120" height="120">
          <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#1C2535" stroke-width="8"/>
          <circle cx="60" cy="60" r="${radius}" fill="none" stroke="${scoreColor}" stroke-width="8"
            stroke-linecap="round"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
            style="transition: stroke-dashoffset 0.6s ease"/>
        </svg>
        <div class="value" style="color: ${scoreColor}">${score}</div>
      </div>
      <div class="score-label">FOCUS SCORE</div>
    </div>

    <!-- Time Bars -->
    <div class="time-bars">
      <div class="time-bar">
        <div class="label productive">Productive</div>
        <div class="time">${msToDisplay(totals.productive || 0)}</div>
      </div>
      <div class="time-bar">
        <div class="label neutral">Neutral</div>
        <div class="time">${msToDisplay(totals.neutral || 0)}</div>
      </div>
      <div class="time-bar">
        <div class="label distracting">Distracting</div>
        <div class="time">${msToDisplay(totals.distracting || 0)}</div>
      </div>
    </div>

    <!-- Top Sites -->
    <div class="section-title">Top Sites</div>
    <div class="site-list">
      ${sorted
        .map(
          ([hostname, info]) => `
        <div class="site-row">
          <div class="site-dot ${info.category}"></div>
          <div class="site-name">${hostname}</div>
          <div class="site-time">${msToDisplay(info.time)}</div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

render();

// ── Big Rock / Deep Work ────────────────────────────────────────
(function () {
  const taskInput = document.getElementById("bigrock-input");
  const deepToggle = document.getElementById("deepwork-toggle");
  const statusEl = document.getElementById("bigrock-status");

  // Load current state on popup open
  chrome.storage.sync.get("aspera_big_rock", (result) => {
    const state = result.aspera_big_rock;
    if (state) {
      taskInput.value = state.task || "";
      deepToggle.checked = !!state.isDeepWork;
      updateStatus(state);
    }
  });

  function persist() {
    const state = {
      task: taskInput.value.trim(),
      isDeepWork: deepToggle.checked,
    };
    chrome.storage.sync.set({ aspera_big_rock: state });
    updateStatus(state);
  }

  function updateStatus(state) {
    if (state.isDeepWork && state.task) {
      statusEl.textContent =
        "Friction active — distracting sites will be blocked";
      statusEl.classList.add("active");
    } else if (state.task) {
      statusEl.textContent =
        "Big Rock set — enable Deep Work to block distractions";
      statusEl.classList.remove("active");
    } else {
      statusEl.textContent = "";
      statusEl.classList.remove("active");
    }
  }

  // Save on every change
  taskInput.addEventListener("input", persist);
  deepToggle.addEventListener("change", persist);
})();
