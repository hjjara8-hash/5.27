import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className = '', icon, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>}
      <input
        ref={ref}
        className={`w-full bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm disabled:opacity-50 ${icon ? 'pl-10' : 'p-2.5'} ${className}`}
        {...props}
      />
    </div>
  );
});
Input.displayName = 'Input';
