import { useState } from "react";
import Modal from "./Modal";
import Field from "./Field";
import Input from "./Input";
import SegmentedControl from "./SegmentedControl";
import { useApp } from "../context/AppContext";
import { CLOSING_PERIODS, normalizeClosingPeriod } from "../lib/dateUtils";

const PERIOD_OPTIONS = Object.values(CLOSING_PERIODS).map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

export default function EditProjectModal({ project, onClose }) {
  const { editProject, savingProject } = useApp();
  const [name, setName] = useState(project.name);
  const [closingPeriod, setClosingPeriod] = useState(
    normalizeClosingPeriod(project.closing_period)
  );
  const [formError, setFormError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    const result = await editProject(project.id, name, closingPeriod);
    if (result.ok) {
      onClose();
    } else if (result.error?.message) {
      setFormError(result.error.message);
    }
  };

  const handleNameChange = (val) => {
    setName(val);
    if (formError) setFormError("");
  };

  return (
    <Modal
      title="Editar obra"
      onClose={onClose}
      footer={(
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="edit-project-form" className="primary-button register-button" disabled={savingProject}>
            {savingProject ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      )}
    >
      <form id="edit-project-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <Field
            label="Nome da obra"
            htmlFor="edit-project-name"
            className="span-2"
            required
            error={formError}
          >
            <Input
              id="edit-project-name"
              type="text"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              required
              maxLength={80}
              error={Boolean(formError)}
            />
          </Field>

          <Field
            label="Período de fechamento (pagamento)"
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
      </form>
    </Modal>
  );
}
