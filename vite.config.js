import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/marketing_newbie/',
  server: {
    proxy: {
      '/api/seedream': {
        target: 'https://ark.ap-southeast.bytepluses.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/seedream/, '/api/v3/images/generations'),
        headers: {
          'Origin': 'https://ark.ap-southeast.bytepluses.com'
        }
      }
    }
  }
})

