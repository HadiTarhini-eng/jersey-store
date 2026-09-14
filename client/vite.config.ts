import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * VITE_* values are inlined into the JavaScript every visitor downloads. Refuse
 * to build if the Supabase key is a secret/service-role key instead of the
 * publishable (sb_publishable_…) or legacy anon key.
 */
function assertPublicSupabaseKey(key: string | undefined) {
  if (!key) return
  let role: unknown
  const payload = key.split('.')[1]
  if (payload) {
    try { role = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).role } catch { /* not a JWT */ }
  }
  if (key.startsWith('sb_secret_') || role === 'service_role') {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY contains a Supabase SECRET key. VITE_* variables are shipped to every browser — ' +
      'use the publishable (sb_publishable_…) or anon key instead.',
    )
  }
}

export default defineConfig(({ mode }) => {
  assertPublicSupabaseKey(loadEnv(mode, process.cwd(), 'VITE_').VITE_SUPABASE_ANON_KEY)

  return {
    plugins: [react()],
    resolve: {
      // '@/' alias maps to 'src/' — use in all imports instead of relative paths
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // Placeholder values so modules that build the Supabase client can load;
      // tests never reach the network.
      env: {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    },
  }
})
