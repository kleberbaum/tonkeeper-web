#!/bin/sh
set -eu

MODE="${1:-run}"
shift || true
WORKERS="${CT_WORKERS:-1}"
REPO="$(git rev-parse --show-toplevel)"

case "${MODE}" in
    run)
        PLAYWRIGHT_ARGS="test -c playwright-ct.config.ts --workers=${WORKERS}"
        ;;
    update)
        PLAYWRIGHT_ARGS="test -c playwright-ct.config.ts --update-snapshots --workers=${WORKERS}"
        ;;
    *)
        echo "Unknown mode: ${MODE}. Use one of: run, update"
        exit 1
        ;;
esac

# Forward any path filters / Playwright flags (a file, a folder, or several) into the container.
# Playwright runs from packages/uikit inside the container, so normalize paths to be relative to
# it: accept both uikit-relative (src/...) and repo-relative (packages/uikit/src/...) forms.
for arg in "$@"; do
    case "${arg}" in
        packages/uikit/*) arg="${arg#packages/uikit/}" ;;
    esac
    PLAYWRIGHT_ARGS="${PLAYWRIGHT_ARGS} \"${arg}\""
done

docker run --rm -e YARN_NPM_AUTH_TOKEN -v "${REPO}:/work" -w /work \
    mcr.microsoft.com/playwright:v1.48.1-jammy \
    bash -lc "
        set -euo pipefail
        corepack enable

        # Mitigate intermittent mount visibility glitches in Docker Desktop.
        mkdir -p /work/packages/uikit/src/components/layout

        install_ok=0
        for i in 1 2 3; do
            if yarn install --immutable; then
                install_ok=1
                break
            fi
            echo \"[ct-docker] yarn install failed (attempt \$i/3), retrying...\"
            sleep 2
        done

        if [ \"\$install_ok\" -ne 1 ]; then
            echo \"[ct-docker] yarn install failed after retries\"
            exit 1
        fi

        cd packages/uikit
        rm -rf playwright/.cache
        NODE_OPTIONS=--max-old-space-size=6144 yarn playwright ${PLAYWRIGHT_ARGS}
    "
