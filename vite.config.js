import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        games: resolve(__dirname, 'games.html'),
        leaderboard: resolve(__dirname, 'leaderboard.html'),
        profile: resolve(__dirname, 'profile.html'),
        docs: resolve(__dirname, 'docs.html'),
      },
    },
  },
  plugins: [
    {
      name: 'copy-static-js-assets',
      closeBundle() {
        const src = resolve(__dirname, 'assets/js');
        const dest = resolve(__dirname, 'dist/assets/js');
        
        const copyRecursive = (srcDir, destDir) => {
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          const items = fs.readdirSync(srcDir);
          items.forEach(item => {
            const srcItem = resolve(srcDir, item);
            const destItem = resolve(destDir, item);
            const stat = fs.statSync(srcItem);
            if (stat.isDirectory()) {
              copyRecursive(srcItem, destItem);
            } else {
              fs.copyFileSync(srcItem, destItem);
            }
          });
        };
        
        if (fs.existsSync(src)) {
          copyRecursive(src, dest);
          console.log('Successfully copied assets/js directory to dist/assets/js for deployment!');
        }
      },
    },
  ],
});
