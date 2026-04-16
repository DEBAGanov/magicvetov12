/**
 * @file: components/ui/Toast.tsx
 * @description: Toast notification component
 * @created: 2026-04-16
 */

"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

let nextId = 0;

const ToastContext = createContext<{
  show: (message: string, type?: "success" | "error") => void;
}>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const bg = toast.type === "success" ? "bg-green-600" : "bg-red-500";
  const icon = toast.type === "success" ? (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
  );

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg transition-all duration-300 ${bg} ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      }`}
    >
      {icon}
      <span>{toast.message}</span>
    </div>
  );
}
