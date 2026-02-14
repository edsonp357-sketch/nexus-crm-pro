
export interface WebhookConfig {
  id: string;
  url: string;
  active: boolean;
  name: string;
}

export const getWebhooks = (): WebhookConfig[] => {
  const saved = localStorage.getItem('nexus_webhooks');
  return saved ? JSON.parse(saved) : [];
};

export const saveWebhooks = (webhooks: WebhookConfig[]) => {
  localStorage.setItem('nexus_webhooks', JSON.stringify(webhooks));
};

export const dispatchWebhook = async (leadData: any) => {
  const webhooks = getWebhooks().filter(w => w.active);
  
  const payload = {
    event: 'lead.created',
    timestamp: new Date().toISOString(),
    data: {
      id: leadData.id,
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      document: leadData.document, // CPF/CNPJ
      value: leadData.estimated_value,
      created_at: leadData.created_at
    }
  };

  const results = await Promise.allSettled(
    webhooks.map(webhook => 
      fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    )
  );

  console.log('Nexus Webhook Dispatch:', results);
  return results;
};
