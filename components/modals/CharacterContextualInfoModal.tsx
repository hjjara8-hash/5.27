import React, { useState, useEffect, memo, useCallback } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore.ts';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { CloseIcon, InfoIcon } from '../common/Icons.tsx';
import useAutoResizeTextarea from '../../hooks/useAutoResizeTextarea.ts';
import { Button } from '../ui/Button.tsx';
import { Textarea } from '../ui/Textarea.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';

const CharacterContextualInfoModal: React.FC = memo(() => {
  const { saveContextualInfo } = useCharacterStore();
  const { isContextualInfoModalOpen, editingCharacterForContextualInfo, closeCharacterContextualInfoModal } = useSettingsUI();
  const { t } = useTranslation();
  
  const [infoText, setInfoText] = useState('');
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);
  const textareaRef = useAutoResizeTextarea<HTMLTextAreaElement>(infoText, 250);

  useEffect(() => {
    if (isContextualInfoModalOpen) {
        setAreButtonsDisabled(true);
        const timerId = setTimeout(() => {
            setAreButtonsDisabled(false);
        }, 500);

        if (editingCharacterForContextualInfo) {
            setInfoText(editingCharacterForContextualInfo.contextualInfo || '');
        }
        return () => clearTimeout(timerId);
    }
  }, [isContextualInfoModalOpen, editingCharacterForContextualInfo]);

  useEffect(() => {
    if (isContextualInfoModalOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isContextualInfoModalOpen, textareaRef]);

  const handleSave = useCallback(() => {
    if (!editingCharacterForContextualInfo) return;
    saveContextualInfo(editingCharacterForContextualInfo.id, infoText);
    closeCharacterContextualInfoModal();
  }, [editingCharacterForContextualInfo, saveContextualInfo, infoText, closeCharacterContextualInfoModal]);
  
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInfoText(e.target.value);
  }, []);

  if (!isContextualInfoModalOpen || !editingCharacterForContextualInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contextual-info-modal-title"
        onClick={closeCharacterContextualInfoModal}
    >
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-6 rounded-lg shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col text-gray-900 dark:text-gray-200 animate-modal-open" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 id="contextual-info-modal-title" className="text-xl font-semibold flex items-center">
            <InfoIcon className="w-5 h-5 mr-3 text-emerald-500" />
            {t.contextualInfoFor} <span className="text-emerald-600 dark:text-emerald-400 ml-2">{editingCharacterForContextualInfo.name}</span>
          </h2>
          <Button variant="ghost" onClick={closeCharacterContextualInfoModal} disabled={areButtonsDisabled} className="p-1 rounded-full" aria-label={t.close}><CloseIcon /></Button>
        </div>
        
        {/* Editor Card */}
        <div className="relative p-4 rounded-r-xl rounded-l-md border border-gray-200 dark:border-white/10 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 dark:from-emerald-500/5 to-transparent flex-grow flex flex-col min-h-0 mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t.contextualInfoDesc}
            </p>
            <Textarea
                ref={textareaRef}
                placeholder={t.contextualPromptPlaceholder}
                value={infoText}
                onChange={handleTextChange}
                rows={8}
                className="hide-scrollbar resize-y flex-grow"
                style={{ minHeight: '150px' }}
                aria-label={`Contextual information for ${editingCharacterForContextualInfo.name}`}
            />
        </div>

        <div className="flex justify-end space-x-3 flex-shrink-0">
          <Button variant="secondary" onClick={closeCharacterContextualInfoModal} disabled={areButtonsDisabled}>{t.cancel}</Button>
          <Button variant="primary" onClick={handleSave} disabled={areButtonsDisabled}>
            {t.saveInfo}
          </Button>
        </div>
      </div>
    </div>
  );
});

export default CharacterContextualInfoModal;