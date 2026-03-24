
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditorUI } from '../../store/ui/useEditorUI.ts';
import { useActiveChatStore } from '../../store/useActiveChatStore.ts';
import { useGeminiApiStore } from '../../store/useGeminiApiStore.ts';
import { useFileHandler } from '../../hooks/useFileHandler.ts';
import useAutoResizeTextarea from '../../hooks/useAutoResizeTextarea.ts';
import { XCircleIcon, ArrowPathIcon, UserIcon, MicrophoneIcon, StopCircleIcon, PaperClipIcon, DocumentIcon } from '../common/Icons.tsx';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { useTranscribe } from '../../hooks/useTranscribe.ts';
import AttachmentZone from '../chat/input/AttachmentZone.tsx';
import { Button } from '../ui/Button.tsx';
import { Textarea } from '../ui/Textarea.tsx';

const InjectedMessageEditModal: React.FC = () => {
  const { 
    isInjectedMessageEditModalOpen, 
    closeInjectedMessageEditModal, 
    injectedMessageEditTarget 
  } = useEditorUI();
  
  const { updateCurrentChatSession, currentChatSession } = useActiveChatStore();
  const { handleRegenerateResponseForUserMessage } = useGeminiApiStore.getState();
  const isLoading = useGeminiApiStore(s => s.isLoading);
  const { t } = useTranslation();

  const [inputValue, setInputValue] = useState('');
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  const textareaRef = useAutoResizeTextarea<HTMLTextAreaElement>(inputValue);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Handler Hook
  const {
      files,
      handleFileSelection,
      handlePaste,
      removeFile,
      resetFiles,
      getValidFiles,
      isAnyFileStillProcessing
  } = useFileHandler();

  const originalMessage = currentChatSession?.messages.find(m => m.id === injectedMessageEditTarget?.messageId);

  const onTranscriptionComplete = useCallback((text: string) => {
    setInputValue(prev => prev ? `${prev} ${text}` : text);
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
        }
    }, 50);
  }, [textareaRef]);

  const { isRecording, isTranscribing, startRecording, stopRecording } = useTranscribe(onTranscriptionComplete);

  useEffect(() => {
    if (isInjectedMessageEditModalOpen) {
      setAreButtonsDisabled(true);
      const timerId = setTimeout(() => {
        setAreButtonsDisabled(false);
      }, 500);

      if (originalMessage) {
        setInputValue(originalMessage.content);
        resetFiles(); // New attachments only, simplistic approach for injected modal
      }
      return () => clearTimeout(timerId);
    }
  }, [isInjectedMessageEditModalOpen, originalMessage, resetFiles]);

  const handleSaveAndRegenerate = useCallback(async () => {
    if (!injectedMessageEditTarget || !originalMessage) return;

    // 1. Update the user message content & attachments
    await updateCurrentChatSession(session => {
      if (!session) return null;
      const messageIndex = session.messages.findIndex(m => m.id === injectedMessageEditTarget.messageId);
      if (messageIndex === -1) return session;

      const updatedMessages = [...session.messages];
      
      // Combine original attachments + new files
      const newAttachments = getValidFiles();
      const existingAttachments = originalMessage.attachments || [];
      const combinedAttachments = [...existingAttachments, ...newAttachments];

      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: inputValue,
        attachments: combinedAttachments
      };
      return { ...session, messages: updatedMessages };
    });

    // 2. Trigger regeneration
    handleRegenerateResponseForUserMessage(injectedMessageEditTarget.messageId);

    closeInjectedMessageEditModal();
  }, [injectedMessageEditTarget, inputValue, originalMessage, updateCurrentChatSession, handleRegenerateResponseForUserMessage, closeInjectedMessageEditModal, getValidFiles]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveAndRegenerate();
    }
  };
  
  const handleClose = () => {
    if (isRecording) stopRecording();
    closeInjectedMessageEditModal();
  };

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const handleAttachClick = () => fileInputRef.current?.click();

  // Drag & Drop Handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
  }, [isDragging]);

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
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileSelection(e.dataTransfer.files);
      }
  }, [handleFileSelection]);

  if (!isInjectedMessageEditModalOpen || !injectedMessageEditTarget) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="injected-edit-modal-title"
    >
      <div 
        className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-6 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col relative transition text-gray-900 dark:text-gray-200 animate-modal-open ${isDragging ? 'ring-2 ring-emerald-500 bg-gray-50 dark:bg-black/40' : ''}`}
        onClick={e => e.stopPropagation()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-none rounded-lg">
                <div className="text-white font-bold text-lg flex items-center animate-bounce">
                    <DocumentIcon className="w-8 h-8 mr-3 text-emerald-500" />
                    <span>Drop files to attach</span>
                </div>
            </div>
        )}

        <header className="flex items-center justify-between mb-6">
          <h2 id="injected-edit-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <UserIcon className="w-5 h-5 mr-3 text-emerald-500" />
            {t.editUserMessageInjected}
          </h2>
          <Button
            variant="ghost"
            onClick={handleClose} 
            disabled={areButtonsDisabled}
            className="p-1.5 rounded-full"
            aria-label={t.close}
          >
            <XCircleIcon className="w-6 h-6" />
          </Button>
        </header>

        {/* Card - Emerald */}
        <div className="relative p-4 rounded-r-xl rounded-l-md border border-gray-200 dark:border-white/10 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 dark:from-emerald-500/5 to-transparent flex-grow mb-6 flex flex-col gap-3">
            
            {/* Attachments Area */}
            <AttachmentZone files={files} onRemove={removeFile} />

            <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onPaste={handlePaste}
                className="h-48 resize-none border-emerald-500/30 focus:ring-emerald-500"
                placeholder={t.typeUserMessage}
                aria-label="User message text"
            />
        </div>

        <footer className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
             {/* File Input */}
             <input 
                type="file" 
                multiple 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => handleFileSelection(e.target.files)}
             />
             <Button
                variant="ghost"
                onClick={handleAttachClick}
                disabled={areButtonsDisabled || isAnyFileStillProcessing}
                className="p-2"
                title={t.addFiles}
             >
                <PaperClipIcon className="w-5 h-5" />
             </Button>

             {/* Microphone */}
             <Button
                variant={isRecording ? "danger" : "ghost"}
                onClick={toggleRecording}
                disabled={areButtonsDisabled || isTranscribing}
                className={`p-2 border ${isRecording ? 'border-red-200 dark:border-red-500/40 shadow-sm dark:shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'border-transparent dark:border-white/5'}`}
                title={isRecording ? "Stop Recording" : "Voice Input"}
              >
                {isTranscribing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent"></div>
                ) : isRecording ? (
                    <StopCircleIcon className="w-5 h-5 animate-pulse" />
                ) : (
                    <MicrophoneIcon className="w-5 h-5" />
                )}
              </Button>
          </div>

          <div className="flex space-x-3">
            <Button 
                variant="secondary"
                onClick={handleClose}
                disabled={areButtonsDisabled}
            >
                {t.cancel}
            </Button>
            <Button
                variant="primary"
                onClick={handleSaveAndRegenerate}
                disabled={areButtonsDisabled || isLoading || (inputValue.trim() === '' && files.length === 0) || isAnyFileStillProcessing}
                icon={<ArrowPathIcon className="w-5 h-5" />}
            >
                {isLoading ? t.regenerating : t.regenerateAiResponse}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default InjectedMessageEditModal;
