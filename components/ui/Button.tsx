import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils.ts';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'none';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  className, variant = 'secondary', size = 'md', icon, isLoading, children, disabled, ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
  
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20",
    secondary: "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 border border-transparent dark:border-white/5",
    danger: "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 border border-transparent dark:border-red-500/20",
    ghost: "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10",
    outline: "bg-transparent border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5",
    destructive: "bg-red-600 hover:bg-red-500 text-white shadow-sm hover:shadow-md hover:shadow-red-500/20",
    link: "bg-transparent text-emerald-600 dark:text-emerald-400 hover:underline p-0 h-auto"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl",
    lg: "px-5 py-2.5 text-base rounded-xl",
    icon: "w-9 h-9 flex items-center justify-center rounded-lg p-0",
    none: ""
  };

  return (
    <button ref={ref} disabled={disabled || isLoading} className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      ) : icon ? (
        <span className={children ? "mr-2" : ""}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
});
Button.displayName = 'Button';
