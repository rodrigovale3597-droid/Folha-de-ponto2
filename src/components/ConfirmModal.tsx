import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, Card } from './UI';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-sm p-6 space-y-6 rounded-3xl border-none shadow-2xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
            <AlertTriangle size={32} className="text-rose-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black tracking-tighter italic">{title}</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1 rounded-xl font-bold">
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="flex-1 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-600 dark:hover:bg-rose-700">
            Confirmar
          </Button>
        </div>
      </Card>
    </div>
  );
};
