# Content Writer — Production vs Local

## Why production can time out or “never finish”

- **Local:** The dev server runs in a normal Node process. There is **no hard time limit**. The full pipeline (often 5–7 minutes) can complete.
- **Production (Vercel):** The generate API runs as a **serverless function**. Vercel **stops the function** after a fixed duration. If the pipeline runs longer than that, the function is killed, the stream breaks, and **no article is returned** (or the request seems to hang until you cancel).

So “it works locally but not in production” or “production took 20+ minutes and then failed” is usually the function being **killed at the plan limit**, not the pipeline “running for 20 minutes.”

## Vercel limits that matter

| Plan        | Fluid Compute   | Default | Max duration |
|------------|------------------|--------|--------------|
| Hobby      | **Disabled**     | 10s    | **60s**      |
| Hobby      | **Enabled**      | 300s   | **300s (5 min)** |
| Pro        | Disabled         | 15s    | 300s (5 min) |
| Pro        | Enabled          | 300s   | **800s (13 min)** |

- If **Fluid Compute is disabled** (e.g. Hobby): the function can be killed at **10s default** or **60s** max. Content Writer will not finish.
- With **Fluid Compute enabled**: Hobby is capped at **5 minutes**; Pro can be set up to **13 minutes**.

The Content Writer pipeline is tuned to **finish within 5 minutes** so it works on **Hobby + Fluid Compute** and on **Pro**. For longer headroom (e.g. slow APIs), use **Pro + Fluid Compute** and optionally increase the route `maxDuration` (up to 800s on Pro).

## What we did to help production

1. **Pipeline budget:** 280 seconds (4m40s) so the whole run stays under a 5‑minute Vercel limit.
2. **Fewer retries / stricter timeouts:** Gemini, topic extraction, and brief use a “fast” retry config (1 retry, shorter timeout). Claude draft has **no retry** and a 4‑minute cap so one attempt must complete within the budget.
3. **Route `maxDuration`:** `src/app/api/blog/generate/route.ts` sets `export const maxDuration = 300` (5 min). `vercel.json` also sets `maxDuration: 300` for this route so the limit is explicit.

## What you should do

1. **Turn on Fluid Compute** (if on Vercel):  
   Project → Settings → Functions → ensure Fluid Compute is **enabled**. Without it, Hobby is limited to 10s/60s and the generate route will be killed before the article is done.

2. **Confirm the 5‑minute limit:**  
   In Vercel Dashboard → Project → Settings → Functions, check **Function Max Duration**. For this project, the generate route is intended to use **300 seconds**. If the project default is lower, the route-level config in code and `vercel.json` should override it; if not, set the default (or this route) to 300s.

3. **If you need more than 5 minutes:**  
   Upgrade to **Pro** and (optionally) increase `maxDuration` for the generate route up to **800** (13 min). Then increase `PIPELINE_BUDGET_MS` in `src/app/api/blog/generate/route.ts` to stay under that (e.g. 795_000 ms for 800s).

4. **If generation still fails:**  
   Check Vercel function logs for the generate route. You should see either a clean pipeline completion or a timeout/error. If the function is killed by the platform, you’ll see execution stopping at the configured max duration.

## Summary

| Environment | Limit              | Result if pipeline is slow |
|------------|--------------------|----------------------------|
| Local      | None               | Can run 5–7+ min and complete |
| Production (Vercel, 5 min) | 300s (5 min) | Must finish in &lt;5 min or function is killed, no article returned |
| Production (Vercel Pro, 13 min) | Up to 800s | Can allow longer runs if you increase `maxDuration` and pipeline budget |

Pipeline tuning (budget, retries, Claude single attempt) is done so that under normal conditions the run completes **under 5 minutes** on production.
