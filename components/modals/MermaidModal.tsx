import React, { memo, useEffect, useRef, useState, useCallback } from 'react';
import { useEditorUI } from '../../store/ui/useEditorUI.ts';
import { CloseIcon, SitemapIcon, ZoomInIcon, ZoomOutIcon, ResetViewIcon, ArrowDownTrayIcon, SparklesIcon, XCircleIcon } from '../common/Icons.tsx';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import { triggerDownload } from '../../services/utils.ts';
import { useGeminiApiStore } from '../../store/useGeminiApiStore.ts';
import { useTranslation } from '../../hooks/useTranslation.ts';
import { Button } from '../ui/Button.tsx';

declare global {
  interface Window {
    mermaid?: any;
  }
}

const MermaidModal: React.FC = memo(() => {
  const { isMermaidModalOpen, mermaidModalData, closeMermaidModal } = useEditorUI();
  const { t } = useTranslation();
  const { handleFixMermaidCode } = useGeminiApiStore.getState();

  const [renderResult, setRenderResult] = useState<{ svg?: string; error?: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isFixing, setIsFixing] = useState(false);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(true);
  const transformComponentRef = useRef<ReactZoomPanPinchContentRef | null>(null);

  useEffect(() => {
    if (!isMermaidModalOpen) return;

    setAreButtonsDisabled(true);
    const timerId = setTimeout(() => {
        setAreButtonsDisabled(false);
    }, 500);

    if (!mermaidModalData) {
        setIsLoading(false);
        return () => clearTimeout(timerId);
    }
    
    let isMounted = true;
    setIsLoading(true);
    setRenderResult({});

    const renderMermaid = async () => {
      try {
        if (!window.mermaid) {
            // Lazy load mermaid if not already present
            const mermaidModule = await import('mermaid');
            window.mermaid = mermaidModule.default;
        }

        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: '"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", Tahoma, sans-serif',
        });
        
        const diagramId = `mermaid-diagram-${Date.now()}`;
        const { svg } = await window.mermaid.render(diagramId, mermaidModalData.code);

        if (isMounted) {
            setRenderResult({ svg });
            setIsLoading(false);
        }
      } catch (e: any) {
        console.error("Mermaid Render Error", e);
        if (isMounted) {
            setRenderResult({ error: e.message || "Unknown error" });
            setIsLoading(false);
        }
      }
    };

    renderMermaid();

    return () => {
        isMounted = false;
        clearTimeout(timerId);
    };
  }, [isMermaidModalOpen, mermaidModalData]);

  const handleDownload = useCallback(() => {
    if (renderResult.svg) {
        const blob = new Blob([renderResult.svg], { type: 'image/svg+xml' });
        triggerDownload(blob, `diagram-${Date.now()}.svg`);
    }
  }, [renderResult.svg]);

  const handleFix = useCallback(async () => {
    if (!mermaidModalData?.code || !mermaidModalData?.messageId || !mermaidModalData?.fullContent) return;
    setIsFixing(true);
    try {
        await handleFixMermaidCode({
            messageId: mermaidModalData.messageId,
            badCode: mermaidModalData.code,
            fullContent: mermaidModalData.fullContent
        });
    } finally {
        if(isMermaidModalOpen) setIsFixing(false); 
    }
  }, [mermaidModalData, handleFixMermaidCode, isMermaidModalOpen]);

  if (!isMermaidModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col" role="dialog" aria-modal="true" onClick={closeMermaidModal}>
        <div className="flex items-center justify-between p-4 bg-black/40 border-b border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={closeMermaidModal} disabled={areButtonsDisabled} className="p-1 rounded-full bg-white/5">
                    <CloseIcon className="w-6 h-6" />
                </Button>
                <h2 className="text-lg font-semibold text-gray-200">{t.mermaidDiagramViewer}</h2>
            </div>
            
            <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => transformComponentRef.current?.zoomIn()} className="p-2 bg-white/5" title={t.zoomIn}><ZoomInIcon className="w-5 h-5"/></Button>
                <Button variant="ghost" onClick={() => transformComponentRef.current?.zoomOut()} className="p-2 bg-white/5" title={t.zoomOut}><ZoomOutIcon className="w-5 h-5"/></Button>
                <Button variant="ghost" onClick={() => transformComponentRef.current?.resetTransform()} className="p-2 bg-white/5" title={t.resetView}><ResetViewIcon className="w-5 h-5"/></Button>
                
                {renderResult.svg && (
                    <Button variant="primary" onClick={handleDownload} className="ml-2" icon={<ArrowDownTrayIcon className="w-4 h-4" />}>
                        {t.downloadSvg}
                    </Button>
                )}
            </div>
        </div>

        <div className="flex-grow relative overflow-hidden bg-[#0d1117] w-full h-full" onClick={e => e.stopPropagation()}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
                        <span className="text-emerald-400">{t.renderingDiagram}</span>
                    </div>
                </div>
            )}

            {renderResult.error ? (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-8 max-w-lg">
                        <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-400 mb-2">{t.renderingError}</h3>
                        <pre className="text-xs text-red-300 bg-red-900/20 p-4 rounded text-left overflow-auto max-h-40 mb-4 border border-red-500/30">
                            {renderResult.error}
                        </pre>
                        {mermaidModalData?.messageId && (
                            <Button 
                                variant="primary"
                                onClick={handleFix} 
                                disabled={isFixing}
                                className="w-full bg-purple-600 hover:bg-purple-500"
                                icon={!isFixing && <SparklesIcon className="w-4 h-4" />}
                            >
                                {isFixing ? t.fixing : t.fixWithAi}
                            </Button>
                        )}
                    </div>
                </div>
            ) : renderResult.svg ? (
                <TransformWrapper
                    ref={transformComponentRef}
                    initialScale={1}
                    minScale={0.5}
                    maxScale={8}
                    centerOnInit={true}
                >
                    <TransformComponent 
                        wrapperStyle={{ width: "100%", height: "100%" }}
                        contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        <div 
                            className="mermaid-svg-container p-4"
                            dangerouslySetInnerHTML={{ __html: renderResult.svg }} 
                        />
                    </TransformComponent>
                </TransformWrapper>
            ) : null}
        </div>
    </div>
  );
});

export default MermaidModal;