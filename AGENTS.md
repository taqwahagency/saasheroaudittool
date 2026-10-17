<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- Install with `npm ci`, then `npx playwright install --with-deps chromium`. Hero audits launch headless Chromium.
- Start with `npm run dev -- --hostname 0.0.0.0 --port 3000`.
- `basePath` in `next.config.ts` is `/tools/saas-hero-audit`. Open `http://localhost:3000/tools/saas-hero-audit`. `http://localhost:3000/` returns 404.
- `ANTHROPIC_API_KEY` is required for `POST /tools/saas-hero-audit/api/analyze`. `PAGESPEED_API_KEY` is optional; without it, technical scores stay neutral.
- Checks: `npm run lint`, `npx tsc --noEmit`, `npm run build`. There is no automated test script.
