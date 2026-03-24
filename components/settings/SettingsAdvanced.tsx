
import React, { memo, useCallback } from 'react';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Select } from '../ui/Select.tsx';
import { Switch } from '../ui/Switch.tsx';
import { CalculatorIcon, SparklesIcon, Bars3Icon, EyeIcon, ExportBoxIcon, ArrowPathIcon, BugAntIcon, BookOpenIcon, PdfIcon, PlayIcon, FlowRightIcon, DocumentIcon, TextAaIcon, StopCircleIcon, BrainIcon, WrenchScrewdriverIcon, KeyIcon, ArchiveBoxIcon, ServerIcon } from '../common/Icons.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { GeminiSettings } from '../../types.ts';
import { DEFAULT_SETTINGS, DEFAULT_MODEL_ID, MODELS_SUPPORTING_THINKING_BUDGET_UI, MODELS_SUPPORTING_THINKING_LEVEL_UI, MODELS_SENDING_THINKING_CONFIG_API, THINKING_BUDGET_MAX_FLASH, THINKING_BUDGET_MAX, THINKING_BUDGET_MIN_PRO } from '../../constants.ts';
import ThinkingBudgetControl from '../common/ThinkingBudgetControl.tsx';
import SessionStats from './SessionStats.tsx'; 
import { useGlobalUiStore } from '../../store/useGlobalUiStore.ts';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { useInteractionStore } from '../../store/useInteractionStore.ts';

interface SettingsAdvancedProps {
  localSettings: GeminiSettings;
  localModel: string;
  sessionId: string;
  isCharacterModeActive: boolean;
  hasApiLogs: boolean;
  apiLogsCount: number;
  handleRangeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNumericInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleThinkingBudgetChange: (newValue: number | undefined) => void;
  handleThinkingLevelChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onOpenInstructionModal: (type: 'userPersonaInstruction') => void;
  onOpenDebugTerminal: () => void;
  onCustomizeExport: () => void;
  onExportTxt: () => void;
  onHardReload: () => void;
}

const SettingsAdvanced: React.FC<SettingsAdvancedProps> = memo(({
  localSettings,
  localModel,
  sessionId,
  isCharacterModeActive,
  hasApiLogs,
  apiLogsCount,
  handleRangeChange,
  handleNumericInputChange,
  handleInputChange,
  handleThinkingBudgetChange,
  handleThinkingLevelChange,
  onOpenInstructionModal,
  onOpenDebugTerminal,
  onCustomizeExport,
  onExportTxt,
  onHardReload
}) => {
  const { t } = useTranslation();
  const { chatFontSizeLevel, setChatFontSizeLevel } = useGlobalUiStore();
  const { openPromptButtonManager } = useSettingsUI();
  const { handleCompressChat } = useInteractionStore();
  
  const showThinkingBudgetControl = MODELS_SUPPORTING_THINKING_BUDGET_UI.includes(localModel);
  const thinkingBudgetActuallyUsedByApi = MODELS_SENDING_THINKING_CONFIG_API.includes(localModel);
  const showThinkingLevelControl = MODELS_SUPPORTING_THINKING_LEVEL_UI.includes(localModel);

  // --- Dynamic Thinking Budget Configuration ---
  const isFlashOrLite = localModel.includes('flash') || localModel.includes('lite');
  
  // PRO Configuration
  const proConfig = {
      min: THINKING_BUDGET_MIN_PRO, // 128
      max: THINKING_BUDGET_MAX,     // 32768
      presets: [
          { label: 'Dynamic', value: -1, icon: SparklesIcon, colorClass: 'bg-emerald-500 text-white' }
      ]
  };

  // FLASH Configuration
  const flashConfig = {
      min: 1,
      max: THINKING_BUDGET_MAX_FLASH, // 24576
      presets: [
          { label: 'Dynamic', value: -1, icon: SparklesIcon, colorClass: 'bg-emerald-500 text-white' },
          { label: 'Disabled', value: 0, icon: StopCircleIcon, colorClass: 'bg-red-600 text-white' }
      ]
  };

  const activeBudgetConfig = isFlashOrLite ? flashConfig : proConfig;
  // ----------------------------------------------

  const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setChatFontSizeLevel(parseInt(e.target.value, 10));
  }, [setChatFontSizeLevel]);

  const handleSeedClear = useCallback(() => {
      handleNumericInputChange({ target: { name: 'seed', value: '' } } as any);
  }, [handleNumericInputChange]);

  return (
    <div className="space-y-6">
      
      <div className="relative p-4 rounded-e-xl rounded-s-md border border-gray-200 dark:border-white/10 border-s-4 border-s-teal-500 bg-gradient-to-r from-teal-50 dark:from-teal-500/5 to-transparent">
        <h3 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-4 flex items-center">
          <CalculatorIcon className="w-4 h-4 me-2" />
          Model Parameters
        </h3>
        
        <div className="space-y-4 ps-1">
          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor="temperature" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.temperature}</label>
              <span className="text-xs text-teal-400 font-mono">{localSettings.temperature?.toFixed(2) ?? DEFAULT_SETTINGS.temperature?.toFixed(2)}</span>
            </div>
            <input
              type="range"
              id="temperature"
              name="temperature"
              min="0"
              max="2"
              step="0.01"
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              value={localSettings.temperature ?? DEFAULT_SETTINGS.temperature}
              onChange={handleRangeChange}
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor="topP" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.topP}</label>
              <span className="text-xs text-teal-400 font-mono">{localSettings.topP?.toFixed(2) ?? DEFAULT_SETTINGS.topP?.toFixed(2)}</span>
            </div>
            <input
              type="range"
              id="topP"
              name="topP"
              min="0"
              max="1"
              step="0.01"
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              value={localSettings.topP ?? DEFAULT_SETTINGS.topP}
              onChange={handleRangeChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="topK" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">{t.topK}</label>
              <Input
                type="number"
                id="topK"
                name="topK"
                min="1"
                placeholder={`${DEFAULT_SETTINGS.topK}`}
                value={localSettings.topK ?? ''}
                onChange={handleNumericInputChange}
              />
            </div>
            <div>
               <Button
                type="button"
                onClick={() => onOpenInstructionModal('userPersonaInstruction')}
                variant="outline"
                className="w-full h-full flex flex-col items-center justify-center p-2 bg-teal-500/5 rounded border border-dashed border-teal-500/30 hover:border-teal-500/60 transition-colors"
               >
                 <span className="text-xs text-teal-200 font-medium">User Persona</span>
                 <span className="text-[10px] text-teal-400/60">Edit Instruction</span>
               </Button>
            </div>
          </div>

          {/* Seed Input */}
          <div>
              <label htmlFor="seed" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 flex items-center justify-between">
                  <span>{t.seed}</span>
                  <Button onClick={handleSeedClear} variant="ghost" size="sm" className="text-[10px] text-teal-400 hover:text-white underline p-0 h-auto w-auto">{t.random}</Button>
              </label>
              <div className="relative">
                  <Input
                    type="number"
                    id="seed"
                    name="seed"
                    className="font-mono"
                    placeholder="Random (Empty)"
                    value={localSettings.seed ?? ''}
                    onChange={handleNumericInputChange}
                  />
                  <div className="absolute inset-y-0 right-0 pe-3 flex items-center pointer-events-none">
                      <KeyIcon className="h-4 w-4 text-teal-500/50" />
                  </div>
              </div>
          </div>
        </div>
      </div>

      {(showThinkingBudgetControl || showThinkingLevelControl) && (
        <div className="relative p-4 rounded-e-xl rounded-s-md border border-white/10 border-s-4 border-s-fuchsia-500 bg-gradient-to-r from-fuchsia-500/5 to-transparent">
          <h3 className="text-sm font-bold text-fuchsia-400 uppercase tracking-wider mb-4 flex items-center">
            <SparklesIcon className="w-4 h-4 me-2" />
            Thinking Config
          </h3>
          
          <div className="space-y-4 ps-1">
            <div>
                <div className="flex items-center mb-1">
                <Switch
                    id="showThinkingProcess"
                    name="showThinkingProcess"
                    checked={localSettings.showThinkingProcess ?? false}
                    onChange={handleInputChange}
                />
                <label htmlFor="showThinkingProcess" className="ms-2 text-sm text-zinc-900 dark:text-zinc-100">
                    {t.showThinkingProcess}
                </label>
                </div>
            </div>

            {showThinkingBudgetControl && (
                <ThinkingBudgetControl
                    value={localSettings.thinkingBudget}
                    onChange={handleThinkingBudgetChange}
                    modelActuallyUsesApi={thinkingBudgetActuallyUsedByApi}
                    min={activeBudgetConfig.min}
                    max={activeBudgetConfig.max}
                    presets={activeBudgetConfig.presets}
                />
            )}

            {showThinkingLevelControl && (
                <div>
                <label htmlFor="thinkingLevel" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">{t.thinkingLevel}</label>
                <Select
                    id="thinkingLevel"
                    name="thinkingLevel"
                    value={localSettings.thinkingLevel || 'high'}
                    onChange={handleThinkingLevelChange}
                >
                    {(localModel === 'gemini-3-flash-preview' || localModel === 'gemini-3.1-flash-lite-preview') && <option value="minimal">{t.thinkingLevelMinimal}</option>}
                    <option value="low">{t.thinkingLevelLow}</option>
                    {(localModel === 'gemini-3-flash-preview' || localModel === 'gemini-3.1-flash-lite-preview') && <option value="medium">{t.thinkingLevelMedium}</option>}
                    <option value="high">{t.thinkingLevelHigh}</option>
                </Select>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Thought Parsing Card - Indigo/Blue-Grey */}
      <div className="relative p-4 rounded-e-xl rounded-s-md border border-white/10 border-s-4 border-s-indigo-400 bg-gradient-to-r from-indigo-500/5 to-transparent">
        <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-4 flex items-center">
          <BrainIcon className="w-4 h-4 me-2" />
          Thought Parsing
        </h3>
        
        <div className="ps-1 space-y-4">
            <div className="flex items-center justify-between">
                <label htmlFor="enableCustomThoughtParsing" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer">
                  Enhance Thought Parsing
                </label>
                <Switch
                  id="enableCustomThoughtParsing"
                  name="enableCustomThoughtParsing"
                  checked={localSettings.enableCustomThoughtParsing ?? false}
                  onChange={handleInputChange}
                />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Extracts thoughts hidden within custom XML tags (e.g., &lt;thought&gt;) and moves them to the thought block.
            </p>

            {(localSettings.enableCustomThoughtParsing ?? false) && (
                <div className="mt-2 animate-fade-in">
                    <label htmlFor="customThoughtTagName" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Custom XML Tag Name
                    </label>
                    <div className="flex items-center">
                        <span className="text-zinc-600 dark:text-zinc-400 text-sm me-1">&lt;</span>
                        <Input
                            type="text"
                            id="customThoughtTagName"
                            name="customThoughtTagName"
                            className="font-mono"
                            placeholder="thought"
                            value={localSettings.customThoughtTagName || ''}
                            onChange={handleInputChange}
                        />
                        <span className="text-zinc-600 dark:text-zinc-400 text-sm ms-1">&gt;</span>
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="relative p-4 rounded-e-xl rounded-s-md border border-white/10 border-s-4 border-s-rose-500 bg-gradient-to-r from-rose-500/5 to-transparent">
        <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4 flex items-center">
          <Bars3Icon className="w-4 h-4 me-2" />
          Session Limits
        </h3>
        <div className="grid grid-cols-1 gap-4 ps-1">
            <div>
                <label htmlFor="contextWindowMessages" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">{t.contextWindow}</label>
                <Input
                type="number"
                id="contextWindowMessages"
                name="contextWindowMessages"
                min="0"
                placeholder="All (0)"
                value={localSettings.contextWindowMessages ?? ''}
                onChange={handleNumericInputChange}
                />
            </div>
        </div>
      </div>

      <div className="relative p-4 rounded-e-xl rounded-s-md border border-white/10 border-s-4 border-s-sky-500 bg-gradient-to-r from-sky-500/5 to-transparent">
        <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-4 flex items-center">
          <EyeIcon className="w-4 h-4 me-2" />
          Interface & Dev
        </h3>
        
        <div className="space-y-4 ps-1">
            {/* Font Size Control */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
                        <TextAaIcon className="w-3.5 h-3.5 me-2 text-sky-500" /> Interface Text Size
                    </label>
                    <span className="text-xs text-sky-400 font-mono">Level {chatFontSizeLevel}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    value={chatFontSizeLevel}
                    onChange={handleFontSizeChange}
                />
                <div className="flex justify-between text-[10px] text-zinc-600 dark:text-zinc-400 mt-1 px-1">
                    <span>Small</span>
                    <span>Standard</span>
                    <span>Huge</span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-sky-500/20">
                <label htmlFor="showAutoSendControls" className="text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
                    <PlayIcon className="w-3.5 h-3.5 me-2 text-sky-500" /> {t.showAutoSend}
                </label>
                <Switch
                    id="showAutoSendControls"
                    name="showAutoSendControls"
                    checked={localSettings.showAutoSendControls ?? false}
                    onChange={handleInputChange}
                />
            </div>
            
            {/* Prompt Buttons Bar Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <label htmlFor="showPromptButtonsBar" className="text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
                        <WrenchScrewdriverIcon className="w-3.5 h-3.5 me-2 text-sky-500" /> Quick Action Bar
                    </label>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 ms-5">Shows the macro buttons above chat input.</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={openPromptButtonManager}
                        variant="secondary"
                        size="sm"
                        className="text-[10px] bg-sky-500/10 text-sky-300 px-2 py-1 rounded border border-sky-500/20 hover:bg-sky-500/20 h-auto w-auto"
                    >
                        Manage
                    </Button>
                    <Switch
                        id="showPromptButtonsBar"
                        name="showPromptButtonsBar"
                        checked={localSettings.showPromptButtonsBar ?? true}
                        onChange={handleInputChange}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <label htmlFor="showReadModeButton" className="text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
                    <BookOpenIcon className="w-3.5 h-3.5 me-2 text-sky-500" /> {t.showReadMode}
                </label>
                <Switch
                    id="showReadModeButton"
                    name="showReadModeButton"
                    checked={localSettings.showReadModeButton ?? false}
                    onChange={handleInputChange}
                />
            </div>
            <div className="flex items-center justify-between">
                <label htmlFor="showExportPdfButton" className="text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
                    <PdfIcon className="w-3.5 h-3.5 me-2 text-sky-500" /> {t.showExportPdf}
                </label>
                <Switch
                    id="showExportPdfButton"
                    name="showExportPdfButton"
                    checked={localSettings.showExportPdfButton ?? false}
                    onChange={handleInputChange}
                />
            </div>
            <div className="flex items-center justify-between">
                <label htmlFor="showContinueFlowButton" className="text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
                    <FlowRightIcon className="w-3.5 h-3.5 me-2 text-sky-500" /> {t.showContinueFlow}
                </label>
                <Switch
                    id="showContinueFlowButton"
                    name="showContinueFlowButton"
                    checked={localSettings.showContinueFlowButton ?? false}
                    onChange={handleInputChange}
                />
            </div>
            <div className="flex items-center justify-between">
                <label htmlFor="showAdvancedDataTools" className="text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
                    <ExportBoxIcon className="w-3.5 h-3.5 me-2 text-sky-500" /> {t.showAdvancedDataTools}
                </label>
                <Switch
                    id="showAdvancedDataTools"
                    name="showAdvancedDataTools"
                    checked={localSettings.showAdvancedDataTools ?? false}
                    onChange={handleInputChange}
                />
            </div>
            {/* Interactive Choices Toggle */}
            <div className="flex items-center justify-between">
                <label htmlFor="enableInteractiveChoices" className="text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
                    <DocumentIcon className="w-3.5 h-3.5 me-2 text-sky-500" /> {t.enableInteractiveChoices}
                </label>
                <Switch
                    id="enableInteractiveChoices"
                    name="enableInteractiveChoices"
                    checked={localSettings.enableInteractiveChoices ?? false}
                    onChange={handleInputChange}
                />
            </div>
            
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                    <label htmlFor="debugApiRequests" className="text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
                        <BugAntIcon className="w-3.5 h-3.5 me-2 text-orange-400" /> {t.enableApiLogger}
                    </label>
                    <Switch
                        id="debugApiRequests"
                        name="debugApiRequests"
                        checked={localSettings.debugApiRequests ?? false}
                        onChange={handleInputChange}
                    />
                </div>
                {localSettings.debugApiRequests && (
                    <Button
                        onClick={onOpenDebugTerminal}
                        variant="secondary"
                        className="mt-2 w-full text-xs text-orange-300 bg-orange-900/20 py-1.5 rounded hover:bg-orange-900/30 transition-colors"
                    >
                        {hasApiLogs ? t.viewApiLogs : t.viewApiLogsNone} ({apiLogsCount})
                    </Button>
                )}
            </div>
            
            <div className="pt-2 text-center">
                <p className="text-[10px] text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">{t.sessionStats}</p>
                <SessionStats />
            </div>
        </div>
      </div>

      <div className="relative p-4 rounded-e-xl rounded-s-md border border-white/10 border-s-4 border-s-amber-500 bg-gradient-to-r from-amber-500/5 to-transparent">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center">
          <ExportBoxIcon className="w-4 h-4 me-2" />
          Data & Cache
        </h3>
        
        <div className="grid grid-cols-2 gap-2 mb-3 ps-1">
            <Button
                variant="secondary"
                onClick={onCustomizeExport}
                className="text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20"
            >
                {t.exportJson}
            </Button>
            <Button
                variant="secondary"
                onClick={onExportTxt}
                className="text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20"
            >
                {t.exportTxt}
            </Button>
        </div>

        <Button
            variant="secondary"
            onClick={handleCompressChat}
            className="w-full text-xs text-green-300 bg-green-500/10 hover:bg-green-500/20 border-green-500/20 mb-2"
            icon={<ArchiveBoxIcon className="w-3.5 h-3.5" />}
        >
            {t.compressChat}
        </Button>

        <Button
            variant="secondary"
            onClick={() => useSettingsUI.getState().openCacheManagerModal()}
            className="w-full text-xs text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 mb-2"
            icon={<ServerIcon className="w-3.5 h-3.5" />}
        >
            Manage Context Cache
        </Button>

        <Button
            variant="danger"
            onClick={onHardReload}
            className="w-full text-xs text-red-300 bg-red-500/10 hover:bg-red-500/20 border-red-500/20"
            icon={<ArrowPathIcon className="w-3.5 h-3.5" />}
        >
            {t.hardReload}
        </Button>
      </div>

    </div>
  );
});

export default SettingsAdvanced;
