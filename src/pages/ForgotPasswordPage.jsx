import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Field from "../components/Field";
import Input from "../components/Input";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  const { resetPassword, confirmPasswordReset, loading } = useAuth();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get("token") || "";
  const isResetMode = params.get("recover") === "true" && Boolean(resetToken);
  const isFormDisabled = isLoading || loading;

  const handleRequestReset = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      showError("Preencha seu e-mail");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.ok) {
        showSuccess("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
        setEmail("");
      } else {
        showError(result.error?.message || "Erro ao enviar e-mail de recuperação");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!newPassword || !confirmPassword) {
      showError("Preencha os campos de senha");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("As senhas não conferem");
      return;
    }
    if (newPassword.length < 6) {
      showError("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      const result = await confirmPasswordReset(resetToken, newPassword);
      if (result.ok) {
        showSuccess("Senha atualizada com sucesso! Redirecionando...");
        window.setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        showError(result.error?.message || "Erro ao atualizar senha");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-container">
        <div className="forgot-header">
          <h1>{isResetMode ? "Redefinir senha" : "Recuperar senha"}</h1>
          <p>Conserpav Frequência</p>
        </div>

        <div className="forgot-card">
          {!isResetMode ? (
            <>
              <p className="forgot-description">
                Digite seu e-mail para receber um link de recuperação de senha.
              </p>
              <form className="forgot-form" onSubmit={handleRequestReset}>
                <Field label="E-mail" htmlFor="recovery-email" required>
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isFormDisabled}
                    autoComplete="email"
                    required
                  />
                </Field>
                <button type="submit" className="forgot-button" disabled={isFormDisabled}>
                  {isLoading ? "Enviando…" : "Enviar link de recuperação"}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="forgot-description">
                Digite sua nova senha para recuperar acesso à sua conta.
              </p>
              <form className="forgot-form" onSubmit={handleResetPassword}>
                <Field label="Nova senha" htmlFor="new-password" required>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={isFormDisabled}
                    autoComplete="new-password"
                    required
                  />
                </Field>
                <Field label="Confirmar senha" htmlFor="confirm-password" required>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={isFormDisabled}
                    autoComplete="new-password"
                    required
                  />
                </Field>
                <button type="submit" className="forgot-button" disabled={isFormDisabled}>
                  {isLoading ? "Atualizando…" : "Atualizar senha"}
                </button>
              </form>
            </>
          )}

          <div className="forgot-back">
            <a href="/" className="back-link">← Voltar para login</a>
          </div>
        </div>
      </div>
    </div>
  );
}
