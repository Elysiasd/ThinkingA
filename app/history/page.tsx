"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Folder, Search, TerminalSquare } from "lucide-react";
import { AppFrame, type ProjectRecord, type RunRecord } from "@/components/AppFrame";

type GenerationRecord = {
  id: number;
  idea: string;
  plan_json: string;
  prompt_text: string;
  model: string;
  status: string;
  error: string | null;
  created_at: string;
};

type StateResponse = {
  projects: ProjectRecord[];
  generations: GenerationRecord[];
  runs: RunRecord[];
};

export default function HistoryPage() {
  const [data, setData] = useState<StateResponse>({ projects: [], generations: [], runs: [] });
  const [selected, setSelected] = useState<GenerationRecord | RunRecord | null>(null);
  const [filter, setFilter] = useState("all");

  async function loadHistory() {
    const response = await fetch("/api/state");
    const fullState = await response.json();
    setData({
      projects: fullState.projects,
      generations: fullState.generations,
      runs: fullState.runs,
    });
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  const rows = useMemo(() => {
    const generationRows = data.generations.map((item) => ({
      type: "生成想法",
      time: item.created_at,
      status: item.status,
      cli: "-",
      project: "-",
      raw: item,
    }));
    const runRows = data.runs.map((item) => ({
      type: "运行本地 CLI",
      time: item.started_at,
      status: item.exit_code === 0 ? "completed" : item.exit_code === null ? "running" : "failed",
      cli: item.cli_type,
      project: data.projects.find((project) => project.id === item.project_id)?.name ?? "-",
      raw: item,
    }));
    return [...generationRows, ...runRows]
      .filter((row) => filter === "all" || row.status === filter)
      .sort((a, b) => b.time.localeCompare(a.time));
  }, [data, filter]);

  return (
    <AppFrame>
      <div className="history-layout">
        <section className="history-main">
          <div className="page-title row-title">
            <div>
              <h1>历史</h1>
              <p>记录想法生成、项目创建和本地 CLI 执行结果。</p>
            </div>
            <button className="secondary-button"><Download size={18} /> 导出</button>
          </div>

          <div className="filter-bar">
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">全部状态</option>
              <option value="completed">成功</option>
              <option value="failed">失败</option>
              <option value="running">运行中</option>
            </select>
            <div className="search-box"><Search size={18} /> 搜索想法、命令或日志</div>
          </div>

          <div className="panel table-panel">
            <div className="history-row header">
              <span>时间</span>
              <span>项目</span>
              <span>动作</span>
              <span>CLI</span>
              <span>状态</span>
            </div>
            {rows.map((row, index) => (
              <button className="history-row" key={`${row.type}-${row.time}-${index}`} onClick={() => setSelected(row.raw)}>
                <span>{row.time}</span>
                <span><Folder size={16} /> {row.project}</span>
                <span>{row.type}</span>
                <span>{row.cli}</span>
                <StatusPill status={row.status} />
              </button>
            ))}
          </div>
        </section>

        <aside className="history-detail panel">
          <h2>运行详情</h2>
          {selected ? (
            <HistoryDetail item={selected} />
          ) : (
            <p>选择一条记录查看 idea、prompt、命令和日志。</p>
          )}
        </aside>
      </div>
    </AppFrame>
  );
}

function StatusPill({ status }: { status: string }) {
  const label = status === "completed" ? "成功" : status === "running" ? "运行中" : "失败";
  return <span className={`badge ${status === "completed" ? "ok" : status === "running" ? "info" : "warn"}`}>{label}</span>;
}

function HistoryDetail({ item }: { item: GenerationRecord | RunRecord }) {
  if ("prompt_text" in item) {
    return (
      <div className="detail-stack">
        <label>原始想法</label>
        <p>{item.idea}</p>
        <label>生成计划摘要</label>
        <ol>{JSON.parse(item.plan_json || "[]").map((plan: string) => <li key={plan}>{plan}</li>)}</ol>
        <label>Prompt 预览</label>
        <pre>{item.prompt_text}</pre>
      </div>
    );
  }

  return (
    <div className="detail-stack">
      <label>Command 预览</label>
      <code>{item.command_preview}</code>
      <label>stdout / stderr 日志</label>
      <pre>{[item.stdout, item.stderr].filter(Boolean).join("\n") || "暂无日志"}</pre>
      <label>Exit Code</label>
      <strong>{item.exit_code ?? "-"}</strong>
    </div>
  );
}
