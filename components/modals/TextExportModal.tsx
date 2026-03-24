import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { useChatListStore } from '../../store/useChatListStore.ts';
import { useExportStore } from '../../store/useExportStore.ts';
import { CloseIcon, CheckIcon, DocumentIcon, UsersIcon, ArrowPathIcon } from '../common/Icons.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';
import BaseModal from '../common/BaseModal.tsx';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Switch } from '../ui/Switch.tsx';

const TextExportModal: React.FC = memo(() => {
  const { isTextExportModalOpen, closeTextExportModal } = useSettingsUI();
  const { chatHistory, loadAllChatsForModals } = useChatListStore();
  const { handleBatchExportChatsToTxt } = useExportStore();
  const { t } = useTranslation();

  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);
  const [isPreparingData, setIsPreparingData] = useState(false);

  useEffect(() => {
    if (isTextExportModalOpen) {
      const initData = async () => {
        setIsPreparingData(true);
        await loadAllChatsForModals();
        setIsPreparingData(false);
      };

      setAreButtonsDisabled(true);
      const timerId = setTimeout(() => {
        setAreButtonsDisabled(false);
      }, 500);

      setSelectedChatIds([]);
      setSearchTerm('');
      initData();
      return () => clearTimeout(timerId);
    }
  }, [isTextExportModalOpen, loadAllChatsForModals]);

  const filteredSessions = useMemo(() => {
    if (!searchTerm.trim()) return chatHistory;
    return chatHistory.filter(session =>
      session.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chatHistory, searchTerm]);

  const handleChatSelectionChange = useCallback((chatId: string) => {
    setSelectedChatIds(prev =>
      prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
    );
  }, []);

  const handleSelectAllChats = useCallback(() => {
    setSelectedChatIds(filteredSessions.map(s => s.id));
  }, [filteredSessions]);

  const handleDeselectAllChats = useCallback(() => {
    setSelectedChatIds([]);
  }, []);

  const handleExport = useCallback(() => {
    if (selectedChatIds.length === 0) return;
    handleBatchExportChatsToTxt(selectedChatIds);
    closeTextExportModal();
  }, [selectedChatIds, handleBatchExportChatsToTxt, closeTextExportModal]);

  const footerButtons = (
    <>
        <Button
            variant="secondary"
            onClick={closeTextExportModal}
            disabled={areButtonsDisabled || isPreparingData}
        >
            {t.cancel}
        </Button>
        <Button
            variant="primary"
            onClick={handleExport}
            disabled={areButtonsDisabled || selectedChatIds.length === 0 || isPreparingData}
            icon={<CheckIcon className="w-4 h-4" />}
        >
            {t.export} ({selectedChatIds.length})
        </Button>
    </>
  );

  return (
    <BaseModal
        isOpen={isTextExportModalOpen}
        onClose={closeTextExportModal}
        title={
            <div className="flex items-center">
                <DocumentIcon className="w-5 h-5 mr-3 text-amber-400" />
                {t.exportTxtBatch}
            </div>
        }
        footer={footerButtons}
        maxWidth="sm:max-w-lg"
    >
        <div className="space-y-4">
            <p className="text-sm text-gray-400">
                {t.exportTxtBatchDesc}
            </p>

            {/* Chat Selection Card - Amber */}
            <div className="relative p-4 rounded-r-xl rounded-l-md border border-white/10 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-500/5 to-transparent">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                        {t.selectChatsToExport}
                    </h4>
                    <div className="space-x-2">
                        <Button variant="ghost" size="sm" onClick={handleSelectAllChats} className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-1 rounded hover:bg-amber-500/20 disabled:opacity-50" disabled={filteredSessions.length === 0}>{t.selectAll}</Button>
                        <Button variant="ghost" size="sm" onClick={handleDeselectAllChats} className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded hover:bg-white/10 disabled:opacity-50" disabled={selectedChatIds.length === 0}>{t.deselectAll}</Button>
                    </div>
                </div>
                
                {isPreparingData ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <ArrowPathIcon className="w-8 h-8 text-amber-500 animate-spin" />
                        <p className="text-sm text-amber-400 font-medium animate-pulse">Loading full history...</p>
                    </div>
                ) : chatHistory.length > 0 ? (
                <>
                    <Input
                    type="text"
                    placeholder="Search chats..."
                    className="mb-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-md p-1 space-y-1 bg-gray-50 dark:bg-black/20 custom-scrollbar">
                    {filteredSessions.map(session => (
                        <div key={session.id} className={`flex items-center p-1.5 rounded-md cursor-pointer transition-colors ${selectedChatIds.includes(session.id) ? 'bg-amber-500/10' : 'hover:bg-white/5'}`} onClick={() => handleChatSelectionChange(session.id)}>
                        <Switch
                            checked={selectedChatIds.includes(session.id)}
                            readOnly
                            className="h-4 w-4 text-amber-500 bg-black/30 border-white/20 rounded focus:ring-amber-500 focus:ring-offset-black"
                        />
                        <label className="ltr:ml-2 rtl:mr-2 text-sm text-gray-300 truncate cursor-pointer flex items-center flex-grow">
                            {session.isCharacterModeActive && <UsersIcon className="w-3.5 h-3.5 ltr:mr-1.5 rtl:ml-1.5 text-purple-400 flex-shrink-0"/>}
                            {session.title}
                        </label>
                        </div>
                    ))}
                    {filteredSessions.length === 0 && <p className="text-sm text-gray-500 italic text-center py-2">No chats match.</p>}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-right">{selectedChatIds.length} of {filteredSessions.length} chat(s) selected.</p>
                </>
                ) : (
                <p className="text-sm text-gray-500 italic">{t.noChats}</p>
                )}
            </div>
        </div>
    </BaseModal>
  );
});

export default TextExportModal;