import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // 👈 This is critical for Amplify!

  plugins: [react()],
})
