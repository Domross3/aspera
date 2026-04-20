(() => {
  var e = {};
  ((e.id = 985),
    (e.ids = [985]),
    (e.modules = {
      3295: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");
      },
      10846: (e) => {
        "use strict";
        e.exports = require("next/dist/compiled/next-server/app-page.runtime.prod.js");
      },
      20977: (e, r, t) => {
        "use strict";
        (t.r(r),
          t.d(r, {
            patchFetch: () => v,
            routeModule: () => w,
            serverHooks: () => m,
            workAsyncStorage: () => g,
            workUnitAsyncStorage: () => x,
          }));
        var s = {};
        (t.r(s), t.d(s, { GET: () => d, POST: () => l }));
        var o = t(96559),
          n = t(48088),
          a = t(37719),
          i = t(32190),
          p = t(29021);
        let u = "/tmp/aspera-browsing.json";
        async function c() {}
        async function l(e) {
          try {
            let r = await e.json();
            await c();
            let t = {};
            try {
              let e = await p.promises.readFile(u, "utf8");
              t = JSON.parse(e);
            } catch {}
            let s = r.date ?? new Date().toISOString().split("T")[0];
            return (
              (t[s] = { ...r, receivedAt: Date.now() }),
              await p.promises.writeFile(u, JSON.stringify(t, null, 2), "utf8"),
              console.log("[/api/browsing] Saved browsing data for:", s),
              i.NextResponse.json({ ok: !0, date: s })
            );
          } catch (e) {
            return (
              console.error("[/api/browsing] POST error:", e),
              i.NextResponse.json(
                {
                  error:
                    e instanceof Error ? e.message : "Internal server error",
                },
                { status: 500 },
              )
            );
          }
        }
        async function d() {
          try {
            await c();
            let e = {};
            try {
              let r = await p.promises.readFile(u, "utf8");
              e = JSON.parse(r);
            } catch {}
            let r = Object.keys(e).sort().reverse(),
              t = r.length > 0 ? e[r[0]] : null;
            return i.NextResponse.json({ latest: t, all: e });
          } catch (e) {
            return (
              console.error("[/api/browsing] GET error:", e),
              i.NextResponse.json(
                {
                  error:
                    e instanceof Error ? e.message : "Internal server error",
                },
                { status: 500 },
              )
            );
          }
        }
        let w = new o.AppRouteRouteModule({
            definition: {
              kind: n.RouteKind.APP_ROUTE,
              page: "/api/browsing/route",
              pathname: "/api/browsing",
              filename: "route",
              bundlePath: "app/api/browsing/route",
            },
            resolvedPagePath:
              "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/api/browsing/route.ts",
            nextConfigOutput: "",
            userland: s,
          }),
          { workAsyncStorage: g, workUnitAsyncStorage: x, serverHooks: m } = w;
        function v() {
          return (0, a.patchFetch)({
            workAsyncStorage: g,
            workUnitAsyncStorage: x,
          });
        }
      },
      29021: (e) => {
        "use strict";
        e.exports = require("fs");
      },
      29294: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/work-async-storage.external.js");
      },
      44870: (e) => {
        "use strict";
        e.exports = require("next/dist/compiled/next-server/app-route.runtime.prod.js");
      },
      63033: (e) => {
        "use strict";
        e.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");
      },
      78335: () => {},
      96487: () => {},
    }));
  var r = require("../../../webpack-runtime.js");
  r.C(e);
  var t = (e) => r((r.s = e)),
    s = r.X(0, [447, 580], () => t(20977));
  module.exports = s;
})();
