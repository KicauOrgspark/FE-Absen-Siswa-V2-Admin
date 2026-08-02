<script setup lang="ts">
const { topAbsents } = useAttendance()
const { fetchApi, getExportUrl } = useApi()

const fromDate = ref('2026-07-01')
const toDate = ref('2026-07-30')
const selectedGrade = ref('Grade X')
const selectedMajor = ref('All Majors')
const searchQuery = ref('')

const serverTopAlfaList = ref<Record<string, unknown>[]>([])
const monthlyRecapData = ref<Record<string, unknown> | null>(null)
const attendanceLogsList = ref<Record<string, unknown>[]>([])
const isExporting = ref(false)

const fetchTopAlfa = async () => {
  const { data } = await fetchApi<Record<string, unknown>>('/api/v1/attendance/top-alfa')
  const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : null
  if (list) {
    serverTopAlfaList.value = list as Record<string, unknown>[]
  }
}

const fetchMonthlyRecap = async () => {
  const { data } = await fetchApi<Record<string, unknown>>('/api/v1/attendance/monthly-recap', {
    params: { year: '2025/2026' }
  })
  if (data) {
    monthlyRecapData.value = data
  }
}

const fetchAttendanceLogs = async () => {
  const { data } = await fetchApi<Record<string, unknown>>('/api/v1/attendance/logs', {
    params: {
      page: 1,
      limit: 12,
      start_date: fromDate.value,
      end_date: toDate.value,
      class_group: selectedGrade.value !== 'Grade X' ? selectedGrade.value : undefined,
      search: searchQuery.value || undefined
    }
  })
  const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : null
  if (list) {
    attendanceLogsList.value = list as Record<string, unknown>[]
  }
}

onMounted(() => {
  fetchTopAlfa()
  fetchMonthlyRecap()
  fetchAttendanceLogs()
})

watch([fromDate, toDate, selectedGrade, selectedMajor], () => {
  fetchAttendanceLogs()
})

const displayTopAbsents = computed(() => {
  if (serverTopAlfaList.value.length) {
    return serverTopAlfaList.value.map((item, idx) => ({
      id: String(item.id || item.user_id || idx),
      name: String(item.full_name || item.name || 'Siswa'),
      nisn: String(item.nisn || '-'),
      class: String(item.class_group || item.class || 'X RPL 1'),
      major: String(item.jurusan || 'RPL'),
      alpaCount: Number(item.total_alfa || item.alpa_count || item.alfa_count || 0),
      avatarInitials: String(item.full_name || item.name || 'S').substring(0, 2).toUpperCase(),
      email: String(item.email || `${String(item.full_name || 'student').toLowerCase().replace(/\s+/g, '.')}@student.pelitanusantara.sch.id`),
      activeStatus: String(item.active_status || 'AKTIF')
    }))
  }
  return topAbsents.value
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
  const kelas = selectedGrade.value !== 'Grade X' ? selectedGrade.value : 'X-RPL-1'
  const jurusan = selectedMajor.value !== 'All Majors' ? selectedMajor.value : 'RPL'

  const { getToken } = useApi()
  const token = getToken()
  const exportUrl = getExportUrl('/api/v1/export/attendance', {
    kelas,
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
          Detailed attendance logs and aggregated insights for the entire school.
        </p>
      </div>
    </header>

    <!-- Summary & Actions Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter-grid mb-stack-lg">
      <!-- Monthly Trend Card -->
      <div class="lg:col-span-1 bg-surface-white border border-surface-container-highest rounded-lg p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div class="flex justify-between items-center mb-6 z-10 relative">
          <span class="font-label text-[11px] text-secondary font-bold uppercase tracking-widest">Monthly Attendance Trend</span>
          <span class="material-symbols-outlined text-secondary/30 text-[20px]">timeline</span>
        </div>

        <div class="relative z-10 flex flex-col h-32 w-full">
          <!-- Chart Bars -->
          <div class="w-full h-full flex items-end gap-2 px-2 pb-6 border-b border-l border-surface-container-highest relative">
            <div class="w-1/4 bg-primary/20 h-[70%] rounded-t-sm relative group cursor-pointer hover:bg-primary/30 transition-colors">
              <div class="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-deep-black text-white text-[10px] py-1 px-2 rounded font-bold shadow-md z-20">
                92%
              </div>
            </div>
            <div class="w-1/4 bg-primary/40 h-[85%] rounded-t-sm relative group cursor-pointer hover:bg-primary/50 transition-colors">
              <div class="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-deep-black text-white text-[10px] py-1 px-2 rounded font-bold shadow-md z-20">
                94%
              </div>
            </div>
            <div class="w-1/4 bg-primary/60 h-[75%] rounded-t-sm relative group cursor-pointer hover:bg-primary/70 transition-colors">
              <div class="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-deep-black text-white text-[10px] py-1 px-2 rounded font-bold shadow-md z-20">
                91%
              </div>
            </div>
            <div class="w-1/4 bg-primary h-[95%] rounded-t-sm relative group cursor-pointer hover:bg-primary-container transition-colors">
              <div class="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-deep-black text-white text-[10px] py-1 px-2 rounded font-bold shadow-md z-20">
                97%
              </div>
            </div>
          </div>
          <div class="flex justify-between mt-2 font-label text-[10px] text-secondary w-full">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </div>
      </div>

      <!-- Filters & Export -->
      <div class="lg:col-span-2 bg-surface-white border border-surface-container-highest rounded-lg p-6 flex flex-col gap-4 justify-center shadow-sm">
        <div class="flex flex-wrap items-center gap-stack-md w-full">
          <!-- Date Pickers -->
          <div class="flex items-center gap-2 w-full md:w-auto">
            <div class="relative flex-1 md:w-36">
              <input
                v-model="fromDate"
                type="date"
                class="w-full appearance-none bg-surface-white border border-surface-container-highest py-2 px-3 rounded font-body text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer text-secondary"
                title="From Date"
              >
            </div>
            <span class="text-secondary">-</span>
            <div class="relative flex-1 md:w-36">
              <input
                v-model="toDate"
                type="date"
                class="w-full appearance-none bg-surface-white border border-surface-container-highest py-2 px-3 rounded font-body text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer text-secondary"
                title="To Date"
              >
            </div>
          </div>

          <!-- Grade Filter -->
          <div class="relative flex-1 md:flex-none">
            <select
              v-model="selectedGrade"
              class="w-full appearance-none bg-surface-white border border-surface-container-highest text-on-background py-2 pl-3 pr-8 rounded font-body text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none min-w-30 cursor-pointer"
            >
              <option value="Grade X">
                Grade X
              </option>
              <option value="Grade XI">
                Grade XI
              </option>
              <option value="Grade XII">
                Grade XII
              </option>
            </select>
            <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[20px]">arrow_drop_down</span>
          </div>

          <!-- Major Filter -->
          <div class="relative flex-1 md:flex-none">
            <select
              v-model="selectedMajor"
              class="w-full appearance-none bg-surface-white border border-surface-container-highest text-on-background py-2 pl-3 pr-8 rounded font-body text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none min-w-40 cursor-pointer"
            >
              <option value="All Majors">
                All Majors
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

          <!-- Export Actions -->
          <div class="flex items-center gap-stack-sm w-full md:w-auto ml-auto">
            <button
              class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-md font-label text-label-lg hover:bg-primary-container transition-colors duration-200 shadow-sm font-bold active:scale-95 disabled:opacity-50"
              :disabled="isExporting"
              @click="exportToExcel"
            >
              <span
                class="material-symbols-outlined text-[20px]"
                :class="{ 'animate-spin': isExporting }"
              >table</span>
              {{ isExporting ? 'Exporting...' : 'Export Excel (BE)' }}
            </button>
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
          <ul class="divide-y divide-surface-container-highest">
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
