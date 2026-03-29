// ── Site Categories ──────────────────────────────────────────────
const PRODUCTIVE = [
  'github.com', 'gitlab.com', 'stackoverflow.com', 'stackexchange.com',
  'docs.google.com', 'notion.so', 'figma.com', 'linear.app',
  'vercel.com', 'netlify.com', 'aws.amazon.com', 'console.cloud.google.com',
  'developer.apple.com', 'developer.mozilla.org', 'reactnative.dev',
  'expo.dev', 'npmjs.com', 'medium.com', 'dev.to', 'arxiv.org',
  'scholar.google.com', 'coursera.org', 'edx.org', 'khanacademy.org',
  'leetcode.com', 'hackerrank.com', 'codepen.io', 'replit.com',
  'trello.com', 'asana.com', 'jira.atlassian.com', 'slack.com',
  'zoom.us', 'meet.google.com', 'calendar.google.com',
];

const DISTRACTING = [
  'reddit.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
  'tiktok.com', 'youtube.com', 'twitch.tv', 'netflix.com', 'hulu.com',
  'disneyplus.com', 'hbomax.com', 'primevideo.com', 'buzzfeed.com',
  'tmz.com', 'dailymail.co.uk', '9gag.com', 'imgur.com',
  'snapchat.com', 'pinterest.com', 'tumblr.com', 'discord.com',
];

function categorize(hostname) {
  const domain = hostname.replace('www.', '');
  if (PRODUCTIVE.some(d => domain.includes(d))) return 'productive';
  if (DISTRACTING.some(d => domain.includes(d))) return 'distracting';
  return 'neutral';
}

// ── State ───────────────────────────────────────────────────────
let activeTab = null;   // { url, hostname, category, startTime }

function getDayKey() {
  return new Date().toISOString().slice(0, 10); // "2026-03-28"
}

// ── Core Tracking ───────────────────────────────────────────────
async function switchTo(url) {
  const now = Date.now();

  // Close out the previous active tab
  if (activeTab) {
    const elapsed = now - activeTab.startTime;
    if (elapsed > 1000) { // Ignore <1s blips
      await recordTime(activeTab.hostname, activeTab.category, elapsed);
    }
  }

  // Start tracking the new tab
  if (url && url.startsWith('http')) {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      activeTab = {
        url,
        hostname,
        category: categorize(hostname),
        startTime: now,
      };
    } catch {
      activeTab = null;
    }
  } else {
    activeTab = null;
  }
}

async function recordTime(hostname, category, elapsed) {
  const key = getDayKey();
  const data = await chrome.storage.local.get(key);
  const dayData = data[key] || { sites: {}, totals: { productive: 0, neutral: 0, distracting: 0 } };

  // Per-site tracking
  if (!dayData.sites[hostname]) {
    dayData.sites[hostname] = { time: 0, category, visits: 0 };
  }
  dayData.sites[hostname].time += elapsed;
  dayData.sites[hostname].visits += 1;

  // Category totals
  dayData.totals[category] = (dayData.totals[category] || 0) + elapsed;

  await chrome.storage.local.set({ [key]: dayData });
}

// ── Event Listeners ─────────────────────────────────────────────
chrome.tabs.onActivated.addListener(async (info) => {
  try {
    const tab = await chrome.tabs.get(info.tabId);
    await switchTo(tab.url);
  } catch { /* tab might be gone */ }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    await switchTo(changeInfo.url);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus — stop tracking
    await switchTo(null);
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, windowId });
      if (tab) await switchTo(tab.url);
    } catch { /* ignore */ }
  }
});

// ── Periodic Flush (every 30s, saves active tab's time) ─────────
chrome.alarms.create('flush', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'flush' && activeTab) {
    const now = Date.now();
    const elapsed = now - activeTab.startTime;
    if (elapsed > 1000) {
      await recordTime(activeTab.hostname, activeTab.category, elapsed);
      activeTab.startTime = now; // Reset timer
    }
  }
});

// ── Clean up old data (keep 30 days) ────────────────────────────
chrome.runtime.onStartup.addListener(async () => {
  const all = await chrome.storage.local.get(null);
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const toRemove = Object.keys(all).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k) && k < cutoff);
  if (toRemove.length) await chrome.storage.local.remove(toRemove);
});
