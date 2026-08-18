import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // O Capacitor empacota o conteúdo de `dist` dentro do APK, servindo tudo a
  // partir da raiz do webview — por isso os caminhos precisam ser relativos.
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5180,
    // A maquininha e o computador ficam na mesma rede durante os testes.
    host: true,
  },
});
