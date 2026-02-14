
import React, { useState, useEffect } from 'react';
import { 
  Activity, CheckCircle, Clock, AlertTriangle, 
  Users, TrendingUp, Search, ArrowUpRight, 
  Filter, Calendar, ExternalLink, Loader2, Send, Bell, DollarSign
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Lead } from '../types';
import { dispatchWebhook } from '../lib/webhook';
import { StorageEngine } from '../lib/storage';

export const Monitor: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMonitorData();
  }, []);

  const fetchMonitorData = async () => {
    setLoading(true);
    let remoteLeads: Lead[] = [];
    
    // 1. Inicia com dados locais
    const localLeads = StorageEngine.getLeads();
    setLeads(localLeads);

    // 2. Tenta buscar do banco e mescla
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*, categories(*)')
          .order('expiration_date', { ascending: true, nullsFirst: false });
        
        if (data && !error) {
          remoteLeads = data;
          const merged = StorageEngine.syncLeads(remoteLeads);
          setLeads(merged);
        }
      } catch (e) {
        console.warn("Nexus Monitor: Erro ao buscar dados remotos.");
      }
    }
    
    setLoading(false);
  };

  const handleManualNotify = async (lead: Lead) => {
    setNotifyingId(lead.id);
    try {
      await dispatchWebhook(lead);
      alert(`Notificação enviada: ${lead.name}`);
    } catch (e) {
      alert("Erro ao disparar notificação.");
    } finally {
      setNotifyingId(null);
    }
  };

  const isExpiringToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(dateStr);
    expDate.setHours(0, 0, 0, 0);
    return expDate.getTime() === today.getTime();
  };

  const isExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(dateStr);
    expDate.setHours(0, 0, 0, 0);
    return expDate.getTime() < today.getTime();
  };

  const monitorLeads = [...leads].sort((a, b) => {
    if (!a.expiration_date) return 1;
    if (!b.expiration_date) return -1;
    return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black dark:text-white tracking-tight text-indigo-600">Nexus Monitor</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-widest">Controle de Carteira de Clientes</p>
        </div>
        <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
           <Activity size={24} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-black text-lg dark:text-white uppercase tracking-tight flex items-center gap-3">
             <Bell className="text-indigo-600" /> Vencimentos de Planos
          </h3>
          <div className="flex gap-4">
             <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 text-[10px] font-black uppercase rounded-xl border border-indigo-100 dark:border-indigo-500/20">
               VALOR TOTAL CARTEIRA: R$ {leads.reduce((acc, l) => acc + (Number(l.estimated_value || 0) || 0), 0).toLocaleString('pt-BR')}
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Cliente / Valor</th>
                <th className="px-6 py-5">Categoria</th>
                <th className="px-6 py-5">Vencimento</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-8 py-5 text-right">Notificar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && monitorLeads.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></td></tr>
              ) : monitorLeads.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-20 text-center opacity-30 italic font-black uppercase text-xs tracking-widest">Sem dados para monitorar.</td>
                </tr>
              ) : monitorLeads.map((lead) => {
                const expiring = isExpiringToday(lead.expiration_date);
                const expired = isExpired(lead.expiration_date);
                
                return (
                  <tr key={lead.id} className={`transition-colors ${expiring ? 'bg-amber-50/30 dark:bg-amber-500/5' : expired ? 'bg-rose-50/10 dark:bg-rose-500/5' : ''}`}>
                    <td className="px-8 py-5">
                      <p className="font-black text-sm dark:text-white">{lead.name}</p>
                      <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-0.5">
                        R$ {Number(lead.estimated_value || 0).toLocaleString('pt-BR')}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                       {lead.categories ? (
                          <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md" style={{ backgroundColor: lead.categories.color + '20', color: lead.categories.color }}>
                            {lead.categories.name}
                          </span>
                        ) : <span className="text-[9px] text-slate-300 font-bold uppercase">Geral</span>}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className={expired ? 'text-rose-500' : 'text-slate-400'} />
                        <p className={`font-black text-xs ${expired ? 'text-rose-600' : 'dark:text-white'}`}>
                          {lead.expiration_date ? new Date(lead.expiration_date).toLocaleDateString('pt-BR') : '--'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       {expired ? (
                         <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Expirado</span>
                       ) : expiring ? (
                         <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Vence Hoje</span>
                       ) : (
                         <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Ativo</span>
                       )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => handleManualNotify(lead)}
                        disabled={notifyingId === lead.id}
                        className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        title="Reenviar Webhook"
                      >
                        {notifyingId === lead.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
