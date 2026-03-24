import React from 'react';

export interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false, className = '' }) => {
  return (
    <details className={`group border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-800/50 shadow-sm transition-all ${className}`} open={defaultOpen}>
      <summary className="flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700/70 transition-colors list-none [&::-webkit-details-marker]:hidden focus:outline-none select-none">
        <div className="flex items-center gap-2">{title}</div>
        <svg className="h-4 w-4 text-gray-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-zinc-900/50 border-t border-gray-200 dark:border-white/10">
        {children}
      </div>
    </details>
  );
};
Accordion.displayName = 'Accordion';
