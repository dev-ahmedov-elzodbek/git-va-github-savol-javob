<template>
  <div class="app-wrap" :data-theme="theme">
    <div v-if="auth.loading" class="splash">
      <div class="splash-logo">GF</div>
      <div class="splash-name">GoalFlow</div>
      <div class="splash-loader"><div class="loader-bar"></div></div>
    </div>

    <template v-else>
      <div class="app-layout">
        <!-- Desktop Sidebar -->
        <SideNav
          v-if="auth.isLoggedIn && !auth.needsOnboarding"
          :theme="theme"
          @toggle-theme="toggleTheme"
        />

        <!-- Main Content -->
        <div class="app-content" :class="{ 'has-sidebar': auth.isLoggedIn && !auth.needsOnboarding }">

          <!-- Guest / onboarding / superadmin theme toggle (floating top-right) -->
          <button
            v-if="!auth.isLoggedIn || auth.needsOnboarding || isSuperAdminPage"
            class="guest-theme-btn"
            @click="toggleTheme"
            :title="theme === 'dark' ? 'Light mode' : 'Dark mode'">
            <span>{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
          </button>

          <router-view v-slot="{ Component }">
            <transition name="fade">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>

      <!-- Mobile Bottom Nav -->
      <BottomNav
        v-if="auth.isLoggedIn && !auth.needsOnboarding"
        :theme="theme"
        @toggle-theme="toggleTheme"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import BottomNav from './components/BottomNav.vue'
import SideNav from './components/SideNav.vue'

const auth = useAuthStore()
const route = useRoute()

const isSuperAdminPage = computed(() =>
  route.path === '/superadmin' || route.path === '/superadmin-login'
)

const saved = localStorage.getItem('gf_theme') || 'dark'
const theme = ref(saved)

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('gf_theme', theme.value)
}
</script>

<style>
.app-wrap {
  min-height: 100vh;
  background: var(--bg);
  transition: background 0.3s;
}

/* Floating theme toggle for guest / onboarding */
.guest-theme-btn {
  position: fixed;
  top: 14px;
  right: 16px;
  z-index: 200;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--border2);
  background: var(--surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}
.guest-theme-btn:hover {
  background: var(--surface2);
  transform: scale(1.08);
  box-shadow: var(--shadow);
}
</style>
