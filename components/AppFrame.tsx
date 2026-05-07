"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronsLeft,
  Clock3,
  FileText,
  Folder,
  Grid2X2,
  History,
  RefreshCw,
  Settings,
  Sun,
} from "lucide-react";
import { useEffect } from "react";
import { useAppState } from "./AppStateProvider";

export type CliKind = "codex" | "claude";

export type ProjectRecord = {
  id: number;
  name: string;
  slug: string;
  target_path: string;
  git_status: string;
  cli_preference: CliKind;
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

export type AppState = {
  projects: ProjectRecord[];
  runs: RunRecord[];
  config: {
    projectRoot: string;
    openAIConfigured: boolean;
    openAIKeyMasked?: string;
    openAIBaseUrl?: string;
  };
  status?: {
    git?: { available?: boolean; output?: string; error?: string };
    codex?: { available?: boolean; output?: string; error?: string };
    claude?: { available?: boolean; output?: string; error?: string };
    workspace?: { writable?: boolean; error?: string };
  };
};

export function AppFrame({
  children,
  state: providedState,
  onRefresh,
}: {
  children: React.ReactNode;
  state?: AppState;
  onRefresh?: () => void;
}) {
  const { sidebar, health, refreshSidebar, refreshHealth, healthRefreshing } = useAppState();
  const state: AppState = {
    ...(providedState ?? sidebar),
    status: providedState?.status ?? health ?? undefined,
  };
  const pathname = usePathname();

  async function refreshState() {
    await Promise.all([refreshSidebar(), refreshHealth({ force: true })]);
    onRefresh?.();
  }

  useEffect(() => {
    if (!providedState) {
      void refreshSidebar();
    }
  }, [providedState, refreshSidebar]);

  const activeProject = state.projects[0];
  const latestRun = state.runs[0];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <Link className="brand-link" href="/">
            <div className="brand-mark">T</div>
            <strong>ThinkingAP</strong>
          </Link>
          <button className="icon-button" aria-label="Collapse sidebar">
            <ChevronsLeft size={18} />
          </button>
        </div>

        <nav className="side-nav">
          <NavItem href="/" active={pathname === "/"} icon={<Grid2X2 size={17} />} label="工作台" />
          <NavItem href="/projects" active={pathname.startsWith("/projects")} icon={<Folder size={17} />} label="项目" />
          <NavItem href="/history" active={pathname === "/history"} icon={<History size={17} />} label="历史" />
          <NavItem href="/docs" active={pathname === "/docs"} icon={<BookOpen size={17} />} label="文档" />
        </nav>

        <section className="side-section">
          <div className="section-heading">
            <span>项目</span>
            <Link className="ghost-button" href="/projects/new">
              + 新建项目
            </Link>
          </div>
          {state.projects.length ? (
            <div className="project-list">
              {state.projects.slice(0, 5).map((project) => (
                <Link className="project-pill" href={`/projects/${project.id}`} key={project.id}>
                  <Folder size={18} />
                  <span>{project.name}</span>
                  <i />
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-side">还没有项目，先从一个想法开始。</div>
          )}

          <div className="tree compact-tree">
            <TreeLine icon={<Folder size={16} />} label={activeProject?.name ?? "workspace"} />
            <TreeLine icon={<Folder size={16} />} label=".thinkingap" depth />
            <TreeLine icon={<FileText size={15} />} label="plan.md" depth />
            <TreeLine icon={<FileText size={15} />} label="prompt.txt" depth />
            <TreeLine icon={<FileText size={15} />} label="README.md" depth />
          </div>
        </section>

        <section className="side-section status-section">
          <div className="section-heading">
            <span>状态</span>
            <button className="text-icon" onClick={refreshState}>
              <RefreshCw className={healthRefreshing ? "spin" : ""} size={14} /> 刷新
            </button>
          </div>
          <StatusRow label="OpenAI API" status={state.config.openAIConfigured ? "已配置" : "未配置"} ok={state.config.openAIConfigured} />
          <StatusRow
            label="本地 CLI"
            status={state.status?.codex?.available || state.status?.claude?.available ? "可用" : "缺失"}
            ok={Boolean(state.status?.codex?.available || state.status?.claude?.available)}
          />
          <StatusRow label="Git" status={state.status?.git?.available ? "可用" : "缺失"} ok={state.status?.git?.available} />
          <StatusRow label="工作区" status={state.status?.workspace?.writable ? "就绪" : "不可写"} ok={state.status?.workspace?.writable} />
          <StatusRow
            label="最近运行"
            status={latestRun ? (latestRun.exit_code === 0 ? "成功" : latestRun.exit_code === null ? "运行中" : "失败") : "-"}
            ok={latestRun?.exit_code === 0}
          />
        </section>

        <Link className="settings-link" href="/settings">
          <Settings size={18} /> 设置
        </Link>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div />
          <nav>
            <Link href="/docs"><BookOpen size={18} /> 文档</Link>
            <Link href="/history"><Clock3 size={18} /> 历史</Link>
            <span className="divider" />
            <Sun size={18} />
            <span className="avatar">U</span>
          </nav>
        </header>
        {children}
      </section>
    </main>
  );
}

function NavItem({ href, active, icon, label }: { href: string; active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <Link className={active ? "nav-item active" : "nav-item"} href={href}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function TreeLine({ icon, label, depth = false }: { icon: React.ReactNode; label: string; depth?: boolean }) {
  return (
    <div className={depth ? "tree-line depth" : "tree-line"}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function StatusRow({ label, status, ok }: { label: string; status: string; ok?: boolean }) {
  return (
    <div className="status-row">
      <span><i className={ok ? "ok" : ""} /> {label}</span>
      <strong className={ok ? "" : "warn"}>{status}</strong>
    </div>
  );
}
