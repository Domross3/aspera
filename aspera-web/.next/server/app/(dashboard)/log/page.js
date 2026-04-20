(() => {
  var e = {};
  ((e.id = 495),
    (e.ids = [495]),
    (e.modules = {
      2742: (e, t, s) => {
        "use strict";
        (s.r(t),
          s.d(t, {
            GlobalError: () => o.a,
            __next_app__: () => u,
            pages: () => c,
            routeModule: () => x,
            tree: () => d,
          }));
        var n = s(65239),
          r = s(48088),
          a = s(88170),
          o = s.n(a),
          i = s(30893),
          l = {};
        for (let e in i)
          0 >
            [
              "default",
              "tree",
              "pages",
              "GlobalError",
              "__next_app__",
              "routeModule",
            ].indexOf(e) && (l[e] = () => i[e]);
        s.d(t, l);
        let d = {
            children: [
              "",
              {
                children: [
                  "(dashboard)",
                  {
                    children: [
                      "log",
                      {
                        children: [
                          "__PAGE__",
                          {},
                          {
                            page: [
                              () => Promise.resolve().then(s.bind(s, 85872)),
                              "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/log/page.tsx",
                            ],
                          },
                        ],
                      },
                      {},
                    ],
                  },
                  {
                    layout: [
                      () => Promise.resolve().then(s.bind(s, 71934)),
                      "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/layout.tsx",
                    ],
                    "not-found": [
                      () => Promise.resolve().then(s.t.bind(s, 57398, 23)),
                      "next/dist/client/components/not-found-error",
                    ],
                    forbidden: [
                      () => Promise.resolve().then(s.t.bind(s, 89999, 23)),
                      "next/dist/client/components/forbidden-error",
                    ],
                    unauthorized: [
                      () => Promise.resolve().then(s.t.bind(s, 65284, 23)),
                      "next/dist/client/components/unauthorized-error",
                    ],
                  },
                ],
              },
              {
                layout: [
                  () => Promise.resolve().then(s.bind(s, 58014)),
                  "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/layout.tsx",
                ],
                "not-found": [
                  () => Promise.resolve().then(s.t.bind(s, 57398, 23)),
                  "next/dist/client/components/not-found-error",
                ],
                forbidden: [
                  () => Promise.resolve().then(s.t.bind(s, 89999, 23)),
                  "next/dist/client/components/forbidden-error",
                ],
                unauthorized: [
                  () => Promise.resolve().then(s.t.bind(s, 65284, 23)),
                  "next/dist/client/components/unauthorized-error",
                ],
              },
            ],
          }.children,
          c = [
            "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/log/page.tsx",
          ],
          u = { require: s, loadChunk: () => Promise.resolve() },
          x = new n.AppPageRouteModule({
            definition: {
              kind: r.RouteKind.APP_PAGE,
              page: "/(dashboard)/log/page",
              pathname: "/log",
              bundlePath: "",
              filename: "",
              appPaths: [],
            },
            userland: { loaderTree: d },
          });
      },
      3295: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");
      },
      6024: (e, t, s) => {
        Promise.resolve().then(s.bind(s, 85872));
      },
      10846: (e) => {
        "use strict";
        e.exports = require("next/dist/compiled/next-server/app-page.runtime.prod.js");
      },
      14590: (e, t, s) => {
        "use strict";
        s.d(t, { j: () => i });
        var n = s(43210),
          r = s(78259),
          a = s(26614),
          o = s(15256);
        function i() {
          let [e, t] = (0, n.useState)(null),
            [s, i] = (0, n.useState)([]),
            [l, d] = (0, n.useState)(!0),
            [c, u] = (0, n.useState)({
              weekStartDate: "",
              reservesUsed: 0,
              reserveDates: [],
            }),
            x = (0, n.useCallback)(async () => {
              await (0, a.W7)();
              let [e, s, n] = await Promise.all([
                (0, a.XE)((0, o.R)()),
                (0, a.Zx)(7),
                (0, a.Ii)(),
              ]);
              (t(e), i(s), u(n), d(!1));
            }, []),
            m = (0, n.useCallback)(async (e) => {
              (await (0, a.ss)(e),
                t(e),
                i((t) => {
                  let s = t.filter((t) => t.id !== e.id);
                  return [e, ...s].slice(0, 7);
                }));
            }, []),
            { streak: p, reservesUsedInStreak: h } = (() => {
              let t = 0,
                n = 0,
                a = (0, o.R)(),
                i = new Set(
                  (e ? [e, ...s.filter((e) => e.id !== a)] : s).map(
                    (e) => e.id,
                  ),
                );
              for (let e = 0; e < 14; e++) {
                let s = new Date();
                s.setDate(s.getDate() - e);
                let a = s.toISOString().split("T")[0];
                if (i.has(a)) t++;
                else if (n < c.reservesUsed) (n++, t++);
                else if (n < r.eO) (n++, t++);
                else break;
              }
              return { streak: t, reservesUsedInStreak: n };
            })(),
            b = r.eO - c.reservesUsed;
          return {
            todayLog: e,
            recentLogs: s,
            loading: l,
            save: m,
            reload: x,
            streak: p,
            reserves: c,
            reservesRemaining: b,
            reservesUsedInStreak: h,
          };
        }
      },
      19121: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/action-async-storage.external.js");
      },
      23453: (e, t, s) => {
        "use strict";
        (s.r(t), s.d(t, { default: () => E }));
        var n = s(60687),
          r = s(43210),
          a = s(14590),
          o = s(15256),
          i = s(31357),
          l = s(2643);
        function d({ value: e, onChange: t }) {
          let [s, a] = (0, r.useState)(""),
            o = () => {
              let n = s.trim();
              n && !(e.length >= 3) && (t([...e, n]), a(""));
            },
            i = (s) => {
              t(e.filter((e, t) => t !== s));
            };
          return (0, n.jsxs)("div", {
            className: "space-y-3",
            children: [
              (0, n.jsx)("div", {
                className: "flex flex-col gap-2",
                children: e.map((e, t) =>
                  (0, n.jsxs)(
                    "div",
                    {
                      className:
                        "flex items-center gap-2 bg-elevated rounded-md px-3 py-2 border border-border group",
                      children: [
                        (0, n.jsxs)("span", {
                          className: "text-accent text-sm font-bold w-4",
                          children: [t + 1, "."],
                        }),
                        (0, n.jsx)("span", {
                          className: "flex-1 text-sm text-text",
                          children: e,
                        }),
                        (0, n.jsx)("button", {
                          type: "button",
                          onClick: () => i(t),
                          className:
                            "text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none",
                          children: "\xd7",
                        }),
                      ],
                    },
                    t,
                  ),
                ),
              }),
              e.length < 3 &&
                (0, n.jsxs)("div", {
                  className: "flex gap-2",
                  children: [
                    (0, n.jsx)("input", {
                      type: "text",
                      value: s,
                      onChange: (e) => a(e.target.value),
                      onKeyDown: (e) => {
                        "Enter" === e.key && (e.preventDefault(), o());
                      },
                      placeholder:
                        0 === e.length
                          ? "Most important task today…"
                          : "Add another…",
                      className:
                        "flex-1 bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors",
                    }),
                    (0, n.jsx)("button", {
                      type: "button",
                      onClick: o,
                      disabled: !s.trim(),
                      className:
                        "px-4 py-2 rounded-md bg-accent/20 text-accent border border-accent/30 text-sm font-medium hover:bg-accent/30 disabled:opacity-40 transition-colors",
                      children: "Add",
                    }),
                  ],
                }),
              (0, n.jsxs)("p", {
                className: "text-xs text-text-muted",
                children: [e.length, "/3 big rocks"],
              }),
            ],
          });
        }
        function c({
          label: e,
          value: t,
          onChange: s,
          min: r = 1,
          max: a = 10,
          step: o = 1,
          emoji: i,
          colorClass: l = "accent",
        }) {
          let d = ((t - r) / (a - r)) * 100;
          return (0, n.jsxs)("div", {
            className: "space-y-2",
            children: [
              (0, n.jsxs)("div", {
                className: "flex justify-between items-center",
                children: [
                  (0, n.jsxs)("span", {
                    className: "text-sm text-text-secondary",
                    children: [
                      i &&
                        (0, n.jsx)("span", { className: "mr-1", children: i }),
                      e,
                    ],
                  }),
                  (0, n.jsx)("span", {
                    className: `text-lg font-bold text-${l}`,
                    children: t,
                  }),
                ],
              }),
              (0, n.jsx)("div", {
                className: "relative",
                children: (0, n.jsx)("input", {
                  type: "range",
                  min: r,
                  max: a,
                  step: o,
                  value: t,
                  onChange: (e) => s(Number(e.target.value)),
                  className:
                    "w-full h-1.5 rounded-pill appearance-none cursor-pointer",
                  style: {
                    background: `linear-gradient(to right, #6C63FF ${d}%, #1C2535 ${d}%)`,
                  },
                }),
              }),
              (0, n.jsxs)("div", {
                className: "flex justify-between text-xs text-text-muted",
                children: [
                  (0, n.jsx)("span", { children: r }),
                  (0, n.jsx)("span", { children: a }),
                ],
              }),
            ],
          });
        }
        function u({ value: e, onChange: t }) {
          return (0, n.jsxs)("div", {
            className: "space-y-3",
            children: [
              (0, n.jsx)(c, {
                label: "Hours of sleep",
                value: e,
                onChange: t,
                min: 0,
                max: 12,
                step: 0.5,
                emoji: "\uD83D\uDE34",
              }),
              (0, n.jsx)("p", {
                className: "text-xs text-text-muted",
                children:
                  e >= 8
                    ? "Great! Well rested."
                    : e >= 6
                      ? "Decent, but aim for 7–9h"
                      : e > 0
                        ? "Low — may impact performance"
                        : "",
              }),
            ],
          });
        }
        function x({ value: e, onChange: t }) {
          return (0, n.jsx)(c, {
            label: "Minutes of daylight",
            value: e,
            onChange: t,
            min: 0,
            max: 120,
            step: 5,
            emoji: "☀️",
          });
        }
        function m({
          options: e,
          selected: t,
          onChange: s,
          multi: r = !1,
          capitalize: a = !0,
        }) {
          let o = (e) => {
            r
              ? s(t.includes(e) ? t.filter((t) => t !== e) : [...t, e])
              : s(t.includes(e) ? [] : [e]);
          };
          return (0, n.jsx)("div", {
            className: "flex flex-wrap gap-2",
            children: e.map((e) => {
              let s = t.includes(e);
              return (0, n.jsx)(
                "button",
                {
                  type: "button",
                  onClick: () => o(e),
                  className: `
              px-3 py-1.5 rounded-pill text-sm font-medium transition-all duration-150
              ${s ? "bg-accent text-white shadow-glow-sm" : "bg-elevated text-text-secondary border border-border hover:border-border-accent hover:text-text"}
            `,
                  children: a ? e.charAt(0).toUpperCase() + e.slice(1) : e,
                },
                e,
              );
            }),
          });
        }
        let p = ["none", "espresso", "drip", "matcha"],
          h = { none: 0, espresso: 150, drip: 100, matcha: 70 };
        function b({ type: e, amount: t, onChange: s }) {
          return (0, n.jsxs)("div", {
            className: "space-y-4",
            children: [
              (0, n.jsx)(m, {
                options: p,
                selected: [e],
                onChange: (e) => {
                  let t = e[0] ?? "none",
                    n = h[t] ?? 0;
                  s(t, n);
                },
                multi: !1,
              }),
              "none" !== e &&
                (0, n.jsx)(c, {
                  label: "Caffeine (mg)",
                  value: t,
                  onChange: (t) => s(e, t),
                  min: 0,
                  max: 400,
                  step: 25,
                  emoji: "☕",
                }),
            ],
          });
        }
        let g = ["none", "run", "lift", "yoga", "walk", "hiit"];
        function f({ type: e, intensity: t, onChange: s }) {
          return (0, n.jsxs)("div", {
            className: "space-y-4",
            children: [
              (0, n.jsx)(m, {
                options: g,
                selected: [e],
                onChange: (n) => s(n[0] ?? "none", "none" === e ? 0 : t),
                multi: !1,
              }),
              "none" !== e &&
                (0, n.jsx)(c, {
                  label: "Intensity",
                  value: t,
                  onChange: (t) => s(e, t),
                  min: 1,
                  max: 10,
                  emoji: "\uD83D\uDCAA",
                }),
            ],
          });
        }
        let j = [
          "none",
          "lofi",
          "classical",
          "hiphop",
          "edm",
          "rock",
          "ambient",
          "jazz",
          "podcast",
        ];
        function v({ selected: e, onChange: t }) {
          return (0, n.jsx)(m, {
            options: j,
            selected: e,
            onChange: (e) => t(e),
            multi: !0,
          });
        }
        let y = { 1: "Poor", 2: "Fair", 3: "Okay", 4: "Good", 5: "Excellent" };
        function C({ mealQuality: e, hydration: t, onChange: s }) {
          return (0, n.jsxs)("div", {
            className: "space-y-4",
            children: [
              (0, n.jsx)("div", {
                className: "space-y-2",
                children: (0, n.jsx)(c, {
                  label: `Meal quality — ${y[e] ?? ""}`,
                  value: e,
                  onChange: (e) => s(e, t),
                  min: 1,
                  max: 5,
                  emoji: "\uD83E\uDD57",
                }),
              }),
              (0, n.jsx)(c, {
                label: "Hydration (glasses)",
                value: t,
                onChange: (t) => s(e, t),
                min: 0,
                max: 12,
                step: 1,
                emoji: "\uD83D\uDCA7",
              }),
            ],
          });
        }
        function k({ value: e, onChange: t }) {
          return (0, n.jsx)("div", {
            className: "space-y-2",
            children: (0, n.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [
                (0, n.jsx)("span", {
                  className: "text-sm text-text-secondary",
                  children: "\uD83C\uDF77 Alcoholic drinks",
                }),
                (0, n.jsxs)("div", {
                  className: "flex items-center gap-3",
                  children: [
                    (0, n.jsx)("button", {
                      type: "button",
                      onClick: () => t(Math.max(0, e - 1)),
                      className:
                        "w-8 h-8 rounded-full bg-elevated border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors flex items-center justify-center text-lg",
                      children: "−",
                    }),
                    (0, n.jsx)("span", {
                      className: `text-xl font-bold w-6 text-center ${e > 2 ? "text-warning" : e > 0 ? "text-text" : "text-text-muted"}`,
                      children: e,
                    }),
                    (0, n.jsx)("button", {
                      type: "button",
                      onClick: () => t(Math.min(12, e + 1)),
                      className:
                        "w-8 h-8 rounded-full bg-elevated border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors flex items-center justify-center text-lg",
                      children: "+",
                    }),
                  ],
                }),
              ],
            }),
          });
        }
        let w = [
          "Cold Shower",
          "Sunlight",
          "Meditation",
          "Journaling",
          "No Phone AM",
          "Social",
          "Alcohol",
          "Poor Sleep",
          "Nap",
        ];
        function N({ tags: e, onChange: t }) {
          let [s, a] = (0, r.useState)(""),
            o = (s) => {
              t(e.includes(s) ? e.filter((e) => e !== s) : [...e, s]);
            },
            i = () => {
              let n = s.trim();
              !n || e.includes(n) || (t([...e, n]), a(""));
            },
            l = e.filter((e) => !w.includes(e));
          return (0, n.jsxs)("div", {
            className: "space-y-3",
            children: [
              (0, n.jsxs)("div", {
                className: "flex flex-wrap gap-2",
                children: [
                  w.map((t) => {
                    let s = e.includes(t);
                    return (0, n.jsx)(
                      "button",
                      {
                        type: "button",
                        onClick: () => o(t),
                        className: `px-3 py-1.5 rounded-pill text-sm font-medium transition-all duration-150 ${s ? "bg-accent text-white shadow-glow-sm" : "bg-elevated text-text-secondary border border-border hover:border-border-accent hover:text-text"}`,
                        children: t,
                      },
                      t,
                    );
                  }),
                  l.map((e) =>
                    (0, n.jsxs)(
                      "span",
                      {
                        className:
                          "inline-flex items-center gap-1 px-3 py-1.5 rounded-pill text-sm font-medium bg-accent text-white",
                        children: [
                          e,
                          (0, n.jsx)("button", {
                            type: "button",
                            onClick: () => o(e),
                            className: "hover:text-white/70 ml-1",
                            children: "\xd7",
                          }),
                        ],
                      },
                      e,
                    ),
                  ),
                ],
              }),
              (0, n.jsxs)("div", {
                className: "flex gap-2",
                children: [
                  (0, n.jsx)("input", {
                    type: "text",
                    value: s,
                    onChange: (e) => a(e.target.value),
                    onKeyDown: (e) => {
                      "Enter" === e.key && (e.preventDefault(), i());
                    },
                    placeholder: "Custom tag…",
                    className:
                      "flex-1 bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors",
                  }),
                  (0, n.jsx)("button", {
                    type: "button",
                    onClick: i,
                    disabled: !s.trim(),
                    className:
                      "px-3 py-2 rounded-md bg-elevated border border-border text-text-secondary text-sm hover:border-accent hover:text-accent disabled:opacity-40 transition-colors",
                    children: "+ Add",
                  }),
                ],
              }),
            ],
          });
        }
        function D() {
          let e = (0, o.R)();
          return {
            id: e,
            date: e,
            createdAt: Date.now(),
            caffeine: { type: "none", amount: 0 },
            workout: { type: "none", intensity: 0 },
            music: [],
            nutrition: { mealQuality: 3, hydration: 6 },
            drinks: 0,
            sleepHours: 7,
            daylightMinutes: 30,
            customMetrics: [],
            output: { tasksCompleted: 0, focusRating: 5, energyRating: 5 },
            tags: [],
            bigRocks: [],
          };
        }
        let S = {
          bigRocks: "Big Rocks \uD83E\uDEA8",
          sleep: "Sleep \uD83D\uDE34",
          daylight: "Daylight ☀️",
          caffeine: "Caffeine ☕",
          workout: "Workout \uD83D\uDCAA",
          music: "Music \uD83C\uDFB5",
          nutrition: "Nutrition \uD83E\uDD57",
          drinks: "Alcohol \uD83C\uDF77",
          output: "Performance Output \uD83D\uDCCA",
          tags: "Tags \uD83C\uDFF7️",
        };
        function E() {
          let { todayLog: e, save: t, loading: s } = (0, a.j)(),
            [o, m] = (0, r.useState)(D),
            [p, h] = (0, r.useState)(!1),
            [g, j] = (0, r.useState)(!1);
          if (s)
            return (0, n.jsx)("div", {
              className: "flex items-center justify-center h-screen",
              children: (0, n.jsx)("span", {
                className:
                  "w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin",
              }),
            });
          let y = async () => {
              (j(!0),
                await t({ ...o, createdAt: e?.createdAt ?? Date.now() }),
                j(!1),
                h(!0),
                setTimeout(() => h(!1), 2e3));
            },
            w = new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            });
          return (0, n.jsxs)("div", {
            className: "max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-4",
            children: [
              (0, n.jsxs)("div", {
                className: "flex items-center justify-between",
                children: [
                  (0, n.jsxs)("div", {
                    children: [
                      (0, n.jsx)("h1", {
                        className: "text-xl font-bold text-text",
                        children: "Daily Log",
                      }),
                      (0, n.jsx)("p", {
                        className: "text-sm text-text-secondary",
                        children: w,
                      }),
                    ],
                  }),
                  e &&
                    (0, n.jsx)("span", {
                      className:
                        "text-xs px-2 py-1 rounded-pill bg-success/20 text-success border border-success/30",
                      children: "Logged today",
                    }),
                ],
              }),
              (0, n.jsxs)(i.h, {
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                    children: S.bigRocks,
                  }),
                  (0, n.jsx)(d, {
                    value: o.bigRocks,
                    onChange: (e) => m((t) => ({ ...t, bigRocks: e })),
                  }),
                ],
              }),
              (0, n.jsxs)(i.h, {
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "text-xs font-bold uppercase tracking-widest text-text-muted mb-4",
                    children: S.sleep,
                  }),
                  (0, n.jsx)(u, {
                    value: o.sleepHours,
                    onChange: (e) => m((t) => ({ ...t, sleepHours: e })),
                  }),
                  (0, n.jsxs)("div", {
                    className: "mt-4",
                    children: [
                      (0, n.jsx)("div", {
                        className:
                          "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                        children: S.daylight,
                      }),
                      (0, n.jsx)(x, {
                        value: o.daylightMinutes,
                        onChange: (e) =>
                          m((t) => ({ ...t, daylightMinutes: e })),
                      }),
                    ],
                  }),
                ],
              }),
              (0, n.jsxs)(i.h, {
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                    children: S.caffeine,
                  }),
                  (0, n.jsx)(b, {
                    type: o.caffeine.type,
                    amount: o.caffeine.amount,
                    onChange: (e, t) =>
                      m((s) => ({ ...s, caffeine: { type: e, amount: t } })),
                  }),
                ],
              }),
              (0, n.jsxs)(i.h, {
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                    children: S.workout,
                  }),
                  (0, n.jsx)(f, {
                    type: o.workout.type,
                    intensity: o.workout.intensity,
                    onChange: (e, t) =>
                      m((s) => ({ ...s, workout: { type: e, intensity: t } })),
                  }),
                ],
              }),
              (0, n.jsxs)(i.h, {
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                    children: S.music,
                  }),
                  (0, n.jsx)(v, {
                    selected: o.music,
                    onChange: (e) => m((t) => ({ ...t, music: e })),
                  }),
                ],
              }),
              (0, n.jsxs)(i.h, {
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                    children: S.nutrition,
                  }),
                  (0, n.jsx)(C, {
                    mealQuality: o.nutrition.mealQuality,
                    hydration: o.nutrition.hydration,
                    onChange: (e, t) =>
                      m((s) => ({
                        ...s,
                        nutrition: { mealQuality: e, hydration: t },
                      })),
                  }),
                ],
              }),
              (0, n.jsxs)(i.h, {
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                    children: S.drinks,
                  }),
                  (0, n.jsx)(k, {
                    value: o.drinks,
                    onChange: (e) => m((t) => ({ ...t, drinks: e })),
                  }),
                ],
              }),
              (0, n.jsxs)(i.h, {
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "text-xs font-bold uppercase tracking-widest text-text-muted mb-4",
                    children: S.output,
                  }),
                  (0, n.jsxs)("div", {
                    className: "space-y-4",
                    children: [
                      (0, n.jsx)(c, {
                        label: "Focus rating",
                        value: o.output.focusRating,
                        onChange: (e) =>
                          m((t) => ({
                            ...t,
                            output: { ...t.output, focusRating: e },
                          })),
                        emoji: "\uD83C\uDFAF",
                      }),
                      (0, n.jsx)(c, {
                        label: "Energy rating",
                        value: o.output.energyRating,
                        onChange: (e) =>
                          m((t) => ({
                            ...t,
                            output: { ...t.output, energyRating: e },
                          })),
                        emoji: "⚡",
                      }),
                      (0, n.jsx)(c, {
                        label: "Tasks completed",
                        value: o.output.tasksCompleted,
                        onChange: (e) =>
                          m((t) => ({
                            ...t,
                            output: { ...t.output, tasksCompleted: e },
                          })),
                        min: 0,
                        max: 20,
                        emoji: "✅",
                      }),
                    ],
                  }),
                ],
              }),
              (0, n.jsxs)(i.h, {
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                    children: S.tags,
                  }),
                  (0, n.jsx)(N, {
                    tags: o.tags,
                    onChange: (e) => m((t) => ({ ...t, tags: e })),
                  }),
                ],
              }),
              (0, n.jsx)("div", {
                className: "sticky bottom-20 md:bottom-4 pt-2",
                children: (0, n.jsx)(l.$, {
                  variant: "primary",
                  size: "lg",
                  className: "w-full",
                  onClick: y,
                  loading: g,
                  children: p ? "✓ Saved!" : "Save Today's Log",
                }),
              }),
            ],
          });
        }
      },
      29294: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/work-async-storage.external.js");
      },
      33873: (e) => {
        "use strict";
        e.exports = require("path");
      },
      63033: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");
      },
      69576: (e, t, s) => {
        Promise.resolve().then(s.bind(s, 23453));
      },
      85872: (e, t, s) => {
        "use strict";
        (s.r(t), s.d(t, { default: () => n }));
        let n = (0, s(12907).registerClientReference)(
          function () {
            throw Error(
              "Attempted to call the default export of \"/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/log/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.",
            );
          },
          "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/log/page.tsx",
          "default",
        );
      },
    }));
  var t = require("../../../webpack-runtime.js");
  t.C(e);
  var s = (e) => t((t.s = e)),
    n = t.X(0, [447, 825, 418, 691], () => s(2742));
  module.exports = n;
})();
