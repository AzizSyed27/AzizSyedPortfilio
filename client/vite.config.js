import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Serve the MediaPipe WASM runtime locally (no runtime CDN load) and keep
    // it version-locked to the installed @mediapipe/tasks-vision package.
    viteStaticCopy({
      targets: [
        { src: 'node_modules/@mediapipe/tasks-vision/wasm/*', dest: 'mediapipe/wasm' },
      ],
    }),
  ],
})
