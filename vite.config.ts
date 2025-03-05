import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  base: '/', // This is CRUCIAL for Amplify

  plugins: [react()],
})
