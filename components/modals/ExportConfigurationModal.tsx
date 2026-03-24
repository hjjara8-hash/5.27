import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Switch } from '../ui/Switch.tsx';
import { ExportConfiguration } from '../../types.ts';
import { useChatListStore } from '../../store/useChatListStore.ts';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts'; 
import { DEFAULT_EXPORT_CONFIGURATION } from '../../constants.ts';
import { CloseIcon, CheckIcon, ArrowPathIcon, UsersIcon, DocumentDuplicateIcon, KeyIcon, ExportBoxIcon, ServerIcon, CogIcon, BrainIcon } from '../common/Icons.tsx';
import { useExportStore } from '../../store/useExportStore.ts';
import { useToastStore } from '../../store/useToastStore.ts';
import { useTranslation } from '../../hooks/useTranslation.ts';

const ToggleOption: React.FC<{
  id: keyof ExportConfiguration;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (id: keyof ExportConfiguration, checked: boolean) => void;
  indented?: boolean;
  warning?: string;
  disabled?: boolean;
  accentColorClass?: string;
}> = memo(({ id, label, description, checked, onChange, indented, warning, disabled, accentColorClass = "text-emerald-500" }) => (
  <div className={`py-2 ${indented ? 'ltr:pl-6 rtl:pr-6 border-l border-gray-200 dark:border-white/5 ml-1' : ''} ${disabled ? 'opacity-50' : ''}`}>
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <Switch
          id={id}
          name={id}
          className={`focus:ring-2 h-4 w-4 border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-black/30 disabled:cursor-not-allowed ${accentColorClass.replace('text-', 'text-').replace('focus:ring-', 'focus:ring-')}`} 
          checked={checked}
          onChange={(e) => !disabled && onChange(id, e.target.checked)}
          disabled={disabled}
        />
      </div>
      <div className="ltr:ml-3 rtl:mr-3 text-sm">
        <label htmlFor={id} className={`font-medium cursor-pointer ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-200'}`}>{label}</label>
        {description && <p className={`text-xs ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'} mt-0.5`}>{description}</p>}
        {warning && <p className="text-xs text-amber-600 dark:text-yellow-400 mt-0.5 bg-amber-50 dark:bg-yellow-900/20 p-1 rounded inline-block">{warning}</p>}
      </div>
    </div>
  </div>
));

const ExportConfigurationModal: React.FC = memo(() => {
  const { chatHistory, loadAllChatsForModals } = useChatListStore();
  const { currentExportConfig, setCurrentExportConfig, handleExportChats, handleExportTrainingData, isExporting, exportProgress } = useExportStore();
  const { isExportConfigModalOpen, closeExportConfigurationModal } = useSettingsUI();
  const showToast = useToastStore(state => state.showToast);
  const { t } = useTranslation();

  const [localConfig, setLocalConfig] = useState<ExportConfiguration>(currentExportConfig);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);
  const [isPreparingData, setIsPreparingData] = useState(false);

  useEffect(() => {
    if (isExportConfigModalOpen) {
      const initData = async () => {
        setIsPreparingData(true);
        await loadAllChatsForModals();
        setIsPreparingData(false);
        
        // After loading, initialize selection
        const history = useChatListStore.getState().chatHistory;
        setSelectedChatIds(
          history.length > 0 
            ? history.filter(s => s.title !== 'New Chat').map(s => s.id) 
            : []
        );
      };

      setAreButtonsDisabled(true);
      const timerId = setTimeout(() => {
        setAreButtonsDisabled(false);
      }, 500);

      setLocalConfig(currentExportConfig);
      initData();
      setSearchTerm('');
      return () => clearTimeout(timerId);
    }
  }, [isExportConfigModalOpen, currentExportConfig, loadAllChatsForModals]);

  const filteredSessions = useMemo(() => {
    if (!searchTerm.trim()) return chatHistory;
    return chatHistory.filter(session =>
      session.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chatHistory, searchTerm]);

  const handleToggleChange = useCallback((id: keyof ExportConfiguration, checked: boolean) => {
    setLocalConfig(prev => ({ ...prev, [id]: checked }));
  }, []);

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

  const handleSaveCurrentConfig = useCallback(() => {
    setCurrentExportConfig(localConfig);
    showToast("Export preferences saved!", "success");
  }, [localConfig, setCurrentExportConfig, showToast]);
  
  const handleInitiateExport = useCallback(() => {
    if (selectedChatIds.length === 0) {
      alert("Please select at least one chat to export.");
      return;
    }
    handleExportChats(selectedChatIds, localConfig);
  }, [selectedChatIds, localConfig, handleExportChats]);

  const handleInitiateTrainingExport = useCallback(() => {
    if (selectedChatIds.length === 0) {
        alert("Please select at least one chat to export.");
        return;
    }
    handleExportTrainingData(selectedChatIds);
  }, [selectedChatIds, handleExportTrainingData]);

  const handleResetConfigDefaults = useCallback(() => {
    setLocalConfig(DEFAULT_EXPORT_CONFIGURATION);
  }, []);

  if (!isExportConfigModalOpen) return null;

  const isCoreDataDisabled = !localConfig.includeChatSessionsAndMessages;
  const exportButtonText = isExporting ? `${t.loading} (${exportProgress}%)` : `${t.exportSelected} (${selectedChatIds.length})`;

  return (
    <div 
        className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-2 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-config-modal-title"
        onClick={closeExportConfigurationModal}
    >
      <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-lg shadow-2xl w-full sm:max-w-3xl max-h-[95vh] grid grid-rows-[auto_1fr_auto] text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 id="export-config-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <ExportBoxIcon className="w-6 h-6 mr-3 text-emerald-500" />
            {t.exportTitle}
          </h2>
          <Button
            variant="ghost"
            onClick={closeExportConfigurationModal}
            disabled={areButtonsDisabled}
            className="p-1.5 rounded-full"
            aria-label={t.close}
          >
            <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>

        <fieldset disabled={areButtonsDisabled} className="overflow-y-auto pr-1 sm:pr-2 space-y-4 min-h-0 custom-scrollbar">
          {/* Chat Selection Card - Emerald */}
          <div className="relative p-4 rounded-r-xl rounded-l-md border border-gray-200 dark:border-white/10 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 dark:from-emerald-500/5 to-transparent">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center">
                    <DocumentDuplicateIcon className="w-4 h-4 mr-2" /> {t.selectChatsToExport}
                </h4>
                <div className="space-x-2">
                    <Button variant="ghost" size="sm" onClick={handleSelectAllChats} className="text-[10px] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-200 dark:hover:bg-emerald-500/20 disabled:opacity-50" disabled={filteredSessions.length === 0}>{t.selectAll}</Button>
                    <Button variant="ghost" size="sm" onClick={handleDeselectAllChats} className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-50" disabled={selectedChatIds.length === 0}>{t.deselectAll}</Button>
                </div>
            </div>
            
            {isPreparingData ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">Loading full history...</p>
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
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-md p-1 space-y-1 bg-gray-50 dark:bg-black/20 custom-scrollbar">
                  {filteredSessions.map(session => (
                    <div key={session.id} className={`flex items-center p-1.5 rounded-md cursor-pointer transition-colors ${selectedChatIds.includes(session.id) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`} onClick={() => handleChatSelectionChange(session.id)}>
                      <Switch
                        checked={selectedChatIds.includes(session.id)}
                        readOnly
                        className="h-4 w-4 text-emerald-500 bg-white dark:bg-black/30 border-gray-300 dark:border-white/20 rounded focus:ring-emerald-500 focus:ring-offset-white dark:focus:ring-offset-black"
                      />
                      <label className="ltr:ml-2 rtl:mr-2 text-sm text-gray-700 dark:text-gray-300 truncate cursor-pointer flex items-center flex-grow">
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

          {/* Config Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Core Data Card - Emerald */}
              <div className="relative p-4 rounded-r-xl rounded-l-md border border-gray-200 dark:border-white/10 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 dark:from-emerald-500/5 to-transparent">
                <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center">
                    <ServerIcon className="w-4 h-4 mr-2" /> {t.dataInclusionPref}
                </h4>
                <div className="space-y-1">
                    <ToggleOption id="includeChatSessionsAndMessages" label={t.exp_chatSessions} description={t.exp_chatSessionsDesc} checked={localConfig.includeChatSessionsAndMessages} onChange={handleToggleChange} accentColorClass="text-emerald-500 focus:ring-emerald-500" />
                    <ToggleOption id="includeMessageContent" label={t.exp_msgContent} checked={localConfig.includeMessageContent} onChange={handleToggleChange} indented disabled={isCoreDataDisabled} accentColorClass="text-emerald-500 focus:ring-emerald-500" />
                    <ToggleOption id="includeMessageAttachmentsMetadata" label={t.exp_attMeta} description={t.exp_attMetaDesc} checked={localConfig.includeMessageAttachmentsMetadata} onChange={handleToggleChange} indented disabled={isCoreDataDisabled} accentColorClass="text-emerald-500 focus:ring-emerald-500" />
                    <ToggleOption id="includeFullAttachmentFileData" label={t.exp_fullFiles} checked={localConfig.includeFullAttachmentFileData} onChange={handleToggleChange} indented disabled={isCoreDataDisabled || !localConfig.includeMessageAttachmentsMetadata} accentColorClass="text-emerald-500 focus:ring-emerald-500" />
                    <ToggleOption id="includeCachedMessageAudio" label={t.exp_audio} checked={localConfig.includeCachedMessageAudio} onChange={handleToggleChange} indented disabled={isCoreDataDisabled} accentColorClass="text-emerald-500 focus:ring-emerald-500" />
                    <ToggleOption id="includeThoughts" label={t.exp_thoughts} checked={localConfig.includeThoughts ?? true} onChange={handleToggleChange} indented disabled={isCoreDataDisabled} accentColorClass="text-emerald-500 focus:ring-emerald-500" />
                </div>
              </div>

              {/* Settings & Tech Card - Purple/Red */}
              <div className="space-y-4">
                  <div className="relative p-4 rounded-r-xl rounded-l-md border border-gray-200 dark:border-white/10 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 dark:from-purple-500/5 to-transparent">
                    <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center">
                        <CogIcon className="w-4 h-4 mr-2" /> Settings & Chars
                    </h4>
                    <div className="space-y-1">
                        <ToggleOption id="includeChatSpecificSettings" label={t.exp_chatSettings} checked={localConfig.includeChatSpecificSettings} onChange={handleToggleChange} disabled={isCoreDataDisabled} accentColorClass="text-purple-500 focus:ring-purple-500" />
                        <ToggleOption id="includeAiCharacterDefinitions" label={t.exp_aiChars} checked={localConfig.includeAiCharacterDefinitions} onChange={handleToggleChange} disabled={isCoreDataDisabled} accentColorClass="text-purple-500 focus:ring-purple-500" />
                        <ToggleOption id="includeUserDefinedGlobalDefaults" label={t.exp_userDefaults} checked={localConfig.includeUserDefinedGlobalDefaults} onChange={handleToggleChange} accentColorClass="text-purple-500 focus:ring-purple-500" />
                    </div>
                  </div>

                  <div className="relative p-4 rounded-r-xl rounded-l-md border border-gray-200 dark:border-white/10 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 dark:from-red-500/5 to-transparent">
                    <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center">
                        <KeyIcon className="w-4 h-4 mr-2" /> Tech & Creds
                    </h4>
                    <div className="space-y-1">
                        <ToggleOption id="includeApiLogs" label={t.exp_apiLogs} warning={t.exp_apiLogsWarn} checked={localConfig.includeApiLogs} onChange={handleToggleChange} disabled={isCoreDataDisabled} accentColorClass="text-red-500 focus:ring-red-500" />
                        <ToggleOption id="includeApiKeys" label={t.exp_apiKeys} warning={t.exp_apiKeysWarn} checked={localConfig.includeApiKeys} onChange={handleToggleChange} accentColorClass="text-red-500 focus:ring-red-500" />
                        <ToggleOption id="includeExternalModels" label={t.externalModels || "External Models"} description="Include external model configurations" checked={localConfig.includeExternalModels ?? false} onChange={handleToggleChange} accentColorClass="text-red-500 focus:ring-red-500" />
                    </div>
                  </div>
                  
                  {/* New: Portable Python Env */}
                  <div className="relative p-4 rounded-r-xl rounded-l-md border border-gray-200 dark:border-white/10 border-l-4 border-l-cyan-500 bg-gradient-to-r from-cyan-50 dark:from-cyan-500/5 to-transparent">
                    <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center">
                        <ArrowPathIcon className="w-4 h-4 mr-2" /> Portable Environment
                    </h4>
                    <div className="space-y-1">
                        <ToggleOption 
                            id="includeOfflinePythonEnv" 
                            label="Include Offline Python Environment" 
                            warning="Increases file size (+20MB~)" 
                            description="Includes Pyodide binaries and installed packages for fully offline execution on another device."
                            checked={localConfig.includeOfflinePythonEnv ?? false} 
                            onChange={handleToggleChange} 
                            accentColorClass="text-cyan-500 focus:ring-cyan-500" 
                        />
                    </div>
                  </div>
              </div>
          </div>
        </fieldset>

        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-200 dark:border-white/10 space-y-3 sm:space-y-0">
          <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="ghost" size="sm" onClick={handleResetConfigDefaults} disabled={areButtonsDisabled} type="button" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 sm:w-auto w-full"><ArrowPathIcon className="w-3.5 h-3.5 ltr:mr-1.5 rtl:ml-1.5" /> {t.resetDefaults}</Button>
             <Button variant="ghost" size="sm" onClick={handleInitiateTrainingExport} disabled={areButtonsDisabled || selectedChatIds.length === 0} type="button" className="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 hover:text-purple-700 dark:hover:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-500/20 sm:w-auto w-full"><BrainIcon className="w-3.5 h-3.5 ltr:mr-1.5 rtl:ml-1.5" /> {t.exportTrainingData}</Button>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 sm:rtl:space-x-reverse w-full sm:w-auto">
            <Button variant="secondary" onClick={closeExportConfigurationModal} disabled={areButtonsDisabled || isPreparingData} type="button" className="w-full sm:w-auto">{t.cancel}</Button>
            <Button variant="primary" onClick={handleSaveCurrentConfig} disabled={areButtonsDisabled || isPreparingData} type="button" className="w-full sm:w-auto"><CheckIcon className="w-4 h-4 ltr:mr-1.5 rtl:ml-1.5" /> {t.save}</Button>
            <Button variant="primary" onClick={handleInitiateExport} type="button" disabled={areButtonsDisabled || selectedChatIds.length === 0 || isExporting || isPreparingData} className="bg-amber-600 hover:bg-amber-500 hover:shadow-amber-500/20 w-full sm:w-auto"><ExportBoxIcon className="w-4 h-4 ltr:mr-1.5 rtl:ml-1.5" /> {exportButtonText}</Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ExportConfigurationModal;