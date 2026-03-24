import React, { memo, useState, useCallback } from 'react';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Select } from '../ui/Select.tsx';
import { Switch } from '../ui/Switch.tsx';
import { KeyIcon, SparklesIcon, SpeakerWaveIcon, ShieldCheckIcon, PencilIcon, UserIcon, ServerIcon } from '../common/Icons.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { GeminiSettings } from '../../types.ts';
import { MODEL_DEFINITIONS } from '../../constants.ts';
import { useExternalModelsStore } from '../../store/useExternalModelsStore.ts';

interface SettingsGeneralProps {
  localModel: string;
  localSettings: GeminiSettings;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onOpenApiKeyModal: () => void;
  onOpenInstructionModal: (type: 'systemInstruction') => void;
  onOpenTtsModal: () => void;
  onOpenSafetyModal: () => void;
  onOpenExternalModelsModal: () => void;
}

const SettingsGeneral: React.FC<SettingsGeneralProps> = memo(({
  localModel,
  localSettings,
  handleInputChange,
  onOpenApiKeyModal,
  onOpenInstructionModal,
  onOpenTtsModal,
  onOpenSafetyModal,
  onOpenExternalModelsModal
}) => {
  const { t } = useTranslation();
  const { isExternalModeActive, toggleExternalMode } = useExternalModelsStore();
  const [isCustomModelMode, setIsCustomModelMode] = useState(
      !MODEL_DEFINITIONS.some(m => m.id === localModel) && localModel.trim() !== ''
  );

  const toggleCustomMode = useCallback(() => {
      setIsCustomModelMode(prev => !prev);
  }, []);

  return (
    <div className="space-y-4">
      
      {/* API Key Card - Yellow/Gold */}
      <div className="relative p-4 rounded-e-xl rounded-s-md border border-gray-200 dark:border-white/10 border-s-4 border-s-yellow-500 bg-gradient-to-r from-yellow-50 dark:from-yellow-500/5 to-transparent">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-500/10 me-3 text-yellow-600 dark:text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.1)]">
                <KeyIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200">{t.apiKeyManagement}</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{t.apiKeyDesc}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={onOpenApiKeyModal}
            className="px-3 py-1.5 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20 hover:bg-yellow-200 dark:hover:bg-yellow-500/20 hover:text-yellow-800 dark:hover:text-yellow-200"
          >
            {t.manage}
          </Button>
        </div>
      </div>

      {/* Model Selection Card - Electric Blue */}
      <div className="relative p-4 rounded-e-xl rounded-s-md border border-gray-200 dark:border-white/10 border-s-4 border-s-emerald-500 bg-gradient-to-r from-emerald-50 dark:from-emerald-500/5 to-transparent">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 me-3 text-emerald-600 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <SparklesIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200">{t.model}</h3>
            </div>
            <Button onClick={toggleCustomMode} variant="ghost" size="sm" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-white underline decoration-dashed p-0 h-auto w-auto">
                {isCustomModelMode ? t.resetDefaults : t.useCustomModel}
            </Button>
        </div>
        
        {isCustomModelMode ? (
            <div className="relative">
                <Input
                    type="text"
                    name="model"
                    value={localModel}
                    onChange={handleInputChange}
                    placeholder={t.enterCustomModel}
                    className="font-mono"
                />
            </div>
        ) : (
            <Select
            id="model"
            name="model"
            value={localModel}
            onChange={handleInputChange}
            >
            {MODEL_DEFINITIONS.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
            ))}
            </Select>
        )}
      </div>

      {/* External Providers Card - Cyan */}
      <div className="relative p-4 rounded-e-xl rounded-s-md border border-gray-200 dark:border-white/10 border-s-4 border-s-cyan-500 bg-gradient-to-r from-cyan-50 dark:from-cyan-500/5 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-500/10 me-3 text-cyan-600 dark:text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
              <ServerIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200">{t.externalProviders}</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{t.useOpenAiCompatibleApis}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={onOpenExternalModelsModal}
            className="px-3 py-1.5 text-xs text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20 hover:bg-cyan-200 dark:hover:bg-cyan-500/20 hover:text-cyan-800 dark:hover:text-cyan-200"
          >
            {t.manageModels}
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/5">
          <div className="flex-1 pe-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.enableExternalMode}</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              {t.externalModeDesc}
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <Switch
              checked={isExternalModeActive}
              onChange={() => toggleExternalMode()}
            />
          </label>
        </div>
      </div>

      {/* Persona / System Instruction Card - Purple */}
      <div className="relative p-4 rounded-e-xl rounded-s-md border border-gray-200 dark:border-white/10 border-s-4 border-s-purple-500 bg-gradient-to-r from-purple-50 dark:from-purple-500/5 to-transparent">
        <div className="flex items-center mb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/10 me-3 text-purple-600 dark:text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
            <UserIcon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200">{t.systemInstruction}</h3>
        </div>
        <Button
          type="button"
          onClick={() => onOpenInstructionModal('systemInstruction')}
          variant="outline"
          className="w-full p-3 bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-left flex justify-between items-start hover:bg-gray-50 dark:hover:bg-white/10 group h-auto"
        >
          <span className={`text-sm line-clamp-2 ${localSettings.systemInstruction ? 'text-gray-700 dark:text-gray-300' : 'text-zinc-600 dark:text-zinc-400 italic'}`}>
            {localSettings.systemInstruction || t.systemInstructionPlaceholder}
          </span>
          <PencilIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 mt-0.5 flex-shrink-0 ms-2" />
        </Button>
      </div>

      {/* Audio & Safety Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* TTS Settings - Emerald Green */}
        <div className="relative p-4 rounded-e-xl rounded-s-md border border-gray-200 dark:border-white/10 border-s-4 border-s-emerald-500 bg-gradient-to-r from-emerald-50 dark:from-emerald-500/5 to-transparent flex flex-col justify-between">
          <div>
            <div className="flex items-center mb-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 me-2 text-emerald-600 dark:text-emerald-400">
                    <SpeakerWaveIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200">{t.ttsSettings}</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 ms-1">{t.ttsDesc}</p>
          </div>
          <Button
            variant="secondary"
            onClick={onOpenTtsModal}
            className="w-full px-3 py-2 text-xs text-emerald-700 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/20"
          >
            {t.configure}
          </Button>
        </div>

        {/* Safety Settings - Red */}
        <div className="relative p-4 rounded-e-xl rounded-s-md border border-gray-200 dark:border-white/10 border-s-4 border-s-red-500 bg-gradient-to-r from-red-50 dark:from-red-500/5 to-transparent flex flex-col justify-between">
          <div>
            <div className="flex items-center mb-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/10 me-2 text-red-600 dark:text-red-400">
                    <ShieldCheckIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200">{t.safetySettings}</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 ms-1">{t.safetyDesc}</p>
          </div>
          <Button
            variant="danger"
            onClick={onOpenSafetyModal}
            className="w-full px-3 py-2 text-xs text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/20"
          >
            {t.configure}
          </Button>
        </div>
      </div>

    </div>
  );
});

export default SettingsGeneral;