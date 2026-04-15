const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = true;
// Prefer .js over .mjs to prevent metro from bundling both when using
// package exports with wildcard patterns (e.g. @anthropic-ai/sdk)
config.resolver.unstable_conditionNames = ["require", "default"];

// Short-circuit resolution for @anthropic-ai/sdk — its 52 wildcard export
// entries cause Metro to hang. We only import the default export, so point
// directly at the CJS entry.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@anthropic-ai/sdk") {
    return {
      filePath: path.resolve(
        __dirname,
        "node_modules/@anthropic-ai/sdk/index.js",
      ),
      type: "sourceFile",
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
