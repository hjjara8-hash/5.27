import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className = '', children, options, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={`w-full p-2.5 bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm ${className}`}
      {...props}
    >
      {options ? options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      )) : children}
    </select>
  );
});
Select.displayName = 'Select';
