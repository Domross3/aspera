(() => {
  var e = {};
  ((e.id = 202),
    (e.ids = [202]),
    (e.modules = {
      527: (e, r, t) => {
        "use strict";
        (t.r(r),
          t.d(r, {
            patchFetch: () => h,
            routeModule: () => c,
            serverHooks: () => m,
            workAsyncStorage: () => l,
            workUnitAsyncStorage: () => d,
          }));
        var s = {};
        (t.r(s), t.d(s, { POST: () => p }));
        var a = t(96559),
          n = t(48088),
          o = t(37719),
          i = t(32190),
          u = t(78290);
        async function p(e) {
          try {
            let r,
              { query: t, logs: s } = await e.json();
            if (!t?.trim())
              return i.NextResponse.json(
                { error: "Query is required" },
                { status: 400 },
              );
            if (!s || 0 === s.length)
              return i.NextResponse.json(
                { error: "No logs provided" },
                { status: 400 },
              );
            let a = process.env.CLAUDE_KEY;
            if (!a)
              return i.NextResponse.json(
                { error: "CLAUDE_KEY not configured on server" },
                { status: 500 },
              );
            let n = new u.Ay({ apiKey: a }),
              o = (
                await n.messages.create({
                  model: "claude-sonnet-4-6",
                  max_tokens: 1500,
                  temperature: 0,
                  system:
                    "You are a precise data analyst. Return only valid JSON, no markdown, no explanations.",
                  messages: [
                    {
                      role: "user",
                      content: `You are analyzing a user's personal performance logs to answer their natural language query.

USER QUERY: "${t}"

LOGS (${s.length} days of data):
${JSON.stringify(s, null, 2)}

Your task:
1. Find the logs most relevant to the user's query
2. For each relevant log, explain WHY it's relevant in one sentence
3. Identify which specific fields are most relevant (e.g., "workout.type", "output.focusRating", "tags", "music")
4. Return results ranked by relevance (most relevant first)

Respond ONLY with valid JSON in this exact format:
{
  "query": "${t}",
  "results": [
    {
      "date": "YYYY-MM-DD",
      "relevanceScore": 85,
      "matchReason": "One sentence explaining why this log is relevant to the query",
      "highlightedFields": ["workout.type", "output.focusRating"]
    }
  ],
  "summary": "A 1-2 sentence summary answering the user's question based on the data patterns"
}

Rules:
- Include only logs with relevanceScore >= 40
- Maximum 5 results
- relevanceScore must be 0-100
- summary must directly answer the question with specific data points
- No markdown fences, no extra text outside the JSON`,
                    },
                  ],
                })
              ).content
                .filter((e) => "text" === e.type)
                .map((e) => e.text)
                .join("")
                .trim()
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/\s*```$/i, "")
                .trim();
            try {
              r = JSON.parse(o);
            } catch {
              return i.NextResponse.json(
                { error: "Failed to parse AI response" },
                { status: 502 },
              );
            }
            let p = new Map(s.map((e) => [e.date, e])),
              c = r.results
                .map((e) => {
                  let r = p.get(e.date);
                  return r
                    ? {
                        log: r,
                        relevanceScore: e.relevanceScore,
                        matchReason: e.matchReason,
                        highlightedFields: e.highlightedFields,
                      }
                    : null;
                })
                .filter(Boolean),
              l = { query: r.query, results: c, summary: r.summary };
            return i.NextResponse.json(l);
          } catch (e) {
            return (
              console.error("[/api/search] error:", e),
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
        let c = new a.AppRouteRouteModule({
            definition: {
              kind: n.RouteKind.APP_ROUTE,
              page: "/api/search/route",
              pathname: "/api/search",
              filename: "route",
              bundlePath: "app/api/search/route",
            },
            resolvedPagePath:
              "/Users/dominicross/Documents/EECS/CBCHackathon/aspera-web/app/api/search/route.ts",
            nextConfigOutput: "",
            userland: s,
          }),
          { workAsyncStorage: l, workUnitAsyncStorage: d, serverHooks: m } = c;
        function h() {
          return (0, o.patchFetch)({
            workAsyncStorage: l,
            workUnitAsyncStorage: d,
          });
        }
      },
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
      96487: () => {},
    }));
  var r = require("../../../webpack-runtime.js");
  r.C(e);
  var t = (e) => r((r.s = e)),
    s = r.X(0, [447, 580, 290], () => t(527));
  module.exports = s;
})();
