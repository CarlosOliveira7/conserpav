import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Field from "../components/Field";
import Input from "../components/Input";
import Alert from "../components/Alert";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  const { resetPassword, confirmPasswordReset, loading } = useAuth();
  const { showError, showSuccess } = useToast();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Estados de feedback visual
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get("token") || "";
  const isResetMode = params.get("recover") === "true" && Boolean(resetToken);
  const isFormDisabled = isLoading || loading;

  const handleEmailChange = (val) => {
    setEmail(val);
    if (formError) setFormError("");
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
  };

  const handleNewPasswordChange = (val) => {
    setNewPassword(val);
    if (formError) setFormError("");
    if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: "" }));
  };

  const handleConfirmPasswordChange = (val) => {
    setConfirmPassword(val);
    if (formError) setFormError("");
    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
  };

  const handleRequestReset = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFieldErrors({ email: "", newPassword: "", confirmPassword: "" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      const msg = "Preencha seu e-mail";
      setFormError(msg);
      setFieldErrors((prev) => ({ ...prev, email: msg }));
      showError(msg);
      return;
    }

    if (!emailRegex.test(email.trim())) {
      const msg = "Informe um e-mail válido";
      setFormError(msg);
      setFieldErrors((prev) => ({ ...prev, email: msg }));
      showError(msg);
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.ok) {
        const msg = "E-mail de recuperação enviado! Verifique sua caixa de entrada.";
        setFormSuccess(msg);
        showSuccess(msg);
        setEmail("");
      } else {
        const errorMsg = result.error?.message || "Erro ao enviar e-mail de recuperação";
        setFormError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err.message || "Erro de conexão com o servidor.";
      setFormError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    const nextErrors = { email: "", newPassword: "", confirmPassword: "" };
    let hasError = false;

    if (!newPassword) {
      nextErrors.newPassword = "Preencha a nova senha";
      hasError = true;
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = "A senha deve ter pelo menos 8 caracteres";
      hasError = true;
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirme a nova senha";
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "As senhas não conferem";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(nextErrors);
      setFormError("Por favor, corrija os erros nos campos.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await confirmPasswordReset(resetToken, newPassword);
      if (result.ok) {
        const msg = "Senha atualizada com sucesso! Redirecionando para o login...";
        setFormSuccess(msg);
        showSuccess(msg);
        window.setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        const errorMsg = result.error?.message || "Erro ao atualizar senha";
        setFormError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err.message || "Erro de conexão com o servidor.";
      setFormError(errorMsg);
      showError(errorMsg);
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
          {formError && (
            <Alert
              variant="error"
              message={formError}
              onClose={() => setFormError("")}
            />
          )}

          {formSuccess && (
            <Alert
              variant="success"
              message={formSuccess}
              onClose={() => setFormSuccess("")}
            />
          )}

          {!isResetMode ? (
            <>
              <p className="forgot-description">
                Digite seu e-mail para receber um link de recuperação de senha.
              </p>
              <form className="forgot-form" onSubmit={handleRequestReset} noValidate>
                <Field
                  label="E-mail"
                  htmlFor="recovery-email"
                  required
                  error={fieldErrors.email}
                >
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(event) => handleEmailChange(event.target.value)}
                    disabled={isFormDisabled}
                    autoComplete="email"
                    error={Boolean(fieldErrors.email)}
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
              <form className="forgot-form" onSubmit={handleResetPassword} noValidate>
                <Field
                  label="Nova senha"
                  htmlFor="new-password"
                  hint="Mínimo de 8 caracteres"
                  required
                  error={fieldErrors.newPassword}
                >
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(event) => handleNewPasswordChange(event.target.value)}
                    disabled={isFormDisabled}
                    autoComplete="new-password"
                    error={Boolean(fieldErrors.newPassword)}
                    required
                  />
                </Field>

                <Field
                  label="Confirmar senha"
                  htmlFor="confirm-password"
                  required
                  error={fieldErrors.confirmPassword}
                >
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(event) => handleConfirmPasswordChange(event.target.value)}
                    disabled={isFormDisabled}
                    autoComplete="new-password"
                    error={Boolean(fieldErrors.confirmPassword)}
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
            <a href="/" className="back-link">
              ← Voltar para login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
