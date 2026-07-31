<script setup lang="ts">
const { waConfig, saveWATemplate } = useAttendance()

const templateText = ref('')
const saveSuccessToast = ref(false)

const currentTab = computed({
  get: () => waConfig.value.activeTab,
  set: (val) => {
    waConfig.value.activeTab = val
    templateText.value = waConfig.value.templates[val]
  }
})

onMounted(() => {
  templateText.value = waConfig.value.templates[waConfig.value.activeTab]
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

const handleSaveConfig = () => {
  saveWATemplate(waConfig.value.activeTab, templateText.value)
  saveSuccessToast.value = true
  setTimeout(() => {
    saveSuccessToast.value = false
  }, 3000)
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
            <p class="font-label font-bold text-sm text-on-surface">Kirim Notifikasi Otomatis</p>
            <p class="font-body text-xs text-secondary">Kirim WhatsApp ke nomor ortu/wali murid saat presensi diproses</p>
          </div>
        </div>
        <button
          class="w-12 h-6 rounded-full transition-colors p-1 flex items-center"
          :class="waConfig.automationEnabled ? 'bg-primary justify-end' : 'bg-secondary/40 justify-start'"
          @click="waConfig.automationEnabled = !waConfig.automationEnabled"
        >
          <span class="w-4 h-4 rounded-full bg-white shadow-sm block"></span>
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
            ></textarea>
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
        <span v-if="saveSuccessToast" class="text-xs text-[#00875a] font-bold flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">check_circle</span> Konfigurasi tersimpan!
        </span>
        <button
          class="flex items-center gap-3 px-8 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all"
          @click="handleSaveConfig"
        >
          <span class="material-symbols-outlined text-[20px]">save</span>
          Simpan Konfigurasi WA
        </button>
      </div>
    </div>
  </div>
</template>
