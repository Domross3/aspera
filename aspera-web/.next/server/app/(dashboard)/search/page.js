(() => {
  var e = {};
  ((e.id = 135),
    (e.ids = [135]),
    (e.modules = {
      3295: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");
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
          o = s(15256);
        function d() {
          let [e, t] = (0, r.useState)(null),
            [s, d] = (0, r.useState)([]),
            [i, c] = (0, r.useState)(!0),
            [l, x] = (0, r.useState)({
              weekStartDate: "",
              reservesUsed: 0,
              reserveDates: [],
            }),
            u = (0, r.useCallback)(async () => {
              await (0, n.W7)();
              let [e, s, r] = await Promise.all([
                (0, n.XE)((0, o.R)()),
                (0, n.Zx)(7),
                (0, n.Ii)(),
              ]);
              (t(e), d(s), x(r), c(!1));
            }, []),
            p = (0, r.useCallback)(async (e) => {
              (await (0, n.ss)(e),
                t(e),
                d((t) => {
                  let s = t.filter((t) => t.id !== e.id);
                  return [e, ...s].slice(0, 7);
                }));
            }, []),
            { streak: m, reservesUsedInStreak: h } = (() => {
              let t = 0,
                r = 0,
                n = (0, o.R)(),
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
                else if (r < l.reservesUsed) (r++, t++);
                else if (r < a.eO) (r++, t++);
                else break;
              }
              return { streak: t, reservesUsedInStreak: r };
            })(),
            b = a.eO - l.reservesUsed;
          return {
            todayLog: e,
            recentLogs: s,
            loading: i,
            save: p,
            reload: u,
            streak: m,
            reserves: l,
            reservesRemaining: b,
            reservesUsedInStreak: h,
          };
        }
      },
      19121: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/action-async-storage.external.js");
      },
      19816: (e, t, s) => {
        "use strict";
        (s.r(t), s.d(t, { default: () => r }));
        let r = (0, s(12907).registerClientReference)(
          function () {
            throw Error(
              "Attempted to call the default export of \"/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/search/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.",
            );
          },
          "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/search/page.tsx",
          "default",
        );
      },
      29294: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/work-async-storage.external.js");
      },
      29930: (e, t, s) => {
        "use strict";
        (s.r(t), s.d(t, { default: () => x }));
        var r = s(60687),
          a = s(43210),
          n = s(14590),
          o = s(2643),
          d = s(31357),
          i = s(71170);
        let c = [
          "What improves my focus?",
          "Best sleep nights",
          "When do I have the most energy?",
          "Days I completed the most tasks",
          "How does caffeine affect my performance?",
          "What hurts my productivity?",
        ];
        function l({ result: e }) {
          let {
              log: t,
              relevanceScore: s,
              matchReason: a,
              highlightedFields: n,
            } = e,
            o = new Date(`${t.date}T12:00:00`).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
          return (0, r.jsxs)(d.h, {
            children: [
              (0, r.jsxs)("div", {
                className: "flex items-start justify-between gap-3 mb-2",
                children: [
                  (0, r.jsxs)("div", {
                    children: [
                      (0, r.jsx)("div", {
                        className: "text-sm font-semibold text-text",
                        children: o,
                      }),
                      (0, r.jsx)("div", {
                        className: "text-xs text-text-secondary mt-0.5",
                        children: a,
                      }),
                    ],
                  }),
                  (0, r.jsxs)(i.E, {
                    variant:
                      s >= 80 ? "success" : s >= 60 ? "warning" : "default",
                    children: [s, "% match"],
                  }),
                ],
              }),
              (0, r.jsxs)("div", {
                className: "grid grid-cols-3 gap-2 mb-3",
                children: [
                  (0, r.jsxs)("div", {
                    className:
                      "bg-background/50 rounded px-2 py-1.5 text-center",
                    children: [
                      (0, r.jsx)("div", {
                        className: "text-xs text-text-muted",
                        children: "Focus",
                      }),
                      (0, r.jsx)("div", {
                        className: "text-sm font-bold text-accent",
                        children: t.output.focusRating,
                      }),
                    ],
                  }),
                  (0, r.jsxs)("div", {
                    className:
                      "bg-background/50 rounded px-2 py-1.5 text-center",
                    children: [
                      (0, r.jsx)("div", {
                        className: "text-xs text-text-muted",
                        children: "Energy",
                      }),
                      (0, r.jsx)("div", {
                        className: "text-sm font-bold text-accent-alt",
                        children: t.output.energyRating,
                      }),
                    ],
                  }),
                  (0, r.jsxs)("div", {
                    className:
                      "bg-background/50 rounded px-2 py-1.5 text-center",
                    children: [
                      (0, r.jsx)("div", {
                        className: "text-xs text-text-muted",
                        children: "Tasks",
                      }),
                      (0, r.jsx)("div", {
                        className: "text-sm font-bold text-success",
                        children: t.output.tasksCompleted,
                      }),
                    ],
                  }),
                ],
              }),
              (0, r.jsxs)("div", {
                className: "flex flex-wrap gap-2 text-xs",
                children: [
                  "none" !== t.workout.type &&
                    (0, r.jsxs)("span", {
                      className:
                        "px-2 py-0.5 rounded-pill bg-elevated border border-border text-text-secondary capitalize",
                      children: ["\uD83D\uDCAA ", t.workout.type],
                    }),
                  "none" !== t.caffeine.type &&
                    (0, r.jsxs)("span", {
                      className:
                        "px-2 py-0.5 rounded-pill bg-elevated border border-border text-text-secondary capitalize",
                      children: ["☕ ", t.caffeine.type],
                    }),
                  t.sleepHours > 0 &&
                    (0, r.jsxs)("span", {
                      className:
                        "px-2 py-0.5 rounded-pill bg-elevated border border-border text-text-secondary",
                      children: ["\uD83D\uDE34 ", t.sleepHours, "h"],
                    }),
                  t.tags.slice(0, 3).map((e) =>
                    (0, r.jsx)(
                      "span",
                      {
                        className: `px-2 py-0.5 rounded-pill border text-xs ${n.includes("tags") ? "bg-accent/20 text-accent border-accent/30" : "bg-elevated border-border text-text-secondary"}`,
                        children: e,
                      },
                      e,
                    ),
                  ),
                ],
              }),
            ],
          });
        }
        function x() {
          let { recentLogs: e, loading: t } = (0, n.j)(),
            [s, i] = (0, a.useState)(""),
            [x, u] = (0, a.useState)(null),
            [p, m] = (0, a.useState)(!1),
            [h, b] = (0, a.useState)(null),
            g = async (t) => {
              if (t.trim() && 0 !== e.length) {
                (m(!0), b(null), u(null));
                try {
                  let s = await fetch("/api/search", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ query: t, logs: e }),
                    }),
                    r = await s.json();
                  if (!s.ok) throw Error(r.error ?? "Search failed");
                  u(r);
                } catch (e) {
                  b(e instanceof Error ? e.message : "Search failed");
                } finally {
                  m(!1);
                }
              }
            };
          return (0, r.jsxs)("div", {
            className: "max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-5",
            children: [
              (0, r.jsxs)("div", {
                children: [
                  (0, r.jsx)("h1", {
                    className: "text-xl font-bold text-text",
                    children: "Search Your Data",
                  }),
                  (0, r.jsx)("p", {
                    className: "text-sm text-text-secondary",
                    children:
                      "Ask anything about your patterns in natural language.",
                  }),
                ],
              }),
              (0, r.jsx)("form", {
                onSubmit: (e) => {
                  (e.preventDefault(), g(s));
                },
                className: "space-y-3",
                children: (0, r.jsxs)("div", {
                  className: "flex gap-2",
                  children: [
                    (0, r.jsx)("input", {
                      type: "text",
                      value: s,
                      onChange: (e) => i(e.target.value),
                      placeholder: "What improves my focus?",
                      className:
                        "flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors",
                    }),
                    (0, r.jsx)(o.$, {
                      type: "submit",
                      loading: p,
                      disabled: !s.trim() || t,
                      children: "Search",
                    }),
                  ],
                }),
              }),
              !x &&
                !p &&
                (0, r.jsxs)("div", {
                  className: "space-y-2",
                  children: [
                    (0, r.jsx)("div", {
                      className:
                        "text-xs font-bold uppercase tracking-widest text-text-muted",
                      children: "Try asking…",
                    }),
                    (0, r.jsx)("div", {
                      className: "flex flex-wrap gap-2",
                      children: c.map((e) =>
                        (0, r.jsx)(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              (i(e), g(e));
                            },
                            className:
                              "px-3 py-1.5 rounded-pill bg-elevated border border-border text-sm text-text-secondary hover:border-accent hover:text-text transition-colors",
                            children: e,
                          },
                          e,
                        ),
                      ),
                    }),
                  ],
                }),
              p &&
                (0, r.jsxs)("div", {
                  className:
                    "flex items-center gap-3 text-sm text-text-secondary py-8 justify-center",
                  children: [
                    (0, r.jsx)("span", {
                      className:
                        "w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin",
                    }),
                    "Analyzing ",
                    e.length,
                    " days of data…",
                  ],
                }),
              h &&
                (0, r.jsx)("div", {
                  className:
                    "p-4 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger",
                  children: h,
                }),
              x &&
                (0, r.jsxs)("div", {
                  className: "space-y-4",
                  children: [
                    (0, r.jsxs)(d.h, {
                      glowAccent: !0,
                      children: [
                        (0, r.jsx)("div", {
                          className:
                            "text-xs font-bold uppercase tracking-widest text-accent mb-2",
                          children: "Answer",
                        }),
                        (0, r.jsx)("p", {
                          className: "text-sm text-text leading-relaxed",
                          children: x.summary,
                        }),
                      ],
                    }),
                    x.results.length > 0 &&
                      (0, r.jsxs)("div", {
                        className: "space-y-3",
                        children: [
                          (0, r.jsxs)("div", {
                            className:
                              "text-xs font-bold uppercase tracking-widest text-text-muted",
                            children: [
                              "Matching Days (",
                              x.results.length,
                              ")",
                            ],
                          }),
                          x.results.map((e) =>
                            (0, r.jsx)(l, { result: e }, e.log.id),
                          ),
                        ],
                      }),
                    0 === x.results.length &&
                      (0, r.jsx)("p", {
                        className:
                          "text-sm text-text-secondary text-center py-4",
                        children:
                          "No specific days matched this query — but the summary above still answers your question.",
                      }),
                    (0, r.jsx)("button", {
                      type: "button",
                      onClick: () => {
                        (u(null), i(""));
                      },
                      className:
                        "text-xs text-text-muted hover:text-accent transition-colors",
                      children: "← New search",
                    }),
                  ],
                }),
              t &&
                (0, r.jsx)("div", {
                  className: "text-sm text-text-muted text-center py-4",
                  children: "Loading your logs…",
                }),
              !t &&
                0 === e.length &&
                (0, r.jsxs)("div", {
                  className: "text-sm text-text-secondary text-center py-8",
                  children: [
                    "No logs yet. Head to ",
                    (0, r.jsx)("span", {
                      className: "text-accent",
                      children: "Log",
                    }),
                    " to record some days first.",
                  ],
                }),
            ],
          });
        }
      },
      33873: (e) => {
        "use strict";
        e.exports = require("path");
      },
      58604: (e, t, s) => {
        "use strict";
        (s.r(t),
          s.d(t, {
            GlobalError: () => o.a,
            __next_app__: () => x,
            pages: () => l,
            routeModule: () => u,
            tree: () => c,
          }));
        var r = s(65239),
          a = s(48088),
          n = s(88170),
          o = s.n(n),
          d = s(30893),
          i = {};
        for (let e in d)
          0 >
            [
              "default",
              "tree",
              "pages",
              "GlobalError",
              "__next_app__",
              "routeModule",
            ].indexOf(e) && (i[e] = () => d[e]);
        s.d(t, i);
        let c = {
            children: [
              "",
              {
                children: [
                  "(dashboard)",
                  {
                    children: [
                      "search",
                      {
                        children: [
                          "__PAGE__",
                          {},
                          {
                            page: [
                              () => Promise.resolve().then(s.bind(s, 19816)),
                              "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/search/page.tsx",
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
          l = [
            "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/search/page.tsx",
          ],
          x = { require: s, loadChunk: () => Promise.resolve() },
          u = new r.AppPageRouteModule({
            definition: {
              kind: a.RouteKind.APP_PAGE,
              page: "/(dashboard)/search/page",
              pathname: "/search",
              bundlePath: "",
              filename: "",
              appPaths: [],
            },
            userland: { loaderTree: c },
          });
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
      74178: (e, t, s) => {
        Promise.resolve().then(s.bind(s, 19816));
      },
      92330: (e, t, s) => {
        Promise.resolve().then(s.bind(s, 29930));
      },
    }));
  var t = require("../../../webpack-runtime.js");
  t.C(e);
  var s = (e) => t((t.s = e)),
    r = t.X(0, [447, 825, 418, 691], () => s(58604));
  module.exports = r;
})();
