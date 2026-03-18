import React from 'react';
import { format } from 'date-fns';
import { UserPlus, Search, Edit2, Trash2, CreditCard, Banknote, Users, CalendarDays } from 'lucide-react';
import { Button, Card } from './UI';
import { Employee, AttendanceRecord } from '../types';

interface TeamProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  setIsAddEmployeeOpen: (open: boolean) => void;
  setSelectedEmployeeId: (id: string | null) => void;
  openEditModal: () => void;
  deleteEmployee: (id: string) => void;
  setActiveView: (view: 'dashboard' | 'team' | 'calendar') => void;
}

export const Team = ({ 
  employees, attendance, setIsAddEmployeeOpen, setSelectedEmployeeId, openEditModal, deleteEmployee, setActiveView 
}: TeamProps) => {
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [projectFilter, setProjectFilter] = React.useState('all');
  
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  
  const roles = React.useMemo(() => {
    const uniqueRoles = new Set(employees.map(e => e.role || 'Sem Cargo').filter(Boolean));
    return ['all', ...Array.from(uniqueRoles)].sort();
  }, [employees]);

  const projects = React.useMemo(() => {
    const uniqueProjects = new Set(employees.map(e => e.project || 'Sem Obra').filter(Boolean));
    return ['all', ...Array.from(uniqueProjects)].sort();
  }, [employees]);

  const filtered = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || (e.role || 'Sem Cargo') === roleFilter;
    const matchesProject = projectFilter === 'all' || (e.project || 'Sem Obra') === projectFilter;
    
    return matchesSearch && matchesRole && matchesProject;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter italic">Equipe</h1>
          <p className="text-slate-500 font-medium">Gerencie seus colaboradores e dados de pagamento.</p>
        </div>
        <Button onClick={() => setIsAddEmployeeOpen(true)} className="rounded-2xl h-12 px-6 gap-2 font-black italic tracking-tight text-lg">
          <UserPlus size={20} />
          Novo Colaborador
        </Button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl font-bold focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-800 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Filtrar por Cargo</label>
            <select 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-800 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Todos os Cargos</option>
              {roles.filter(r => r !== 'all').map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Filtrar por Obra</label>
            <select 
              value={projectFilter} 
              onChange={e => setProjectFilter(e.target.value)}
              className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-800 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Todas as Obras</option>
              {projects.filter(p => p !== 'all').map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(emp => (
          <Card key={emp.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-slate-50 dark:bg-slate-900">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center font-black italic text-xl text-slate-900 dark:text-white">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-tight leading-none mb-2 flex items-center gap-2 flex-wrap">
                      {emp.name}
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-500/20">
                        {emp.role || 'Colaborador'}
                      </span>
                    </h3>
                    {emp.project && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Obra: {emp.project}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CalendarDays size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {attendance.filter(a => a.employeeId === emp.id && a.monthYear === currentMonthStr && a.type === 'D').length} Diárias no mês
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => { setSelectedEmployeeId(emp.id); openEditModal(); }}
                    className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => deleteEmployee(emp.id)}
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Diária</p>
                  <p className="font-black text-slate-900 dark:text-white">R$ {emp.dailyRate?.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => { setSelectedEmployeeId(emp.id); setActiveView('calendar'); }}
                  className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-lg flex flex-col justify-center"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Ponto</p>
                  <p className="font-black text-xs">Ver Calendário</p>
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <CreditCard size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chave PIX</p>
                    <p className="font-bold truncate">{emp.pixKey || 'Não informada'}</p>
                    {emp.paymentNote && (
                      <p className="text-[10px] font-medium text-slate-500 italic truncate mt-0.5">
                        Titular: {emp.paymentNote}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Banknote size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Banco</p>
                    <p className="font-bold truncate">{emp.bankName || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-black tracking-tighter italic mb-2">Nenhum colaborador encontrado</h3>
            <p className="text-slate-500 font-medium">Tente ajustar sua busca ou adicione um novo membro.</p>
          </div>
        )}
      </div>
    </div>
  );
};
