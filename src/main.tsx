import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // 👈 Importa o App verdadeiro

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
