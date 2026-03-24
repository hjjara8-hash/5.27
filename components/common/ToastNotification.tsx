import React, { useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToastStore } from '../../store/useToastStore.ts';
import { CheckCircleIcon, XCircleIcon, CloseIcon as CloseButtonIcon } from './Icons.tsx';
import { Button } from '../ui/Button.tsx';

const ToastNotification: React.FC = memo(() => {
  const { toastInfo, hideToast } = useToastStore();

  useEffect(() => {
    if (toastInfo) {
      const timer = setTimeout(() => {
        hideToast();
      }, toastInfo.duration || 2000);
      return () => clearTimeout(timer);
    }
  }, [toastInfo, hideToast]);

  const bgColor = toastInfo?.type === 'success' ? 'bg-green-500/80 border-green-400/50' : 'bg-red-500/80 border-red-400/50';
  const IconComponent = toastInfo?.type === 'success' ? CheckCircleIcon : XCircleIcon;

  return (
    <AnimatePresence>
      {toastInfo && (
        <motion.div 
          key="toast"
          initial={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
          animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`fixed top-5 left-1/2 z-[100] w-[calc(100vw-3rem)] sm:w-auto max-w-md px-4 py-3 rounded-lg shadow-xl flex items-center space-x-3 text-white ${bgColor} border`}
          role="alert"
          aria-live="assertive"
        >
          <IconComponent className="w-5 h-5 flex-shrink-0" />
          <span className="flex-grow">{toastInfo.message}</span>
          <Button
            onClick={hideToast}
            variant="ghost"
            size="none"
            className="p-1 -mr-1 rounded-full transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 h-auto w-auto"
            aria-label="Close notification"
            icon={<CloseButtonIcon className="w-4 h-4" />}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default ToastNotification;