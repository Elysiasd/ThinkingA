"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppState, RunRecord, ProjectRecord } from "./AppFrame";
import type { HealthSnapshot } from "@/lib/health";

type SidebarState = Pick<AppState, "projects" | "runs" | "config">;

type AppStateContextValue = {
  sidebar: SidebarState;
  health: HealthSnapshot | null;
  sidebarRefreshing: boolean;
  healthRefreshing: boolean;
  refreshSidebar: () => Promise<void>;
  refreshHealth: (options?: { force?: boolean }) => Promise<void>;
};

const SIDEBAR_CACHE_KEY = "thinkingap.sidebar-cache";
const HEALTH_CACHE_KEY = "thinkingap.health-cache";
const HEALTH_TTL_MS = 60_000;

const AppStateContext = createContext<AppStateContextValue | null>(null);

const emptySidebar: SidebarState = {
  projects: [],
  runs: [],
  config: {
    projectRoot: "D:\\Program Files (x86)\\ThinkingAP",
    openAIConfigured: false,
  },
};

function readCache<T>(key: string): { value: T; savedAt: number } | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as { value: T; savedAt: number };
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify({ value, savedAt: Date.now() }));
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const cachedSidebar = readCache<SidebarState>(SIDEBAR_CACHE_KEY);
  const cachedHealth = readCache<HealthSnapshot>(HEALTH_CACHE_KEY);

  const [sidebar, setSidebar] = useState<SidebarState>(cachedSidebar?.value ?? emptySidebar);
  const [health, setHealth] = useState<HealthSnapshot | null>(
    cachedHealth && Date.now() - cachedHealth.savedAt < HEALTH_TTL_MS ? cachedHealth.value : null
  );
  const [sidebarRefreshing, setSidebarRefreshing] = useState(false);
  const [healthRefreshing, setHealthRefreshing] = useState(false);

  const refreshSidebar = useCallback(async () => {
    setSidebarRefreshing(true);
    try {
      const response = await fetch("/api/sidebar", { cache: "no-store" });
      const data = await response.json();
      setSidebar(data);
      writeCache(SIDEBAR_CACHE_KEY, data);
    } finally {
      setSidebarRefreshing(false);
    }
  }, []);

  const refreshHealth = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
    const cached = readCache<HealthSnapshot>(HEALTH_CACHE_KEY);
    if (!force && cached && Date.now() - cached.savedAt < HEALTH_TTL_MS) {
      setHealth(cached.value);
      return;
    }

    setHealthRefreshing(true);
    try {
      const response = await fetch(`/api/status/check${force ? "?force=1" : ""}`, { cache: "no-store" });
      const data = await response.json();
      setHealth(data.status);
      writeCache(HEALTH_CACHE_KEY, data.status);
    } finally {
      setHealthRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshSidebar();
    void refreshHealth();
  }, [refreshHealth, refreshSidebar]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      sidebar,
      health,
      sidebarRefreshing,
      healthRefreshing,
      refreshSidebar,
      refreshHealth,
    }),
    [health, healthRefreshing, refreshHealth, refreshSidebar, sidebar, sidebarRefreshing]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return context;
}
