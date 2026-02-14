
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Building2, MapPin, Phone, Mail, 
  ChevronRight, Loader2, X, Briefcase, Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Company } from '../types';

export const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newCompany, setNewCompany] = useState({ 
    name: '', cnpj: '', phone: '', email: '', address: '' 
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (!error) setCompanies(data || []);
    setLoading(false);
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { data, error } = await supabase
      .from('companies')
      .insert([newCompany])
      .select()
      .single();

    if (!error) {
      setCompanies(prev => [...prev, data]);
      setIsModalOpen(false);
      setNewCompany({ name: '', cnpj: '', phone: '', email: '', address: '' });
    }
    setIsSubmitting(false);
  };

  const deleteCompany = async (id: string) => {
    if (!confirm('Excluir esta empresa? Isso não removerá os leads vinculados, mas o vínculo será perdido.')) return;
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (!error) setCompanies(prev => prev.filter(c => c.id !== id));
  };

  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.cnpj && c.cnpj.includes(searchTerm))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white">Empresas & Contas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Centralize as informações das organizações que você atende.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <Plus size={18} /> Nova Empresa
        </button>
      </div>

      <div className="flex-1 relative group max-w-xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Pesquisar por nome ou CNPJ..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-medium shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center text-center">
            <Briefcase size={64} className="text-slate-200 mb-6" />
            <h3 className="text-lg font-bold dark:text-white">Nenhuma empresa encontrada</h3>
            <p className="text-slate-400 text-sm">Comece adicionando as contas principais do seu negócio.</p>
          </div>
        ) : filtered.map((company) => (
          <div key={company.id} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <div className="h-14 w-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                <Building2 size={28} />
              </div>
              <button 
                onClick={() => deleteCompany(company.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <h3 className="text-lg font-black dark:text-white mb-1 truncate">{company.name}</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">CNPJ: {company.cnpj || 'Não informado'}</p>
            
            <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
              {company.email && (
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <Mail size={14} className="text-slate-300" /> {company.email}
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <Phone size={14} className="text-slate-300" /> {company.phone}
                </div>
              )}
              {company.address && (
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <MapPin size={14} className="text-slate-300" /> <span className="truncate">{company.address}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-indigo-600 p-2 transition-colors">
              <X size={28} />
            </button>
            
            <h2 className="text-2xl font-black dark:text-white mb-8 tracking-tight">Nova Empresa</h2>
            
            <form onSubmit={handleAddCompany} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Razão Social / Nome *</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={newCompany.name}
                  onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold"
                  placeholder="Ex: Nexus Tech LTDA"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">CNPJ</label>
                  <input 
                    type="text" 
                    value={newCompany.cnpj}
                    onChange={e => setNewCompany({...newCompany, cnpj: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium text-sm"
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Telefone</label>
                  <input 
                    type="text" 
                    value={newCompany.phone}
                    onChange={e => setNewCompany({...newCompany, phone: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium text-sm"
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Endereço</label>
                <input 
                  type="text" 
                  value={newCompany.address}
                  onChange={e => setNewCompany({...newCompany, address: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium text-sm"
                  placeholder="Rua, Número, Bairro, Cidade"
                />
              </div>
              
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition-all flex justify-center mt-6 group shadow-xl shadow-indigo-600/20"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'SALVAR EMPRESA'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
