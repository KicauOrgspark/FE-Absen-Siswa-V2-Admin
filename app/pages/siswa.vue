<script setup lang="ts">
import type { Student } from '~/composables/useAttendance'

const { students, addStudent, updateStudent, deleteStudent } = useAttendance()

const searchQuery = ref('')
const selectedGrade = ref('')
const selectedClass = ref('')
const selectedStatus = ref('')

const isModalOpen = ref(false)
const selectedStudentToEdit = ref<Student | null>(null)

// Delete confirmation dialog state
const isDeleteDialogOpen = ref(false)
const deleteTargetId = ref('')
const deleteTargetName = ref('')

const currentPage = ref(1)
const itemsPerPage = 10

// Enhanced search engine & multi-field filter
const filteredStudents = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return students.value.filter((s) => {
    const matchesSearch = !q ||
      s.name.toLowerCase().includes(q) ||
      s.nisn.toLowerCase().includes(q) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.parentPhone && s.parentPhone.toLowerCase().includes(q)) ||
      s.class.toLowerCase().includes(q) ||
      s.major.toLowerCase().includes(q)

    const matchesGrade = !selectedGrade.value || s.grade === selectedGrade.value
    const matchesClass = !selectedClass.value || s.class === selectedClass.value
    const matchesStatus = !selectedStatus.value || s.activeStatus === selectedStatus.value

    return matchesSearch && matchesGrade && matchesClass && matchesStatus
  })
})

// Reset to page 1 whenever any filter changes
watch([searchQuery, selectedGrade, selectedClass, selectedStatus], () => {
  currentPage.value = 1
})

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredStudents.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredStudents.value.length / itemsPerPage) || 1)

const resetAllFilters = () => {
  searchQuery.value = ''
  selectedGrade.value = ''
  selectedClass.value = ''
  selectedStatus.value = ''
  currentPage.value = 1
}

const openAddModal = () => {
  selectedStudentToEdit.value = null
  isModalOpen.value = true
}

const openEditModal = (student: Student) => {
  selectedStudentToEdit.value = student
  isModalOpen.value = true
}

const handleSaveStudent = (data: Omit<Student, 'id' | 'avatarInitials'>) => {
  addStudent(data)
}

const handleUpdateStudent = (id: string, data: Partial<Student>) => {
  updateStudent(id, data)
}

const handleDelete = (id: string, name: string) => {
  deleteTargetId.value = id
  deleteTargetName.value = name
  isDeleteDialogOpen.value = true
}

const confirmDelete = () => {
  deleteStudent(deleteTargetId.value)
  isDeleteDialogOpen.value = false
  deleteTargetId.value = ''
  deleteTargetName.value = ''
}

const cancelDelete = () => {
  isDeleteDialogOpen.value = false
  deleteTargetId.value = ''
  deleteTargetName.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-stack-lg">
    <!-- Header & Action -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
      <div>
        <h2 class="font-headline text-headline-lg text-primary md:text-[36px] font-bold mb-1">
          Student Management
        </h2>
        <p class="font-body text-body-lg text-secondary">
          Kelola data siswa, pembagian kelas, dan status keaktifan siswa.
        </p>
      </div>
      <button
        class="bg-primary text-white font-label text-label-lg px-6 py-2.5 rounded hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm active:scale-95 font-bold"
        @click="openAddModal"
      >
        <span class="material-symbols-outlined text-[20px]">add</span>
        Tambah Siswa
      </button>
    </div>

    <!-- Table Container -->
    <div class="bg-surface-white border border-surface-container-highest rounded-lg shadow-sm flex flex-col overflow-hidden">
      <!-- Filters Bar -->
      <div class="p-4 border-b border-surface-container-highest flex flex-col lg:flex-row gap-4 justify-between items-center">
        <!-- Search Engine Input -->
        <div class="relative w-full lg:w-72">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-sm">search</span>
          <input
            v-model="searchQuery"
            type="text"
            class="w-full pl-9 pr-4 py-2 border border-surface-container-highest rounded text-body-md text-deep-black placeholder-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Cari nama, NISN, username, kelas..."
          >
          <button
            v-if="searchQuery"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
            @click="searchQuery = ''"
          >
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <!-- Filter Dropdowns & Reset -->
        <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <!-- Angkatan Filter -->
          <div class="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
              v-model="selectedGrade"
              class="w-full appearance-none pl-3 pr-8 py-2 border border-surface-container-highest rounded text-body-md text-deep-black bg-surface-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Semua Angkatan</option>
              <option value="X">Angkatan X</option>
              <option value="XI">Angkatan XI</option>
              <option value="XII">Angkatan XII</option>
            </select>
            <span class="absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-sm pointer-events-none">expand_more</span>
          </div>

          <!-- Class Filter -->
          <div class="relative flex-1 min-w-0 sm:flex-none sm:w-40">
            <select
              v-model="selectedClass"
              class="w-full appearance-none pl-3 pr-8 py-2 border border-surface-container-highest rounded text-body-md text-deep-black bg-surface-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Semua Kelas</option>
              <option value="X DKV-1">X DKV-1</option>
              <option value="X RPL 1">X RPL 1</option>
              <option value="XI TKJ 2">XI TKJ 2</option>
              <option value="XII TOI 1">XII TOI 1</option>
            </select>
            <span class="absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-sm pointer-events-none">expand_more</span>
          </div>

          <!-- Status Siswa Filter -->
          <div class="relative flex-1 min-w-0 sm:flex-none sm:w-52">
            <select
              v-model="selectedStatus"
              class="w-full appearance-none pl-3 pr-8 py-2 border border-surface-container-highest rounded text-body-md text-deep-black bg-surface-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Semua Status Siswa</option>
              <option value="AKTIF">AKTIF</option>
              <option value="PKL">PKL</option>
              <option value="NON AKTIF">NON AKTIF</option>
            </select>
            <span class="absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-sm pointer-events-none">expand_more</span>
          </div>

          <!-- Reset Filter Button -->
          <button
            v-if="searchQuery || selectedGrade || selectedClass || selectedStatus"
            class="shrink-0 ml-1 h-9 px-3 rounded text-secondary hover:text-primary hover:bg-surface-container-low transition-colors flex items-center gap-1.5 border border-surface-container-highest font-label text-xs font-bold whitespace-nowrap"
            title="Reset semua filter"
            @click="resetAllFilters"
          >
            <span class="material-symbols-outlined text-[16px]">refresh</span>
            Reset
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-highest text-secondary font-label text-[11px] uppercase tracking-wider">
              <th class="p-4 font-bold w-1/4">Detail Siswa</th>
              <th class="p-4 font-bold">NISN / ID</th>
              <th class="p-4 font-bold">Kelas</th>
              <th class="p-4 font-bold">No. Orang Tua</th>
              <th class="p-4 font-bold">Status Siswa</th>
              <th class="p-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-highest text-body-md text-deep-black">
            <tr
              v-for="student in paginatedStudents"
              :key="student.id"
              class="hover:bg-surface-container-low transition-colors"
            >
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-deep-black font-bold text-xs">
                    {{ student.avatarInitials }}
                  </div>
                  <div>
                    <p class="font-bold flex items-center gap-2">
                      {{ student.name }}
                      <span v-if="student.username" class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container text-primary font-bold">
                        @{{ student.username }}
                      </span>
                    </p>
                    <p class="text-secondary text-xs">{{ student.email || `${student.name.toLowerCase().replace(/ /g, '.')}@student.pelitanusantara.sch.id` }}</p>
                  </div>
                </div>
              </td>
              <td class="p-4 text-secondary font-mono text-xs">{{ student.nisn }}</td>
              <td class="p-4 font-body">{{ student.class }}</td>
              <td class="p-4">
                <span
                  v-if="student.parentPhone"
                  class="font-mono text-xs text-secondary font-medium"
                >
                  {{ student.parentPhone }}
                </span>
                <span v-else class="text-xs text-secondary/50 italic">-</span>
              </td>
              <td class="p-4">
                <StatusBadge :status="student.activeStatus" />
              </td>
              <td class="p-4">
                <div class="flex items-center justify-center gap-2">
                  <button
                    class="px-3 py-1 border border-primary text-primary font-label text-xs rounded hover:bg-surface-container-low transition-colors font-bold"
                    @click="openEditModal(student)"
                  >
                    Edit
                  </button>
                  <button
                    class="px-3 py-1 text-error font-label text-xs rounded hover:bg-error-container/50 transition-colors font-bold"
                    @click="handleDelete(student.id, student.name)"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!paginatedStudents.length">
              <td colspan="5" class="p-8 text-center text-secondary">
                Tidak ada data siswa yang sesuai dengan kriteria pencarian / filter.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-4 flex items-center justify-between border-t border-surface-container-highest">
        <p class="font-body text-secondary text-sm">
          Menampilkan {{ paginatedStudents.length ? (currentPage - 1) * itemsPerPage + 1 : 0 }} - {{ Math.min(currentPage * itemsPerPage, filteredStudents.length) }} dari {{ filteredStudents.length }} siswa
        </p>
        <div class="flex gap-2">
          <button
            class="px-3 py-1 border border-surface-container-highest rounded text-secondary hover:text-primary hover:border-primary transition-colors font-body text-sm disabled:opacity-50"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            Prev
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            class="px-3 py-1 rounded font-body text-sm transition-colors"
            :class="page === currentPage ? 'bg-primary text-white font-bold' : 'border border-surface-container-highest text-secondary hover:border-primary'"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
          <button
            class="px-3 py-1 border border-surface-container-highest rounded text-secondary hover:text-primary hover:border-primary transition-colors font-body text-sm disabled:opacity-50"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Student Modal -->
    <StudentModal
      :is-open="isModalOpen"
      :edit-student-data="selectedStudentToEdit"
      @close="isModalOpen = false"
      @save="handleSaveStudent"
      @update="handleUpdateStudent"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :is-open="isDeleteDialogOpen"
      variant="danger"
      title="Hapus Data Siswa?"
      :message="`Data siswa ${deleteTargetName} akan dihapus secara permanen dan tidak dapat dikembalikan. Lanjutkan?`"
      confirm-text="Hapus"
      cancel-text="Batal"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>
