<script setup lang="ts">
import { normalizeStatus } from '~/composables/useAttendance'

const {
  students,
  stats,
  availableClasses,
  hasMoreStudents,
  fetchDashboardStats,
  fetchAttendanceStudents,
  loadMoreStudents,
  fetchClassesList
} = useAttendance()

const { fetchApi } = useApi()

const searchQuery = ref('')
const selectedYear = ref('Semua')
const selectedMajor = ref('Semua')
const selectedClass = ref('Semua')
const selectedStatus = ref('Semua')

const currentPage = ref(1)
const itemsPerPage = ref(50)

interface AttendanceLogItem {
  id: string
  name: string
  nisn: string
  class: string
  major: string
  status: string
  ip: string
  time: string
}

const attendanceLogsList = ref<AttendanceLogItem[]>([])
const logsLoading = ref(true)
const logsError = ref('')
const logCurrentPage = ref(1)
const logItemsPerPage = ref(20)
const logTotalCount = ref(0)
const logTotalPages = computed(() => Math.ceil(logTotalCount.value / logItemsPerPage.value) || 1)

const getTodayDateString = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fetchAttendanceLogs = async () => {
  logsLoading.value = true
  logsError.value = ''

  const today = getTodayDateString()
  let apiStatus = selectedStatus.value !== 'Semua' ? selectedStatus.value.toLowerCase() : undefined
  if (apiStatus === 'alpa') apiStatus = 'alfa'
  if (apiStatus === 'belum absen') apiStatus = 'belum_absen'

  const { data, error } = await fetchApi<Record<string, unknown>>('/api/v1/attendance/logs', {
    params: {
      page: logCurrentPage.value,
      limit: logItemsPerPage.value,
      start_date: today,
      end_date: today,
      angkatan: selectedYear.value !== 'Semua' ? selectedYear.value : undefined,
      jurusan: selectedMajor.value !== 'Semua' ? selectedMajor.value : undefined,
      class_group: selectedClass.value !== 'Semua' ? selectedClass.value : undefined,
      status: apiStatus,
      search: searchQuery.value.trim() || undefined
    }
  })

  if (error) {
    logsError.value = error.message || 'Gagal memuat log absensi.'
    attendanceLogsList.value = []
    logTotalCount.value = 0
    logsLoading.value = false
    return
  }

  const resObj = data?.data as Record<string, unknown> | undefined
  const rawList = Array.isArray(resObj?.logs)
    ? resObj.logs
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : []

  const serverTotal = Number(resObj?.total ?? resObj?.total_logs ?? (data as Record<string, unknown>)?.total ?? rawList.length)
  logTotalCount.value = Math.max(serverTotal, rawList.length)

  attendanceLogsList.value = (rawList as Record<string, unknown>[]).map((log, idx) => {
    const user = (log.user || log.siswa || {}) as Record<string, unknown>
    const rawTime = String(log.clock_in_time || log.created_at || log.time || '-')
    let formattedTime = rawTime
    if (rawTime.includes('T') || rawTime.includes(' ')) {
      const timePart = rawTime.split(/[T ]/)[1]
      formattedTime = timePart ? timePart.substring(0, 8) : rawTime
    }

    const clsName = String(user.class_group || user.class || log.class_group || log.class || '-')
    const sName = String(user.full_name || user.name || log.full_name || log.name || 'Siswa')
    const sNisn = String(user.nisn || user.username || log.nisn || '-')
    const sMajor = String(user.jurusan || user.major || log.jurusan || '-')

    return {
      id: String(log.id ?? idx),
      name: sName,
      nisn: sNisn,
      class: clsName,
      major: sMajor,
      status: normalizeStatus(String(log.status || log.attendance_status || 'Belum Absen')),
      ip: String(log.captured_ip || log.CapturedIp || log.ip || '-'),
      time: formattedTime
    }
  })

  logsLoading.value = false
}

const majorIcons: Record<string, string> = {
  RPL: 'code',
  TKJ: 'router',
  DKV: 'design_services',
  LPB: 'storefront',
  TOI: 'precision_manufacturing'
}

const formattedDate = computed(() => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date().toLocaleDateString('id-ID', options)
})

const loadMoreSentinel = ref<HTMLElement | null>(null)
let loadMoreObserver: IntersectionObserver | null = null

const setupLoadMoreObserver = () => {
  if (!import.meta.client) return
  loadMoreObserver = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && hasMoreStudents.value) {
      loadMoreStudents()
    }
  }, { rootMargin: '200px' })
  if (loadMoreSentinel.value) {
    loadMoreObserver.observe(loadMoreSentinel.value)
  }
}

onMounted(async () => {
  await Promise.all([
    fetchClassesList(),
    applyFilters()
  ])
  await nextTick()
  setupLoadMoreObserver()
})

onUnmounted(() => {
  loadMoreObserver?.disconnect()
})

const applyFilters = () => {
  const filters = {
    angkatan: selectedYear.value !== 'Semua' ? selectedYear.value : undefined,
    jurusan: selectedMajor.value !== 'Semua' ? selectedMajor.value : undefined,
    class_group: selectedClass.value !== 'Semua' ? selectedClass.value : undefined,
    status: selectedStatus.value !== 'Semua' ? selectedStatus.value : undefined,
    search: searchQuery.value.trim() || undefined,
    page: currentPage.value,
    limit: itemsPerPage.value
  }
  fetchAttendanceStudents(filters)
  fetchDashboardStats(filters)
  fetchAttendanceLogs()
}

// Menyesuaikan daftar kelas berdasarkan jurusan dan angkatan yang dipilih
const filteredClasses = computed(() => {
  return availableClasses.value.filter((c: unknown) => {
    const item = c as Record<string, unknown> | string
    const rawName = typeof item === 'string' ? item : String(item?.name || item?.class_name || item || '')
    const clsName = rawName.toUpperCase()

    // Filter Jurusan
    const matchMajor = selectedMajor.value === 'Semua' || clsName.includes(selectedMajor.value.toUpperCase())

    // Filter Angkatan
    const matchYear = selectedYear.value === 'Semua'
      || clsName.startsWith(selectedYear.value + ' ')
      || clsName.startsWith(selectedYear.value + '-')

    return matchMajor && matchYear
  })
})

// Reset kelas ke 'Semua' jika jurusan atau angkatan berubah
watch([selectedMajor, selectedYear], () => {
  selectedClass.value = 'Semua'
})

let filterTimer: ReturnType<typeof setTimeout> | null = null

watch([searchQuery, selectedYear, selectedMajor, selectedClass, selectedStatus, itemsPerPage], () => {
  currentPage.value = 1
  logCurrentPage.value = 1
  if (filterTimer) clearTimeout(filterTimer)
  filterTimer = setTimeout(applyFilters, 300)
})

const resetFilters = () => {
  searchQuery.value = ''
  selectedYear.value = 'Semua'
  selectedMajor.value = 'Semua'
  selectedClass.value = 'Semua'
  selectedStatus.value = 'Semua'
  currentPage.value = 1
  logCurrentPage.value = 1
  // applyFilters will be triggered by watch
}

const departmentStats = computed(() => {
  const majors: Array<'RPL' | 'TKJ' | 'DKV' | 'LPB' | 'TOI'> = ['RPL', 'TKJ', 'DKV', 'LPB', 'TOI']
  return majors.map((m) => {
    const list = students.value.filter(s => s.major === m)
    if (!list.length) return { major: m, percentage: 0 }
    const present = list.filter(s => s.status?.toLowerCase() === 'hadir' || s.status?.toLowerCase() === 'telat').length
    const percentage = Math.round((present / list.length) * 100)
    return { major: m, percentage }
  })
})
</script>

<template>
  <div class="flex flex-col gap-stack-lg">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-container-highest pb-6">
      <div>
        <h2 class="font-headline text-headline-lg font-bold text-on-surface mb-2">
          Absensi Harian Siswa
        </h2>
        <p class="text-body-lg font-body text-secondary flex items-center gap-2">
          <span class="material-symbols-outlined text-[20px]">calendar_today</span>
          {{ formattedDate }}
        </p>
      </div>
    </div>

    <!-- Summary Metrics -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-gutter-grid">
      <BentoStatCard
        title="Total Students"
        :value="stats.totalStudents.toLocaleString('id-ID')"
        icon="school"
      />
      <BentoStatCard
        title="Total Absen Hari Ini"
        :value="stats.totalAbsenHariIni"
        icon="group"
      />
      <BentoStatCard
        title="Hadir & Telat"
        :value="stats.hadirCount"
        icon="how_to_reg"
        accent-color="green"
        :sub-badges="[
          { text: `+${stats.hadirTepatCount ?? stats.hadirCount} Tepat`, color: '#00875a' },
          { text: `+${stats.telatCount ?? 0} Telat`, color: '#ea580c' }
        ]"
      />
      <BentoStatCard
        title="Alpa"
        :value="stats.alpaCount"
        icon="person_off"
        accent-color="red"
      />
    </div>

    <!-- Major Attendance Percentages -->
    <div>
      <h3 class="font-title text-title-lg font-semibold mb-4 text-on-surface">
        Persentase Kehadiran per Jurusan
      </h3>
      <div class="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        <div
          v-for="dept in departmentStats"
          :key="dept.major"
          class="min-w-40 bg-surface-white p-5 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all hover:shadow-sm"
          :class="[
            dept.major === 'DKV'
              ? 'border-primary/20 bg-primary/5 relative overflow-hidden'
              : 'border-surface-container-highest'
          ]"
        >
          <div
            v-if="dept.major === 'DKV'"
            class="absolute top-0 left-0 w-full h-1 bg-primary"
          />
          <div class="w-12 h-12 rounded-full bg-surface-container-low text-primary flex items-center justify-center mb-1">
            <span class="material-symbols-outlined">{{ majorIcons[dept.major] || 'school' }}</span>
          </div>
          <span class="font-label text-label-lg text-on-surface font-bold">{{ dept.major }}</span>
          <span class="font-headline text-headline-md text-secondary">{{ dept.percentage }}%</span>
        </div>
      </div>
    </div>

    <!-- Riwayat Log Absensi Hari Ini Section -->
    <div class="bg-surface-white rounded-lg border border-surface-container-highest shadow-sm overflow-hidden mt-6">
      <div class="p-5 border-b border-surface-container-highest bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[22px]">history</span>
            <h3 class="font-headline text-lg font-bold text-on-surface">
              Riwayat Log Absensi Hari Ini
            </h3>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Realtime Sync
            </span>
          </div>
          <p class="text-xs text-secondary mt-0.5 font-body">
            Daftar catatan aktivitas / log masuk & keluar presensi siswa pada {{ formattedDate }}.
          </p>
        </div>

        <div class="flex items-center gap-2 self-start sm:self-auto">
          <span class="text-xs text-secondary font-medium">Total Log:</span>
          <span class="px-2.5 py-1 rounded bg-primary/10 text-primary font-bold text-xs font-mono">
            {{ logTotalCount }} Log
          </span>
          <button
            class="p-1.5 rounded hover:bg-surface-container-low text-secondary hover:text-primary transition-colors ml-1"
            title="Refresh Log Absensi"
            @click="fetchAttendanceLogs"
          >
            <span
              class="material-symbols-outlined text-[18px]"
              :class="{ 'animate-spin': logsLoading }"
            >refresh</span>
          </button>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="p-4 border-b border-surface-container-highest bg-surface-container-lowest flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-50">
          <label class="block font-label text-label-sm text-secondary mb-1">Pencarian</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
            <input
              v-model="searchQuery"
              type="text"
              class="w-full h-10 pl-9 pr-3 rounded border border-surface-container-highest focus:border-primary focus:ring-1 focus:ring-primary text-body-md text-on-surface"
              placeholder="Cari nama atau NISN..."
            >
          </div>
        </div>

        <div class="w-full sm:w-auto">
          <label class="block font-label text-label-sm text-secondary mb-1">Jurusan</label>
          <select
            v-model="selectedMajor"
            class="w-full sm:w-32 h-10 px-3 rounded border border-surface-container-highest text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary bg-surface-white"
          >
            <option value="Semua">
              Semua
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
            <option value="LPB">
              LPB
            </option>
            <option value="TOI">
              TOI
            </option>
          </select>
        </div>

        <div class="w-full sm:w-auto">
          <label class="block font-label text-label-sm text-secondary mb-1">Kelas</label>
          <select
            v-model="selectedClass"
            class="w-full sm:w-32 h-10 px-3 rounded border border-surface-container-highest text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary bg-surface-white"
          >
            <option value="Semua">
              Semua
            </option>
            <option
              v-for="c in filteredClasses"
              :key="c"
              :value="c"
            >
              {{ c }}
            </option>
          </select>
        </div>

        <div class="w-full sm:w-auto">
          <label class="block font-label text-label-sm text-secondary mb-1">Status</label>
          <select
            v-model="selectedStatus"
            class="w-full sm:w-36 h-10 px-3 rounded border border-surface-container-highest text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary bg-surface-white"
          >
            <option value="Semua">
              Semua
            </option>
            <option value="Belum Absen">
              Belum Absen
            </option>
            <option value="Hadir">
              Hadir
            </option>
            <option value="Telat">
              Telat
            </option>
            <option value="Izin">
              Izin
            </option>
            <option value="Sakit">
              Sakit
            </option>
            <option value="PKL">
              PKL
            </option>
            <option value="Alpa">
              Alpa
            </option>
          </select>
        </div>

        <button
          class="h-10 px-4 rounded text-secondary hover:text-primary hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 border border-transparent font-label text-sm"
          @click="resetFilters"
        >
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          Reset
        </button>
      </div>

      <!-- Loading State -->
      <div
        v-if="logsLoading"
        class="flex flex-col items-center justify-center gap-2 py-12 text-secondary text-xs"
      >
        <span class="material-symbols-outlined text-[24px] animate-spin text-primary">progress_activity</span>
        <span>Memuat riwayat log absensi hari ini...</span>
      </div>

      <!-- Error State -->
      <div
        v-else-if="logsError"
        class="flex items-center justify-center gap-2 py-10 text-rose-600 text-xs text-center px-4"
      >
        <span class="material-symbols-outlined text-[18px]">error</span>
        <span>{{ logsError }}</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!attendanceLogsList.length"
        class="flex flex-col items-center justify-center gap-2 py-12 text-secondary text-xs text-center px-4"
      >
        <span class="material-symbols-outlined text-[36px] text-secondary/40">event_busy</span>
        <span class="font-medium text-sm text-on-surface">Belum Ada Log Absensi Hari Ini</span>
        <span class="text-secondary text-xs max-w-md">
          Belum terdapat catatan masuk/keluar presensi siswa untuk filter yang dipilih pada hari ini.
        </span>
      </div>

      <!-- Table State -->
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-background-cream text-secondary font-label text-label-sm uppercase tracking-wider border-b border-surface-container-highest">
              <th class="p-4 font-semibold w-12 text-center">
                No
              </th>
              <th class="p-4 font-semibold">
                Nama Siswa
              </th>
              <th class="p-4 font-semibold">
                Kelas & Jurusan
              </th>
              <th class="p-4 font-semibold text-center">
                Waktu Presensi
              </th>
              <th class="p-4 font-semibold text-center">
                Status Presensi
              </th>
              <th class="p-4 font-semibold">
                IP Network
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-highest">
            <tr
              v-for="(log, idx) in attendanceLogsList"
              :key="log.id"
              class="hover:bg-surface-container-low/50 transition-colors"
            >
              <td class="p-4 text-center text-secondary font-body text-xs">
                {{ (logCurrentPage - 1) * logItemsPerPage + idx + 1 }}
              </td>
              <td class="p-4">
                <p class="font-label text-label-md text-on-surface font-bold">
                  {{ log.name }}
                </p>
                <p class="text-xs text-secondary font-mono">
                  NISN: {{ log.nisn }}
                </p>
              </td>
              <td class="p-4 text-on-surface font-body text-xs">
                <span class="font-medium">{{ log.class }}</span>
                <span
                  v-if="log.major && log.major !== '-'"
                  class="text-secondary ml-1"
                >({{ log.major }})</span>
              </td>
              <td class="p-4 text-center">
                <span class="inline-flex items-center gap-1 font-mono text-xs font-semibold text-deep-black bg-surface-container-low px-2.5 py-1 rounded border border-surface-container-highest">
                  <span class="material-symbols-outlined text-[14px] text-primary">schedule</span>
                  {{ log.time }}
                </span>
              </td>
              <td class="p-4 text-center">
                <StatusBadge :status="log.status" />
              </td>
              <td class="p-4 text-secondary font-mono text-xs">
                <div class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px] text-secondary/60">lan</span>
                  <span>{{ log.ip }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Log Pagination Footer -->
      <div
        v-if="attendanceLogsList.length"
        class="p-4 border-t border-surface-container-highest flex flex-col sm:flex-row items-center justify-between gap-4 text-body-md text-secondary"
      >
        <div class="flex items-center gap-4">
          <span>
            Menampilkan {{ (logCurrentPage - 1) * logItemsPerPage + 1 }}-{{ Math.min(logCurrentPage * logItemsPerPage, logTotalCount) }} dari {{ logTotalCount }} log
          </span>
          <div class="flex items-center gap-2">
            <span class="text-xs font-label">Tampilkan:</span>
            <select
              v-model="logItemsPerPage"
              class="px-2 py-1 border border-surface-container-highest rounded text-xs text-deep-black bg-surface-white focus:outline-none focus:border-primary font-bold"
              @change="logCurrentPage = 1; fetchAttendanceLogs()"
            >
              <option :value="10">
                10
              </option>
              <option :value="20">
                20 (Default)
              </option>
              <option :value="50">
                50
              </option>
            </select>
          </div>
        </div>
        <div class="flex gap-1 items-center">
          <button
            class="w-8 h-8 rounded flex items-center justify-center border border-surface-container-highest text-secondary hover:border-primary hover:text-primary disabled:opacity-50"
            :disabled="logCurrentPage === 1"
            @click="logCurrentPage--; fetchAttendanceLogs()"
          >
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span class="px-3 font-bold text-on-surface">{{ logCurrentPage }} / {{ logTotalPages }}</span>
          <button
            class="w-8 h-8 rounded flex items-center justify-center border border-surface-container-highest text-secondary hover:border-primary hover:text-primary disabled:opacity-50"
            :disabled="logCurrentPage >= logTotalPages"
            @click="logCurrentPage++; fetchAttendanceLogs()"
          >
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
