import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Field from "../components/Field";
import Input from "../components/Input";
import Alert from "../components/Alert";
import "./LoginPage.css";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { showError, showSuccess } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Estados de erro para feedback visual limpo no formulário
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });

  const clearErrors = () => {
    setFormError("");
    setFieldErrors({ email: "", password: "" });
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    if (formError) setFormError("");
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (formError) setFormError("");
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
  };

  const validateForm = () => {
    const nextErrors = { email: "", password: "" };
    let hasError = false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      nextErrors.email = "Preencha o e-mail";
      hasError = true;
    } else if (!emailRegex.test(email.trim())) {
      nextErrors.email = "Informe um e-mail válido";
      hasError = true;
    }

    if (!password) {
      nextErrors.password = "Preencha a senha";
      hasError = true;
    }

    setFieldErrors(nextErrors);
    return !hasError;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    clearErrors();

    if (!validateForm()) {
      setFormError("Por favor, preencha as credenciais de acesso.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (!result.ok) {
        const errorMsg =
          result.error?.code === "INVALID_CREDENTIALS" ||
          result.error?.message?.includes("E-mail ou senha")
            ? "E-mail ou senha incorretos."
            : result.error?.message || "Erro ao fazer login.";

        setFormError(errorMsg);
        setFieldErrors({
          email: result.error?.code === "INVALID_CREDENTIALS" ? "Verifique o e-mail informado" : "",
          password: result.error?.code === "INVALID_CREDENTIALS" ? "Verifique a senha informada" : "",
        });
        showError(errorMsg);
      } else {
        showSuccess("Login realizado com sucesso!");
      }
    } catch (err) {
      const msg = err.message || "Erro ao conectar ao servidor.";
      setFormError(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormDisabled = isLoading || loading;

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-brand">
            <img src="/logo-conserpav.png" alt="Conserpav" className="login-logo" />
            <div className="login-brand-text">
              <h1>
                CONSER<span className="login-accent">PAV</span>
              </h1>
              <p>Frequência</p>
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-title">
            <h2>Fazer login</h2>
          </div>

          {/* Feedback visual limpo: Banner de erro */}
          {formError && (
            <Alert
              variant="error"
              message={formError}
              onClose={() => setFormError("")}
            />
          )}

          <form className="login-form" onSubmit={handleLogin} noValidate>
            <Field
              label="E-mail"
              htmlFor="email"
              required
              error={fieldErrors.email}
            >
              <Input
                id="email"
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

            <Field
              label="Senha"
              htmlFor="password"
              required
              error={fieldErrors.password}
            >
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => handlePasswordChange(event.target.value)}
                disabled={isFormDisabled}
                autoComplete="current-password"
                error={Boolean(fieldErrors.password)}
                required
              />
            </Field>

            <button type="submit" className="login-button" disabled={isFormDisabled}>
              {isLoading ? "Entrando…" : "Entrar"}
            </button>

            <div className="login-footer">
              <a href="/?recover=true" className="forgot-password-link">
                Esqueceu a senha?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
