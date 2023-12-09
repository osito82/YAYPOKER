// src/router.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from './pages/Home.vue'
import About from './pages/About.vue'

const routes = [
  {
    path: '/',
 //   component: () => import('./pages/Home.vue'),
 component:Home
  },
  {
    path: '/about',
 ///   component: () => import('./pages/About.vue'),
 component:About
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
