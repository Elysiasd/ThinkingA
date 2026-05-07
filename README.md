# ThinkingAP

ThinkingAP 是一个本地优先的 Web 工作台，用来把日常冒出来的想法转换成开发 Plan、可交给本地 AI CLI 的 Prompt，并在本机生成一个最小可运行项目雏形。

它适合这样的流程：先在浏览器里描述项目想法，让 ThinkingAP 生成结构化计划和提示词，再由你确认目录、权限和命令，最后调用本机已安装的 Codex 或 Claude CLI 创建项目骨架。

## 主要能力

- 输入想法，生成开发 Plan 和本地 AI CLI Prompt。
- 在网页设置页保存 API Key、模型和 OpenAI-compatible Responses API 请求地址。
- 默认在 `D:\Program Files (x86)\ThinkingAP` 下创建用户项目。
- 写入 `.thinkingap/plan.md`、`.thinkingap/prompt.txt` 和项目 `README.md`。
- 初始化 Git 仓库，预览并执行本地 Codex / Claude CLI 命令。
- 浏览真实项目文件、生成历史和 CLI 运行日志。

## 前置条件

- Windows + PowerShell。
- Node.js 与 npm。
- Git。
- 可选：Codex CLI 或 Claude CLI。未安装时仍可生成 Plan/Prompt，但不能直接执行对应本地 CLI。

## 获取源码

```powershell
git clone https://github.com/Elysiasd/ThinkingA.git
cd ThinkingA
```

如果你已经在本地拥有源码目录，直接进入该目录即可：

```powershell
cd D:\Program\ThinkingA
```

## 安装依赖

```powershell
npm install
```

## 可选环境变量

ThinkingAP 支持通过网页“设置”页保存配置，这是推荐方式；数据库中的网页配置优先于 `.env.local`。

`.env.local` 只作为兜底配置使用，例如首次启动前想预置默认值时：

```powershell
Copy-Item .env.example .env.local
```

`.env.example` 默认包含：

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
OPENAI_BASE_URL=https://api.openai.com/v1
THINKINGAP_PROJECT_ROOT=D:\Program Files (x86)\ThinkingAP
```

其中 `OPENAI_BASE_URL` 是 OpenAI 官方 API 请求地址。当前默认值为：

```text
https://api.openai.com/v1
```

## 开发启动

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3000
```

打开浏览器访问：

```text
http://127.0.0.1:3000
```

开发时使用 `npm run dev`。如果端口 `3000` 被占用，可以换成其他端口，例如：

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3001
```

## 首次使用

1. 打开 `http://127.0.0.1:3000`。
2. 进入“设置”页。
3. 填写 API Key、模型、API 请求地址和项目根目录。
4. 默认 API 请求地址使用 OpenAI 官方地址 `https://api.openai.com/v1`；如需自定义兼容 Responses API 的服务，可以在设置页手动改写。
5. 确认项目根目录，默认是 `D:\Program Files (x86)\ThinkingAP`。
6. 返回工作台，输入你的项目想法。
7. 点击生成 Plan & Prompt。
8. 确认目标目录、CLI 类型和权限说明。
9. 创建本地项目，预览命令。
10. 最后确认是否运行本地 Codex / Claude CLI。

## 生产启动

生产模式需要先构建，再启动：

```powershell
npm run build
npm run start
```

`npm run start` 依赖已经生成的构建产物；日常开发和调试请使用 `npm run dev`。

## 安全边界

ThinkingAP 会校验文件读取、写入、项目创建和 CLI 运行路径，默认只允许操作配置的本地项目根目录，例如 `D:\Program Files (x86)\ThinkingAP`。

生成 Plan/Prompt 时，ThinkingAP 会把你输入的想法发送到已配置的 OpenAI-compatible Responses API，用于返回结构化计划和提示词。

ThinkingAP 自身不会主动上传本地项目代码；当你确认运行 Codex 或 Claude CLI 后，具体网络请求、上下文收集和数据流由所选 CLI、模型服务和本机配置决定。运行前请先检查命令预览、工作目录和 Prompt 内容。

## 常用命令

```powershell
npm run lint
npm test
npm run build
```

说明：

- `npm run lint` 当前执行 TypeScript 类型检查。
- `npm test` 运行 Vitest 测试。
- `npm run build` 验证 Next.js 生产构建。

## 常见问题

### 保存 API Key 后是否需要重启服务？

不需要。网页“设置”页保存的配置会写入本地 SQLite 数据库，刷新页面后即可使用。

### `.env.local` 和网页设置哪个优先？

网页设置优先。`.env.local` 只作为数据库未配置时的兜底来源。

### 为什么默认项目目录在 `D:\Program Files (x86)\ThinkingAP`？

这是 ThinkingAP 的本地项目工作区。应用会限制项目创建、文件读取和 CLI 执行都发生在该目录内，降低误操作其他路径的风险。如果目录不存在或不可写，需要先在设置页确认并授权创建，或调整为该根目录内可写的子目录。

### ThinkingAP 会一次生成完整产品吗？

不会承诺一次生成完整产品。v1 目标是生成最小可运行项目雏形，包括目录、README、Plan、Prompt、Git 初始化和基础脚手架。

## 设计参考

界面概念图保存在 `assets/design`，用于说明工作台、项目详情、历史记录、设置页和本地 CLI 控制台的视觉方向。
