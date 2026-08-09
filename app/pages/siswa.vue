<script setup lang="ts">
import type { Student } from '~/composables/useAttendance'

const {
  students,
  availableClasses,
  pagination,
  fetchClassesList,
  fetchUsers,
  addStudent,
  updateStudent,
  deleteStudent,
  resetStudentPassword
} = useAttendance()

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

// Reset password state
const isResetPasswordOpen = ref(false)
const resetTargetId = ref('')
const newPasswordInput = ref('password123')
const resetSuccessMessage = ref('')

const deleteErrorMessage = ref('')

const currentPage = ref(1)
const itemsPerPage = ref(50)

onMounted(() => {
  fetchClassesList()
  fetchWithFilters()
})

const fetchWithFilters = () => {
  fetchUsers({
    role: 'siswa',
    page: currentPage.value,
    limit: itemsPerPage.value,
    class_group: selectedClass.value || undefined,
    angkatan: selectedGrade.value || undefined,
    search: searchQuery.value || undefined,
    status: selectedStatus.value || undefined
  })
}

// Menyesuaikan daftar kelas berdasarkan angkatan yang dipilih
const filteredClasses = computed(() => {
  return availableClasses.value.filter((c: any) => {
    const rawName = typeof c === 'string' ? c : String(c?.name || c?.class_name || c || '')
    const clsName = rawName.toUpperCase()
    if (!selectedGrade.value) return true
    return clsName.startsWith(selectedGrade.value + ' ') || clsName.startsWith(selectedGrade.value + '-')
  })
})

// Reset kelas ke 'Semua' jika angkatan berubah
watch(selectedGrade, () => {
  selectedClass.value = ''
})

// Debounce: saat filter berubah, reset ke halaman 1 lalu fetch
let filterTimer: ReturnType<typeof setTimeout> | null = null
watch([searchQuery, selectedGrade, selectedClass, selectedStatus], () => {
  if (filterTimer) clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    if (currentPage.value !== 1) {
      // Mengubah currentPage akan memicu watcher di bawah yang akan fetch
      currentPage.value = 1
    } else {
      fetchWithFilters()
    }
  }, 300)
})

// Saat page atau jumlah item per halaman berubah, langsung fetch
watch([currentPage, itemsPerPage], () => {
  fetchWithFilters()
})

// Kalau total halaman mengecil (setelah delete/filter), mundur ke halaman yang valid
watch(() => pagination.value.totalPages, (tp) => {
  if (currentPage.value > tp) {
    currentPage.value = Math.max(1, tp)
  }
})

const resetAllFilters = () => {
  searchQuery.value = ''
  selectedGrade.value = ''
  selectedClass.value = ''
  selectedStatus.value = ''
}

const { showError, showSuccess } = useAppToast()

const modalErrorMessage = ref('')

const openAddModal = () => {
  selectedStudentToEdit.value = null
  modalErrorMessage.value = ''
  isModalOpen.value = true
}

const openEditModal = (student: Student) => {
  selectedStudentToEdit.value = student
  modalErrorMessage.value = ''
  isModalOpen.value = true
}

const handleSaveStudent = async (data: Omit<Student, 'id' | 'avatarInitials'>) => {
  modalErrorMessage.value = ''
  const res = await addStudent(data)
  if (res.success) {
    isModalOpen.value = false
    showSuccess('Siswa baru berhasil ditambahkan!')
    fetchWithFilters()
  } else {
    modalErrorMessage.value = res.message || 'Gagal menambahkan data siswa. Periksa isian form.'
  }
}

const handleUpdateStudent = async (id: string, data: Partial<Student>) => {
  modalErrorMessage.value = ''
  const res = await updateStudent(id, data)
  if (res.success) {
    isModalOpen.value = false
    showSuccess('Data siswa berhasil diperbarui!')
    fetchWithFilters()
  } else {
    modalErrorMessage.value = res.message || 'Gagal mengupdate data siswa.'
  }
}

const handleDelete = (id: string, name: string) => {
  deleteTargetId.value = id
  deleteTargetName.value = name
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  deleteErrorMessage.value = ''
  const res = await deleteStudent(deleteTargetId.value)
  if (res.error) {
    const errMsg = res.error.message || 'Gagal menghapus siswa. Coba lagi.'
    deleteErrorMessage.value = errMsg
    showError(errMsg)
  } else {
    showSuccess(`Data siswa ${deleteTargetName.value} berhasil dihapus!`)
    fetchWithFilters()
  }
  isDeleteDialogOpen.value = false
  deleteTargetId.value = ''
  deleteTargetName.value = ''
}

const cancelDelete = () => {
  isDeleteDialogOpen.value = false
  deleteTargetId.value = ''
  deleteTargetName.value = ''
}

const openResetPasswordModal = (id: string) => {
  resetTargetId.value = id
  newPasswordInput.value = 'password123'
  resetSuccessMessage.value = ''
  isResetPasswordOpen.value = true
}

const handleResetPasswordSubmit = async () => {
  if (!resetTargetId.value || !newPasswordInput.value) return
  const res = await resetStudentPassword(resetTargetId.value, newPasswordInput.value)
  if (res.status === 200 || !res.error) {
    resetSuccessMessage.value = 'Password berhasil direset!'
    showSuccess('Password siswa berhasil direset!')
    setTimeout(() => {
      isResetPasswordOpen.value = false
    }, 1200)
  } else {
    showError(res.error?.message || 'Gagal mereset password siswa.')
  }
}
</script>

<template>
  <div class="flex flex-col gap-stack-lg">
    <!-- Header & Actions -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
      <div>
        <h2 class="font-headline text-headline-lg text-primary md:text-[36px] font-bold mb-1">
          Student Management
        </h2>
        <p class="font-body text-body-lg text-secondary">
          Kelola data siswa, pembagian kelas, dan status keaktifan siswa.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          class="bg-primary text-white font-label text-label-lg px-6 py-2.5 rounded hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm active:scale-95 font-bold"
          @click="openAddModal"
        >
          <span class="material-symbols-outlined text-[20px]">add</span>
          Tambah Siswa
        </button>
      </div>
    </div>

    <!-- Delete Error Alert -->
    <div
      v-if="deleteErrorMessage"
      class="p-3.5 rounded-xl bg-rose-50 text-rose-700 font-medium text-xs sm:text-sm flex items-start gap-2.5 border border-rose-200"
    >
      <span class="material-symbols-outlined text-[20px] shrink-0 text-rose-600 mt-0.5">error</span>
      <span class="leading-snug flex-1">{{ deleteErrorMessage }}</span>
      <button
        class="shrink-0 text-rose-500 hover:text-rose-700"
        @click="deleteErrorMessage = ''"
      >
        <span class="material-symbols-outlined text-[18px]">close</span>
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
              <option value="">
                Semua Angkatan
              </option>
              <option value="X">
                Angkatan X
              </option>
              <option value="XI">
                Angkatan XI
              </option>
              <option value="XII">
                Angkatan XII
              </option>
            </select>
            <span class="absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-sm pointer-events-none">expand_more</span>
          </div>

          <!-- Class Filter -->
          <div class="relative flex-1 min-w-0 sm:flex-none sm:w-40">
            <select
              v-model="selectedClass"
              class="w-full appearance-none pl-3 pr-8 py-2 border border-surface-container-highest rounded text-body-md text-deep-black bg-surface-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">
                Semua Kelas
              </option>
              <option
                v-for="cls in filteredClasses"
                :key="cls.id || cls.name || cls"
                :value="cls.name || cls.class_name || cls"
              >
                {{ cls.name || cls.class_name || cls }}
              </option>
            </select>
            <span class="absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-sm pointer-events-none">expand_more</span>
          </div>

          <!-- Status Siswa Filter -->
          <div class="relative flex-1 min-w-0 sm:flex-none sm:w-52">
            <select
              v-model="selectedStatus"
              class="w-full appearance-none pl-3 pr-8 py-2 border border-surface-container-highest rounded text-body-md text-deep-black bg-surface-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">
                Semua Status Siswa
              </option>
              <option value="AKTIF">
                AKTIF
              </option>
              <option value="PKL">
                PKL
              </option>
              <option value="NON AKTIF">
                NON AKTIF
              </option>
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
              <th class="p-4 font-bold">
                Siswa
              </th>
              <th class="p-4 font-bold">
                NISN / Username
              </th>
              <th class="p-4 font-bold">
                Kelas
              </th>
              <th class="p-4 font-bold">
                Kontak Ortu
              </th>
              <th class="p-4 font-bold">
                Status
              </th>
              <th class="p-4 font-bold text-center">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-highest text-body-md text-deep-black">
            <tr
              v-for="student in students"
              :key="student.id"
              class="hover:bg-surface-container-low transition-colors"
            >
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs">
                    {{ student.avatarInitials }}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <p class="font-bold text-on-surface">
                        {{ student.name }}
                      </p>
                      <span
                        class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border"
                        :class="student.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'"
                      >
                        {{ student.role || 'siswa' }}
                      </span>
                    </div>
                    <p class="text-xs text-secondary">
                      {{ student.email || '-' }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="p-4 font-mono text-xs text-secondary">
                <p class="font-bold text-on-surface">
                  {{ student.nisn }}
                </p>
                <p
                  v-if="student.username"
                  class="text-[11px] text-secondary"
                >
                  @{{ student.username }}
                </p>
              </td>
              <td class="p-4 font-body">
                {{ student.class }}
              </td>
              <td class="p-4 font-mono text-xs text-secondary">
                {{ student.parentPhone || '-' }}
              </td>
              <td class="p-4">
                <span
                  class="px-2.5 py-1 rounded text-xs font-bold"
                  :class="{
                    'bg-emerald-100 text-emerald-700': student.activeStatus === 'AKTIF',
                    'bg-amber-100 text-amber-700': student.activeStatus === 'PKL',
                    'bg-rose-100 text-rose-700': student.activeStatus === 'NON AKTIF'
                  }"
                >
                  {{ student.activeStatus }}
                </span>
              </td>
              <td class="p-4 text-center">
                <div class="inline-flex items-center gap-1">
                  <button
                    class="p-1.5 text-secondary hover:text-primary rounded hover:bg-surface-container-low"
                    title="Edit Siswa"
                    @click="openEditModal(student)"
                  >
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    class="p-1.5 text-secondary hover:text-amber-600 rounded hover:bg-surface-container-low"
                    title="Reset Password"
                    @click="openResetPasswordModal(student.id)"
                  >
                    <span class="material-symbols-outlined text-[18px]">lock_reset</span>
                  </button>
                  <button
                    class="p-1.5 text-secondary hover:text-error rounded hover:bg-surface-container-low"
                    title="Hapus Siswa"
                    @click="handleDelete(student.id, student.name)"
                  >
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!students.length">
              <td
                colspan="6"
                class="p-8 text-center text-secondary"
              >
                Tidak ada data siswa.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-4 border-t border-surface-container-highest flex flex-col sm:flex-row items-center justify-between gap-4 text-body-md text-secondary">
        <div class="flex flex-wrap items-center gap-4">
          <span>
            Menampilkan {{ students.length ? (currentPage - 1) * itemsPerPage + 1 : 0 }}-{{ Math.min(currentPage * itemsPerPage, pagination.total) }} dari {{ pagination.total }} siswa
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
            class="w-8 h-8 rounded flex items-center justify-center border border-surface-container-highest text-secondary hover:border-primary hover:text-primary disabled:opacity-50"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span class="px-3 font-bold text-on-surface">{{ currentPage }} / {{ pagination.totalPages }}</span>
          <button
            class="w-8 h-8 rounded flex items-center justify-center border border-surface-container-highest text-secondary hover:border-primary hover:text-primary disabled:opacity-50"
            :disabled="currentPage >= pagination.totalPages"
            @click="currentPage++"
          >
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Student Modal -->
    <StudentModal
      :is-open="isModalOpen"
      :edit-student-data="selectedStudentToEdit"
      :error-message="modalErrorMessage"
      @close="isModalOpen = false"
      @save="handleSaveStudent"
      @update="handleUpdateStudent"
    />

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      :is-open="isDeleteDialogOpen"
      title="Hapus Data Siswa"
      :message="`Apakah Anda yakin ingin menghapus siswa ${deleteTargetName}? Data yang telah dihapus tidak dapat dikembalikan.`"
      confirm-label="Ya, Hapus Siswa"
      confirm-variant="danger"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Reset Password Modal -->
    <Teleport to="body">
      <div
        v-if="isResetPasswordOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div class="bg-surface-white rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
          <h3 class="font-title text-lg font-bold text-primary flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">lock_reset</span>
            Reset Password Siswa
          </h3>
          <div class="space-y-2">
            <label class="block text-xs font-bold text-secondary">Password Baru</label>
            <input
              v-model="newPasswordInput"
              type="text"
              class="w-full px-3 py-2 border border-surface-container-highest rounded font-mono text-sm"
              placeholder="Masukkan password baru..."
            >
          </div>
          <p
            v-if="resetSuccessMessage"
            class="text-xs text-emerald-600 font-bold flex items-center gap-1"
          >
            <span class="material-symbols-outlined text-sm">check_circle</span> {{ resetSuccessMessage }}
          </p>
          <div class="flex justify-end gap-2 pt-2">
            <button
              class="px-4 py-2 border rounded text-xs font-bold text-secondary"
              @click="isResetPasswordOpen = false"
            >
              Batal
            </button>
            <button
              class="px-4 py-2 bg-primary text-white rounded text-xs font-bold"
              @click="handleResetPasswordSubmit"
            >
              Reset Password
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
