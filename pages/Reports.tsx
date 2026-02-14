
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell, PieChart, Pie 
} from 'recharts';
import { 
  BarChart3, TrendingUp, Sparkles, Download, Calendar, 
  ArrowUpRight, Target, Zap, Loader2, BrainCircuit, Lightbulb
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getBusinessDiagnostic } from '../lib/gemini';

const MOCK_MONTHS = [
  { name: 'Jan', sales: 42, revenue: 156000 },
  { name: 'Fev', sales: 38, revenue: 142000 },
  { name: 'Mar', sales: 55, revenue: 198000 },
  { name: 'Abr', sales: 48, revenue: 172000 },
  { name: 'Mai', sales: 62, revenue: 215000 },
  { name: 'Jun', sales: 75, revenue: 289000 },
];

export const Reports: React.FC = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, conversionRate: 0, averageTicket: 0, activeLeads: 0 });
  const [loading, setLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDiagnostic, setAiDiagnostic] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: leads } = await supabase.from('leads').select('estimated_value, status');
    
    if (leads) {
      const total = leads.length;
      const revenue = leads.filter(l => l.status === 'won').reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
      const won = leads.filter(l => l.status === 'won').length;
      
      const newStats = {
        totalRevenue: revenue,
        conversionRate: total > 0 ? Math.round((won / total) * 100) : 0,
        averageTicket: won > 0 ? Math.round(revenue / won) : 0,
        activeLeads: leads.filter(l => l.status !== 'won' && l.status !== 'lost').length
      };
      setStats(newStats);
    }
    setLoading(false);
  };

  const handleAiDiagnostic = async () => {
    setIsAiLoading(true);
    const diagnostic = await getBusinessDiagnostic(stats);
    setAiDiagnostic(diagnostic);
    setIsAiLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white flex items-center gap-2">
             <BarChart3 className="text-indigo-600" /> Business Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Visão macro da saúde comercial da sua empresa.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-500 hover:text-indigo-600 transition-all shadow-sm">
            <Calendar size={14} /> Últimos 6 Meses
          </button>
          <button className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Vendas Totais</p>
          <p className="text-2xl font-black dark:text-white">R$ {stats.totalRevenue.toLocaleString('pt-BR')}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg w-fit">
            <TrendingUp size={12} /> +12.5% vs ano ant.
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Ticket Médio</p>
          <p className="text-2xl font-black dark:text-white">R$ {stats.averageTicket.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-4 italic">Baseado em propostas ganhas</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Conversão</p>
          <p className="text-2xl font-black dark:text-white">{stats.conversionRate}%</p>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
             <div className="h-full bg-indigo-600" style={{ width: `${stats.conversionRate}%` }}></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Custo Aquisição (CAC)</p>
          <p className="text-2xl font-black dark:text-white">R$ 450,00</p>
          <p className="text-[10px] text-rose-500 font-bold mt-4">Ponto de Atenção (-2%)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-lg mb-8 dark:text-white">Crescimento Mensal de Receita</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_MONTHS}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                  formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-lg mb-8 dark:text-white">Volume de Negócios (Sales Qty)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_MONTHS}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="sales" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 transform scale-150 transition-transform group-hover:scale-125 duration-1000">
           <BrainCircuit size={300} />
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Sparkles size={24} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest">Nexus Pro AI Consultoria</h2>
          </div>
          
          <p className="text-indigo-100 font-medium leading-relaxed mb-8 text-lg">
            Nossa inteligência processou seus dados de prospecção e faturamento. Geramos um diagnóstico estratégico personalizado para acelerar seu fechamento no próximo mês.
          </p>

          {aiDiagnostic ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/20 animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-2 mb-4 text-indigo-200 font-black uppercase tracking-widest text-xs">
                 <Lightbulb size={16} /> Diagnóstico Estratégico
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="whitespace-pre-wrap font-bold leading-loose">{aiDiagnostic}</p>
              </div>
              <button 
                onClick={() => setAiDiagnostic(null)}
                className="mt-6 text-[10px] font-black uppercase text-indigo-200 hover:text-white transition-colors"
              >
                Limpar Relatório
              </button>
            </div>
          ) : (
            <button 
              onClick={handleAiDiagnostic}
              disabled={isAiLoading}
              className="px-8 py-5 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all flex items-center gap-3 shadow-xl disabled:opacity-50"
            >
              {isAiLoading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
              GERAR DIAGNÓSTICO DE PERFORMANCE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
