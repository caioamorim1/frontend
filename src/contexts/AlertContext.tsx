import React, { createContext, useContext, useState, ReactNode } from "react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

type AlertType = "default" | "destructive" | "success"

interface AlertState {
    open: boolean
    type: AlertType
    title: string
    message: string
}

interface AlertContextType {
    showAlert: (type: AlertType, title: string, message: string) => void
    hideAlert: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
    const [alert, setAlert] = useState<AlertState>({
        open: false,
        type: "default",
        title: "",
        message: "",
    })

    const showAlert = (type: AlertType, title: string, message: string) => {
        setAlert({ open: true, type, title, message })
        setTimeout(() => setAlert((a) => ({ ...a, open: false })), 5000) // auto fecha em 5s
    }

    const hideAlert = () => setAlert((a) => ({ ...a, open: false }))

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {alert.open && (
                <div className="fixed bottom-5 right-5 max-w-sm z-50">
                    <Alert variant={alert.type}>
                        <AlertCircle className="h-4 w-4" />
                        <div>
                            <AlertTitle>{alert.title}</AlertTitle>
                            <AlertDescription>{alert.message}</AlertDescription>
                        </div>
                    </Alert>
                </div>
            )}
        </AlertContext.Provider>
    )
}

export function useAlert() {
    const context = useContext(AlertContext)
    if (!context) {
        throw new Error("useAlert deve ser usado dentro de um AlertProvider")
    }
    return context
}
