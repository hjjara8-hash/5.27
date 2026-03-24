
import React, { memo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useActiveChatStore } from '../../store/useActiveChatStore.ts';
import { useDataStore } from '../../store/useDataStore.ts';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { WrenchScrewdriverIcon, CogIcon, BookOpenIcon } from '../common/Icons.tsx';
import { GeminiSettings } from '../../types.ts';
import { useExternalModelsStore } from '../../store/useExternalModelsStore.ts';
import { Button } from '../ui/Button.tsx';
import { Dropdown } from '../ui/Dropdown.tsx';

const ChatToolsMenu: React.FC = memo(() => {
    const { sessionId, settings, updateCurrentChatSession } = useActiveChatStore(useShallow(state => ({
        sessionId: state.currentChatSession?.id,
        settings: state.currentChatSession?.settings,
        updateCurrentChatSession: state.updateCurrentChatSession
    })));
    const { updateSettings } = useDataStore();
    const { openActiveMemoryModal, openShadowSetupModal, openStrategySetupModal, openReasoningSetupModal, openMemorySourceModal, openStoryManagerModal } = useSettingsUI();
    const { isExternalModeActive } = useExternalModelsStore();

    // Toggle setting helper
    const toggleSetting = useCallback(async (key: keyof GeminiSettings) => {
        const currentChatSession = useActiveChatStore.getState().currentChatSession;
        if (!currentChatSession) return;
        
        const currentVal = currentChatSession.settings[key];
        const newVal = !currentVal;
        
        const newSettings = { ...currentChatSession.settings, [key]: newVal };
        
        // Optimistic update for UI responsiveness
        await updateCurrentChatSession(s => s ? ({ ...s, settings: newSettings }) : null);
        
        // Persist to DB
        await updateSettings(currentChatSession.id, newSettings);
    }, [updateCurrentChatSession, updateSettings]);

    const isAgentActive = settings?.enableReasoningWorkflow ?? false;
    const isMemoryActive = settings?.enableLongTermMemory ?? false;
    const isShadowActive = settings?.enableShadowMode ?? false;
    const isActiveMemoryEnabled = settings?.isMemoryBoxEnabled ?? false; 
    const isStrategyActive = settings?.isStrategyToolEnabled ?? false; // Strategy Check

    if (!sessionId) return null;

    return (
        <Dropdown
            trigger={
                <Button
                    variant="ghost"
                    className="p-2 rounded-full transition duration-200 focus:ring-2 focus:ring-emerald-500 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                    title="Tools"
                    disabled={!sessionId}
                    icon={<WrenchScrewdriverIcon className="w-5 h-5" />}
                />
            }
            className="min-w-[150px]"
        >
            {({ close }) => (
                <>
                    {/* Story Mode */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors w-full group text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200">
                        <Button 
                            onClick={(e) => { e.stopPropagation(); openStoryManagerModal(); close(); }} 
                            variant="ghost"
                            className="flex-grow text-left flex items-center p-0 h-auto w-auto bg-transparent hover:bg-transparent"
                        >
                            <BookOpenIcon className="w-3.5 h-3.5 mr-2 opacity-70" />
                            <span>Story</span>
                        </Button>
                    </div>

                    {/* Strategy Protocol */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors w-full group ${isStrategyActive ? 'bg-amber-500/20 text-amber-700 dark:text-amber-200' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                        <Button onClick={() => toggleSetting('isStrategyToolEnabled')} variant="ghost" className="flex-grow text-left flex items-center p-0 h-auto w-auto bg-transparent hover:bg-transparent">
                            <span>Protocol</span>
                        </Button>
                        <div className="flex items-center">
                            <Button 
                                onClick={(e) => { e.stopPropagation(); openStrategySetupModal(); close(); }} 
                                variant="ghost"
                                className={`p-1 ml-2 rounded hover:bg-gray-200 dark:hover:bg-white/10 h-auto w-auto ${isStrategyActive ? 'text-amber-600 dark:text-amber-200' : 'text-gray-400 dark:text-gray-500'}`}
                                title="Configure Strategic Protocol"
                            >
                                <CogIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button onClick={() => toggleSetting('isStrategyToolEnabled')} variant="ghost" className="ml-2 p-0 h-auto w-auto bg-transparent hover:bg-transparent">
                                <div className={`w-2 h-2 rounded-full ${isStrategyActive ? 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_5px_rgba(245,158,11,0.5)] dark:shadow-[0_0_5px_rgba(251,191,36,0.8)]' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                            </Button>
                        </div>
                    </div>

                    {/* Active Memory Box / User Profile */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors w-full group ${isActiveMemoryEnabled ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-200' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                        <Button onClick={() => toggleSetting('isMemoryBoxEnabled')} variant="ghost" className="flex-grow text-left flex items-center p-0 h-auto w-auto bg-transparent hover:bg-transparent">
                            <span>User Profile</span>
                        </Button>
                        <div className="flex items-center">
                            <Button 
                                onClick={(e) => { e.stopPropagation(); openActiveMemoryModal(); close(); }} 
                                variant="ghost"
                                className={`p-1 ml-2 rounded hover:bg-gray-200 dark:hover:bg-white/10 h-auto w-auto ${isActiveMemoryEnabled ? 'text-cyan-600 dark:text-cyan-200' : 'text-gray-400 dark:text-gray-500'}`}
                                title="Configure User Profile"
                            >
                                <CogIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button onClick={() => toggleSetting('isMemoryBoxEnabled')} variant="ghost" className="ml-2 p-0 h-auto w-auto bg-transparent hover:bg-transparent">
                                <div className={`w-2 h-2 rounded-full ${isActiveMemoryEnabled ? 'bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.5)] dark:shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                            </Button>
                        </div>
                    </div>

                    {/* Agent (Reasoning) */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors w-full group ${isAgentActive ? 'bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-200' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                        <Button onClick={() => toggleSetting('enableReasoningWorkflow')} variant="ghost" className="flex-grow text-left flex items-center p-0 h-auto w-auto bg-transparent hover:bg-transparent">
                            <span>Agent</span>
                        </Button>
                        <div className="flex items-center">
                            <Button 
                                onClick={(e) => { e.stopPropagation(); openReasoningSetupModal(); close(); }} 
                                variant="ghost"
                                className={`p-1 ml-2 rounded hover:bg-gray-200 dark:hover:bg-white/10 h-auto w-auto ${isAgentActive ? 'text-fuchsia-600 dark:text-fuchsia-200' : 'text-gray-400 dark:text-gray-500'}`}
                                title="Configure Agent Reasoning"
                            >
                                <CogIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button onClick={() => toggleSetting('enableReasoningWorkflow')} variant="ghost" className="ml-2 p-0 h-auto w-auto bg-transparent hover:bg-transparent">
                                <div className={`w-2 h-2 rounded-full ${isAgentActive ? 'bg-fuchsia-500 dark:bg-fuchsia-400 shadow-[0_0_5px_rgba(217,70,239,0.5)] dark:shadow-[0_0_5px_rgba(232,121,249,0.8)]' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                            </Button>
                        </div>
                    </div>
                    
                    {/* Mem (RAG) */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors w-full group ${isExternalModeActive ? 'opacity-50 cursor-not-allowed' : isMemoryActive ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-200' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'}`} title={isExternalModeActive ? "Disabled in External Mode" : ""}>
                        <Button onClick={() => !isExternalModeActive && toggleSetting('enableLongTermMemory')} variant="ghost" className="flex-grow text-left flex items-center p-0 h-auto w-auto bg-transparent hover:bg-transparent" disabled={isExternalModeActive}>
                            <span>Mem (RAG)</span>
                        </Button>
                        <div className="flex items-center">
                            <Button 
                                onClick={(e) => { e.stopPropagation(); if(!isExternalModeActive) { openMemorySourceModal(); close(); } }} 
                                variant="ghost"
                                className={`p-1 ml-2 rounded hover:bg-gray-200 dark:hover:bg-white/10 h-auto w-auto ${isMemoryActive ? 'text-indigo-600 dark:text-indigo-200' : 'text-gray-400 dark:text-gray-500'}`}
                                title="Configure Long Term Memory"
                                disabled={isExternalModeActive}
                            >
                                <CogIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button onClick={() => !isExternalModeActive && toggleSetting('enableLongTermMemory')} variant="ghost" className="ml-2 p-0 h-auto w-auto bg-transparent hover:bg-transparent" disabled={isExternalModeActive}>
                                <div className={`w-2 h-2 rounded-full ${isMemoryActive ? 'bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_5px_rgba(99,102,241,0.5)] dark:shadow-[0_0_5px_rgba(129,140,248,0.8)]' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                            </Button>
                        </div>
                    </div>

                    {/* Shadow Mode */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors w-full group ${isShadowActive ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-200' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                        <Button onClick={() => toggleSetting('enableShadowMode')} variant="ghost" className="flex-grow text-left flex items-center p-0 h-auto w-auto bg-transparent hover:bg-transparent">
                            <span>Shadow</span>
                        </Button>
                        <div className="flex items-center">
                            <Button
                                onClick={(e) => { e.stopPropagation(); openShadowSetupModal(); close(); }}
                                variant="ghost"
                                className={`p-1 ml-2 rounded hover:bg-gray-200 dark:hover:bg-white/10 h-auto w-auto ${isShadowActive ? 'text-emerald-600 dark:text-emerald-200' : 'text-gray-400 dark:text-gray-500'}`}
                                title="Configure Shadow Mode"
                            >
                                <CogIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button onClick={() => toggleSetting('enableShadowMode')} variant="ghost" className="ml-2 p-0 h-auto w-auto bg-transparent hover:bg-transparent">
                                <div className={`w-2 h-2 rounded-full ${isShadowActive ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.5)] dark:shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </Dropdown>
    );
});

export default ChatToolsMenu;
