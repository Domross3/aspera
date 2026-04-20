(() => {
  var e = {};
  ((e.id = 17),
    (e.ids = [17]),
    (e.modules = {
      3295: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");
      },
      10846: (e) => {
        "use strict";
        e.exports = require("next/dist/compiled/next-server/app-page.runtime.prod.js");
      },
      11997: (e) => {
        "use strict";
        e.exports = require("punycode");
      },
      27910: (e) => {
        "use strict";
        e.exports = require("stream");
      },
      28354: (e) => {
        "use strict";
        e.exports = require("util");
      },
      29021: (e) => {
        "use strict";
        e.exports = require("fs");
      },
      29294: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/work-async-storage.external.js");
      },
      33873: (e) => {
        "use strict";
        e.exports = require("path");
      },
      37830: (e) => {
        "use strict";
        e.exports = require("node:stream/web");
      },
      44870: (e) => {
        "use strict";
        e.exports = require("next/dist/compiled/next-server/app-route.runtime.prod.js");
      },
      55591: (e) => {
        "use strict";
        e.exports = require("https");
      },
      57075: (e) => {
        "use strict";
        e.exports = require("node:stream");
      },
      63033: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");
      },
      73024: (e) => {
        "use strict";
        e.exports = require("node:fs");
      },
      73566: (e) => {
        "use strict";
        e.exports = require("worker_threads");
      },
      74075: (e) => {
        "use strict";
        e.exports = require("zlib");
      },
      78335: () => {},
      79551: (e) => {
        "use strict";
        e.exports = require("url");
      },
      81630: (e) => {
        "use strict";
        e.exports = require("http");
      },
      86776: (e, t, r) => {
        "use strict";
        (r.r(t),
          r.d(t, {
            patchFetch: () => j,
            routeModule: () => L,
            serverHooks: () => I,
            workAsyncStorage: () => D,
            workUnitAsyncStorage: () => H,
          }));
        var i = {};
        (r.r(i), r.d(i, { POST: () => M }));
        var o = r(96559),
          s = r(48088),
          a = r(37719),
          n = r(32190),
          u = r(29021),
          l = r(78290);
        function c(e) {
          let t = new Date();
          return (t.setDate(t.getDate() - e), t.toISOString().split("T")[0]);
        }
        function d(e, t, r = 0) {
          let i = new Date();
          return (
            i.setDate(i.getDate() - e),
            i.setHours(t, r, 0, 0),
            i.toISOString()
          );
        }
        let p = [
            {
              name: "Under the Bridge",
              artist: "Red Hot Chili Peppers",
              album: "Blood Sugar Sex Magik",
              played_at: d(0, 9, 15),
            },
            {
              name: "Would?",
              artist: "Alice in Chains",
              album: "Dirt",
              played_at: d(0, 9, 30),
            },
            {
              name: "Heart-Shaped Box",
              artist: "Nirvana",
              album: "In Utero",
              played_at: d(0, 10, 0),
            },
            {
              name: "Lofi Study Beats",
              artist: "ChilledCow",
              album: "Lofi Hip Hop Radio",
              played_at: d(0, 14, 0),
            },
            {
              name: "Rooster",
              artist: "Alice in Chains",
              album: "Dirt",
              played_at: d(1, 8, 30),
            },
            {
              name: "Scar Tissue",
              artist: "Red Hot Chili Peppers",
              album: "Californication",
              played_at: d(1, 9, 0),
            },
            {
              name: "Come As You Are",
              artist: "Nirvana",
              album: "Nevermind",
              played_at: d(1, 10, 0),
            },
            {
              name: "Gymnopedie No.1",
              artist: "Erik Satie",
              album: "Classical Essentials",
              played_at: d(2, 11, 0),
            },
            {
              name: "Black Hole Sun",
              artist: "Soundgarden",
              album: "Superunknown",
              played_at: d(2, 14, 30),
            },
            {
              name: "Man in the Box",
              artist: "Alice in Chains",
              album: "Facelift",
              played_at: d(3, 9, 0),
            },
          ],
          m = [
            { date: c(6), hours_slept: 7.2, sleep_quality: 7 },
            { date: c(5), hours_slept: 5.5, sleep_quality: 4 },
            { date: c(4), hours_slept: 8, sleep_quality: 9 },
            { date: c(3), hours_slept: 6.8, sleep_quality: 6 },
            { date: c(2), hours_slept: 7.5, sleep_quality: 8 },
            { date: c(1), hours_slept: 6, sleep_quality: 5 },
            { date: c(0), hours_slept: 7.8, sleep_quality: 8 },
          ],
          g = [
            { date: c(6), minutes: 65 },
            { date: c(5), minutes: 12 },
            { date: c(4), minutes: 45 },
            { date: c(3), minutes: 80 },
            { date: c(2), minutes: 30 },
            { date: c(1), minutes: 55 },
            { date: c(0), minutes: 48 },
          ],
          y = [
            {
              date: c(6),
              type: "Weight Training",
              duration_minutes: 55,
              intensity: "High",
            },
            {
              date: c(5),
              type: "Trail Run",
              duration_minutes: 40,
              intensity: "Medium",
            },
            {
              date: c(4),
              type: "Soccer Match",
              duration_minutes: 90,
              intensity: "Grueling",
            },
            {
              date: c(3),
              type: "Weight Training",
              duration_minutes: 60,
              intensity: "High",
            },
            {
              date: c(1),
              type: "Trail Run",
              duration_minutes: 35,
              intensity: "Medium",
            },
            {
              date: c(0),
              type: "Weight Training",
              duration_minutes: 50,
              intensity: "High",
            },
          ],
          f = [
            {
              summary: "Team Standup",
              start: d(0, 9, 0),
              end: d(0, 9, 30),
              cognitive_demand: "Low",
            },
            {
              summary: "Deep Work: Hackathon",
              start: d(0, 10, 0),
              end: d(0, 13, 0),
              cognitive_demand: "High",
            },
            {
              summary: "Lunch Break",
              start: d(0, 13, 0),
              end: d(0, 14, 0),
              cognitive_demand: "Low",
            },
            {
              summary: "Project Review",
              start: d(0, 15, 0),
              end: d(0, 16, 0),
              cognitive_demand: "Medium",
            },
          ],
          h = [
            {
              id: "1",
              title: "Finish hackathon MVP",
              due: c(0),
              completed: !1,
              completed_at: null,
              cognitive_load: "High",
            },
            {
              id: "2",
              title: "Review pull request #47",
              due: c(0),
              completed: !0,
              completed_at: d(0, 11, 30),
              cognitive_load: "Medium",
            },
            {
              id: "3",
              title: "Meal prep for the week",
              due: c(0),
              completed: !1,
              completed_at: null,
              cognitive_load: "Low",
            },
            {
              id: "4",
              title: "Read Ch.4 of Algorithms",
              due: c(1),
              completed: !0,
              completed_at: d(1, 20, 0),
              cognitive_load: "High",
            },
            {
              id: "5",
              title: "Schedule dentist appointment",
              due: c(2),
              completed: !0,
              completed_at: d(2, 10, 0),
              cognitive_load: "Low",
            },
          ],
          v = [
            { date: c(6), mood_score: 8, anxiety_score: 3, energy_score: 9 },
            { date: c(5), mood_score: 5, anxiety_score: 6, energy_score: 4 },
            { date: c(4), mood_score: 7, anxiety_score: 4, energy_score: 7 },
            { date: c(3), mood_score: 9, anxiety_score: 2, energy_score: 8 },
            { date: c(2), mood_score: 6, anxiety_score: 5, energy_score: 6 },
            { date: c(1), mood_score: 7, anxiety_score: 3, energy_score: 7 },
            { date: c(0), mood_score: 8, anxiety_score: 2, energy_score: 8 },
          ],
          w = [
            {
              date: c(0),
              focusScore: 78,
              totals: { productive: 144e5, neutral: 36e5, distracting: 18e5 },
              sites: [
                {
                  hostname: "github.com",
                  time: 72e5,
                  category: "productive",
                  visits: 12,
                },
                {
                  hostname: "stackoverflow.com",
                  time: 36e5,
                  category: "productive",
                  visits: 8,
                },
                {
                  hostname: "docs.expo.dev",
                  time: 36e5,
                  category: "productive",
                  visits: 5,
                },
                {
                  hostname: "reddit.com",
                  time: 12e5,
                  category: "distracting",
                  visits: 4,
                },
                {
                  hostname: "youtube.com",
                  time: 6e5,
                  category: "distracting",
                  visits: 2,
                },
                {
                  hostname: "google.com",
                  time: 36e5,
                  category: "neutral",
                  visits: 15,
                },
              ],
            },
            {
              date: c(1),
              focusScore: 62,
              totals: { productive: 108e5, neutral: 54e5, distracting: 36e5 },
              sites: [
                {
                  hostname: "github.com",
                  time: 54e5,
                  category: "productive",
                  visits: 9,
                },
                {
                  hostname: "figma.com",
                  time: 54e5,
                  category: "productive",
                  visits: 3,
                },
                {
                  hostname: "twitter.com",
                  time: 24e5,
                  category: "distracting",
                  visits: 7,
                },
                {
                  hostname: "reddit.com",
                  time: 12e5,
                  category: "distracting",
                  visits: 5,
                },
                {
                  hostname: "google.com",
                  time: 54e5,
                  category: "neutral",
                  visits: 18,
                },
              ],
            },
          ],
          _ =
            (c(0),
            {
              deep_work: "Deep Work",
              research: "Research",
              communication: "Communication",
              utility: "Utility",
              recovery: "Recovery",
              drift: "Drift",
            }),
          b = {
            "github.com": "deep_work",
            "figma.com": "deep_work",
            "docs.expo.dev": "research",
            "stackoverflow.com": "research",
            "google.com": "utility",
            "youtube.com": "recovery",
            "reddit.com": "drift",
            "twitter.com": "communication",
          };
        function S(e) {
          return Math.round(10 * e) / 10;
        }
        function x(e) {
          return Math.round(e / 6e4);
        }
        function k(e) {
          let t = e.artist.toLowerCase(),
            r = e.name.toLowerCase();
          return t.includes("nirvana") ||
            t.includes("alice in chains") ||
            t.includes("soundgarden") ||
            t.includes("red hot chili peppers")
            ? "rock"
            : t.includes("satie")
              ? "classical"
              : t.includes("chilledcow") || r.includes("lofi")
                ? "lofi"
                : "ambient";
        }
        function R(e) {
          let t = x(
              e.totals.productive + e.totals.neutral + e.totals.distracting,
            ),
            r = new Map();
          for (let t of e.sites) {
            let e = (function (e) {
              let t = b[e.hostname];
              return (
                t ||
                ("productive" === e.category
                  ? "deep_work"
                  : "neutral" === e.category
                    ? "utility"
                    : "drift")
              );
            })(t);
            r.set(e, (r.get(e) ?? 0) + x(t.time));
          }
          let i = Array.from(r.entries())
            .map(([e, r]) => ({
              bucket: e,
              label: _[e],
              minutes: r,
              share: 0 === t ? 0 : S(r / t),
            }))
            .sort((e, t) => t.minutes - e.minutes);
          return {
            date: e.date,
            totalMinutes: t,
            productiveMinutes: x(e.totals.productive),
            neutralMinutes: x(e.totals.neutral),
            distractingMinutes: x(e.totals.distracting),
            focusScore: e.focusScore,
            byBucket: i,
            topSources: [...e.sites]
              .sort((e, t) => t.time - e.time)
              .slice(0, 3)
              .map((e) => e.hostname),
          };
        }
        async function N() {
          try {
            let e = await u.promises.readFile(
                "/tmp/aspera-browsing.json",
                "utf8",
              ),
              t = JSON.parse(e),
              r = [];
            for (let [e, i] of Object.entries(t)) {
              if (!i || "object" != typeof i) continue;
              let t = i.sites;
              if (!t || "object" != typeof t || Array.isArray(t)) continue;
              let o = Object.entries(t).map(([e, t]) => ({
                  hostname: e,
                  time: "number" == typeof t.time ? t.time : 0,
                  category:
                    "productive" === t.category || "distracting" === t.category
                      ? t.category
                      : "neutral",
                  visits: "number" == typeof t.visits ? t.visits : 1,
                })),
                s = i.totals;
              r.push({
                date: e,
                sites: o,
                totals: {
                  productive: s?.productive ?? 0,
                  neutral: s?.neutral ?? 0,
                  distracting: s?.distracting ?? 0,
                },
                focusScore: "number" == typeof i.focusScore ? i.focusScore : 0,
              });
            }
            return r.length > 0
              ? r.sort((e, t) => e.date.localeCompare(t.date))
              : null;
          } catch {
            return null;
          }
        }
        let A = {
            analytical: `You are a precise, data-driven personal optimization analyst embedded in the Aspera app.
Reference specific numbers, percentages, and correlations. Be clinical and thorough.
You MUST respond with ONLY valid JSON matching the exact schema provided.
Do not include markdown fences, explanations, or any text outside the JSON.`,
            unserious: `You are a slightly sarcastic, casual personal coach embedded in the Aspera app.
You gently call the user out on bad habits. Use casual language, throw in some humor.
Be specific with data but keep the tone like a witty friend who also reads research papers.
You MUST respond with ONLY valid JSON matching the exact schema provided.
Do not include markdown fences, explanations, or any text outside the JSON.`,
            stoic: `You are a terse, stoic personal advisor embedded in the Aspera app. Marcus Aurelius energy.
No fluff. Short, declarative sentences. Reference the data but don't over-explain.
Every insight should feel like a carved-in-stone principle.
You MUST respond with ONLY valid JSON matching the exact schema provided.
Do not include markdown fences, explanations, or any text outside the JSON.`,
          },
          O = `IMPORTANT TONE DIRECTIVE: The user's data indicates a difficult week with low energy or focus.
Regardless of your personality style, you must apply Self-Compassion principles:
- Self-Kindness: Acknowledge the struggle without judgment. Do NOT guilt-trip or shame.
- Common Humanity: Remind them that difficult weeks are universal — everyone goes through them.
- Mindfulness: Note the data patterns without catastrophizing or over-dramatizing.
Your summary should open with acknowledgment, your recommendation should be a single small, low-effort action to rebuild momentum. Never say "you failed" or "you need to do better."
`;
        function T(e) {
          let t = new Date(`${e}T12:00:00`);
          return Number.isNaN(t.getTime())
            ? "Day"
            : t.toLocaleDateString("en-US", { weekday: "short" });
        }
        function C(e) {
          return [...e]
            .sort((e, t) => e.date.localeCompare(t.date))
            .slice(-7)
            .map((e) => ({
              date: e.date,
              dayLabel: T(e.date),
              focusRating: e.output.focusRating,
              energyRating: e.output.energyRating,
              tasksCompleted: e.output.tasksCompleted,
            }));
        }
        async function E(e) {
          let t = {
              spotify: p,
              sleep: m,
              daylight: g,
              workouts: y,
              calendar: f,
              tasks: h,
              mood: v,
              browsing: w,
            },
            r = await N(),
            i = r ?? t.browsing,
            o = (function () {
              let e = new Map(
                [...w]
                  .sort((e, t) => e.date.localeCompare(t.date))
                  .map(R)
                  .map((e) => [e.date, e]),
              );
              return Array.from(
                new Set([
                  ...m.map((e) => e.date),
                  ...y.map((e) => e.date),
                  ...v.map((e) => e.date),
                  ...w.map((e) => e.date),
                  ...p.map((e) => e.played_at.split("T")[0]),
                  ...f.map((e) => e.start.split("T")[0]),
                  ...h.map((e) => e.due),
                  ...h.flatMap((e) =>
                    e.completed_at ? [e.completed_at.split("T")[0]] : [],
                  ),
                ]),
              )
                .sort((e, t) => e.localeCompare(t))
                .map((t) => {
                  let r = m.find((e) => e.date === t),
                    i = y.filter((e) => e.date === t),
                    o = f.filter((e) => e.start.startsWith(t)),
                    s = h.filter((e) => e.completed_at?.startsWith(t)),
                    a = h.filter(
                      (e) => e.due === t || e.completed_at?.startsWith(t),
                    ),
                    n = v.find((e) => e.date === t),
                    u = Array.from(
                      new Set(
                        p.filter((e) => e.played_at.startsWith(t)).map(k),
                      ),
                    );
                  return {
                    date: t,
                    attention: e.get(t),
                    sleepHours: r?.hours_slept,
                    sleepQuality: r?.sleep_quality,
                    workoutMinutes:
                      i.reduce((e, t) => e + t.duration_minutes, 0) || void 0,
                    workoutIntensity: i.length > 0 ? i[0].intensity : void 0,
                    musicGenres: u.length > 0 ? u : void 0,
                    calendarEvents: o.length || void 0,
                    calendarHighDemandBlocks:
                      o.filter((e) => "High" === e.cognitive_demand).length ||
                      void 0,
                    completedTasks: s.length || void 0,
                    taskLoad: (function (e) {
                      if (0 === e.length) return "None";
                      let t = Array.from(
                        new Set(e.map((e) => e.cognitive_load)),
                      );
                      return t.length > 1 ? "Mixed" : t[0];
                    })(a),
                    moodAverage: n ? S(n.mood_score / 2) : void 0,
                    energyAverage: n ? S(n.energy_score / 2) : void 0,
                  };
                });
            })().slice(-7),
            s = e
              .filter((e) => e.bigRocks && e.bigRocks.length > 0)
              .map((e) => ({
                date: e.date,
                bigRocks: e.bigRocks,
                tasksCompleted: e.output.tasksCompleted,
                focusRating: e.output.focusRating,
              })),
            a = {
              summary:
                "Exactly 2 concise sentences summarizing the user's patterns",
              correlations: [
                {
                  id: "example-slug",
                  emoji: "\uD83C\uDFAF",
                  title: "Short catchy title",
                  description:
                    "1 concise sentence with specific numbers from the data",
                  inputFactors: ["caffeine", "music"],
                  outputMetric: "focus",
                  delta: 2.5,
                  confidence: "high",
                  isKeystone: !1,
                },
              ],
              topRecommendation:
                "Single actionable sentence starting with a verb",
              weeklyTrends: [
                {
                  date: "2026-03-22",
                  dayLabel: "Sun",
                  focusRating: 7,
                  energyRating: 8,
                  tasksCompleted: 9,
                },
              ],
              generatedAt: Date.now(),
            };
          return `Analyze this user's lifestyle and performance data from multiple sources.
Identify 3–5 correlations between their inputs and outputs.

DAILY LOGS (self-reported):
${JSON.stringify(e, null, 2)}

${
  s.length > 0
    ? `BIG ROCKS (user's stated top priorities per day):
${JSON.stringify(s, null, 2)}

Analyze whether the user's task output and focus scores are higher on days they set Big Rocks vs. days they didn't.
If so, note this as a correlation.
`
    : ""
}

SPOTIFY RECENTLY PLAYED:
${JSON.stringify(t.spotify, null, 2)}

HEALTHKIT SLEEP (7 days):
${JSON.stringify(t.sleep, null, 2)}

HEALTHKIT TIME IN DAYLIGHT (7 days, minutes of outdoor UV exposure):
${JSON.stringify(t.daylight, null, 2)}

HEALTHKIT WORKOUTS:
${JSON.stringify(t.workouts, null, 2)}

GOOGLE CALENDAR (today):
${JSON.stringify(t.calendar, null, 2)}

GOOGLE TASKS:
${JSON.stringify(t.tasks, null, 2)}

STATE OF MIND (7 days):
${JSON.stringify(t.mood, null, 2)}

BROWSING FOCUS TELEMETRY${null !== r ? " (live from Chrome extension)" : " (mock data)"}:
${JSON.stringify(i, null, 2)}

NORMALIZED INTEGRATION SUMMARIES:
${JSON.stringify(o, null, 2)}

IMPORTANT: One insight MUST reference the user's music listening patterns (Spotify data).
Notice that their highest-focus sessions correlate with grunge/alt-rock (Nirvana, Alice in Chains, RHCP).
You should also look for attention patterns across productive, neutral, and distracting time where relevant.

KEYSTONE HABIT DETECTION:
Look for habits that create positive cascading effects across multiple outputs.
A Keystone Habit is a single input that, when present, correlates with improvements in 2+ output metrics simultaneously.
Mark exactly ONE correlation as a Keystone Habit by setting "isKeystone": true. The rest should be false.
In that correlation's description, explicitly call out the cascading/spillover effects.

Rules for outputMetric: must be exactly one of "focus", "energy", or "tasks".
Rules for confidence: must be exactly one of "low", "medium", or "high".
Rules for isKeystone: must be a boolean (true or false). Exactly one correlation should be true.
Include 3-5 correlations and exactly 7 weeklyTrends entries (one per day of recent logs).
Keep the response concise:
- summary: exactly 2 sentences
- each correlation description: exactly 1 sentence
- no extra keys beyond the schema

Respond ONLY with valid JSON. No markdown fences. No text before or after. Here is an example of the exact JSON format:
${JSON.stringify(a, null, 2)}`;
        }
        async function M(e) {
          try {
            let { logs: t, personality: r = "analytical" } = await e.json();
            if (!t || 0 === t.length)
              return n.NextResponse.json(
                { error: "No logs provided" },
                { status: 400 },
              );
            let i = process.env.CLAUDE_KEY;
            if (!i)
              return n.NextResponse.json(
                { error: "CLAUDE_KEY not configured on server" },
                { status: 500 },
              );
            let o = new l.Ay({ apiKey: i }),
              s = A[r];
            (function (e) {
              if (e.length < 3) return !1;
              let t =
                  e.reduce((e, t) => e + t.output.focusRating, 0) / e.length,
                r = e.reduce((e, t) => e + t.output.energyRating, 0) / e.length;
              return t < 5 || r < 5;
            })(t) && (s = O + "\n\n" + s);
            let a = await E(t),
              u = `${a}

RETRY FORMAT RULES:
- Return one JSON object only
- Do not use markdown fences
- Keep the JSON compact and concise
- Keep each correlation description to one sentence`,
              c = [a, u],
              d = [2200, 2800];
            for (let e = 0; e < c.length; e++) {
              let i = (
                  await o.messages.create({
                    model: "claude-sonnet-4-6",
                    max_tokens: d[e],
                    temperature: 0.2 * ("unserious" === r),
                    system: s,
                    messages: [{ role: "user", content: c[e] }],
                  })
                ).content
                  .filter((e) => "text" === e.type && "string" == typeof e.text)
                  .map((e) => e.text)
                  .join("\n")
                  .trim(),
                a = (function (e, t) {
                  if (!e || "object" != typeof e) return null;
                  let r = "string" == typeof e.summary ? e.summary.trim() : "",
                    i =
                      "string" == typeof e.topRecommendation
                        ? e.topRecommendation.trim()
                        : "",
                    o = (function (e) {
                      if (!Array.isArray(e)) return [];
                      let t = e
                        .map((e, t) => {
                          var r;
                          if (!e || "object" != typeof e) return null;
                          let i =
                              "string" == typeof e.title ? e.title.trim() : "",
                            o =
                              "string" == typeof e.description
                                ? e.description.trim()
                                : "";
                          if (!i || !o) return null;
                          let s = e.outputMetric,
                            a = e.confidence,
                            n =
                              "number" == typeof e.delta &&
                              Number.isFinite(e.delta)
                                ? e.delta
                                : 0;
                          return {
                            id:
                              "string" == typeof e.id && e.id.trim()
                                ? e.id
                                : ((r = `correlation-${t + 1}`),
                                  i
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, "-")
                                    .replace(/^-+|-+$/g, "") || r),
                            emoji:
                              "string" == typeof e.emoji && e.emoji.trim()
                                ? e.emoji
                                : "\uD83D\uDCCA",
                            title: i,
                            description: o,
                            inputFactors: Array.isArray(e.inputFactors)
                              ? e.inputFactors.filter(
                                  (e) =>
                                    "string" == typeof e && e.trim().length > 0,
                                )
                              : [],
                            outputMetric:
                              "focus" === s || "energy" === s || "tasks" === s
                                ? s
                                : "focus",
                            delta: n,
                            confidence:
                              "low" === a || "medium" === a || "high" === a
                                ? a
                                : "medium",
                            isKeystone: !!e.isKeystone,
                          };
                        })
                        .filter(Boolean);
                      return 0 === t.length
                        ? []
                        : 1 === t.filter((e) => e.isKeystone).length
                          ? t
                          : t.map((e, t) => ({ ...e, isKeystone: 0 === t }));
                    })(e.correlations);
                  return r && i && 0 !== o.length
                    ? {
                        summary: r,
                        correlations: o,
                        topRecommendation: i,
                        weeklyTrends: (function (e, t) {
                          if (!Array.isArray(e)) return C(t);
                          let r = e
                            .map((e) => {
                              if (!e || "object" != typeof e) return null;
                              let t =
                                "string" == typeof e.date && e.date.trim()
                                  ? e.date
                                  : "";
                              return t
                                ? {
                                    date: t,
                                    dayLabel:
                                      "string" == typeof e.dayLabel &&
                                      e.dayLabel.trim()
                                        ? e.dayLabel
                                        : T(t),
                                    focusRating:
                                      "number" == typeof e.focusRating &&
                                      Number.isFinite(e.focusRating)
                                        ? e.focusRating
                                        : 0,
                                    energyRating:
                                      "number" == typeof e.energyRating &&
                                      Number.isFinite(e.energyRating)
                                        ? e.energyRating
                                        : 0,
                                    tasksCompleted:
                                      "number" == typeof e.tasksCompleted &&
                                      Number.isFinite(e.tasksCompleted)
                                        ? e.tasksCompleted
                                        : 0,
                                  }
                                : null;
                            })
                            .filter(Boolean);
                          return 7 === r.length ? r : C(t);
                        })(e.weeklyTrends, t),
                        generatedAt:
                          "number" == typeof e.generatedAt &&
                          Number.isFinite(e.generatedAt)
                            ? e.generatedAt
                            : Date.now(),
                      }
                    : null;
                })(
                  (function (e) {
                    let t = e
                      .replace(/^```(?:json)?\s*/i, "")
                      .replace(/\s*```$/i, "")
                      .trim();
                    if (!t) return null;
                    let r = new Set([t]),
                      i = (function (e) {
                        let t = -1,
                          r = 0,
                          i = !1,
                          o = !1;
                        for (let s = 0; s < e.length; s++) {
                          let a = e[s];
                          if (-1 === t) {
                            "{" === a && ((t = s), (r = 1));
                            continue;
                          }
                          if (o) {
                            o = !1;
                            continue;
                          }
                          if ("\\" === a && i) {
                            o = !0;
                            continue;
                          }
                          if ('"' === a) {
                            i = !i;
                            continue;
                          }
                          if (
                            !i &&
                            ("{" === a && r++, "}" === a && r--, 0 === r)
                          )
                            return e.slice(t, s + 1);
                        }
                        return null;
                      })(t);
                    i && r.add(i);
                    let o = t.indexOf("{"),
                      s = t.lastIndexOf("}");
                    for (let e of (-1 !== o &&
                      s > o &&
                      r.add(t.slice(o, s + 1)),
                    Array.from(r)))
                      try {
                        return JSON.parse(
                          e.replace(/,\s*([}\]])/g, "$1").trim(),
                        );
                      } catch {
                        continue;
                      }
                    return null;
                  })(i),
                  t,
                );
              if (a) return n.NextResponse.json(a);
            }
            return n.NextResponse.json(
              {
                error:
                  "The AI returned an incomplete insights response. Please try again.",
              },
              { status: 502 },
            );
          } catch (e) {
            return (
              console.error("[/api/insights] error:", e),
              n.NextResponse.json(
                {
                  error:
                    e instanceof Error ? e.message : "Internal server error",
                },
                { status: 500 },
              )
            );
          }
        }
        let L = new o.AppRouteRouteModule({
            definition: {
              kind: s.RouteKind.APP_ROUTE,
              page: "/api/insights/route",
              pathname: "/api/insights",
              filename: "route",
              bundlePath: "app/api/insights/route",
            },
            resolvedPagePath:
              "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/api/insights/route.ts",
            nextConfigOutput: "",
            userland: i,
          }),
          { workAsyncStorage: D, workUnitAsyncStorage: H, serverHooks: I } = L;
        function j() {
          return (0, a.patchFetch)({
            workAsyncStorage: D,
            workUnitAsyncStorage: H,
          });
        }
      },
      96487: () => {},
    }));
  var t = require("../../../webpack-runtime.js");
  t.C(e);
  var r = (e) => t((t.s = e)),
    i = t.X(0, [447, 580, 290], () => r(86776));
  module.exports = i;
})();
