import React, { memo, useState, Suspense } from 'react';
import { ToolInvocation } from '../../../types.ts';
import { CheckCircleIcon, XCircleIcon, ArrowDownTrayIcon, ExportBoxIcon } from '../../common/Icons.tsx';
import { Button } from '../../ui/Button.tsx';
import { Accordion } from '../../ui/Accordion.tsx';
import { Badge } from '../../ui/Badge.tsx';

// Lazy load CodeBlockHighlighter from common
const CodeBlockHighlighter = React.lazy(() => import('../../common/CodeBlockHighlighter.tsx'));

interface PythonExecutionBlockProps {
  invocation: ToolInvocation;
}

const PythonExecutionBlock: React.FC<PythonExecutionBlockProps> = memo(({ invocation }) => {
  const [isOutputDocked, setIsOutputDocked] = useState(false); 
  
  const { args, result, isError } = invocation;
  const code = args.code || '';

  const borderColor = isError ? 'border-red-200 dark:border-red-500/30' : 'border-emerald-200 dark:border-emerald-500/30';
  const bgColor = isError ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';
  const textColor = isError ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300';
  const headerHover = isError ? 'hover:bg-red-100 dark:hover:bg-red-900/40' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40';

  const toggleDocking = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOutputDocked(!isOutputDocked);
  };

  const OutputContent = () => (
      <pre className={`whitespace-pre-wrap break-all font-mono text-xs ${isError ? 'text-red-300' : 'text-green-300'} ${isOutputDocked ? 'p-3' : 'py-2 px-1'}`}>
          {result || <span className="text-gray-500 italic">No output</span>}
      </pre>
  );

  return (
    <div className="w-full my-2 flex flex-col">
      <Accordion 
        defaultOpen={true}
        className={`${borderColor} ${bgColor} font-mono text-xs`}
        title={
          <div className="flex items-center space-x-2">
            <Badge variant={isError ? 'error' : 'success'}>PY</Badge>
            <span className={`font-semibold ${textColor}`}>
              {isError ? "Execution Error" : "Python Executed"}
            </span>
            <div className="flex items-center space-x-2 ml-2">
                <Button 
                    onClick={toggleDocking}
                    variant="ghost"
                    size="sm"
                    className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 ${textColor} opacity-70 hover:opacity-100 transition`}
                    title={isOutputDocked ? "Undock Output (Show in Chat)" : "Dock Output (Move to Box)"}
                    icon={isOutputDocked ? <ExportBoxIcon className="w-3.5 h-3.5" /> : <ArrowDownTrayIcon className="w-3.5 h-3.5" />}
                />

                <div className="w-px h-3 bg-gray-300 dark:bg-white/10 mx-1"></div>

                {isError ? <XCircleIcon className="w-4 h-4 text-red-500 dark:text-red-400" /> : <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </div>
          </div>
        }
      >
        <div className="border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-zinc-900 -mx-4 -my-3">
            <div className={`${isOutputDocked ? 'border-b border-gray-200 dark:border-white/5' : ''}`}>
                <div className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-[10px] text-gray-500 uppercase tracking-wider font-bold flex justify-between items-center">
                    <span>Input</span>
                </div>
                <div className="overflow-x-auto max-h-60 custom-scrollbar">
                    <Suspense fallback={<pre className="p-3 text-gray-800 dark:text-gray-300">{code}</pre>}>
                        <CodeBlockHighlighter language="python" codeString={code} />
                    </Suspense>
                </div>
            </div>

            {isOutputDocked && (
                <div className="animate-fade-in">
                    <div className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-[10px] text-gray-500 uppercase tracking-wider font-bold border-b border-gray-200 dark:border-white/5">Output</div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        <OutputContent />
                    </div>
                </div>
            )}
        </div>
      </Accordion>

      {!isOutputDocked && (
          <div className={`mt-1 ml-1 pl-3 border-l-2 ${borderColor} animate-fade-in`}>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1 opacity-70">Result</div>
              <OutputContent />
          </div>
      )}
    </div>
  );
});

export default PythonExecutionBlock;