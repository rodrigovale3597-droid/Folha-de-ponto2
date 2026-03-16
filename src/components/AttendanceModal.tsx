import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, CheckCircle2, Clock, XCircle, Trash2 } from 'lucide-react';
import { Button, Card, cn } from './UI';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'D' | 'M' | 'F' | null) => void;
  date: Date;
  currentType: 'D' | 'M' | 'F' | null;
}

export const AttendanceModal = ({ isOpen, onClose, onSelect, date, currentType }: AttendanceModalProps) => {
  if (!isOpen) return null;

  const options = [
    { id: 'D', label: 'Diária Inteira', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { id: 'M', label: 'Meia Diária', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { id: 'F', label: 'Falta', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  ] as const;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-sm p-6 space-y-6 rounded-3xl border-none shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tighter italic">Registrar Ponto</h3>
            <p className="text-sm text-slate-500 font-bold">
              {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose} className="rounded-full w-10 h-10 p-0">
            <X size={20} />
          </Button>
        </div>

        <div className="grid gap-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl transition-all border-2",
                currentType === opt.id 
                  ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-900" 
                  : "border-transparent bg-slate-50 dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", opt.bg)}>
                  <opt.icon size={20} className={opt.color} />
                </div>
                <span className="font-black tracking-tight">{opt.label}</span>
              </div>
              {currentType === opt.id && <div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" />}
            </button>
          ))}
          
          {currentType && (
            <button
              onClick={() => onSelect(null)}
              className="flex items-center justify-center gap-2 p-4 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 size={18} />
              Remover Registro
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};
