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
      initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ 
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 0.8
      }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-max max-w-[90vw]"
    >
      <div className={cn(
        "flex items-center gap-3 px-6 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border backdrop-blur-xl",
        type === 'success' 
          ? "bg-emerald-500/95 border-emerald-400/50 text-white" 
          : "bg-rose-500/95 border-rose-400/50 text-white"
      )}>
        <motion.div
          initial={{ scale: 0.5, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring" }}
        >
          {type === 'success' ? <CheckCircle2 size={22} className="drop-shadow-md" /> : <AlertCircle size={22} className="drop-shadow-md" />}
        </motion.div>
        <div className="flex flex-col">
          <span className="text-[13px] font-black italic tracking-tight leading-none mb-0.5">
            {type === 'success' ? 'SUCESSO' : 'ERRO'}
          </span>
          <span className="text-sm font-bold tracking-tight opacity-90">{message}</span>
        </div>
        <button 
          onClick={onClose} 
          className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};
