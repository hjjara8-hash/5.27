import React, { memo } from 'react';
import { PlayIcon, StopIcon, XCircleIcon } from '../common/Icons.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { Input } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';

interface AutoSendControlsProps {
  isAutoSendingActive: boolean;
  autoSendText: string;
  setAutoSendText: (text: string) => void;
  autoSendRepetitionsInput: string;
  setAutoSendRepetitionsInput: (reps: string) => void;
  autoSendRemaining: number;
  onStartAutoSend: () => void; 
  onStopAutoSend: () => void;
  canStart: boolean; 
  isChatViewLoading: boolean;
  currentChatSessionExists: boolean;
  isCharacterMode: boolean;
  isPreparingAutoSend: boolean;
  isWaitingForErrorRetry: boolean; 
  errorRetryCountdown: number;    
}

const AutoSendControls: React.FC<AutoSendControlsProps> = memo(({
  isAutoSendingActive,
  autoSendText,
  setAutoSendText,
  autoSendRepetitionsInput,
  setAutoSendRepetitionsInput,
  autoSendRemaining,
  onStartAutoSend,
  onStopAutoSend,
  canStart,
  isChatViewLoading,
  currentChatSessionExists,
  isCharacterMode,
  isPreparingAutoSend,
  isWaitingForErrorRetry,
  errorRetryCountdown,    
}) => {
  const { t } = useTranslation();

  if (isAutoSendingActive) {
    return (
        <div className="mx-2 mt-2 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {t.autoSending}: {autoSendRemaining} {t.remaining}
                </span>
            </div>
            <Button 
                variant="ghost" 
                size="none" 
                onClick={onStopAutoSend}
                className="text-emerald-600 hover:text-red-600 transition-colors p-1"
            >
                <XCircleIcon className="w-4 h-4" />
            </Button>
        </div>
    );
  }

  const showGenericStartButton = !isCharacterMode && !isAutoSendingActive && !isWaitingForErrorRetry;

  return (
    <div className="mx-2 mt-2 p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 space-y-2 shadow-sm">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder={t.textToAutoSend}
          value={autoSendText}
          onChange={(e) => setAutoSendText(e.target.value)}
          className="flex-1 min-w-[60px]"
          disabled={isAutoSendingActive || !currentChatSessionExists || isWaitingForErrorRetry}
          aria-label="Text for automated sending"
        />
        <Input
          type="number"
          placeholder={t.times}
          value={autoSendRepetitionsInput}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 100)) {
                 setAutoSendRepetitionsInput(val);
            } else if (parseInt(val, 10) > 100) {
                 setAutoSendRepetitionsInput('100');
            } else if (parseInt(val, 10) < 1 && val !== '') {
                 setAutoSendRepetitionsInput('1');
            }
          }}
          min="1"
          max="100"
          className="w-14 sm:w-16 text-center"
          disabled={isAutoSendingActive || !currentChatSessionExists || isWaitingForErrorRetry}
          aria-label="Number of times to send"
        />
        {showGenericStartButton && (
          <Button
            variant="primary"
            onClick={onStartAutoSend}
            disabled={!canStart || isChatViewLoading || !currentChatSessionExists || isWaitingForErrorRetry}
            className="flex items-center shadow-sm"
            title={t.start}
          >
            <PlayIcon className="w-4 h-4 mr-1" />
            {t.start}
          </Button>
        )}
      </div>
      {isCharacterMode && isPreparingAutoSend && !isAutoSendingActive && !isWaitingForErrorRetry && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Auto-send configured. Click a character button below to start sending to them.
        </p>
      )}
      {isWaitingForErrorRetry && (
        <p className="text-xs text-amber-600 dark:text-amber-400 animate-pulse text-center">
          Error detected. Attempting to regenerate in {errorRetryCountdown}s...
        </p>
      )}
    </div>
  );
});

export default AutoSendControls;