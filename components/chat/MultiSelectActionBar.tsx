
import React, { memo, useCallback } from 'react';
import { useSelectionStore } from '../../store/useSelectionStore.ts';
import { useAudioStore } from '../../store/useAudioStore.ts';
import { useGlobalUiStore } from '../../store/useGlobalUiStore.ts';
import { TrashIcon, AudioResetIcon, XCircleIcon, ArrowDownTrayIcon, PdfIcon, ArrowRightStartOnRectangleIcon } from '../common/Icons.tsx';
import { useInteractionStore } from '../../store/useInteractionStore.ts';
import { useMessageStore } from '../../store/useMessageStore.ts';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { useSettingsUI } from '../../store/ui/useSettingsUI.ts';
import { Button } from '../ui/Button.tsx';

const MultiSelectActionBar: React.FC = memo(() => {
  const { visibleMessages } = useMessageStore();
  const { deleteMultipleMessages, handleExportBatchPdf } = useInteractionStore();
  const { handleResetAudioCacheForMultipleMessages, handleBatchDownloadAudios } = useAudioStore();
  const { isSidebarOpen } = useGlobalUiStore();
  const { selectedMessageIds, clearSelection, toggleSelectionMode, selectAllVisible } = useSelectionStore();
  const { openMoveMessagesModal } = useSettingsUI();
  const { t } = useTranslation();

  const selectedCount = selectedMessageIds.length;
  const visibleMessageIds = visibleMessages.map(m => m.id);

  const handleDelete = useCallback(() => {
    if (selectedCount === 0) return;
    deleteMultipleMessages(selectedMessageIds);
  }, [selectedCount, deleteMultipleMessages, selectedMessageIds]);

  const handleResetAudio = useCallback(() => {
    if (selectedCount === 0) return;
    handleResetAudioCacheForMultipleMessages(selectedMessageIds);
  }, [selectedCount, handleResetAudioCacheForMultipleMessages, selectedMessageIds]);
  
  const handleDownload = useCallback(() => {
    if (selectedCount === 0) return;
    handleBatchDownloadAudios();
  }, [selectedCount, handleBatchDownloadAudios]);

  const handleExportPdf = useCallback(() => {
    if (selectedCount === 0) return;
    handleExportBatchPdf(selectedMessageIds);
  }, [selectedCount, handleExportBatchPdf, selectedMessageIds]);

  const handleMove = useCallback(() => {
    if (selectedCount === 0) return;
    openMoveMessagesModal();
  }, [selectedCount, openMoveMessagesModal]);

  const handleSelectAll = useCallback(() => {
    selectAllVisible(visibleMessageIds);
  }, [selectAllVisible, visibleMessageIds]);

  const handleDone = useCallback(() => {
    toggleSelectionMode();
  }, [toggleSelectionMode]);

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-gray-200 dark:border-white/10 p-2 sm:p-3 pb-[env(safe-area-inset-bottom,0.5rem)] z-50 transition duration-300 ease-in-out flex items-center flex-nowrap ${isSidebarOpen ? 'md:left-72' : ''}`}>
        {/* Child 1: Fixed Start */}
        <div className="flex-shrink-0 flex items-center gap-2 px-2 border-e border-gray-200 dark:border-white/10 me-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{selectedCount} {t.selected}</span>
        </div>

        {/* Child 2: Scrollable Center */}
        <div className="flex-1 min-w-0 overflow-x-auto pt-2 pb-1">
            <div className="w-max flex items-center gap-2 px-1">
                <Button onClick={handleSelectAll} variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 whitespace-nowrap" disabled={visibleMessageIds.length === 0}>{t.selectAllVisible}</Button>
                <Button onClick={clearSelection} variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 whitespace-nowrap" disabled={selectedCount === 0}>{t.deselectAll}</Button>
                
                <Button onClick={handleMove} disabled={selectedCount === 0} variant="secondary" size="sm" className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 border-none whitespace-nowrap" title="Copy to Chat">
                    <ArrowRightStartOnRectangleIcon className="w-4 h-4 mr-1 sm:mr-1.5" />
                    <span>Copy To</span>
                </Button>
                <Button onClick={handleExportPdf} disabled={selectedCount === 0} variant="secondary" size="sm" className="text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border-none whitespace-nowrap" title={t.exportToPdf}>
                    <PdfIcon className="w-4 h-4 mr-1 sm:mr-1.5 text-red-500" />
                    <span>PDF</span>
                </Button>
                <Button onClick={handleDownload} disabled={selectedCount === 0} variant="secondary" size="sm" className="text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 border-none whitespace-nowrap" title={t.downloadAudios}>
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1 sm:mr-1.5" />
                    <span>{t.downloadAudios}</span>
                </Button>
                <Button onClick={handleResetAudio} disabled={selectedCount === 0} variant="secondary" size="sm" className="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 border-none whitespace-nowrap" title={t.resetAudio}>
                    <AudioResetIcon className="w-4 h-4 mr-1 sm:mr-1.5" />
                    <span>{t.resetAudio}</span>
                </Button>
                <Button onClick={handleDelete} disabled={selectedCount === 0} variant="danger" size="sm" className="border-none whitespace-nowrap" title={t.delete}>
                    <TrashIcon className="w-4 h-4 mr-1 sm:mr-1.5" />
                    <span>{t.delete}</span>
                </Button>
            </div>
        </div>

        {/* Child 3: Fixed End */}
        <div className="flex-shrink-0 ps-2 ms-1">
             <Button onClick={handleDone} variant="secondary" size="sm" className="text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 border-none whitespace-nowrap" title={t.done}>
                <XCircleIcon className="w-4 h-4 mr-1 sm:mr-1.5" /> {t.done}
            </Button>
        </div>
    </div>
  );
});

export default MultiSelectActionBar;
