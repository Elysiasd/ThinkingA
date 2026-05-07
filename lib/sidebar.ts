import { getOpenAIBaseURL, getOpenAIKey, getProjectRoot, isOpenAIConfigured, maskSecret } from "./config";
import { getDashboardState } from "./db";

export function getSidebarSnapshot() {
  const { projects, runs } = getDashboardState();
  return {
    projects,
    runs,
    config: {
      projectRoot: getProjectRoot(),
      openAIConfigured: isOpenAIConfigured(),
      openAIKeyMasked: maskSecret(getOpenAIKey()),
      openAIBaseUrl: getOpenAIBaseURL(),
    },
  };
}
