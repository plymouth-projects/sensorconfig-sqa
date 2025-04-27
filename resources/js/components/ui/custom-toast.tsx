import React, { useState, useEffect, forwardRef } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastProps = {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'info';
  onDismiss: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
};

export const Toast = forwardRef<HTMLDivElement, ToastProps>(({
  id,
  title,
  description,
  variant = 'default',
  onDismiss,
  action,
  duration = 5000,
}, ref) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(id), 300); // Allow animation to complete
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);
  
  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(id), 300);
  };
  
  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full max-w-md items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1/2",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-1/2",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        {
          "bg-background text-foreground": variant === 'default',
          "bg-destructive text-destructive-foreground": variant === 'destructive',
          "bg-green-50 border-green-200": variant === 'success',
          "bg-blue-50 border-blue-200": variant === 'info',
        }
      )}
      data-state={visible ? "open" : "closed"}
    >
      <div className="grid gap-1">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <div className="text-sm font-semibold">{title}</div>
        </div>
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
        {action && (
          <div className="mt-2">
            <button
              onClick={action.onClick}
              className="text-xs font-medium underline underline-offset-4"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
      <button
        className="absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
});

Toast.displayName = "Toast";

export const ToastContainer = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  return (
    <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 w-full max-w-md p-4 sm:right-0 sm:top-0 sm:flex-col">
      {children}
    </div>
  );
}; 