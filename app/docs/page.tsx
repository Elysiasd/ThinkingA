import { AppFrame } from "@/components/AppFrame";

export default function DocsPage() {
  return (
    <AppFrame>
      <div className="page-wrap docs-page">
        <div className="page-title">
          <h1>文档</h1>
          <p>ThinkingAP 在本地把想法转换成开发计划、Prompt 和最小可运行项目雏形。</p>
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
          <p>文件读取、写入、项目创建和命令执行都会限制在设置页配置的项目根目录内，默认是 <code>D:\Program Files (x86)\ThinkingAP</code>。生成 Plan/Prompt 时，ThinkingAP 会把你输入的想法发送到已配置的 OpenAI-compatible Responses API。ThinkingAP 自身不会主动上传本地项目代码；当你确认运行 Codex 或 Claude CLI 后，具体网络请求、上下文收集和数据流由所选 CLI、模型服务和本机配置决定。</p>
        </section>

        <section className="panel docs-section">
          <h2>配置</h2>
          <p>进入设置页保存 OpenAI API Key、模型、OpenAI-compatible Responses API 请求地址和默认项目根目录。默认请求地址是 <code>https://api.jucode.cn/v1</code>。网页设置页优先于 <code>.env.local</code>，保存后刷新页面即可使用，无需重启开发服务。</p>
        </section>
      </div>
    </AppFrame>
  );
}
