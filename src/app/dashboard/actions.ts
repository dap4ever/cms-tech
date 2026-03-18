'use server';

const PROXY_URL = 'https://clickup-proxy-production.up.railway.app';

export async function fetchClickUpData(endpoint: string, token: string) {
  if (!token) throw new Error('Token ClickUp não fornecido');
  
  const url = `${PROXY_URL}/proxy?token=${encodeURIComponent(token)}&path=${encodeURIComponent(endpoint)}`;
  
  try {
    const res = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      const err = await res.text();
      console.error('ClickUp Proxy Error:', res.status, err);
      return { error: `Erro no proxy ClickUp: ${res.status}`, detail: err };
    }
    
    return await res.json();
  } catch (e: any) {
    console.error('fetchClickUpData failed:', e.message);
    return { error: 'Falha na conexão com o proxy ClickUp', detail: e.message };
  }
}
