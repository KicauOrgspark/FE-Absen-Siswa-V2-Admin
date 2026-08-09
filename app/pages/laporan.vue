<script setup lang="ts">
const { topAbsents } = useAttendance()
const { fetchApi, getExportUrl } = useApi()

const fromDate = ref('2026-07-01')
const toDate = ref('2026-07-30')
const selectedGrade = ref('Semua Kelas')
const selectedMajor = ref('Semua Jurusan')

const serverTopAlfaList = ref<Record<string, unknown>[]>([])
const monthlyRecapList = ref<Record<string, unknown>[]>([])
const isExporting = ref(false)

const topAlfaLoading = ref(true)
const topAlfaError = ref('')
const recapLoading = ref(true)
const recapError = ref('')

const fetchTopAlfa = async () => {
  topAlfaLoading.value = true
  topAlfaError.value = ''
  const { data, error } = await fetchApi<Record<string, unknown>>('/api/v1/attendance/top-alfa')
  const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : null
  if (list) {
    serverTopAlfaList.value = list as Record<string, unknown>[]
  }
  if (error) {
    topAlfaError.value = error.message || 'Gagal memuat data top alfa.'
  }
  topAlfaLoading.value = false
}

const academicYear = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const start = month >= 7 ? year : year - 1
  const end = start + 1
  return `${start}/${end}`
})

const fetchMonthlyRecap = async () => {
  recapLoading.value = true
  recapError.value = ''
  const { data, error } = await fetchApi<Record<string, unknown>>('/api/v1/attendance/monthly-recap', {
    params: {
      year: academicYear.value,
      angkatan: selectedGrade.value !== 'Semua Kelas' ? selectedGrade.value : undefined,
      jurusan: selectedMajor.value !== 'Semua Jurusan' ? selectedMajor.value : undefined
    }
  })
  const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : null
  if (list) {
    monthlyRecapList.value = list as Record<string, unknown>[]
  }
  if (error) {
    recapError.value = error.message || 'Gagal memuat rekap bulanan.'
  }
  recapLoading.value = false
}

onMounted(() => {
  fetchTopAlfa()
  fetchMonthlyRecap()
})

watch([fromDate, toDate, selectedGrade, selectedMajor], () => {
  fetchMonthlyRecap()
})

const displayTopAbsents = computed(() => {
  if (serverTopAlfaList.value.length) {
    return serverTopAlfaList.value.map((item, idx) => ({
      id: String(item.id || item.user_id || idx),
      name: String(item.full_name || item.name || 'Siswa'),
      nisn: String(item.nisn || '-'),
      class: String(item.class_group || item.class || 'X RPL 1'),
      major: String(item.jurusan || 'RPL'),
      alpaCount: Number(item.alfaCount ?? item.alfa_count ?? item.total_alfa ?? item.alpa_count ?? 0),
      telatCount: Number(item.telatCount ?? item.telat_count ?? 0),
      avatarInitials: String(item.full_name || item.name || 'S').substring(0, 2).toUpperCase(),
      email: String(item.email || `${String(item.full_name || 'student').toLowerCase().replace(/\s+/g, '.')}@student.pelitanusantara.sch.id`),
      activeStatus: String(item.active_status || 'AKTIF')
    }))
  }
  return topAbsents.value
})

const trendMonths = computed(() => {
  if (!monthlyRecapList.value.length) return []
  return monthlyRecapList.value.slice(-6).map((m) => {
    const rate = Math.min(100, Math.max(0, Math.round(Number(m.rate ?? m.hadir_rate ?? m.percentage ?? 0))))
    const hadir = Number(m.hadir ?? m.hadir_count ?? 0)
    const telat = Number(m.telat ?? m.telat_count ?? 0)
    const sakit = Number(m.sakit ?? m.sakit_count ?? 0)
    const izin = Number(m.izin ?? m.izin_count ?? 0)
    const alpa = Number(m.alfa ?? m.alpa ?? m.alfa_count ?? m.alpa_count ?? 0)
    const monthName = String(m.month || m.Month || m.name || 'Bulan')
    return {
      month: monthName,
      rate,
      hadir,
      telat,
      sakit,
      izin,
      alpa
    }
  })
})

const averageRate = computed(() => {
  if (!trendMonths.value.length) return 0
  const sum = trendMonths.value.reduce((acc, curr) => acc + curr.rate, 0)
  return Math.round(sum / trendMonths.value.length)
})

const bestMonth = computed(() => {
  if (!trendMonths.value.length) return '-'
  const sorted = [...trendMonths.value].sort((a, b) => b.rate - a.rate)
  return sorted[0]?.month || '-'
})

const topAbsentStudent = computed(() => {
  const list = displayTopAbsents.value
  if (!list.length || !list[0]) return null
  const top = list[0]
  const topName = top.name || 'Siswa'
  return {
    ...top,
    id: top.id || '0',
    name: topName,
    class: top.class || 'X RPL 1',
    major: top.major || 'RPL',
    alpaCount: top.alpaCount || 0,
    avatarInitials: top.avatarInitials || 'S',
    nisn: top.nisn || 'TRB-1030',
    email: top.email || `${topName.toLowerCase().replace(/\s+/g, '.')}@student.pelitanusantara.sch.id`,
    parentName: 'Orang Tua Siswa',
    parentPhone: '081234567890',
    activeStatus: top.activeStatus || 'AKTIF'
  }
})

const { showError, showSuccess, showInfo } = useAppToast()

const exportToExcel = async () => {
  isExporting.value = true
  showInfo('Memulai penyiapan file laporan Excel...')
  const angkatan = selectedGrade.value !== 'Semua Kelas' ? selectedGrade.value : undefined
  const jurusan = selectedMajor.value !== 'Semua Jurusan' ? selectedMajor.value : undefined

  const { getToken } = useApi()
  const token = getToken()
  const exportUrl = getExportUrl('/api/v1/export/attendance', {
    angkatan,
    jurusan,
    start_date: fromDate.value,
    end_date: toDate.value
  })

  try {
    const blob = await $fetch<Blob>(exportUrl, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      responseType: 'blob'
    })

    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.setAttribute('download', `Laporan_Presensi_${fromDate.value}_sd_${toDate.value}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
    showSuccess('File Laporan Presensi Excel berhasil diunduh!')
  } catch (err: unknown) {
    console.error('Export download error:', err)
    showError(extractApiErrorMessage(err, 'Gagal mengunduh file laporan Excel.'))
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-stack-lg">
    <!-- Header Section -->
    <header class="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
      <div>
        <h2 class="font-headline text-[36px] md:text-[48px] text-primary tracking-tight font-bold">
          Attendance Reports
        </h2>
        <p class="font-body text-body-lg text-secondary mt-1">
          Laporan rekap presensi dan log kehadiran siswa secara akurat dan realtime.
        </p>
      </div>
    </header>

    <!-- Control Bar & Filters -->
    <div class="bg-surface-white border border-surface-container-highest rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <!-- Date Pickers -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <div class="relative flex-1 sm:w-36">
            <input
              v-model="fromDate"
              type="date"
              class="w-full appearance-none bg-surface-white border border-surface-container-highest py-2 px-3 rounded font-body text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer text-deep-black font-medium"
              title="Tanggal Mulai"
            >
          </div>
          <span class="text-secondary text-xs font-bold">s/d</span>
          <div class="relative flex-1 sm:w-36">
            <input
              v-model="toDate"
              type="date"
              class="w-full appearance-none bg-surface-white border border-surface-container-highest py-2 px-3 rounded font-body text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer text-deep-black font-medium"
              title="Tanggal Akhir"
            >
          </div>
        </div>

        <!-- Grade Filter -->
        <div class="relative flex-1 sm:flex-none">
          <select
            v-model="selectedGrade"
            class="w-full appearance-none bg-surface-white border border-surface-container-highest text-deep-black py-2 pl-3 pr-8 rounded font-body text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer font-medium"
          >
            <option value="Semua Kelas">
              Semua Kelas
            </option>
            <option value="X">
              Kelas X
            </option>
            <option value="XI">
              Kelas XI
            </option>
            <option value="XII">
              Kelas XII
            </option>
          </select>
          <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[20px]">arrow_drop_down</span>
        </div>

        <!-- Major Filter -->
        <div class="relative flex-1 sm:flex-none">
          <select
            v-model="selectedMajor"
            class="w-full appearance-none bg-surface-white border border-surface-container-highest text-deep-black py-2 pl-3 pr-8 rounded font-body text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer font-medium"
          >
            <option value="Semua Jurusan">
              Semua Jurusan
            </option>
            <option value="DKV">
              DKV
            </option>
            <option value="RPL">
              RPL
            </option>
            <option value="TKJ">
              TKJ
            </option>
            <option value="TOI">
              TOI
            </option>
          </select>
          <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[20px]">arrow_drop_down</span>
        </div>
      </div>

      <!-- Export Actions -->
      <div class="flex items-center gap-3 w-full md:w-auto justify-end">
        <button
          class="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2 rounded.md font-label text-xs hover:bg-primary-container transition-colors duration-200 shadow-sm font-bold active:scale-95 disabled:opacity-50"
          :disabled="isExporting"
          @click="exportToExcel"
        >
          <span
            class="material-symbols-outlined text-[18px]"
            :class="{ 'animate-spin': isExporting }"
          >file_download</span>
          {{ isExporting ? 'Mengunduh...' : 'Export Excel' }}
        </button>
      </div>
    </div>

    <!-- Monthly Attendance Trend Chart Section -->
    <div class="bg-surface-white border border-surface-container-highest rounded-xl p-6 shadow-sm flex flex-col gap-5">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-surface-container-highest pb-4">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-headline text-lg text-primary font-bold">
              Tren Presensi Bulanan (Monthly Attendance Trend)
            </h3>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Realtime Sync
            </span>
          </div>
          <p class="text-xs text-secondary mt-0.5">
            Grafik tingkat persentase kehadiran siswa per bulan beserta indikator detail untuk memudahkan evaluasi administrasi sekolah.
          </p>
        </div>

        <div class="flex items-center gap-4 text-xs font-medium">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded bg-primary" />
            <span class="text-deep-black">Tingkat Hadir (%)</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="recapLoading"
        class="h-56 flex flex-col items-center justify-center gap-2 text-secondary text-xs"
      >
        <span class="material-symbols-outlined text-[24px] animate-spin text-primary">progress_activity</span>
        <span>Memuat data grafik bulanan...</span>
      </div>

      <!-- Error State -->
      <div
        v-else-if="recapError"
        class="h-56 flex items-center justify-center text-rose-600 text-xs text-center px-4"
      >
        <span class="material-symbols-outlined text-[18px] mr-1.5">error</span>
        {{ recapError }}
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!trendMonths.length"
        class="h-56 flex flex-col items-center justify-center gap-2 text-secondary text-xs text-center px-4"
      >
        <span class="material-symbols-outlined text-[32px] text-secondary/40">bar_chart_off</span>
        <span>Belum ada data rekap bulanan untuk filter yang dipilih.</span>
      </div>

      <!-- Interactive Multi-Bar Visual Chart -->
      <div
        v-else
        class="flex flex-col gap-4"
      >
        <!-- Chart Canvas with Y-Axis lines -->
        <div class="relative h-60 w-full pt-6 pb-2 px-2 flex items-end justify-around bg-surface-container-low/40 rounded-lg border border-surface-container-highest/60 overflow-hidden">
          <!-- Background Grid lines -->
          <div class="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-30">
            <div class="border-b border-dashed border-secondary/50 flex justify-between text-[9px] font-mono text-secondary">
              <span>100%</span>
            </div>
            <div class="border-b border-dashed border-secondary/50 flex justify-between text-[9px] font-mono text-secondary">
              <span>75%</span>
            </div>
            <div class="border-b border-dashed border-secondary/50 flex justify-between text-[9px] font-mono text-secondary">
              <span>50%</span>
            </div>
            <div class="border-b border-dashed border-secondary/50 flex justify-between text-[9px] font-mono text-secondary">
              <span>25%</span>
            </div>
            <div class="border-b border-secondary/50 flex justify-between text-[9px] font-mono text-secondary">
              <span>0%</span>
            </div>
          </div>

          <!-- Month Columns -->
          <div
            v-for="m in trendMonths"
            :key="'month-col-' + m.month"
            class="relative z-10 flex-1 max-w-24 h-full flex flex-col justify-end items-center group px-1"
          >
            <!-- Badge Percentage Above Bar -->
            <div
              class="mb-1.5 px-2 py-0.5 rounded text-[11px] font-bold shadow-xs transition-all duration-200 group-hover:scale-110"
              :class="m.rate >= 85 ? 'bg-emerald-100 text-emerald-800' : m.rate >= 70 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'"
            >
              {{ m.rate }}%
            </div>

            <!-- Main Bar -->
            <div
              class="w-full rounded-t-md transition-all duration-300 relative group-hover:brightness-110 shadow-sm flex flex-col justify-end overflow-hidden"
              :class="m.rate >= 85 ? 'bg-gradient-to-t from-primary to-primary/80' : m.rate >= 70 ? 'bg-gradient-to-t from-amber-600 to-amber-500' : 'bg-gradient-to-t from-rose-600 to-rose-500'"
              :style="{ height: `${Math.max(10, m.rate)}%` }"
            >
              <!-- Hover detail tooltip -->
              <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-deep-black text-white text-[11px] p-2.5 rounded-lg shadow-xl z-30 pointer-events-none min-w-36 space-y-1">
                <p class="font-bold border-b border-white/20 pb-1 text-center font-headline">
                  Rekap {{ m.month }}
                </p>
                <div class="text-[10px] space-y-0.5">
                  <div class="flex justify-between">
                    <span>Tingkat Hadir:</span> <strong class="text-emerald-400">{{ m.rate }}%</strong>
                  </div>
                  <div
                    v-if="m.hadir"
                    class="flex justify-between"
                  >
                    <span>Hadir:</span> <span>{{ m.hadir }} siswa</span>
                  </div>
                  <div
                    v-if="m.telat"
                    class="flex justify-between"
                  >
                    <span>Telat:</span> <span class="text-amber-300">{{ m.telat }} siswa</span>
                  </div>
                  <div
                    v-if="m.sakit"
                    class="flex justify-between"
                  >
                    <span>Sakit:</span> <span class="text-sky-300">{{ m.sakit }} siswa</span>
                  </div>
                  <div
                    v-if="m.izin"
                    class="flex justify-between"
                  >
                    <span>Izin:</span> <span class="text-purple-300">{{ m.izin }} siswa</span>
                  </div>
                  <div
                    v-if="m.alpa"
                    class="flex justify-between"
                  >
                    <span>Alpa:</span> <span class="text-rose-400 font-bold">{{ m.alpa }} siswa</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Month Label Below Bar -->
            <span class="mt-2 text-xs font-bold text-deep-black font-label tracking-tight">
              {{ m.month }}
            </span>
          </div>
        </div>

        <!-- Summary Metrics Footer -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          <div class="p-3 rounded-lg bg-surface-container-low border border-surface-container-highest flex items-center gap-3">
            <span class="material-symbols-outlined text-primary text-[24px]">analytics</span>
            <div>
              <p class="text-[11px] text-secondary font-medium">
                Rata-rata Presensi
              </p>
              <p class="text-sm font-bold text-deep-black">
                {{ averageRate }}%
              </p>
            </div>
          </div>
          <div class="p-3 rounded-lg bg-surface-container-low border border-surface-container-highest flex items-center gap-3">
            <span class="material-symbols-outlined text-emerald-600 text-[24px]">workspace_premium</span>
            <div>
              <p class="text-[11px] text-secondary font-medium">
                Bulan Kehadiran Terbaik
              </p>
              <p class="text-sm font-bold text-emerald-700">
                {{ bestMonth }}
              </p>
            </div>
          </div>
          <div class="col-span-2 md:col-span-1 p-3 rounded-lg bg-surface-container-low border border-surface-container-highest flex items-center gap-3">
            <span class="material-symbols-outlined text-secondary text-[24px]">verified</span>
            <div>
              <p class="text-[11px] text-secondary font-medium">
                Status Data Rekap
              </p>
              <p class="text-sm font-bold text-deep-black">
                Tergabung {{ trendMonths.length }} Bulan
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Absence Analysis Section -->
    <div class="mb-stack-lg">
      <h3 class="font-headline text-[24px] text-primary tracking-tight font-bold mb-4">
        Top 10 Students with Most Absences (Alpa)
      </h3>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter-grid">
        <!-- Top 10 List -->
        <div class="lg:col-span-2 bg-surface-white border border-surface-container-highest rounded-lg p-6 shadow-sm">
          <!-- Loading -->
          <div
            v-if="topAlfaLoading"
            class="flex items-center justify-center gap-2 py-8 text-secondary text-sm"
          >
            <span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            Memuat data top alfa...
          </div>

          <!-- Error -->
          <div
            v-else-if="topAlfaError && !displayTopAbsents.length"
            class="flex items-center justify-center gap-2 py-8 text-rose-600 text-sm text-center"
          >
            <span class="material-symbols-outlined text-[18px]">error</span>
            {{ topAlfaError }}
          </div>

          <!-- Empty -->
          <div
            v-else-if="!displayTopAbsents.length"
            class="flex items-center justify-center gap-2 py-8 text-secondary text-sm"
          >
            <span class="material-symbols-outlined text-[18px]">person_off</span>
            Belum ada data alpa.
          </div>

          <!-- List -->
          <ul
            v-else
            class="divide-y divide-surface-container-highest"
          >
            <li
              v-for="(student, index) in displayTopAbsents"
              :key="student.id"
              class="py-3 flex justify-between items-center"
            >
              <div class="flex items-center gap-3">
                <span class="font-bold text-secondary text-sm w-4">{{ index + 1 }}</span>
                <div>
                  <p class="font-bold text-deep-black text-sm">
                    {{ student.name }}
                  </p>
                  <p class="text-xs text-secondary">
                    {{ student.class }}
                  </p>
                </div>
              </div>
              <span class="font-bold text-error bg-error-container px-2.5 py-1 rounded text-xs">
                {{ student.alpaCount }} Alpa
              </span>
            </li>
          </ul>
          <p
            v-if="topAlfaError && displayTopAbsents.length"
            class="mt-3 text-[11px] text-amber-600 flex items-center gap-1"
          >
            <span class="material-symbols-outlined text-sm">warning</span>
            Data server gagal dimuat, menampilkan data lokal. ({{ topAlfaError }})
          </p>
        </div>

        <!-- Featured Most Absent Student Detail Card -->
        <div
          v-if="topAbsentStudent"
          class="lg:col-span-1 bg-surface-white border border-surface-container-highest rounded-xl p-6 flex flex-col shadow-sm relative overflow-hidden"
        >
          <div class="absolute top-0 left-0 w-full h-1.5 bg-error" />

          <!-- Card Header & Badge -->
          <div class="flex items-center justify-between mb-4">
            <span class="font-label text-xs font-bold text-error uppercase tracking-wider flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">warning</span> Top 1 Alpa Terbanyak
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-error-container text-error">
              {{ topAbsentStudent.alpaCount }} Total Alpa
            </span>
          </div>

          <!-- Student Profile Header -->
          <div class="flex items-center gap-4 pb-4 border-b border-surface-container-highest mb-4">
            <div class="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold text-lg shrink-0 border border-outline-variant/30">
              {{ topAbsentStudent.avatarInitials }}
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-headline font-bold text-deep-black text-base truncate">
                {{ topAbsentStudent.name }}
              </h4>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs text-secondary">{{ topAbsentStudent.class }}</span>
                <span class="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                  {{ topAbsentStudent.activeStatus }}
                </span>
              </div>
            </div>
          </div>

          <!-- Detailed Information List -->
          <div class="space-y-2.5 flex-1 text-xs">
            <div class="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container-highest">
              <span class="text-secondary font-medium flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm text-primary">badge</span> NISN / ID
              </span>
              <span class="font-mono font-bold text-deep-black">{{ topAbsentStudent.nisn }}</span>
            </div>

            <div class="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container-highest">
              <span class="text-secondary font-medium flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm text-primary">school</span> Kelas & Jurusan
              </span>
              <span class="font-bold text-deep-black">{{ topAbsentStudent.class }} ({{ topAbsentStudent.major || 'RPL' }})</span>
            </div>

            <div class="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container-highest">
              <span class="text-secondary font-medium flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm text-primary">mail</span> Email Siswa
              </span>
              <span
                class="font-medium text-deep-black truncate max-w-40"
                :title="topAbsentStudent.email"
              >{{ topAbsentStudent.email }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
