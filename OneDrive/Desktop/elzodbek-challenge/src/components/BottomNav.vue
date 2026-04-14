<template>
  <nav class="bottom-nav">
    <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="nav-item">
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-label">{{ t(item.label) }}</span>
    </router-link>

    <!-- Theme toggle -->
    <button class="nav-item nav-theme" @click="$emit('toggle-theme')">
      <span class="nav-icon">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
      <span class="nav-label">{{ theme === 'dark' ? 'Light' : 'Dark' }}</span>
    </button>

    <router-link v-if="auth.isAdmin" to="/admin" class="nav-item nav-admin">
      <span class="nav-icon">🛡️</span>
      <span class="nav-label">Admin</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.js'

defineProps(['theme'])
defineEmits(['toggle-theme'])

const { t } = useI18n()
const auth = useAuthStore()

const navItems = [
  { path: '/today',     icon: '⚡',  label: 'nav.today' },
  { path: '/calendar',  icon: '📅',  label: 'nav.calendar' },
  { path: '/nutrition', icon: '🍽️', label: 'nav.nutrition' },
  { path: '/stats',     icon: '📊',  label: 'nav.stats' },
  { path: '/profile',   icon: '👤',  label: 'nav.profile' },
]
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: var(--surface);
  border-top: 1px solid var(--border);
  display: flex;
  padding: 6px 4px;
  padding-bottom: calc(6px + env(safe-area-inset-bottom));
  z-index: 100;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  transition: background 0.3s, border-color 0.3s;
  height: var(--nav-h);
}

/* Hide on desktop */
@media (min-width: 768px) {
  .bottom-nav { display: none; }
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 4px 2px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text-dim);
  transition: all 0.2s;
  border: none;
  background: none;
  cursor: pointer;
  font-family: var(--font-body);
  min-width: 0;
}

.nav-item:hover, .nav-item.router-link-active {
  color: var(--accent-light);
}
[data-theme="light"] .nav-item.router-link-active {
  color: var(--accent);
}

.nav-item.router-link-active .nav-icon {
  transform: scale(1.15);
}

.nav-icon { font-size: 18px; transition: transform 0.2s; line-height: 1; }
.nav-label { font-size: 10px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }

.nav-admin { color: #f59e0b; }
.nav-theme { }
</style>
