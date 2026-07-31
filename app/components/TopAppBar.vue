<script setup lang="ts">
defineProps<{
  pageTitle?: string
}>()

const isMobileMenuOpen = ref(false)
const showNotificationToast = ref(false)

const triggerNotification = () => {
  showNotificationToast.value = true
  setTimeout(() => {
    showNotificationToast.value = false
  }, 3000)
}
</script>

<template>
  <header class="flex justify-between items-center px-margin-page py-stack-sm w-full h-16 bg-surface-white border-b border-surface-container-highest sticky top-0 z-40">
    <!-- Mobile Brand / Menu Toggle -->
    <div class="md:hidden flex items-center gap-3">
      <button
        class="text-primary p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <span class="material-symbols-outlined">menu</span>
      </button>
      <h1 class="font-title text-title-lg font-bold text-primary">Smart-presence</h1>
    </div>

    <!-- Desktop Title -->
    <div class="hidden md:block">
      <h2 class="font-headline text-headline-md font-bold text-primary uppercase tracking-wider">
        {{ pageTitle || 'Smart-presence' }}
      </h2>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-4 md:gap-6">
      <!-- Notification Bell -->
      <div class="relative">
        <button
          class="text-secondary hover:text-primary transition-colors scale-95 active:scale-90 p-2 rounded-full hover:bg-surface-container-highest relative flex items-center justify-center"
          title="Notifications"
          @click="triggerNotification"
        >
          <span class="material-symbols-outlined text-[22px]">notifications</span>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface-white"></span>
        </button>

        <!-- Notification Toast -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div
            v-if="showNotificationToast"
            class="absolute right-0 mt-2 w-72 bg-surface-white border border-surface-container-highest rounded-lg shadow-lg p-4 z-50 text-xs text-on-surface"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold text-primary flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">info</span> Notification
              </span>
              <span class="text-[10px] text-secondary">Just now</span>
            </div>
            <p class="text-secondary">Sistem presensi berjalan normal. 30 siswa kelas X DKV-1 belum absen.</p>
          </div>
        </Transition>
      </div>

      <!-- Administrator Profile -->
      <div class="flex items-center gap-3 pl-4 md:pl-6 border-l border-surface-container-highest cursor-pointer group">
        <div class="text-right hidden md:block">
          <p class="font-label text-label-lg text-deep-black font-bold uppercase text-[11px] tracking-widest leading-none">Admin Utama</p>
          <p class="font-label text-label-sm text-secondary text-[11px]">Administrator</p>
        </div>
        <div class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs shadow-sm">
          <span class="material-symbols-outlined text-[20px]">person</span>
        </div>
      </div>
    </div>

    <!-- Mobile Drawer Overlay -->
    <Teleport to="body">
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 bg-black/50 z-50 md:hidden"
        @click="isMobileMenuOpen = false"
      >
        <div
          class="w-64 bg-surface-white h-full p-6 flex flex-col gap-4 shadow-2xl"
          @click.stop
        >
          <div class="flex items-center justify-between border-b pb-4">
            <h2 class="font-bold text-primary font-title">Smart-presence</h2>
            <button @click="isMobileMenuOpen = false">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav class="flex flex-col gap-2">
            <NuxtLink to="/" class="p-3 rounded-lg hover:bg-surface-container font-label text-sm flex items-center gap-3 text-secondary" @click="isMobileMenuOpen = false">
              <span class="material-symbols-outlined">grid_view</span> Dashboard
            </NuxtLink>
            <NuxtLink to="/absensi" class="p-3 rounded-lg hover:bg-surface-container font-label text-sm flex items-center gap-3 text-secondary" @click="isMobileMenuOpen = false">
              <span class="material-symbols-outlined">calendar_today</span> Absensi Harian
            </NuxtLink>
            <NuxtLink to="/siswa" class="p-3 rounded-lg hover:bg-surface-container font-label text-sm flex items-center gap-3 text-secondary" @click="isMobileMenuOpen = false">
              <span class="material-symbols-outlined">group</span> Data Siswa
            </NuxtLink>
            <NuxtLink to="/laporan" class="p-3 rounded-lg hover:bg-surface-container font-label text-sm flex items-center gap-3 text-secondary" @click="isMobileMenuOpen = false">
              <span class="material-symbols-outlined">bar_chart</span> Laporan
            </NuxtLink>
            <NuxtLink to="/token-qr" class="p-3 rounded-lg hover:bg-surface-container font-label text-sm flex items-center gap-3 text-secondary" @click="isMobileMenuOpen = false">
              <span class="material-symbols-outlined">settings</span> Settings
            </NuxtLink>
            <NuxtLink to="/whatsapp-bot" class="p-3 rounded-lg hover:bg-surface-container font-label text-sm flex items-center gap-3 text-secondary" @click="isMobileMenuOpen = false">
              <span class="material-symbols-outlined">chat</span> WhatsApp Bot
            </NuxtLink>
          </nav>
        </div>
      </div>
    </Teleport>
  </header>
</template>
