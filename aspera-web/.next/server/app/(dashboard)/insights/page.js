(() => {
  var e = {};
  ((e.id = 750),
    (e.ids = [750]),
    (e.modules = {
      3295: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");
      },
      10383: (e, t, s) => {
        Promise.resolve().then(s.bind(s, 91269));
      },
      10846: (e) => {
        "use strict";
        e.exports = require("next/dist/compiled/next-server/app-page.runtime.prod.js");
      },
      14590: (e, t, s) => {
        "use strict";
        s.d(t, { j: () => d });
        var r = s(43210),
          a = s(78259),
          n = s(26614),
          i = s(15256);
        function d() {
          let [e, t] = (0, r.useState)(null),
            [s, d] = (0, r.useState)([]),
            [l, o] = (0, r.useState)(!0),
            [c, x] = (0, r.useState)({
              weekStartDate: "",
              reservesUsed: 0,
              reserveDates: [],
            }),
            m = (0, r.useCallback)(async () => {
              await (0, n.W7)();
              let [e, s, r] = await Promise.all([
                (0, n.XE)((0, i.R)()),
                (0, n.Zx)(7),
                (0, n.Ii)(),
              ]);
              (t(e), d(s), x(r), o(!1));
            }, []),
            p = (0, r.useCallback)(async (e) => {
              (await (0, n.ss)(e),
                t(e),
                d((t) => {
                  let s = t.filter((t) => t.id !== e.id);
                  return [e, ...s].slice(0, 7);
                }));
            }, []),
            { streak: u, reservesUsedInStreak: h } = (() => {
              let t = 0,
                r = 0,
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
                else if (r < c.reservesUsed) (r++, t++);
                else if (r < a.eO) (r++, t++);
                else break;
              }
              return { streak: t, reservesUsedInStreak: r };
            })(),
            b = a.eO - c.reservesUsed;
          return {
            todayLog: e,
            recentLogs: s,
            loading: l,
            save: p,
            reload: m,
            streak: u,
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
      33873: (e) => {
        "use strict";
        e.exports = require("path");
      },
      63033: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");
      },
      71170: (e, t, s) => {
        "use strict";
        s.d(t, { E: () => a });
        var r = s(60687);
        function a({ children: e, variant: t = "default", size: s = "sm" }) {
          return (0, r.jsx)("span", {
            className: `inline-flex items-center rounded-pill font-medium ${{ default: "bg-elevated text-text-secondary border border-border", success: "bg-success/20 text-success border border-success/30", warning: "bg-warning/20 text-warning border border-warning/30", danger: "bg-danger/20 text-danger border border-danger/30", accent: "bg-accent/20 text-accent border border-accent/30" }[t]} ${{ sm: "px-2 py-0.5 text-xs", md: "px-3 py-1 text-sm" }[s]}`,
            children: e,
          });
        }
      },
      79692: (e, t, s) => {
        "use strict";
        (s.r(t),
          s.d(t, {
            GlobalError: () => i.a,
            __next_app__: () => x,
            pages: () => c,
            routeModule: () => m,
            tree: () => o,
          }));
        var r = s(65239),
          a = s(48088),
          n = s(88170),
          i = s.n(n),
          d = s(30893),
          l = {};
        for (let e in d)
          0 >
            [
              "default",
              "tree",
              "pages",
              "GlobalError",
              "__next_app__",
              "routeModule",
            ].indexOf(e) && (l[e] = () => d[e]);
        s.d(t, l);
        let o = {
            children: [
              "",
              {
                children: [
                  "(dashboard)",
                  {
                    children: [
                      "insights",
                      {
                        children: [
                          "__PAGE__",
                          {},
                          {
                            page: [
                              () => Promise.resolve().then(s.bind(s, 91269)),
                              "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/insights/page.tsx",
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
            "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/insights/page.tsx",
          ],
          x = { require: s, loadChunk: () => Promise.resolve() },
          m = new r.AppPageRouteModule({
            definition: {
              kind: a.RouteKind.APP_PAGE,
              page: "/(dashboard)/insights/page",
              pathname: "/insights",
              bundlePath: "",
              filename: "",
              appPaths: [],
            },
            userland: { loaderTree: o },
          });
      },
      91269: (e, t, s) => {
        "use strict";
        (s.r(t), s.d(t, { default: () => r }));
        let r = (0, s(12907).registerClientReference)(
          function () {
            throw Error(
              "Attempted to call the default export of \"/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/insights/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.",
            );
          },
          "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/insights/page.tsx",
          "default",
        );
      },
      93511: (e, t, s) => {
        Promise.resolve().then(s.bind(s, 94778));
      },
      94778: (e, t, s) => {
        "use strict";
        (s.r(t), s.d(t, { default: () => C }));
        var r = s(60687),
          a = s(43210),
          n = s(14590),
          i = s(26614),
          d = s(31357),
          l = s(2643),
          o = s(71170);
        let c = { high: "success", medium: "warning", low: "default" },
          x = { focus: "Focus", energy: "Energy", tasks: "Tasks" };
        function m({ correlation: e }) {
          let {
            emoji: t,
            title: s,
            description: a,
            delta: n,
            confidence: i,
            outputMetric: d,
            inputFactors: l,
            isKeystone: m,
          } = e;
          return (0, r.jsxs)("div", {
            className: `relative bg-gradient-to-br from-elevated to-surface border rounded-lg p-4 shadow-card transition-all ${m ? "border-accent/50 shadow-glow-sm" : "border-border"}`,
            children: [
              m &&
                (0, r.jsx)("div", {
                  className: "absolute -top-2.5 left-4",
                  children: (0, r.jsx)("span", {
                    className:
                      "bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-pill",
                    children: "✨ Keystone Habit",
                  }),
                }),
              (0, r.jsxs)("div", {
                className: "flex items-start gap-3 mt-1",
                children: [
                  (0, r.jsx)("span", {
                    className: "text-2xl flex-shrink-0",
                    children: t,
                  }),
                  (0, r.jsxs)("div", {
                    className: "flex-1 min-w-0",
                    children: [
                      (0, r.jsxs)("div", {
                        className: "flex items-center gap-2 flex-wrap mb-1",
                        children: [
                          (0, r.jsx)("h3", {
                            className: "text-sm font-semibold text-text",
                            children: s,
                          }),
                          (0, r.jsx)(o.E, { variant: c[i], children: i }),
                        ],
                      }),
                      (0, r.jsx)("p", {
                        className: "text-sm text-text-secondary mb-3",
                        children: a,
                      }),
                      (0, r.jsxs)("div", {
                        className: "flex items-center gap-3 flex-wrap",
                        children: [
                          (0, r.jsxs)("div", {
                            className: "flex items-center gap-1.5",
                            children: [
                              (0, r.jsx)("span", {
                                className: "text-xs text-text-muted",
                                children: "→",
                              }),
                              (0, r.jsxs)("span", {
                                className: "text-xs font-medium text-success",
                                children: ["+", n.toFixed(1), " ", x[d]],
                              }),
                            ],
                          }),
                          (0, r.jsx)("div", {
                            className: "flex gap-1.5 flex-wrap",
                            children: l.slice(0, 3).map((e) =>
                              (0, r.jsx)(
                                "span",
                                {
                                  className:
                                    "text-xs px-2 py-0.5 bg-elevated rounded-pill text-text-muted border border-border",
                                  children: e,
                                },
                                e,
                              ),
                            ),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          });
        }
        var p = s(48482),
          u = s(92491),
          h = s(48888),
          b = s(27747),
          g = s(9920),
          f = s(84629),
          y = (0, u.gu)({
            chartName: "BarChart",
            GraphicalChild: h.y,
            defaultTooltipEventType: "axis",
            validateTooltipEventTypes: ["axis", "item"],
            axisComponents: [
              { axisType: "xAxis", AxisComp: b.W },
              { axisType: "yAxis", AxisComp: g.h },
            ],
            formatAxisMap: f.pr,
          }),
          j = s(85168),
          v = s(38246);
        function w({ trends: e }) {
          let t = e.map((e) => ({
            day: e.dayLabel,
            Focus: e.focusRating,
            Energy: e.energyRating,
            Tasks: Math.round(e.tasksCompleted / 2),
          }));
          return (0, r.jsxs)("div", {
            className: "space-y-2",
            children: [
              (0, r.jsx)("h3", {
                className:
                  "text-xs font-bold uppercase tracking-widest text-text-muted",
                children: "Weekly Trends",
              }),
              (0, r.jsx)("div", {
                className: "h-40",
                children: (0, r.jsx)(p.u, {
                  width: "100%",
                  height: "100%",
                  children: (0, r.jsxs)(y, {
                    data: t,
                    barGap: 2,
                    barSize: 8,
                    children: [
                      (0, r.jsx)(j.d, {
                        strokeDasharray: "3 3",
                        stroke: "rgba(255,255,255,0.05)",
                      }),
                      (0, r.jsx)(b.W, {
                        dataKey: "day",
                        tick: { fill: "#9BA8C4", fontSize: 11 },
                        axisLine: !1,
                        tickLine: !1,
                      }),
                      (0, r.jsx)(g.h, {
                        tick: { fill: "#9BA8C4", fontSize: 11 },
                        axisLine: !1,
                        tickLine: !1,
                        domain: [0, 10],
                      }),
                      (0, r.jsx)(v.m, {
                        contentStyle: {
                          background: "#1C2535",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        },
                        labelStyle: { color: "#F0F4FF" },
                        itemStyle: { color: "#9BA8C4" },
                      }),
                      (0, r.jsx)(h.y, {
                        dataKey: "Focus",
                        fill: "#6C63FF",
                        radius: [2, 2, 0, 0],
                      }),
                      (0, r.jsx)(h.y, {
                        dataKey: "Energy",
                        fill: "#00D4FF",
                        radius: [2, 2, 0, 0],
                      }),
                    ],
                  }),
                }),
              }),
            ],
          });
        }
        let N = [
          {
            id: "analytical",
            label: "Analytical",
            emoji: "\uD83D\uDCCA",
            desc: "Data-driven, precise",
          },
          {
            id: "unserious",
            label: "Unserious",
            emoji: "\uD83D\uDE0F",
            desc: "Witty, casual nudges",
          },
          {
            id: "stoic",
            label: "Stoic",
            emoji: "\uD83D\uDDFF",
            desc: "Terse, carved-in-stone",
          },
        ];
        function C() {
          let { recentLogs: e, loading: t } = (0, n.j)(),
            {
              insights: s,
              loading: o,
              error: c,
              loadCached: x,
              generate: p,
            } = (function () {
              let [e, t] = (0, a.useState)(null),
                [s, r] = (0, a.useState)(!1),
                [n, d] = (0, a.useState)(null);
              return {
                insights: e,
                loading: s,
                error: n,
                loadCached: (0, a.useCallback)(async () => {
                  let e = await (0, i.ge)();
                  e && t(e);
                }, []),
                generate: (0, a.useCallback)(async (e, s = "analytical") => {
                  if (0 === e.length)
                    return void d("Log at least one day of data first.");
                  (r(!0), d(null));
                  try {
                    let r = await fetch("/api/insights", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ logs: e, personality: s }),
                    });
                    if (!r.ok) {
                      let e = await r.json();
                      throw Error(e.error ?? `Server error ${r.status}`);
                    }
                    let a = await r.json();
                    (t(a), await (0, i.LJ)(a));
                  } catch (e) {
                    d(
                      e instanceof Error
                        ? e.message
                        : "Failed to generate insights. Try again.",
                    );
                  } finally {
                    r(!1);
                  }
                }, []),
              };
            })(),
            [u, h] = (0, a.useState)("analytical");
          return t
            ? (0, r.jsx)("div", {
                className: "flex items-center justify-center h-screen",
                children: (0, r.jsx)("span", {
                  className:
                    "w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin",
                }),
              })
            : (0, r.jsxs)("div", {
                className:
                  "max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-5",
                children: [
                  (0, r.jsxs)("div", {
                    children: [
                      (0, r.jsx)("h1", {
                        className: "text-xl font-bold text-text",
                        children: "AI Insights",
                      }),
                      (0, r.jsxs)("p", {
                        className: "text-sm text-text-secondary",
                        children: [
                          "Pattern analysis across your ",
                          e.length,
                          " recent logs.",
                        ],
                      }),
                    ],
                  }),
                  (0, r.jsxs)(d.h, {
                    children: [
                      (0, r.jsx)("div", {
                        className:
                          "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                        children: "Coach Style",
                      }),
                      (0, r.jsx)("div", {
                        className: "grid grid-cols-3 gap-2",
                        children: N.map((e) =>
                          (0, r.jsxs)(
                            "button",
                            {
                              type: "button",
                              onClick: () => h(e.id),
                              className: `p-3 rounded-lg border text-center transition-all ${u === e.id ? "border-accent bg-accent/10 text-accent" : "border-border bg-elevated text-text-secondary hover:border-border-accent hover:text-text"}`,
                              children: [
                                (0, r.jsx)("div", {
                                  className: "text-xl mb-1",
                                  children: e.emoji,
                                }),
                                (0, r.jsx)("div", {
                                  className: "text-xs font-semibold",
                                  children: e.label,
                                }),
                                (0, r.jsx)("div", {
                                  className: "text-xs text-text-muted mt-0.5",
                                  children: e.desc,
                                }),
                              ],
                            },
                            e.id,
                          ),
                        ),
                      }),
                    ],
                  }),
                  (0, r.jsx)(l.$, {
                    variant: "primary",
                    size: "lg",
                    className: "w-full",
                    loading: o,
                    onClick: () => p(e, u),
                    disabled: 0 === e.length,
                    children: s ? "Regenerate Insights" : "Generate Insights",
                  }),
                  c &&
                    (0, r.jsx)("div", {
                      className:
                        "p-4 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger",
                      children: c,
                    }),
                  o &&
                    (0, r.jsxs)("div", {
                      className: "text-center py-8 space-y-2",
                      children: [
                        (0, r.jsx)("div", {
                          className:
                            "w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto",
                        }),
                        (0, r.jsx)("p", {
                          className: "text-sm text-text-secondary",
                          children: "Analyzing patterns with Claude…",
                        }),
                      ],
                    }),
                  s &&
                    !o &&
                    (0, r.jsxs)("div", {
                      className: "space-y-4",
                      children: [
                        (0, r.jsxs)(d.h, {
                          glowAccent: !0,
                          children: [
                            (0, r.jsx)("div", {
                              className:
                                "text-xs font-bold uppercase tracking-widest text-accent mb-2",
                              children: "Summary",
                            }),
                            (0, r.jsx)("p", {
                              className: "text-sm text-text leading-relaxed",
                              children: s.summary,
                            }),
                          ],
                        }),
                        (0, r.jsxs)("div", {
                          className:
                            "bg-gradient-to-r from-accent/15 to-accent-alt/10 border border-accent/20 rounded-lg p-4",
                          children: [
                            (0, r.jsx)("div", {
                              className:
                                "text-xs font-bold uppercase tracking-widest text-accent mb-1",
                              children: "Top Recommendation",
                            }),
                            (0, r.jsx)("p", {
                              className: "text-sm text-text",
                              children: s.topRecommendation,
                            }),
                          ],
                        }),
                        s.correlations
                          .filter((e) => e.isKeystone)
                          .map((e) => (0, r.jsx)(m, { correlation: e }, e.id)),
                        (0, r.jsx)("div", {
                          className: "space-y-3",
                          children: s.correlations
                            .filter((e) => !e.isKeystone)
                            .map((e) =>
                              (0, r.jsx)(m, { correlation: e }, e.id),
                            ),
                        }),
                        s.weeklyTrends.length > 0 &&
                          (0, r.jsx)(d.h, {
                            children: (0, r.jsx)(w, { trends: s.weeklyTrends }),
                          }),
                        (0, r.jsxs)("div", {
                          className: "text-xs text-text-muted text-center",
                          children: [
                            "Generated ",
                            new Date(s.generatedAt).toLocaleString(),
                          ],
                        }),
                      ],
                    }),
                  !s &&
                    !o &&
                    e.length > 0 &&
                    (0, r.jsx)(d.h, {
                      children: (0, r.jsxs)("div", {
                        className:
                          "text-center py-6 text-sm text-text-secondary",
                        children: [
                          'Click "Generate Insights" to analyze your ',
                          e.length,
                          " days of data.",
                        ],
                      }),
                    }),
                  0 === e.length &&
                    (0, r.jsx)(d.h, {
                      children: (0, r.jsx)("div", {
                        className:
                          "text-center py-6 text-sm text-text-secondary",
                        children: "Log at least one day to generate insights.",
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
    r = t.X(0, [447, 825, 418, 826, 691], () => s(79692));
  module.exports = r;
})();
