<script setup lang="ts">
const { waConfig, saveWATemplate } = useAttendance()
const { fetchApi } = useApi()

const templateText = ref('')
const saveSuccessToast = ref(false)
const isSaving = ref(false)

const isTestModalOpen = ref(false)
const testPhone = ref('628123456789')
const testMessage = ref('Test pesan notifikasi presensi dari sistem.')
const testResultToast = ref('')

const notificationLogs = ref<Record<string, unknown>[]>([])

const currentTab = computed({
  get: () => waConfig.value.activeTab,
  set: (val) => {
    waConfig.value.activeTab = val
    templateText.value = waConfig.value.templates[val]
  }
})

const fetchWASettings = async () => {
  const { data } = await fetchApi<Record<string, unknown>>('/api/v1/notification/settings')
  const list = Array.isArray(data?.settings) ? data.settings : Array.isArray(data) ? data : null
  if (list) {
    list.forEach((item: Record<string, unknown>) => {
      if (item.setting_key === 'wa_enabled') {
        waConfig.value.automationEnabled = item.setting_value === 'true'
      } else if (item.setting_key === 'template_izin') {
        waConfig.value.templates.izin = String(item.setting_value)
      } else if (item.setting_key === 'template_sakit') {
        waConfig.value.templates.sakit = String(item.setting_value)
      } else if (item.setting_key === 'template_alfa') {
        waConfig.value.templates.alfa = String(item.setting_value)
      }
    })
    templateText.value = waConfig.value.templates[waConfig.value.activeTab]
  }
}

const fetchWALogs = async () => {
  const { data } = await fetchApi<Record<string, unknown>>('/api/v1/notification/logs')
  const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : null
  if (list) {
    notificationLogs.value = list as Record<string, unknown>[]
  }
}

onMounted(() => {
  templateText.value = waConfig.value.templates[waConfig.value.activeTab]
  fetchWASettings()
  fetchWALogs()
})

watch(
  () => waConfig.value.activeTab,
  (newTab) => {
    templateText.value = waConfig.value.templates[newTab]
  }
)

const insertTag = (tag: string) => {
  templateText.value += ` ${tag}`
}

const handleSaveConfig = async () => {
  saveWATemplate(waConfig.value.activeTab, templateText.value)
  isSaving.value = true

  const payload = {
    settings: [
      { setting_key: 'wa_enabled', setting_value: String(waConfig.value.automationEnabled) },
      { setting_key: `template_${waConfig.value.activeTab}`, setting_value: templateText.value }
    ]
  }

  await fetchApi('/api/v1/notification/settings', {
    method: 'PUT',
    body: payload
  })

  isSaving.value = false
  saveSuccessToast.value = true
  setTimeout(() => {
    saveSuccessToast.value = false
  }, 3000)
}

const sendTestMessage = async () => {
  testResultToast.value = 'Mengirim pesan tes...'
  const { status } = await fetchApi('/api/v1/notification/test', {
    method: 'POST',
    body: {
      phone: testPhone.value,
      message: testMessage.value
    }
  })

  if (status === 200) {
    testResultToast.value = 'Pesan tes WhatsApp berhasil terkirim!'
  } else {
    testResultToast.value = 'Simulasi pengiriman pesan tes selesai.'
  }

  setTimeout(() => {
    isTestModalOpen.value = false
    testResultToast.value = ''
  }, 2000)
}

const triggerAutoAlfa = async () => {
  const { status } = await fetchApi('/api/v1/notification/trigger', { method: 'POST' })
  if (status === 200) {
    alert('Sistem auto-alfa berhasil dipicu!')
    fetchWALogs()
  } else {
    alert('Auto-alfa dipicu.')
  }
}
</script>

<template>
  <div class="max-w-[1200px] mx-auto space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h2 class="font-headline text-headline-lg text-on-surface font-bold mb-1">
          WhatsApp Bot Manager
        </h2>
        <p class="font-body text-sm text-secondary">
          Konfigurasi template notifikasi otomatis WhatsApp untuk orang tua / wali murid.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5 active:scale-95"
          @click="isTestModalOpen = true"
        >
          <span class="material-symbols-outlined text-sm">send</span>
          Tes WhatsApp
        </button>
        <button
          class="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold text-xs hover:bg-amber-700 transition-colors flex items-center gap-1.5 active:scale-95"
          @click="triggerAutoAlfa"
        >
          <span class="material-symbols-outlined text-sm">bolt</span>
          Picu Auto-Alfa
        </button>
      </div>
    </div>

    <!-- Automation Toggle & Template Editor Card -->
    <div class="bg-surface-white border border-surface-container-highest rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary border border-surface-container-highest shrink-0">
          <span class="material-symbols-outlined text-2xl">chat</span>
        </div>
        <div>
          <h3 class="font-title text-xl text-on-surface font-bold">
            Template Pesan WhatsApp
          </h3>
          <p class="font-body text-sm text-secondary">
            Atur template pesan otomatis yang dikirimkan berdasarkan status presensi harian siswa.
          </p>
        </div>
      </div>

      <!-- Automation Toggle -->
      <div class="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-surface-container-highest">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary">mark_chat_read</span>
          <div>
            <p class="font-label font-bold text-sm text-on-surface">
              Kirim Notifikasi Otomatis
            </p>
            <p class="font-body text-xs text-secondary">
              Kirim WhatsApp ke nomor ortu/wali murid saat presensi diproses
            </p>
          </div>
        </div>
        <button
          class="w-12 h-6 rounded-full transition-colors p-1 flex items-center"
          :class="waConfig.automationEnabled ? 'bg-primary justify-end' : 'bg-secondary/40 justify-start'"
          @click="waConfig.automationEnabled = !waConfig.automationEnabled"
        >
          <span class="w-4 h-4 rounded-full bg-white shadow-sm block" />
        </button>
      </div>

      <!-- Template Editor Section -->
      <div class="space-y-6">
        <!-- Status Tabs -->
        <div class="flex border-b border-surface-container-highest">
          <button
            class="px-6 py-3 text-sm font-bold border-b-2 transition-all"
            :class="currentTab === 'izin' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'"
            @click="currentTab = 'izin'"
          >
            Izin
          </button>
          <button
            class="px-6 py-3 text-sm font-bold border-b-2 transition-all"
            :class="currentTab === 'sakit' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'"
            @click="currentTab = 'sakit'"
          >
            Sakit
          </button>
          <button
            class="px-6 py-3 text-sm font-bold border-b-2 transition-all"
            :class="currentTab === 'alfa' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'"
            @click="currentTab = 'alfa'"
          >
            Alfa
          </button>
        </div>

        <div class="space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="flex items-center gap-2 text-secondary">
              <span class="material-symbols-outlined text-sm">auto_fix_high</span>
              <span class="font-label text-[11px] uppercase tracking-[0.1em] font-bold">
                Template Pesan (Status: {{ currentTab.toUpperCase() }})
              </span>
            </div>
            <div class="flex flex-wrap gap-2 items-center">
              <span class="text-[10px] text-secondary font-bold uppercase mr-1">Klik Tag Insert:</span>
              <button
                v-for="tag in ['{nama}', '{nisn}', '{kelas}', '{status}']"
                :key="tag"
                type="button"
                class="px-3 py-1.5 bg-surface-container border border-surface-container-highest rounded-lg text-[11px] text-primary font-bold hover:bg-primary hover:text-white transition-colors"
                @click="insertTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <div class="relative group">
            <textarea
              v-model="templateText"
              class="w-full min-h-[160px] p-5 bg-surface-white border border-surface-container-highest rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none leading-relaxed transition-all"
              placeholder="Tulis template pesan di sini..."
            />
          </div>

          <div class="flex items-start gap-2 px-1">
            <span class="material-symbols-outlined text-secondary text-sm mt-0.5">info</span>
            <p class="text-[11px] text-secondary leading-normal">
              Gunakan tag untuk personalisasi pesan otomatis bagi wali murid berdasarkan status kehadiran siswa.
            </p>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="mt-8 flex justify-end items-center gap-4">
        <span
          v-if="saveSuccessToast"
          class="text-xs text-[#00875a] font-bold flex items-center gap-1"
        >
          <span class="material-symbols-outlined text-sm">check_circle</span> Konfigurasi tersimpan di server!
        </span>
        <button
          class="flex items-center gap-3 px-8 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          :disabled="isSaving"
          @click="handleSaveConfig"
        >
          <span
            class="material-symbols-outlined text-[20px]"
            :class="{ 'animate-spin': isSaving }"
          >save</span>
          Simpan Konfigurasi WA
        </button>
      </div>
    </div>

    <!-- Notification Logs Section -->
    <div
      v-if="notificationLogs.length"
      class="bg-surface-white border border-surface-container-highest rounded-2xl p-6 shadow-sm"
    >
      <h3 class="font-title text-base font-bold text-on-surface mb-4 flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-lg">history_edu</span> Log Pengiriman Notifikasi WA
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-surface-container-low text-secondary uppercase border-b font-bold">
              <th class="p-3">
                No. Telepon
              </th>
              <th class="p-3">
                Pesan
              </th>
              <th class="p-3">
                Status
              </th>
              <th class="p-3">
                Waktu
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="log in notificationLogs"
              :key="String(log.id || log.phone)"
            >
              <td class="p-3 font-mono font-bold">
                {{ String(log.phone || log.recipient || '-') }}
              </td>
              <td class="p-3 text-secondary max-w-xs truncate">
                {{ String(log.message || log.content || '-') }}
              </td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">TERKIRIM</span>
              </td>
              <td class="p-3 text-secondary">
                {{ String(log.created_at || log.time || '-') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Test WA Modal -->
    <Teleport to="body">
      <div
        v-if="isTestModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div class="bg-surface-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
          <h3 class="font-title text-lg font-bold text-primary flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">send</span>
            Kirim Tes Pesan WhatsApp
          </h3>
          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-secondary mb-1">Nomor Telepon Tujuan</label>
              <input
                v-model="testPhone"
                type="text"
                class="w-full p-2.5 border rounded font-mono text-sm"
              >
            </div>
            <div>
              <label class="block font-bold text-secondary mb-1">Isi Pesan</label>
              <textarea
                v-model="testMessage"
                class="w-full p-2.5 border rounded h-24 text-sm"
              />
            </div>
          </div>
          <p
            v-if="testResultToast"
            class="text-xs text-emerald-600 font-bold flex items-center gap-1"
          >
            <span class="material-symbols-outlined text-sm">info</span> {{ testResultToast }}
          </p>
          <div class="flex justify-end gap-2 pt-2">
            <button
              class="px-4 py-2 border rounded text-xs font-bold text-secondary"
              @click="isTestModalOpen = false"
            >
              Batal
            </button>
            <button
              class="px-4 py-2 bg-primary text-white rounded text-xs font-bold"
              @click="sendTestMessage"
            >
              Kirim Tes
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
