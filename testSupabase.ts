import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function run() {
  console.log('🔐 Fazendo login...')

  const { data: loginData, error: loginError } =
    await supabase.auth.signInWithPassword({
      email: 'Edsonpereira30110@gmail.com',
      password: 'Edson3009@'
    })

  if (loginError) {
    console.error('❌ Erro no login:', loginError)
    return
  }

  const user = loginData.user
  console.log('✅ Logado com sucesso:', user.id)

  console.log('📌 Criando profile...')

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      full_name: 'Edson Pereira',
      role: 'admin'
    })

  if (profileError) {
    console.error('❌ Erro ao criar profile:', profileError)
    return
  }

  console.log('🎉 Perfil criado com sucesso!')
}

run()
