
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { Pipeline } from './pages/Pipeline';
import { Auth } from './pages/Auth';
import { Team } from './pages/Team';
import { Tasks } from './pages/Tasks';
import { Companies } from './pages/Companies';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Monitor } from './pages/Monitor';
import { Profile } from './types';
import { supabase, isSupabaseConfigured, getDemoProfile, DEMO_USER_ID } from './lib/supabase';
import { Loader2 } from 'lucide-react';

type AppPages = 'dashboard' | 'monitor' | 'leads' | 'pipeline' | 'team' | 'tasks' | 'companies' | 'reports' | 'settings';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppPages>('dashboard');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      const demoAuth = localStorage.getItem('nexus_demo_mode');
      if (demoAuth === 'true') {
        const demoEmail = localStorage.getItem('nexus_demo_email');
        const demoName = localStorage.getItem('nexus_demo_name');
        setSession({ user: { id: DEMO_USER_ID } });
        setProfile(getDemoProfile(demoEmail || undefined, demoName || undefined));
        setLoading(false);
        return;
      }

      const timeoutId = setTimeout(() => {
        if (loading) {
          setLoading(false);
        }
      }, 1500);

      try {
        if (isSupabaseConfigured()) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            setSession(currentSession);
            await fetchProfile(currentSession.user.id);
          }
        }
      } catch (err) {
        console.error('Nexus Engine: Erro silencioso na inicialização.');
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('nexus_demo_mode') !== 'true') {
        setSession(session);
        if (session) fetchProfile(session.user.id);
        else setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) setProfile(data);
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('nexus_demo_mode');
    localStorage.removeItem('nexus_demo_email');
    localStorage.removeItem('nexus_demo_name');
    try { await supabase.auth.signOut(); } catch (e) {}
    setSession(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative mb-6">
          <Loader2 className="animate-spin text-indigo-600" size={56} />
          <div className="absolute inset-0 blur-2xl bg-indigo-600/10 rounded-full animate-pulse"></div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Autenticando Nexus Engine...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'monitor': return <Monitor />;
      case 'leads': return <Leads user={profile} />;
      case 'pipeline': return <Pipeline />;
      case 'team': return <Team />;
      case 'tasks': return <Tasks user={profile} />;
      case 'companies': return <Companies />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings user={profile} />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout 
      user={profile} 
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
      onLogout={handleLogout}
    >
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
        {renderPage()}
      </div>
    </Layout>
  );
};

export default App;
