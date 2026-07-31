<script setup lang="ts">
import type { Student } from '~/composables/useAttendance'

const props = defineProps<{
  isOpen: boolean
  editStudentData?: Student | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', student: Omit<Student, 'id' | 'avatarInitials'>): void
  (e: 'update', id: string, student: Partial<Student>): void
}>()

const showPassword = ref(false)

const form = reactive({
  name: '',
  nisn: '',
  username: '',
  password: '',
  email: '',
  parentPhone: '',
  class: 'X DKV-1',
  major: 'DKV' as Student['major'],
  grade: 'X' as Student['grade'],
  status: 'Belum Absen' as Student['status'],
  activeStatus: 'AKTIF' as Student['activeStatus'],
  alpaCount: 0
})

watch(
  () => props.editStudentData,
  (newVal) => {
    if (newVal) {
      form.name = newVal.name
      form.nisn = newVal.nisn
      form.username = newVal.username || newVal.nisn
      form.password = newVal.password || ''
      form.email = newVal.email || ''
      form.parentPhone = newVal.parentPhone || ''
      form.class = newVal.class
      form.major = newVal.major
      form.grade = newVal.grade
      form.status = newVal.status
      form.activeStatus = newVal.activeStatus
      form.alpaCount = newVal.alpaCount
    } else {
      form.name = ''
      form.nisn = ''
      form.username = ''
      form.password = ''
      form.email = ''
      form.parentPhone = ''
      form.class = 'X DKV-1'
      form.major = 'DKV'
      form.grade = 'X'
      form.status = 'Belum Absen'
      form.activeStatus = 'AKTIF'
      form.alpaCount = 0
    }
  },
  { immediate: true }
)

// Auto fill username from NISN if username is untouched
watch(
  () => form.nisn,
  (newNisn) => {
    if (!props.editStudentData && !form.username) {
      form.username = newNisn
    }
  }
)

const handleSubmit = () => {
  if (props.editStudentData) {
    const payload: Partial<Student> = {}
    if (form.name.trim()) {
      payload.name = form.name.trim()
      payload.avatarInitials = form.name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }
    if (form.nisn.trim()) payload.nisn = form.nisn.trim()
    if (form.username.trim()) payload.username = form.username.trim()
    if (form.password.trim()) payload.password = form.password.trim()
    if (form.email.trim()) payload.email = form.email.trim()
    if (form.parentPhone.trim()) payload.parentPhone = form.parentPhone.trim()
    if (form.class.trim()) payload.class = form.class.trim()
    if (form.major) payload.major = form.major
    if (form.activeStatus) payload.activeStatus = form.activeStatus

    emit('update', props.editStudentData.id, payload)
  } else {
    if (
      !form.name.trim()
      || !form.nisn.trim()
      || !form.username.trim()
      || !form.password.trim()
      || !form.email.trim()
      || !form.parentPhone.trim()
      || !form.class.trim()
    ) {
      return
    }
    emit('save', {
      ...form,
      name: form.name.trim(),
      nisn: form.nisn.trim(),
      username: form.username.trim(),
      password: form.password.trim(),
      email: form.email.trim(),
      parentPhone: form.parentPhone.trim(),
      class: form.class.trim(),
      time: '-'
    })
  }
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-hidden"
      >
        <!-- Backdrop Overlay -->
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          @click="emit('close')"
        />

        <!-- Slide-over Sidebar Container -->
        <div class="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <Transition
            enter-active-class="transform transition ease-out duration-300"
            enter-from-class="translate-x-full"
            enter-to-class="translate-x-0"
            leave-active-class="transform transition ease-in duration-200"
            leave-from-class="translate-x-0"
            leave-to-class="translate-x-full"
            appear
          >
            <div
              class="w-screen max-w-lg bg-surface-white border-l border-surface-container-highest shadow-2xl flex flex-col h-full"
            >
              <!-- Drawer Header -->
              <div class="p-6 border-b border-surface-container-highest flex items-center justify-between shrink-0 bg-surface-white">
                <div>
                  <h3 class="font-headline text-headline-md font-bold text-primary flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-2xl">{{ editStudentData ? 'edit_note' : 'person_add' }}</span>
                    {{ editStudentData ? 'Edit Data Siswa' : 'Tambah Siswa Baru' }}
                  </h3>
                  <p class="font-body text-xs text-secondary mt-1">
                    {{ editStudentData ? 'Kolom bersifat opsional. Kosongkan jika tidak ingin mengubah data.' : 'Semua kolom bertanda * wajib diisi untuk pendaftaran baru.' }}
                  </p>
                </div>
                <button
                  class="text-secondary hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container-low"
                  title="Tutup Sidebar"
                  @click="emit('close')"
                >
                  <span class="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <!-- Drawer Form Content -->
              <form
                class="flex-1 flex flex-col justify-between overflow-hidden"
                @submit.prevent="handleSubmit"
              >
                <div class="p-6 space-y-5 overflow-y-auto flex-1">
                  <div>
                    <label class="block font-label text-label-sm text-secondary mb-1">
                      Nama Lengkap Siswa <span
                        v-if="!editStudentData"
                        class="text-rose-500"
                      >*</span>
                    </label>
                    <input
                      v-model="form.name"
                      type="text"
                      :required="!editStudentData"
                      class="w-full px-4 py-2.5 bg-surface-white border border-surface-container-highest rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      :placeholder="editStudentData ? 'Kosongkan jika tidak diubah' : 'Contoh: Adli Firdaus'"
                    >
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block font-label text-label-sm text-secondary mb-1">
                        NISN / ID Siswa <span
                          v-if="!editStudentData"
                          class="text-rose-500"
                        >*</span>
                      </label>
                      <input
                        v-model="form.nisn"
                        type="text"
                        :required="!editStudentData"
                        class="w-full px-4 py-2.5 bg-surface-white border border-surface-container-highest rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-sm"
                        :placeholder="editStudentData ? 'Kosongkan jika tidak diubah' : '26271007190'"
                      >
                    </div>
                    <div>
                      <label class="block font-label text-label-sm text-secondary mb-1">
                        Jurusan <span
                          v-if="!editStudentData"
                          class="text-rose-500"
                        >*</span>
                      </label>
                      <select
                        v-model="form.major"
                        class="w-full px-4 py-2.5 bg-surface-white border border-surface-container-highest rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      >
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
                  </div>

                  <!-- Account Credentials: Username & Password -->
                  <div class="p-4 bg-surface-container-low rounded-xl border border-surface-container-highest space-y-3">
                    <p class="font-label text-xs font-bold text-primary flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-sm">lock</span> Kredensial Akun Siswa
                    </p>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block font-label text-[11px] text-secondary mb-1">
                          Username <span
                            v-if="!editStudentData"
                            class="text-rose-500"
                          >*</span>
                        </label>
                        <input
                          v-model="form.username"
                          type="text"
                          :required="!editStudentData"
                          class="w-full px-3 py-2 bg-surface-white border border-surface-container-highest rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary font-mono text-sm"
                          :placeholder="editStudentData ? 'Kosongkan jika tidak diubah' : 'adli_firdaus'"
                        >
                      </div>
                      <div>
                        <label class="block font-label text-[11px] text-secondary mb-1">
                          Password <span
                            v-if="!editStudentData"
                            class="text-rose-500"
                          >*</span>
                        </label>
                        <div class="relative">
                          <input
                            v-model="form.password"
                            :type="showPassword ? 'text' : 'password'"
                            :required="!editStudentData"
                            class="w-full px-3 py-2 pr-9 bg-surface-white border border-surface-container-highest rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary font-mono text-sm"
                            :placeholder="editStudentData ? 'Kosongkan jika tidak diubah' : '••••••••'"
                          >
                          <button
                            type="button"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary p-1"
                            @click="showPassword = !showPassword"
                          >
                            <span class="material-symbols-outlined text-sm">
                              {{ showPassword ? 'visibility_off' : 'visibility' }}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block font-label text-label-sm text-secondary mb-1">
                      Email Siswa <span
                        v-if="!editStudentData"
                        class="text-rose-500"
                      >*</span>
                    </label>
                    <input
                      v-model="form.email"
                      type="email"
                      :required="!editStudentData"
                      class="w-full px-4 py-2.5 bg-surface-white border border-surface-container-highest rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      :placeholder="editStudentData ? 'Kosongkan jika tidak diubah' : 'nama@student.pelitanusantara.sch.id'"
                    >
                  </div>

                  <div>
                    <label class="block font-label text-label-sm text-secondary mb-1">
                      No. Telepon Orang Tua <span
                        v-if="!editStudentData"
                        class="text-rose-500"
                      >*</span>
                    </label>
                    <input
                      v-model="form.parentPhone"
                      type="tel"
                      :required="!editStudentData"
                      class="w-full px-4 py-2.5 bg-surface-white border border-surface-container-highest rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-sm"
                      :placeholder="editStudentData ? 'Kosongkan jika tidak diubah' : 'Contoh: 081234567890'"
                    >
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block font-label text-label-sm text-secondary mb-1">
                        Kelas <span
                          v-if="!editStudentData"
                          class="text-rose-500"
                        >*</span>
                      </label>
                      <input
                        v-model="form.class"
                        type="text"
                        :required="!editStudentData"
                        class="w-full px-4 py-2.5 bg-surface-white border border-surface-container-highest rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        :placeholder="editStudentData ? 'Kosongkan jika tidak diubah' : 'X DKV-1'"
                      >
                    </div>
                    <div>
                      <label class="block font-label text-label-sm text-secondary mb-1">Status Keaktifan</label>
                      <select
                        v-model="form.activeStatus"
                        class="w-full px-4 py-2.5 bg-surface-white border border-surface-container-highest rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      >
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
                    </div>
                  </div>
                </div>

                <!-- Drawer Footer Actions -->
                <div class="p-5 border-t border-surface-container-highest bg-surface-white flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    class="px-5 py-2.5 border border-surface-container-highest rounded-lg font-label text-label-lg text-secondary hover:bg-surface-container-low transition-colors"
                    @click="emit('close')"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    class="px-6 py-2.5 bg-primary text-white font-label text-label-lg rounded-lg hover:bg-primary-container transition-colors shadow-sm font-bold flex items-center gap-2"
                  >
                    <span class="material-symbols-outlined text-lg">check</span>
                    Simpan Data
                  </button>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
