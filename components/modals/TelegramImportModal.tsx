import React, { useState, memo, useCallback, useEffect } from 'react';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { useChatListStore } from '../../store/useChatListStore.ts';
import { useActiveChatStore } from '../../store/useActiveChatStore.ts';
import { useToastStore } from '../../store/useToastStore.ts';
import { TelegramIcon, CloseIcon, CheckIcon, DocumentIcon, UserIcon, SparklesIcon } from '../common/Icons.tsx';
import BaseModal from '../common/BaseModal.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { getTelegramParticipants, convertTelegramToSession, TelegramExport } from '../../services/telegramService.ts';
import { Button } from '../ui/Button.tsx';

const TelegramImportModal: React.FC = memo(() => {
    const { isTelegramImportModalOpen, closeTelegramImportModal } = useSettingsUI();
    const { addChatSession } = useChatListStore();
    const { selectChat } = useActiveChatStore();
    const showToast = useToastStore(state => state.showToast);
    const { t } = useTranslation();

    const [file, setFile] = useState<File | null>(null);
    const [importData, setImportData] = useState<TelegramExport | null>(null);
    const [participants, setParticipants] = useState<{ id: string; name: string; count: number }[]>([]);
    
    const [userId, setUserId] = useState<string>('');
    const [modelId, setModelId] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!isTelegramImportModalOpen) {
            setFile(null);
            setImportData(null);
            setParticipants([]);
            setUserId('');
            setModelId('');
            setIsProcessing(false);
        }
    }, [isTelegramImportModalOpen]);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.json')) {
            showToast("Please upload a valid JSON file exported from Telegram.", "error");
            return;
        }

        setFile(selectedFile);
        
        try {
            const text = await selectedFile.text();
            const data = JSON.parse(text) as TelegramExport;
            
            if (!data.messages || !Array.isArray(data.messages)) {
                throw new Error("Invalid Telegram export format.");
            }

            const parts = getTelegramParticipants(data);
            setImportData(data);
            setParticipants(parts);

            // Auto-select if only 2 participants
            if (parts.length >= 2) {
                setUserId(parts[0].id);
                setModelId(parts[1].id);
            }
        } catch (err: any) {
            showToast(`Failed to parse file: ${err.message}`, "error");
            setFile(null);
        }
    }, [showToast]);

    const handleImport = useCallback(async () => {
        if (!importData || !userId || !modelId) return;

        setIsProcessing(true);
        try {
            const session = convertTelegramToSession(importData, userId, modelId);
            await addChatSession(session);
            await selectChat(session.id);
            showToast("Telegram chat imported successfully!", "success");
            closeTelegramImportModal();
        } catch (err: any) {
            showToast(`Import failed: ${err.message}`, "error");
        } finally {
            setIsProcessing(false);
        }
    }, [importData, userId, modelId, addChatSession, selectChat, showToast, closeTelegramImportModal]);

    const footerButtons = (
        <>
            <Button variant="secondary" onClick={closeTelegramImportModal}>{t.cancel}</Button>
            <Button 
                variant="primary"
                onClick={handleImport} 
                disabled={!userId || !modelId || isProcessing}
                className="bg-emerald-600 hover:bg-emerald-500"
                icon={!isProcessing ? <CheckIcon className="w-4 h-4" /> : undefined}
            >
                {isProcessing ? <span className="animate-pulse">{t.loading}</span> : t.import}
            </Button>
        </>
    );

    return (
        <BaseModal
            isOpen={isTelegramImportModalOpen}
            onClose={closeTelegramImportModal}
            title="Import from Telegram"
            headerIcon={<TelegramIcon className="w-5 h-5 text-emerald-500" />}
            footer={footerButtons}
            maxWidth="sm:max-w-lg"
        >
            <div className="space-y-6">
                {!importData ? (
                    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-black/10 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group">
                        <DocumentIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4 group-hover:text-emerald-500 transition-colors" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                            Upload the <code className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1 rounded">result.json</code> file exported from Telegram Desktop.
                        </p>
                        <label className="cursor-pointer px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/20">
                            Select JSON File
                            <input type="file" accept=".json" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20">
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">Detected Chat</p>
                            <p className="text-sm text-gray-900 dark:text-white font-medium">{importData.name} ({importData.messages.length} messages)</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                                    <UserIcon className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                                    Who are YOU in this chat?
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {participants.map(p => (
                                        <button 
                                            key={p.id}
                                            onClick={() => setUserId(p.id)}
                                            className={`flex items-center justify-between p-3 rounded-lg border transition ${userId === p.id ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                        >
                                            <span className="text-sm font-medium">{p.name}</span>
                                            <span className="text-[10px] opacity-60">{p.count} msgs</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                                    <SparklesIcon className="w-3.5 h-3.5 mr-2 text-purple-500" />
                                    Who is the AI (Model)?
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {participants.map(p => (
                                        <button 
                                            key={p.id}
                                            onClick={() => setModelId(p.id)}
                                            disabled={p.id === userId}
                                            className={`flex items-center justify-between p-3 rounded-lg border transition ${modelId === p.id ? 'bg-purple-50 dark:bg-purple-600/20 border-purple-500 text-purple-700 dark:text-purple-100 shadow-md' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'} ${p.id === userId ? 'opacity-30 cursor-not-allowed' : ''}`}
                                        >
                                            <span className="text-sm font-medium">{p.name}</span>
                                            <span className="text-[10px] opacity-60">{p.count} msgs</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-[10px] text-gray-500 italic mt-4">
                            * Only text messages from selected participants will be imported. Attachments and media are not supported in this version.
                        </p>
                    </div>
                )}
            </div>
        </BaseModal>
    );
});

export default TelegramImportModal;