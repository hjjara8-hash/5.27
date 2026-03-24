
import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useEditorUI } from '../../store/ui/useEditorUI.ts';
import { ChatMessageRole, Attachment } from '../../types.ts';
import { CloseIcon, SparklesIcon, UserIcon, SaveDiskIcon, XCircleIcon, SubmitPlayIcon, ContinueArrowIcon, PaperClipIcon, DocumentIcon } from '../common/Icons.tsx';
import useAutoResizeTextarea from '../../hooks/useAutoResizeTextarea.ts';
import { useGeminiApiStore } from '../../store/useGeminiApiStore.ts'; 
import { useFileHandler } from '../../hooks/useFileHandler.ts';
import { useTranslation } from '../../hooks/useTranslation.ts';
import AttachmentZone from '../chat/input/AttachmentZone.tsx';
import { Button } from '../ui/Button.tsx';
import { Textarea } from '../ui/Textarea.tsx';

export enum EditMessagePanelAction {
  CANCEL = 'cancel',
  SAVE_LOCALLY = 'save_locally',
  SAVE_AND_SUBMIT = 'save_and_submit',
  CONTINUE_PREFIX = 'continue_prefix',
}

export interface EditMessagePanelDetails {
  sessionId: string;
  messageId: string;
  originalContent: string;
  role: ChatMessageRole;
  attachments?: Attachment[];
}

const EditMessagePanel: React.FC = memo(() => {
  const { handleEditPanelSubmit } = useGeminiApiStore.getState();
  const isLoading = useGeminiApiStore(s => s.isLoading);
  const { isEditPanelOpen, editingMessageDetail, closeEditPanel } = useEditorUI();
  const { t } = useTranslation();

  const [editedContent, setEditedContent] = useState('');
  // Use hook for NEW attachments
  const { 
      files: newAttachments, 
      handleFileSelection, 
      handlePaste,
      removeFile: removeNewAttachment, 
      resetFiles,
      isAnyFileStillProcessing
  } = useFileHandler();

  // Local state for KEPT attachments (from original message)
  const [keptAttachments, setKeptAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const textareaRef = useAutoResizeTextarea<HTMLTextAreaElement>(editedContent, 300);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);

  const isUserMessage = editingMessageDetail?.role === ChatMessageRole.USER;

  useEffect(() => {
    if (isEditPanelOpen) {
      setAreButtonsDisabled(true); 
      const timerId = setTimeout(() => {
        setAreButtonsDisabled(false);
      }, 500); 

      if (editingMessageDetail) {
        setEditedContent(editingMessageDetail.originalContent);
        resetFiles(); // Clear any previous new files
        setKeptAttachments(editingMessageDetail.attachments || []);
      }
      return () => clearTimeout(timerId); 
    }
  }, [isEditPanelOpen, editingMessageDetail, resetFiles]);

  useEffect(() => {
    if (isEditPanelOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditPanelOpen, textareaRef]);

  const handleAction = useCallback((action: EditMessagePanelAction) => {
    if (!editingMessageDetail) return;
    closeEditPanel();
    handleEditPanelSubmit(action, editedContent, editingMessageDetail as any, newAttachments, keptAttachments);
  }, [editingMessageDetail, handleEditPanelSubmit, editedContent, newAttachments, keptAttachments, closeEditPanel]);
  
  const handleCancelClick = useCallback(() => {
    closeEditPanel();
  }, [closeEditPanel]);

  const removeKeptAttachment = useCallback((id: string) => {
      setKeptAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  // Drag & Drop Handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isUserMessage) return;
      if (!isDragging) setIsDragging(true);
  }, [isDragging, isUserMessage]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (!isUserMessage) return;
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileSelection(e.dataTransfer.files);
      }
  }, [handleFileSelection, isUserMessage]);

  const onPasteHandler = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (isUserMessage) handlePaste(e);
  }, [handlePaste, isUserMessage]);

  if (!isEditPanelOpen || !editingMessageDetail) return null;
  
  const panelTitle = editingMessageDetail.role === ChatMessageRole.USER ? t.editUserMessage : t.editAiResponse;
  const IconComponent = editingMessageDetail.role === ChatMessageRole.USER ? UserIcon : SparklesIcon;

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-message-panel-title" onClick={handleCancelClick}>
      <div 
        className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-5 sm:p-6 rounded-xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col text-gray-900 dark:text-gray-100 relative overflow-hidden transition animate-modal-open ${isDragging ? 'ring-2 ring-emerald-500 bg-gray-50 dark:bg-black/40' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 pointer-events-none">
                <div className="text-gray-900 dark:text-white font-bold text-lg flex items-center animate-bounce">
                    <DocumentIcon className="w-8 h-8 mr-3 text-emerald-500" />
                    <span>Drop files to attach</span>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-gray-500 dark:text-gray-400" />
            <h2 id="edit-message-panel-title" className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{panelTitle}</h2>
          </div>
          <Button variant="ghost" onClick={handleCancelClick} disabled={areButtonsDisabled} className="p-1 rounded-full" aria-label={t.close}>
            <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>
        <Textarea ref={textareaRef} value={editedContent} onChange={(e) => setEditedContent(e.target.value)} onPaste={onPasteHandler} className="w-full flex-grow resize-none hide-scrollbar text-sm sm:text-base leading-relaxed" placeholder={t.enterMessageContent} style={{ minHeight: '200px' }} aria-label="Message content editor" />
        
        {/* Render Kept Attachments (Using reused AttachmentZone) */}
        {keptAttachments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Existing Attachments</p>
                <AttachmentZone files={keptAttachments} onRemove={removeKeptAttachment} />
            </div>
        )}

        {isUserMessage && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
              <div className="flex justify-between items-center mb-2">
                 <p className="text-xs text-gray-500 dark:text-gray-400">{t.addNewAttachments}</p>
                 <input type="file" multiple ref={fileInputRef} onChange={(e) => handleFileSelection(e.target.files)} className="hidden" />
                 <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={areButtonsDisabled || isAnyFileStillProcessing} className="px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30" icon={<PaperClipIcon className="w-3.5 h-3.5" />}>
                    {t.addFiles}
                 </Button>
              </div>
              
              {/* Render New Attachments using the unified component */}
              <AttachmentZone files={newAttachments} onRemove={removeNewAttachment} />
          </div>
        )}

        <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="secondary" onClick={handleCancelClick} disabled={areButtonsDisabled} aria-label={t.cancel} icon={<XCircleIcon className="w-4 h-4" />}>{t.cancel}</Button>
          <Button variant="primary" onClick={() => handleAction(EditMessagePanelAction.SAVE_LOCALLY)} className="bg-emerald-600 hover:bg-emerald-700" disabled={areButtonsDisabled || isLoading || isAnyFileStillProcessing || (editedContent.trim() === editingMessageDetail.originalContent.trim() && newAttachments.length === 0 && keptAttachments.length === (editingMessageDetail.attachments?.length || 0))} aria-label={t.saveLocally} icon={<SaveDiskIcon className="w-4 h-4" />}>{t.saveLocally}</Button>
          <Button variant="primary" onClick={() => handleAction(EditMessagePanelAction.CONTINUE_PREFIX)} className="bg-teal-500 hover:bg-teal-600" disabled={areButtonsDisabled || isLoading || isAnyFileStillProcessing || editedContent.trim() === ''} aria-label={t.continuePrefix} icon={<ContinueArrowIcon className="w-4 h-4" />}>{t.continuePrefix}</Button>
          <Button variant="primary" onClick={() => handleAction(EditMessagePanelAction.SAVE_AND_SUBMIT)} className="bg-emerald-500 hover:bg-emerald-600" disabled={areButtonsDisabled || isLoading || isAnyFileStillProcessing || editedContent.trim() === ''} aria-label={t.saveAndSubmit} icon={<SubmitPlayIcon className="w-4 h-4" />}>{t.saveAndSubmit}</Button>
        </div>
      </div>
    </div>
  );
});

export default EditMessagePanel;
