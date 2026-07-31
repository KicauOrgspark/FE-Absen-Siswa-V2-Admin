<script setup lang="ts">
const { students, stats, updateStudentStatus } = useAttendance()

const searchQuery = ref('')
const selectedGrade = ref('Semua Angkatan')
const selectedClass = ref('Semua Kelas')

const formattedDate = computed(() => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date().toLocaleDateString('id-ID', options)
})

const filteredStudents = computed(() => {
  return students.value.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          student.nisn.includes(searchQuery.value)
    const matchesGrade = selectedGrade.value === 'Semua Angkatan' || student.grade === selectedGrade.value
    const matchesClass = selectedClass.value === 'Semua Kelas' || student.class === selectedClass.value
    return matchesSearch && matchesGrade && matchesClass
  })
})
</script>

<template>
  <div class="flex flex-col gap-stack-lg">
    <!-- Welcome Header & Date -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="font-headline text-headline-lg text-primary md:text-[36px] font-bold mb-1">
          Selamat Datang, Admin
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
        :value="stats.totalStudents.toLocaleString('id-ID')"
        icon="school"
      />
      <!-- Stat Card 2 -->
      <BentoStatCard
        title="Total Absen Hari Ini"
        :value="stats.totalAbsenHariIni"
        icon="group"
      />
      <!-- Stat Card 3 -->
      <BentoStatCard
        title="Hadir & Telat"
        :value="stats.hadirCount"
        icon="how_to_reg"
        accent-color="green"
        :sub-badges="[
          { text: `+${stats.hadirCount} Tepat`, color: '#00875a' },
          { text: '+0 Telat', color: '#00875a' }
        ]"
      />
      <!-- Stat Card 4 -->
      <BentoStatCard
        title="Alpa"
        :value="stats.alpaCount"
        icon="person_off"
        accent-color="red"
      />
    </div>

    <!-- Main Table Area -->
    <div class="bg-surface-white border border-surface-container-highest rounded-lg shadow-sm flex flex-col overflow-hidden">
      <!-- Table Header & Controls -->
      <div class="p-4 border-b border-surface-container-highest flex flex-col lg:flex-row justify-between items-center gap-4">
        <h3 class="font-headline text-title-lg text-deep-black font-bold">
          Presensi Harian Siswa (Hari Ini)
        </h3>
        <div class="flex items-center gap-3 w-full lg:w-auto">
          <!-- Search -->
          <div class="relative w-full lg:w-64">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-sm">search</span>
            <input
              v-model="searchQuery"
              type="text"
              class="w-full pl-9 pr-4 py-2 border border-surface-container-highest rounded text-body-md text-deep-black placeholder-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Cari NISN atau Nama..."
            >
          </div>
          <!-- Dropdowns -->
          <div class="relative">
            <select
              v-model="selectedGrade"
              class="appearance-none pl-4 pr-10 py-2 border border-surface-container-highest rounded text-body-md text-deep-black bg-surface-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="Semua Angkatan">Semua Angkatan</option>
              <option value="X">Kelas X</option>
              <option value="XI">Kelas XI</option>
              <option value="XII">Kelas XII</option>
            </select>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-sm pointer-events-none">expand_more</span>
          </div>
          <div class="relative">
            <select
              v-model="selectedClass"
              class="appearance-none pl-4 pr-10 py-2 border border-surface-container-highest rounded text-body-md text-deep-black bg-surface-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="Semua Kelas">Semua Kelas</option>
              <option value="X DKV-1">X DKV-1</option>
              <option value="X RPL 1">X RPL 1</option>
              <option value="XI TKJ 2">XI TKJ 2</option>
              <option value="XII TOI 1">XII TOI 1</option>
            </select>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-sm pointer-events-none">expand_more</span>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-highest text-secondary font-label text-[11px] uppercase tracking-wider">
              <th class="p-4 w-12"><input type="checkbox" class="rounded border-surface-container-highest text-primary focus:ring-primary"></th>
              <th class="p-4 font-bold">NISN</th>
              <th class="p-4 font-bold">Nama Siswa</th>
              <th class="p-4 font-bold">Kelas</th>
              <th class="p-4 font-bold">Waktu</th>
              <th class="p-4 font-bold">Status Presensi</th>
              <th class="p-4 font-bold text-center">Aksi Cepat</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-highest text-body-md text-deep-black">
            <tr
              v-for="student in filteredStudents"
              :key="student.id"
              class="hover:bg-surface-container-low transition-colors"
            >
              <td class="p-4"><input type="checkbox" class="rounded border-surface-container-highest text-primary focus:ring-primary"></td>
              <td class="p-4 text-secondary font-mono text-xs">{{ student.nisn }}</td>
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-deep-black font-bold text-xs">
                    {{ student.avatarInitials }}
                  </div>
                  <span class="font-bold">{{ student.name }}</span>
                </div>
              </td>
              <td class="p-4">{{ student.class }}</td>
              <td class="p-4 text-secondary">{{ student.time || '-' }}</td>
              <td class="p-4">
                <StatusBadge :status="student.status" />
              </td>
              <td class="p-4">
                <QuickActionButtons
                  :current-status="student.status"
                  @update-status="(status) => updateStudentStatus(student.id, status)"
                />
              </td>
            </tr>
            <tr v-if="!filteredStudents.length">
              <td colspan="7" class="p-8 text-center text-secondary">
                Tidak ada data siswa yang cocok dengan kriteria pencarian.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
