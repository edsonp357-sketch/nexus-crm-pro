
import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from "../types";

export const getAILeadAnalysis = async (lead: Lead) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analise este lead para um sistema CRM B2B de alta performance:
      Nome/Empresa: ${lead.name}
      Estágio Atual: ${lead.status}
      Valor Estimado: R$ ${lead.estimated_value}
      E-mail: ${lead.email || 'Não informado'}
      Data de Criação: ${lead.created_at}
      
      Forneça um JSON com:
      1. score: Probabilidade de conversão (0-100).
      2. reason: Uma análise persuasiva e estratégica (máximo 150 caracteres).
      3. nextSteps: Lista de 3 ações práticas imediatas para o vendedor acelerar o fechamento.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reason: { type: Type.STRING },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["score", "reason", "nextSteps"]
        }
      }
    });

    const jsonStr = response.text?.trim();
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch (error) {
    console.error("Erro na análise Nexus AI:", error);
    return null;
  }
};

export const getBusinessDiagnostic = async (stats: any) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Aja como um Diretor Comercial (VP of Sales). Analise os seguintes KPIs mensais do CRM e forneça um diagnóstico estratégico curto:
      Receita Total: R$ ${stats.totalRevenue}
      Taxa de Conversão: ${stats.conversionRate}%
      Ticket Médio: R$ ${stats.averageTicket}
      Leads Ativos: ${stats.activeLeads}
      
      Estruture a resposta em 3 pontos: Forças, Fraquezas e 1 Ação Imediata.`,
      config: {
        // Disabling thinking to ensure response is generated without consuming budget in this short task
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.7
      }
    });

    return response.text;
  } catch (error) {
    return "Não foi possível gerar o diagnóstico de IA no momento.";
  }
};
