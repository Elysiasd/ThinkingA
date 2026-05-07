import { AppFrame } from "@/components/AppFrame";

export default function DocsPage() {
  return (
    <AppFrame>
      <div className="page-wrap docs-page">
        <div className="page-title">
          <h1>文档</h1>
          <p>ThinkingAP 在本地把想法转换成开发计划、Prompt 和可运行项目雏形。</p>
        </div>

        <section className="panel docs-section">
          <h2>工作流</h2>
          <ol>
            <li>在工作台输入想法，生成开发 Plan 和 Prompt。</li>
            <li>确认目标目录、AI CLI 和权限。</li>
            <li>创建项目目录、写入 `.thinkingap/plan.md` 与 `prompt.txt`，初始化 Git。</li>
            <li>确认后调用本地 Codex 或 Claude CLI。</li>
          </ol>
        </section>

        <section className="panel docs-section">
          <h2>安全边界</h2>
          <p>文件读取、写入和命令执行都会限制在设置页配置的项目根目录内。OpenAI 只接收你输入的想法用于生成 Plan/Prompt，不会上传你的项目代码。</p>
        </section>

        <section className="panel docs-section">
          <h2>配置</h2>
          <p>进入设置页保存 OpenAI API Key、模型和默认项目根目录。保存后刷新页面即可使用，无需重启开发服务。</p>
        </section>
      </div>
    </AppFrame>
  );
}
