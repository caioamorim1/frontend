import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, X } from "lucide-react";

export const SessionExpirationWarning = () => {
  const { user, logout } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user?.exp) return;

    const updateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = user.exp! - now;
      setTimeRemaining(remaining);

      // Mostrar aviso quando faltam 5 minutos ou menos
      if (remaining <= 300 && remaining > 0 && !dismissed) {
        setShowWarning(true);
      } else if (remaining <= 0) {
        setShowWarning(false);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [user, dismissed]);

  if (!showWarning || timeRemaining === null || timeRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const getAlertVariant = () => {
    if (timeRemaining <= 120) return "destructive"; // 2 minutos ou menos - vermelho
    return "default"; // amarelo/aviso
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top">
      <Alert variant={getAlertVariant()} className="shadow-lg">
        <Clock className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-2">
          <span>
            <strong>Sua sessão expira em:</strong> {minutes}:
            {seconds.toString().padStart(2, "0")}
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="hover:opacity-70 transition-opacity"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </AlertDescription>
      </Alert>
    </div>
  );
};
