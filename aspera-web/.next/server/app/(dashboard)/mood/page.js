(() => {
  var e = {};
  ((e.id = 220),
    (e.ids = [220]),
    (e.modules = {
      3279: (e, t, s) => {
        "use strict";
        (s.r(t), s.d(t, { default: () => j }));
        var r = s(60687),
          n = s(43210),
          a = s(78259),
          o = s(26614),
          i = s(15256),
          d = s(31357),
          l = s(2643),
          c = s(48482),
          x = s(61678),
          m = s(85168),
          p = s(27747),
          u = s(9920),
          h = s(38246),
          b = s(50326);
        function g({ checkIns: e }) {
          let t = e
            .sort((e, t) => e.timestamp - t.timestamp)
            .map((e) => {
              let t = new Date(e.timestamp);
              return {
                time: `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}`,
                mood: e.mood,
                energy: e.energy,
                stress: e.stress,
              };
            });
          return 0 === t.length
            ? (0, r.jsx)("div", {
                className:
                  "h-32 flex items-center justify-center text-sm text-text-muted",
                children: "No check-ins yet today",
              })
            : (0, r.jsx)("div", {
                className: "h-36",
                children: (0, r.jsx)(c.u, {
                  width: "100%",
                  height: "100%",
                  children: (0, r.jsxs)(x.b, {
                    data: t,
                    children: [
                      (0, r.jsx)(m.d, {
                        strokeDasharray: "3 3",
                        stroke: "rgba(255,255,255,0.05)",
                      }),
                      (0, r.jsx)(p.W, {
                        dataKey: "time",
                        tick: { fill: "#9BA8C4", fontSize: 10 },
                        axisLine: !1,
                        tickLine: !1,
                      }),
                      (0, r.jsx)(u.h, {
                        domain: [1, 5],
                        tick: { fill: "#9BA8C4", fontSize: 10 },
                        axisLine: !1,
                        tickLine: !1,
                        ticks: [1, 2, 3, 4, 5],
                      }),
                      (0, r.jsx)(h.m, {
                        contentStyle: {
                          background: "#1C2535",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        },
                        labelStyle: { color: "#F0F4FF" },
                      }),
                      (0, r.jsx)(b.N, {
                        type: "monotone",
                        dataKey: "mood",
                        stroke: "#6C63FF",
                        strokeWidth: 2,
                        dot: { fill: "#6C63FF", r: 3 },
                        name: "Mood",
                      }),
                      (0, r.jsx)(b.N, {
                        type: "monotone",
                        dataKey: "energy",
                        stroke: "#00D4FF",
                        strokeWidth: 2,
                        dot: { fill: "#00D4FF", r: 3 },
                        name: "Energy",
                      }),
                      (0, r.jsx)(b.N, {
                        type: "monotone",
                        dataKey: "stress",
                        stroke: "#F87171",
                        strokeWidth: 2,
                        dot: { fill: "#F87171", r: 3 },
                        name: "Stress",
                        strokeDasharray: "4 2",
                      }),
                    ],
                  }),
                }),
              });
        }
        function j() {
          let [e, t] = (0, n.useState)([]),
            [s, c] = (0, n.useState)([]),
            [x, m] = (0, n.useState)(3),
            [p, u] = (0, n.useState)(3),
            [h, b] = (0, n.useState)(3),
            [j, v] = (0, n.useState)(""),
            [f, y] = (0, n.useState)(!1),
            [k, C] = (0, n.useState)(!1),
            w = async () => {
              let [e, s] = await Promise.all([
                (0, o._O)((0, i.R)()),
                (0, o.rO)(7),
              ]);
              (t(e), c(s));
            },
            N = async () => {
              y(!0);
              let e = {
                id: new Date().toISOString(),
                timestamp: Date.now(),
                mood: x,
                energy: p,
                stress: h,
                note: j.trim() || void 0,
              };
              (await (0, o.OF)(e),
                v(""),
                C(!0),
                await w(),
                y(!1),
                setTimeout(() => C(!1), 2e3));
            },
            S = ({ label: e, value: t, onChange: s, emojis: n }) =>
              (0, r.jsxs)("div", {
                className: "space-y-2",
                children: [
                  (0, r.jsxs)("div", {
                    className: "flex justify-between items-center",
                    children: [
                      (0, r.jsx)("span", {
                        className: "text-sm text-text-secondary",
                        children: e,
                      }),
                      (0, r.jsx)("span", {
                        className: "text-2xl",
                        children: n[t],
                      }),
                    ],
                  }),
                  (0, r.jsx)("div", {
                    className: "flex justify-between gap-2",
                    children: [1, 2, 3, 4, 5].map((e) =>
                      (0, r.jsx)(
                        "button",
                        {
                          type: "button",
                          onClick: () => s(e),
                          className: `flex-1 h-10 rounded-lg text-lg transition-all ${t === e ? "bg-accent/20 border border-accent/50 shadow-glow-sm" : "bg-elevated border border-border hover:border-border-accent"}`,
                          children: n[e],
                        },
                        e,
                      ),
                    ),
                  }),
                ],
              });
          return (0, r.jsxs)("div", {
            className: "max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-5",
            children: [
              (0, r.jsxs)("div", {
                children: [
                  (0, r.jsx)("h1", {
                    className: "text-xl font-bold text-text",
                    children: "Mood Tracker",
                  }),
                  (0, r.jsxs)("p", {
                    className: "text-sm text-text-secondary",
                    children: [
                      e.length,
                      " check-in",
                      1 !== e.length ? "s" : "",
                      " today",
                    ],
                  }),
                ],
              }),
              (0, r.jsxs)(d.h, {
                children: [
                  (0, r.jsx)("div", {
                    className:
                      "text-xs font-bold uppercase tracking-widest text-text-muted mb-4",
                    children: "How are you right now?",
                  }),
                  (0, r.jsxs)("div", {
                    className: "space-y-5",
                    children: [
                      (0, r.jsx)(S, {
                        label: "Mood",
                        value: x,
                        onChange: m,
                        emojis: a.Ur,
                      }),
                      (0, r.jsx)(S, {
                        label: "Energy",
                        value: p,
                        onChange: u,
                        emojis: a.rd,
                      }),
                      (0, r.jsx)(S, {
                        label: "Stress",
                        value: h,
                        onChange: b,
                        emojis: a.jx,
                      }),
                      (0, r.jsx)("input", {
                        type: "text",
                        value: j,
                        onChange: (e) => v(e.target.value),
                        placeholder: "Optional note…",
                        className:
                          "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors",
                      }),
                      (0, r.jsx)(l.$, {
                        variant: "primary",
                        size: "md",
                        className: "w-full",
                        onClick: N,
                        loading: f,
                        children: k ? "✓ Logged!" : "Log Check-in",
                      }),
                    ],
                  }),
                ],
              }),
              e.length > 0 &&
                (0, r.jsxs)(d.h, {
                  children: [
                    (0, r.jsx)("div", {
                      className:
                        "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                      children: "Today's Pattern",
                    }),
                    (0, r.jsx)(g, { checkIns: e }),
                  ],
                }),
              e.length > 0 &&
                (0, r.jsxs)(d.h, {
                  children: [
                    (0, r.jsx)("div", {
                      className:
                        "text-xs font-bold uppercase tracking-widest text-text-muted mb-3",
                      children: "Today's Check-ins",
                    }),
                    (0, r.jsx)("div", {
                      className: "space-y-2",
                      children: [...e].reverse().map((e) =>
                        (0, r.jsxs)(
                          "div",
                          {
                            className:
                              "flex items-center gap-3 p-2.5 bg-background/50 rounded-lg",
                            children: [
                              (0, r.jsx)("div", {
                                className:
                                  "text-xs text-text-muted w-12 flex-shrink-0",
                                children: new Date(
                                  e.timestamp,
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }),
                              }),
                              (0, r.jsxs)("div", {
                                className: "flex gap-3 text-base",
                                children: [
                                  (0, r.jsx)("span", {
                                    title: "Mood",
                                    children: a.Ur[e.mood],
                                  }),
                                  (0, r.jsx)("span", {
                                    title: "Energy",
                                    children: a.rd[e.energy],
                                  }),
                                  (0, r.jsx)("span", {
                                    title: "Stress",
                                    children: a.jx[e.stress],
                                  }),
                                ],
                              }),
                              e.note &&
                                (0, r.jsx)("span", {
                                  className:
                                    "text-xs text-text-secondary flex-1 truncate",
                                  children: e.note,
                                }),
                            ],
                          },
                          e.id,
                        ),
                      ),
                    }),
                  ],
                }),
              s.length > 3 &&
                (0, r.jsxs)(d.h, {
                  children: [
                    (0, r.jsx)("div", {
                      className:
                        "text-xs font-bold uppercase tracking-widest text-text-muted mb-2",
                      children: "7-Day Average",
                    }),
                    (0, r.jsx)("div", {
                      className: "grid grid-cols-3 gap-2 text-center",
                      children: ["mood", "energy", "stress"].map((e) => {
                        let t = s.reduce((t, s) => t + s[e], 0) / s.length,
                          n =
                            "mood" === e ? a.Ur : "energy" === e ? a.rd : a.jx;
                        return (0, r.jsxs)(
                          "div",
                          {
                            className: "bg-elevated rounded-lg p-3",
                            children: [
                              (0, r.jsx)("div", {
                                className:
                                  "text-xs text-text-muted capitalize mb-1",
                                children: e,
                              }),
                              (0, r.jsx)("div", {
                                className: "text-2xl",
                                children: n[Math.round(t)],
                              }),
                              (0, r.jsx)("div", {
                                className: "text-sm font-bold text-text mt-1",
                                children: t.toFixed(1),
                              }),
                            ],
                          },
                          e,
                        );
                      }),
                    }),
                  ],
                }),
            ],
          });
        }
      },
      3295: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");
      },
      8437: (e, t, s) => {
        Promise.resolve().then(s.bind(s, 17791));
      },
      10846: (e) => {
        "use strict";
        e.exports = require("next/dist/compiled/next-server/app-page.runtime.prod.js");
      },
      17791: (e, t, s) => {
        "use strict";
        (s.r(t), s.d(t, { default: () => r }));
        let r = (0, s(12907).registerClientReference)(
          function () {
            throw Error(
              "Attempted to call the default export of \"/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/mood/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.",
            );
          },
          "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/mood/page.tsx",
          "default",
        );
      },
      19121: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/action-async-storage.external.js");
      },
      22005: (e, t, s) => {
        Promise.resolve().then(s.bind(s, 3279));
      },
      26368: (e, t, s) => {
        "use strict";
        (s.r(t),
          s.d(t, {
            GlobalError: () => o.a,
            __next_app__: () => x,
            pages: () => c,
            routeModule: () => m,
            tree: () => l,
          }));
        var r = s(65239),
          n = s(48088),
          a = s(88170),
          o = s.n(a),
          i = s(30893),
          d = {};
        for (let e in i)
          0 >
            [
              "default",
              "tree",
              "pages",
              "GlobalError",
              "__next_app__",
              "routeModule",
            ].indexOf(e) && (d[e] = () => i[e]);
        s.d(t, d);
        let l = {
            children: [
              "",
              {
                children: [
                  "(dashboard)",
                  {
                    children: [
                      "mood",
                      {
                        children: [
                          "__PAGE__",
                          {},
                          {
                            page: [
                              () => Promise.resolve().then(s.bind(s, 17791)),
                              "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/mood/page.tsx",
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
            "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/(dashboard)/mood/page.tsx",
          ],
          x = { require: s, loadChunk: () => Promise.resolve() },
          m = new r.AppPageRouteModule({
            definition: {
              kind: n.RouteKind.APP_PAGE,
              page: "/(dashboard)/mood/page",
              pathname: "/mood",
              bundlePath: "",
              filename: "",
              appPaths: [],
            },
            userland: { loaderTree: l },
          });
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
    }));
  var t = require("../../../webpack-runtime.js");
  t.C(e);
  var s = (e) => t((t.s = e)),
    r = t.X(0, [447, 825, 418, 826, 678, 691], () => s(26368));
  module.exports = r;
})();
