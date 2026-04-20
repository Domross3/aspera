(() => {
  var e = {};
  ((e.id = 788),
    (e.ids = [788]),
    (e.modules = {
      3295: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");
      },
      3935: (e, t, s) => {
        "use strict";
        (s.r(t), s.d(t, { default: () => a }));
        let a = (0, s(12907).registerClientReference)(
          function () {
            throw Error(
              "Attempted to call the default export of \"/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/today/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.",
            );
          },
          "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/today/page.tsx",
          "default",
        );
      },
      10846: (e) => {
        "use strict";
        e.exports = require("next/dist/compiled/next-server/app-page.runtime.prod.js");
      },
      14590: (e, t, s) => {
        "use strict";
        s.d(t, { j: () => d });
        var a = s(43210),
          r = s(78259),
          n = s(26614),
          i = s(15256);
        function d() {
          let [e, t] = (0, a.useState)(null),
            [s, d] = (0, a.useState)([]),
            [o, l] = (0, a.useState)(!0),
            [c, x] = (0, a.useState)({
              weekStartDate: "",
              reservesUsed: 0,
              reserveDates: [],
            }),
            m = (0, a.useCallback)(async () => {
              await (0, n.W7)();
              let [e, s, a] = await Promise.all([
                (0, n.XE)((0, i.R)()),
                (0, n.Zx)(7),
                (0, n.Ii)(),
              ]);
              (t(e), d(s), x(a), l(!1));
            }, []),
            u = (0, a.useCallback)(async (e) => {
              (await (0, n.ss)(e),
                t(e),
                d((t) => {
                  let s = t.filter((t) => t.id !== e.id);
                  return [e, ...s].slice(0, 7);
                }));
            }, []),
            { streak: p, reservesUsedInStreak: h } = (() => {
              let t = 0,
                a = 0,
                n = (0, i.R)(),
                d = new Set(
                  (e ? [e, ...s.filter((e) => e.id !== n)] : s).map(
                    (e) => e.id,
                  ),
                );
              for (let e = 0; e < 14; e++) {
                let s = new Date();
                s.setDate(s.getDate() - e);
                let n = s.toISOString().split("T")[0];
                if (d.has(n)) t++;
                else if (a < c.reservesUsed) (a++, t++);
                else if (a < r.eO) (a++, t++);
                else break;
              }
              return { streak: t, reservesUsedInStreak: a };
            })(),
            b = r.eO - c.reservesUsed;
          return {
            todayLog: e,
            recentLogs: s,
            loading: o,
            save: u,
            reload: m,
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
      29294: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/work-async-storage.external.js");
      },
      29315: (e, t, s) => {
        Promise.resolve().then(s.bind(s, 3935));
      },
      32402: (e, t, s) => {
        "use strict";
        (s.r(t),
          s.d(t, {
            GlobalError: () => i.a,
            __next_app__: () => x,
            pages: () => c,
            routeModule: () => m,
            tree: () => l,
          }));
        var a = s(65239),
          r = s(48088),
          n = s(88170),
          i = s.n(n),
          d = s(30893),
          o = {};
        for (let e in d)
          0 >
            [
              "default",
              "tree",
              "pages",
              "GlobalError",
              "__next_app__",
              "routeModule",
            ].indexOf(e) && (o[e] = () => d[e]);
        s.d(t, o);
        let l = {
            children: [
              "",
              {
                children: [
                  "(dashboard)",
                  {
                    children: [
                      "today",
                      {
                        children: [
                          "__PAGE__",
                          {},
                          {
                            page: [
                              () => Promise.resolve().then(s.bind(s, 3935)),
                              "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/today/page.tsx",
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
            "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/today/page.tsx",
          ],
          x = { require: s, loadChunk: () => Promise.resolve() },
          m = new a.AppPageRouteModule({
            definition: {
              kind: r.RouteKind.APP_PAGE,
              page: "/(dashboard)/today/page",
              pathname: "/today",
              bundlePath: "",
              filename: "",
              appPaths: [],
            },
            userland: { loaderTree: l },
          });
      },
      33873: (e) => {
        "use strict";
        e.exports = require("path");
      },
      43387: (e, t, s) => {
        Promise.resolve().then(s.bind(s, 67143));
      },
      63033: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");
      },
      67143: (e, t, s) => {
        "use strict";
        (s.r(t), s.d(t, { default: () => g }));
        var a = s(60687),
          r = s(14590);
        function n({ streak: e, reservesRemaining: t }) {
          return (0, a.jsxs)("div", {
            className:
              "bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-lg p-4 text-center",
            children: [
              (0, a.jsx)("div", {
                className: "text-5xl font-black text-accent",
                children: e,
              }),
              (0, a.jsx)("div", {
                className: "text-sm font-semibold text-text mt-1",
                children: "day streak",
              }),
              t > 0 &&
                (0, a.jsxs)("div", {
                  className: "mt-2 text-xs text-text-secondary",
                  children: [t, " reserve", 1 !== t ? "s" : "", " remaining"],
                }),
            ],
          });
        }
        function i({
          emoji: e,
          label: t,
          value: s,
          unit: r,
          colorClass: n = "text-text",
        }) {
          return (0, a.jsxs)("div", {
            className:
              "bg-elevated border border-border rounded-lg p-3 flex flex-col gap-1",
            children: [
              (0, a.jsxs)("div", {
                className: "flex items-center gap-1.5",
                children: [
                  (0, a.jsx)("span", { className: "text-base", children: e }),
                  (0, a.jsx)("span", {
                    className:
                      "text-xs text-text-muted uppercase tracking-wide font-semibold",
                    children: t,
                  }),
                ],
              }),
              (0, a.jsxs)("div", {
                className: `text-xl font-bold ${n}`,
                children: [
                  s,
                  r &&
                    (0, a.jsx)("span", {
                      className: "text-sm font-normal text-text-muted ml-1",
                      children: r,
                    }),
                ],
              }),
            ],
          });
        }
        var d = s(43210),
          o = s(2643);
        function l({ todayLog: e, recentLogs: t }) {
          let [s, r] = (0, d.useState)(null),
            [n, i] = (0, d.useState)(!1),
            [l, c] = (0, d.useState)(null),
            x = async () => {
              (i(!0), c(null));
              try {
                let e = await fetch("/api/insights", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      logs: t,
                      personality: "analytical",
                      mode: "recommendation",
                    }),
                  }),
                  s = await e.json();
                if (!e.ok) throw Error(s.error ?? "Failed");
                r(s.topRecommendation ?? null);
              } catch (e) {
                c(
                  e instanceof Error
                    ? e.message
                    : "Failed to get recommendation",
                );
              } finally {
                i(!1);
              }
            };
          return s || n
            ? (0, a.jsxs)("div", {
                className:
                  "bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-lg p-4",
                children: [
                  (0, a.jsx)("div", {
                    className:
                      "text-xs font-bold uppercase tracking-widest text-accent mb-2",
                    children: "Today's Recommendation",
                  }),
                  n
                    ? (0, a.jsxs)("div", {
                        className:
                          "flex items-center gap-2 text-sm text-text-secondary",
                        children: [
                          (0, a.jsx)("span", {
                            className:
                              "w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin",
                          }),
                          "Analyzing your data…",
                        ],
                      })
                    : (0, a.jsx)("p", {
                        className: "text-sm text-text leading-relaxed",
                        children: s,
                      }),
                  (0, a.jsx)("button", {
                    type: "button",
                    onClick: () => {
                      (r(null), c(null));
                    },
                    className:
                      "text-xs text-text-muted hover:text-accent mt-2 transition-colors",
                    children: "Refresh",
                  }),
                ],
              })
            : (0, a.jsxs)("div", {
                className:
                  "bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-lg p-4",
                children: [
                  (0, a.jsxs)("div", {
                    className: "flex items-center justify-between",
                    children: [
                      (0, a.jsxs)("div", {
                        children: [
                          (0, a.jsx)("div", {
                            className: "text-sm font-semibold text-text",
                            children: "Today's Recommendation",
                          }),
                          (0, a.jsx)("div", {
                            className: "text-xs text-text-secondary mt-0.5",
                            children: e
                              ? "Based on your data patterns"
                              : "Log today first for a personalized tip",
                          }),
                        ],
                      }),
                      (0, a.jsx)(o.$, {
                        size: "sm",
                        onClick: x,
                        disabled: 0 === t.length,
                        children: "Generate",
                      }),
                    ],
                  }),
                  l &&
                    (0, a.jsx)("p", {
                      className: "text-xs text-danger mt-2",
                      children: l,
                    }),
                ],
              });
        }
        var c = s(31357);
        function x() {
          let [e, t] = (0, d.useState)(null),
            [s, r] = (0, d.useState)(!0);
          if (s)
            return (0, a.jsx)(c.h, {
              children: (0, a.jsx)("div", {
                className: "h-16 flex items-center justify-center",
                children: (0, a.jsx)("span", {
                  className:
                    "w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin",
                }),
              }),
            });
          if (!e)
            return (0, a.jsxs)(c.h, {
              children: [
                (0, a.jsx)("div", {
                  className:
                    "text-xs font-bold uppercase tracking-widest text-text-muted mb-2",
                  children: "Browsing Focus",
                }),
                (0, a.jsx)("p", {
                  className: "text-sm text-text-secondary",
                  children:
                    "Install the Chrome extension to see real-time browsing focus data.",
                }),
              ],
            });
          let n = e.totals.productive + e.totals.neutral + e.totals.distracting,
            i = (e) => Math.round(e / 6e4);
          return (0, a.jsxs)(c.h, {
            children: [
              (0, a.jsx)("div", {
                className:
                  "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                children: "Browsing Focus",
              }),
              (0, a.jsxs)("div", {
                className: "flex items-center gap-4 mb-3",
                children: [
                  (0, a.jsx)("div", {
                    className: "text-3xl font-black text-accent",
                    children: e.focusScore,
                  }),
                  (0, a.jsxs)("div", {
                    children: [
                      (0, a.jsx)("div", {
                        className: "text-sm font-semibold text-text",
                        children: "Focus Score",
                      }),
                      (0, a.jsxs)("div", {
                        className: "text-xs text-text-secondary",
                        children: [i(n), " min tracked"],
                      }),
                    ],
                  }),
                ],
              }),
              (0, a.jsxs)("div", {
                className: "flex gap-2",
                children: [
                  (0, a.jsxs)("div", {
                    className: "flex-1 bg-success/10 rounded px-2 py-1.5",
                    children: [
                      (0, a.jsx)("div", {
                        className: "text-xs text-text-muted",
                        children: "Productive",
                      }),
                      (0, a.jsxs)("div", {
                        className: "text-sm font-bold text-success",
                        children: [i(e.totals.productive), "m"],
                      }),
                    ],
                  }),
                  (0, a.jsxs)("div", {
                    className: "flex-1 bg-warning/10 rounded px-2 py-1.5",
                    children: [
                      (0, a.jsx)("div", {
                        className: "text-xs text-text-muted",
                        children: "Neutral",
                      }),
                      (0, a.jsxs)("div", {
                        className: "text-sm font-bold text-warning",
                        children: [i(e.totals.neutral), "m"],
                      }),
                    ],
                  }),
                  (0, a.jsxs)("div", {
                    className: "flex-1 bg-danger/10 rounded px-2 py-1.5",
                    children: [
                      (0, a.jsx)("div", {
                        className: "text-xs text-text-muted",
                        children: "Distracting",
                      }),
                      (0, a.jsxs)("div", {
                        className: "text-sm font-bold text-danger",
                        children: [i(e.totals.distracting), "m"],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          });
        }
        var m = s(48482),
          u = s(61678),
          p = s(85168),
          h = s(27747),
          b = s(9920),
          f = s(38246),
          j = s(50326);
        function g() {
          let {
            todayLog: e,
            recentLogs: t,
            loading: s,
            streak: d,
            reservesRemaining: o,
          } = (0, r.j)();
          if (s)
            return (0, a.jsx)("div", {
              className: "flex items-center justify-center h-screen",
              children: (0, a.jsx)("span", {
                className:
                  "w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin",
              }),
            });
          let g = [...t]
            .sort((e, t) => e.date.localeCompare(t.date))
            .map((e) => ({
              day: new Date(`${e.date}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "short",
              }),
              Focus: e.output.focusRating,
              Energy: e.output.energyRating,
            }));
          return (0, a.jsxs)("div", {
            className: "max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-4",
            children: [
              (0, a.jsxs)("div", {
                children: [
                  (0, a.jsx)("h1", {
                    className: "text-xl font-bold text-text",
                    children: "Today",
                  }),
                  (0, a.jsx)("p", {
                    className: "text-sm text-text-secondary",
                    children: new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    }),
                  }),
                ],
              }),
              (0, a.jsx)(l, { todayLog: e, recentLogs: t }),
              e &&
                (0, a.jsxs)("div", {
                  className: "grid grid-cols-3 gap-3",
                  children: [
                    (0, a.jsx)(i, {
                      emoji: "\uD83C\uDFAF",
                      label: "Focus",
                      value: e.output.focusRating,
                      unit: "/10",
                      colorClass: "text-accent",
                    }),
                    (0, a.jsx)(i, {
                      emoji: "⚡",
                      label: "Energy",
                      value: e.output.energyRating,
                      unit: "/10",
                      colorClass: "text-accent-alt",
                    }),
                    (0, a.jsx)(i, {
                      emoji: "✅",
                      label: "Tasks",
                      value: e.output.tasksCompleted,
                      colorClass: "text-success",
                    }),
                  ],
                }),
              (0, a.jsx)(n, { streak: d, reservesRemaining: o }),
              g.length > 1 &&
                (0, a.jsxs)(c.h, {
                  children: [
                    (0, a.jsx)("div", {
                      className:
                        "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                      children: "7-Day Trend",
                    }),
                    (0, a.jsx)("div", {
                      className: "h-36",
                      children: (0, a.jsx)(m.u, {
                        width: "100%",
                        height: "100%",
                        children: (0, a.jsxs)(u.b, {
                          data: g,
                          children: [
                            (0, a.jsx)(p.d, {
                              strokeDasharray: "3 3",
                              stroke: "rgba(255,255,255,0.05)",
                            }),
                            (0, a.jsx)(h.W, {
                              dataKey: "day",
                              tick: { fill: "#9BA8C4", fontSize: 11 },
                              axisLine: !1,
                              tickLine: !1,
                            }),
                            (0, a.jsx)(b.h, {
                              domain: [0, 10],
                              tick: { fill: "#9BA8C4", fontSize: 11 },
                              axisLine: !1,
                              tickLine: !1,
                            }),
                            (0, a.jsx)(f.m, {
                              contentStyle: {
                                background: "#1C2535",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "8px",
                                fontSize: "12px",
                              },
                              labelStyle: { color: "#F0F4FF" },
                            }),
                            (0, a.jsx)(j.N, {
                              type: "monotone",
                              dataKey: "Focus",
                              stroke: "#6C63FF",
                              strokeWidth: 2,
                              dot: !1,
                            }),
                            (0, a.jsx)(j.N, {
                              type: "monotone",
                              dataKey: "Energy",
                              stroke: "#00D4FF",
                              strokeWidth: 2,
                              dot: !1,
                            }),
                          ],
                        }),
                      }),
                    }),
                  ],
                }),
              (0, a.jsx)(x, {}),
              e?.bigRocks &&
                e.bigRocks.length > 0 &&
                (0, a.jsxs)(c.h, {
                  children: [
                    (0, a.jsx)("div", {
                      className:
                        "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                      children: "Big Rocks Today",
                    }),
                    (0, a.jsx)("div", {
                      className: "space-y-2",
                      children: e.bigRocks.map((e, t) =>
                        (0, a.jsxs)(
                          "div",
                          {
                            className: "flex items-center gap-2 text-sm",
                            children: [
                              (0, a.jsxs)("span", {
                                className: "text-accent font-bold",
                                children: [t + 1, "."],
                              }),
                              (0, a.jsx)("span", {
                                className: "text-text",
                                children: e,
                              }),
                            ],
                          },
                          t,
                        ),
                      ),
                    }),
                  ],
                }),
              e &&
                (0, a.jsxs)(c.h, {
                  children: [
                    (0, a.jsx)("div", {
                      className:
                        "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                      children: "Today's Details",
                    }),
                    (0, a.jsxs)("div", {
                      className: "grid grid-cols-2 gap-y-2 text-sm",
                      children: [
                        (0, a.jsx)("div", {
                          className: "text-text-secondary",
                          children: "☀️ Daylight",
                        }),
                        (0, a.jsxs)("div", {
                          className: "text-text font-medium",
                          children: [e.daylightMinutes, " min"],
                        }),
                        (0, a.jsx)("div", {
                          className: "text-text-secondary",
                          children: "\uD83D\uDE34 Sleep",
                        }),
                        (0, a.jsxs)("div", {
                          className: "text-text font-medium",
                          children: [e.sleepHours, "h"],
                        }),
                        (0, a.jsx)("div", {
                          className: "text-text-secondary",
                          children: "☕ Caffeine",
                        }),
                        (0, a.jsxs)("div", {
                          className: "text-text font-medium capitalize",
                          children: [
                            e.caffeine.type,
                            e.caffeine.amount > 0
                              ? ` \xb7 ${e.caffeine.amount}mg`
                              : "",
                          ],
                        }),
                        (0, a.jsx)("div", {
                          className: "text-text-secondary",
                          children: "\uD83D\uDCAA Workout",
                        }),
                        (0, a.jsx)("div", {
                          className: "text-text font-medium capitalize",
                          children: e.workout.type,
                        }),
                        e.tags.length > 0 &&
                          (0, a.jsxs)(a.Fragment, {
                            children: [
                              (0, a.jsx)("div", {
                                className: "text-text-secondary",
                                children: "\uD83C\uDFF7️ Tags",
                              }),
                              (0, a.jsx)("div", {
                                className: "text-text font-medium",
                                children: e.tags.join(", "),
                              }),
                            ],
                          }),
                      ],
                    }),
                  ],
                }),
              !e &&
                (0, a.jsx)(c.h, {
                  children: (0, a.jsxs)("p", {
                    className: "text-sm text-text-secondary text-center py-4",
                    children: [
                      "No log for today yet. Head to ",
                      (0, a.jsx)("span", {
                        className: "text-accent",
                        children: "Log",
                      }),
                      " to record your day.",
                    ],
                  }),
                }),
            ],
          });
        }
      },
    }));
  var t = require("../../../webpack-runtime.js");
  t.C(e);
  var s = (e) => t((t.s = e)),
    a = t.X(0, [447, 825, 418, 826, 678, 691], () => s(32402));
  module.exports = a;
})();
