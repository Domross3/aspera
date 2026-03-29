// ── Aspera Dynamic Friction ─────────────────────────────────────
// Content script injected on distracting sites.
// Shows a timed overlay when the user has an active Big Rock in deep-work mode.

(function () {
  'use strict';

  const COUNTDOWN_SECONDS = 15;
  const ACCENT = '#6C63FF';
  const ACCENT_ALT = '#00D4FF';
  let overlayEl = null;
  let countdownInterval = null;
  let styleTag = null;

  // ── Lock the page underneath ──────────────────────────────────
  function lockPage() {
    styleTag = document.createElement('style');
    styleTag.id = 'aspera-friction-style';
    styleTag.textContent = `
      body.aspera-locked {
        overflow: hidden !important;
        pointer-events: none !important;
      }
      body.aspera-locked > *:not(#aspera-friction-overlay) {
        filter: blur(8px) brightness(0.3) !important;
        pointer-events: none !important;
      }
      #aspera-friction-overlay {
        pointer-events: all !important;
      }
      #aspera-friction-overlay * {
        pointer-events: all !important;
      }
      @keyframes aspera-pulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.15); opacity: 1; }
      }
      @keyframes aspera-fadein {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(styleTag);
    document.body.classList.add('aspera-locked');
  }

  function unlockPage() {
    document.body.classList.remove('aspera-locked');
    if (styleTag && styleTag.parentNode) {
      styleTag.parentNode.removeChild(styleTag);
      styleTag = null;
    }
  }

  // ── Build & inject the overlay ──────────────────────────────────
  function showOverlay(taskName) {
    if (overlayEl) return;

    lockPage();

    overlayEl = document.createElement('div');
    overlayEl.id = 'aspera-friction-overlay';

    Object.assign(overlayEl.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      color: '#F0F4FF',
      opacity: '0',
      transition: 'opacity 0.5s ease',
    });

    overlayEl.innerHTML = `
      <div style="text-align:center; max-width:520px; padding:0 32px; animation: aspera-fadein 0.6s ease 0.2s both;">

        <!-- Pulsing icon -->
        <div style="
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, ${ACCENT}33, ${ACCENT_ALT}33);
          border: 2px solid ${ACCENT}55;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 32px;
          animation: aspera-pulse 3s ease-in-out infinite;
        ">
          <span style="font-size: 36px; line-height: 1;">⚡</span>
        </div>

        <!-- Label -->
        <div style="
          font-size: 13px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: #4A5568; margin-bottom: 16px;
        ">DEEP WORK MODE</div>

        <!-- Title -->
        <div style="
          font-size: 18px; font-weight: 500; color: #9BA8C4;
          margin-bottom: 8px; line-height: 1.4;
        ">You said your priority was:</div>

        <!-- Big Rock -->
        <div style="
          font-size: 32px; font-weight: 800; letter-spacing: -0.5px;
          line-height: 1.2; margin-bottom: 40px;
          background: linear-gradient(135deg, ${ACCENT}, ${ACCENT_ALT});
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        ">${escapeHtml(taskName)}</div>

        <!-- Countdown -->
        <div id="aspera-countdown-text" style="
          font-size: 14px; color: #4A5568; margin-bottom: 16px;
          font-weight: 500;
        ">This page will be available in ${COUNTDOWN_SECONDS}s</div>

        <!-- Progress bar -->
        <div style="
          width: 280px; height: 3px; border-radius: 2px;
          background: rgba(255,255,255,0.06); margin: 0 auto 48px;
          overflow: hidden;
        ">
          <div id="aspera-countdown-bar" style="
            width: 0%; height: 100%; border-radius: 2px;
            background: linear-gradient(90deg, ${ACCENT}, ${ACCENT_ALT});
            transition: width 1s linear;
          "></div>
        </div>

        <!-- Back to work button -->
        <button id="aspera-back-btn" style="
          display: inline-block; padding: 16px 48px;
          font-size: 15px; font-weight: 700; color: #fff;
          background: ${ACCENT}; border: none; border-radius: 14px;
          cursor: pointer; letter-spacing: 0.3px;
          box-shadow: 0 4px 32px ${ACCENT}44, 0 0 0 1px ${ACCENT}88;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          font-family: inherit;
        ">Back to work</button>

        <!-- Continue anyway (hidden until countdown) -->
        <div style="margin-top: 24px; min-height: 40px;">
          <button id="aspera-continue-btn" style="
            display: none; padding: 8px 20px;
            font-size: 12px; font-weight: 500; color: #4A5568;
            background: transparent; border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px; cursor: pointer;
            transition: opacity 0.5s ease, color 0.15s ease;
            opacity: 0; font-family: inherit;
          ">Continue anyway</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlayEl);

    // Wire button events
    const backBtn = document.getElementById('aspera-back-btn');
    if (backBtn) {
      backBtn.addEventListener('mouseenter', () => {
        backBtn.style.transform = 'scale(1.04)';
        backBtn.style.boxShadow = `0 8px 40px ${ACCENT}66, 0 0 0 1px ${ACCENT}`;
      });
      backBtn.addEventListener('mouseleave', () => {
        backBtn.style.transform = 'scale(1)';
        backBtn.style.boxShadow = `0 4px 32px ${ACCENT}44, 0 0 0 1px ${ACCENT}88`;
      });
      backBtn.addEventListener('click', () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.close();
        }
      });
    }

    const continueBtn = document.getElementById('aspera-continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('mouseenter', () => { continueBtn.style.color = '#9BA8C4'; });
      continueBtn.addEventListener('mouseleave', () => { continueBtn.style.color = '#4A5568'; });
      continueBtn.addEventListener('click', () => { removeOverlay(); });
    }

    // Fade in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlayEl.style.opacity = '1';
      });
    });

    // Start countdown
    let remaining = COUNTDOWN_SECONDS;
    countdownInterval = setInterval(() => {
      remaining -= 1;
      updateCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        onCountdownDone();
      }
    }, 1000);

    // Kick off the first bar update
    requestAnimationFrame(() => {
      updateCountdown(COUNTDOWN_SECONDS);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function updateCountdown(seconds) {
    const text = document.getElementById('aspera-countdown-text');
    const bar = document.getElementById('aspera-countdown-bar');
    if (text) {
      text.textContent = seconds > 0
        ? `This page will be available in ${seconds}s`
        : 'Timer complete — stay focused?';
    }
    if (bar) {
      const pct = ((COUNTDOWN_SECONDS - seconds) / COUNTDOWN_SECONDS) * 100;
      bar.style.width = pct + '%';
    }
  }

  function onCountdownDone() {
    const btn = document.getElementById('aspera-continue-btn');
    if (btn) {
      btn.style.display = 'inline-block';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          btn.style.opacity = '1';
        });
      });
    }
  }

  // ── Remove overlay ──────────────────────────────────────────────
  function removeOverlay() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    if (overlayEl) {
      overlayEl.style.opacity = '0';
      setTimeout(() => {
        if (overlayEl && overlayEl.parentNode) {
          overlayEl.parentNode.removeChild(overlayEl);
        }
        overlayEl = null;
        unlockPage();
      }, 500);
    }
  }

  // ── Check state and decide ──────────────────────────────────────
  function checkAndApply(state) {
    if (state && state.isDeepWork && state.task && state.task.trim() !== '') {
      showOverlay(state.task);
    } else {
      removeOverlay();
    }
  }

  // ── Init: read current Big Rock state ───────────────────────────
  chrome.storage.sync.get('aspera_big_rock', (result) => {
    checkAndApply(result.aspera_big_rock);
  });

  // ── React to live changes ───────────────────────────────────────
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.aspera_big_rock) {
      const newVal = changes.aspera_big_rock.newValue;
      if (newVal && newVal.isDeepWork && newVal.task && newVal.task.trim() !== '') {
        if (!overlayEl) showOverlay(newVal.task);
      } else {
        removeOverlay();
      }
    }
  });
})();
