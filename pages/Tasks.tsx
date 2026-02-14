
import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Clock, CheckCircle2, Circle, AlertCircle, 
  Trash2, Filter, Loader2, Inbox, ChevronRight, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Task, Profile } from '../types';

interface TasksProps {
  user: Profile | null;
}

export const Tasks: React.FC<TasksProps> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    due_date: '', 
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*, lead:leads(name)')
      .eq('user_id', user?.id)
      .order('due_date', { ascending: true });

    if (!error) setTasks(data || []);
    setLoading(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        ...newTask,
        user_id: user.id,
        status: 'pending'
      }])
      .select()
      .single();

    if (!error) {
      setTasks(prev => [...prev, data]);
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', due_date: '', priority: 'medium' });
    }
    setIsSubmitting(false);
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);

    if (!error) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10';
      case 'medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10';
      default: return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white">Minhas Tarefas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Organize seu dia e nunca perca um follow-up.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <Plus size={18} /> Nova Tarefa
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center text-center">
              <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-xl font-black dark:text-white">Tudo em dia!</h3>
              <p className="text-slate-500 max-w-xs mt-2 font-medium">Você não tem tarefas pendentes. Aproveite para prospectar novos leads.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  className={`group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md ${task.status === 'completed' ? 'opacity-60' : ''}`}
                >
                  <button 
                    onClick={() => toggleTaskStatus(task)}
                    className={`shrink-0 transition-colors ${task.status === 'completed' ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-600'}`}
                  >
                    {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm dark:text-white truncate ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                        <Calendar size={12} />
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'Sem data'}
                      </div>
                      {task.lead_id && (
                        <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-black uppercase">
                          <Plus size={10} /> {(task as any).lead?.name || 'Lead'}
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-black dark:text-white uppercase tracking-widest mb-4">Resumo Semanal</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">Pendentes</span>
                <span className="text-sm font-black dark:text-white">{tasks.filter(t => t.status === 'pending').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">Concluídas</span>
                <span className="text-sm font-black text-emerald-500">{tasks.filter(t => t.status === 'completed').length}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-1000" 
                  style={{ width: `${(tasks.filter(t => t.status === 'completed').length / (tasks.length || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-600/20">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={20} />
              <h3 className="text-sm font-black uppercase tracking-widest">Dica da Nexus</h3>
            </div>
            <p className="text-xs leading-relaxed font-medium text-indigo-100">
              Leads analisados pela IA que possuem tarefas atrasadas têm 40% menos chance de conversão. Mantenha seu pipeline limpo!
            </p>
          </div>
        </div>
      </div>

      {/* Modal Nova Tarefa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-indigo-600 p-2 transition-colors">
              <X size={28} />
            </button>
            
            <div className="mb-8">
              <h2 className="text-2xl font-black dark:text-white tracking-tight">Agendar Tarefa</h2>
              <p className="text-slate-500 text-sm mt-1">Defina o que precisa ser feito.</p>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">O que deve ser feito? *</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold"
                  placeholder="Ex: Ligar para confirmar proposta"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Prazo</label>
                  <input 
                    type="date" 
                    value={newTask.due_date}
                    onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Prioridade</label>
                  <select 
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium text-sm"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition-all flex justify-center mt-4 group shadow-xl shadow-indigo-600/20"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'CRIAR TAREFA'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
