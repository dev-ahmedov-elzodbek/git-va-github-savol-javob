import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase.js'
import { useAuthStore } from './auth.js'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([])
  const completions = ref({})
  const loading = ref(false)

  async function fetchTasks() {
    const auth = useAuthStore()
    loading.value = true
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .eq('is_template', true)
        .order('sort_order')

      // Agar login bo'lsa — o'z vazifalari ham
      if (auth.user?.id) {
        query = supabase
          .from('tasks')
          .select('*')
          .or(`user_id.eq.${auth.user?.id},is_template.eq.true`)
          .eq('is_active', true)
          .order('sort_order')
      }

      const { data, error } = await query
      if (error) throw error
      tasks.value = data || []
    } catch (e) {
      console.error('fetchTasks error:', e)
      tasks.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchCompletions(dateStr) {
    const auth = useAuthStore()
    if (!auth.user?.id) return
    try {
      const { data } = await supabase
        .from('task_completions')
        .select('task_id')
        .eq('user_id', auth.user?.id)
        .eq('completed_date', dateStr)
      completions.value[dateStr] = data?.map(d => d.task_id) || []
    } catch (e) {
      completions.value[dateStr] = []
    }
  }

  async function toggleCompletion(taskId, dateStr) {
    const auth = useAuthStore()
    if (!auth.user?.id) return
    const done = completions.value[dateStr]?.includes(taskId)
    if (done) {
      await supabase.from('task_completions')
        .delete()
        .eq('user_id', auth.user?.id)
        .eq('task_id', taskId)
        .eq('completed_date', dateStr)
      completions.value[dateStr] = completions.value[dateStr]?.filter(id => id !== taskId)
    } else {
      await supabase.from('task_completions')
        .insert({ user_id: auth.user?.id, task_id: taskId, completed_date: dateStr })
      if (!completions.value[dateStr]) completions.value[dateStr] = []
      completions.value[dateStr].push(taskId)
    }
  }

  function isCompleted(taskId, dateStr) {
    return completions.value[dateStr]?.includes(taskId) || false
  }

  function getDayPoints(dateStr) {
    const ids = completions.value[dateStr] || []
    return ids.reduce((sum, id) => {
      const t = tasks.value.find(t => t.id === id)
      return sum + (t?.points || 0)
    }, 0)
  }

  function getTotalPoints() {
    return Object.values(completions.value).flat().reduce((sum, id) => {
      const t = tasks.value.find(t => t.id === id)
      return sum + (t?.points || 0)
    }, 0)
  }

  function getMaxDayPoints() {
    return tasks.value.reduce((s, t) => s + (t.points || 0), 0)
  }

  function getDayCompletion(dateStr) {
    const max = getMaxDayPoints()
    if (!max) return 0
    return Math.round((getDayPoints(dateStr) / max) * 100)
  }

  async function addTask(task) {
    const auth = useAuthStore()
    if (!auth.user?.id) return
    const { data, error } = await supabase.from('tasks')
      .insert({ ...task, user_id: auth.user?.id, is_template: false })
      .select()
    if (error) throw error
    tasks.value.push(data)
    return data
  }

  async function updateTask(id, updates) {
    const { data, error } = await supabase.from('tasks')
      .update(updates).eq('id', id).select()
    if (error) throw error
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx !== -1) tasks.value[idx] = data?.[0] || data
    return data
  }

  async function deleteTask(id) {
    await supabase.from('tasks').update({ is_active: false }).eq('id', id)
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  return {
    tasks, completions, loading,
    fetchTasks, fetchCompletions, toggleCompletion,
    isCompleted, getDayPoints, getTotalPoints,
    getMaxDayPoints, getDayCompletion,
    addTask, updateTask, deleteTask
  }
})
