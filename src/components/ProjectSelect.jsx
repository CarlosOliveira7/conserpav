import { useApp } from "../context/AppContext";
import Select from "./Select";

export default function ProjectSelect() {
  const { projects, activeProjectId, setActiveProjectId } = useApp();

  if (!projects.length) return null;

  return (
    <div className="active-project-bar">
      <label htmlFor="active-project-select" className="active-project-label">
        Obra
      </label>
      <Select
        id="active-project-select"
        value={activeProjectId || ""}
        onChange={(event) => setActiveProjectId(event.target.value)}
        className="active-project-select"
        aria-label="Selecionar obra ativa"
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
