import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./auth/AuthContext";
import "./index.css";
import "./i18n";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
