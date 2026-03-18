import React from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Users, Calendar as CalendarIcon, TrendingUp, 
  ChevronLeft, ChevronRight, ArrowRight, UserPlus, Smartphone,
  CheckCircle2, Clock, XCircle
} from 'lucide-react';
import { Card, Button, cn } from './UI';
import { Employee, AttendanceRecord } from '../types';
import { MonthYearPicker } from './MonthYearPicker';

interface DashboardProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  getSummary: (id: string, monthYear: string) => any;
  setActiveView: (view: 'dashboard' | 'team' | 'calendar') => void;
  onInstallPWA?: () => void;
  isInstallable?: boolean;
}

export const Dashboard = ({ 
  employees, attendance, currentMonth, setCurrentMonth, getSummary, setActiveView,
  onInstallPWA, isInstallable
}: DashboardProps) => {
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  
  React.useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);
  }, []);

  const monthStr = format(currentMonth, 'yyyy-MM');
  
  const totalStats = employees.reduce((acc, emp) => {
    const summary = getSummary(emp.id, monthStr);
    return {
      diarias: acc.diarias + summary.diarias,
      meias: acc.meias + summary.meias,
      totalValue: acc.totalValue + summary.totalValue
    };
  }, { diarias: 0, meias: 0, totalValue: 0 });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter italic">Olá, Administrador</h1>
          <p className="text-slate-500 font-medium">Aqui está o resumo de {format(currentMonth, 'MMMM', { locale: ptBR })}.</p>
        </div>
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-2xl p-1">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"><ChevronLeft size={20} /></button>
          <button 
            onClick={() => setIsPickerOpen(true)}
            className="px-4 font-black text-sm uppercase tracking-widest hover:text-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
            title="Escolher mês e ano"
          >
            {format(currentMonth, 'MMM yy', { locale: ptBR })}
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"><ChevronRight size={20} /></button>
        </div>

        <MonthYearPicker 
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          currentDate={currentMonth}
          onChange={setCurrentMonth}
        />
      </div>
      
      {!isStandalone && (isInstallable || isIOS) && (
        <Card className="p-6 bg-indigo-600 text-white border-none shadow-xl shadow-indigo-500/20 overflow-hidden relative group">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Smartphone size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tighter italic">Instale o App no seu Celular</h3>
                <p className="text-indigo-100 text-sm font-medium">
                  {isIOS 
                    ? "Toque em 'Compartilhar' e depois em 'Adicionar à Tela de Início' para usar como aplicativo."
                    : "Acesse o PontoFácil direto da sua tela de início, sem precisar do navegador."}
                </p>
              </div>
            </div>
            {isInstallable && (
              <Button 
                onClick={onInstallPWA}
                className="bg-white text-indigo-600 hover:bg-indigo-50 border-none rounded-2xl h-12 px-8 font-black italic shadow-lg"
              >
                Instalar Agora
              </Button>
            )}
          </div>
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-slate-900/10 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Mensal</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter italic">R$ {totalStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs font-bold opacity-60">Previsão de pagamentos</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Users size={20} className="text-emerald-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Equipe Ativa</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter italic">{employees.length}</p>
            <p className="text-xs font-bold text-slate-500">Colaboradores cadastrados</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <CalendarIcon size={20} className="text-amber-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Diárias</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter italic">{totalStats.diarias + (totalStats.meias * 0.5)}</p>
            <p className="text-xs font-bold text-slate-500">Trabalhadas no mês</p>
          </div>
        </Card>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-black tracking-tighter italic px-2">Detalhamento do Mês</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 bg-emerald-50 dark:bg-emerald-500/10 border-none flex flex-col justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-2">Diárias Completas</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black italic text-emerald-600 dark:text-emerald-400">{totalStats.diarias}</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-amber-50 dark:bg-amber-500/10 border-none flex flex-col justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 mb-2">Meias Diárias</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black italic text-amber-600 dark:text-amber-400">{totalStats.meias}</p>
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <Clock size={16} className="text-amber-500" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-slate-50 dark:bg-slate-900 border-none flex flex-col justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total de Registros</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black italic text-slate-700 dark:text-slate-300">{totalStats.diarias + totalStats.meias}</p>
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <TrendingUp size={16} className="text-slate-500" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-emerald-50 dark:bg-emerald-500/10 border-none flex flex-col justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-2">Média p/ Colab.</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black italic text-emerald-600 dark:text-emerald-400">
                {employees.length > 0 ? ((totalStats.diarias + totalStats.meias * 0.5) / employees.length).toFixed(1) : '0'}
              </p>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <Users size={16} className="text-emerald-500" />
              </div>
            </div>
          </Card>
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black tracking-tighter italic">Ações Rápidas</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setActiveView('team')}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"
            >
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserPlus size={24} className="text-slate-900 dark:text-white" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Gerenciar Equipe</span>
            </button>
            <button 
              onClick={() => setActiveView('calendar')}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"
            >
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarIcon size={24} className="text-slate-900 dark:text-white" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Registrar Ponto</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black tracking-tighter italic">Resumo por Funcionário</h3>
            <button onClick={() => setActiveView('calendar')} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600 rounded p-1">Ver Todos <ArrowRight size={14} /></button>
          </div>
          <div className="space-y-3">
            {employees.slice(0, 4).map(emp => {
              const summary = getSummary(emp.id, monthStr);
              const total = summary.totalValue;
              
              return (
                <Card key={emp.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-black italic text-sm">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black tracking-tight">{emp.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {emp.role || 'Colaborador'} {emp.project && `• ${emp.project}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black tracking-tight">R$ {total.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{summary.total} Diárias</p>
                  </div>
                </Card>
              );
            })}
            {employees.length === 0 && (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-400">Nenhum colaborador cadastrado.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black tracking-tighter italic">Atividades Recentes</h3>
          </div>
          <div className="space-y-3">
            {attendance
              .slice()
              .sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
                return timeB - timeA;
              })
              .slice(0, 5)
              .map(record => {
                const emp = employees.find(e => e.id === record.employeeId);
                if (!emp) return null;
                
                const typeInfo = {
                  'D': { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                  'M': { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                  'F': { color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' }
                }[record.type];

                return (
                  <div key={record.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-sm", typeInfo.bg, typeInfo.color)}>
                      {record.type}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black tracking-tight truncate">{emp.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                        {format(new Date(record.date), "dd 'de' MMM", { locale: ptBR })} {record.location && `• ${record.location}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400">
                        {record.timestamp ? format(new Date(record.timestamp), 'HH:mm') : '--:--'}
                      </p>
                    </div>
                  </div>
                );
              })}
            {attendance.length === 0 && (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-400">Nenhuma atividade recente.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
