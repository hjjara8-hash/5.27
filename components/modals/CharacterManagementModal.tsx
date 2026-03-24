import React, { useState, useEffect, memo, useCallback } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore.ts';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { useActiveChatStore } from '../../store/useActiveChatStore.ts';
import { AICharacter } from '../../types.ts';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Textarea } from '../ui/Textarea.tsx';
import { CloseIcon, PencilIcon, TrashIcon, InfoIcon, UsersIcon } from '../common/Icons.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';

const CharacterManagementModal: React.FC = memo(() => {
  const { currentChatSession } = useActiveChatStore();
  const { addCharacter, editCharacter, deleteCharacter } = useCharacterStore();
  const { isCharacterManagementModalOpen, closeCharacterManagementModal, openCharacterContextualInfoModal } = useSettingsUI();
  const { t } = useTranslation();

  const [editingCharacter, setEditingCharacter] = useState<AICharacter | null>(null);
  const [newCharName, setNewCharName] = useState('');
  const [newCharInstruction, setNewCharInstruction] = useState('');
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);

  const characters = currentChatSession?.aiCharacters || [];

  useEffect(() => {
    if (isCharacterManagementModalOpen) {
      setAreButtonsDisabled(true);
      const timerId = setTimeout(() => {
          setAreButtonsDisabled(false);
      }, 500);

      setEditingCharacter(null);
      setNewCharName('');
      setNewCharInstruction('');
      return () => clearTimeout(timerId);
    }
  }, [isCharacterManagementModalOpen]);

  const handleSave = useCallback(() => {
    if (editingCharacter) {
      editCharacter(editingCharacter.id, newCharName, newCharInstruction);
    } else {
      addCharacter(newCharName, newCharInstruction);
    }
    setNewCharName('');
    setNewCharInstruction('');
    setEditingCharacter(null);
  }, [editingCharacter, newCharName, newCharInstruction, editCharacter, addCharacter]);
  
  const startEdit = useCallback((char: AICharacter) => {
    setEditingCharacter(char);
    setNewCharName(char.name);
    setNewCharInstruction(char.systemInstruction);
  }, []);

  if (!isCharacterManagementModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4" onClick={closeCharacterManagementModal}>
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-6 rounded-lg shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col text-gray-200 overflow-hidden animate-modal-open" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-xl font-semibold flex items-center">
            <UsersIcon className="w-6 h-6 mr-3 text-fuchsia-400" />
            {t.manageCharacters}
          </h2>
          <Button variant="ghost" onClick={closeCharacterManagementModal} disabled={areButtonsDisabled} className="p-1 rounded-full h-auto" aria-label={t.close} icon={<CloseIcon />} />
        </div>

        <div className="flex-grow min-h-0 overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-4">
            {characters.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-gray-700 rounded-lg">
                    <p className="text-gray-400 italic">{t.noCharacters}</p>
                </div>
            )}
            {characters.map(char => (
                <div key={char.id} className="relative p-3 rounded-r-xl rounded-l-md border border-white/10 border-l-4 border-l-fuchsia-500 bg-gradient-to-r from-fuchsia-500/5 to-transparent flex justify-between items-center group transition hover:bg-white/5">
                    <div className="min-w-0 pr-2">
                        <p className="font-semibold text-fuchsia-200">{char.name}</p>
                        <p className="text-xs text-gray-400 truncate" title={char.systemInstruction}>{char.systemInstruction}</p>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0">
                        <Button variant="ghost" disabled={areButtonsDisabled} onClick={() => openCharacterContextualInfoModal(char)} className="p-1.5 text-gray-400 hover:text-sky-300 bg-black/20 hover:bg-sky-500/20 h-auto" title={t.contextualInfoFor} icon={<InfoIcon className="w-4 h-4"/>} />
                        <Button variant="ghost" disabled={areButtonsDisabled} onClick={() => startEdit(char)} className="p-1.5 text-gray-400 hover:text-emerald-300 bg-black/20 hover:bg-emerald-500/20 h-auto" title={t.edit} icon={<PencilIcon className="w-4 h-4"/>} />
                        <Button variant="ghost" disabled={areButtonsDisabled} onClick={() => deleteCharacter(char.id)} className="p-1.5 text-gray-400 hover:text-red-300 bg-black/20 hover:bg-red-500/20 h-auto" title={t.delete} icon={<TrashIcon className="w-4 h-4"/>} />
                    </div>
                </div>
            ))}
        </div>
        
        <div className="border-t border-white/10 pt-4 flex-shrink-0 bg-[rgba(13,15,24,0.3)] -mx-6 px-6 pb-4">
          <h3 className="text-md font-semibold text-gray-300 mb-3 flex items-center">
             <PencilIcon className="w-4 h-4 mr-2 text-fuchsia-400" />
             {editingCharacter ? t.editCharacter : t.addNewCharacter}
          </h3>
          
          <div className="space-y-3">
            <div>
                <Input 
                    type="text" 
                    disabled={areButtonsDisabled}
                    placeholder={t.characterName}
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    aria-label={t.characterName}
                />
            </div>
            <div>
                <Textarea 
                    disabled={areButtonsDisabled}
                    placeholder={t.characterInstruction}
                    value={newCharInstruction}
                    onChange={(e) => setNewCharInstruction(e.target.value)}
                    rows={3}
                    aria-label={t.characterInstruction}
                />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            {editingCharacter && <Button variant="secondary" disabled={areButtonsDisabled} onClick={() => { setEditingCharacter(null); setNewCharName(''); setNewCharInstruction('');}}>{t.cancelEdit}</Button>}
            <Button 
                variant="primary"
                onClick={handleSave} 
                disabled={areButtonsDisabled || !newCharName.trim() || !newCharInstruction.trim()}
            >
                {editingCharacter ? t.saveChanges : t.addCharacter}
            </Button>
          </div>
        </div>

        <div className="flex justify-end flex-shrink-0 border-t border-white/10 pt-4">
          <Button variant="secondary" onClick={closeCharacterManagementModal} disabled={areButtonsDisabled}>{t.close}</Button>
        </div>
      </div>
    </div>
  );
});

export default CharacterManagementModal;