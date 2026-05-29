// App-facing entry point for the confidence-gated agent.
//
// Runs the same-day sweep (Engine A) + next-day lag sweep (Engine C) over the
// user's existing data, merges them, de-dups (a lever×outcome that fires both
// same-day and next-day collapses to its stronger framing), and caps to a
// glanceable few. Pure function — the hook layer just feeds it storage data.

import { runSweep, type SweepFinding, type SweepInputs, type SweepOpts } from "./runSweep";
import { runLagSweep } from "./lag";

export interface AgentFindingsOpts extends SweepOpts {
  /** Max findings to surface (calm card stays glanceable). */
  maxFindings?: number;
}

const DEFAULT_MAX_FINDINGS = 4;

export function computeAgentFindings(
  inputs: SweepInputs,
  opts: AgentFindingsOpts = {},
): SweepFinding[] {
  const max = opts.maxFindings ?? DEFAULT_MAX_FINDINGS;
  const sameDay = runSweep(inputs, opts);
  const lag = runLagSweep(inputs, opts);

  // Keep the stronger of any same-day vs next-day finding for one lever×outcome
  // so the card doesn't show two near-identical lines.
  const byKey = new Map<string, SweepFinding>();
  for (const f of [...sameDay, ...lag]) {
    const key = `${f.leverId}:${f.outcomeId}`;
    const existing = byKey.get(key);
    if (!existing || f.pValue < existing.pValue) byKey.set(key, f);
  }

  return Array.from(byKey.values())
    .sort((a, b) => a.pValue - b.pValue)
    .slice(0, max);
}
