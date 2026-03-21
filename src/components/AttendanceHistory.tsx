import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Clock, MapPin, CheckCircle2, XCircle, History, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total do Mês</p>
            <p className="text-xl font-black italic text-indigo-600 dark:text-indigo-400">
              R$ {records.reduce((acc, r) => {
                const rate = r.customRate !== undefined ? r.customRate : (employee.dailyRate || 0);
                if (r.type === 'D') return acc + rate;
                if (r.type === 'M') return acc + (rate / 2);
                return acc;
              }, 0).toFixed(2)}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose} className="rounded-full w-10 h-10 p-0 ml-4">
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
              const isExpanded = expandedId === record.id;

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
                    <button 
                      onClick={() => toggleExpand(record.id)}
                      className={cn(
                        "w-full text-left bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                        isExpanded && "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <h4 className="font-black text-lg tracking-tight italic">
                            {format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </h4>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            status.color
                          )}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {record.location && !isExpanded && (
                            <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <MapPin size={12} />
                              <span className="truncate max-w-[100px]">{record.location}</span>
                            </div>
                          )}
                          {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
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

                              {record.customRate !== undefined && (
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Diferenciado:</p>
                                  <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                    <CheckCircle2 size={14} />
                                    R$ {record.customRate.toFixed(2)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
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
