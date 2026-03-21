import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Plus, Settings } from 'lucide-react';
import { cn } from './UI';

interface BottomNavProps {
  activeView: 'dashboard' | 'team' | 'calendar';
  onOpenAddEmployee: () => void;
  onOpenSettings: () => void;
}

export const BottomNav = ({ activeView, onOpenAddEmployee, onOpenSettings }: BottomNavProps) => {
  const leftItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard, path: '/' },
    { id: 'team', label: 'Equipe', icon: Users, path: '/team' },
  ] as const;

  const rightItems = [
    { id: 'calendar', label: 'Ponto', icon: Calendar, path: '/calendar' },
  ] as const;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-40 pb-4">
      <div className="flex items-center gap-8">
        {leftItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600 rounded-lg p-1",
              activeView === item.id ? "text-slate-900 dark:text-white" : "text-slate-400"
            )}
          >
            <item.icon size={20} className={cn(activeView === item.id && "scale-110")} />
            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 -top-6">
        <button
          onClick={onOpenAddEmployee}
          className="w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl flex items-center justify-center transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600 border-4 border-white dark:border-slate-950"
        >
          <Plus size={28} />
        </button>
      </div>

      <div className="flex items-center gap-8">
        {rightItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600 rounded-lg p-1",
              activeView === item.id ? "text-slate-900 dark:text-white" : "text-slate-400"
            )}
          >
            <item.icon size={20} className={cn(activeView === item.id && "scale-110")} />
            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
        
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600 rounded-lg p-1"
        >
          <Settings size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Config</span>
        </button>
      </div>
    </nav>
  );
};
