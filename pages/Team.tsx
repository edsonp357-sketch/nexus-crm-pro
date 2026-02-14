
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { Shield, User, Mail, Calendar, Loader2 } from 'lucide-react';

export const Team: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching team:', error);
    else setProfiles(data || []);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Equipe do Painel</h1>
        <p className="text-slate-500 dark:text-slate-400">Usuários cadastrados no sistema Nexus.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
          </div>
        ) : profiles.map((p) => (
          <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                {p.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-bold dark:text-white">{p.full_name || 'Usuário Sem Nome'}</h3>
                <div className="flex items-center gap-1 text-xs">
                  {p.role === 'admin' ? (
                    <span className="flex items-center gap-1 text-amber-500 font-bold uppercase tracking-wider">
                      <Shield size={12} /> Administrador
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-indigo-500 font-bold uppercase tracking-wider">
                      <User size={12} /> Vendedor
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Mail size={14} /> {p.email}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} /> Membro desde {new Date(p.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
