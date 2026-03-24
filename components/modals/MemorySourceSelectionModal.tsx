import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts'; 
import { useChatListStore } from '../../store/useChatListStore.ts';
import { useActiveChatStore } from '../../store/useActiveChatStore.ts';
import { useDataStore } from '../../store/useDataStore.ts';
import { CloseIcon, CheckIcon, ClipboardDocumentListIcon, UsersIcon, CogIcon, InfoIcon, FlowRightIcon, UserIcon, ArrowPathIcon } from '../common/Icons.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { MEMORY_STRATEGIES } from '../../constants.ts';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Select } from '../ui/Select.tsx';

const MemorySourceSelectionModal: React.FC = memo(() => {
  const { isMemorySourceModalOpen, closeMemorySourceModal, openCustomStrategyModal } = useSettingsUI(); 
  const { chatHistory, loadAllChatsForModals } = useChatListStore();
  const { currentChatSession, updateCurrentChatSession } = useActiveChatStore();
  const { updateSettings, customMemoryStrategies, updateChatPartnerRole } = useDataStore();
  const { t } = useTranslation();

  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);
  const [isPreparingData, setIsPreparingData] = useState(false);
  
  // Advanced Settings State
  const [maxResults, setMaxResults] = useState<number>(15);
  const [minRelevance, setMinRelevance] = useState<number>(0.35);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('companion');
  const [showAdvancedHelp, setShowAdvancedHelp] = useState<string | null>(null);

  // Local state for partner roles to avoid excessive re-renders/DB writes on typing
  const [partnerRoles, setPartnerRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isMemorySourceModalOpen && currentChatSession) {
        const initData = async () => {
            setIsPreparingData(true);
            await loadAllChatsForModals();
            setIsPreparingData(false);
            
            // After loading, initialize selection and roles
            const history = useChatListStore.getState().chatHistory;
            const currentSettings = currentChatSession.settings;
            if (currentSettings.memorySourceChatIds === undefined) {
                setSelectedChatIds(history.map(chat => chat.id));
            } else {
                setSelectedChatIds(currentSettings.memorySourceChatIds);
            }

            const roleMap: Record<string, string> = {};
            history.forEach(c => {
                roleMap[c.id] = c.partnerRole || '';
            });
            setPartnerRoles(roleMap);
        };

        setAreButtonsDisabled(true);
        const timerId = setTimeout(() => {
            setAreButtonsDisabled(false);
        }, 500);

        const currentSettings = currentChatSession.settings;
        setMaxResults(currentSettings.memoryMaxResults ?? 15);
        setMinRelevance(currentSettings.memoryMinRelevance ?? 0.35);
        setSelectedStrategy(currentSettings.memoryQueryStrategy || 'companion');

        initData();

        setSearchTerm('');
        setShowAdvancedHelp(null);
        return () => clearTimeout(timerId);
    }
  }, [isMemorySourceModalOpen, currentChatSession, loadAllChatsForModals]);

  const filteredChats = useMemo(() => {
    if (!searchTerm.trim()) return chatHistory;
    return chatHistory.filter(chat => 
        chat.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chatHistory, searchTerm]);

  const handleToggleChat = useCallback((chatId: string) => {
    setSelectedChatIds(prev => 
        prev.includes(chatId) 
            ? prev.filter(id => id !== chatId) 
            : [...prev, chatId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const visibleIds = filteredChats.map(c => c.id);
    setSelectedChatIds(prev => {
        const newSet = new Set([...prev, ...visibleIds]);
        return Array.from(newSet);
    });
  }, [filteredChats]);

  const handleDeselectAll = useCallback(() => {
    const visibleIds = new Set(filteredChats.map(c => c.id));
    setSelectedChatIds(prev => prev.filter(id => !visibleIds.has(id)));
  }, [filteredChats]);

  const handleSave = useCallback(async () => {
    if (!currentChatSession) return;

    const newSettings = {
        ...currentChatSession.settings,
        memorySourceChatIds: selectedChatIds,
        memoryMaxResults: maxResults,
        memoryMinRelevance: minRelevance,
        memoryQueryStrategy: selectedStrategy
    };

    await updateCurrentChatSession(s => s ? ({ ...s, settings: newSettings }) : null);
    
    await updateSettings(currentChatSession.id, newSettings);

    closeMemorySourceModal();
  }, [currentChatSession, selectedChatIds, maxResults, minRelevance, selectedStrategy, updateCurrentChatSession, updateSettings, closeMemorySourceModal]);

  const toggleHelp = (key: string) => {
      setShowAdvancedHelp(prev => prev === key ? null : key);
  };

  const handleMaxResultsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val > 0) {
          setMaxResults(val);
      }
  }, []);

  const handleStrategyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === '__create_new__') {
          openCustomStrategyModal();
          // Keep the current selection until a new one is created and selected later
      } else {
          setSelectedStrategy(val);
      }
  }, [openCustomStrategyModal]);

  const handleRoleChange = useCallback((chatId: string, newValue: string) => {
      setPartnerRoles(prev => ({ ...prev, [chatId]: newValue }));
  }, []);

  const handleRoleBlur = useCallback((chatId: string, newValue: string) => {
      // Find original role to check if changed
      const original = chatHistory.find(c => c.id === chatId)?.partnerRole || '';
      if (newValue.trim() !== original) {
          updateChatPartnerRole(chatId, newValue.trim());
      }
  }, [chatHistory, updateChatPartnerRole]);

  if (!isMemorySourceModalOpen) return null;

  const currentDesc = MEMORY_STRATEGIES[selectedStrategy]?.description || customMemoryStrategies.find(s => s.id === selectedStrategy)?.description;

  return (
    <div 
        className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="memory-source-modal-title"
        onClick={closeMemorySourceModal}
    >
      <div 
        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-6 rounded-lg shadow-2xl w-full sm:max-w-xl max-h-[90vh] flex flex-col text-gray-900 dark:text-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 id="memory-source-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <ClipboardDocumentListIcon className="w-5 h-5 mr-3 text-emerald-500" />
            {t.memoryScopeTitle}
          </h2>
          <Button
            variant="ghost"
            onClick={closeMemorySourceModal}
            disabled={areButtonsDisabled}
            className="p-1 rounded-full"
            aria-label={t.close}
          >
            <CloseIcon className="w-6 h-6" />
          </Button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t.memoryScopeDesc}
        </p>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3 flex-shrink-0">
            <Input 
                type="text" 
                placeholder="Search chats..." 
                className="flex-grow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2">
                <Button 
                    variant="primary"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={areButtonsDisabled}
                >
                    {t.selectAll}
                </Button>
                <Button 
                    variant="secondary"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={areButtonsDisabled}
                >
                    {t.deselectAll}
                </Button>
            </div>
        </div>

        {/* Chat List */}
        <div className="flex-grow min-h-0 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-md bg-gray-50 dark:bg-black/20 p-1 custom-scrollbar mb-4">
            {isPreparingData ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">Loading full history...</p>
                </div>
            ) : filteredChats.length === 0 ? (
                <p className="text-center text-gray-500 py-8 italic">{t.noChatsFound}</p>
            ) : (
                <div className="space-y-1">
                    {filteredChats.map(chat => {
                        const isSelected = selectedChatIds.includes(chat.id);
                        const isCurrent = currentChatSession?.id === chat.id;
                        return (
                            <div 
                                key={chat.id} 
                                className={`flex items-center p-2 rounded transition-colors group ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            >
                                <div className="flex items-center flex-grow min-w-0 cursor-pointer" onClick={() => !areButtonsDisabled && handleToggleChat(chat.id)}>
                                    <div className={`w-5 h-5 flex items-center justify-center border rounded mr-3 flex-shrink-0 transition-colors ${isSelected ? 'bg-emerald-600 border-emerald-500' : 'border-gray-300 dark:border-gray-600 bg-transparent'}`}>
                                        {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center">
                                            <p className={`text-sm truncate font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-200' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {chat.title}
                                            </p>
                                            {chat.isCharacterModeActive && <UsersIcon className="w-3.5 h-3.5 ml-2 text-emerald-500 flex-shrink-0" />}
                                            {isCurrent && <span className="ml-2 text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-wider font-bold">{t.current}</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">
                                            {new Date(chat.lastUpdatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Partner Role Input - Only visible if selected */}
                                {isSelected && (
                                    <div className="flex items-center ml-2 flex-shrink-0 bg-black/40 rounded p-1 border border-purple-500/30">
                                        <UserIcon className="w-3 h-3 text-purple-400 mr-1.5" />
                                        <input
                                            type="text"
                                            value={partnerRoles[chat.id] || ''}
                                            onChange={(e) => handleRoleChange(chat.id, e.target.value)}
                                            onBlur={(e) => handleRoleBlur(chat.id, e.target.value)}
                                            placeholder="Role (e.g. Boss)"
                                            className="w-24 bg-transparent text-xs text-emerald-700 dark:text-emerald-200 placeholder-emerald-500/50 focus:outline-none"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Strategy Selection (Steerable RAG) */}
        <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex-shrink-0 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2 flex items-center">
                <FlowRightIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                {t.memoryStrategy}
            </h3>
            <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-lg border border-gray-200 dark:border-white/5">
                <Select
                    value={selectedStrategy}
                    onChange={handleStrategyChange}
                    className="mb-2"
                >
                    <optgroup label="Built-in Strategies">
                        {Object.entries(MEMORY_STRATEGIES).map(([key, strategy]) => (
                            <option key={key} value={key}>{strategy.label}</option>
                        ))}
                    </optgroup>
                    
                    {customMemoryStrategies.length > 0 && (
                        <optgroup label="Custom Strategies">
                            {customMemoryStrategies.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </optgroup>
                    )}

                    <option value="__create_new__" className="font-bold text-emerald-600 dark:text-emerald-400">+ Create Custom...</option>
                </Select>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 italic">
                    {currentDesc}
                </p>
            </div>
        </div>

        {/* Advanced Settings Section */}
        <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-300 mb-3 flex items-center">
                <CogIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                {t.advancedSearchSettings}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Result Count Input */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-400 flex items-center">
                            {t.maxResults}
                            <Button variant="ghost" onClick={() => toggleHelp('count')} className="ml-1 p-0.5 h-auto w-auto text-gray-500 hover:text-gray-300 focus:outline-none">
                                <InfoIcon className="w-3.5 h-3.5" />
                            </Button>
                        </label>
                    </div>
                    {showAdvancedHelp === 'count' && <p className="text-[10px] text-gray-500 mb-2 bg-gray-100 dark:bg-black/20 p-1.5 rounded">{t.maxResultsDesc}</p>}
                    <Input 
                        type="number" 
                        min={1} 
                        step={1}
                        value={maxResults}
                        onChange={handleMaxResultsChange}
                        placeholder="e.g., 50"
                    />
                </div>

                {/* Relevance Threshold Slider */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-400 flex items-center">
                            {t.minRelevance}
                            <Button variant="ghost" onClick={() => toggleHelp('relevance')} className="ml-1 p-0.5 h-auto w-auto text-gray-500 hover:text-gray-300 focus:outline-none">
                                <InfoIcon className="w-3.5 h-3.5" />
                            </Button>
                        </label>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">{minRelevance.toFixed(2)}</span>
                    </div>
                    {showAdvancedHelp === 'relevance' && <p className="text-[10px] text-gray-500 mb-2 bg-gray-100 dark:bg-black/20 p-1.5 rounded">{t.minRelevanceDesc}</p>}
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05"
                        value={minRelevance}
                        onChange={(e) => setMinRelevance(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>
            </div>
        </div>

        <div className="mt-6 flex justify-between items-center flex-shrink-0">
            <span className="text-xs text-gray-400">
                {selectedChatIds.length} {t.chatsSelected}
            </span>
            <div className="flex gap-3">
                <Button 
                    variant="secondary"
                    onClick={closeMemorySourceModal}
                    disabled={areButtonsDisabled || isPreparingData}
                >
                    {t.cancel}
                </Button>
                <Button 
                    variant="primary"
                    onClick={handleSave}
                    disabled={areButtonsDisabled || isPreparingData}
                >
                    {t.save}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
});

export default MemorySourceSelectionModal;