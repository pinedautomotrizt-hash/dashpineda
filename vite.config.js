import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  preview: {
    host: true,
    // Railway sirve el preview detras de su propio dominio (Host header
    // distinto de localhost); sin esto, vite preview responde 403 a todo.
    allowedHosts: ['.up.railway.app'],
  },
});
