<script setup lang="ts">
const {
  students,
  stats,
  totalStudentsCount,
  availableClasses,
  hasMoreStudents,
  fetchDashboardStats,
  fetchDashboardTrend,
  fetchAttendanceStudents,
  loadMoreStudents,
  fetchClassesList,
  updateStudentStatus
} = useAttendance()

const { user: authUser } = useAuth()
const adminName = computed(() => authUser.value?.full_name || authUser.value?.name || authUser.value?.username || 'Admin')

const searchQuery = ref('')
const selectedYear = ref('Semua')
const selectedMajor = ref('Semua')
const selectedClass = ref('Semua')
const selectedStatus = ref('Semua')

const currentPage = ref(1)
const itemsPerPage = ref(50)

const formattedDate = computed(() => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date().toLocaleDateString('id-ID', options)
})

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

// Apply all filters ke API
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
  fetchDashboardTrend({ angkatan: filters.angkatan })
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedYear.value = 'Semua'
  selectedMajor.value = 'Semua'
  selectedClass.value = 'Semua'
  selectedStatus.value = 'Semua'
  currentPage.value = 1
  // applyFilters will be triggered by watch
}

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

// Reset kelas ke 'Semua' jika jurusan atau angkatan berubah
watch([selectedMajor, selectedYear], () => {
  selectedClass.value = 'Semua'
})

let filterTimer: ReturnType<typeof setTimeout> | null = null

watch([searchQuery, selectedYear, selectedMajor, selectedClass, selectedStatus, itemsPerPage], () => {
  currentPage.value = 1
  if (filterTimer) clearTimeout(filterTimer)
  filterTimer = setTimeout(applyFilters, 300)
})

const normalizeClassStr = (c: string) => String(c || '').toLowerCase().replace(/[-_ ]/g, '')

const baseFilteredStudents = computed(() => {
  return students.value.filter((s) => {
    const matchesGrade = selectedYear.value === 'Semua' || s.grade === selectedYear.value
    const matchesMajor = selectedMajor.value === 'Semua' || s.major === selectedMajor.value
    const matchesClass = selectedClass.value === 'Semua'
      || s.class === selectedClass.value
      || normalizeClassStr(s.class) === normalizeClassStr(selectedClass.value)
    const matchesStatus = selectedStatus.value === 'Semua'
      || s.status === selectedStatus.value
      || (selectedStatus.value === 'Belum Absen' && (s.status === 'Belum Absen' || s.status?.toLowerCase() === 'belum_absen'))
    return matchesGrade && matchesMajor && matchesClass && matchesStatus
  })
})

const filteredStudents = computed(() => {
  return baseFilteredStudents.value.filter((s) => {
    const q = searchQuery.value.trim().toLowerCase()
    return !q || s.name.toLowerCase().includes(q) || s.nisn.toLowerCase().includes(q)
  })
})

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredStudents.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() => Math.ceil(filteredStudents.value.length / itemsPerPage.value) || 1)

// Kalau total halaman mengecil (setelah filter/hapus), mundur ke halaman valid
watch(totalPages, (tp) => {
  if (currentPage.value > tp) {
    currentPage.value = Math.max(1, tp)
  }
})

const isFiltered = computed(() => {
  return selectedYear.value !== 'Semua'
    || selectedMajor.value !== 'Semua'
    || selectedClass.value !== 'Semua'
    || selectedStatus.value !== 'Semua'
})

const displayStats = computed(() => {
  const list = baseFilteredStudents.value
  const totalAbsen = list.filter(s => s.status?.toLowerCase() !== 'belum absen' && s.status?.toLowerCase() !== 'belum_absen').length
  const hadirTepat = list.filter(s => s.status?.toLowerCase() === 'hadir').length
  const telat = list.filter(s => s.status?.toLowerCase() === 'telat' || s.status?.toLowerCase() === 'terlambat').length
  const sakit = list.filter(s => s.status?.toLowerCase() === 'sakit').length
  const izin = list.filter(s => s.status?.toLowerCase() === 'izin').length
  const alpa = list.filter(s => s.status?.toLowerCase() === 'alpa' || s.status?.toLowerCase() === 'alfa').length

  const serverTotal = totalStudentsCount.value || stats.value.totalStudents

  return {
    totalStudents: isFiltered.value ? list.length : (serverTotal || list.length),
    totalAbsenHariIni: isFiltered.value ? totalAbsen : Math.max(stats.value.totalAbsenHariIni, totalAbsen),
    hadirCount: isFiltered.value ? (hadirTepat + telat) : Math.max(stats.value.hadirCount, hadirTepat + telat),
    hadirTepatCount: isFiltered.value ? hadirTepat : Math.max(stats.value.hadirTepatCount, hadirTepat),
    telatCount: isFiltered.value ? telat : Math.max(stats.value.telatCount, telat),
    sakitCount: isFiltered.value ? sakit : Math.max(stats.value.sakitCount, sakit),
    alpaCount: isFiltered.value ? alpa : Math.max(stats.value.alpaCount, alpa),
    izinCount: isFiltered.value ? izin : Math.max(stats.value.izinCount, izin)
  }
})

const { showError, showSuccess } = useAppToast()

const handleStatusChange = async (studentId: string, status: string, studentName: string) => {
  const res = await updateStudentStatus(studentId, status)
  if (res.success) {
    showSuccess(`Status ${studentName} berhasil diubah menjadi ${status}`)
  } else {
    showError(res.message || `Gagal mengubah status presensi ${studentName}`)
  }
}

// Menghitung jumlah filter aktif
const activeFilterCount = computed(() => {
  let count = 0
  if (selectedYear.value !== 'Semua') count++
  if (selectedMajor.value !== 'Semua') count++
  if (selectedClass.value !== 'Semua') count++
  if (selectedStatus.value !== 'Semua') count++
  return count
})
</script>

<template>
  <div class="flex flex-col gap-stack-lg">
    <!-- Welcome Header & Date -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="font-headline text-headline-lg text-primary md:text-[36px] font-bold mb-1">
          Selamat Datang, {{ adminName }}
        </h2>
        <p class="font-body text-body-lg text-secondary">
          Ringkasan presensi harian siswa hari ini.
        </p>
      </div>
      <div class="flex items-center gap-2 px-4 py-2 bg-surface-white border border-surface-container-highest rounded-md shadow-sm">
        <span class="material-symbols-outlined text-primary">calendar_today</span>
        <span class="font-label text-label-lg text-deep-black font-bold">{{ formattedDate }}</span>
      </div>
    </div>

    <!-- Stats Bento Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Stat Card 1 -->
      <BentoStatCard
        title="Total Siswa"
        :value="displayStats.totalStudents.toLocaleString('id-ID')"
        icon="school"
      />
      <!-- Stat Card 2 -->
      <BentoStatCard
        title="Total Absen Hari Ini"
        :value="displayStats.totalAbsenHariIni"
        icon="group"
      />
      <!-- Stat Card 3 -->
      <BentoStatCard
        title="Hadir & Telat"
        :value="displayStats.hadirCount"
        icon="how_to_reg"
        accent-color="green"
        :sub-badges="[
          { text: `+${displayStats.hadirTepatCount ?? displayStats.hadirCount} Tepat`, color: '#00875a' },
          { text: `+${displayStats.telatCount ?? 0} Telat`, color: '#ea580c' }
        ]"
      />
      <!-- Stat Card 4 -->
      <BentoStatCard
        title="Alpa"
        :value="displayStats.alpaCount"
        icon="person_off"
        accent-color="red"
      />
    </div>

    <!-- Main Table Area -->
    <div class="bg-surface-white border border-surface-container-highest rounded-lg shadow-sm flex flex-col overflow-hidden">
      <!-- Table Header -->
      <div class="p-5 border-b border-surface-container-highest bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[22px]">table_chart</span>
          <h3 class="font-headline text-title-lg text-deep-black font-bold">
            Presensi Harian Siswa (Hari Ini)
          </h3>
          <span
            v-if="isFiltered"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20"
          >
            <span class="material-symbols-outlined text-[14px]">filter_alt</span>
            {{ activeFilterCount }} Filter Aktif
          </span>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="p-4 border-b border-surface-container-highest bg-surface-container-lowest flex flex-wrap gap-4 items-end">
        <!-- Search -->
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

        <!-- Angkatan -->
        <div class="w-full sm:w-auto">
          <label class="block font-label text-label-sm text-secondary mb-1">Angkatan</label>
          <select
            v-model="selectedYear"
            class="w-full sm:w-32 h-10 px-3 rounded border border-surface-container-highest text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary bg-surface-white"
          >
            <option value="Semua">
              Semua
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
        </div>

        <!-- Jurusan -->
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

        <!-- Kelas -->
        <div class="w-full sm:w-auto">
          <label class="block font-label text-label-sm text-secondary mb-1">Kelas</label>
          <select
            v-model="selectedClass"
            class="w-full sm:w-36 h-10 px-3 rounded border border-surface-container-highest text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary bg-surface-white"
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

        <!-- Status -->
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

        <!-- Reset Button -->
        <button
          class="h-10 px-4 rounded text-secondary hover:text-primary hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 border border-transparent font-label text-sm"
          @click="resetFilters"
        >
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          Reset
        </button>
      </div>

      <!-- Data Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-highest text-secondary font-label text-[11px] uppercase tracking-wider">
              <th class="p-4 w-12">
                <input
                  type="checkbox"
                  class="rounded border-surface-container-highest text-primary focus:ring-primary"
                >
              </th>
              <th class="p-4 font-bold">
                NISN
              </th>
              <th class="p-4 font-bold">
                Nama Siswa
              </th>
              <th class="p-4 font-bold">
                Kelas
              </th>
              <th class="p-4 font-bold">
                Waktu
              </th>
              <th class="p-4 font-bold">
                Status Presensi
              </th>
              <th class="p-4 font-bold text-center">
                Aksi Cepat
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-highest text-body-md text-deep-black">
            <tr
              v-for="student in paginatedStudents"
              :key="student.id"
              class="hover:bg-surface-container-low transition-colors"
            >
              <td class="p-4">
                <input
                  type="checkbox"
                  class="rounded border-surface-container-highest text-primary focus:ring-primary"
                >
              </td>
              <td class="p-4 text-secondary font-mono text-xs">
                {{ student.nisn }}
              </td>
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-deep-black font-bold text-xs">
                    {{ student.avatarInitials }}
                  </div>
                  <span class="font-bold">{{ student.name }}</span>
                </div>
              </td>
              <td class="p-4">
                {{ student.class }}
              </td>
              <td class="p-4 text-secondary">
                {{ student.time || '-' }}
              </td>
              <td class="p-4">
                <StatusBadge :status="student.status" />
              </td>
              <td class="p-4">
                <QuickActionButtons
                  :current-status="student.status"
                  @update-status="(status) => handleStatusChange(student.id, status, student.name)"
                />
              </td>
            </tr>
            <tr v-if="!paginatedStudents.length">
              <td
                colspan="7"
                class="p-8 text-center text-secondary"
              >
                <div class="flex flex-col items-center gap-2">
                  <span class="material-symbols-outlined text-[36px] text-secondary/40">search_off</span>
                  <span class="font-medium text-sm text-on-surface">Tidak ada data siswa</span>
                  <span class="text-xs">Tidak ada data siswa yang cocok dengan filter yang dipilih.</span>
                  <button
                    v-if="isFiltered"
                    class="mt-2 px-3 py-1.5 text-xs font-label font-bold text-primary hover:bg-primary/10 rounded transition-colors flex items-center gap-1"
                    @click="resetFilters"
                  >
                    <span class="material-symbols-outlined text-[16px]">refresh</span>
                    Reset Filter
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="p-4 border-t border-surface-container-highest flex flex-col sm:flex-row items-center justify-between gap-4 text-body-md text-secondary">
        <div class="flex flex-wrap items-center gap-4">
          <span>
            Menampilkan {{ paginatedStudents.length ? (currentPage - 1) * itemsPerPage + 1 : 0 }}-{{ Math.min(currentPage * itemsPerPage, filteredStudents.length) }} dari {{ filteredStudents.length }} siswa
          </span>
          <div class="flex items-center gap-2">
            <span class="text-xs font-label">Tampilkan:</span>
            <select
              v-model="itemsPerPage"
              class="px-2 py-1 border border-surface-container-highest rounded text-xs text-deep-black bg-surface-white focus:outline-none focus:border-primary font-bold"
            >
              <option :value="10">
                10
              </option>
              <option :value="25">
                25
              </option>
              <option :value="50">
                50 (Default)
              </option>
            </select>
          </div>
        </div>
        <div class="flex gap-1 items-center">
          <button
            class="w-8 h-8 rounded flex items-center justify-center border border-surface-container-highest text-secondary hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage === 1"
            title="Halaman Pertama"
            @click="currentPage = 1"
          >
            <span class="material-symbols-outlined text-[18px]">first_page</span>
          </button>
          <button
            class="w-8 h-8 rounded flex items-center justify-center border border-surface-container-highest text-secondary hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage === 1"
            title="Halaman Sebelumnya"
            @click="currentPage--"
          >
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span class="px-3 font-bold text-deep-black text-sm">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            class="w-8 h-8 rounded flex items-center justify-center border border-surface-container-highest text-secondary hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage >= totalPages"
            title="Halaman Berikutnya"
            @click="currentPage++"
          >
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
          <button
            class="w-8 h-8 rounded flex items-center justify-center border border-surface-container-highest text-secondary hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage >= totalPages"
            title="Halaman Terakhir"
            @click="currentPage = totalPages"
          >
            <span class="material-symbols-outlined text-[18px]">last_page</span>
          </button>
        </div>
      </div>

      <!-- Lazy Load Sentinel -->
      <div
        ref="loadMoreSentinel"
        class="flex items-center justify-center gap-2 py-3 text-xs text-secondary"
      >
        <template v-if="hasMoreStudents">
          <span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
          <span>Memuat data siswa...</span>
        </template>
        <span v-else-if="students.length">Semua data siswa telah dimuat</span>
      </div>
    </div>
  </div>
</template>
