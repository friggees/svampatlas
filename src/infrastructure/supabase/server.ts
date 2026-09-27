import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabasePublishableKey, supabaseUrl } from './config';

export async function createClient() {
  const jar = await cookies();
  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: values => {
        try {
          values.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          /* Server Components cannot set cookies; proxy refreshes them. */
        }
      },
    },
  });
}
