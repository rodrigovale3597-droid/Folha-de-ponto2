import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Clock, MapPin, CheckCircle2, XCircle, History } from 'lucide-react';
import { Button, Card, cn } from './UI';
import { AttendanceRecord, Employee } from '../types';

interface AttendanceHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  attendance: AttendanceRecord[];
  month: Date;
}

export const AttendanceHistory = ({ isOpen, onClose, employee, attendance, month }: AttendanceHistoryProps) => {
  if (!isOpen) return null;

  const monthStr = format(month, 'yyyy-MM');
  const records = attendance
    .filter(a => a.employeeId === employee.id && a.monthYear === monthStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  const getStatusInfo = (type: 'D' | 'M' | 'F') => {
    switch (type) {
      case 'D': return { label: 'Diária Inteira', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' };
      case 'M': return { label: 'Meia Diária', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' };
      case 'F': return { label: 'Falta', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' };
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col p-0 rounded-3xl border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-950">
        <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <History size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tighter italic">Histórico Detalhado</h3>
              <p className="text-sm text-slate-500 font-bold">
                {employee.name} • {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="rounded-full w-10 h-10 p-0">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {records.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto">
                <Clock size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-bold">Nenhum registro encontrado para este mês.</p>
            </div>
          ) : (
            records.map((record) => {
              const status = getStatusInfo(record.type);
              const dateObj = parseISO(record.date);
              const timestampObj = record.timestamp ? parseISO(record.timestamp) : null;

              return (
                <div key={record.id} className="group relative flex gap-4">
                  {/* Timeline line */}
                  <div className="absolute left-[21px] top-10 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-900 group-last:hidden" />
                  
                  <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 z-10 shadow-sm",
                    status.bg
                  )}>
                    <status.icon size={20} className={status.color} />
                  </div>

                  <div className="flex-1 pb-8">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <h4 className="font-black text-lg tracking-tight italic">
                          {format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </h4>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          status.bg, status.color
                        )}>
                          {status.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Marcação Realizada em:</p>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                            <Clock size={14} className="text-slate-400" />
                            {timestampObj ? (
                              format(timestampObj, "HH:mm:ss 'em' dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              'Horário não registrado'
                            )}
                          </div>
                        </div>

                        {record.location && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Local / Obra:</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                              <MapPin size={14} className="text-slate-400" />
                              {record.location}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-900 flex justify-end">
          <Button onClick={onClose} className="rounded-2xl px-8 font-black italic tracking-tight">
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  );
};
