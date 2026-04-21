import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Throwaway variant: proxy validation to production lextension.net.
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  try {
    const res = await fetch('https://lextension.net/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Proxy failed' }, { status: 502 });
  }
};
