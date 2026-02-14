
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  Calendar, 
  LogOut,
  Bell,
  Search,
  Menu,
  TrendingUp,
  BrainCircuit,
  ShieldCheck,
  Building2,
  BarChart3,
  Settings,
  Activity,
  X,
  Users
} from 'lucide-react';
import { Profile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: Profile | null;
  currentPage: string;
  onPageChange: (page: any) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, currentPage, onPageChange, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'monitor', label: 'Monitoramento', icon: Activity },
    { id: 'leads', label: 'Clientes', icon: Users },
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'pipeline', label: 'Gasoduto', icon: TrendingUp },
    { id: 'tasks', label: 'O.S.', icon: Calendar },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'team', label: 'Equipe', icon: ShieldCheck },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  const handleNavClick = (pageId: string) => {
    onPageChange(pageId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <BrainCircuit size={24} />
              </div>
              <span className="text-xl font-black tracking-tight dark:text-white">
                Nexus<span className="text-indigo-600">Pro</span>
              </span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-indigo-600"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-2 scrollbar-hide">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${currentPage === item.id 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 font-bold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                `}
              >
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center font-black text-indigo-600">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate dark:text-white uppercase tracking-tight">{user?.full_name}</p>
                <p className="text-[9px] text-slate-400 truncate uppercase tracking-widest font-bold">{user?.role}</p>
              </div>
              <button 
                onClick={onLogout}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 px-5 py-2.5 rounded-2xl w-96 border border-slate-200/10">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Busca Inteligente de Clientes..." 
                className="bg-transparent border-none outline-none text-xs px-3 w-full dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all relative">
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 dark:bg-slate-950 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
