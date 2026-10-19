import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md",
                t.type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-900",
                t.type === 'error' && "bg-red-50 border-red-200 text-red-900",
                t.type === 'info' && "bg-[#fffaf3] border-[#d9cbbd] text-[#28231f]"
              )}
            >
              {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />}
              {t.type === 'info' && <Info className="h-5 w-5 text-[#356b4f] shrink-0" />}

              <p className="text-sm font-bold flex-1">{t.message}</p>

              <button onClick={() => removeToast(t.id)} className="text-current/50 hover:text-current">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
