import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase.js'
import { useAuthStore } from './auth.js'

export const useNutritionStore = defineStore('nutrition', () => {
  const logs = ref([])
  const loading = ref(false)

  function calcDailyCalories(profile) {
    if (!profile?.height_cm || !profile?.weight_kg || !profile?.birth_year) return 2000
    const age = new Date().getFullYear() - profile.birth_year
    const w = parseFloat(profile.weight_kg)
    const h = parseInt(profile.height_cm)
    let bmr
    if (profile.gender === 'male') {
      bmr = 10 * w + 6.25 * h - 5 * age + 5
    } else {
      bmr = 10 * w + 6.25 * h - 5 * age - 161
    }
    const multipliers = { low: 1.2, moderate: 1.375, high: 1.55, very_high: 1.725 }
    const mult = multipliers[profile.activity_level] || 1.375
    return Math.round(bmr * mult)
  }

  function getMacroRecommendation(calories, goal) {
    let protein, carbs, fat
    if (goal === 'lose_weight') {
      protein = Math.round((calories * 0.35) / 4)
      carbs = Math.round((calories * 0.35) / 4)
      fat = Math.round((calories * 0.30) / 9)
    } else if (goal === 'gain_muscle') {
      protein = Math.round((calories * 0.30) / 4)
      carbs = Math.round((calories * 0.45) / 4)
      fat = Math.round((calories * 0.25) / 9)
    } else {
      protein = Math.round((calories * 0.25) / 4)
      carbs = Math.round((calories * 0.50) / 4)
      fat = Math.round((calories * 0.25) / 9)
    }
    return { protein, carbs, fat }
  }

  async function fetchLogs(dateStr) {
    const auth = useAuthStore()
    // BUG FIX: auth.user?.id → auth.user?.id
    if (!auth.user?.id) return
    loading.value = true
    try {
      const { data } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', auth.user.id)
        .eq('log_date', dateStr)
        .order('created_at')
      logs.value = data || []
    } catch (e) {
      console.error('fetchLogs error:', e)
    } finally {
      loading.value = false
    }
  }

  async function addLog(log) {
    const auth = useAuthStore()
    // BUG FIX: auth.user?.id → auth.user?.id
    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert({ ...log, user_id: auth.user?.id })
      .select()
    if (error) throw error
    logs.value.push(data?.[0] || data)
    return data
  }

  async function deleteLog(id) {
    await supabase.from('nutrition_logs').delete().eq('id', id)
    logs.value = logs.value.filter(l => l.id !== id)
  }

  function getDayTotals() {
    return logs.value.reduce((acc, l) => ({
      calories: acc.calories + (l.calories || 0),
      protein: acc.protein + (l.protein_g || 0),
      carbs: acc.carbs + (l.carbs_g || 0),
      fat: acc.fat + (l.fat_g || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  return { logs, loading, calcDailyCalories, getMacroRecommendation, fetchLogs, addLog, deleteLog, getDayTotals }
})
