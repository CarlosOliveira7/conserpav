import { useState } from "react";
import { Pencil } from "lucide-react";
import { useApp } from "../context/AppContext";
import ConfirmButton from "./ConfirmButton";
import EditProjectModal from "./EditProjectModal";
import { CLOSING_PERIODS, normalizeClosingPeriod } from "../lib/dateUtils";

export default function ProjectList() {
  const { projects, activeProjectId, setActiveProjectId, removeProject } = useApp();
  const [editingProject, setEditingProject] = useState(null);

  if (projects.length === 0) {
    return (
      <div className="empty-box">
        <p>Nenhuma obra cadastrada ainda. Comece criando sua primeira obra.</p>
      </div>
    );
  }

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const otherProjects = projects.filter((p) => p.id !== activeProjectId);

  return (
    <div className="project-list-container">
      <div className="list-header">
        <h2 className="list-title">Obras cadastradas</h2>
        <span className="list-count">{projects.length} {projects.length === 1 ? "obra" : "obras"}</span>
      </div>

      <ul className="project-flat-list">
        {activeProject && renderRow(activeProject, true)}
        {otherProjects.map((project) => renderRow(project, false))}
      </ul>

      {editingProject && (
        <EditProjectModal project={editingProject} onClose={() => setEditingProject(null)} />
      )}
    </div>
  );

  function renderRow(project, isActive) {
    const periodLabel = CLOSING_PERIODS[normalizeClosingPeriod(project.closing_period)]?.label;

    return (
      <li key={project.id} className={`project-flat-row${isActive ? " is-active" : ""}`}>
        <div className="project-row-main">
          <div className="project-row-name-group">
            <strong className="project-row-name">{project.name}</strong>
            {isActive && <span className="project-badge-active">Ativa</span>}
          </div>
          <span className="project-row-meta">
            Fechamento {periodLabel?.toLowerCase()}
          </span>
        </div>

        <div className="project-row-actions">
          {!isActive && (
            <button
              type="button"
              className="mini-action project-select-btn"
              onClick={() => setActiveProjectId(project.id)}
            >
              Selecionar
            </button>
          )}
          <button
            type="button"
            className="mini-action"
            onClick={() => setEditingProject(project)}
            aria-label={`Editar obra ${project.name}`}
          >
            <Pencil size={14} aria-hidden="true" />
            <span>Editar</span>
          </button>
          <ConfirmButton
            label="Excluir"
            ariaLabel={`Excluir obra ${project.name}`}
            onConfirm={() => removeProject(project.id)}
          />
        </div>
      </li>
    );
  }
}
