"use client";

import Link from "next/link";
import { Folder, GitBranch, Plus, RefreshCw, TerminalSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { AppFrame, type ProjectRecord } from "@/components/AppFrame";

type ProjectsResponse = {
  projects: ProjectRecord[];
  directories: { name: string; targetPath: string }[];
};

export default function ProjectsPage() {
  const [data, setData] = useState<ProjectsResponse>({ projects: [], directories: [] });

  async function loadProjects() {
    const response = await fetch("/api/projects");
    setData(await response.json());
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  return (
    <AppFrame>
      <div className="page-wrap">
        <div className="page-title row-title">
          <div>
            <h1>项目</h1>
            <p>从 SQLite 记录和本地工作区目录读取真实项目。</p>
          </div>
          <div className="action-row no-margin">
            <button className="secondary-button" onClick={loadProjects}>
              <RefreshCw size={18} /> 刷新
            </button>
            <Link className="primary-button link-button" href="/projects/new">
              <Plus size={18} /> 新建项目
            </Link>
          </div>
        </div>

        <div className="project-grid">
          {data.projects.map((project) => (
            <Link className="project-card" href={`/projects/${project.id}`} key={project.id}>
              <div className="project-card-head">
                <Folder size={24} />
                <div>
                  <h2>{project.name}</h2>
                  <p>{project.target_path}</p>
                </div>
              </div>
              <div className="meta-row">
                <span><GitBranch size={16} /> {project.git_status}</span>
                <span><TerminalSquare size={16} /> {project.cli_preference}</span>
              </div>
            </Link>
          ))}
          {!data.projects.length ? (
            <div className="panel empty-panel">
              <h2>还没有数据库项目</h2>
              <p>从工作台生成 Plan/Prompt 后创建本地项目，或进入新建项目向导。</p>
              <Link className="primary-button link-button" href="/">回到工作台</Link>
            </div>
          ) : null}
        </div>

        <section className="panel directory-panel">
          <h2>工作区目录扫描</h2>
          <p>这些目录位于配置的项目根目录下，可用于和数据库记录对齐。</p>
          <div className="directory-list">
            {data.directories.map((directory) => (
              <div className="directory-row" key={directory.targetPath}>
                <Folder size={18} />
                <strong>{directory.name}</strong>
                <code>{directory.targetPath}</code>
              </div>
            ))}
            {!data.directories.length ? <div className="empty-side">工作区下还没有项目目录。</div> : null}
          </div>
        </section>
      </div>
    </AppFrame>
  );
}
