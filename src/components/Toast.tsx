import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from './UI';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-max max-w-[90vw]"
    >
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md",
        type === 'success' 
          ? "bg-emerald-500/90 border-emerald-400 text-white" 
          : "bg-rose-500/90 border-rose-400 text-white"
      )}>
        {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        <span className="text-sm font-bold tracking-tight">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};
