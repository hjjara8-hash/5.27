
import React, { memo } from 'react';
import { usePromptButtonStore } from '../../../store/usePromptButtonStore.ts';
import { useSettingsUI } from '../../../store/ui/useSettingsUI.ts';
import { CogIcon, SendIcon, PlusIcon, PencilIcon, UsersIcon } from '../../common/Icons.tsx';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '../../ui/Button.tsx';
import { useTranslation } from '../../../hooks/useTranslation.ts';

interface PromptButtonsBarProps {
    onInsert: (text: string) => void;
    onSend: (text: string) => void;
    onSwitchToolbar?: () => void;
    showSwitchButton?: boolean;
}

const PromptButtonsBar: React.FC<PromptButtonsBarProps> = memo(({ 
    onInsert, 
    onSend,
    onSwitchToolbar,
    showSwitchButton
}) => {
    const { t } = useTranslation();
    const { promptButtons } = usePromptButtonStore(useShallow(state => ({
        promptButtons: state.promptButtons
    })));
    const { openPromptButtonManager } = useSettingsUI();

    return (
        <div className="flex flex-nowrap items-center px-3 py-2 bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-white/5 gap-1 rounded-t-2xl">
            {/* Fixed Start */}
            {showSwitchButton && onSwitchToolbar && (
                <Button
                    onClick={onSwitchToolbar}
                    variant="ghost"
                    size="none"
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex-shrink-0 me-2"
                    title={t.characters}
                >
                    <UsersIcon className="w-4 h-4" />
                </Button>
            )}

            {/* Scrollable Center */}
            <div className="flex-1 min-w-0 overflow-x-auto pb-1">
                <div className="w-max flex items-center gap-2 px-1">
                    {promptButtons.length === 0 && (
                        <Button 
                            onClick={openPromptButtonManager}
                            variant="ghost"
                            className="text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 flex items-center px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
                        >
                            <PlusIcon className="w-3 h-3 mr-1" />
                            Add Quick Action
                        </Button>
                    )}
                    
                    {promptButtons.map(btn => (
                        <Button
                            key={btn.id}
                            onClick={() => btn.action === 'send' ? onSend(btn.content) : onInsert(btn.content)}
                            variant="outline"
                            className={`
                                flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap shadow-sm border
                                ${btn.action === 'send' 
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/40' 
                                    : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:border-indigo-300 dark:hover:border-indigo-500/40'
                                }
                            `}
                            title={btn.content}
                        >
                            {btn.action === 'send' ? <SendIcon className="w-3 h-3 mr-1.5 opacity-70" /> : <PencilIcon className="w-3 h-3 mr-1.5 opacity-70" />}
                            {btn.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Fixed End */}
            <Button 
                onClick={openPromptButtonManager}
                variant="ghost"
                size="none"
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex-shrink-0 ms-2"
                title="Manage Prompt Buttons"
            >
                <CogIcon className="w-3.5 h-3.5" />
            </Button>
        </div>
    );
});

export default PromptButtonsBar;
