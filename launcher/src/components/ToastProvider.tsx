// App-wide toast. A pill at bottom-centre that auto-dismisses after 2.4s.
// Used for the dashboard's "Coming soon" stubs.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    timer.current = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(timer.current);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </ToastContext.Provider>
  );
}
