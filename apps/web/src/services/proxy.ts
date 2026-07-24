import { RequestConfig, ProxyResponse } from '@apilot/shared';
import { apiUrl } from '../utils/apiUrl';

export async function sendProxyRequest(config: RequestConfig): Promise<ProxyResponse> {
  const response = await fetch(apiUrl('/api/proxy'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
