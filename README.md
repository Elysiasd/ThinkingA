# ThinkingAP

ThinkingAP is a local-first web workspace for turning unusual ideas into development plans, coding prompts, and runnable local project prototypes.

## Features

- Generate a development plan and local AI CLI prompt from an idea.
- Save OpenAI API configuration from the web UI.
- Create local project folders under `D:\Program Files (x86)\ThinkingAP`.
- Initialize Git repositories and write `.thinkingap/plan.md` and `.thinkingap/prompt.txt`.
- Preview and run local Codex or Claude CLI commands after user confirmation.
- Browse project files, history, and CLI run logs from the app.

## Getting Started

```powershell
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open:

```text
http://127.0.0.1:3000
```

## Configuration

Open the Settings page and configure:

- OpenAI API Key
- OpenAI model, default `gpt-5.5`
- OpenAI-compatible API request URL, default `https://api.jucode.cn/v1`
- Local project root, default `D:\Program Files (x86)\ThinkingAP`

The API key is stored locally and is only shown in masked form in the browser.

ThinkingAP uses the OpenAI Responses wire API. For custom providers, set the API request URL to:

```text
https://api.jucode.cn/v1
```

## Safety Boundary

ThinkingAP restricts file reads, writes, project creation, and CLI execution to the configured local project root. OpenAI receives the idea text used to generate the plan and prompt; local project code is not uploaded by the app.

## Useful Commands

```powershell
npm run lint
npm test
npm run build
```

## Design References

UI concept images are stored in `assets/design`.
