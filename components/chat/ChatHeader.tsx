
import React, { memo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { useActiveChatStore } from '../../store/useActiveChatStore.ts';
import { useDataStore } from '../../store/useDataStore.ts';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { useSelectionStore } from '../../store/useSelectionStore.ts';
import { useInteractionStore } from '../../store/useInteractionStore.ts';
import { useGeminiApiStore } from '../../store/useGeminiApiStore.ts';
import { clearCacheAndReload } from '../../services/pwaService.ts';
import { getModelDisplayName } from '../../services/llm/config.ts';
import { MODEL_DEFINITIONS } from '../../constants.ts';
import { applyModelSwitchWithMemory } from '../../services/utils.ts';
import { 
    Bars3Icon, UsersIcon, ClipboardDocumentCheckIcon, 
    XCircleIcon, StarIcon, ArrowsUpDownIcon, CheckIcon, PlusIcon, SparklesIcon,
    ChevronDownIcon, ServerIcon
} from '../common/Icons.tsx';
import FavoritesDropdown from '../common/FavoritesDropdown.tsx';
import { useGlobalUiStore } from '../../store/useGlobalUiStore.ts';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { useExternalModelsStore } from '../../store/useExternalModelsStore.ts';
import { generateChatFingerprint } from '../../services/utils.ts';
import { Button } from '../ui/Button.tsx';
import { Dropdown } from '../ui/Dropdown.tsx';
import { Badge } from '../ui/Badge.tsx';

interface ChatHeaderProps {
    isReorderingActive: boolean;
    toggleReordering: () => void;
    onJumpToMessage: (messageId: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = memo(({ isReorderingActive, toggleReordering, onJumpToMessage }) => {
    const { id, title, model, isCharacterModeActive } = useActiveChatStore(useShallow(state => ({
        id: state.currentChatSession?.id,
        title: state.currentChatSession?.title,
        model: state.currentChatSession?.model,
        isCharacterModeActive: state.currentChatSession?.isCharacterModeActive
    })));
    const { toggleSidebar, isSidebarOpen } = useGlobalUiStore();
    const { updateModel, updateSettings } = useDataStore();
    const { isSelectionModeActive, toggleSelectionMode } = useSelectionStore();
    const { toggleFavoriteMessage } = useInteractionStore();
    const { openCharacterManagementModal, openCacheManagerModal } = useSettingsUI();
    const { t } = useTranslation();
    const { isExternalModeActive, activeModelId, models } = useExternalModelsStore();
    
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
    const favoritesButtonRef = useRef<HTMLButtonElement>(null);

    const isCharacterMode = isCharacterModeActive || false;
    
    let modelName = model ? getModelDisplayName(model) : '';
    if (isExternalModeActive && activeModelId) {
        const activeModel = models.find(m => m.id === activeModelId);
        if (activeModel) {
            modelName = activeModel.displayName;
        }
    }

    const currentChatSession = useActiveChatStore(state => state.currentChatSession);
    const manualCacheInfo = currentChatSession?.manualCacheInfo;
    const isCacheExpired = manualCacheInfo ? manualCacheInfo.expireTime < Date.now() : false;
    const currentFingerprint = manualCacheInfo && currentChatSession ? generateChatFingerprint(currentChatSession, manualCacheInfo.cachedMessageCount) : '';
    const isCacheInvalid = manualCacheInfo ? manualCacheInfo.fingerprint !== currentFingerprint : false;

    const handleModelSelect = async (modelId: string) => {
        const currentChatSession = useActiveChatStore.getState().currentChatSession;
        if (!currentChatSession) return;
        
        const newSettings = applyModelSwitchWithMemory(currentChatSession.model, modelId, currentChatSession.settings);

        // Optimistic UI Update
        await useActiveChatStore.getState().updateCurrentChatSession(s => s ? ({ ...s, model: modelId, settings: newSettings }) : null);
        
        // Persist to Database
        await updateModel(currentChatSession.id, modelId);
        await updateSettings(currentChatSession.id, newSettings);
    };

    return (
        <header className="sticky top-0 z-20 flex items-center justify-between min-h-[3.5rem] sm:min-h-[4rem] h-auto py-2 sm:py-0 px-3 sm:px-6 ps-[env(safe-area-inset-left)] pe-[env(safe-area-inset-right)] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 shadow-sm transition duration-300">
            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden flex-1 min-w-0">
                <Button 
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar} 
                    className="flex-shrink-0 w-9 h-9 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl" 
                    title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"} 
                    aria-label={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                    <Bars3Icon className="w-5 h-5" />
                </Button>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 min-w-0">
                    <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-zinc-100 truncate flex items-center gap-2 tracking-tight leading-tight min-w-0">
                        {title ? title : t.chatInterface}
                        {isCharacterMode && <UsersIcon className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />}
                    </h1>
                    {id && (
                        <div className="flex items-center gap-2 min-w-0">
                            {isExternalModeActive ? (
                                <Button 
                                    variant="ghost"
                                    size="none"
                                    className="inline-flex items-center max-w-[100px] xs:max-w-[140px] sm:max-w-[200px] flex-shrink-0 h-auto min-h-[1.5rem] sm:min-h-[1.75rem] py-1 px-2.5 rounded-full text-[10px] sm:text-xs font-medium border uppercase tracking-wider transition bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-300 cursor-default"
                                    title={t.externalModelActive}
                                >
                                    <ServerIcon className="w-2.5 h-2.5 me-1.5 flex-shrink-0" />
                                    <span className="whitespace-normal break-words text-center leading-[1.1] text-[10px] sm:text-xs flex-1">{modelName}</span>
                                </Button>
                            ) : (
                                <Dropdown
                                    trigger={
                                        <Button 
                                            variant="ghost"
                                            size="none"
                                            className={`inline-flex items-center max-w-[100px] xs:max-w-[140px] sm:max-w-[200px] flex-shrink-0 h-auto min-h-[1.5rem] sm:min-h-[1.75rem] py-1 px-2.5 rounded-full text-[10px] sm:text-xs font-medium border uppercase tracking-wider transition cursor-pointer ${
                                                isCharacterMode 
                                                    ? 'bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-500/20' 
                                                    : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                                            }`}
                                            title={t.switchModel}
                                        >
                                            <SparklesIcon className="w-2.5 h-2.5 me-1.5 flex-shrink-0" />
                                            <span className="whitespace-normal break-words text-center leading-[1.1] text-[10px] sm:text-xs flex-1">{modelName}</span>
                                            <ChevronDownIcon className="w-2.5 h-2.5 ms-1.5 opacity-70 transition-transform flex-shrink-0" />
                                        </Button>
                                    }
                                >
                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/5 mb-1">
                                        Select Model
                                    </div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 p-1">
                                        {MODEL_DEFINITIONS.map(def => (
                                            <Button
                                                variant="ghost"
                                                key={def.id}
                                                onClick={() => handleModelSelect(def.id)}
                                                className={`text-left px-3 py-2 text-xs rounded-lg transition-colors flex justify-between items-center ${
                                                    model === def.id 
                                                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-medium' 
                                                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                <span className="truncate me-2">{def.name}</span>
                                                {model === def.id && <CheckIcon className="w-3 h-3 flex-shrink-0" />}
                                            </Button>
                                        ))}
                                    </div>
                                </Dropdown>
                            )}
                            
                            <button
                                onClick={openCacheManagerModal}
                                className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full transition cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 flex-shrink-0"
                                title={!manualCacheInfo ? t.cacheManage : isCacheInvalid ? t.cacheInvalid : isCacheExpired ? t.cacheExpired : t.cacheActive}
                            >
                                <ServerIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                                <span className={`text-[9px] sm:text-[10px] px-1.5 py-0 font-bold uppercase tracking-wider ${
                                    !manualCacheInfo ? 'text-gray-400' : isCacheInvalid ? 'text-red-500' : isCacheExpired ? 'text-amber-500' : 'text-emerald-500'
                                }`}>
                                    {!manualCacheInfo ? 'Cache' : isCacheInvalid ? 'Invalid' : isCacheExpired ? 'Expired' : 'Active'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ms-2">
                {id && (
                    <>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="ghost"
                                size="icon"
                                onClick={toggleSelectionMode} 
                                className={`w-9 h-9 rounded-xl ${
                                    isSelectionModeActive 
                                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`} 
                                title={isSelectionModeActive ? t.done : t.selectMultiple} 
                                aria-label={isSelectionModeActive ? t.done : t.selectMultiple}
                            >
                                {isSelectionModeActive ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentCheckIcon className="w-4 h-4" />}
                            </Button>
                            
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    ref={favoritesButtonRef}
                                    onClick={() => setIsFavoritesOpen(prev => !prev)}
                                    className={`w-9 h-9 rounded-xl ${
                                        isFavoritesOpen 
                                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                                            : 'hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                                    }`}
                                    title={t.viewFavorites}
                                    aria-label={t.viewFavorites}
                                >
                                    <StarIcon className="w-4 h-4" />
                                </Button>
                                <FavoritesDropdown
                                    triggerRef={favoritesButtonRef}
                                    isOpen={isFavoritesOpen}
                                    onClose={() => setIsFavoritesOpen(false)}
                                    onJumpToMessage={(messageId) => {
                                        onJumpToMessage(messageId);
                                        setIsFavoritesOpen(false);
                                    }}
                                    onRemoveFavorite={toggleFavoriteMessage}
                                />
                            </div>
                        </div>

                        {isCharacterMode && (
                            <>
                                <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1 sm:mx-2 hidden sm:block"></div>
                                <div className="flex items-center gap-1">
                                    <Button 
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleReordering} 
                                        className={`w-9 h-9 rounded-xl ${
                                            isReorderingActive 
                                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                                : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                        }`} 
                                        title={isReorderingActive ? t.done : t.editOrder}
                                    >
                                        <ArrowsUpDownIcon className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost"
                                        size="icon"
                                        onClick={openCharacterManagementModal} 
                                        className="w-9 h-9 rounded-xl text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-700 dark:hover:text-fuchsia-300 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/10" 
                                        title={t.manageCharacters}
                                        disabled={isReorderingActive}
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </header>
    );
});

export default ChatHeader;
