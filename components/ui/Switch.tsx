import React, { memo } from 'react';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Switch: React.FC<SwitchProps> = memo(({ className = '', checked, ...props }) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      className={`h-5 w-5 text-emerald-500 bg-gray-100 dark:bg-black/30 border-gray-300 dark:border-white/20 rounded focus:ring-emerald-500 focus:ring-offset-transparent cursor-pointer disabled:opacity-50 transition-colors ${className}`}
      {...props}
    />
  );
});
Switch.displayName = 'Switch';
