
import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { useChatListStore } from '../../store/useChatListStore.ts';
import { useActiveChatStore } from '../../store/useActiveChatStore.ts';
import { useSelectionStore } from '../../store/useSelectionStore.ts';
import { useInteractionStore } from '../../store/useInteractionStore.ts';
import { ArrowRightStartOnRectangleIcon, CloseIcon, UsersIcon, ArrowPathIcon } from '../common/Icons.tsx';
import BaseModal from '../common/BaseModal.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';

const MoveMessagesModal: React.FC = memo(() => {
    const { isMoveMessagesModalOpen, closeMoveMessagesModal } = useSettingsUI();
    const { chatHistory, loadAllChatsForModals } = useChatListStore();
    const { currentChatId } = useActiveChatStore();
    const { selectedMessageIds } = useSelectionStore();
    const { handleMoveMessagesToChat } = useInteractionStore();
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [isMoving, setIsMoving] = useState(false);
    const [isPreparingData, setIsPreparingData] = useState(false);

    useEffect(() => {
        if (isMoveMessagesModalOpen) {
            const initData = async () => {
                setIsPreparingData(true);
                await loadAllChatsForModals();
                setIsPreparingData(false);
            };

            setSearchTerm('');
            setSelectedTargetId(null);
            setIsMoving(false);
            initData();
        }
    }, [isMoveMessagesModalOpen, loadAllChatsForModals]);

    const eligibleChats = useMemo(() => {
        return chatHistory.filter(chat => chat.id !== currentChatId);
    }, [chatHistory, currentChatId]);

    const filteredChats = useMemo(() => {
        if (!searchTerm.trim()) return eligibleChats;
        const lowerTerm = searchTerm.toLowerCase();
        return eligibleChats.filter(chat => chat.title.toLowerCase().includes(lowerTerm));
    }, [eligibleChats, searchTerm]);

    const handleConfirm = useCallback(async () => {
        if (!selectedTargetId) return;
        setIsMoving(true);
        await handleMoveMessagesToChat(selectedTargetId, selectedMessageIds);
        setIsMoving(false);
        closeMoveMessagesModal();
    }, [selectedTargetId, selectedMessageIds, handleMoveMessagesToChat, closeMoveMessagesModal]);

    const footerButtons = (
        <>
            <Button 
                variant="secondary"
                onClick={closeMoveMessagesModal} 
                disabled={isMoving || isPreparingData}
            >
                {t.cancel}
            </Button>
            <Button 
                variant="primary"
                onClick={handleConfirm}
                disabled={!selectedTargetId || isMoving || isPreparingData}
                icon={!isMoving && <ArrowRightStartOnRectangleIcon className="w-4 h-4" />}
            >
                {isMoving ? (
                    <span className="animate-pulse">Copying...</span>
                ) : (
                    "Copy to Chat"
                )}
            </Button>
        </>
    );

    return (
        <BaseModal
            isOpen={isMoveMessagesModalOpen}
            onClose={closeMoveMessagesModal}
            title="Copy Messages To..."
            headerIcon={<ArrowRightStartOnRectangleIcon className="w-5 h-5 text-emerald-500" />}
            footer={footerButtons}
            maxWidth="sm:max-w-lg"
        >
            <div className="space-y-4">
                <p className="text-sm text-gray-400">
                    Select a destination chat to copy the <strong>{selectedMessageIds.length}</strong> selected message(s) to. 
                    They will appear at the end of the target chat history.
                </p>

                <Input
                    type="text"
                    placeholder="Search chats..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />

                <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-md bg-gray-50 dark:bg-black/20 p-1 custom-scrollbar">
                    {isPreparingData ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-3">
                            <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin" />
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">Loading full history...</p>
                        </div>
                    ) : filteredChats.length === 0 ? (
                        <p className="text-center text-gray-500 py-6 italic text-sm">No other chats found.</p>
                    ) : (
                        <div className="space-y-1">
                            {filteredChats.map(chat => {
                                const isSelected = selectedTargetId === chat.id;
                                return (
                                    <div 
                                        key={chat.id}
                                        onClick={() => setSelectedTargetId(chat.id)}
                                        className={`flex items-center p-2 rounded cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30' : 'hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'}`}
                                    >
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center">
                                                <p className={`text-sm truncate font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {chat.title}
                                                </p>
                                                {chat.isCharacterModeActive && <UsersIcon className="w-3 h-3 ml-2 text-fuchsia-400 flex-shrink-0" />}
                                            </div>
                                            <p className="text-[10px] text-gray-500 truncate">
                                                Last updated: {new Date(chat.lastUpdatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </BaseModal>
    );
});

export default MoveMessagesModal;
