<script setup lang="ts">
const {
  students,
  stats,
  departmentStats,
  availableClasses,
  fetchDashboardStats,
  fetchAttendanceStudents,
  fetchClassesList,
  updateStudentStatus
} = useAttendance()

const searchQuery = ref('')
const selectedYear = ref('Semua')
const selectedMajor = ref('Semua')
const selectedClass = ref('Semua')
const selectedStatus = ref('Semua')

const currentPage = ref(1)
const itemsPerPage = ref(100)

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

onMounted(async () => {
  await Promise.all([
    fetchDashboardStats(),
    fetchClassesList(),
    fetchAttendanceStudents()
  ])
})

const applyFilters = () => {
  fetchAttendanceStudents({
    angkatan: selectedYear.value !== 'Semua' ? selectedYear.value : undefined,
    jurusan: selectedMajor.value !== 'Semua' ? selectedMajor.value : undefined,
    class_group: selectedClass.value !== 'Semua' ? selectedClass.value : undefined,
    status: selectedStatus.value !== 'Semua' ? selectedStatus.value : undefined
  })
}

watch([selectedYear, selectedMajor, selectedClass, selectedStatus], () => {
  currentPage.value = 1
  applyFilters()
})

const filteredStudents = computed(() => {
  return students.value.filter((s) => {
    const matchesSearch = !searchQuery.value || s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || s.nisn.includes(searchQuery.value)
    const matchesYear = selectedYear.value === 'Semua' || s.grade === selectedYear.value
    const matchesMajor = selectedMajor.value === 'Semua' || s.major === selectedMajor.value
    const matchesClass = selectedClass.value === 'Semua' || s.class === selectedClass.value
    const matchesStatus = selectedStatus.value === 'Semua' || s.status === selectedStatus.value
    return matchesSearch && matchesYear && matchesMajor && matchesClass && matchesStatus
  })
})

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredStudents.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() => Math.ceil(filteredStudents.value.length / itemsPerPage.value) || 1)

const resetFilters = () => {
  searchQuery.value = ''
  selectedYear.value = 'Semua'
  selectedMajor.value = 'Semua'
  selectedClass.value = 'Semua'
  selectedStatus.value = 'Semua'
  currentPage.value = 1
  fetchAttendanceStudents()
}

const { showError, showSuccess } = useAppToast()

const handleStatusChange = async (studentId: string, status: string, studentName: string) => {
  const res = await updateStudentStatus(studentId, status)
  if (res.success) {
    showSuccess(`Status ${studentName} berhasil diubah menjadi ${status}`)
  } else {
    showError(res.message || `Gagal mengubah status presensi ${studentName}`)
  }
}
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

    <!-- Main Data Table Section -->
    <div class="bg-surface-white rounded-lg border border-surface-container-highest shadow-sm overflow-hidden">
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
              v-for="cls in availableClasses"
              :key="cls.id || cls.name || cls"
              :value="cls.name || cls.class_name || cls"
            >
              {{ cls.name || cls.class_name || cls }}
            </option>
            <option value="X DKV-1">
              X DKV-1
            </option>
            <option value="X RPL 1">
              X RPL 1
            </option>
            <option value="XI TKJ 2">
              XI TKJ 2
            </option>
            <option value="XII TOI 1">
              XII TOI 1
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

      <!-- Data Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-background-cream text-secondary font-label text-label-sm uppercase tracking-wider border-b border-surface-container-highest">
              <th class="p-4 font-semibold w-16 text-center">
                No
              </th>
              <th class="p-4 font-semibold">
                Nama Siswa
              </th>
              <th class="p-4 font-semibold">
                NISN
              </th>
              <th class="p-4 font-semibold">
                Kelas
              </th>
              <th class="p-4 font-semibold text-center">
                Waktu
              </th>
              <th class="p-4 font-semibold text-center">
                Status Presensi
              </th>
              <th class="p-4 font-semibold text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-highest">
            <tr
              v-for="(student, index) in paginatedStudents"
              :key="student.id"
              class="hover:bg-surface-container-low/50 transition-colors"
            >
              <td class="p-4 text-center text-secondary font-body">
                {{ (currentPage - 1) * itemsPerPage + index + 1 }}
              </td>
              <td class="p-4 font-label text-label-lg text-on-surface font-bold">
                {{ student.name }}
              </td>
              <td class="p-4 text-secondary font-mono text-sm">
                {{ student.nisn }}
              </td>
              <td class="p-4 text-on-surface font-body">
                {{ student.class }}
              </td>
              <td class="p-4 text-center text-secondary font-body">
                {{ student.time || '-' }}
              </td>
              <td class="p-4 text-center">
                <StatusBadge :status="student.status" />
              </td>
              <td class="p-4 text-right">
                <div class="inline-flex gap-1">
                  <QuickActionButtons
                    :current-status="student.status"
                    @update-status="(status) => handleStatusChange(student.id, status, student.name)"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="!paginatedStudents.length">
              <td
                colspan="7"
                class="p-8 text-center text-secondary"
              >
                Tidak ada data siswa ditemukan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
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
                50
              </option>
              <option :value="100">
                100 (Default)
              </option>
              <option :value="filteredStudents.length || 100">
                Max Data DB ({{ filteredStudents.length }})
              </option>
            </select>
          </div>
        </div>
        <div class="flex gap-1 items-center">
          <button
            class="w-8 h-8 rounded flex items-center justify-center border border-surface-container-highest text-secondary hover:border-primary hover:text-primary disabled:opacity-50"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span class="px-3 font-bold text-on-surface">{{ currentPage }} / {{ totalPages }}</span>
          <button
            class="w-8 h-8 rounded flex items-center justify-center border border-surface-container-highest text-secondary hover:border-primary hover:text-primary disabled:opacity-50"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
