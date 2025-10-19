import React, { createContext, useContext, useState, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalOptions {
  type?: "confirm" | "error" | "success" | "info";
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ModalOptions>({});

  const showModal = (opts: ModalOptions) => {
    setOptions(opts);
    setOpen(true);
  };

  const hideModal = () => {
    setOpen(false);
    options.onCancel?.();
  };

  const handleConfirm = () => {
    setOpen(false);
    options.onConfirm?.();
  };

  const getIcon = () => {
    switch (options.type) {
      case "error":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case "success":
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case "confirm":
        return <Trash2 className="h-6 w-6 text-primary" />;
      default:
        return <AlertCircle className="h-6 w-6 text-blue-500" />;
    }
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg w-[90%] max-w-md relative">
            {/* Ícone e título */}
            <div className="flex items-center gap-3 mb-3">
              {getIcon()}
              <h2 className="text-lg font-semibold">{options.title}</h2>
            </div>

            {/* Mensagem */}
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              {options.message}
            </p>

            {/* Botões */}
            <div className="flex justify-end gap-3">
              {options.type === "confirm" && (
                <button
                  onClick={hideModal}
                  className={cn(
                    "px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700",
                    "hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                  )}
                >
                  {options.cancelText || "Cancelar"}
                </button>
              )}

              <button
                onClick={handleConfirm}
                className={cn(
                  "px-4 py-2 rounded-lg text-white transition",
                  options.type === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : options.type === "success"
                    ? "bg-green-600 hover:bg-green-700"
                    : options.type === "confirm"
                    ? "bg-primary hover:bg-primary/90"
                    : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {options.confirmText ||
                  (options.type === "confirm" ? "Confirmar" : "OK")}
              </button>
            </div>

            {/* Botão X */}
            <button
              onClick={hideModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context)
    throw new Error("useModal deve ser usado dentro de um ModalProvider");
  return context;
}
