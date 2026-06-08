# Multichain plan

High-level roadmap for the multichain redesign. Each feature ships independently, benchmarked
against the iOS / Android native apps and the design library in Figma. A detailed plan per feature
lands here when the feature is picked up.

## Status

| Feature                           | Status |
| --------------------------------- | ------ |
| UI library                        | ✅     |
| Wallet import / create (mnemonic) | ✅     |
| Portfolio                         | ⚙️     |
| Send                              |        |
| Receive                           |        |
| Asset                             |        |
| History                           |        |
| WalletConnect                     |        |
| Swap                              |        |
| NFT                               |        |
| Trading                           |        |
| Ramps                             |        |

Legend: ✅ shipped · ⚙️ in progress · blank = not started.

## Notes

-   Features are sequenced independently and can ship in any order; nothing below Portfolio blocks
    anything else.
-   `MULTICHAIN_ENABLED` (`packages/core/src/multichain.ts`) is the build-time gate for everything
    multichain-specific. See CLAUDE.md → "Scope of the flag" for the contract.
-   iOS and Android are the reference implementations. When designs or behaviour are ambiguous, the
    native apps win.
