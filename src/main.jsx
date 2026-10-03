import React from "react";
import ReactDOM from "react-dom/client";
// ALTERAÇÃO: importa BrowserRouter — habilita as rotas /obras, /chamada,
// /equipe, /relatorios, /tema usadas em App.jsx. O vercel.json já tem a
// reescrita "/(.*) -> /index.html" configurada, então recarregar a página
// direto numa dessas URLs também funciona em produção.
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ToastProvider } from "./context/ToastContext";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
// ALTERAÇÃO: importa o novo ThemeProvider (tema claro/escuro, aba "Tema").
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* ALTERAÇÃO: ThemeProvider fica por fora de tudo, pois só mexe no
        atributo data-theme do <html> e não depende de dados da obra. */}
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppProvider>
              <App />
            </AppProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
