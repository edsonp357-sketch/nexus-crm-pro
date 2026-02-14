import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

console.log("URL:", import.meta.env.VITE_SUPABASE_URL)

async function teste() {
  const { data, error } = await supabase.from('leads').select('*')
  console.log("DATA:", data)
  console.log("ERROR:", error)
}

teste()

function App() {
  return <h1>Projeto Nexus funcionando!</h1>
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<App />)
