import { createClient } from '@supabase/supabase-js';

const getSafeEnv = (key: string): string => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[key]) || 
           (typeof window !== 'undefined' && (window as any)._env_ && (window as any)._env_[key]) || 
           '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getSafeEnv('VITE_SUPABASE_URL') || getSafeEnv('SUPABASE_URL');
const supabaseAnonKey = getSafeEnv('VITE_SUPABASE_ANON_KEY') || getSafeEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = () => {
  const url = getSafeEnv('VITE_SUPABASE_URL') || getSafeEnv('SUPABASE_URL');
  const key = getSafeEnv('VITE_SUPABASE_ANON_KEY') || getSafeEnv('SUPABASE_ANON_KEY');
  return !!url && !!key && !url.includes('placeholder') && url !== 'https://placeholder.supabase.co';
};

// Criação do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// UUID Válido para o modo demo para evitar erros de tipo UUID no Postgres
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

// Função para retornar um perfil demo
export const getDemoProfile = (email?: string, name?: string) => ({
  id: DEMO_USER_ID,
  full_name: name || 'Edson Pereira',
  email: email || 'Edsonpereira30110@gmail.com',
  role: 'admin' as const,
  created_at: new Date().toISOString()
});

// Função para inserir um novo perfil no banco de dados
export const insertProfile = async (userId: string, name: string, email: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert([
        {
          id: userId, 
          full_name: name,
          email: email,
          created_at: new Date().toISOString()
        }
      ], { onConflict: ['id'] }); // Utilizando upsert para garantir que o perfil não seja duplicado
    
    if (error) {
      console.error('Erro ao inserir perfil:', error.message);
    } else {
      console.log('Perfil inserido/atualizado com sucesso:', data);
    }
  } catch (err) {
    console.error('Erro inesperado ao inserir perfil:', err);
  }
};

// Exemplo de uso (passando um ID, nome e e-mail de exemplo)
insertProfile('new-user-id', 'Novo Usuário', 'novousuario@dominio.com');
