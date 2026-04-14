<template>
  <div class="onboarding">
    <div class="ob-bg"><div class="ob-orb"></div></div>
 
    <div class="ob-container">
      <!-- Progress -->
      <div class="ob-progress">
        <div class="ob-steps">
          <div v-for="i in 6" :key="i" class="ob-step" :class="{ active: step >= i, current: step === i }"></div>
        </div>
        <div class="ob-step-label">{{ step }}/6 — {{ stepLabels[step-1] }}</div>
      </div>
 
      <!-- Step 1: Direction -->
      <div v-if="step === 1" class="ob-step-content">
        <h2>{{ t('onboarding.direction') }}</h2>
        <div class="chips-grid">
          <button v-for="(label, key) in tm('onboarding.directions')" :key="key"
            class="chip chip-lg" :class="{ active: form.direction === key }"
            @click="form.direction = key">{{ label }}</button>
        </div>
      </div>
 
      <!-- Step 2: Subjects -->
      <div v-if="step === 2" class="ob-step-content">
        <h2>{{ t('onboarding.subjects') }}</h2>
        <div class="chips-grid">
          <button v-for="subj in subjects" :key="subj.key"
            class="chip chip-lg" :class="{ active: form.subjects.includes(subj.key) }"
            @click="toggleArr(form.subjects, subj.key)">{{ subj.icon }} {{ subj.label }}</button>
        </div>
      </div>
 
      <!-- Step 3: Sports -->
      <div v-if="step === 3" class="ob-step-content">
        <h2>{{ t('onboarding.sports') }}</h2>
        <div class="chips-grid">
          <button v-for="(label, key) in tm('onboarding.sportsList')" :key="key"
            class="chip chip-lg" :class="{ active: form.sports.includes(key) }"
            @click="toggleArr(form.sports, key)">{{ label }}</button>
        </div>
      </div>
 
      <!-- Step 4: Schedule/Time -->
      <div v-if="step === 4" class="ob-step-content">
        <h2>{{ t('onboarding.busyTime') }}</h2>
        <p class="ob-hint">Band vaqtlaringizni belgilang — biz jadvalda hisobga olamiz</p>
        <div class="time-blocks-builder">
          <div v-for="(block, i) in form.timeBlocks" :key="i" class="tbb-item card">
            <div class="tbb-row">
              <input v-model="block.title" class="input" placeholder="Nomi (Dars, Ish...)" />
              <button class="btn btn-danger btn-sm" @click="form.timeBlocks.splice(i,1)">✕</button>
            </div>
            <div class="tbb-row" style="gap:8px;flex-wrap:wrap">
              <button v-for="(d,di) in dayNames" :key="di"
                class="chip" style="padding:6px 10px;font-size:12px"
                :class="{ active: block.days.includes(di+1) }"
                @click="toggleArr(block.days, di+1)">{{ d }}</button>
            </div>
            <div class="tbb-row">
              <div style="flex:1">
                <label class="label">Boshlanish</label>
                <select v-model="block.start" class="select">
                  <option v-for="tm in timeOptions" :key="tm" :value="tm">{{ tm }}</option>
                </select>
              </div>
              <div style="flex:1">
                <label class="label">Tugash</label>
                <select v-model="block.end" class="select">
                  <option v-for="tm in timeOptions" :key="tm" :value="tm">{{ tm }}</option>
                </select>
              </div>
            </div>
          </div>
          <button class="btn btn-outline btn-full" @click="addBlock">+ Yangi vaqt bloki</button>
        </div>
      </div>
 
      <!-- Step 5: Health — YANGILANGAN -->
      <div v-if="step === 5" class="ob-step-content">
        <h2>{{ t('onboarding.health') }}</h2>
 
        <!-- Jins -->
        <div class="form-group">
          <label class="label">Jins</label>
          <div style="display:flex;gap:8px">
            <button class="chip chip-lg" style="flex:1" :class="{ active: form.gender === 'male' }" @click="form.gender = 'male'">👨 Erkak</button>
            <button class="chip chip-lg" style="flex:1" :class="{ active: form.gender === 'female' }" @click="form.gender = 'female'">👩 Ayol</button>
          </div>
        </div>
 
        <!-- Tug'ilgan sana -->
        <div class="form-group">
          <label class="label">Tug'ilgan sana</label>
          <input
            v-model="form.birth_date"
            class="input"
            type="date"
            :max="maxBirthDate"
            :min="minBirthDate"
            @change="updateAgeFromDate"
          />
          <div v-if="calculatedAge" class="age-display">
            🎂 Yosh: <strong>{{ calculatedAge }} yosh</strong>
          </div>
        </div>
 
        <!-- Bo'y va Vazn -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="label">Bo'y (sm)</label>
            <input v-model.number="form.height_cm" class="input" type="number" placeholder="175" min="100" max="250" />
          </div>
          <div class="form-group">
            <label class="label">Vazn (kg)</label>
            <input v-model.number="form.weight_kg" class="input" type="number" placeholder="70" step="0.1" min="30" max="300" />
          </div>
        </div>
 
        <!-- BMI ko'rsatgich -->
        <div v-if="bmi" class="bmi-card">
          <div class="bmi-row">
            <div class="bmi-item">
              <div class="bmi-val">{{ bmi }}</div>
              <div class="bmi-label">BMI</div>
            </div>
            <div class="bmi-item">
              <div class="bmi-status" :style="{ color: bmiColor }">{{ bmiStatus }}</div>
              <div class="bmi-label">Holat</div>
            </div>
          </div>
        </div>
 
        <!-- Faoliyat darajasi -->
        <div class="form-group">
          <label class="label">Faoliyat darajasi</label>
          <div class="chips-grid">
            <button v-for="(label, key) in tm('onboarding.activityLevels')" :key="key"
              class="chip" :class="{ active: form.activity_level === key }"
              @click="form.activity_level = key">{{ label }}</button>
          </div>
        </div>
 
        <!-- Kaloriya tavsiyasi -->
        <div v-if="calorieEstimate" class="calorie-card">
          <div class="cal-title">🔥 Kunlik kaloriya tavsiyasi</div>
          <div class="cal-value">{{ calorieEstimate }} <span>kcal/kun</span></div>
          <div class="cal-macros">
            <div>🥩 Oqsil: ~{{ macros.protein }}g</div>
            <div>🍞 Uglevod: ~{{ macros.carbs }}g</div>
            <div>🫒 Yog': ~{{ macros.fat }}g</div>
          </div>
        </div>
      </div>
 
      <!-- Step 6: Goal & Duration -->
      <div v-if="step === 6" class="ob-step-content">
        <h2>{{ t('onboarding.goal') }}</h2>
        <textarea v-model="form.goal" class="input" style="min-height:100px;resize:vertical"
          placeholder="Masalan: 4 oyda dasturchi bo'lish, ingliz tilini o'rganish..."></textarea>
 
        <div class="form-group" style="margin-top:20px">
          <label class="label">{{ t('onboarding.duration') }}</label>
          <div class="duration-options">
            <button v-for="d in [30,60,90,120]" :key="d"
              class="dur-btn" :class="{ active: form.challenge_duration === d }"
              @click="form.challenge_duration = d">{{ d }} {{ t('onboarding.days') }}</button>
          </div>
        </div>
 
        <!-- Xulosa -->
        <div class="ob-summary card" style="margin-top:20px">
          <div class="card-title">📋 Xulosa</div>
          <div class="summary-items">
            <div class="sum-item"><span>Yo'nalish:</span> {{ t(`onboarding.directions.${form.direction}`) || '—' }}</div>
            <div class="sum-item"><span>Sportlar:</span> {{ form.sports.length }} ta tanlandi</div>
            <div class="sum-item" v-if="calculatedAge"><span>Yosh:</span> {{ calculatedAge }} yosh</div>
            <div class="sum-item" v-if="form.height_cm"><span>Bo'y / Vazn:</span> {{ form.height_cm }} sm / {{ form.weight_kg }} kg</div>
            <div class="sum-item" v-if="calorieEstimate"><span>Kaloriya:</span> {{ calorieEstimate }} kcal/kun</div>
            <div class="sum-item"><span>Challenge:</span> {{ form.challenge_duration }} kun</div>
          </div>
        </div>
      </div>
 
      <!-- Navigation -->
      <div class="ob-nav">
        <button v-if="step > 1" class="btn btn-outline" @click="step--">{{ t('onboarding.back') }}</button>
        <div v-else></div>
        <button v-if="step < 6" class="btn btn-primary" @click="step++">{{ t('onboarding.next') }}</button>
        <button v-else class="btn btn-primary" :disabled="saving" @click="finish">
          <span v-if="saving" class="spinner"></span>
          🚀 {{ t('onboarding.finish') }}
        </button>
      </div>
    </div>
  </div>
</template>
 
<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useNutritionStore } from '../stores/nutrition.js'
import { supabase } from '../supabase.js'
 
const { t, tm } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const nutrition = useNutritionStore()
 
const step = ref(1)
const saving = ref(false)
 
const stepLabels = ['Yo\'nalish', 'O\'rganish', 'Sport', 'Vaqt', 'Sog\'liq', 'Maqsad']
 
const form = ref({
  direction: '',
  subjects: [],
  sports: [],
  timeBlocks: [],
  birth_date: '',
  gender: 'male',
  height_cm: null,
  weight_kg: null,
  activity_level: 'moderate',
  goal: '',
  challenge_duration: 90
})
 
// Tug'ilgan sana limiti
const today = new Date()
const maxBirthDate = `${today.getFullYear() - 10}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
const minBirthDate = `${today.getFullYear() - 100}-01-01`
 
const calculatedAge = computed(() => {
  if (!form.value.birth_date) return null
  const birth = new Date(form.value.birth_date)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age > 0 ? age : null
})
 
const birthYear = computed(() => {
  if (!form.value.birth_date) return null
  return new Date(form.value.birth_date).getFullYear()
})
 
function updateAgeFromDate() {
  // avtomatik hisoblanadi calculatedAge orqali
}
 
const bmi = computed(() => {
  const h = form.value.height_cm
  const w = form.value.weight_kg
  if (!h || !w) return null
  return (w / ((h/100) ** 2)).toFixed(1)
})
 
const bmiStatus = computed(() => {
  const b = parseFloat(bmi.value)
  if (!b) return null
  if (b < 18.5) return '🔵 Kam vazn'
  if (b < 25) return '🟢 Normal'
  if (b < 30) return '🟡 Ortiqcha'
  return '🔴 Semizlik'
})
 
const bmiColor = computed(() => {
  const b = parseFloat(bmi.value)
  if (!b) return '#6b7280'
  if (b < 18.5) return '#3b82f6'
  if (b < 25) return '#10b981'
  if (b < 30) return '#f59e0b'
  return '#ef4444'
})
 
const calorieEstimate = computed(() => {
  if (!form.value.height_cm || !form.value.weight_kg || !birthYear.value) return null
  return nutrition.calcDailyCalories({
    height_cm: form.value.height_cm,
    weight_kg: form.value.weight_kg,
    birth_year: birthYear.value,
    gender: form.value.gender,
    activity_level: form.value.activity_level
  })
})
 
const macros = computed(() => {
  if (!calorieEstimate.value) return {}
  return nutrition.getMacroRecommendation(calorieEstimate.value, 'maintain')
})
 
const subjects = [
  { key: 'math', icon: '📐', label: 'Matematika' },
  { key: 'physics', icon: '⚡', label: 'Fizika' },
  { key: 'chemistry', icon: '🧪', label: 'Kimyo' },
  { key: 'biology', icon: '🧬', label: 'Biologiya' },
  { key: 'history', icon: '📜', label: 'Tarix' },
  { key: 'english', icon: '🌍', label: 'Ingliz tili' },
  { key: 'uzbek', icon: '🇺🇿', label: 'Ona tili' },
  { key: 'programming', icon: '💻', label: 'Dasturlash' },
  { key: 'economics', icon: '📈', label: 'Iqtisodiyot' },
  { key: 'geography', icon: '🗺️', label: 'Geografiya' },
]
 
const dayNames = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
 
const timeOptions = []
for (let h = 5; h <= 23; h++) {
  for (let m of ['00', '30']) {
    timeOptions.push(`${String(h).padStart(2,'0')}:${m}`)
  }
}
 
function toggleArr(arr, val) {
  const i = arr.indexOf(val)
  if (i === -1) arr.push(val)
  else arr.splice(i, 1)
}
 
function addBlock() {
  form.value.timeBlocks.push({ title: '', days: [], start: '09:00', end: '11:00' })
}
 
async function finish() {
  saving.value = true
  try {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + form.value.challenge_duration)

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        onboarding_done: true,
        direction: form.value.direction,
        subjects: form.value.subjects,
        sports: form.value.sports,
        goal: form.value.goal,
        challenge_start: startDate.toISOString().split('T')[0],
        challenge_end: endDate.toISOString().split('T')[0],
        challenge_duration: form.value.challenge_duration,
        birth_year: birthYear.value,
        gender: form.value.gender,
        height_cm: form.value.height_cm,
        weight_kg: form.value.weight_kg,
        activity_level: form.value.activity_level,
        updated_at: new Date().toISOString()
      })
      .eq('id', auth.user?.id)

    if (updateErr) {
      console.error('Profile update error:', updateErr)
      alert('Xato yuz berdi: ' + updateErr.message)
      return
    }

    // Refetch profile so needsOnboarding becomes false
    await auth.fetchProfile()

    // Save time blocks (ignore errors — optional data)
    if (form.value.timeBlocks.length) {
      const validBlocks = form.value.timeBlocks.filter(b => b.title)
      if (validBlocks.length) {
        await supabase.from('time_blocks').insert(
          validBlocks.map(b => ({ user_id: auth.user?.id, ...b }))
        ).catch(e => console.warn('time_blocks insert skipped:', e))
      }
    }

    router.push('/today')
  } catch (e) {
    console.error('finish error:', e)
    alert('Kutilmagan xato: ' + e.message)
  } finally {
    saving.value = false
  }
}
</script>
 
<style scoped>
.onboarding { min-height: 100vh; padding: 24px 16px 40px; position: relative; overflow: hidden; }
.ob-bg { position: fixed; inset: 0; pointer-events: none; }
.ob-orb { position: absolute; width: 500px; height: 500px; background: radial-gradient(circle, rgba(108,99,255,0.15), transparent); top: -100px; right: -100px; border-radius: 50%; }
.ob-container { max-width: 500px; margin: 0 auto; position: relative; z-index: 1; }
.ob-progress { margin-bottom: 32px; }
.ob-steps { display: flex; gap: 6px; margin-bottom: 8px; }
.ob-step { flex: 1; height: 4px; border-radius: 2px; background: var(--surface2); transition: all 0.3s; }
.ob-step.active { background: var(--accent); }
.ob-step.current { background: var(--accent-light); }
.ob-step-label { font-family: var(--font-mono); font-size: 12px; color: var(--text-dim); }
.ob-step-content h2 { font-family: var(--font-display); font-weight: 700; font-size: 20px; margin-bottom: 20px; }
.ob-hint { font-size: 13px; color: var(--text-dim); margin-bottom: 16px; margin-top: -12px; }
.chips-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.chip-lg { font-size: 14px; padding: 10px 16px; }
 
/* Tug'ilgan sana */
.age-display {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(108,99,255,0.1);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--accent-light);
}
 
/* BMI card */
.bmi-card {
  background: var(--surface2);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 16px;
}
.bmi-row { display: flex; gap: 20px; justify-content: center; }
.bmi-item { text-align: center; }
.bmi-val { font-family: var(--font-display); font-weight: 800; font-size: 28px; color: var(--accent-light); }
.bmi-status { font-weight: 600; font-size: 16px; }
.bmi-label { font-size: 11px; color: var(--text-dim); margin-top: 4px; }
 
/* Kaloriya */
.calorie-card { background: rgba(108,99,255,0.1); border: 1px solid rgba(108,99,255,0.3); border-radius: var(--radius); padding: 16px; margin-top: 16px; text-align: center; }
.cal-title { font-size: 13px; color: var(--text-dim); margin-bottom: 8px; }
.cal-value { font-family: var(--font-display); font-weight: 800; font-size: 36px; color: var(--accent-light); }
.cal-value span { font-size: 16px; }
.cal-macros { display: flex; justify-content: center; gap: 16px; margin-top: 10px; font-size: 13px; color: var(--text-dim); }
 
/* Duration */
.duration-options { display: flex; gap: 8px; }
.dur-btn { flex: 1; padding: 12px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-family: var(--font-mono); font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; text-align: center; }
.dur-btn.active { background: var(--accent); border-color: var(--accent); color: white; }
 
/* Summary */
.summary-items { display: flex; flex-direction: column; gap: 8px; }
.sum-item { font-size: 14px; display: flex; gap: 8px; }
.sum-item span { color: var(--text-dim); min-width: 90px; }
 
.tbb-item { padding: 16px; }
.tbb-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
 
.ob-nav { display: flex; justify-content: space-between; margin-top: 32px; gap: 12px; }
 
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
 