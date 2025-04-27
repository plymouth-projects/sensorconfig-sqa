import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastContainer } from '@/components/ui/custom-toast';

type ToastProps = {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

type ToastWithId = ToastProps & { id: string };

type ToastContextValue = {
  toast: (props: ToastProps) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function CustomToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastWithId[]>([]);

  const generateId = useCallback(() => {
    return Math.random().toString(36).substring(2, 9);
  }, []);

  const toast = useCallback((props: ToastProps) => {
    const id = props.id || generateId();
    setToasts((prev) => [...prev, { ...props, id }]);
  }, [generateId]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismissToast, dismissAll }}>
      {children}
      
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            action={toast.action}
            duration={toast.duration}
            onDismiss={dismissToast}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useCustomToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useCustomToast must be used within a CustomToastProvider');
  }
  
  return context;
}

// For backward compatibility with existing code
export function useToast() {
  const { toast, dismissToast, dismissAll } = useCustomToast();
  
  return {
    toast: (props: ToastProps) => toast(props),
    dismiss: dismissToast,
    dismissAll
  };
} 