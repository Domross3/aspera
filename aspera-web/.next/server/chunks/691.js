((exports.id = 691),
  (exports.ids = [691]),
  (exports.modules = {
    2643: (e, t, r) => {
      "use strict";
      r.d(t, { $: () => s });
      var o = r(60687);
      function s({
        variant: e = "primary",
        size: t = "md",
        loading: r = !1,
        children: s,
        className: n = "",
        disabled: a,
        ...i
      }) {
        return (0, o.jsxs)("button", {
          className: `inline-flex items-center justify-center font-semibold rounded-pill transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed ${{ primary: "bg-accent text-white hover:bg-accent/90 active:scale-95 shadow-glow-sm", secondary: "bg-elevated text-text border border-border hover:border-border-accent hover:bg-elevated/80 active:scale-95", ghost: "text-text-secondary hover:text-text hover:bg-elevated/50 active:scale-95", danger: "bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30 active:scale-95" }[e]} ${{ sm: "px-3 py-1.5 text-sm gap-1.5", md: "px-5 py-2.5 text-sm gap-2", lg: "px-6 py-3 text-base gap-2" }[t]} ${n}`,
          disabled: a || r,
          ...i,
          children: [
            r &&
              (0, o.jsx)("span", {
                className:
                  "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin",
              }),
            s,
          ],
        });
      }
    },
    9356: (e, t, r) => {
      Promise.resolve().then(r.bind(r, 71934));
    },
    15160: () => {},
    15256: (e, t, r) => {
      "use strict";
      function o(e = new Date()) {
        let t = e.getFullYear(),
          r = String(e.getMonth() + 1).padStart(2, "0"),
          s = String(e.getDate()).padStart(2, "0");
        return `${t}-${r}-${s}`;
      }
      function s(e) {
        let t = new Date();
        return (t.setDate(t.getDate() - e), o(t));
      }
      r.d(t, { D: () => s, R: () => o });
    },
    26614: (e, t, r) => {
      "use strict";
      r.d(t, {
        ge: () => y,
        XE: () => g,
        _O: () => x,
        Zx: () => p,
        rO: () => v,
        Ii: () => w,
        LJ: () => f,
        ss: () => h,
        OF: () => b,
        W7: () => k,
      });
      var o = r(78259);
      function s(e) {
        let t = new Date();
        return (t.setDate(t.getDate() - e), t.toISOString().split("T")[0]);
      }
      function n(e, t, r = 0) {
        let o = new Date();
        return (
          o.setDate(o.getDate() - e),
          o.setHours(t, r, 0, 0),
          o.toISOString()
        );
      }
      (n(0, 9, 15),
        n(0, 9, 30),
        n(0, 10, 0),
        n(0, 14, 0),
        n(1, 8, 30),
        n(1, 9, 0),
        n(1, 10, 0),
        n(2, 11, 0),
        n(2, 14, 30),
        n(3, 9, 0),
        s(6),
        s(5),
        s(4),
        s(3),
        s(2),
        s(1),
        s(0),
        s(6),
        s(5),
        s(4),
        s(3),
        s(2),
        s(1),
        s(0),
        s(6),
        s(5),
        s(4),
        s(3),
        s(1),
        s(0),
        n(0, 9, 0),
        n(0, 9, 30),
        n(0, 10, 0),
        n(0, 13, 0),
        n(0, 13, 0),
        n(0, 14, 0),
        n(0, 15, 0),
        n(0, 16, 0),
        s(0),
        s(0),
        n(0, 11, 30),
        s(0),
        s(1),
        n(1, 20, 0),
        s(2),
        n(2, 10, 0),
        s(6),
        s(5),
        s(4),
        s(3),
        s(2),
        s(1),
        s(0),
        s(0),
        s(1),
        s(0));
      let a = {
          deep_work: "Deep Work",
          research: "Research",
          communication: "Communication",
          utility: "Utility",
          recovery: "Recovery",
          drift: "Drift",
        },
        i = {
          "github.com": "deep_work",
          "figma.com": "deep_work",
          "docs.expo.dev": "research",
          "stackoverflow.com": "research",
          "google.com": "utility",
          "youtube.com": "recovery",
          "reddit.com": "drift",
          "twitter.com": "communication",
        };
      function d(e) {
        return Math.round(e / 6e4);
      }
      var l = r(15256);
      function c(e) {
        return void 0 ?? null;
      }
      function u(e, t) {}
      function m() {
        return [];
      }
      async function h(e) {
        (o.d5.LOGS_PREFIX, e.id, JSON.stringify(e));
      }
      async function g(e) {
        let t = c(`${o.d5.LOGS_PREFIX}${e}`);
        return t ? JSON.parse(t) : null;
      }
      async function p(e = 7) {
        let t = []
          .filter((e) => e.startsWith(o.d5.LOGS_PREFIX))
          .sort()
          .reverse()
          .slice(0, e);
        return 0 === t.length
          ? []
          : t
              .map((e) => {
                let t = c(e);
                return t ? JSON.parse(t) : null;
              })
              .filter(Boolean);
      }
      async function f(e) {
        (o.d5.INSIGHTS_CACHE, JSON.stringify(e));
      }
      async function y() {
        let e = c(o.d5.INSIGHTS_CACHE);
        return e ? JSON.parse(e) : null;
      }
      async function b(e) {
        let t = (0, l.R)(new Date(e.timestamp)),
          r = `${o.d5.MOOD_PREFIX}${t}`,
          s = await x(t);
        (s.push(e), JSON.stringify(s));
      }
      async function x(e) {
        let t = c(`${o.d5.MOOD_PREFIX}${e}`);
        return t ? JSON.parse(t) : [];
      }
      async function v(e = 7) {
        let t = []
          .filter((e) => e.startsWith(o.d5.MOOD_PREFIX))
          .sort()
          .reverse()
          .slice(0, e);
        if (0 === t.length) return [];
        let r = [];
        for (let e of t) {
          let t = c(e);
          t && r.push(...JSON.parse(t));
        }
        return r.sort((e, t) => e.timestamp - t.timestamp);
      }
      async function w() {
        let e = c(o.d5.RESERVES),
          t = (function () {
            let e = new Date(),
              t = e.getDay(),
              r = new Date(e);
            return (
              r.setDate(e.getDate() - (0 === t ? 6 : t - 1)),
              (0, l.R)(r)
            );
          })();
        if (e) {
          let r = JSON.parse(e);
          if (r.weekStartDate !== t) {
            let e = { weekStartDate: t, reservesUsed: 0, reserveDates: [] };
            return (u(o.d5.RESERVES, JSON.stringify(e)), e);
          }
          return r;
        }
        let r = { weekStartDate: t, reservesUsed: 0, reserveDates: [] };
        return (u(o.d5.RESERVES, JSON.stringify(r)), r);
      }
      function S(e) {
        return (0, l.D)(e);
      }
      async function k() {
        if (!((await p(1)).length > 0)) {
          for (let e of [
            {
              id: S(6),
              date: S(6),
              createdAt: Date.now() - 5184e5,
              caffeine: { type: "espresso", amount: 150 },
              workout: { type: "lift", intensity: 8 },
              music: ["lofi"],
              nutrition: { mealQuality: 4, hydration: 8 },
              output: { tasksCompleted: 9, focusRating: 8, energyRating: 9 },
              tags: ["Cold Shower", "Sunlight"],
              bigRocks: ["Finish project proposal", "Review teammate PRs"],
              drinks: 0,
              sleepHours: 7.2,
              daylightMinutes: 65,
              customMetrics: [],
            },
            {
              id: S(5),
              date: S(5),
              createdAt: Date.now() - 432e6,
              caffeine: { type: "drip", amount: 100 },
              workout: { type: "none", intensity: 0 },
              music: ["none"],
              nutrition: { mealQuality: 2, hydration: 4 },
              output: { tasksCompleted: 4, focusRating: 5, energyRating: 4 },
              tags: ["Alcohol", "Poor Sleep"],
              bigRocks: [],
              drinks: 4,
              sleepHours: 5.5,
              daylightMinutes: 12,
              customMetrics: [],
            },
            {
              id: S(4),
              date: S(4),
              createdAt: Date.now() - 3456e5,
              caffeine: { type: "matcha", amount: 70 },
              workout: { type: "yoga", intensity: 5 },
              music: ["ambient", "classical"],
              nutrition: { mealQuality: 5, hydration: 10 },
              output: { tasksCompleted: 7, focusRating: 7, energyRating: 7 },
              tags: ["Meditation", "Journaling", "No Phone AM"],
              bigRocks: ["Deep reading session", "Meal prep"],
              drinks: 0,
              sleepHours: 8,
              daylightMinutes: 45,
              customMetrics: [],
            },
            {
              id: S(3),
              date: S(3),
              createdAt: Date.now() - 2592e5,
              caffeine: { type: "espresso", amount: 300 },
              workout: { type: "run", intensity: 7 },
              music: ["hiphop"],
              nutrition: { mealQuality: 3, hydration: 6 },
              output: { tasksCompleted: 11, focusRating: 9, energyRating: 8 },
              tags: ["Sunlight", "Cold Shower"],
              bigRocks: [
                "Ship feature branch",
                "Write unit tests",
                "Call advisor",
              ],
              drinks: 1,
              sleepHours: 6.8,
              daylightMinutes: 80,
              customMetrics: [],
            },
            {
              id: S(2),
              date: S(2),
              createdAt: Date.now() - 1728e5,
              caffeine: { type: "none", amount: 0 },
              workout: { type: "walk", intensity: 3 },
              music: ["podcast"],
              nutrition: { mealQuality: 3, hydration: 7 },
              output: { tasksCompleted: 5, focusRating: 5, energyRating: 5 },
              tags: ["Social"],
              bigRocks: [],
              drinks: 2,
              sleepHours: 7.5,
              daylightMinutes: 30,
              customMetrics: [],
            },
            {
              id: S(1),
              date: S(1),
              createdAt: Date.now() - 864e5,
              caffeine: { type: "espresso", amount: 150 },
              workout: { type: "hiit", intensity: 9 },
              music: ["edm"],
              nutrition: { mealQuality: 4, hydration: 9 },
              output: { tasksCompleted: 12, focusRating: 9, energyRating: 10 },
              tags: ["Cold Shower", "Sunlight", "No Phone AM"],
              bigRocks: ["Hackathon sprint", "Integrate Claude API"],
              drinks: 0,
              sleepHours: 6,
              daylightMinutes: 55,
              customMetrics: [],
            },
            {
              id: S(0),
              date: S(0),
              createdAt: Date.now(),
              caffeine: { type: "espresso", amount: 150 },
              workout: { type: "run", intensity: 7 },
              music: ["lofi", "ambient"],
              nutrition: { mealQuality: 4, hydration: 7 },
              output: { tasksCompleted: 8, focusRating: 8, energyRating: 7 },
              tags: ["Sunlight", "No Phone AM", "Meditation"],
              bigRocks: ["Finish hackathon MVP", "Polish UI"],
              drinks: 0,
              sleepHours: 7.8,
              daylightMinutes: 48,
              customMetrics: [],
            },
          ])
            await h(e);
          await R();
        }
      }
      async function R() {
        if (
          new Set(
            (await v(7)).map(
              (e) => new Date(e.timestamp).toISOString().split("T")[0],
            ),
          ).size >= 3
        )
          return;
        let e = [
          [
            { mood: 3, energy: 2, stress: 2, hour: 7, note: "Groggy morning" },
            {
              mood: 4,
              energy: 4,
              stress: 1,
              hour: 10,
              note: "Post-workout high",
            },
            {
              mood: 5,
              energy: 5,
              stress: 1,
              hour: 14,
              note: "Deep focus session, crushed it",
            },
            { mood: 4, energy: 3, stress: 2, hour: 21 },
          ],
          [
            {
              mood: 2,
              energy: 1,
              stress: 3,
              hour: 9,
              note: "Hangover, regret the drinks",
            },
            {
              mood: 2,
              energy: 2,
              stress: 4,
              hour: 13,
              note: "Can't focus at all",
            },
            { mood: 3, energy: 2, stress: 3, hour: 18 },
          ],
          [
            { mood: 3, energy: 3, stress: 2, hour: 7 },
            {
              mood: 4,
              energy: 4,
              stress: 1,
              hour: 11,
              note: "Yoga really helped reset",
            },
            {
              mood: 4,
              energy: 3,
              stress: 2,
              hour: 15,
              note: "Productive afternoon",
            },
            {
              mood: 5,
              energy: 3,
              stress: 1,
              hour: 20,
              note: "Journaling before bed, feel great",
            },
          ],
          [
            {
              mood: 4,
              energy: 4,
              stress: 2,
              hour: 6,
              note: "Early run, feeling alive",
            },
            { mood: 5, energy: 5, stress: 1, hour: 10, note: "In the zone" },
            {
              mood: 4,
              energy: 3,
              stress: 3,
              hour: 16,
              note: "Afternoon crash hit",
            },
            { mood: 3, energy: 2, stress: 2, hour: 22 },
          ],
          [
            { mood: 3, energy: 3, stress: 2, hour: 8 },
            {
              mood: 3,
              energy: 2,
              stress: 3,
              hour: 14,
              note: "Sluggish, no workout",
            },
            {
              mood: 4,
              energy: 3,
              stress: 2,
              hour: 19,
              note: "Social plans helped",
            },
          ],
          [
            { mood: 3, energy: 3, stress: 2, hour: 7 },
            {
              mood: 5,
              energy: 5,
              stress: 1,
              hour: 10,
              note: "HIIT crushed, endorphins flowing",
            },
            { mood: 4, energy: 4, stress: 1, hour: 14 },
            { mood: 4, energy: 3, stress: 2, hour: 20, note: "Good wind-down" },
          ],
          [
            {
              mood: 3,
              energy: 3,
              stress: 2,
              hour: 7,
              note: "Just woke up, decent sleep",
            },
            {
              mood: 4,
              energy: 4,
              stress: 1,
              hour: 10,
              note: "Morning run + espresso combo working",
            },
            {
              mood: 4,
              energy: 4,
              stress: 2,
              hour: 14,
              note: "Hackathon flow state",
            },
          ],
        ];
        for (let t = 6; t >= 0; t--) {
          let r = e[6 - t],
            o = new Date();
          o.setDate(o.getDate() - t);
          let s = (0, l.R)(o);
          for (let e of r) {
            let [t, r, o] = s.split("-").map(Number),
              n = new Date(t, r - 1, o);
            n.setHours(e.hour, Math.floor(45 * Math.random()), 0, 0);
            let a = {
              id: n.toISOString(),
              timestamp: n.getTime(),
              mood: e.mood,
              energy: e.energy,
              stress: e.stress,
              note: e.note,
            };
            await b(a);
          }
        }
      }
    },
    31357: (e, t, r) => {
      "use strict";
      r.d(t, { h: () => s });
      var o = r(60687);
      function s({ children: e, className: t = "", glowAccent: r = !1 }) {
        return (0, o.jsx)("div", {
          className: `
        bg-gradient-to-br from-elevated to-surface
        border border-border rounded-lg p-4
        ${r ? "shadow-glow border-border-accent" : "shadow-card"}
        ${t}
      `,
          children: e,
        });
      }
    },
    50008: () => {},
    56988: (e, t, r) => {
      "use strict";
      (r.r(t), r.d(t, { default: () => d }));
      var o = r(60687),
        s = r(85814),
        n = r.n(s),
        a = r(16189);
      let i = [
        { href: "/log", label: "Log", icon: "\uD83D\uDCDD" },
        { href: "/today", label: "Today", icon: "⚡" },
        { href: "/search", label: "Search", icon: "\uD83D\uDD0D" },
        { href: "/insights", label: "Insights", icon: "\uD83E\uDDE0" },
        { href: "/mood", label: "Mood", icon: "\uD83C\uDF0A" },
      ];
      function d({ children: e }) {
        let t = (0, a.usePathname)();
        return (0, o.jsxs)("div", {
          className: "flex h-screen overflow-hidden bg-background",
          children: [
            (0, o.jsxs)("aside", {
              className:
                "hidden md:flex flex-col w-56 bg-surface border-r border-border flex-shrink-0",
              children: [
                (0, o.jsxs)("div", {
                  className: "px-5 py-6 border-b border-border",
                  children: [
                    (0, o.jsx)("div", {
                      className:
                        "text-xl font-black tracking-tight bg-gradient-focus bg-clip-text text-transparent",
                      children: "Aspera",
                    }),
                    (0, o.jsx)("div", {
                      className: "text-xs text-text-muted mt-0.5",
                      children: "Personal Performance",
                    }),
                  ],
                }),
                (0, o.jsx)("nav", {
                  className: "flex-1 px-3 py-4 space-y-1",
                  children: i.map((e) => {
                    let r = t === e.href || t.startsWith(e.href + "/");
                    return (0, o.jsxs)(
                      n(),
                      {
                        href: e.href,
                        className: `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${r ? "bg-accent/15 text-accent border border-accent/20" : "text-text-secondary hover:text-text hover:bg-elevated"}`,
                        children: [
                          (0, o.jsx)("span", {
                            className: "text-base",
                            children: e.icon,
                          }),
                          e.label,
                        ],
                      },
                      e.href,
                    );
                  }),
                }),
                (0, o.jsx)("div", {
                  className: "px-5 py-4 border-t border-border",
                  children: (0, o.jsx)("div", {
                    className: "text-xs text-text-muted",
                    children: "Local-first \xb7 Private",
                  }),
                }),
              ],
            }),
            (0, o.jsxs)("main", {
              className: "flex-1 overflow-y-auto",
              children: [
                e,
                (0, o.jsx)("nav", {
                  className:
                    "md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50",
                  children: (0, o.jsx)("div", {
                    className: "flex",
                    children: i.map((e) => {
                      let r = t === e.href || t.startsWith(e.href + "/");
                      return (0, o.jsxs)(
                        n(),
                        {
                          href: e.href,
                          className: `flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-medium transition-colors ${r ? "text-accent" : "text-text-muted"}`,
                          children: [
                            (0, o.jsx)("span", {
                              className: "text-lg",
                              children: e.icon,
                            }),
                            e.label,
                          ],
                        },
                        e.href,
                      );
                    }),
                  }),
                }),
              ],
            }),
          ],
        });
      }
    },
    58014: (e, t, r) => {
      "use strict";
      (r.r(t), r.d(t, { default: () => n, metadata: () => s }));
      var o = r(37413);
      r(82704);
      let s = {
        title: "Aspera — Personal Performance",
        description: "Track your habits and unlock your patterns.",
      };
      function n({ children: e }) {
        return (0, o.jsx)("html", {
          lang: "en",
          className: "dark",
          children: (0, o.jsx)("body", {
            className: "bg-background text-text min-h-screen",
            children: e,
          }),
        });
      }
    },
    71934: (e, t, r) => {
      "use strict";
      (r.r(t), r.d(t, { default: () => o }));
      let o = (0, r(12907).registerClientReference)(
        function () {
          throw Error(
            "Attempted to call the default export of \"/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/layout.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.",
          );
        },
        "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/layout.tsx",
        "default",
      );
    },
    78259: (e, t, r) => {
      "use strict";
      r.d(t, {
        Ur: () => o,
        d5: () => a,
        eO: () => i,
        jx: () => n,
        rd: () => s,
      });
      let o = {
          1: "\uD83D\uDE1E",
          2: "\uD83D\uDE15",
          3: "\uD83D\uDE10",
          4: "\uD83D\uDE42",
          5: "\uD83D\uDE04",
        },
        s = {
          1: "\uD83E\uDEAB",
          2: "\uD83D\uDE34",
          3: "⚡",
          4: "\uD83D\uDD25",
          5: "\uD83D\uDE80",
        },
        n = {
          1: "\uD83D\uDE0C",
          2: "\uD83E\uDDD8",
          3: "\uD83D\uDE24",
          4: "\uD83D\uDE30",
          5: "\uD83E\uDD2F",
        },
        a = {
          LOGS_PREFIX: "aspera_log_",
          SETTINGS: "aspera_settings",
          INSIGHTS_CACHE: "aspera_insights_cache",
          TODAY_REC_PREFIX: "aspera_today_rec_",
          MOOD_PREFIX: "aspera_mood_",
          RESERVES: "aspera_emergency_reserves",
          INTEGRATION_CONNECTIONS: "aspera_integration_connections",
          INTEGRATION_SUMMARIES: "aspera_integration_summaries",
        },
        i = 2;
    },
    82704: () => {},
    86684: (e, t, r) => {
      (Promise.resolve().then(r.t.bind(r, 16444, 23)),
        Promise.resolve().then(r.t.bind(r, 16042, 23)),
        Promise.resolve().then(r.t.bind(r, 88170, 23)),
        Promise.resolve().then(r.t.bind(r, 49477, 23)),
        Promise.resolve().then(r.t.bind(r, 29345, 23)),
        Promise.resolve().then(r.t.bind(r, 12089, 23)),
        Promise.resolve().then(r.t.bind(r, 46577, 23)),
        Promise.resolve().then(r.t.bind(r, 31307, 23)));
    },
    96204: (e, t, r) => {
      Promise.resolve().then(r.bind(r, 56988));
    },
    96412: (e, t, r) => {
      (Promise.resolve().then(r.t.bind(r, 86346, 23)),
        Promise.resolve().then(r.t.bind(r, 27924, 23)),
        Promise.resolve().then(r.t.bind(r, 35656, 23)),
        Promise.resolve().then(r.t.bind(r, 40099, 23)),
        Promise.resolve().then(r.t.bind(r, 38243, 23)),
        Promise.resolve().then(r.t.bind(r, 28827, 23)),
        Promise.resolve().then(r.t.bind(r, 62763, 23)),
        Promise.resolve().then(r.t.bind(r, 97173, 23)));
    },
  }));
