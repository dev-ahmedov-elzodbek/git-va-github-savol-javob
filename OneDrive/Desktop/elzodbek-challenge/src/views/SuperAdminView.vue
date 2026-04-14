<template>
  <div class="page">
    <div class="page-header">
      <div class="header-row">
        <div>
          <h1>👑 SuperAdmin Panel</h1>
          <p class="header-sub">Salom, {{ auth.profile?.full_name || auth.profile?.email }}</p>
        </div>
        <button class="btn btn-outline btn-sm" @click="goLogout">Chiqish</button>
      </div>
    </div>

    <!-- Global stats -->
    <div class="stats-overview">
      <div class="stat-card" v-for="s in globalStats" :key="s.label">
        <div class="sc-icon">{{ s.icon }}</div>
        <div class="sc-val" :style="{ color: s.color }">{{ s.value }}</div>
        <div class="sc-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="admin-tabs">
      <button v-for="tab in tabs" :key="tab.id" class="admin-tab"
        :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner-lg"></div>
      <p>Ma'lumotlar yuklanmoqda...</p>
    </div>
    <div v-if="error" class="error-card">
      ⚠️ {{ error }}
      <button class="btn btn-outline btn-sm" style="margin-top:8px" @click="loadData">Qayta yuklash</button>
    </div>

    <!-- ===== USERS TAB ===== -->
    <div v-if="activeTab === 'users' && !loading">
      <div class="card">
        <div class="card-title-row">
          <div class="card-title">👥 Barcha foydalanuvchilar ({{ users.length }})</div>
          <input v-model="search" class="search-input" placeholder="🔍 Qidirish..." />
        </div>
        <div class="users-list">
          <div v-for="user in filteredUsers" :key="user.id" class="user-item">
            <div class="user-avatar" :class="avatarClass(user.role)">{{ userInitials(user) }}</div>
            <div class="user-info">
              <div class="user-name">{{ user.full_name || 'Nomsiz' }}</div>
              <div class="user-email">{{ user.email }}</div>
              <div class="user-meta">
                <span class="badge" :class="roleBadgeClass(user.role)">{{ user.role }}</span>
                <span class="user-dir">{{ user.direction || '—' }}</span>
                <span class="user-date">{{ formatDate(user.created_at) }}</span>
              </div>
            </div>
            <div class="user-actions">
              <select class="select select-sm" :value="user.role" @change="changeRole(user.id, $event.target.value)">
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
              <button class="btn-icon btn-edit" @click="openEditModal(user)" title="Tahrirlash">✏️</button>
              <button
                v-if="user.id !== auth.user?.id"
                class="btn-icon btn-delete"
                @click="deleteUser(user.id)"
                title="O'chirish">🗑️</button>
            </div>
          </div>
          <div v-if="!filteredUsers.length && !loading" class="empty-state">Foydalanuvchi topilmadi</div>
        </div>
      </div>
    </div>

    <!-- ===== ADMINS TAB ===== -->
    <div v-if="activeTab === 'admins' && !loading">
      <div class="card">
        <div class="card-title">🛡️ Adminlar ({{ adminUsers.length }})</div>
        <div class="users-list">
          <div v-for="admin in adminUsers" :key="admin.id" class="user-item">
            <div class="user-avatar avatar-admin">{{ userInitials(admin) }}</div>
            <div class="user-info">
              <div class="user-name">{{ admin.full_name || 'Nomsiz' }}</div>
              <div class="user-email">{{ admin.email }}</div>
              <div class="user-meta">
                <span class="badge badge-accent">{{ admin.role }}</span>
                <span class="user-date">{{ formatDate(admin.created_at) }}</span>
              </div>
            </div>
            <button v-if="admin.id !== auth.user?.id" class="btn btn-outline btn-sm" @click="changeRole(admin.id, 'user')">
              Userga tushir
            </button>
          </div>
          <div v-if="!adminUsers.length" class="empty-state">Admin topilmadi</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">📋 Barcha admin namunalari ({{ allTemplates.length }})</div>
        <div class="template-list">
          <div v-for="task in allTemplates" :key="task.id" class="template-item">
            <span class="task-icon">{{ task.icon }}</span>
            <div class="template-info">
              <div class="template-title">{{ task.title }}</div>
              <div class="template-meta">
                <span class="badge badge-accent">{{ task.category }}</span>
                <span class="task-pts">{{ task.points }} pt</span>
                <span class="task-creator">{{ getCreatorEmail(task.user_id) }}</span>
              </div>
            </div>
            <button class="btn btn-danger btn-sm" @click="deleteTemplate(task.id)">✕</button>
          </div>
          <div v-if="!allTemplates.length" class="empty-state">Namuna topilmadi</div>
        </div>
      </div>
    </div>

    <!-- ===== STATS TAB ===== -->
    <div v-if="activeTab === 'stats' && !loading">
      <div class="stats-grid">
        <div class="card">
          <div class="card-title">📊 Yo'nalishlar bo'yicha</div>
          <div class="dir-bars">
            <div v-for="(count, dir) in directionStats" :key="dir" class="dir-row">
              <div class="dir-label">{{ dir }}</div>
              <div class="dir-bar-wrap">
                <div class="dir-bar" :style="{ width: (count / Math.max(users.length, 1) * 100) + '%' }"></div>
              </div>
              <span class="dir-count">{{ count }}</span>
            </div>
            <div v-if="!Object.keys(directionStats).length" class="empty-state">Ma'lumot yo'q</div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">👥 Rol taqsimoti</div>
          <div class="dir-bars">
            <div v-for="r in roleStats" :key="r.role" class="dir-row">
              <div class="dir-label"><span class="badge" :class="roleBadgeClass(r.role)">{{ r.role }}</span></div>
              <div class="dir-bar-wrap">
                <div class="dir-bar" :style="{ width: (r.count / Math.max(users.length, 1) * 100) + '%', background: r.color }"></div>
              </div>
              <span class="dir-count">{{ r.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== USER STATISTICS TAB ===== -->
    <div v-if="activeTab === 'user_stats' && !loading">

      <!-- Top summary cards -->
      <div class="user-stats-summary">
        <div class="usm-card">
          <div class="usm-icon">🏆</div>
          <div class="usm-val" style="color: #f59e0b">{{ topUser?.full_name || '—' }}</div>
          <div class="usm-label">Eng faol foydalanuvchi</div>
        </div>
        <div class="usm-card">
          <div class="usm-icon">✅</div>
          <div class="usm-val" style="color: #00d4aa">{{ totalCompletions }}</div>
          <div class="usm-label">Jami bajarilgan vazifalar</div>
        </div>
        <div class="usm-card">
          <div class="usm-icon">📅</div>
          <div class="usm-val" style="color: #6c63ff">{{ activeToday }}</div>
          <div class="usm-label">Bugun faol</div>
        </div>
        <div class="usm-card">
          <div class="usm-icon">⭐</div>
          <div class="usm-val" style="color: #ec4899">{{ avgCompletionRate }}%</div>
          <div class="usm-label">O'rtacha bajarilish</div>
        </div>
      </div>

      <!-- Filter/search bar -->
      <div class="user-stats-toolbar">
        <input v-model="statsSearch" class="search-input" placeholder="🔍 Foydalanuvchi qidirish..." style="max-width:220px" />
        <div class="sort-btns">
          <button v-for="s in sortOptions" :key="s.key"
            class="sort-btn" :class="{ active: sortBy === s.key }"
            @click="sortBy = s.key">
            {{ s.label }}
          </button>
        </div>
      </div>

      <!-- Loading user stats -->
      <div v-if="loadingUserStats" class="loading-state" style="padding:30px">
        <div class="loading-spinner-sm"></div>
        <span>Statistikalar yuklanmoqda...</span>
      </div>

      <!-- Per-user stats table -->
      <div v-else class="card" style="padding:0; overflow:hidden">
        <div class="user-stats-table">
          <div class="ust-header">
            <span>Foydalanuvchi</span>
            <span>Bajarilgan</span>
            <span>Ball</span>
            <span>Oxirgi faollik</span>
            <span>Streak</span>
            <span>Onboarding</span>
          </div>

          <div v-for="(u, idx) in sortedUserStats" :key="u.id"
            class="ust-row"
            :class="{ 'ust-row-top': idx < 3 }"
            @click="toggleUserDetail(u.id)">
            <!-- Rank + Avatar -->
            <div class="ust-user">
              <div class="ust-rank" :class="rankClass(idx)">{{ idx + 1 }}</div>
              <div class="user-avatar-sm" :class="avatarClass(u.role)">{{ userInitials(u) }}</div>
              <div class="ust-user-info">
                <div class="ust-name">{{ u.full_name || 'Nomsiz' }}</div>
                <div class="ust-email">{{ u.email }}</div>
              </div>
            </div>
            <!-- Stats -->
            <div class="ust-cell">
              <span class="ust-val" style="color:#00d4aa">{{ u.completions }}</span>
              <div class="ust-mini-bar">
                <div class="ust-mini-fill" style="background:#00d4aa"
                  :style="{ width: Math.min((u.completions / Math.max(maxCompletions, 1)) * 100, 100) + '%' }"></div>
              </div>
            </div>
            <div class="ust-cell">
              <span class="ust-val" style="color:#6c63ff">{{ u.totalPoints }}</span>
            </div>
            <div class="ust-cell">
              <span class="ust-last-active" :class="activityClass(u.lastActive)">
                {{ formatLastActive(u.lastActive) }}
              </span>
            </div>
            <div class="ust-cell">
              <span class="ust-streak">
                {{ u.streak > 0 ? '🔥 ' + u.streak : '—' }}
              </span>
            </div>
            <div class="ust-cell">
              <span class="badge" :class="u.onboarding_done ? 'badge-success' : 'badge-danger'">
                {{ u.onboarding_done ? '✓' : '✗' }}
              </span>
            </div>
          </div>

          <div v-if="!sortedUserStats.length" class="empty-state">Foydalanuvchi topilmadi</div>
        </div>
      </div>

      <!-- Expanded user detail -->
      <div v-if="expandedUserId" class="user-detail-panel">
        <div v-if="expandedUser" class="udp-inner">
          <div class="udp-header">
            <div class="user-avatar" :class="avatarClass(expandedUser.role)">{{ userInitials(expandedUser) }}</div>
            <div>
              <div class="udp-name">{{ expandedUser.full_name || 'Nomsiz' }}</div>
              <div class="udp-email">{{ expandedUser.email }}</div>
            </div>
            <button class="modal-close-btn" style="margin-left:auto" @click="expandedUserId = null">✕</button>
          </div>

          <div class="udp-stats">
            <div class="udp-stat">
              <div class="udp-stat-val" style="color:#00d4aa">{{ expandedUser.completions }}</div>
              <div class="udp-stat-label">Jami vazifalar</div>
            </div>
            <div class="udp-stat">
              <div class="udp-stat-val" style="color:#6c63ff">{{ expandedUser.totalPoints }}</div>
              <div class="udp-stat-label">Jami ball</div>
            </div>
            <div class="udp-stat">
              <div class="udp-stat-val" style="color:#f59e0b">{{ expandedUser.streak }}</div>
              <div class="udp-stat-label">Streak (kun)</div>
            </div>
            <div class="udp-stat">
              <div class="udp-stat-val" style="color:#ec4899">{{ expandedUser.direction || '—' }}</div>
              <div class="udp-stat-label">Yo'nalish</div>
            </div>
          </div>

          <!-- Recent completions per category -->
          <div v-if="expandedUser.categoryBreakdown && Object.keys(expandedUser.categoryBreakdown).length" class="udp-cats">
            <div class="udp-cats-title">Kategoriyalar bo'yicha</div>
            <div v-for="(count, cat) in expandedUser.categoryBreakdown" :key="cat" class="dir-row" style="margin-bottom:6px">
              <div class="dir-label" style="width:90px">{{ catLabel(cat) }}</div>
              <div class="dir-bar-wrap">
                <div class="dir-bar" :style="{ width: (count / Math.max(expandedUser.completions, 1) * 100) + '%', background: catColor(cat) }"></div>
              </div>
              <span class="dir-count">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== EDIT USER MODAL ===== -->
    <div v-if="editModal.open" class="modal-overlay" @click.self="editModal.open = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3>✏️ Foydalanuvchini tahrirlash</h3>
          <button class="modal-close-btn" @click="editModal.open = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">To'liq ism</label>
            <input v-model="editModal.full_name" class="form-input" placeholder="Ism familiya" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input v-model="editModal.email" class="form-input" placeholder="email@example.com" type="email" />
          </div>
          <div class="form-group">
            <label class="form-label">Yo'nalish</label>
            <input v-model="editModal.direction" class="form-input" placeholder="it, law, design..." />
          </div>
          <div class="form-group">
            <label class="form-label">Rol</label>
            <select v-model="editModal.role" class="select">
              <option value="user">user</option>
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" @click="editModal.open = false">Bekor qilish</button>
          <button class="btn btn-primary btn-sm" @click="saveEditModal" :disabled="editModal.saving">
            {{ editModal.saving ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </div>
    </div>

    <div style="height:80px"></div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { supabase } from '../supabase.js'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref('users')
const users = ref([])
const allTemplates = ref([])
const search = ref('')
const loading = ref(false)
const error = ref('')

// User stats
const userStatsMap = ref({}) // userId -> { completions, totalPoints, lastActive, streak, categoryBreakdown }
const loadingUserStats = ref(false)
const statsSearch = ref('')
const sortBy = ref('completions')
const expandedUserId = ref(null)

// Edit modal
const editModal = ref({ open: false, id: null, full_name: '', email: '', direction: '', role: 'user', saving: false })

const tabs = [
  { id: 'users', icon: '👥', label: 'Foydalanuvchilar' },
  { id: 'admins', icon: '🛡️', label: 'Adminlar' },
  { id: 'stats', icon: '📊', label: 'Statistika' },
  { id: 'user_stats', icon: '📈', label: 'Faollik' },
]

const sortOptions = [
  { key: 'completions', label: '✅ Vazifalar' },
  { key: 'totalPoints', label: '⭐ Ball' },
  { key: 'lastActive', label: '📅 Faollik' },
  { key: 'streak', label: '🔥 Streak' },
]

const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const q = search.value.toLowerCase()
  return users.value.filter(u =>
    (u.full_name || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q) ||
    (u.role || '').includes(q)
  )
})

const adminUsers = computed(() => users.value.filter(u => u.role === 'admin' || u.role === 'superadmin'))

const globalStats = computed(() => [
  { icon: '👥', label: 'Jami foydalanuvchi', value: users.value.length, color: '#6c63ff' },
  { icon: '🛡️', label: 'Adminlar', value: users.value.filter(u => u.role === 'admin').length, color: '#f59e0b' },
  { icon: '✅', label: 'Onboarding', value: users.value.filter(u => u.onboarding_done).length, color: '#00d4aa' },
  { icon: '📋', label: 'Namunalar', value: allTemplates.value.length, color: '#ec4899' },
])

const directionStats = computed(() => {
  const stats = {}
  users.value.forEach(u => { if (u.direction) stats[u.direction] = (stats[u.direction] || 0) + 1 })
  return stats
})

const roleStats = computed(() => [
  { role: 'user', count: users.value.filter(u => u.role === 'user').length, color: '#00d4aa' },
  { role: 'admin', count: users.value.filter(u => u.role === 'admin').length, color: '#6c63ff' },
  { role: 'superadmin', count: users.value.filter(u => u.role === 'superadmin').length, color: '#f59e0b' },
])

// Enriched user stats
const enrichedUsers = computed(() => {
  return users.value.map(u => ({
    ...u,
    ...(userStatsMap.value[u.id] || { completions: 0, totalPoints: 0, lastActive: null, streak: 0, categoryBreakdown: {} })
  }))
})

const statsSearchLower = computed(() => statsSearch.value.toLowerCase())

const filteredUserStats = computed(() => {
  if (!statsSearchLower.value) return enrichedUsers.value
  return enrichedUsers.value.filter(u =>
    (u.full_name || '').toLowerCase().includes(statsSearchLower.value) ||
    (u.email || '').toLowerCase().includes(statsSearchLower.value)
  )
})

const sortedUserStats = computed(() => {
  return [...filteredUserStats.value].sort((a, b) => {
    if (sortBy.value === 'lastActive') {
      if (!a.lastActive && !b.lastActive) return 0
      if (!a.lastActive) return 1
      if (!b.lastActive) return -1
      return new Date(b.lastActive) - new Date(a.lastActive)
    }
    return (b[sortBy.value] || 0) - (a[sortBy.value] || 0)
  })
})

const maxCompletions = computed(() => Math.max(...enrichedUsers.value.map(u => u.completions || 0), 1))
const totalCompletions = computed(() => enrichedUsers.value.reduce((s, u) => s + (u.completions || 0), 0))

const activeToday = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return enrichedUsers.value.filter(u => u.lastActive === today).length
})

const avgCompletionRate = computed(() => {
  const active = enrichedUsers.value.filter(u => u.completions > 0)
  if (!active.length) return 0
  const avg = active.reduce((s, u) => s + (u.completions || 0), 0) / active.length
  return Math.round(avg)
})

const topUser = computed(() => sortedUserStats.value[0])

const expandedUser = computed(() => {
  if (!expandedUserId.value) return null
  return enrichedUsers.value.find(u => u.id === expandedUserId.value)
})

// Helpers
function userInitials(u) { return (u.full_name || u.email || 'U').slice(0, 2).toUpperCase() }
function avatarClass(role) { if (role === 'superadmin') return 'avatar-super'; if (role === 'admin') return 'avatar-admin'; return '' }
function roleBadgeClass(role) { if (role === 'superadmin') return 'badge-warning'; if (role === 'admin') return 'badge-accent'; return 'badge-success' }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('uz-UZ') : '—' }
function getCreatorEmail(uid) { const u = users.value.find(u => u.id === uid); return u?.email || '—' }
function rankClass(idx) { return idx === 0 ? 'rank-gold' : idx === 1 ? 'rank-silver' : idx === 2 ? 'rank-bronze' : '' }

function formatLastActive(dateStr) {
  if (!dateStr) return 'Hech qachon'
  const date = new Date(dateStr)
  const today = new Date()
  const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '🟢 Bugun'
  if (diff === 1) return '🟡 Kecha'
  if (diff <= 7) return `${diff} kun oldin`
  return formatDate(dateStr)
}

function activityClass(dateStr) {
  if (!dateStr) return 'activity-none'
  const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'activity-today'
  if (diff <= 3) return 'activity-recent'
  if (diff <= 7) return 'activity-week'
  return 'activity-old'
}

function catLabel(cat) {
  return { study: "O'quv", sport: 'Sport', language: 'Til', self: "O'z ustida", nutrition: 'Ovqat', custom: 'Boshqa' }[cat] || cat
}
function catColor(cat) {
  return { study: '#6c63ff', sport: '#10b981', language: '#3b82f6', self: '#8b5cf6', nutrition: '#f59e0b', custom: '#ec4899' }[cat] || '#6c63ff'
}

function toggleUserDetail(userId) {
  expandedUserId.value = expandedUserId.value === userId ? null : userId
}

async function changeRole(userId, newRole) {
  if (userId === auth.user?.id && newRole !== 'superadmin') {
    if (!confirm("O'z rolingizni o'zgartirmoqchimisiz?")) return
  }
  const { error: err } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
  if (!err) { const u = users.value.find(u => u.id === userId); if (u) u.role = newRole }
}

async function deleteTemplate(id) {
  if (!confirm("Bu namunani o'chirmoqchimisiz?")) return
  await supabase.from('tasks').delete().eq('id', id)
  allTemplates.value = allTemplates.value.filter(t => t.id !== id)
}

function openEditModal(user) {
  editModal.value = {
    open: true,
    id: user.id,
    full_name: user.full_name || '',
    email: user.email || '',
    direction: user.direction || '',
    role: user.role || 'user',
    saving: false
  }
}

async function saveEditModal() {
  editModal.value.saving = true
  const { error: err } = await supabase.from('profiles').update({
    full_name: editModal.value.full_name,
    direction: editModal.value.direction,
    role: editModal.value.role
  }).eq('id', editModal.value.id)
  if (!err) {
    const u = users.value.find(u => u.id === editModal.value.id)
    if (u) {
      u.full_name = editModal.value.full_name
      u.direction = editModal.value.direction
      u.role = editModal.value.role
    }
    editModal.value.open = false
  } else {
    alert('Xato: ' + err.message)
  }
  editModal.value.saving = false
}

async function deleteUser(userId) {
  if (!confirm("Bu foydalanuvchini o\'chirmoqchimisiz? Bu amalni qaytarib bo\'lmaydi!")) return
  const { error: err } = await supabase.from('profiles').delete().eq('id', userId)
  if (!err) {
    users.value = users.value.filter(u => u.id !== userId)
  } else {
    alert('O\'chirishda xato: ' + err.message)
  }
}

async function goLogout() {
  await auth.logout()
  router.push('/superadmin-login')
}

async function loadUserStats() {
  loadingUserStats.value = true
  try {
    // task_completions + tasks join — jadval mavjud emasligini tekshiramiz
    const { data: completions, error: statsErr } = await supabase
      .from('task_completions')
      .select('user_id, completed_date, task_id, tasks(points, category)')
      .order('completed_date', { ascending: false })

    if (statsErr) {
      console.warn('task_completions yuklanmadi:', statsErr.message)
      // Jadval yo'q yoki ruxsat yo'q — bo'sh statistika bilan davom etamiz
      userStatsMap.value = {}
      return
    }
    if (!completions || completions.length === 0) return

    const statsMap = {}
    const today = new Date().toISOString().split('T')[0]

    completions.forEach(c => {
      const uid = c.user_id
      if (!statsMap[uid]) {
        statsMap[uid] = { completions: 0, totalPoints: 0, lastActive: null, dates: [], categoryBreakdown: {} }
      }
      statsMap[uid].completions++
      statsMap[uid].totalPoints += (c.tasks?.points || 0)
      statsMap[uid].dates.push(c.completed_date)

      const cat = c.tasks?.category || 'custom'
      statsMap[uid].categoryBreakdown[cat] = (statsMap[uid].categoryBreakdown[cat] || 0) + 1

      if (!statsMap[uid].lastActive || c.completed_date > statsMap[uid].lastActive) {
        statsMap[uid].lastActive = c.completed_date
      }
    })

    // Calculate streak for each user
    Object.keys(statsMap).forEach(uid => {
      const dates = [...new Set(statsMap[uid].dates)].sort((a, b) => b.localeCompare(a))
      let streak = 0
      let checkDate = today
      for (const d of dates) {
        if (d === checkDate) {
          streak++
          const prev = new Date(checkDate)
          prev.setDate(prev.getDate() - 1)
          checkDate = prev.toISOString().split('T')[0]
        } else break
      }
      statsMap[uid].streak = streak
    })

    userStatsMap.value = statsMap
  } catch (e) {
    console.error('User stats error:', e)
  } finally {
    loadingUserStats.value = false
  }
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const { data: u, error: uErr } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, direction, onboarding_done, created_at')
      .order('created_at', { ascending: false })

    if (uErr) {
      error.value = `Foydalanuvchilarni yuklashda xato: ${uErr.message}`
    } else {
      users.value = u || []
    }

    const { data: t, error: tErr } = await supabase
      .from('tasks').select('*').eq('is_template', true)
      .order('created_at', { ascending: false })
    if (!tErr) allTemplates.value = t || []
  } catch (e) {
    error.value = 'Kutilmagan xato yuz berdi'
    console.error(e)
  } finally {
    loading.value = false
    // Load user stats in background
    loadUserStats()
  }
}

onMounted(loadData)
</script>

<style scoped>
.page { padding: 20px 16px; max-width: 860px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.page-header h1 { font-family: var(--font-display); font-weight: 800; font-size: 24px; }
.header-sub { font-size: 13px; color: var(--text-dim); margin-top: 2px; }

.stats-overview { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
@media(min-width:500px){ .stats-overview { grid-template-columns: repeat(4, 1fr); } }
.stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; text-align: center; }
.sc-icon { font-size: 20px; margin-bottom: 4px; }
.sc-val { font-family: var(--font-display); font-weight: 800; font-size: 22px; }
.sc-label { font-size: 10px; color: var(--text-dim); margin-top: 2px; }

.admin-tabs { display: flex; gap: 4px; margin-bottom: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 4px; flex-wrap: wrap; }
.admin-tab { flex: 1; min-width: 80px; padding: 8px 4px; background: none; border: none; color: var(--text-dim); font-family: var(--font-body); font-size: 12px; font-weight: 500; border-radius: 8px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.admin-tab.active { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; font-weight: 700; }

.loading-state { text-align: center; padding: 40px 20px; color: var(--text-dim); display: flex; flex-direction: column; align-items: center; gap: 10px; }
.spinner-lg { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
.loading-spinner-sm { width: 20px; height: 20px; border: 2px solid var(--border2); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-card { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; padding: 16px; border-radius: var(--radius-sm); margin-bottom: 16px; display: flex; flex-direction: column; }

.card-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.card-title-row .card-title { margin-bottom: 0; }
.search-input { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface2); color: var(--text); font-size: 13px; width: 100%; max-width: 200px; outline: none; }
.search-input:focus { border-color: var(--accent); }

.users-list { display: flex; flex-direction: column; gap: 8px; }
.user-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--surface2); border-radius: var(--radius-sm); flex-wrap: wrap; }
.user-avatar { width: 38px; height: 38px; background: var(--accent); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; color: white; }
.user-avatar-sm { width: 32px; height: 32px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; color: white; }
.avatar-admin { background: linear-gradient(135deg, #6c63ff, #00d4aa); }
.avatar-super { background: linear-gradient(135deg, #f59e0b, #ef4444); }
.user-info { flex: 1; min-width: 0; }
.user-name { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-email { font-size: 11px; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap; }
.user-dir { font-size: 11px; color: var(--text-dim); }
.user-date { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
.user-actions { flex-shrink: 0; display: flex; align-items: center; gap: 6px; }
.select-sm { width: 100px; padding: 5px 6px; font-size: 12px; }

.template-list { display: flex; flex-direction: column; gap: 8px; }
.template-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--surface2); border-radius: var(--radius-sm); }
.task-icon { font-size: 18px; flex-shrink: 0; }
.template-info { flex: 1; min-width: 0; }
.template-title { font-size: 14px; margin-bottom: 4px; }
.template-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.task-pts { font-family: var(--font-mono); font-size: 12px; color: var(--accent-light); }
.task-creator { font-size: 11px; color: var(--text-muted); }

.stats-grid { display: grid; gap: 14px; }
@media(min-width:640px) { .stats-grid { grid-template-columns: 1fr 1fr; } }

.dir-bars { display: flex; flex-direction: column; gap: 10px; }
.dir-row { display: flex; align-items: center; gap: 8px; }
.dir-label { font-size: 12px; width: 100px; flex-shrink: 0; }
.dir-bar-wrap { flex: 1; height: 8px; background: var(--surface2); border-radius: 4px; overflow: hidden; }
.dir-bar { height: 100%; background: linear-gradient(135deg, #f59e0b, #ef4444); border-radius: 4px; transition: width 0.6s; }
.dir-count { font-family: var(--font-mono); font-size: 12px; color: var(--text-dim); width: 28px; text-align: right; }
.badge-warning { background: rgba(245,158,11,0.2); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
.empty-state { text-align: center; padding: 24px; color: var(--text-dim); font-size: 14px; }

/* ===== USER STATS TAB ===== */
.user-stats-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
@media(min-width:500px) { .user-stats-summary { grid-template-columns: repeat(4, 1fr); } }
.usm-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; text-align: center; }
.usm-icon { font-size: 22px; margin-bottom: 6px; }
.usm-val { font-family: var(--font-display); font-weight: 800; font-size: 18px; word-break: break-word; }
.usm-label { font-size: 10px; color: var(--text-dim); margin-top: 4px; }

.user-stats-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.sort-btns { display: flex; gap: 4px; flex-wrap: wrap; }
.sort-btn { padding: 6px 12px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12px; color: var(--text-dim); cursor: pointer; transition: all 0.2s; font-family: var(--font-body); }
.sort-btn.active { background: var(--accent); border-color: var(--accent); color: white; font-weight: 600; }
.sort-btn:hover:not(.active) { border-color: var(--border2); color: var(--text); }

/* Stats table */
.user-stats-table { width: 100%; overflow-x: auto; }
.ust-header {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr 1fr 1fr;
  padding: 10px 16px; background: var(--surface2);
  font-size: 11px; font-weight: 600; color: var(--text-dim);
  text-transform: uppercase; letter-spacing: 0.06em;
  border-bottom: 1px solid var(--border);
}
.ust-row {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr 1fr 1fr;
  padding: 12px 16px; border-bottom: 1px solid var(--border);
  transition: background 0.15s; cursor: pointer;
  align-items: center;
}
.ust-row:last-child { border-bottom: none; }
.ust-row:hover { background: var(--surface2); }
.ust-row-top { background: rgba(245,158,11,0.03); }

.ust-user { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ust-rank {
  width: 22px; height: 22px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; font-family: var(--font-mono);
  background: var(--surface3); color: var(--text-dim); flex-shrink: 0;
}
.rank-gold { background: rgba(245,158,11,0.2); color: #f59e0b; }
.rank-silver { background: rgba(160,163,184,0.2); color: #a0a3b8; }
.rank-bronze { background: rgba(180,100,60,0.2); color: #b4643c; }

.ust-user-info { min-width: 0; }
.ust-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ust-email { font-size: 11px; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.ust-cell { display: flex; flex-direction: column; gap: 3px; }
.ust-val { font-family: var(--font-mono); font-weight: 700; font-size: 14px; }
.ust-mini-bar { width: 100%; height: 3px; background: var(--surface3); border-radius: 2px; overflow: hidden; }
.ust-mini-fill { height: 100%; border-radius: 2px; transition: width 0.5s; }
.ust-streak { font-family: var(--font-mono); font-size: 13px; font-weight: 600; color: var(--warning); }
.ust-last-active { font-size: 12px; font-weight: 500; }
.activity-today { color: #00d4aa; }
.activity-recent { color: #10b981; }
.activity-week { color: #f59e0b; }
.activity-old { color: var(--text-dim); }
.activity-none { color: var(--text-muted); }

/* User detail panel */
.user-detail-panel {
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: var(--radius); margin-top: 14px;
  overflow: hidden; animation: slideUp 0.2s ease;
}
@keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.udp-inner { padding: 20px; }
.udp-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.udp-name { font-family: var(--font-display); font-weight: 700; font-size: 16px; }
.udp-email { font-size: 12px; color: var(--text-dim); }
.modal-close-btn { background: var(--surface3); border: none; color: var(--text-dim); cursor: pointer; width: 28px; height: 28px; border-radius: 8px; font-size: 13px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
.modal-close-btn:hover { background: rgba(239,68,68,0.15); color: var(--danger); }

.udp-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
@media(min-width:400px) { .udp-stats { grid-template-columns: repeat(4, 1fr); } }
.udp-stat { background: var(--surface2); border-radius: var(--radius-sm); padding: 12px; text-align: center; }
.udp-stat-val { font-family: var(--font-display); font-weight: 800; font-size: 20px; }
.udp-stat-label { font-size: 10px; color: var(--text-dim); margin-top: 3px; }

.udp-cats-title { font-size: 12px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }
.udp-cats { margin-top: 4px; }

/* ===== ACTION BUTTONS ===== */
.btn-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border2);
  background: var(--surface3);
  cursor: pointer;
  font-size: 14px;
  display: inline-flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.btn-edit:hover { background: rgba(108,99,255,0.2); border-color: var(--accent); }
.btn-delete:hover { background: rgba(239,68,68,0.2); border-color: var(--danger); }

/* ===== DARK MODE TOGGLE IN HEADER ===== */
.header-theme-btn {
  width: 36px; height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border2);
  background: var(--surface2);
  cursor: pointer;
  font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.header-theme-btn:hover { background: var(--surface3); transform: scale(1.08); }

/* ===== EDIT MODAL ===== */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-box {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: var(--radius);
  width: 100%; max-width: 420px;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.2s ease;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border);
}
.modal-header h3 { font-family: var(--font-display); font-weight: 700; font-size: 16px; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer {
  padding: 14px 20px 18px;
  display: flex; justify-content: flex-end; gap: 10px;
  border-top: 1px solid var(--border);
}

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
.form-input {
  padding: 10px 12px; border: 1px solid var(--border2);
  border-radius: var(--radius-sm); background: var(--surface2);
  color: var(--text); font-family: var(--font-body); font-size: 14px;
  outline: none; transition: border-color 0.2s;
  width: 100%;
}
.form-input:focus { border-color: var(--accent); }
</style>
