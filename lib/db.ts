import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { CliKind } from "./schemas";

let db: Database.Database | null = null;

export type ProjectRecord = {
  id: number;
  name: string;
  slug: string;
  target_path: string;
  git_status: string;
  cli_preference: CliKind;
  created_at: string;
};

export type GenerationRecord = {
  id: number;
  idea: string;
  plan_json: string;
  prompt_text: string;
  model: string;
  status: string;
  error: string | null;
  created_at: string;
};

export type RunRecord = {
  id: number;
  project_id: number | null;
  generation_id: number | null;
  cli_type: CliKind;
  command_preview: string;
  workdir: string;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  started_at: string;
  ended_at: string | null;
};

export type SettingRecord = {
  key: string;
  value: string;
  updated_at: string;
};

export function getDb() {
  if (db) {
    return db;
  }

  const dbPath = process.env.THINKINGAP_DB_PATH || path.join(process.cwd(), "data", "thinkingap.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}

export function resetDbForTests(database: Database.Database) {
  db = database;
  migrate(db);
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      target_path TEXT NOT NULL UNIQUE,
      git_status TEXT NOT NULL DEFAULT 'not_initialized',
      cli_preference TEXT NOT NULL DEFAULT 'codex',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idea TEXT NOT NULL,
      plan_json TEXT NOT NULL,
      prompt_text TEXT NOT NULL,
      model TEXT NOT NULL,
      status TEXT NOT NULL,
      error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      generation_id INTEGER,
      cli_type TEXT NOT NULL,
      command_preview TEXT NOT NULL,
      workdir TEXT NOT NULL,
      stdout TEXT NOT NULL DEFAULT '',
      stderr TEXT NOT NULL DEFAULT '',
      exit_code INTEGER,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(generation_id) REFERENCES generations(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function insertGeneration(input: {
  idea: string;
  planItems: string[];
  promptText: string;
  model: string;
  status: "completed" | "failed";
  error?: string | null;
}) {
  const result = getDb()
    .prepare(
      `INSERT INTO generations (idea, plan_json, prompt_text, model, status, error)
       VALUES (@idea, @planJson, @promptText, @model, @status, @error)`
    )
    .run({
      idea: input.idea,
      planJson: JSON.stringify(input.planItems),
      promptText: input.promptText,
      model: input.model,
      status: input.status,
      error: input.error ?? null,
    });

  return Number(result.lastInsertRowid);
}

export function upsertProject(input: {
  name: string;
  slug: string;
  targetPath: string;
  cli: CliKind;
  gitStatus: string;
}) {
  const database = getDb();
  database
    .prepare(
      `INSERT INTO projects (name, slug, target_path, cli_preference, git_status)
       VALUES (@name, @slug, @targetPath, @cli, @gitStatus)
       ON CONFLICT(target_path) DO UPDATE SET
         name = excluded.name,
         slug = excluded.slug,
         cli_preference = excluded.cli_preference,
         git_status = excluded.git_status`
    )
    .run(input);

  return database
    .prepare("SELECT * FROM projects WHERE target_path = ?")
    .get(input.targetPath) as ProjectRecord;
}

export function insertRun(input: {
  projectId?: number;
  generationId?: number;
  cli: CliKind;
  commandPreview: string;
  workdir: string;
}) {
  const result = getDb()
    .prepare(
      `INSERT INTO runs (project_id, generation_id, cli_type, command_preview, workdir)
       VALUES (@projectId, @generationId, @cli, @commandPreview, @workdir)`
    )
    .run({
      projectId: input.projectId ?? null,
      generationId: input.generationId ?? null,
      cli: input.cli,
      commandPreview: input.commandPreview,
      workdir: input.workdir,
    });

  return Number(result.lastInsertRowid);
}

export function finishRun(input: {
  id: number;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}) {
  getDb()
    .prepare(
      `UPDATE runs
       SET stdout = @stdout, stderr = @stderr, exit_code = @exitCode, ended_at = CURRENT_TIMESTAMP
       WHERE id = @id`
    )
    .run(input);
}

export function getDashboardState() {
  const database = getDb();
  return {
    projects: database
      .prepare("SELECT * FROM projects ORDER BY created_at DESC LIMIT 20")
      .all() as ProjectRecord[],
    generations: database
      .prepare("SELECT * FROM generations ORDER BY created_at DESC LIMIT 10")
      .all() as GenerationRecord[],
    runs: database
      .prepare("SELECT * FROM runs ORDER BY started_at DESC LIMIT 10")
      .all() as RunRecord[],
  };
}

export function getSetting(key: string) {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
    )
    .run(key, value);
}

export function getSettingsMap() {
  const rows = getDb().prepare("SELECT * FROM settings").all() as SettingRecord[];
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function getProjectById(id: number) {
  return getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRecord | undefined;
}

export function listProjects() {
  return getDb()
    .prepare("SELECT * FROM projects ORDER BY created_at DESC")
    .all() as ProjectRecord[];
}

export function listGenerations() {
  return getDb()
    .prepare("SELECT * FROM generations ORDER BY created_at DESC")
    .all() as GenerationRecord[];
}

export function listRuns() {
  return getDb().prepare("SELECT * FROM runs ORDER BY started_at DESC").all() as RunRecord[];
}

export function listRunsForProject(projectId: number) {
  return getDb()
    .prepare("SELECT * FROM runs WHERE project_id = ? ORDER BY started_at DESC")
    .all(projectId) as RunRecord[];
}
