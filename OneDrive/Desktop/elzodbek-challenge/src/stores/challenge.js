import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'elzodbek_challenge_v1'

const CHALLENGE_START = new Date('2026-03-19')
const CHALLENGE_END = new Date('2026-07-19')

// Schedule config
const SCHEDULE = {
  // Dushanba=1, Seshanba=2, Chorshanba=3, Payshanba=4, Juma=5, Shanba=6, Yakshanba=0
  classes: {
    groupA: { days: [1, 3, 5], start: '13:00', end: '15:00', name: 'Kurs A (D/Ch/J)' },
    groupB: { days: [2, 4, 6], start: '10:00', end: '12:00', name: 'Kurs B (S/P/Sh)' }
  }
}

// Daily tasks definition
export const DAILY_TASKS = [
  // Uyqu
  { id: 'sleep_23', category: 'sleep', icon: '🌙', label: '23:00 da yotish', points: 10 },
  { id: 'wake_6', category: 'sleep', icon: '☀️', label: '06:00 da turish', points: 10 },

  // Sport (uy sharoiti)
  { id: 'sport_pushup', category: 'sport', icon: '💪', label: 'Ko\'krak: 3x20 push-up', points: 15 },
  { id: 'sport_shoulder', category: 'sport', icon: '🏋️', label: 'Yelka: 3x15 pike push-up', points: 15 },
  { id: 'sport_plank', category: 'sport', icon: '🔥', label: 'Plank: 3x45 son', points: 10 },
  { id: 'sport_pull', category: 'sport', icon: '⬆️', label: 'Tortish: 3x8 (eshik/stol)', points: 15 },

  // Dasturlash
  { id: 'code_study', category: 'code', icon: '💻', label: 'Vue/JS: 1.5 soat o\'qish', points: 20 },
  { id: 'code_practice', category: 'code', icon: '⌨️', label: 'Amaliyot: loyha/mashq', points: 20 },

  // Ingliz tili
  { id: 'eng_words', category: 'english', icon: '📖', label: '20 ta yangi so\'z', points: 15 },
  { id: 'eng_grammar', category: 'english', icon: '📝', label: 'Grammatika: 30 daqiqa', points: 15 },
  { id: 'eng_listen', category: 'english', icon: '🎧', label: 'Podcast/video: 20 daqiqa', points: 10 },

  // O'zbek tili / Ona tili
  { id: 'uz_read', category: 'uzbek', icon: '📚', label: 'Kitob o\'qish: 20 bet', points: 15 },
  { id: 'uz_write', category: 'uzbek', icon: '✍️', label: 'Insho/yozuv mashqi', points: 10 },

  // O'z ustida ishlash
  { id: 'self_reflect', category: 'self', icon: '🪞', label: 'Kunlik tahlil (daftar)', points: 10 },
  { id: 'self_quran', category: 'self', icon: '🕌', label: 'Namoz / ibodат', points: 15 },
  { id: 'self_nophone', category: 'self', icon: '📵', label: 'Telefon < 1 soat (ijtimoiy)', points: 10 },
]

export const CATEGORIES = {
  sleep: { label: 'Uyqu', color: '#6366f1', bg: '#1e1b4b' },
  sport: { label: 'Sport', color: '#10b981', bg: '#064e3b' },
  code: { label: 'Dasturlash', color: '#f59e0b', bg: '#451a03' },
  english: { label: 'Ingliz tili', color: '#3b82f6', bg: '#1e3a5f' },
  uzbek: { label: 'Ona tili', color: '#ec4899', bg: '#500724' },
  self: { label: 'O\'z ustida', color: '#8b5cf6', bg: '#2e1065' },
}

const MAX_DAILY_POINTS = DAILY_TASKS.reduce((sum, t) => sum + t.points, 0)

export const useChallengeStore = defineStore('challenge', () => {
  const data = ref(loadData())

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return { completedTasks: {}, notes: {} }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.value))
  }

  function dateKey(date) {
    return date.toISOString().split('T')[0]
  }

  function toggleTask(date, taskId) {
    const key = dateKey(date)
    if (!data.value.completedTasks[key]) {
      data.value.completedTasks[key] = []
    }
    const idx = data.value.completedTasks[key].indexOf(taskId)
    if (idx === -1) {
      data.value.completedTasks[key].push(taskId)
    } else {
      data.value.completedTasks[key].splice(idx, 1)
    }
    saveData()
  }

  function isTaskDone(date, taskId) {
    const key = dateKey(date)
    return data.value.completedTasks[key]?.includes(taskId) || false
  }

  function getDayPoints(date) {
    const key = dateKey(date)
    const done = data.value.completedTasks[key] || []
    return done.reduce((sum, id) => {
      const task = DAILY_TASKS.find(t => t.id === id)
      return sum + (task?.points || 0)
    }, 0)
  }

  function getDayCompletion(date) {
    return Math.round((getDayPoints(date) / MAX_DAILY_POINTS) * 100)
  }

  function saveNote(date, note) {
    const key = dateKey(date)
    data.value.notes[key] = note
    saveData()
  }

  function getNote(date) {
    return data.value.notes[dateKey(date)] || ''
  }

  const totalDays = computed(() => {
    const diff = CHALLENGE_END - CHALLENGE_START
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  })

  const daysPassed = computed(() => {
    const now = new Date()
    const diff = now - CHALLENGE_START
    return Math.max(0, Math.min(totalDays.value, Math.ceil(diff / (1000 * 60 * 60 * 24))))
  })

  const overallProgress = computed(() => {
    return Math.round((daysPassed.value / totalDays.value) * 100)
  })

  const totalPointsEarned = computed(() => {
    return Object.values(data.value.completedTasks).reduce((total, tasks) => {
      return total + tasks.reduce((sum, id) => {
        const task = DAILY_TASKS.find(t => t.id === id)
        return sum + (task?.points || 0)
      }, 0)
    }, 0)
  })

  const currentStreak = computed(() => {
    let streak = 0
    const today = new Date()
    for (let i = 0; i <= daysPassed.value; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const completion = getDayCompletion(d)
      if (completion >= 50) streak++
      else break
    }
    return streak
  })

  function getScheduleForDay(date) {
    const dow = date.getDay()
    if (dow === 0) return null // Yakshanba - dam olish
    if ([1, 3, 5].includes(dow)) return SCHEDULE.classes.groupA
    if ([2, 4, 6].includes(dow)) return SCHEDULE.classes.groupB
    return null
  }

  return {
    data,
    toggleTask,
    isTaskDone,
    getDayPoints,
    getDayCompletion,
    saveNote,
    getNote,
    totalDays,
    daysPassed,
    overallProgress,
    totalPointsEarned,
    currentStreak,
    getScheduleForDay,
    CHALLENGE_START,
    CHALLENGE_END,
    MAX_DAILY_POINTS
  }
})
