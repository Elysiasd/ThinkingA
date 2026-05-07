"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Copy, Eye, FileText, Folder, GitBranch, Play, RefreshCw, TerminalSquare } from "lucide-react";
import { AppFrame, type ProjectRecord, type RunRecord } from "@/components/AppFrame";

type FileNode = {
  name: string;
  path: string;
  kind: "file" | "directory";
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

  async function loadProject() {
    const [projectResponse, treeResponse] = await Promise.all([
      fetch(`/api/projects/${params.id}`),
      fetch(`/api/projects/${params.id}/tree`),
    ]);
    const projectData = await projectResponse.json();
    const treeData = await treeResponse.json();
    setDetail(projectData);
    setTree(treeData.tree ?? []);
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
            <button className="primary-button"><Play size={18} /> 运行 {detail?.project.cli_preference ?? "CLI"}</button>
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
                <FileTreeNode key={node.path} node={node} onSelect={previewFile} />
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
            <pre className="file-preview">{content || "选择左侧文本文件查看内容。"}</pre>
          </section>
        </div>

        <section className="panel recent-run-panel">
          <h2>最近运行</h2>
          {latestRun ? (
            <div className="run-summary">
              <span>{latestRun.exit_code === 0 ? "成功" : "失败"}</span>
              <span>模型：{latestRun.cli_type}</span>
              <span>退出码：{latestRun.exit_code ?? "-"}</span>
              <code>{latestRun.command_preview}</code>
            </div>
          ) : (
            <p>暂无运行记录。</p>
          )}
        </section>
      </div>
    </AppFrame>
  );
}

function FileTreeNode({ node, onSelect, depth = 0 }: { node: FileNode; onSelect: (path: string) => void; depth?: number }) {
  return (
    <div>
      <button className="file-node" style={{ paddingLeft: 10 + depth * 18 }} onClick={() => node.kind === "file" && onSelect(node.path)}>
        {node.kind === "directory" ? <Folder size={16} /> : <FileText size={16} />}
        <span>{node.name}</span>
      </button>
      {node.children?.map((child) => (
        <FileTreeNode key={child.path} node={child} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
}
