import React from 'react';
import { format, addMonths, subMonths, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Download, 
  CheckCircle2, Clock, XCircle, User 
} from 'lucide-react';
import { Button, Card, cn } from './UI';
import { Employee } from '../types';

interface CalendarViewProps {
  employees: Employee[];
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  daysInMonth: Date[];
  getAttendanceForDay: (id: string, d: Date) => { type: 'D' | 'M' | 'F' | undefined; location?: string };
  toggleAttendance: (id: string, d: Date, t: 'D' | 'M' | 'F' | null) => void;
  generatePDF: () => void;
}

export const CalendarView = ({ 
  employees, selectedEmployeeId, setSelectedEmployeeId, 
  currentMonth, setCurrentMonth, daysInMonth, 
  getAttendanceForDay, toggleAttendance, generatePDF 
}: CalendarViewProps) => {
  const [filter, setFilter] = React.useState<'D' | 'M' | 'F' | null>(null);
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  const filteredEmployees = React.useMemo(() => {
    if (!filter) return employees;
    return employees.filter(emp => 
      daysInMonth.some(day => getAttendanceForDay(emp.id, day).type === filter)
    );
  }, [employees, filter, daysInMonth, getAttendanceForDay]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter italic">Folha de Ponto</h1>
          <p className="text-slate-500 font-medium">Registre as diárias e faltas dos colaboradores.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-2xl p-1">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronLeft size={20} /></button>
            <span className="px-4 font-black text-sm uppercase tracking-widest min-w-[120px] text-center">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronRight size={20} /></button>
          </div>
          {selectedEmployeeId && (
            <Button onClick={generatePDF} variant="secondary" className="rounded-2xl h-12 px-4 gap-2">
              <Download size={20} />
              <span className="hidden md:inline">PDF</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-2">Filtros</h3>
            <div className="grid grid-cols-4 gap-2 px-2">
              <button 
                onClick={() => setFilter(null)}
                className={cn(
                  "h-10 rounded-xl flex items-center justify-center transition-all border-2 font-bold text-xs",
                  filter === null 
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white" 
                    : "bg-slate-50 dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-800 text-slate-400"
                )}
              >
                Tudo
              </button>
              <button 
                onClick={() => setFilter('D')}
                className={cn(
                  "h-10 rounded-xl flex items-center justify-center transition-all border-2 font-bold text-xs",
                  filter === 'D' 
                    ? "bg-emerald-500 text-white border-emerald-500" 
                    : "bg-emerald-50 dark:bg-emerald-500/10 border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/30 text-emerald-600"
                )}
                title="Diária Inteira"
              >
                D
              </button>
              <button 
                onClick={() => setFilter('M')}
                className={cn(
                  "h-10 rounded-xl flex items-center justify-center transition-all border-2 font-bold text-xs",
                  filter === 'M' 
                    ? "bg-amber-500 text-white border-amber-500" 
                    : "bg-amber-50 dark:bg-amber-500/10 border-transparent hover:border-amber-200 dark:hover:border-amber-500/30 text-amber-600"
                )}
                title="Meia Diária"
              >
                M
              </button>
              <button 
                onClick={() => setFilter('F')}
                className={cn(
                  "h-10 rounded-xl flex items-center justify-center transition-all border-2 font-bold text-xs",
                  filter === 'F' 
                    ? "bg-rose-500 text-white border-rose-500" 
                    : "bg-rose-50 dark:bg-rose-500/10 border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 text-rose-600"
                )}
                title="Falta"
              >
                F
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-2">Colaboradores ({filteredEmployees.length})</h3>
            <div className="space-y-2">
              {filteredEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left border-2",
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
            {filteredEmployees.length === 0 && (
              <p className="text-sm font-bold text-slate-400 text-center py-8">
                {filter ? `Nenhum registro '${filter}' este mês.` : "Nenhum colaborador cadastrado."}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
          {selectedEmployee ? (
            <Card className="p-6 border-none bg-slate-50 dark:bg-slate-900 rounded-3xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                  <User size={32} className="text-slate-900 dark:text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter italic">{selectedEmployee.name}</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Registros de {format(currentMonth, 'MMMM', { locale: ptBR })}</p>
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
                        "aspect-square flex flex-col items-center justify-center gap-1 rounded-2xl transition-all border-2 relative group",
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

              <div className="mt-8 flex flex-wrap gap-4 pt-8 border-t border-slate-200 dark:border-slate-800">
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
              </div>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <User size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-black tracking-tighter italic mb-2">Selecione um colaborador</h3>
              <p className="text-slate-500 font-medium max-w-xs">Escolha alguém na lista ao lado para visualizar e gerenciar sua folha de ponto.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
