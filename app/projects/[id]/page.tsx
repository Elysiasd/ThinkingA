"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  Play,
  RefreshCw,
  RotateCcw,
  Square,
  Trash2,
  TerminalSquare,
} from "lucide-react";
import { AppFrame, type ProjectRecord, type RunRecord } from "@/components/AppFrame";

type FileNode = {
  name: string;
  path: string;
  kind: "file" | "directory";
  defaultExpanded?: boolean;
  children?: FileNode[];
};

type ProjectDetail = {
  project: ProjectRecord;
  runs: RunRecord[];
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({});
  const [consoleMode, setConsoleMode] = useState<"stdout" | "stderr" | "all">("stdout");
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "success" | "failed">("idle");
  const [logFilter, setLogFilter] = useState<"stdout" | "stderr" | "all">("stdout");

  async function loadProject() {
    const [projectResponse, treeResponse] = await Promise.all([
      fetch(`/api/projects/${params.id}`),
      fetch(`/api/projects/${params.id}/tree`),
    ]);
    const projectData = await projectResponse.json();
    const treeData = await treeResponse.json();
    setDetail(projectData);
    setTree(treeData.tree ?? []);
    const nextExpanded: Record<string, boolean> = {};
    const collectExpanded = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.kind === "directory" && node.defaultExpanded) {
          nextExpanded[node.path] = true;
        }
        if (node.children?.length) {
          collectExpanded(node.children);
        }
      }
    };
    collectExpanded(treeData.tree ?? []);
    setExpandedPaths((current) => ({ ...nextExpanded, ...current }));
  }

  useEffect(() => {
    void loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function previewFile(path: string) {
    setSelectedPath(path);
    setError("");
    try {
      const response = await fetch("/api/files/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "读取失败");
      setContent(data.content);
    } catch (err) {
      setContent("");
      setError(err instanceof Error ? err.message : "读取失败");
    }
  }

  const runPreview = useMemo(() => {
    const latest = detail?.runs[0];
    if (!latest) return null;

    const stdoutLines = latest.stdout ? latest.stdout.split(/\r?\n/) : [];
    const stderrLines = latest.stderr ? latest.stderr.split(/\r?\n/) : [];
    const merged = [
      ...stdoutLines.map((line) => ({ source: "stdout" as const, line })),
      ...stderrLines.map((line) => ({ source: "stderr" as const, line })),
    ];
    const filtered = merged.filter((entry) => logFilter === "all" || entry.source === logFilter);

    return {
      commandPreview: latest.command_preview,
      workdir: latest.workdir,
      exitCode: latest.exit_code,
      stdoutLines,
      stderrLines,
      filtered,
    };
  }, [detail?.runs, logFilter]);

  const latestRun = detail?.runs[0];

  return (
    <AppFrame>
      <div className="page-wrap">
        <section className="panel project-hero">
          <div>
            <h1>{detail?.project.name ?? "项目详情"}</h1>
            <div className="meta-row hero-meta">
              <span><GitBranch size={16} /> {detail?.project.git_status ?? "-"}</span>
              <span><Folder size={16} /> {detail?.project.target_path ?? "-"}</span>
              <span><TerminalSquare size={16} /> {detail?.project.cli_preference ?? "-"}</span>
              <span>上次运行：{latestRun ? (latestRun.exit_code === 0 ? "成功" : "失败") : "-"}</span>
            </div>
          </div>
          <div className="project-actions">
            <button className="secondary-button" onClick={loadProject}><RefreshCw size={18} /> 刷新</button>
            <button className="primary-button" onClick={() => setRunStatus("running")}><Play size={18} /> 运行 {detail?.project.cli_preference ?? "CLI"}</button>
          </div>
        </section>

        <div className="tabs-row">
          <span>概览</span>
          <strong>文件</strong>
          <span>Plan</span>
          <span>Prompt</span>
          <span>运行记录</span>
        </div>

        <div className="project-detail-grid">
          <section className="panel file-tree-panel">
            <div className="card-title">
              <h2>文件树</h2>
              <button onClick={loadProject}><RefreshCw size={16} /> 刷新</button>
            </div>
            <div className="file-tree-list">
              {tree.map((node) => (
                <FileTreeNode
                  key={node.path}
                  node={node}
                  onSelect={previewFile}
                  expandedPaths={expandedPaths}
                  onToggle={(path) => setExpandedPaths((current) => ({ ...current, [path]: !current[path] }))}
                />
              ))}
            </div>
          </section>

          <section className="panel preview-panel">
            <div className="card-title">
              <h2>{selectedPath ? selectedPath.replace(detail?.project.target_path ?? "", "").replace(/^\\/, "") : "文件预览"}</h2>
              <div className="inline-actions">
                <button><Eye size={16} /> 预览</button>
                <button><Copy size={16} /> 复制</button>
              </div>
            </div>
            {error ? <div className="error-box">{error}</div> : null}
            {content ? <pre className="file-preview">{content}</pre> : (
              <div className="preview-empty">
                <p>选择左侧文本文件查看内容。</p>
                <div className="quick-links">
                  <button className="secondary-button">查看 README</button>
                  <button className="secondary-button">打开 Plan</button>
                  <button className="secondary-button">打开 Prompt</button>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="panel cli-console-panel">
          <div className="cli-console-head">
            <div>
              <h2>本地 CLI 运行控制台</h2>
              <p>参考概念图显示命令、步骤、日志、状态和快捷操作。</p>
            </div>
            <div className="status-pills">
              <span className="status-pill neutral">已确认：{detail?.project.cli_preference ?? "CLI"}</span>
              <span className={runStatus === "running" ? "status-pill running" : runStatus === "success" ? "status-pill success" : runStatus === "failed" ? "status-pill failed" : "status-pill neutral"}>
                {runStatus === "running" ? "Running" : runStatus === "success" ? "Success" : runStatus === "failed" ? "Failed" : "Idle"}
              </span>
            </div>
          </div>

          <div className="console-summary-grid">
            <div className="console-summary-item">
              <label>执行命令</label>
              <code>{runPreview?.commandPreview || `codex run --project ${detail?.project.name ?? "-"} --confirm`}</code>
            </div>
            <div className="console-summary-item">
              <label>工作目录</label>
              <code>{runPreview?.workdir || detail?.project.target_path || "-"}</code>
            </div>
            <div className="console-summary-item">
              <label>运行状态</label>
              <div className="status-card-row">
                <span className="status-chip active"><CheckCircle2 size={16} /> Running</span>
                <span className="status-chip"><CheckCircle2 size={16} /> Success</span>
                <span className="status-chip danger"><CheckCircle2 size={16} /> Failed</span>
              </div>
            </div>
          </div>

          <div className="console-body-grid">
            <section className="steps-panel">
              <h3>运行步骤</h3>
              <div className="step-track">
                {[
                  ["创建目录", "创建运行目录与必要子目录", latestRun?.exit_code !== null],
                  ["写入 Plan", "生成 plan.md", latestRun?.exit_code !== null],
                  ["初始化 Git", "初始化本地 Git 仓库", latestRun?.exit_code !== null],
                  ["生成脚手架", "生成项目文件", latestRun?.exit_code !== null],
                  ["安装依赖", "安装项目依赖包", runStatus === "running"],
                  ["完成", "所有任务完成", runStatus === "success"],
                ].map(([title, desc, done]) => (
                  <div className={done ? "step-row done" : "step-row"} key={title as string}>
                    <span className="step-dot">{done ? <CheckCircle2 size={18} /> : <FolderOpen size={18} />}</span>
                    <div>
                      <strong>{title as string}</strong>
                      <p>{desc as string}</p>
                    </div>
                    <small>{done ? "已完成" : "--:--:--"}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="logs-panel">
              <div className="logs-head">
                <h3>实时终端日志</h3>
                <div className="log-tabs">
                  {(["stdout", "stderr", "all"] as const).map((mode) => (
                    <button
                      key={mode}
                      className={logFilter === mode ? "tab-button active" : "tab-button"}
                      onClick={() => setLogFilter(mode)}
                    >
                      {mode}
                    </button>
                  ))}
                  <button className="icon-button-inline"><Trash2 size={16} /> 清空</button>
                </div>
              </div>

              <div className="log-viewer">
                <div className="log-line command-line">$ {runPreview?.commandPreview || "codex run --project ... --confirm"}</div>
                {(runPreview?.filtered.length ? runPreview.filtered : [
                  { source: "stdout" as const, line: "creating directory .thinkingap/run-0421" },
                  { source: "stdout" as const, line: "writing plan.md" },
                  { source: "stdout" as const, line: "initializing git repository" },
                  { source: "stdout" as const, line: "scaffolding app files" },
                  { source: "stderr" as const, line: "npm WARN deprecated package: example@1.0.0" },
                  { source: "stdout" as const, line: "installing dependencies" },
                  { source: "stdout" as const, line: "exit code: running" },
                  { source: "stdout" as const, line: "elapsed: 02:18" },
                ]).map((entry, index) => (
                  <div className={entry.source === "stderr" ? "log-line stderr" : "log-line stdout"} key={`${entry.source}-${index}`}>
                    <span className="log-index">{index + 1}</span>
                    <span className="log-tag">[{entry.source}]</span>
                    <span>{entry.line}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="console-footer-note">
            <p>用户已确认本地执行，代码与依赖操作仅在本机运行。</p>
          </div>

          <div className="console-actions">
            <button className="danger-button" onClick={() => setRunStatus("failed")}><Square size={16} /> 停止运行</button>
            <button className="secondary-button" onClick={loadProject}><RotateCcw size={16} /> 重新运行</button>
            <button className="secondary-button"><Folder size={16} /> 打开项目目录</button>
            <button className="secondary-button"><FileText size={16} /> 查看生成文件</button>
          </div>
        </section>
      </div>
    </AppFrame>
  );
}

function FileTreeNode({
  node,
  onSelect,
  expandedPaths,
  onToggle,
  depth = 0,
}: {
  node: FileNode;
  onSelect: (path: string) => void;
  expandedPaths: Record<string, boolean>;
  onToggle: (path: string) => void;
  depth?: number;
}) {
  const isExpanded = expandedPaths[node.path] ?? Boolean(node.defaultExpanded);
  return (
    <div>
      <button
        className="file-node"
        style={{ paddingLeft: 10 + depth * 18 }}
        onClick={() => (node.kind === "file" ? onSelect(node.path) : onToggle(node.path))}
      >
        {node.kind === "directory" ? (isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />) : <FileText size={16} />}
        {node.kind === "directory" ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="file-node-spacer" />}
        <span>{node.name}</span>
      </button>
      {isExpanded && node.children?.map((child) => (
        <FileTreeNode
          key={child.path}
          node={child}
          onSelect={onSelect}
          expandedPaths={expandedPaths}
          onToggle={onToggle}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
