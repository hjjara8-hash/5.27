
import React, { memo } from 'react';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Textarea } from '../ui/Textarea.tsx';
import { Select } from '../ui/Select.tsx';
import { Switch } from '../ui/Switch.tsx';
import { MagnifyingGlassIcon, GitHubIcon, FolderOpenIcon, TrashIcon, PencilIcon, SparklesIcon, CogIcon, ArrowPathIcon, BrainIcon, WrenchScrewdriverIcon, ClockIcon, CheckIcon, StopCircleIcon, CloudArrowUpIcon, ServerIcon, XCircleIcon, ArchiveBoxIcon, PlusIcon } from '../common/Icons.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { ChatSession, GeminiSettings } from '../../types.ts';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { useDataStore } from '../../store/useDataStore.ts';
import { usePythonStore } from '../../store/usePythonStore.ts';
import { useArchiverStore } from '../../store/useArchiverStore.ts'; // ADDED
import { useExternalModelsStore } from '../../store/useExternalModelsStore.ts';
import { MODEL_DEFINITIONS } from '../../constants.ts';

interface SettingsToolsContextProps {
  sessionId: string;
  githubRepoContext: ChatSession['githubRepoContext'];
  localSettings: GeminiSettings;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleNumericInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  onOpenGitHubImport: () => void;
  onRemoveGithubRepo: () => void;
  onViewAttachments: () => void;
  onOpenInstructionModal: (type: 'customReminderMessage' | 'enhancedThinkingJudgeInstruction' | 'autoRefineCriticInstruction') => void;
}

const SettingsToolsContext: React.FC<SettingsToolsContextProps> = memo(({
  sessionId,
  githubRepoContext,
  localSettings,
  handleInputChange,
  handleNumericInputChange,
  onOpenGitHubImport,
  onRemoveGithubRepo,
  onViewAttachments,
  onOpenInstructionModal
}) => {
  const { t } = useTranslation();
  const { openMemorySourceModal, openReasoningSetupModal, openShadowSetupModal, openArchiverModal } = useSettingsUI();
  const { cleanSystemReminders } = useDataStore();
  const { isEnabled, isLoaded, isLoading, enableAndLoad, toggleEnabled } = usePythonStore();
  const { generateIncrementalChapter, isProcessing } = useArchiverStore(); // ADDED
  const { isExternalModeActive } = useExternalModelsStore();

  const handleCleanContext = () => {
    if (sessionId) {
      cleanSystemReminders(sessionId);
    }
  };

  const handleManualArchiveTrigger = async () => {
      // Force archive with 0 threshold (immediate)
      await generateIncrementalChapter(true);
  };

  const pythonMode = localSettings.pythonExecutionMode || 'cloud';

  return (
    <div className="space-y-4">
      
      {/* Capabilities Card - Cyan */}
      <div className="relative p-4 rounded-e-xl rounded-s-md border border-gray-200 dark:border-white/10 border-s-4 border-s-cyan-500 bg-gradient-to-r from-cyan-50 dark:from-cyan-500/5 to-transparent">
        <h3 className="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-4 flex items-center">
          <SparklesIcon className="w-4 h-4 me-2" />
          Active Capabilities
        </h3>
        
        {/* Google Search */}
        <div className="flex items-start justify-between mb-4 ps-1 gap-2">
          <div className="flex items-center min-w-0 flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 me-3 text-cyan-600 dark:text-cyan-300 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <label htmlFor="useGoogleSearch" className="block text-sm font-medium text-gray-900 dark:text-gray-200 cursor-pointer truncate">
                {t.useGoogleSearch}
              </label>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{t.useGoogleSearchDesc}</p>
            </div>
          </div>
          <div className="flex items-center flex-shrink-0">
            <Switch
              id="useGoogleSearch"
              name="useGoogleSearch"
              checked={localSettings.useGoogleSearch ?? false}
              onChange={handleInputChange}
              disabled={isExternalModeActive}
            />
          </div>
        </div>
        {isExternalModeActive && (
          <div className="text-[10px] text-red-400 ms-9 mb-4">
            {t.externalModeWarning}
          </div>
        )}

        {/* Python Interpreter (Hybrid) */}
        <div className="flex flex-col ps-1 border-t border-cyan-200 dark:border-cyan-500/20 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 ps-1">
            <div className="flex items-center min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center me-3 text-cyan-600 dark:text-cyan-300 font-mono text-xs font-bold border border-cyan-200 dark:border-cyan-500/30 flex-shrink-0">
                Py
                </div>
                <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 truncate">Python Interpreter</label>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">Choose execution environment.</p>
                </div>
            </div>
            
            {/* Mode Switcher */}
            <div className={`flex bg-gray-100 dark:bg-black/40 rounded-xl p-1 border border-gray-200 dark:border-white/5 w-full sm:w-auto justify-between ${isExternalModeActive ? 'opacity-50 pointer-events-none' : ''}`}>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleInputChange({ target: { name: 'pythonExecutionMode', value: 'cloud' } } as any)}
                    className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition h-auto w-auto flex-1 sm:flex-none ${pythonMode === 'cloud' ? 'bg-cyan-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                >
                    <CloudArrowUpIcon className="w-3 h-3 inline me-1" /> Cloud
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleInputChange({ target: { name: 'pythonExecutionMode', value: 'local' } } as any)}
                    className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition h-auto w-auto flex-1 sm:flex-none ${pythonMode === 'local' ? 'bg-cyan-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                >
                    <ServerIcon className="w-3 h-3 inline me-1" /> Local
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleInputChange({ target: { name: 'pythonExecutionMode', value: 'disabled' } } as any)}
                    className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition h-auto w-auto flex-1 sm:flex-none ${pythonMode === 'disabled' ? 'bg-gray-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                >
                    <StopCircleIcon className="w-3 h-3 inline me-1" /> Off
                </Button>
            </div>
          </div>

          {pythonMode === 'cloud' ? (
              <div className="ms-2 sm:ms-11 mb-2">
                  <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-500/20">
                      <CheckIcon className="w-3 h-3 inline me-1" />
                      Uses Google's secure cloud environment. No download required. Fast & Reliable.
                  </p>
              </div>
          ) : pythonMode === 'local' ? (
              <div className="ms-2 sm:ms-11 mb-2 flex flex-col gap-3">
                 <p className="text-xs text-zinc-600 dark:text-zinc-400">Runs in-browser (Pyodide). Requires ~10MB download.</p>
                 <div className="flex items-center">
                    {isLoading ? (
                        <div className="px-3 py-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20 rounded border border-cyan-200 dark:border-cyan-500/20 flex items-center w-full sm:w-auto justify-center">
                            <ArrowPathIcon className="w-3 h-3 me-2 animate-spin" />
                            Loading...
                        </div>
                    ) : isLoaded ? (
                        <Button 
                            onClick={toggleEnabled}
                            variant="outline"
                            className={`flex items-center px-3 py-1.5 text-xs font-bold rounded border transition group h-auto w-full sm:w-auto justify-center ${
                                isEnabled 
                                ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20 hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30' 
                                : 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-200 dark:border-yellow-500/20 hover:bg-green-100 dark:hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 hover:border-green-200 dark:border-green-500/30'
                            }`}
                            title={isEnabled ? "Click to Disable" : "Click to Reactivate (Ready)"}
                        >
                            {isEnabled ? (
                                <>
                                    <span className="group-hover:hidden flex items-center"><CheckIcon className="w-3.5 h-3.5 me-1.5" /> Active</span>
                                    <span className="hidden group-hover:flex items-center"><XCircleIcon className="w-3.5 h-3.5 me-1.5" /> Disable</span>
                                </>
                            ) : (
                                <>
                                    <StopCircleIcon className="w-3.5 h-3.5 me-1.5" />
                                    Disabled
                                </>
                            )}
                        </Button>
                    ) : isEnabled ? (
                        <Button 
                            onClick={toggleEnabled}
                            variant="outline"
                            className="flex items-center px-3 py-1.5 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/20 rounded hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:border-green-500/20 transition group h-auto w-full sm:w-auto justify-center"
                            title="Click to Disable"
                        >
                            <span className="group-hover:hidden">Enabled (Lazy)</span>
                            <span className="hidden group-hover:inline">Disable</span>
                        </Button>
                    ) : (
                        <Button 
                            onClick={enableAndLoad}
                            className="flex items-center px-3 py-1.5 text-xs font-bold text-white bg-cyan-600/80 rounded hover:bg-cyan-500 disabled:opacity-50 transition-colors shadow-lg shadow-cyan-900/20 h-auto w-full sm:w-auto justify-center"
                        >
                            Enable Local
                        </Button>
                    )}
                 </div>
              </div>
          ) : (
              <div className="ms-2 sm:ms-11 mb-2">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 italic bg-gray-100 dark:bg-white/5 p-2 rounded border border-gray-200 dark:border-white/5">
                      Python execution is disabled. The model will not be able to execute code.
                  </p>
              </div>
          )}
          {isExternalModeActive && (
              <div className="text-[10px] text-red-400 ms-2 sm:ms-11 mb-2">
                  {t.externalModeWarning}
              </div>
          )}
        </div>
        
        {/* Include History Checkbox */}
        {pythonMode !== 'disabled' && (
            <div className="ms-2 sm:ms-11 mt-4 sm:mt-[-4px] mb-4">
                <div className="flex items-center">
                    <Switch
                        id="includePythonHistory"
                        name="includePythonHistory"
                        checked={localSettings.includePythonHistory ?? false}
                        onChange={handleInputChange}
                        disabled={pythonMode === 'local' && !isEnabled} 
                    />
                    <label htmlFor="includePythonHistory" className={`ms-2 block text-xs font-medium cursor-pointer ${(pythonMode === 'cloud' || isEnabled) ? 'text-gray-700 dark:text-gray-300' : 'text-zinc-500 dark:text-zinc-500'}`}>
                        Include Execution History in Context
                    </label>
                </div>
                <p className={`text-[10px] ps-7 sm:ps-0 sm:ms-5 mt-0.5 ${(pythonMode === 'cloud' || isEnabled) ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-500 dark:text-zinc-500'}`}>
                    Sends past code and results back to the model. Allows "memory" of variables.
                </p>
            </div>
        )}

        {/* Smart Time Bridge */}
        <div className="flex flex-col ps-1 border-t border-cyan-200 dark:border-cyan-500/20 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ClockIcon className="w-5 h-5 me-3 text-cyan-600 dark:text-cyan-300" />
              <div>
                <label htmlFor="enableTimeBridge" className="block text-sm font-medium text-gray-900 dark:text-gray-200 cursor-pointer">
                  Smart Time Bridge
                </label>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Injects context updates after long pauses.</p>
              </div>
            </div>
            <Switch
              id="enableTimeBridge"
              name="enableTimeBridge"
              checked={localSettings.enableTimeBridge ?? true}
              onChange={handleInputChange}
            />
          </div>
          
          {(localSettings.enableTimeBridge ?? true) && (
             <div className="ms-2 sm:ms-8 mt-3 flex flex-wrap items-center gap-2 animate-fade-in">
                 <label htmlFor="timeBridgeThreshold" className="text-xs text-zinc-600 dark:text-zinc-400">Injection Threshold (Minutes):</label>
                 <Input
                    type="number"
                    id="timeBridgeThreshold"
                    name="timeBridgeThreshold"
                    min="1"
                    max="1440"
                    className="w-20 sm:w-24 text-center"
                    value={localSettings.timeBridgeThreshold ?? 15}
                    onChange={handleNumericInputChange}
                 />
             </div>
          )}
        </div>
      </div>

      {/* Memory & Reasoning Card - Indigo/Fuchsia */}
      <div className="relative p-4 rounded-e-xl rounded-s-md border border-gray-200 dark:border-white/10 border-s-4 border-s-indigo-500 bg-gradient-to-r from-indigo-50 dark:from-indigo-500/5 to-transparent">
        <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center">
          <BrainIcon className="w-4 h-4 me-2" />
          Advanced Logic
        </h3>
        
        {/* Force Tool Execution (ANY Mode) */}
        <div className="flex items-start justify-between ps-1 mb-4 border-b border-indigo-200 dark:border-indigo-500/10 pb-4">
            <div className="flex-grow">
                <div className="flex items-center mb-1">
                    <Switch
                        id="forceToolAlways"
                        name="forceToolAlways"
                        checked={localSettings.forceToolAlways ?? false}
                        onChange={handleInputChange}
                    />
                    <label htmlFor="forceToolAlways" className="ms-2 block text-sm text-rose-700 dark:text-rose-200 font-medium cursor-pointer">
                        Force Tool Execution (ANY Mode)
                    </label>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 ms-6">
                    Strictly forces the model to call a tool (like Memory Search) before generating any text response.
                </p>
            </div>
            <div className="flex-shrink-0 ms-2">
                <WrenchScrewdriverIcon className="w-4 h-4 text-rose-500 dark:text-rose-400 opacity-70" />
            </div>
        </div>

        {/* Enhanced Thinking (Best-of-3) */}
        <div className="flex flex-col ps-1 mb-4 border-b border-indigo-200 dark:border-indigo-500/10 pb-4">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="enhancedThinkingMode" className="block text-sm text-indigo-700 dark:text-indigo-200 font-medium">
                {t.enhancedThinkingMode}
            </label>
            <Select
                id="enhancedThinkingMode"
                name="enhancedThinkingMode"
                value={localSettings.enhancedThinkingMode || 'off'}
                onChange={handleInputChange}
            >
                <option value="off">{t.etModeOff}</option>
                <option value="judge">{t.etModeJudge}</option>
                <option value="fusion">{t.etModeFusion}</option>
                <option value="auto_refine">{t.etModeAutoRefine}</option>
            </Select>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 mb-2">
            {t.etModeDesc}
          </p>
          
          {/* Custom Judge Instruction */}
          {(localSettings.enhancedThinkingMode === 'judge' || localSettings.enhancedThinkingMode === 'fusion') && (
             <div className="ms-6 mt-3 animate-fade-in">
                 <div className="flex justify-between items-center mb-1">
                     <label className="block text-xs font-medium text-indigo-600 dark:text-indigo-300 flex items-center">
                         <BrainIcon className="w-3 h-3 me-1.5" />
                         {t.judgeCustomInstruction}
                     </label>
                     <Button 
                         onClick={() => onOpenInstructionModal('enhancedThinkingJudgeInstruction')} 
                         variant="ghost"
                         size="sm"
                         className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 flex items-center transition-colors p-0 h-auto w-auto"
                     >
                         <PencilIcon className="w-3 h-3 me-1" />
                         {t.customize}
                     </Button>
                 </div>
                 <div 
                     className="w-full p-2 bg-gray-100 dark:bg-black/20 border border-indigo-200 dark:border-indigo-500/20 rounded-md text-[10px] text-zinc-600 dark:text-zinc-400 truncate cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors"
                     onClick={() => onOpenInstructionModal('enhancedThinkingJudgeInstruction')}
                 >
                     {localSettings.enhancedThinkingJudgeInstruction || t.judgeCustomInstructionPlaceholder}
                 </div>
             </div>
          )}

          {/* Auto-Refine Controls */}
          {localSettings.enhancedThinkingMode === 'auto_refine' && (
            <div className="ms-6 mt-3 animate-fade-in space-y-3">
              {/* Max Iterations */}
              <div className="flex items-center justify-between">
                <label htmlFor="autoRefineMaxIterations" className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                  {t.autoRefineMaxIterations}
                </label>
                <Input
                  type="number"
                  id="autoRefineMaxIterations"
                  name="autoRefineMaxIterations"
                  min="1"
                  max="10"
                  className="w-20 text-center text-xs h-8"
                  value={localSettings.autoRefineMaxIterations ?? 3}
                  onChange={handleNumericInputChange}
                />
              </div>

              {/* Critic Instruction */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-indigo-600 dark:text-indigo-300 flex items-center">
                    <BrainIcon className="w-3 h-3 me-1.5" />
                    {t.autoRefineCriticInstruction}
                  </label>
                  <Button 
                    onClick={() => onOpenInstructionModal('autoRefineCriticInstruction')} 
                    variant="ghost"
                    size="sm"
                    className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 flex items-center transition-colors p-0 h-auto w-auto"
                  >
                    <PencilIcon className="w-3 h-3 me-1" />
                    {t.customize}
                  </Button>
                </div>
                <div 
                  className="w-full p-2 bg-gray-100 dark:bg-black/20 border border-indigo-200 dark:border-indigo-500/20 rounded-md text-[10px] text-zinc-600 dark:text-zinc-400 truncate cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors"
                  onClick={() => onOpenInstructionModal('autoRefineCriticInstruction')}
                >
                  {localSettings.autoRefineCriticInstruction || t.autoRefineCriticPlaceholder}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reasoning Workflow */}
        <div className="flex items-start justify-between ps-1 mb-4 border-b border-indigo-200 dark:border-indigo-500/10 pb-4">
          <div className="flex-grow">
            <div className="flex items-center mb-1">
              <Switch
                id="enableReasoningWorkflow"
                name="enableReasoningWorkflow"
                checked={localSettings.enableReasoningWorkflow ?? false}
                onChange={handleInputChange}
              />
              <label htmlFor="enableReasoningWorkflow" className="ms-2 block text-sm text-fuchsia-700 dark:text-fuchsia-200 font-medium cursor-pointer">
                Agentic Multi-Step Workflow
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 ms-6">
              Enable complex sequential reasoning steps before final answer.
            </p>
            {localSettings.enableReasoningWorkflow && (
              <>
                <p className="text-[10px] text-fuchsia-600 dark:text-fuchsia-400 ms-6 mt-1">
                  Steps: {localSettings.reasoningSteps?.length || 0} configured
                </p>
                <div className="ms-6 mt-2">
                    <label htmlFor="agentModel" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Agent Model (Reasoning Engine)</label>
                    <Select
                        id="agentModel"
                        name="agentModel"
                        value={localSettings.agentModel || ''}
                        onChange={handleInputChange}
                    >
                        <option value="">Use Chat Model (Default)</option>
                        {MODEL_DEFINITIONS.map(model => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                    </Select>
                </div>
                <div className="ms-6 mt-2">
                    <label htmlFor="contextUserName" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">{t.contextUserName}</label>
                    <Input
                        type="text"
                        id="contextUserName"
                        name="contextUserName"
                        value={localSettings.contextUserName || ''}
                        onChange={handleInputChange}
                        placeholder={t.contextUserNamePlaceholder}
                    />
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1">{t.contextUserNameDesc}</p>
                </div>
              </>
            )}
          </div>
          {localSettings.enableReasoningWorkflow && (
            <Button
              onClick={openReasoningSetupModal}
              variant="outline"
              className="flex items-center px-2 py-1.5 text-xs font-medium text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-100 dark:bg-fuchsia-500/10 rounded-md hover:bg-fuchsia-200 dark:hover:bg-fuchsia-500/20 transition-colors border border-fuchsia-200 dark:border-fuchsia-500/20 ms-2 flex-shrink-0 h-auto w-auto"
            >
              <CogIcon className="w-3 h-3 me-1.5" />
              {t.customize}
            </Button>
          )}
        </div>

        {/* Shadow Mode Feature */}
        <div className="flex items-start justify-between ps-1 mb-4 border-b border-indigo-200 dark:border-indigo-500/10 pb-4">
          <div className="flex-grow">
            <div className="flex items-center mb-1">
              <Switch
                id="enableShadowMode"
                name="enableShadowMode"
                checked={localSettings.enableShadowMode ?? false}
                onChange={handleInputChange}
              />
              <label htmlFor="enableShadowMode" className="ms-2 block text-sm text-emerald-700 dark:text-emerald-200 font-medium cursor-pointer">
                Shadow Mode (Direct Generation)
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 ms-6">
              Bypasses standard generation. Directly generates response using a custom Persona and Task instruction based on history.
            </p>
          </div>
          {localSettings.enableShadowMode && (
            <Button
                onClick={openShadowSetupModal}
                variant="outline"
                className="flex items-center px-2 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-200 dark:border-emerald-500/20 ms-2 flex-shrink-0 h-auto w-auto"
            >
                <CogIcon className="w-3 h-3 me-1.5" />
                {t.customize}
            </Button>
          )}
        </div>

        {/* Long Term Memory */}
        <div className="flex items-start justify-between ps-1 mb-4 border-b border-indigo-200 dark:border-indigo-500/10 pb-4">
          <div className="flex-grow">
            <div className="flex items-center mb-1">
              <Switch
                id="enableLongTermMemory"
                name="enableLongTermMemory"
                checked={localSettings.enableLongTermMemory ?? false}
                onChange={handleInputChange}
                disabled={isExternalModeActive}
              />
              <label htmlFor="enableLongTermMemory" className="ms-2 block text-sm text-gray-900 dark:text-gray-200 font-medium cursor-pointer">
                Agentic Memory (RAG)
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 ms-6">
              Allows Gemini to search past conversations for context.
            </p>
            {isExternalModeActive && (
              <p className="text-[10px] text-red-400 ms-6 mt-1">
                {t.externalModeWarning}
              </p>
            )}
            {localSettings.enableLongTermMemory && !isExternalModeActive && (
              <p className="text-[10px] text-indigo-600 dark:text-indigo-300 ms-6 mt-1">
                Scope: {localSettings.memorySourceChatIds ? `${localSettings.memorySourceChatIds.length} chats selected` : "All chats"}
              </p>
            )}
          </div>
          {localSettings.enableLongTermMemory && !isExternalModeActive && (
            <Button
              onClick={openMemorySourceModal}
              variant="outline"
              className="flex items-center px-2 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/10 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-indigo-500/20 ms-2 flex-shrink-0 h-auto w-auto"
            >
              <CogIcon className="w-3 h-3 me-1.5" />
              {t.customize}
            </Button>
          )}
        </div>

        {/* Novel Archiver */}
        <div className="flex flex-col ps-1 mb-2">
          <div className="flex items-start justify-between">
            <div className="flex-grow">
                <div className="flex items-center mb-1">
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 me-2">
                    <ArchiveBoxIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm text-indigo-700 dark:text-indigo-200 font-medium">
                    Novel Archiver
                </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 ms-7">
                Convert chat history into a structured narrative with chapters and key quotes.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    onClick={openArchiverModal}
                    variant="outline"
                    className="flex items-center px-2 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/10 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-indigo-500/20 h-auto w-auto"
                >
                    <WrenchScrewdriverIcon className="w-3 h-3 me-1.5" />
                    Launch
                </Button>
            </div>
          </div>
          
          {/* Auto Archiving Checkbox */}
          <div className="ms-7 mt-2 flex items-center gap-2">
             <Switch
                id="autoArchivingEnabled"
                name="autoArchivingEnabled"
                checked={localSettings.autoArchivingEnabled ?? false}
                onChange={handleInputChange}
             />
             <label htmlFor="autoArchivingEnabled" className="text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                Auto-archive (Every 40 messages)
             </label>
             {(localSettings.autoArchivingEnabled ?? false) && (
                 <Button 
                    onClick={handleManualArchiveTrigger}
                    disabled={isProcessing}
                    variant="outline"
                    className="ms-auto text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors flex items-center h-auto w-auto"
                    title="Force create next chapter immediately"
                 >
                    {isProcessing ? <ArrowPathIcon className="w-3 h-3 animate-spin"/> : <PlusIcon className="w-3 h-3 me-1"/>}
                    Add Chapter
                 </Button>
             )}
          </div>
        </div>

      </div>

      {/* External Sources Card - Slate/Gray */}
      <div className="relative p-4 rounded-e-xl rounded-s-md border border-gray-200 dark:border-white/10 border-s-4 border-s-slate-500 bg-gradient-to-r from-slate-50 dark:from-slate-500/5 to-transparent">
        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center">
          <GitHubIcon className="w-4 h-4 me-2" />
          External Sources
        </h3>

        {/* GitHub Repo */}
        <div className="mb-4 ps-1">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200">{t.githubRepo}</label>
            {!githubRepoContext && (
              <Button
                onClick={onOpenGitHubImport}
                variant="outline"
                className="text-xs text-slate-600 dark:text-slate-400 flex items-center hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700/30 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 h-auto w-auto"
              >
                <PencilIcon className="w-3 h-3 me-1" /> {t.importRepo}
              </Button>
            )}
          </div>
          {githubRepoContext ? (
            <div className="p-2 bg-gray-100 dark:bg-black/20 rounded-md flex items-center justify-between border border-gray-200 dark:border-white/10">
              <p className="text-xs text-gray-700 dark:text-gray-300 truncate font-mono" title={githubRepoContext.url}>
                {githubRepoContext.url}
              </p>
              <Button onClick={onRemoveGithubRepo} variant="ghost" size="none" className="p-1 text-red-500 hover:text-red-600 dark:hover:text-red-400 ms-2 h-auto w-auto" title="Remove" icon={<TrashIcon className="w-4 h-4" />} />
            </div>
          ) : (
            <div className="p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-center">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{t.githubRepoHint}</p>
            </div>
          )}
        </div>

        {/* URL Context */}
        <div className="ps-1">
          <label htmlFor="urlContext" className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">{t.urlContext}</label>
          <Textarea
            id="urlContext"
            name="urlContext"
            rows={3}
            placeholder="https://example.com/page1&#10;https://example.com/page2"
            value={(localSettings.urlContext || []).join('\n')}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Files Card - Orange */}
      <div className={`relative p-4 rounded-e-xl rounded-s-md border border-gray-200 dark:border-white/10 border-s-4 border-s-orange-500 bg-gradient-to-r from-orange-50 dark:from-orange-500/5 to-transparent flex items-center justify-between ${isExternalModeActive ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/10 me-3 text-orange-600 dark:text-orange-400">
            <FolderOpenIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t.chatAttachments}</h3>
            {isExternalModeActive && <p className="text-[10px] text-red-400 mt-0.5">{t.externalModeWarning}</p>}
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={onViewAttachments}
          disabled={isExternalModeActive}
          className="px-3 py-1.5 text-xs text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 hover:bg-orange-200 dark:hover:bg-orange-500/20"
        >
          {t.view}
        </Button>
      </div>

      {/* Periodic Reminder Card - Pink */}
      <div className="relative p-4 rounded-e-xl rounded-s-md border border-gray-200 dark:border-white/10 border-s-4 border-s-pink-500 bg-gradient-to-r from-pink-50 dark:from-pink-500/5 to-transparent">
        <h3 className="text-sm font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-4 flex items-center">
            <ArrowPathIcon className="w-4 h-4 me-2" />
            Reinforcement (System Reminder)
        </h3>
        
        <div className="flex items-center space-x-3 mb-3 ps-1">
            <div className="flex-grow">
                <label htmlFor="systemReminderFrequency" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">{t.systemReminderFrequency}</label>
                <Input
                    type="number"
                    id="systemReminderFrequency"
                    name="systemReminderFrequency"
                    min="0"
                    step="1"
                    placeholder="0 (Disabled)"
                    value={localSettings.systemReminderFrequency ?? ''}
                    onChange={handleNumericInputChange}
                />
            </div>
             <div className="flex-shrink-0 self-end">
                 <Button
                    type="button"
                    onClick={handleCleanContext}
                    disabled={!sessionId}
                    variant="outline"
                    size="none"
                    className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 hover:text-pink-800 dark:hover:text-white rounded-md transition-colors hover:bg-pink-200 dark:hover:bg-pink-900/50 flex items-center border border-pink-200 dark:border-pink-500/30 h-auto w-auto"
                    title={t.cleanContextDesc}
                    icon={<TrashIcon className="w-4 h-4" />}
                />
            </div>
        </div>
        
        <div className="ps-1">
            <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.systemReminderContent}</label>
                <Button 
                    onClick={() => onOpenInstructionModal('customReminderMessage')} 
                    variant="ghost"
                    size="sm"
                    className="text-[10px] text-pink-500 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-200 flex items-center transition-colors p-0 h-auto w-auto"
                >
                    <PencilIcon className="w-3 h-3 me-1" />
                    {t.customize}
                </Button>
            </div>
            <div 
                className="w-full p-2 bg-gray-100 dark:bg-black/20 border border-pink-200 dark:border-pink-500/20 rounded-md text-[10px] text-zinc-600 dark:text-zinc-400 truncate cursor-pointer hover:border-pink-400 dark:hover:border-pink-500/50 transition-colors"
                onClick={() => onOpenInstructionModal('customReminderMessage')}
            >
                {localSettings.customReminderMessage || t.defaultReminderMessage}
            </div>
        </div>
      </div>

    </div>
  );
});

export default SettingsToolsContext;
