#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const appRoot = path.resolve(__dirname, "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function hasExpoCli() {
  try {
    require.resolve("@expo/cli", { paths: [appRoot] });
    return true;
  } catch {
    return false;
  }
}

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor !== 20) {
  console.warn(
    `[aspera] Node ${process.version} detected. Expo SDK 54 is most stable on Node 20.`,
  );
}

if (hasExpoCli()) {
  process.exit(0);
}

console.warn(
  "[aspera] Local Expo CLI is missing or incomplete. Repairing dependencies with `npm ci`...",
);

const installResult = spawnSync(npmCommand, ["ci"], {
  cwd: appRoot,
  stdio: "inherit",
});

if (installResult.error) {
  console.error(
    `[aspera] Failed to run npm ci: ${installResult.error.message}`,
  );
  process.exit(1);
}

if (installResult.status !== 0) {
  process.exit(installResult.status ?? 1);
}

if (!hasExpoCli()) {
  console.error(
    "[aspera] Expo CLI is still unavailable after `npm ci`. Move the repo out of iCloud-synced Documents and try again.",
  );
  process.exit(1);
}

console.log("[aspera] Expo CLI repaired successfully.");
