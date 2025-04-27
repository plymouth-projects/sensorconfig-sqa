import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';

type ToastVariant = 'default' | 'destructive' | 'success';

type ToastProps = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

type ToastContextValue = {
  toast: (props: ToastProps) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useCallback(({ 
    title, 
    description, 
    variant = 'default', 
    duration = 5000,
    action
  }: ToastProps) => {
    const options = {
      description,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    };

    switch (variant) {
      case 'destructive':
        sonnerToast.error(title, options);
        break;
      case 'success':
        sonnerToast.success(title, options);
        break;
      default:
        sonnerToast(title, options);
        break;
    }
  }, []);

  const dismissAll = useCallback(() => {
    sonnerToast.dismiss();
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismissAll }}>
      {children}
      <SonnerToaster 
        theme="system"
        className="toaster group"
        style={{
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties}
      />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  
  return context;
}

// For backward compatibility
export function useToast() {
  return useToastContext();
} 