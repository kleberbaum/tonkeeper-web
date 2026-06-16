# Pending i18n keys

Translation keys added to `packages/locales/src/tonkeeper-web/en.json` (or
`packages/locales/src/tonkeeper/en.json`) that have **only English copy** and still need
translations uploaded to Tolgee. Once Tolgee has the other locales, delete the row.

The English source is committed to the repo (so the runtime always resolves the key even before
Tolgee syncs); other locales fall back to English via `fillMissingLocales` in
`packages/locales/task/build.ts`. The English entry is therefore enough to ship the feature — this
file is the reminder to localise it before the next translation cut.

Only list keys that are **new to Tolgee**. Keys you added to the English source file for repo
completeness but that already exist in Tolgee (translated) don't need a row — Tolgee already has
them.

| Key                                 | English                                                                  | Added in               | Notes                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------- |
| `start_screen_terms_caption`        | By continuing, you agree to our                                          | Start screen redesign  | Prefix sentence before the "Terms of Use" link                                              |
| `start_screen_terms_link`           | Terms of Use                                                             | Start screen redesign  | Inline accent-blue link                                                                     |
| `import_wallet_picker_subtitle`     | Choose from the option below.                                            | Import picker redesign | Heading subtitle when picker is in `'import'` mode                                          |
| `check_backup_button`               | Check Backup                                                             | Create flow redesign   | CTA on the Show-mnemonic screen, before backup verification                                 |
| `check_backup_caption`              | Let's see if you've got everything right. Enter words %1%, %2%, and %3%. | Create flow redesign   | Subhead on the backup-check screen — replaces legacy `check_words_caption` for the new flow |
| `create_wallet_done_button`         | Done                                                                     | Create flow redesign   | CTA on the Backup-check screen after 3 words match                                          |
| `customize_wallet_title`            | Customize your wallet                                                    | Create flow redesign   | Heading on the wallet name/emoji screen                                                     |
| `customize_wallet_description`      | Wallet name and icon are stored locally on your device.                  | Create flow redesign   | Subhead on the wallet name/emoji screen                                                     |
| `wallet_add_funds`                  | Add Funds                                                                | Portfolio phase 1      | Round IconButton label on the multichain home action row (replaces separate Buy/Receive)    |
| `wallet_collectibles`               | Collectibles                                                             | Portfolio phase 1      | Section header above the NFT carousel on the multichain home                                |
| `wallet_crypto_section`             | Crypto                                                                   | Portfolio phase 1      | Section header above the asset list on the multichain home                                  |
| `wallet_manage_assets`              | Manage                                                                   | Portfolio phase 1      | Right-aligned button next to the "Crypto" header — opens asset visibility sheet             |
| `wallet_onboarding_card_cta`        | Start Now                                                                | Portfolio phase 1      | CTA inside the empty-wallet onboarding card                                                 |
| `wallet_onboarding_card_subtitle`   | learn step by step                                                       | Portfolio phase 1      | Second line of the empty-wallet onboarding card                                             |
| `wallet_onboarding_card_title`      | Get started with your wallet                                             | Portfolio phase 1      | First line of the empty-wallet onboarding card                                              |
| `wallet_asset_24h`                  | 24h                                                                      | Portfolio phase 4      | Asset hero timeframe label next to 24h diff                                                 |
| `wallet_asset_about`                | About                                                                    | Portfolio phase 4      | Section title above asset description                                                       |
| `wallet_asset_circulating_supply`   | Circulating Supply                                                       | Portfolio phase 4      | Overview row label in asset details                                                         |
| `wallet_asset_data_provider_note`   | Price chart, overview and performance are provided by dyor.io.           | Portfolio phase 4      | Attribution note below trading activity section                                             |
| `wallet_asset_links`                | Links                                                                    | Portfolio phase 4      | Section title for social and website links                                                  |
| `wallet_asset_market_cap`           | Market Cap                                                               | Portfolio phase 4      | Overview row label in asset details                                                         |
| `wallet_asset_more`                 | More                                                                     | Portfolio phase 4      | "Read more" button in the About section                                                     |
| `wallet_asset_more_actions`         | More                                                                     | Portfolio phase 4      | Accessibility label for the round actions menu button                                       |
| `wallet_asset_overview`             | Overview                                                                 | Portfolio phase 4      | Section title above market metrics card                                                     |
| `wallet_asset_total_supply`         | Total Supply                                                             | Portfolio phase 4      | Overview row label in asset details                                                         |
| `wallet_asset_trading_activity_24h` | 24h Trading activity                                                     | Portfolio phase 4      | Section title above volume and buy/sell split                                               |
| `wallet_asset_volume`               | Volume                                                                   | Portfolio phase 4      | Trading activity row label                                                                  |
| `wallet_asset_your_balance`         | Your balance                                                             | Portfolio phase 4      | Section title above wallet holdings card                                                    |
| `wallet_buy`                        | Buy                                                                      | Portfolio phase 4      | Primary CTA in asset action bar and trading split label                                     |
| `wallet_manage_crypto_title`        | Manage crypto                                                            | Portfolio phase 4      | Modal header title in manage assets sheet                                                   |
| `wallet_more_assets`                | More assets                                                              | Portfolio phase 4      | Expand row label in collapsed multichain assets list                                        |
