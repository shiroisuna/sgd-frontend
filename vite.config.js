import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/sgd/',
  server: {
    port: 8080,
    strictPort: true,   // si el 8080 está ocupado, falla en vez de cambiar de puerto sin avisar
    // host: true,      // descomenta si otros equipos de la red deben abrirlo por IP
  },
  preview: {
    port: 8080,         // para `npm run preview` (el build ya compilado)
    strictPort: true,
  },
})