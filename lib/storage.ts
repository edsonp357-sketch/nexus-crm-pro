
import { Lead, Category, Task, Company } from '../types';

const KEYS = {
  LEADS: 'nexus_leads_data',
  CATEGORIES: 'nexus_categories_data',
  COMPANIES: 'nexus_companies_data',
  TASKS: 'nexus_tasks_data',
  DELETED_LEADS: 'nexus_deleted_leads_ids' // Tombstone para evitar ressincronização de deletados
};

const getLocal = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Erro ao ler ${key}:`, e);
    return [];
  }
};

const saveLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Erro ao salvar ${key}:`, e);
  }
};

export const StorageEngine = {
  getLeads: (): Lead[] => {
    const leads = getLocal<Lead>(KEYS.LEADS);
    const deletedIds = new Set(getLocal<string>(KEYS.DELETED_LEADS));
    return leads.filter(l => l && l.id && !deletedIds.has(l.id));
  },
  
  mergeLeads: (remoteLeads: Lead[]): Lead[] => {
    const localLeads = StorageEngine.getLeads();
    const deletedIds = new Set(getLocal<string>(KEYS.DELETED_LEADS));
    const leadsMap = new Map<string, Lead>();
    
    // 1. Processa leads locais (já filtrados por deletados)
    localLeads.forEach(l => {
      if (l && l.id) leadsMap.set(l.id, l);
    });
    
    // 2. Processa leads remotos, ignorando os que foram marcados para exclusão localmente
    remoteLeads.forEach(l => {
      if (l && l.id && !deletedIds.has(l.id)) {
        leadsMap.set(l.id, l);
      }
    });
    
    const merged = Array.from(leadsMap.values());
    return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  syncLeads: (leads: Lead[]) => {
    const merged = StorageEngine.mergeLeads(leads);
    saveLocal(KEYS.LEADS, merged);
    return merged;
  },

  saveLead: (lead: Lead) => {
    const leads = getLocal<Lead>(KEYS.LEADS);
    const updated = [lead, ...leads.filter(l => l && l.id !== lead.id)];
    saveLocal(KEYS.LEADS, updated);
    
    // Remove do tombstone se estiver sendo "recriado" ou atualizado
    const deletedIds = getLocal<string>(KEYS.DELETED_LEADS).filter(id => id !== lead.id);
    saveLocal(KEYS.DELETED_LEADS, deletedIds);
    
    return lead;
  },

  updateLead: (id: string, updates: Partial<Lead>) => {
    const leads = getLocal<Lead>(KEYS.LEADS);
    const updated = leads.map(l => l && l.id === id ? { ...l, ...updates } : l);
    saveLocal(KEYS.LEADS, updated);
  },

  deleteLead: (id: string) => {
    // 1. Remove da lista principal
    const leads = getLocal<Lead>(KEYS.LEADS).filter(l => l && l.id !== id);
    saveLocal(KEYS.LEADS, leads);

    // 2. Adiciona ao tombstone para o sync não trazer de volta
    const deletedIds = getLocal<string>(KEYS.DELETED_LEADS);
    if (!deletedIds.includes(id)) {
      saveLocal(KEYS.DELETED_LEADS, [...deletedIds, id]);
    }
  },

  getCategories: (): Category[] => {
    const cats = getLocal<Category>(KEYS.CATEGORIES);
    if (cats.length === 0) {
      const defaults: Category[] = [
        { id: '1', name: 'VIP', color: '#f59e0b' },
        { id: '2', name: 'Recorrente', color: '#10b981' },
        { id: '3', name: 'Projeto', color: '#8b5cf6' }
      ];
      saveLocal(KEYS.CATEGORIES, defaults);
      return defaults;
    }
    return cats;
  },

  saveCategory: (cat: Category) => {
    const cats = StorageEngine.getCategories();
    const updated = [...cats, cat];
    saveLocal(KEYS.CATEGORIES, updated);
    return cat;
  },

  deleteCategory: (id: string) => {
    const cats = StorageEngine.getCategories().filter(c => c.id !== id);
    saveLocal(KEYS.CATEGORIES, cats);
  }
};
