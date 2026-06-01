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

| Key                             | English                         | Added in               | Notes                                              |
| ------------------------------- | ------------------------------- | ---------------------- | -------------------------------------------------- |
| `start_screen_terms_caption`    | By continuing, you agree to our | Start screen redesign  | Prefix sentence before the "Terms of Use" link     |
| `start_screen_terms_link`       | Terms of Use                    | Start screen redesign  | Inline accent-blue link                            |
| `import_wallet_picker_subtitle` | Choose from the option below.   | Import picker redesign | Heading subtitle when picker is in `'import'` mode |
