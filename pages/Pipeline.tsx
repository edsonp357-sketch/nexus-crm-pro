
import React, { useState, useEffect } from 'react';
import { 
  MoreHorizontal, 
  Plus, 
  DollarSign, 
  Clock, 
  AlertCircle,
  Loader2,
  ArrowRightLeft,
  ChevronRight,
  TrendingUp,
  Inbox,
  Trash2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StorageEngine } from '../lib/storage';
import { Lead, LeadStatus } from '../types';

const STAGES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new', label: 'Prospecção', color: '#6366f1' },
  { id: 'contacted', label: 'Atendimento', color: '#f59e0b' },
  { id: 'proposal', label: 'Negociação', color: '#8b5cf6' },
  { id: 'won', label: 'Contratado', color: '#10b981' },
  { id: 'lost', label: 'Perdido', color: '#f43f5e' },
];

export const Pipeline: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const localLeads = StorageEngine.getLeads();
    setLeads(localLeads);

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        const merged = StorageEngine.syncLeads(data);
        setLeads(merged);
      }
    }
    setLoading(false);
  };

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    setUpdatingId(leadId);
    StorageEngine.updateLead(leadId, { status: newStatus });
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

    if (isSupabaseConfigured()) {
      await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    }
    setUpdatingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este cliente definitivamente?')) return;
    
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) {
          alert("Erro no Supabase: " + error.message);
          return;
        }
      }

      StorageEngine.deleteLead(id);
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      console.error("Erro ao deletar lead do pipeline:", e);
    }
  };

  const totalValue = leads.reduce((acc, l) => acc + (Number(l.estimated_value || 0) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white flex items-center gap-2">
            <TrendingUp className="text-indigo-600" /> Gasoduto de Clientes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Controle de fluxo de negociações ativas.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-6 shadow-sm">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Contratos Totais</p>
            <p className="text-xl font-black text-indigo-600">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <button 
            onClick={fetchLeads}
            className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter(l => l && l.status === stage.id);
          const stageValue = stageLeads.reduce((acc, l) => acc + (Number(l.estimated_value || 0) || 0), 0);

          return (
            <div key={stage.id} className="flex-shrink-0 w-80 space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }}></div>
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-tight">{stage.label}</h3>
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-black">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="text-[10px] font-black text-slate-400">
                  R$ {stageValue.toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="space-y-3 min-h-[500px] bg-slate-100/50 dark:bg-slate-900/30 p-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 transition-all">
                {stageLeads.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-300 dark:text-slate-700">
                    <Inbox size={32} strokeWidth={1.5} />
                    <p className="text-[10px] font-bold mt-2 uppercase tracking-widest opacity-40">Sem Clientes</p>
                  </div>
                )}
                
                {stageLeads.map((deal) => (
                  <div 
                    key={deal.id}
                    className={`bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group relative ${updatingId === deal.id ? 'opacity-50 grayscale' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-sm dark:text-white truncate pr-6">
                        {deal.name}
                      </h4>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3">
                        <div className="relative group/menu">
                          <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <MoreHorizontal size={14} className="text-slate-400" />
                          </button>
                          <div className="hidden group-hover/menu:block absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-10 p-1 overflow-hidden">
                            <p className="text-[9px] font-black text-slate-400 p-2 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 mb-1">Nexus Actions:</p>
                            {STAGES.filter(s => s.id !== deal.status).map(s => (
                              <button 
                                key={s.id}
                                onClick={() => updateLeadStatus(deal.id, s.id)}
                                className="w-full text-left px-3 py-2 text-[10px] font-bold dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 rounded-lg transition-colors"
                              >
                                Mover: {s.label}
                              </button>
                            ))}
                            <button 
                              onClick={() => handleDelete(deal.id)}
                              className="w-full text-left px-3 py-2 text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors mt-1 border-t border-slate-100 dark:border-slate-700"
                            >
                              <div className="flex items-center gap-2"><Trash2 size={12} /> Excluir Cliente</div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-black text-xs mb-4">
                      <span className="text-emerald-500">R$</span>
                      <span>{Number(deal.estimated_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Clock size={10} />
                        {new Date(deal.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="h-6 w-6 rounded-full bg-indigo-600 text-[10px] font-black text-white flex items-center justify-center border-2 border-white dark:border-slate-900 uppercase">
                        {deal.name.charAt(0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
