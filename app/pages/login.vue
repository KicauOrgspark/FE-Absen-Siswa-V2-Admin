<script setup lang="ts">
definePageMeta({
  layout: 'blank'
})

useSeoMeta({
  title: 'Login Admin - Smart-Presence Panel'
})

const { login } = useAuth()
const router = useRouter()

const identifier = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const res = await login(identifier.value, password.value)
    if (res.success) {
      router.push('/')
    } else {
      errorMessage.value = res.message || 'Login gagal. Periksa Username/NISN dan password Anda.'
    }
  } catch {
    errorMessage.value = 'Terjadi kesalahan sistem. Silakan coba lagi.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-background-cream min-h-screen flex flex-col relative overflow-hidden font-body text-on-background selection:bg-primary selection:text-white">
    <!-- Subtle Ambient Radial Glow -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-primary/5 rounded-full blur-3xl pointer-events-none z-0" />

    <!-- Main Content Canvas -->
    <main class="grow flex flex-col items-center justify-center relative z-10 px-4 md:px-8 py-10">
      <!-- Clean Modern Admin Login Card -->
      <div class="w-full max-w-105 bg-surface-white rounded-3xl shadow-xl border border-surface-container-highest/80 relative overflow-hidden">
        <!-- Decorative Top Accent -->
        <div class="absolute top-0 left-0 w-full h-1.5 bg-primary" />

        <div class="py-8 px-6 sm:py-11 sm:px-9 flex flex-col items-center">
          <!-- Header Section -->
          <div class="text-center mb-9 w-full">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-light/40 text-primary mb-3">
              <span class="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>
            <h1 class="font-headline text-2xl sm:text-3xl font-extrabold text-primary mb-1 tracking-tight">
              Smart-Presence Admin
            </h1>
            <p class="font-body text-xs sm:text-sm font-semibold text-secondary leading-snug">
              Portal Administrasi & Monitoring Absensi
            </p>
            <p class="font-body text-xs font-medium text-secondary/75 mt-1 tracking-wide">
              SMK Plus Pelita Nusantara Bogor
            </p>
          </div>

          <!-- Error Alert -->
          <div
            v-if="errorMessage"
            class="w-full mb-6 p-3.5 rounded-xl bg-rose-50 text-rose-700 font-medium text-xs sm:text-sm flex items-start gap-2.5 shadow-xs border border-rose-200"
          >
            <span class="material-symbols-outlined text-[20px] shrink-0 text-rose-600 mt-0.5">error</span>
            <span class="leading-snug">{{ errorMessage }}</span>
          </div>

          <!-- Form Section -->
          <form
            class="w-full space-y-5"
            @submit.prevent="handleLogin"
          >
            <!-- Identifier Field (Username / NISN / Email) -->
            <div>
              <label
                class="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wider"
                for="identifier"
              >
                Username / NISN / Email
              </label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60 pointer-events-none text-[20px]">
                  person
                </span>
                <input
                  id="identifier"
                  v-model="identifier"
                  class="w-full pl-11 pr-4 py-3 bg-surface-white border border-surface-container-highest rounded-xl font-medium text-sm text-on-surface placeholder:text-secondary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  name="identifier"
                  placeholder="Masukkan Username / NISN / Email"
                  required
                  type="text"
                >
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <label
                class="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wider"
                for="password"
              >
                Password
              </label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60 pointer-events-none text-[20px]">
                  lock
                </span>
                <input
                  id="password"
                  v-model="password"
                  class="w-full pl-11 pr-11 py-3 bg-surface-white border border-surface-container-highest rounded-xl font-medium text-sm text-on-surface placeholder:text-secondary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  name="password"
                  placeholder="••••••••"
                  required
                  :type="showPassword ? 'text' : 'password'"
                >
                <button
                  type="button"
                  aria-label="Toggle Password Visibility"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary/60 hover:text-on-surface transition-colors p-1"
                  @click="showPassword = !showPassword"
                >
                  <span class="material-symbols-outlined text-[20px] block">
                    {{ showPassword ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="pt-2">
              <button
                class="w-full py-3.5 px-4 bg-primary text-white rounded-xl font-bold text-sm tracking-wide flex justify-center items-center gap-2 shadow-sm hover:shadow-md hover:bg-primary-dark active:scale-[0.99] transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed"
                type="submit"
                :disabled="isLoading"
              >
                <span v-if="!isLoading">Masuk ke Portal Admin</span>
                <span
                  v-else
                  class="flex items-center gap-2"
                >
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
                <span
                  v-if="!isLoading"
                  class="material-symbols-outlined text-[20px]"
                >
                  login
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Footer Directly Underneath the Login Card -->
      <footer class="mt-5 text-center flex flex-col items-center justify-center gap-1.5">
        <p class="font-bold text-xs text-secondary/90 tracking-wider uppercase">
          ADMIN PANEL ABSENSI SISWA SMK PLUS PNB
        </p>
        <p class="font-semibold text-[11px] text-secondary/80 tracking-wider uppercase flex flex-wrap items-center justify-center gap-1.5">
          <span>POWERED BY</span>
          <span class="font-extrabold text-[#005321] tracking-wide">DEVACTO IT RPL</span>
          <span class="inline-block w-1 h-1 rounded-full bg-secondary/40" />
          <span>DEV BY</span>
          <span class="font-extrabold text-primary tracking-wide">KICAU_orgspark</span>
        </p>
      </footer>
    </main>
  </div>
</template>
