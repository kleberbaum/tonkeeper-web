# TWA legacy static bundle — v3.20.2

This directory is the **prebuilt static output of the old production Telegram Mini App**,
kept as a guaranteed rollback / reference target for the TWA wind-down.

| | |
|---|---|
| Version | `3.20.2` (`apps/twa/package.json` at build commit) |
| Built from commit | `27550d51` ("Update version", dated 2024-08-26) — the assumed prod build |
| Build command | `npx turbo build:twa` (Vite, output `apps/twa/dist`), Node 20.11.1, Yarn 4.3.0 |
| Base path | `/` (root) — serve at the domain root |

## How it was produced

```sh
git worktree add /tmp/twa-3202 27550d51
cd /tmp/twa-3202 && yarn install && npx turbo build:twa
# output: apps/twa/dist  ->  copied here
```

## Caveats

- **Built from source, not the literal deployed artifact.** It is the *functional* 3.20.2
  app. Asset content hashes and minifier output may differ from what is currently live;
  it is not guaranteed byte-identical.
- **Analytics env vars were not set at build time** (`VITE_APP_APTABASE`,
  `VITE_APP_APTABASE_HOST`, `VITE_APP_MEASUREMENT_ID`). They are baked in as `undefined`,
  so analytics will not report from this bundle. Wallet/recovery functionality is
  unaffected. To reproduce prod analytics, rebuild with those values exported.
- Telegram CloudStorage is per-bot, so this bundle reads the same user data as live
  3.20.2 only when served from the same bot's `web_app` URL.

## Intended use

Rollback target for the TWA wind-down: if the recovery stub deploy goes wrong, point the
bot's `web_app` (or the Pages project) back at this known-good 3.20.2 static bundle.
