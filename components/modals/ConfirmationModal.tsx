import React, { memo, useState, useEffect } from 'react';
import { CloseIcon, ShieldCheckIcon, InfoIcon } from '../common/Icons.tsx';
import { Button } from '../ui/Button.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = memo(({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDestructive = false,
}) => {
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setAreButtonsDisabled(true);
      const timerId = setTimeout(() => {
        setAreButtonsDisabled(false);
      }, 500); 
      return () => clearTimeout(timerId);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const accentColor = isDestructive ? 'red' : 'blue';
  const BorderClass = isDestructive ? 'border-l-red-500' : 'border-l-emerald-500';
  const BgGradient = isDestructive ? 'from-red-500/5' : 'from-emerald-500/10';
  const IconComponent = isDestructive ? ShieldCheckIcon : InfoIcon;
  const IconColor = isDestructive ? 'text-red-400' : 'text-emerald-400';

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      onClick={onCancel}
    >
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-6 rounded-lg shadow-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col text-gray-200 animate-modal-open" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 id="confirmation-modal-title" className="text-xl font-semibold text-gray-100 flex items-center">
             <IconComponent className={`w-6 h-6 mr-3 ${IconColor}`} />
             {title}
          </h2>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={areButtonsDisabled}
            className="p-1 rounded-full"
            aria-label={t.close}
          >
            <CloseIcon className="w-6 h-6" />
          </Button>
        </div>

        <div className={`relative p-4 mb-6 rounded-r-xl rounded-l-md border border-white/10 border-l-4 ${BorderClass} bg-gradient-to-r ${BgGradient} to-transparent`}>
            <div className="text-sm text-gray-200 whitespace-pre-line leading-relaxed">
            {message}
            </div>
        </div>

        <div className="mt-auto flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            type="button"
            disabled={areButtonsDisabled}
          >
            {cancelText || t.cancel}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            type="button"
            disabled={areButtonsDisabled}
          >
            {confirmText || t.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
});

export default ConfirmationModal;