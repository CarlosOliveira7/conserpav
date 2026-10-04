import { Plus } from "lucide-react";
import { useState } from "react";
import PageHeader from "../components/PageHeader";
import ProjectForm from "../components/ProjectForm";
import ProjectList from "../components/ProjectList";

export default function ObrasPage() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="page">
      <PageHeader title="Obras" />
      <div className="project-register-toolbar">
        <button
          type="button"
          className={formOpen ? "secondary-button" : "primary-button register-button"}
          onClick={() => setFormOpen((current) => !current)}
        >
          <Plus size={18} aria-hidden="true" />
          {formOpen ? "Fechar cadastro" : "Nova obra"}
        </button>
      </div>
      {formOpen && <ProjectForm />}
      <ProjectList />
    </div>
  );
}
