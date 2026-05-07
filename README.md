# ThinkingAP

ThinkingAP 是一个本地优先的 Web 工作台，用来把奇怪的想法转换成开发计划、代码提示词和可运行的本地项目雏形。

## 主要能力

- 输入一个想法，生成开发 Plan 和本地 AI CLI Prompt。
- 在网页里保存 OpenAI API Key、模型和请求地址。
- 在本地目录 `D:\Program Files (x86)\ThinkingAP` 下创建项目。
- 初始化 Git 仓库，并写入 `.thinkingap/plan.md` 和 `.thinkingap/prompt.txt`。
- 预览并执行本地 Codex / Claude CLI 命令。
- 浏览项目文件、历史记录和 CLI 运行日志。

## 启动方式

```powershell
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

打开：

```text
http://127.0.0.1:3000
```

## 配置说明

进入“设置”页后配置以下内容：

- OpenAI API Key
- OpenAI model，默认 `gpt-5.5`
- OpenAI-compatible API 请求地址，默认 `https://api.jucode.cn/v1`
- 本地项目根目录，默认 `D:\Program Files (x86)\ThinkingAP`

API Key 仅保存在本机，浏览器里只显示脱敏值。

## 安全边界

ThinkingAP 只允许在配置的本地项目根目录内执行文件读取、写入、项目创建和 CLI 运行。OpenAI 只接收用户输入的想法文本，用于生成 Plan 和 Prompt，不会上传本地项目代码。

## 常用命令

```powershell
npm run lint
npm test
npm run build
```

## 设计参考

界面概念图保存在 `assets/design`。
