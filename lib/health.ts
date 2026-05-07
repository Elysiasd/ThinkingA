import { checkCliAvailable, checkGitAvailable, checkWorkspaceWritable } from "./runtime-checks";

export type ToolHealth = {
  available?: boolean;
  writable?: boolean;
  output?: string;
  error?: string;
};

export type HealthSnapshot = {
  git: ToolHealth;
  codex: ToolHealth;
  claude: ToolHealth;
  workspace: ToolHealth;
  checkedAt: number;
};

const HEALTH_TTL_MS = 60_000;
let cachedHealth: HealthSnapshot | null = null;

export function clearHealthCacheForTests() {
  cachedHealth = null;
}

export async function getHealthSnapshot(force = false): Promise<HealthSnapshot> {
  if (!force && cachedHealth && Date.now() - cachedHealth.checkedAt < HEALTH_TTL_MS) {
    return cachedHealth;
  }

  const checkedAt = Date.now();
  const snapshot: HealthSnapshot = {
    git: checkGitAvailable(),
    codex: checkCliAvailable("codex"),
    claude: checkCliAvailable("claude"),
    workspace: checkWorkspaceWritable(),
    checkedAt,
  };

  cachedHealth = snapshot;
  return snapshot;
}
