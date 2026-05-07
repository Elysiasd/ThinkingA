"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckSquare, Circle, Folder, Loader2, Save, TerminalSquare } from "lucide-react";
import { AppFrame, type CliKind, type ProjectRecord } from "@/components/AppFrame";

const defaultRoot = "D:\\Program Files (x86)\\ThinkingAP";

export default function NewProjectPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("odd-idea-lab");
  const [targetDir, setTargetDir] = useState(`${defaultRoot}\\odd-idea-lab`);
  const [idea, setIdea] = useState("");
  const [cli, setCli] = useState<CliKind>("codex");
  const [planItems, setPlanItems] = useState(["定义 MVP 与边界", "选择本地数据方案", "生成项目骨架", "接入本地 CLI 运行脚本", "准备 README 与启动命令"]);
  const [promptText, setPromptText] = useState(`# Role
你是一位资深的软件工程师，擅长构建本地可运行项目。

# Task
根据开发计划创建最小可运行项目，并写出 README 与启动命令。

# Requirements
- 本地运行
- 初始化 Git 仓库
- 输出清晰目录结构`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function createProject() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/projects/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea || "ThinkingAP 新建项目向导创建的本地项目",
          planItems,
          promptText,
          projectName,
          cli,
          targetDir,
          confirmed: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "创建失败");
      const project = data.project as ProjectRecord;
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppFrame>
      <div className="page-wrap">
        <section className="panel wizard-panel">
          <div className="wizard-head">
            <div>
              <h1>新建项目</h1>
              <p>把一个奇怪想法拆成可执行的本地工程。</p>
            </div>
            <div className="wizard-steps">
              <span>1 输入想法</span>
              <strong>2 确认 Plan & Prompt</strong>
              <span>3 创建本地项目</span>
            </div>
          </div>

          <div className="wizard-grid">
            <section className="form-panel inner-panel">
              <h2>项目信息</h2>
              <label>项目名称</label>
              <input className="field" value={projectName} onChange={(event) => setProjectName(event.target.value)} />
              <label>目标目录</label>
              <div className="input-with-icon">
                <input value={targetDir} onChange={(event) => setTargetDir(event.target.value)} />
                <Folder size={18} />
              </div>
              <label>本地 AI CLI</label>
              <div className="segmented">
                <button className={cli === "codex" ? "selected" : ""} onClick={() => setCli("codex")}>
                  <TerminalSquare size={20} /> Codex
                </button>
                <button className={cli === "claude" ? "selected" : ""} onClick={() => setCli("claude")}>
                  <Circle size={18} /> Claude
                </button>
              </div>
              <label>输入想法</label>
              <textarea value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="描述一个奇怪的想法、模糊的点子或不完整需求。" />
            </section>

            <section className="inner-panel plan-editor">
              <h2>开发 Plan</h2>
              {planItems.map((item, index) => (
                <label className="check-line" key={`${item}-${index}`}>
                  <input type="checkbox" checked readOnly />
                  <span>{item}</span>
                </label>
              ))}
              <button className="text-icon" onClick={() => setPlanItems([...planItems, "补充计划步骤"])}>
                + 添加计划步骤
              </button>
            </section>

            <section className="inner-panel prompt-editor">
              <h2>Prompt 预览</h2>
              <textarea value={promptText} onChange={(event) => setPromptText(event.target.value)} />
            </section>
          </div>

          <div className="permission-row">
            <span><CheckSquare size={18} /> 创建项目文件</span>
            <span><CheckSquare size={18} /> 初始化 Git 仓库</span>
            <span><CheckSquare size={18} /> 运行本地 CLI</span>
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          <div className="wizard-actions">
            <button className="secondary-button"><Save size={18} /> 保存草稿</button>
            <button className="primary-button" onClick={createProject} disabled={busy}>
              {busy ? <Loader2 className="spin" size={18} /> : <CheckSquare size={18} />}
              创建项目
            </button>
          </div>
        </section>
      </div>
    </AppFrame>
  );
}
