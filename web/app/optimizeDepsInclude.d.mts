/** See optimizeDepsInclude.mjs — plain JS so the node:test gate
 * (scripts/dep-cache-coverage.test.mjs) can import it without a loader. */
export function optimizeDepsInclude(appDir: string): string[]
