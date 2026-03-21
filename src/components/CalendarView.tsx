import React from 'react';
import { format, addMonths, subMonths, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Download, 
  CheckCircle2, Clock, XCircle, User, History, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Card, cn } from './UI';
import { Employee, AttendanceRecord } from '../types';
import { MonthYearPicker } from './MonthYearPicker';
import { AttendanceHistory } from './AttendanceHistory';

interface CalendarViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  daysInMonth: Date[];
  getAttendanceForDay: (id: string, d: Date) => { type: 'D' | 'M' | 'F' | undefined; location?: string; customRate?: number };
  toggleAttendance: (id: string, d: Date, t: 'D' | 'M' | 'F' | null) => void;
  generatePDF: () => void;
  generateCSV: () => void;
  sharePDF: () => void;
}

export const CalendarView = ({ 
  employees, attendance, selectedEmployeeId, setSelectedEmployeeId, 
  currentMonth, setCurrentMonth, daysInMonth, 
  getAttendanceForDay, toggleAttendance, generatePDF, generateCSV, sharePDF 
}: CalendarViewProps) => {
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'D' | 'M' | 'F'>('all');
  
  const filteredEmployees = React.useMemo(() => {
    if (filter === 'all') return employees;
    return employees.filter(emp => {
      const att = getAttendanceForDay(emp.id, new Date());
      return att.type === filter;
    });
  }, [employees, filter, getAttendanceForDay]);

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter italic">Folha de Ponto</h1>
          <p className="text-slate-500 font-medium">Registre as diárias e faltas dos colaboradores.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-2xl p-1">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"><ChevronLeft size={20} /></button>
            <button 
              onClick={() => setIsPickerOpen(true)}
              className="px-4 font-black text-sm uppercase tracking-widest min-w-[120px] text-center hover:text-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
              title="Escolher mês e ano"
            >
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"><ChevronRight size={20} /></button>
          </div>

          <MonthYearPicker 
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            currentDate={currentMonth}
            onChange={setCurrentMonth}
          />
          {selectedEmployeeId && (
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsHistoryOpen(true)} 
                variant="secondary" 
                className="rounded-2xl h-12 px-4 gap-2"
                title="Ver Histórico Detalhado"
              >
                <History size={20} />
                <span className="hidden md:inline text-xs font-black italic tracking-tight">Histórico</span>
              </Button>
              <Button onClick={generatePDF} variant="secondary" className="rounded-2xl h-12 px-4 gap-2" title="Baixar PDF">
                <Download size={20} />
                <span className="hidden md:inline">PDF</span>
              </Button>
              {navigator.share && (
                <Button onClick={sharePDF} variant="secondary" className="rounded-2xl h-12 px-4 gap-2" title="Compartilhar PDF">
                  <Share2 size={20} />
                  <span className="hidden md:inline">Enviar</span>
                </Button>
              )}
              <Button onClick={generateCSV} variant="secondary" className="rounded-2xl h-12 px-4 gap-2" title="Baixar CSV">
                <Download size={20} />
                <span className="hidden md:inline">CSV</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {selectedEmployee && (
        <AttendanceHistory 
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          employee={selectedEmployee}
          attendance={attendance}
          month={currentMonth}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
            {(['all', 'D', 'M', 'F'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600",
                  filter === f 
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {f === 'all' ? 'Tudo' : f}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-2">Colaboradores ({filteredEmployees.length})</h3>
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {filteredEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600",
                    selectedEmployeeId === emp.id
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-lg"
                      : "bg-slate-50 dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                  )}
                >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-black italic",
                  selectedEmployeeId === emp.id ? "bg-white/20 dark:bg-slate-900/10" : "bg-white dark:bg-slate-800"
                )}>
                  {emp.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black tracking-tight truncate">{emp.name}</p>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest truncate",
                    selectedEmployeeId === emp.id ? "opacity-60" : "text-slate-400"
                  )}>{emp.role || 'Colaborador'}</p>
                </div>
              </button>
            ))}
            {employees.length === 0 && (
              <p className="text-sm font-bold text-slate-400 text-center py-8">
                Nenhum colaborador cadastrado.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        <AnimatePresence mode="wait">
          {selectedEmployee ? (
            <motion.div
              key={selectedEmployee.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Card className="p-6 border-none bg-slate-50 dark:bg-slate-900 rounded-3xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    <User size={32} className="text-slate-900 dark:text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-black tracking-tighter italic">{selectedEmployee.name}</h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Registros de {format(currentMonth, 'MMMM', { locale: ptBR })}</p>
                      {selectedEmployee.pixKey && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                          PIX: {selectedEmployee.pixKey}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={() => toggleAttendance(selectedEmployee.id, new Date(), getAttendanceForDay(selectedEmployee.id, new Date()).type || null)}
                    className="rounded-2xl h-12 px-6 gap-2 font-black italic tracking-tight bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 size={20} />
                    <span className="hidden sm:inline">Marcar Hoje</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-slate-900 dark:bg-white shadow-sm border border-transparent">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Total a Receber</p>
                    <p className="text-2xl font-black italic text-white dark:text-slate-900">
                      R$ {(() => {
                        let total = 0;
                        daysInMonth.forEach(day => {
                          const att = getAttendanceForDay(selectedEmployee.id, day);
                          const rate = att.customRate !== undefined ? att.customRate : (selectedEmployee.dailyRate || 0);
                          if (att.type === 'D') total += rate;
                          if (att.type === 'M') total += (rate / 2);
                        });
                        return total.toFixed(2);
                      })()}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Diárias Inteiras</p>
                    <p className="text-2xl font-black italic text-emerald-500">
                      {daysInMonth.filter(day => getAttendanceForDay(selectedEmployee.id, day).type === 'D').length}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Meias Diárias</p>
                    <p className="text-2xl font-black italic text-amber-500">
                      {daysInMonth.filter(day => getAttendanceForDay(selectedEmployee.id, day).type === 'M').length}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Faltas</p>
                    <p className="text-2xl font-black italic text-rose-500">
                      {daysInMonth.filter(day => getAttendanceForDay(selectedEmployee.id, day).type === 'F').length}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
                  {daysInMonth.map(day => {
                    const { type, location } = getAttendanceForDay(selectedEmployee.id, day);
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => toggleAttendance(selectedEmployee.id, day, type || null)}
                        className={cn(
                          "aspect-square flex flex-col items-center justify-center gap-1 rounded-2xl transition-all border-2 relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600",
                          isToday(day) && "ring-2 ring-slate-900 dark:ring-white ring-offset-2 dark:ring-offset-slate-950",
                          type === 'D' && "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20",
                          type === 'M' && "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20",
                          type === 'F' && "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20",
                          !type && "bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        )}
                      >
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          !type && (isWeekend ? "text-rose-400" : "text-slate-400"),
                          type && "opacity-80"
                        )}>
                          {format(day, 'EEE', { locale: ptBR })}
                        </span>
                        <span className="text-lg font-black tracking-tighter italic">{format(day, 'dd')}</span>
                        
                        {type === 'D' && <CheckCircle2 size={14} className="absolute top-2 right-2 opacity-60" />}
                        {type === 'M' && <Clock size={14} className="absolute top-2 right-2 opacity-60" />}
                        {type === 'F' && <XCircle size={14} className="absolute top-2 right-2 opacity-60" />}

                        {location && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white opacity-80" title={location} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-6 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-500">Diária Inteira</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-slate-500">Meia Diária</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-slate-500">Falta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <span className="text-xs font-bold text-slate-500">Não Registrado</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800"
            >
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <User size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-black tracking-tighter italic mb-2">Selecione um colaborador</h3>
              <p className="text-slate-500 font-medium max-w-xs">Escolha alguém na lista ao lado para visualizar e gerenciar sua folha de ponto.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  );
};
