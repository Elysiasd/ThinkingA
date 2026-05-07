"use client";

import Link from "next/link";
import {
  Check,
  Circle,
  Copy,
  GitBranch,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Wand2,
  Folder,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppFrame, type AppState, type CliKind, type ProjectRecord } from "@/components/AppFrame";

type GenerateResult = {
  generationId: number;
  model: string;
  planItems: string[];
  promptText: string;
  projectNameSuggestion: string;
  techStackSuggestion: string;
};

const defaultProjectRoot = "D:\\Program Files (x86)\\ThinkingAP";
const samplePlan = [
  "需求分析与目标定义",
  "功能拆解与 MVP 范围确定",
  "技术选型与架构设计",
  "项目初始化与目录结构设计",
  "核心模块开发",
  "数据存储与本地化方案",
  "AI CLI 执行链路集成",
  "测试与质量保障",
  "文档与使用说明",
];

const samplePrompt = `# Role
你是一位资深的软件工程师，擅长把模糊想法构建成本地可运行应用。

# Task
根据开发计划创建一个最小可运行项目，包含清晰目录、README、基础代码和运行方式。

# Requirements
- 本地运行，不依赖云端托管
- 初始化 Git 仓库
- 代码可继续扩展
- 输出必要的使用说明`;

function slugify(value: string) {
  const slug = value
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 48);

  return slug || "thinkingap-project";
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

export default function Home() {
  const [dashboard, setDashboard] = useState<AppState | undefined>();
  const [idea, setIdea] = useState("");
  const [cli, setCli] = useState<CliKind>("codex");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [targetDir, setTargetDir] = useState(`${defaultProjectRoot}\\odd-idea-notes`);
  const [preparedProjectId, setPreparedProjectId] = useState<number | null>(null);
  const [commandPreview, setCommandPreview] = useState("");
  const [runOutput, setRunOutput] = useState("");
  const [busy, setBusy] = useState<"generate" | "prepare" | "preview" | "run" | null>(null);
  const [error, setError] = useState("");

  const planItems = result?.planItems ?? samplePlan;
  const promptText = result?.promptText ?? samplePrompt;
  const projectName = result?.projectNameSuggestion ?? "odd-idea-notes";
  const activeRoot = dashboard?.config.projectRoot || defaultProjectRoot;

  const progress = useMemo(
    () => [
      { label: "分析想法", active: Boolean(idea.trim()) },
      { label: "生成 Plan & Prompt", active: Boolean(result) },
      { label: "创建仓库", active: Boolean(preparedProjectId) },
      { label: "助手架文件", active: Boolean(preparedProjectId) },
      { label: "运行本地 CLI", active: Boolean(runOutput) },
    ],
    [idea, preparedProjectId, result, runOutput]
  );

  async function loadState() {
    const state = await fetch("/api/sidebar").then((response) => response.json());
    setDashboard(state);
    if (!targetDir || targetDir.startsWith(defaultProjectRoot)) {
      setTargetDir(`${state.config.projectRoot}\\${slugify(projectName)}`);
    }
  }

  useEffect(() => {
    void loadState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (result) {
      setTargetDir(`${activeRoot}\\${slugify(result.projectNameSuggestion)}`);
      setPreparedProjectId(null);
      setCommandPreview("");
      setRunOutput("");
    }
  }, [activeRoot, result]);

  async function generate() {
    setError("");
    if (!dashboard?.config.openAIConfigured) {
      setError("请先在设置页保存 OpenAI API Key，保存后刷新即可直接使用。");
      return;
    }
    setBusy("generate");
    try {
      const data = await postJson<GenerateResult>("/api/generate", { idea });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setBusy(null);
      void loadState();
    }
  }

  async function prepareProject() {
    if (!result) {
      setError("请先生成 Plan & Prompt。");
      return;
    }
    const confirmed = window.confirm(`将在本地创建项目并初始化 Git：\n${targetDir}`);
    if (!confirmed) return;
    setError("");
    setBusy("prepare");
    try {
      const data = await postJson<{ project: ProjectRecord }>("/api/projects/prepare", {
        idea,
        planItems: result.planItems,
        promptText: result.promptText,
        projectName: result.projectNameSuggestion,
        cli,
        targetDir,
        generationId: result.generationId,
        confirmed: true,
      });
      setPreparedProjectId(data.project.id);
      void previewCommand(data.project.target_path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建项目失败");
    } finally {
      setBusy(null);
      void loadState();
    }
  }

  async function previewCommand(projectDir = targetDir) {
    setError("");
    setBusy("preview");
    try {
      const data = await postJson<{ commandPreview: string }>("/api/cli/preview", {
        cli,
        projectDir,
        promptText,
      });
      setCommandPreview(data.commandPreview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "命令预览失败");
    } finally {
      setBusy(null);
    }
  }

  async function runCli() {
    if (!result || !preparedProjectId) {
      setError("请先确认创建本地项目。");
      return;
    }
    const confirmed = window.confirm(`将在本地项目中运行 ${cli.toUpperCase()}：\n${targetDir}`);
    if (!confirmed) return;
    setError("");
    setBusy("run");
    try {
      const data = await postJson<{
        stdout: string;
        stderr: string;
        exitCode: number | null;
        commandPreview: string;
      }>("/api/cli/run", {
        cli,
        projectDir: targetDir,
        promptText: result.promptText,
        projectId: preparedProjectId,
        generationId: result.generationId,
        confirmed: true,
      });
      setCommandPreview(data.commandPreview);
      setRunOutput([data.stdout, data.stderr, `Exit code: ${data.exitCode ?? "n/a"}`].filter(Boolean).join("\n"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "CLI 运行失败");
    } finally {
      setBusy(null);
      void loadState();
    }
  }

  return (
    <AppFrame state={dashboard} onRefresh={loadState}>
      <div className="panel hero-panel">
        <div className="idea-header compact-header">
          <div className="bulb">
            <Sparkles size={22} />
          </div>
          <div>
            <h1>Describe your idea</h1>
            <p>把模糊想法拆成开发计划、Prompt 和可执行的本地项目。</p>
          </div>
        </div>

        <div className="textarea-wrap">
          <textarea
            value={idea}
            maxLength={2000}
            onChange={(event) => setIdea(event.target.value)}
            placeholder="例如：我想做一个能把我每天的奇怪想法自动生成漫画的应用，支持本地运行，数据只保存在本地..."
          />
          <span>{idea.length} / 2000</span>
        </div>

        <button className="primary-button generate-button" onClick={generate} disabled={busy === "generate" || idea.trim().length < 10}>
          {busy === "generate" ? <Loader2 className="spin" size={20} /> : <Wand2 size={20} />}
          生成 Plan & Prompt
        </button>

        {error ? (
          <div className="error-box">
            {error} {!dashboard?.config.openAIConfigured ? <Link href="/settings">前往设置</Link> : null}
          </div>
        ) : null}

        <div className="results-grid">
          <section className="result-card">
            <CardTitle title="开发 Plan" />
            <ol className="plan-list">
              {planItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>
          <section className="result-card">
            <CardTitle title="Prompt" />
            <pre className="prompt-box">{promptText}</pre>
          </section>
        </div>

        <div className="control-band">
          <div className="cli-picker">
            <label>选择本地 AI CLI</label>
            <div className="segmented">
              <button className={cli === "codex" ? "selected" : ""} onClick={() => setCli("codex")}>
                <TerminalSquare size={22} /> Codex
              </button>
              <button className={cli === "claude" ? "selected" : ""} onClick={() => setCli("claude")}>
                <Circle size={20} /> Claude
              </button>
            </div>
          </div>

          <div className="target-field">
            <label>目标项目目录</label>
            <div>
              <input value={targetDir} onChange={(event) => setTargetDir(event.target.value)} />
              <Folder size={18} />
            </div>
          </div>

          <div className="permission-note">
            <ShieldCheck size={24} />
            <div>
              <strong>权限说明</strong>
              <p>ThinkingAP 会在确认后创建项目文件、初始化 Git 并调用本地 AI CLI。OpenAI 只接收你输入的想法用于生成 Plan/Prompt。</p>
            </div>
          </div>
        </div>

        <div className="action-row">
          <button className="primary-button" onClick={prepareProject} disabled={!result || busy === "prepare"}>
            {busy === "prepare" ? <Loader2 className="spin" size={20} /> : <GitBranch size={20} />}
            初始化 Git 仓库并创建本地工作区
          </button>
          <button className="secondary-button" onClick={() => previewCommand()} disabled={!promptText || busy === "preview"}>
            <TerminalSquare size={18} /> 预览命令
          </button>
          <button className="secondary-button strong" onClick={runCli} disabled={!preparedProjectId || busy === "run"}>
            {busy === "run" ? <Loader2 className="spin" size={18} /> : <Play size={18} />}
            运行本地 CLI
          </button>
        </div>

        {commandPreview ? (
          <div className="command-preview">
            <span>命令预览</span>
            <code>{commandPreview}</code>
          </div>
        ) : null}

        {runOutput ? <pre className="run-output">{runOutput}</pre> : null}

        <div className="stepper">
          {progress.map((step, index) => (
            <div className={step.active ? "step active" : "step"} key={step.label}>
              <span>{step.active ? <Check size={14} /> : index + 1}</span>
              <div>
                <strong>{step.label}</strong>
                <small>{step.active ? "已完成" : "待开始"}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppFrame>
  );
}

function CardTitle({ title }: { title: string }) {
  return (
    <div className="card-title">
      <h2>{title}</h2>
      <button>
        <Copy size={16} /> 复制
      </button>
    </div>
  );
}
