"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Folder, KeyRound, Loader2, Save, ShieldCheck, TerminalSquare, TestTube2 } from "lucide-react";
import { AppFrame } from "@/components/AppFrame";

type SettingsResponse = {
  settings: {
    openaiApiKeyMasked: string;
    openaiModel: string;
    openaiBaseUrl: string;
    projectRoot: string;
    hasApiKey: boolean;
  };
  status: {
    git: { available: boolean; output?: string };
    codex: { available: boolean; output?: string };
    claude: { available: boolean; output?: string };
    workspace: { writable: boolean; error?: string };
  };
};

export default function SettingsPage() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-5.5");
  const [baseUrl, setBaseUrl] = useState("https://api.jucode.cn/v1");
  const [projectRoot, setProjectRoot] = useState("D:\\Program Files (x86)\\ThinkingAP");
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [message, setMessage] = useState("");

  async function loadSettings() {
    const response = await fetch("/api/settings");
    const nextData = await response.json();
    setData(nextData);
    setModel(nextData.settings.openaiModel);
    setBaseUrl(nextData.settings.openaiBaseUrl);
    setProjectRoot(nextData.settings.projectRoot);
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function saveSettings() {
    setBusy("save");
    setMessage("");
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openaiApiKey: apiKey || undefined,
          openaiModel: model,
          openaiBaseUrl: baseUrl,
          projectRoot,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "保存失败");
      setApiKey("");
      setMessage("配置已保存，刷新后可直接使用。");
      await loadSettings();
      await fetch("/api/status/check?force=1", { cache: "no-store" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(null);
    }
  }

  async function testConnection() {
    setBusy("test");
    setMessage("");
    try {
      const response = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: apiKey || undefined, openaiBaseUrl: baseUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "测试失败");
      setMessage("OpenAI 连接测试成功。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "测试失败");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppFrame>
      <div className="page-wrap">
        <div className="page-title">
          <h1>设置</h1>
          <p>配置本地 API、模型、CLI 与项目工作区。密钥只保存在本机 SQLite 数据库。</p>
        </div>

        <div className="settings-grid">
          <section className="panel form-panel">
            <div className="panel-heading">
              <KeyRound size={22} />
              <div>
                <h2>OpenAI API</h2>
                <p>保存后刷新页面即可生成 Plan & Prompt。</p>
              </div>
              <StatusBadge ok={data?.settings.hasApiKey} label={data?.settings.hasApiKey ? "已配置" : "未配置"} />
            </div>

            <label>API Key</label>
            <input
              className="field"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={data?.settings.openaiApiKeyMasked || "sk-..."}
            />
            <div className="field-help">保存后前端只显示脱敏值：{data?.settings.openaiApiKeyMasked || "未保存"}</div>

            <label>模型</label>
            <input className="field" value={model} onChange={(event) => setModel(event.target.value)} />

            <label>API 请求地址</label>
            <input className="field" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />

            <div className="action-row">
              <button className="primary-button" onClick={saveSettings} disabled={busy === "save"}>
                {busy === "save" ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                保存配置
              </button>
              <button className="secondary-button" onClick={testConnection} disabled={busy === "test" || (!apiKey && !data?.settings.hasApiKey)}>
                {busy === "test" ? <Loader2 className="spin" size={18} /> : <TestTube2 size={18} />}
                测试连接
              </button>
            </div>
            {message ? <div className="info-box">{message}</div> : null}
          </section>

          <section className="panel form-panel">
            <div className="panel-heading">
              <Folder size={22} />
              <div>
                <h2>工作区目录</h2>
                <p>所有创建、读取、执行都限制在这个根目录内。</p>
              </div>
              <StatusBadge ok={data?.status.workspace.writable} label={data?.status.workspace.writable ? "可写" : "不可写"} />
            </div>
            <label>默认项目根目录</label>
            <input className="field" value={projectRoot} onChange={(event) => setProjectRoot(event.target.value)} />
            <div className="permission-strip">
              <ShieldCheck size={20} />
              <span>ThinkingAP 会拒绝越出该目录的文件读取、写入和命令执行。</span>
            </div>
          </section>

          <section className="panel form-panel wide-panel">
            <div className="panel-heading">
              <TerminalSquare size={22} />
              <div>
                <h2>本地 CLI 与 Git</h2>
                <p>检测当前 PATH 中可用的本地工具。</p>
              </div>
            </div>
            <div className="status-card-grid">
              <ToolStatus title="Codex" ok={data?.status.codex.available} detail={data?.status.codex.output} />
              <ToolStatus title="Claude" ok={data?.status.claude.available} detail={data?.status.claude.output} />
              <ToolStatus title="Git" ok={data?.status.git.available} detail={data?.status.git.output} />
            </div>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}

function StatusBadge({ ok, label }: { ok?: boolean; label: string }) {
  return <span className={ok ? "badge ok" : "badge warn"}>{label}</span>;
}

function ToolStatus({ title, ok, detail }: { title: string; ok?: boolean; detail?: string }) {
  return (
    <div className="tool-card">
      <CheckCircle2 size={22} className={ok ? "green-icon" : "muted-icon"} />
      <strong>{title}</strong>
      <span>{ok ? "可用" : "未检测到"}</span>
      <code>{detail || "-"}</code>
    </div>
  );
}
