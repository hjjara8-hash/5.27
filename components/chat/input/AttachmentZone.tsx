
import React, { memo } from 'react';
import { Attachment } from '../../../types.ts';
import { DocumentIcon, XCircleIcon } from '../../common/Icons.tsx';
import { Button } from '../../ui/Button.tsx';

interface AttachmentZoneProps {
    files: Attachment[];
    onRemove: (id: string) => void;
    disabled?: boolean;
}

const AttachmentZone: React.FC<AttachmentZoneProps> = memo(({ files, onRemove, disabled }) => {
    if (files.length === 0) return null;

    return (
        <div className="px-2 py-1.5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/5 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
                {files.map(file => {
                    const isUploading = (file.uploadState === 'reading_client' || file.uploadState === 'uploading_to_cloud' || file.uploadState === 'processing_on_server') && !file.error;
                    const isError = !!file.error || file.uploadState?.startsWith('error');

                    return (
                        <div key={file.id} className="relative group p-1.5 bg-white dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-white/10 flex items-center gap-2 max-w-[140px]">
                            <div className="flex-shrink-0 w-6 h-6 bg-gray-100 dark:bg-black/40 rounded flex items-center justify-center">
                                {isUploading ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600 dark:border-emerald-400"></div>
                                ) : isError ? (
                                    <DocumentIcon className="w-3 h-3 text-red-400" />
                                ) : file.dataUrl && file.mimeType.startsWith('image/') && file.type === 'image' ? (
                                    <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                                ) : (
                                    <DocumentIcon className="w-3 h-3 text-gray-500 dark:text-gray-300" />
                                )}
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="text-[10px] font-medium text-gray-900 dark:text-gray-200 truncate" title={file.name}>{file.name}</p>
                            </div>
                            <Button
                                onClick={() => onRemove(file.id)} 
                                disabled={disabled}
                                variant="ghost"
                                size="none"
                                className="flex-shrink-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-0.5 disabled:opacity-50" 
                                title="Remove"
                            >
                                <XCircleIcon className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export default AttachmentZone;
