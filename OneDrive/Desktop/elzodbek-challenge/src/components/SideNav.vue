<template>
  <aside class="sidenav" :class="{ collapsed: collapsed }">
    <!-- Logo -->
    <div class="sn-logo" @click="collapsed = !collapsed">
      <div class="logo-icon">GF</div>
      <transition name="sn-fade">
        <div v-if="!collapsed" class="logo-text">
          <span class="logo-name">GoalFlow</span>
          <span class="logo-sub">Challenge</span>
        </div>
      </transition>
    </div>

    <!-- Nav Items -->
    <nav class="sn-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="sn-item"
        :title="item.label"
      >
        <span class="sn-icon">{{ item.icon }}</span>
        <transition name="sn-fade">
          <span v-if="!collapsed" class="sn-label">{{ t(item.label) }}</span>
        </transition>
        <transition name="sn-fade">
          <span v-if="!collapsed && item.badge" class="sn-badge">{{ item.badge }}</span>
        </transition>
      </router-link>

      <!-- Admin link -->
      <router-link v-if="auth.isAdmin" to="/admin" class="sn-item sn-admin" title="Admin Panel">
        <span class="sn-icon">🛡️</span>
        <transition name="sn-fade">
          <span v-if="!collapsed" class="sn-label">Admin</span>
        </transition>
      </router-link>
    </nav>

    <!-- Bottom actions -->
    <div class="sn-bottom">
      <!-- Theme toggle -->
      <button class="sn-item sn-theme" @click="$emit('toggle-theme')" :title="theme === 'dark' ? 'Light mode' : 'Dark mode'">
        <span class="sn-icon">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
        <transition name="sn-fade">
          <span v-if="!collapsed" class="sn-label">{{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
        </transition>
      </button>

      <!-- User info -->
      <div class="sn-user" v-if="auth.profile">
        <div class="sn-avatar">{{ initials }}</div>
        <transition name="sn-fade">
          <div v-if="!collapsed" class="sn-user-info">
            <div class="sn-user-name">{{ auth.profile?.full_name?.split(' ')[0] || 'User' }}</div>
            <div class="sn-user-role">{{ roleLabel }}</div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Collapse toggle -->
    <button class="sn-collapse" @click="collapsed = !collapsed" :title="collapsed ? 'Expand' : 'Collapse'">
      <span>{{ collapsed ? '›' : '‹' }}</span>
    </button>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.js'

const props = defineProps(['theme'])
const emit = defineEmits(['toggle-theme'])

const { t } = useI18n()
const auth = useAuthStore()
const collapsed = ref(false)

const navItems = [
  { path: '/today',     icon: '⚡',  label: 'nav.today' },
  { path: '/calendar',  icon: '📅',  label: 'nav.calendar' },
  { path: '/nutrition', icon: '🍽️', label: 'nav.nutrition' },
  { path: '/stats',     icon: '📊',  label: 'nav.stats' },
  { path: '/schedule',  icon: '🕐',  label: 'nav.schedule' },
  { path: '/profile',   icon: '👤',  label: 'nav.profile' },
]

const initials = computed(() => {
  const n = auth.profile?.full_name || 'U'
  return n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()
})

const roleLabel = computed(() => {
  const r = auth.profile?.role
  return r === 'superadmin' ? '👑 SuperAdmin' : r === 'admin' ? '🛡️ Admin' : '👤 User'
})
</script>

<style scoped>
.sidenav {
  position: fixed;
  left: 0; top: 0; bottom: 0;
  width: var(--sidebar-w);
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: none;
  flex-direction: column;
  z-index: 200;
  transition: width 0.3s cubic-bezier(0.4,0,0.2,1), background 0.3s;
  box-shadow: var(--shadow);
  overflow: hidden;
}

@media (min-width: 768px) {
  .sidenav { display: flex; }
}

.sidenav.collapsed { width: 68px; }

/* Logo */
.sn-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  min-height: 72px;
  user-select: none;
}

.logo-icon {
  width: 40px; height: 40px;
  background: var(--accent);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display);
  font-weight: 800; font-size: 16px;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 0 20px rgba(108,99,255,0.4);
}

.logo-text { overflow: hidden; white-space: nowrap; }
.logo-name { display: block; font-family: var(--font-display); font-weight: 800; font-size: 17px; color: var(--text); }
.logo-sub { display: block; font-size: 11px; color: var(--text-dim); margin-top: 1px; }

/* Nav */
.sn-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
}

.sn-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text-dim);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: var(--font-body);
}

.sn-item:hover { background: var(--surface2); color: var(--text); }
.sn-item.router-link-active {
  background: rgba(108,99,255,0.12);
  color: var(--accent-light);
  font-weight: 600;
}
[data-theme="light"] .sn-item.router-link-active {
  background: rgba(108,99,255,0.08);
  color: var(--accent);
}

.sn-icon { font-size: 18px; flex-shrink: 0; width: 22px; text-align: center; }
.sn-label { flex: 1; overflow: hidden; }
.sn-badge {
  background: var(--accent);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-family: var(--font-mono);
}

.sn-admin { color: var(--accent-light); }
.sn-theme { margin-top: 4px; }

/* Bottom */
.sn-bottom {
  padding: 8px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sn-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.sn-avatar {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px;
  color: white;
  flex-shrink: 0;
}

.sn-user-info { overflow: hidden; }
.sn-user-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sn-user-role { font-size: 11px; color: var(--text-dim); }

/* Collapse button */
.sn-collapse {
  position: absolute;
  right: -12px; top: 50%;
  transform: translateY(-50%);
  width: 24px; height: 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-dim);
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}
.sn-collapse:hover { background: var(--accent); color: white; border-color: var(--accent); }

/* Fade animation for text */
.sn-fade-enter-active, .sn-fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.sn-fade-enter-from { opacity: 0; transform: translateX(-8px); }
.sn-fade-leave-to { opacity: 0; }
</style>
