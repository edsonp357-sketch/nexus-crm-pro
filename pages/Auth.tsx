
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  BrainCircuit, 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Zap
} from 'lucide-react';

type AuthView = 'signIn' | 'signUp' | 'forgotPassword';

export const Auth: React.FC = () => {
  const [view, setView] = useState<AuthView>('signIn');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados inicializados vazios para segurança e melhor UX
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleDemoLogin = (customEmail?: string, customName?: string) => {
    localStorage.setItem('nexus_demo_mode', 'true');
    localStorage.setItem('nexus_demo_email', customEmail || email || 'demo@nexuspro.com');
    localStorage.setItem('nexus_demo_name', customName || fullName || 'Usuário Demo');
    // Forçar atualização imediata para o App.tsx capturar
    window.location.href = window.location.origin + window.location.pathname;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const inputEmail = email.toLowerCase().trim();
    const inputPass = password.trim();

    // VALIDAÇÃO PARA ACESSO ESPECIAL DO ADMINISTRADOR (Se digitado manualmente)
    if (inputEmail === 'edsonpereira30110@gmail.com' && inputPass === 'Edson3009@') {
      handleDemoLogin('Edsonpereira30110@gmail.com', 'Edson Pereira');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("Banco de dados não configurado. Utilize o modo Demonstração para testar as funcionalidades.");
      setLoading(false);
      return;
    }

    try {
      if (view === 'signIn') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email: inputEmail, 
          password: inputPass 
        });
        if (signInError) throw signInError;
      } else if (view === 'signUp') {
        const { error: signUpError } = await supabase.auth.signUp({ 
          email: inputEmail, 
          password: inputPass, 
          options: { data: { full_name: fullName, role: 'admin' } } 
        });
        if (signUpError) throw signUpError;
        setSuccessMessage('Conta criada! Verifique seu email.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar. Verifique suas credenciais.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 bg-indigo-600 rounded-2xl items-center justify-center text-white shadow-xl shadow-indigo-600/20 mb-4 animate-float">
            <BrainCircuit size={32} />
          </div>
          <h1 className="text-3xl font-black dark:text-white tracking-tighter">Nexus CRM</h1>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">Enterprise Intelligence</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black dark:text-white">
              {view === 'signIn' ? 'Acessar Painel' : 'Criar Nova Conta'}
            </h2>
            <p className="text-[10px] text-indigo-500 font-bold uppercase mt-2 tracking-widest">Controle de Acesso</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {view === 'signUp' && (
              <div className="space-y-4">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold"
                  placeholder="Nome Completo"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold"
                placeholder="E-mail"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold"
                placeholder="Senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl border border-rose-100 dark:border-rose-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-white dark:text-slate-950 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : (
                <>
                  <span>{view === 'signIn' ? 'ENTRAR AGORA' : 'CADASTRAR'}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center space-y-4">
            <button
              onClick={() => handleDemoLogin()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 border-b-4 border-indigo-800"
            >
              <Zap size={18} />
              MODO DEMONSTRAÇÃO
            </button>
            
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {view === 'signIn' ? (
                <>Não tem uma conta? <button onClick={() => setView('signUp')} className="text-indigo-600">Cadastre-se</button></>
              ) : (
                <>Já possui conta? <button onClick={() => setView('signIn')} className="text-indigo-600">Entrar</button></>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
