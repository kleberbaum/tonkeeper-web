#!/usr/bin/env node
/* eslint-disable no-console */
// Run only the uikit component tests affected by the current change set.
//
// Mapping (intentionally simple — a real dependency graph is overkill here):
//   - a changed `*.ct.tsx`            -> run it directly
//   - a changed `Foo.tsx` / `Foo.ts`  -> run colocated `Foo.ct.tsx` if it exists
//   - CT harness/config/shared styles -> run the whole component suite
//
// Compares against a base ref (default `origin/main`, override with BASE_REF)
// using a three-dot diff, plus any uncommitted working-tree changes so the
// script is useful locally too.
//
// Usage:
//   node scripts/test-changed-components.mjs                # changed only
//   node scripts/test-changed-components.mjs --all          # whole suite
//   BASE_REF=origin/release node scripts/test-changed-components.mjs
//   node scripts/test-changed-components.mjs -- --update-snapshots   # pass-through

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const uikitDir = join(repoRoot, 'packages', 'uikit');
const UIKIT_PREFIX = 'packages/uikit/src/';
const ALL_TESTS_PREFIXES = ['packages/uikit/playwright/', 'packages/uikit/src/styles/'];
const ALL_TESTS_FILES = new Set(['packages/uikit/playwright-ct.config.ts']);

const argv = process.argv.slice(2);
const runAll = argv.includes('--all');
// Everything after a literal `--` is forwarded verbatim to `playwright test`.
const passThrough = argv.includes('--') ? argv.slice(argv.indexOf('--') + 1) : [];

const git = (...args) =>
    execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

function changedFiles() {
    const baseRef = process.env.BASE_REF || 'origin/main';
    const files = new Set();
    try {
        // Committed changes since the merge-base with the base ref.
        git('diff', '--name-only', `${baseRef}...HEAD`).forEach(f => files.add(f));
    } catch {
        console.warn(`[test-changed] base ref "${baseRef}" not found; using working tree only`);
    }
    // Uncommitted + staged changes.
    git('diff', '--name-only', 'HEAD').forEach(f => files.add(f));
    git('ls-files', '--others', '--exclude-standard').forEach(f => files.add(f));
    return [...files];
}

function toTestFiles(files) {
    const tests = new Set();
    for (const file of files) {
        if (!file.startsWith(UIKIT_PREFIX)) continue;
        if (file.endsWith('.ct.tsx')) {
            if (existsSync(join(repoRoot, file))) tests.add(file);
            continue;
        }
        const sibling = file.replace(/\.(tsx?|ts)$/, '.ct.tsx');
        if (sibling !== file && existsSync(join(repoRoot, sibling))) tests.add(sibling);
    }
    // Paths relative to the uikit workspace, where playwright runs.
    return [...tests].map(f => f.slice('packages/uikit/'.length));
}

function affectsAllTests(file) {
    return ALL_TESTS_FILES.has(file) || ALL_TESTS_PREFIXES.some(prefix => file.startsWith(prefix));
}

function runPlaywright(args) {
    console.log(`[test-changed] playwright test ${args.join(' ')}`.trim());
    execFileSync('npx', ['playwright', 'test', '-c', 'playwright-ct.config.ts', ...args], {
        cwd: uikitDir,
        env: {
            ...process.env,
            NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=6144'
        },
        stdio: 'inherit'
    });
}

try {
    if (runAll) {
        runPlaywright(passThrough);
        process.exit(0);
    }

    const files = changedFiles();
    if (files.some(affectsAllTests)) {
        console.log('[test-changed] shared component-test infrastructure changed; running all.');
        runPlaywright(passThrough);
        process.exit(0);
    }

    const testFiles = toTestFiles(files);
    if (testFiles.length === 0) {
        console.log('[test-changed] no component tests affected by the change set — skipping.');
        process.exit(0);
    }

    console.log(`[test-changed] ${testFiles.length} affected test file(s):`);
    testFiles.forEach(f => console.log(`  - ${f}`));
    runPlaywright([...testFiles, ...passThrough]);
} catch (err) {
    process.exit(err.status ?? 1);
}
