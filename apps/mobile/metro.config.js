// Expo + pnpm monorepo Metro config.
// Without this, Metro does not get Expo's resolver and (in a pnpm workspace)
// mis-resolves platform variants — e.g. loading the web `expo/.../hmr.ts`
// instead of `hmr.native.ts` on Android, which crashes reading `document`.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch the whole monorepo so workspace packages are picked up.
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from the app first, then the hoisted monorepo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. In pnpm, packages live under .pnpm with symlinks — keep them followed.
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
