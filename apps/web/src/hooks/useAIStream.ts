import { useState, useCallback } from 'react';
import { apiUrl } from '../utils/apiUrl';

export function useAIStream() {
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stream = useCallback(async (endpoint: string, payload: unknown) => {
    setOutput('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl(`/api/ai/${endpoint}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) setOutput((prev) => prev + parsed.text);
              if (parsed.error) throw new Error(parsed.error);
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setOutput('');
    setError(null);
  }, []);

  return { output, isLoading, error, stream, reset };
}
