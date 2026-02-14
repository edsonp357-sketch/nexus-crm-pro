
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  Briefcase, 
  DollarSign, 
  Zap,
  MoreVertical,
  Loader2,
  Inbox,
  History,
  Phone,
  Mail,
  Users2,
  ClipboardList,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StorageEngine } from '../lib/storage';
import { Lead, Activity as ActivityType } from '../types';

const data = [
  { name: 'Jan', revenue: 45000 },
  { name: 'Fev', revenue: 52000 },
  { name: 'Mar', revenue: 48000 },
  { name: 'Abr', revenue: 61000 },
  { name: 'Mai', revenue: 59000 },
  { name: 'Jun', revenue: 72000 },
];

const StatCard = ({ title, value, change, icon: Icon, trend, loading, colorClass }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className={`p-3 rounded-2xl ${colorClass || 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}%
      </div>
    </div>
    <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest relative z-10">{title}</h3>
    {loading ? (
      <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded mt-2"></div>
    ) : (
      <p className="text-2xl font-black mt-1 dark:text-white truncate relative z-10">{value}</p>
    )}
  </div>
);

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ 
    totalLeads: 0, 
    predictedRevenue: 0, 
    active: 0, 
    sold: 0, 
    expired: 0,
    conversion: 0 
  });
  const [pieData, setPieData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*, leads(name)')
          .order('created_at', { ascending: false })
          .limit(5);
        if (!error) setRecentActivities(data || []);
      } catch (e) {}
    }
  };

  const calculateStats = (leads: Lead[]) => {
    if (!Array.isArray(leads)) return;
    
    const validLeads = leads.filter(l => l && typeof l === 'object');
    const total = validLeads.length;
    const revenue = validLeads.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
    
    const activeCount = validLeads.filter(l => ['new', 'contacted', 'proposal'].includes(l.status)).length;
    const soldCount = validLeads.filter(l => l.status === 'won').length;
    const expiredCount = validLeads.filter(l => ['lost', 'expired'].includes(l.status)).length;
    
    const statusCounts = validLeads.reduce((acc: any, l: Lead) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});

    const colors: any = { 
      new: '#6366f1', 
      contacted: '#f59e0b', 
      proposal: '#8b5cf6', 
      won: '#10b981', 
      lost: '#f43f5e',
      expired: '#94a3b8' 
    };
    const labels: any = { 
      new: 'Novo', 
      contacted: 'Contato', 
      proposal: 'Proposta', 
      won: 'Ganho', 
      lost: 'Perdido',
      expired: 'Expirado' 
    };

    const chartData = total > 0 ? Object.keys(statusCounts).map(status => ({
      name: labels[status] || status,
      value: Math.round((statusCounts[status] / total) * 100),
      color: colors[status] || '#94a3b8'
    })) : [];

    setStats({
      totalLeads: total,
      predictedRevenue: revenue,
      active: activeCount,
      sold: soldCount,
      expired: expiredCount,
      conversion: total > 0 ? Math.round((soldCount / total) * 100) : 0
    });
    setPieData(chartData);
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const localLeads = StorageEngine.getLeads();
      calculateStats(localLeads);

      if (isSupabaseConfigured()) {
        const { data: remoteLeads, error } = await supabase.from('leads').select('*');
        if (remoteLeads && !error) {
          const merged = StorageEngine.syncLeads(remoteLeads);
          calculateStats(merged);
        }
      }
    } catch (err) {
      console.error("Erro ao processar estatísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone size={14} />;
      case 'email': return <Mail size={14} />;
      case 'meeting': return <Users2 size={14} />;
      default: return <ClipboardList size={14} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white uppercase tracking-tight">Nexus Intelligence</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Visão geral em tempo real da carteira de clientes.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { fetchStats(); fetchRecentActivities(); }} className="p-3 text-slate-400 hover:text-indigo-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all shadow-sm active:scale-95">
            <Zap size={20} className={loading ? "animate-pulse text-indigo-600" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Clientes Totais" value={stats.totalLeads.toString()} change="12" icon={Users} trend="up" loading={loading} />
        <StatCard title="Contratos Ativos" value={stats.active.toString()} change="8" icon={Activity} trend="up" loading={loading} colorClass="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600" />
        <StatCard title="Novos Clientes" value={stats.sold.toString()} change="15" icon={CheckCircle} trend="up" loading={loading} colorClass="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" />
        <StatCard title="Vencimentos" value={stats.expired.toString()} change="3" icon={AlertTriangle} trend="down" loading={loading} colorClass="bg-rose-50 dark:bg-rose-500/10 text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-lg dark:text-white uppercase tracking-tight">Volume de Contratos</h3>
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-indigo-500"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previsão Nexus AI</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} tickFormatter={(v) => `R$${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontWeight: 'bold' }}
                    cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
              <History size={20} className="text-indigo-600" />
              <h3 className="font-black text-lg dark:text-white uppercase tracking-tight">Atividade Recente</h3>
            </div>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="py-10 text-center opacity-30 italic text-sm font-bold uppercase tracking-widest">Buscando novos registros...</div>
              ) : recentActivities.map((act) => (
                <div key={act.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 transition-transform hover:scale-[1.01]">
                  <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                    {getActivityIcon(act.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black dark:text-white truncate">
                      {act.description}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                      Cliente: {act.leads?.name || 'Sistema'} • {new Date(act.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <h3 className="font-black text-lg mb-8 dark:text-white uppercase tracking-tight">Status da Carteira</h3>
          <div className="h-64 flex flex-col items-center justify-center relative">
            {loading && pieData.length === 0 ? (
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={10} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <Inbox size={40} className="text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sem Clientes</p>
              </div>
            )}
            {pieData.length > 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="block text-2xl font-black dark:text-white">{stats.conversion}%</span>
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Sucesso</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
