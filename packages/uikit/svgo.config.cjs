/**
 * SVGO config for design-system icons (consumed by SVGR via `.svgrrc.cjs`).
 *
 * Goals: keep a square `viewBox` (so icons scale from props/className), drop
 * hardcoded `width`/`height`, and collapse every fill/stroke to `currentColor`
 * so an icon inherits text color in both Tailwind (`text-iconPrimary`) and
 * styled-components consumers — matching the existing inline-SVG convention.
 */
module.exports = {
    multipass: true,
    plugins: [
        {
            name: 'preset-default',
            params: {
                overrides: {
                    // Required for prop/className-driven sizing.
                    removeViewBox: false,
                    // Single-color icons: bind paint to the current text color.
                    convertColors: { currentColor: true },
                    // Keep ids out of the way but don't break referenced ids.
                    cleanupIds: { minify: true }
                }
            }
        },
        // Size comes from the consumer (className or width/height prop), never
        // baked into the SVG.
        'removeDimensions'
    ]
};
