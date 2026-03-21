import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings } from 'lucide-react';
import { cn } from './UI';

interface SidebarProps {
  activeView: 'dashboard' | 'team' | 'calendar';
  onOpenSettings: () => void;
}

export const Sidebar = ({ activeView, onOpenSettings }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'team', label: 'Equipe', icon: Users, path: '/team' },
    { id: 'calendar', label: 'Calendário', icon: Calendar, path: '/calendar' },
  ] as const;

  return (
    <aside className="w-64 h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col p-6 gap-8">
      <Link to="/" className="flex items-center gap-2 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600 rounded-lg">
        <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
          <span className="text-white dark:text-slate-900 font-black italic">P</span>
        </div>
        <h1 className="text-xl font-black tracking-tighter italic">PontoFácil</h1>
      </Link>

      <nav className="flex-1 flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600",
              activeView === item.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg shadow-slate-200 dark:shadow-none"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
            )}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-2">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"
        >
          <Settings size={20} />
          Configurações
        </button>
      </div>
    </aside>
  );
};
