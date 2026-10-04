import { useState } from "react";
import { Building2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { CLOSING_PERIODS, DEFAULT_CLOSING_PERIOD } from "../lib/dateUtils";
import Field from "./Field";
import Input from "./Input";
import SegmentedControl from "./SegmentedControl";

const PERIOD_OPTIONS = Object.values(CLOSING_PERIODS).map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

export default function ProjectForm() {
  const { addProject, savingProject } = useApp();
  const [name, setName] = useState("");
  const [closingPeriod, setClosingPeriod] = useState(DEFAULT_CLOSING_PERIOD);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await addProject(name, closingPeriod);
    if (result.ok) {
      setName("");
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2 className="form-title">Cadastrar obra</h2>
      <p className="form-helper">
        Crie uma obra para organizar a equipe e abrir a chamada de frequência.
      </p>

      <div className="form-grid">
        <Field label="Nome da obra" htmlFor="project-name" className="span-2" required>
          <Input
            id="project-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Edifício Aurora"
            required
            maxLength={80}
          />
        </Field>

        <Field
          label="Período de fechamento (pagamento)"
          hint="Define de quantas em quantas semanas a chamada fecha para pagamento."
          className="span-2"
        >
          <SegmentedControl
            options={PERIOD_OPTIONS}
            value={closingPeriod}
            onChange={setClosingPeriod}
            ariaLabel="Período de fechamento"
          />
        </Field>
      </div>

      <button type="submit" className="primary-button register-button" disabled={savingProject}>
        <Building2 size={18} aria-hidden="true" />
        {savingProject ? "Cadastrando…" : "Cadastrar obra"}
      </button>
    </form>
  );
}
