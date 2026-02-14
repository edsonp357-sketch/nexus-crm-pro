
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, X, ChevronRight, Loader2, Send, Users, Phone, Calendar, 
  DollarSign, Tag, Mail, CheckCircle, Edit3, Trash2, AlertCircle
} from 'lucide-react';
import { Lead, Profile, Category } from '../types';
import { supabase, isSupabaseConfigured, DEMO_USER_ID } from '../lib/supabase';
import { dispatchWebhook } from '../lib/webhook';
import { StorageEngine } from '../lib/storage';

interface LeadsProps {
  user: Profile | null;
}

export const Leads: React.FC<LeadsProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  
  const getDefaultExpirationDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({ 
    id: '', name: '', email: '', phone: '', value: '', 
    category_id: '', expiration_date: getDefaultExpirationDate()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Carregar categorias do Supabase
      if (isSupabaseConfigured()) {
        const { data: catData } = await supabase.from('categories').select('*').order('name');
        if (catData) {
          setCategories(catData);
          saveLocalCategories(catData);
        } else {
          setCategories(StorageEngine.getCategories());
        }
      } else {
        setCategories(StorageEngine.getCategories());
      }

      // Carregar Clientes
      const localLeads = StorageEngine.getLeads();
      setLeads(Array.isArray(localLeads) ? localLeads : []);
      
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('leads')
          .select('*, categories(*)')
          .order('created_at', { ascending: false });
          
        if (!error && data) {
          const merged = StorageEngine.syncLeads(data);
          setLeads(merged);
        }
      }
    } catch (err) {
      console.error("Erro fatal ao carregar clientes:", err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const saveLocalCategories = (cats: Category[]) => {
    localStorage.setItem('nexus_categories_data', JSON.stringify(cats));
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setFormData({ 
      id: '', name: '', email: '', phone: '', value: '', 
      category_id: '', expiration_date: getDefaultExpirationDate() 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setIsEditMode(true);
    setFormData({
      id: lead.id,
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      value: (lead.estimated_value || 0).toString(),
      category_id: lead.category_id || '',
      expiration_date: lead.expiration_date || getDefaultExpirationDate()
    });
    setIsModalOpen(true);
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este cliente definitivamente do sistema?')) return;
    
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) {
           alert("Erro ao excluir no banco de dados: " + error.message);
           return;
        }
      }
      
      StorageEngine.deleteLead(id);
      setLeads(prev => prev.filter(l => l.id !== id));
      if (selectedLead?.id === id) setSelectedLead(null);
      
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    
    const leadPayload: Lead = {
      id: isEditMode ? formData.id : crypto.randomUUID(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      estimated_value: parseFloat(formData.value) || 0,
      status: isEditMode && selectedLead ? selectedLead.status : 'new',
      seller_id: user.id,
      category_id: formData.category_id || undefined,
      expiration_date: formData.expiration_date,
      created_at: isEditMode && selectedLead ? selectedLead.created_at : new Date().toISOString(),
      categories: categories.find(c => c.id === formData.category_id)
    };

    try {
      if (isSupabaseConfigured()) {
        if (isEditMode) {
          const { error } = await supabase.from('leads').update({
            name: leadPayload.name,
            email: leadPayload.email,
            phone: leadPayload.phone,
            estimated_value: leadPayload.estimated_value,
            category_id: leadPayload.category_id,
            expiration_date: leadPayload.expiration_date
          }).eq('id', leadPayload.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('leads').insert([{
            id: leadPayload.id,
            name: leadPayload.name,
            email: leadPayload.email,
            phone: leadPayload.phone,
            estimated_value: leadPayload.estimated_value,
            status: leadPayload.status,
            seller_id: leadPayload.seller_id,
            category_id: leadPayload.category_id,
            expiration_date: leadPayload.expiration_date,
            created_at: leadPayload.created_at
          }]);
          if (error) throw error;
        }
      }
      
      StorageEngine.saveLead(leadPayload);
      setLeads(prev => {
        const filtered = prev.filter(l => l.id !== leadPayload.id);
        return [leadPayload, ...filtered];
      });

      setIsModalOpen(false);
      setSelectedLead(leadPayload);
      if (!isEditMode) await dispatchWebhook(leadPayload);
      
    } catch (err: any) {
      alert("Erro ao salvar no Supabase: " + (err.message || "Tente novamente"));
      console.error("Erro no salvamento:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l && l.name && (
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (l.phone && l.phone.includes(searchTerm))
    );
    const matchesCategory = filterCategory === '' || l.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white tracking-tight">Gestão de Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Controle de oportunidades e carteira.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <Plus size={18} /> NOVO CLIENTE
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 relative w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou telefone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium shadow-sm"
          />
        </div>
        
        {/* Modo Rolante de Categorias para Filtro */}
        <div className="w-full md:w-auto overflow-x-auto scrollbar-hide py-2">
          <div className="flex items-center gap-2 whitespace-nowrap px-1">
            <button 
              onClick={() => setFilterCategory('')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterCategory === '' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'}`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${filterCategory === cat.id ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}
                style={filterCategory === cat.id ? {} : { borderColor: cat.color + '40' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm min-h-[500px]">
          {loading && leads.length === 0 ? (
            <div className="flex items-center justify-center h-full py-20">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-300 dark:text-slate-700">
              <Users size={64} className="mb-4 opacity-20" />
              <p className="font-black text-xs uppercase tracking-widest">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                    <th className="px-8 py-5">Cliente / Valor</th>
                    <th className="px-6 py-5">Categoria</th>
                    <th className="px-6 py-5 text-right">Expiração</th>
                    <th className="px-8 py-5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => setSelectedLead(lead)}
                      className={`cursor-pointer group transition-all ${selectedLead?.id === lead.id ? 'bg-indigo-50/10 dark:bg-indigo-500/5 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'}`}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-900 dark:text-white text-sm">{lead.name}</p>
                          {/* Wrap CheckCircle in a span to provide the title tooltip, as Lucide icons may have strict types without 'title' */}
                          {(lead.id.length > 30 || lead.seller_id === DEMO_USER_ID) && (
                            <span title="Sincronizado">
                              <CheckCircle size={12} className="text-emerald-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-0.5">
                          R$ {Number(lead.estimated_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        {lead.categories ? (
                          <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md" style={{ backgroundColor: lead.categories.color + '20', color: lead.categories.color }}>
                            {lead.categories.name}
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase">Geral</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className={`text-xs font-black ${lead.expiration_date && new Date(lead.expiration_date) < new Date() ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                          {lead.expiration_date ? new Date(lead.expiration_date).toLocaleDateString('pt-BR') : '--'}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <ChevronRight size={18} className="text-slate-300 transition-transform group-hover:translate-x-1" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-8 sticky top-6 h-fit">
          {selectedLead ? (
             <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black dark:text-white break-words">{selectedLead.name}</h3>
                    <p className="text-indigo-600 font-black text-lg">R$ {Number(selectedLead.estimated_value || 0).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl shrink-0">
                    <DollarSign size={24} />
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone</p>
                      <p className="text-xs font-bold dark:text-white">{selectedLead.phone || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiração do Plano</p>
                      <p className={`text-xs font-bold ${selectedLead.expiration_date && new Date(selectedLead.expiration_date) < new Date() ? 'text-rose-600' : 'dark:text-white'}`}>
                        {selectedLead.expiration_date ? new Date(selectedLead.expiration_date).toLocaleDateString('pt-BR') : 'Sem data'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleOpenEdit(selectedLead)}
                    className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black py-4 rounded-2xl transition-all active:scale-95"
                  >
                    <Edit3 size={18} /> EDITAR
                  </button>
                  <button 
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 font-black py-4 rounded-2xl transition-all active:scale-95"
                  >
                    <Trash2 size={18} /> EXCLUIR
                  </button>
                </div>

                <button 
                  onClick={() => dispatchWebhook(selectedLead)}
                  className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send size={18} /> REENVIAR WEBHOOK
                </button>
             </div>
          ) : (
            <div className="text-center py-20 opacity-30 flex flex-col items-center">
              <Users size={64} className="mb-4" />
              <p className="font-black text-xs uppercase tracking-widest">Selecione um cliente para gerenciar</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto scrollbar-hide">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-rose-500 p-2"><X size={24} /></button>
            <h2 className="text-2xl font-black dark:text-white mb-8 tracking-tight">{isEditMode ? 'Editar Cadastro de Cliente' : 'Novo Cliente Nexus'}</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome Completo / Razão Social *</label>
                <input required placeholder="Ex: Edson Pereira" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Valor do Contrato (R$)</label>
                  <input required type="number" step="0.01" placeholder="0,00" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold dark:text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Vencimento do Plano</label>
                  <input type="date" value={formData.expiration_date} onChange={e => setFormData({...formData, expiration_date: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Telefone Principal</label>
                  <input placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold dark:text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">E-mail</label>
                  <input type="email" placeholder="contato@empresa.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold dark:text-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoria do Cliente</label>
                <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm dark:text-white appearance-none">
                  <option value="">Geral / Sem Categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <button disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-4">
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <>{isEditMode ? 'ATUALIZAR CLIENTE' : 'SALVAR NO SUPABASE'} <ChevronRight size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
