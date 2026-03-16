import React from 'react';
import { LayoutDashboard, Users, Calendar, Plus } from 'lucide-react';
import { cn } from './UI';

interface BottomNavProps {
  activeView: 'dashboard' | 'team' | 'calendar';
  setActiveView: (view: 'dashboard' | 'team' | 'calendar') => void;
  onOpenAddEmployee: () => void;
}

export const BottomNav = ({ activeView, setActiveView, onOpenAddEmployee }: BottomNavProps) => {
  const items = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'team', label: 'Equipe', icon: Users },
    { id: 'calendar', label: 'Ponto', icon: Calendar },
  ] as const;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-4 z-40">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeView === item.id ? "text-slate-900 dark:text-white" : "text-slate-400"
          )}
        >
          <item.icon size={20} className={cn(activeView === item.id && "scale-110")} />
          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
        </button>
      ))}
      
      <button
        onClick={onOpenAddEmployee}
        className="w-12 h-12 -mt-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-xl flex items-center justify-center transition-transform active:scale-90"
      >
        <Plus size={24} />
      </button>
    </nav>
  );
};
