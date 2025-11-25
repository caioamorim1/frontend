import { useState, FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { changePassword } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useAlert } from "@/contexts/AlertContext";

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    if (!user) {
      setError("Utilizador não encontrado. Por favor, faça login novamente.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(user.id, newPassword);
      showAlert(
        "success",
        "Sucesso",
        "Palavra-passe alterada com sucesso! Por favor, faça login com a sua nova palavra-passe."
      );
      logout(); // Faz logout para forçar o login com a nova palavra-passe
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro inesperado."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-primary">
          Definir Nova Palavra-passe
        </h2>
        <p className="text-center text-sm text-gray-600">
          Este é o seu primeiro acesso. Por favor, crie uma palavra-passe
          definitiva.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Nova Palavra-passe
            </label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirmar Nova Palavra-passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:opacity-90 disabled:bg-secondary/50"
            >
              {loading ? "A guardar..." : "Guardar Nova Palavra-passe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
