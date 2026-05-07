import { getOpenAIBaseURL, getOpenAIKey, getOpenAIModel, getProjectRoot, maskSecret } from "./config";
import { getSetting, setSetting } from "./db";

export function getSettingsSnapshot() {
  const apiKey = getOpenAIKey();
  return {
    openaiApiKeyMasked: maskSecret(apiKey),
    openaiModel: getOpenAIModel(),
    openaiBaseUrl: getOpenAIBaseURL(),
    projectRoot: getProjectRoot(),
    hasApiKey: Boolean(apiKey),
    savedAt: getSetting("openaiApiKey") ? true : false,
  };
}

export function updateSettings(input: {
  openaiApiKey?: string;
  openaiModel?: string;
  openaiBaseUrl?: string;
  projectRoot?: string;
}) {
  if (typeof input.openaiApiKey === "string") {
    setSetting("openaiApiKey", input.openaiApiKey.trim());
  }
  if (typeof input.openaiModel === "string" && input.openaiModel.trim()) {
    setSetting("openaiModel", input.openaiModel.trim());
  }
  if (typeof input.openaiBaseUrl === "string" && input.openaiBaseUrl.trim()) {
    setSetting("openaiBaseUrl", input.openaiBaseUrl.trim());
  }
  if (typeof input.projectRoot === "string" && input.projectRoot.trim()) {
    setSetting("projectRoot", input.projectRoot.trim());
  }

  return getSettingsSnapshot();
}
