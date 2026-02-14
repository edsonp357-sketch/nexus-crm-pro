
import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Bell, Moon, Sun, 
  Settings as SettingsIcon, Save, Camera, 
  Lock, Globe, ShieldCheck, Mail, Loader2, Link as LinkIcon, Server, Trash2, CheckCircle2, Tag, Plus
} from 'lucide-react';
import { Profile, Category } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getWebhooks, saveWebhooks, WebhookConfig } from '../lib/webhook';
import { StorageEngine } from '../lib/storage';

interface SettingsProps {
  user: Profile | null;
}

export const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [isSyncingCats, setIsSyncingCats] = useState(false);
  
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);

  useEffect(() => {
    setWebhooks(getWebhooks());
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsSyncingCats(true);
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (data && !error) {
        setCategories(data);
        localStorage.setItem('nexus_categories_data', JSON.stringify(data));
      } else {
        setCategories(StorageEngine.getCategories());
      }
    } else {
      setCategories(StorageEngine.getCategories());
    }
    setIsSyncingCats(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      if (error) alert("Erro: " + error.message);
      else alert("Perfil atualizado no Supabase!");
    } else {
       alert("Perfil atualizado localmente (Modo Demo)!");
    }
    setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCatName) return;
    const newCat = {
      id: crypto.randomUUID(),
      name: newCatName,
      color: newCatColor
    };
    
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('categories').insert([newCat]);
        if (error) throw error;
      }
      
      StorageEngine.saveCategory(newCat);
      setCategories([...categories, newCat]);
      setNewCatName('');
      setNewCatColor('#6366f1');
    } catch (err: any) {
      alert("Falha ao salvar categoria no Supabase: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Excluir esta categoria definitivamente?")) return;
    
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
      }
      
      StorageEngine.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err: any) {
      alert("Falha ao excluir categoria: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black dark:text-white tracking-tight">Painel de Controle</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Configurações e personalização da Nexus Engine.</p>
        </div>
        {user?.role === 'admin' && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
            <ShieldCheck size={14} /> Administrador Autenticado
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Categorias - Modo Rolante e Supabase Sync */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black dark:text-white mb-1 flex items-center gap-3">
                  <Tag size={24} className="text-indigo-600" /> Categorias de Clientes
                </h3>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Sincronizado com Supabase</p>
              </div>
              {isSyncingCats && <Loader2 className="animate-spin text-indigo-600" size={20} />}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
              <div className="flex-1 space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nome da Categoria</label>
                <input 
                  placeholder="Ex: VIP, Recorrente, Trial" 
                  value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-bold dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cor</label>
                <input 
                  type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)}
                  className="w-16 h-[46px] rounded-xl cursor-pointer border-2 border-white dark:border-slate-800 bg-transparent p-1"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleAddCategory}
                  disabled={loading}
                  className="h-[46px] px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-[10px] uppercase shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={14} /> : 'CRIAR CATEGORIA'}
                </button>
              </div>
            </div>

            {/* Listagem de Categorias - Modo Rolante se necessário */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Gerenciar Categorias Ativas:</h4>
               <div className="flex flex-wrap gap-3 overflow-x-auto pb-4 scrollbar-hide">
                 {categories.length === 0 ? (
                   <div className="w-full py-10 text-center opacity-30 italic text-xs font-bold uppercase tracking-widest">Nenhuma categoria cadastrada no banco.</div>
                 ) : categories.map(c => (
                   <div key={c.id} className="flex-shrink-0 flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-indigo-500 transition-all shadow-sm">
                      <div className="h-4 w-4 rounded-full shadow-inner" style={{ backgroundColor: c.color }} />
                      <span className="text-xs font-black dark:text-white uppercase tracking-tight">{c.name}</span>
                      <button 
                        onClick={() => deleteCategory(c.id)} 
                        className="text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                   </div>
                 ))}
               </div>
            </div>
          </section>

          {/* Perfil de Administrador */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-black dark:text-white mb-8 flex items-center gap-3">
              <User size={24} className="text-indigo-600" /> Perfil de Administrador Nexus
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome Completo</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">E-mail Corporativo</label>
                  <input type="text" disabled value={user?.email} className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 font-bold" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={loading} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black rounded-2xl flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all uppercase text-xs">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} SALVAR NO SUPABASE
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="space-y-8">
           <section className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-2xl shadow-indigo-600/30">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck size={28} />
                <h4 className="text-sm font-black uppercase tracking-widest">Nexus Core Security</h4>
              </div>
              <div className="space-y-4">
                 <div className="p-5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <p className="text-[9px] font-black opacity-60 uppercase mb-1 tracking-widest">Status da Nuvem</p>
                    <p className="text-sm font-black flex items-center gap-2">
                       <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                       SUPABASE ONLINE
                    </p>
                 </div>
                 <p className="text-[10px] leading-relaxed opacity-70 font-bold uppercase tracking-tight">
                   Todas as operações de Clientes e Categorias estão sendo persistidas em tempo real no banco de dados Supabase.
                 </p>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};
