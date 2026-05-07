import path from "node:path";
import { getSetting } from "./db";

export const DEFAULT_PROJECT_ROOT = "D:\\Program Files (x86)\\ThinkingAP";
export const DEFAULT_MODEL = "gpt-5.5";
export const DEFAULT_OPENAI_BASE_URL = "https://api.jucode.cn/v1";

export function getProjectRoot() {
  return (
    getSetting("projectRoot")?.trim() ||
    process.env.THINKINGAP_PROJECT_ROOT?.trim() ||
    DEFAULT_PROJECT_ROOT
  );
}

export function getOpenAIModel() {
  return getSetting("openaiModel")?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

export function getOpenAIBaseURL() {
  return (
    getSetting("openaiBaseUrl")?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    DEFAULT_OPENAI_BASE_URL
  );
}

export function getDatabasePath() {
  return process.env.THINKINGAP_DB_PATH || path.join(process.cwd(), "data", "thinkingap.db");
}

export function isOpenAIConfigured() {
  return Boolean(getOpenAIKey());
}

export function getOpenAIKey() {
  return getSetting("openaiApiKey")?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
}

export function maskSecret(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  if (value.length <= 8) {
    return "••••";
  }

  return `${value.slice(0, 3)}...${value.slice(-4)}`;
}
