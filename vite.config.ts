import { defineConfig } from 'vite';

export default defineConfig({
  // public 폴더(정적 파일: manifest.json, popup.html)를 dist/로 복사
  publicDir: 'public',

  build: {
    // 최종 산출물이 들어갈 폴더
    outDir: 'dist',

    rollupOptions: {
      // entry points: background.ts, contentScript.ts, popup.ts
      input: {
        background: 'src/background.ts',
        contentScript: 'src/contentScript.ts',
        popup: 'src/popup/popup.ts'
      },
      output: {
        // 번들된 JS는 dist/assets/[name].js 에 저장
        entryFileNames: 'assets/[name].js'
      }
    }
  }
});
