import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          about: path.resolve(__dirname, 'about.html'),
          articles: path.resolve(__dirname, 'articles.html'),
          gallery: path.resolve(__dirname, 'gallery.html'),
          donation: path.resolve(__dirname, 'donation.html'),
          contact: path.resolve(__dirname, 'contact.html'),
          adminLogin: path.resolve(__dirname, 'admin-login.html'),
          adminDashboard: path.resolve(__dirname, 'admin-dashboard.html'),
          accounts: path.resolve(__dirname, 'accounts.html'),
          manageArticles: path.resolve(__dirname, 'manage-articles.html'),
          manageGallery: path.resolve(__dirname, 'manage-gallery.html'),
          manageAdmins: path.resolve(__dirname, 'manage-admins.html'),
          manageVideos: path.resolve(__dirname, 'manage-videos.html'),
          settings: path.resolve(__dirname, 'settings.html'),
        },
      },
    },
  };
});
