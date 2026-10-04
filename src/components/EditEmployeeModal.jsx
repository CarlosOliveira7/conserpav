import { useState } from "react";
import Modal from "./Modal";
import Field from "./Field";
import Input from "./Input";
import Select from "./Select";
import { useApp } from "../context/AppContext";

export default function EditEmployeeModal({ employee, onClose }) {
  const { projects, editEmployee, savingEmployee } = useApp();
  const [form, setForm] = useState({
    name: employee.name,
    role: employee.role,
    dailyRate: String(employee.daily_rate),
    projectId: employee.project_id,
    pixKey: employee.pix_key,
  });

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await editEmployee(employee.id, form);
    if (result.ok) onClose();
  };

  return (
    <Modal
      title="Editar funcionário"
      onClose={onClose}
      footer={(
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="edit-employee-form" className="primary-button" disabled={savingEmployee}>
            {savingEmployee ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      )}
    >
      <form id="edit-employee-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <Field label="Nome completo" htmlFor="edit-employee-name" className="span-2" required>
            <Input
              id="edit-employee-name"
              type="text"
              value={form.name}
              onChange={updateField("name")}
              required
              maxLength={80}
            />
          </Field>

          <Field label="Função / patente" htmlFor="edit-employee-role" required>
            <Input
              id="edit-employee-role"
              type="text"
              value={form.role}
              onChange={updateField("role")}
              required
              maxLength={60}
            />
          </Field>

          <Field label="Valor da diária (R$)" htmlFor="edit-employee-rate" required>
            <Input
              id="edit-employee-rate"
              type="number"
              min="0.01"
              step="0.01"
              value={form.dailyRate}
              onChange={updateField("dailyRate")}
              required
            />
          </Field>

          <Field label="Obra vinculada" htmlFor="edit-employee-project" className="span-2" required>
            <Select
              id="edit-employee-project"
              value={form.projectId}
              onChange={updateField("projectId")}
              required
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Chave Pix do funcionário" htmlFor="edit-employee-pix" className="span-2" required>
            <Input
              id="edit-employee-pix"
              type="text"
              value={form.pixKey}
              onChange={updateField("pixKey")}
              required
              maxLength={140}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
