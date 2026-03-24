
import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGeminiApiStore } from '../../../store/useGeminiApiStore.ts';
import { Button } from '../../ui/Button.tsx';

interface InteractiveChoicesProps {
    choices: string[];
}

const InteractiveChoices: React.FC<InteractiveChoicesProps> = memo(({ choices }) => {
    const { handleSendMessage, isLoading } = useGeminiApiStore();

    if (choices.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-3 animate-fade-in">
            {choices.map((choice, idx) => (
                <Button
                    key={idx}
                    onClick={() => handleSendMessage(choice)}
                    disabled={isLoading}
                    variant="secondary"
                    className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 shadow-sm hover:shadow-md transition transform hover:scale-105 active:scale-95 border border-emerald-200 dark:border-emerald-500/30 markdown-content"
                >
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({node, ...props}) => <span {...props} />, // Render paragraphs as spans to ensure valid HTML inside button
                            // Ensure links don't break button click behavior, treat them as styled text or prevent default
                            a: ({node, ...props}) => <span className="underline decoration-dotted" {...props} />
                        }}
                    >
                        {choice}
                    </ReactMarkdown>
                </Button>
            ))}
        </div>
    );
});

export default InteractiveChoices;
