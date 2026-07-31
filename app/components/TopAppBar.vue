<script setup lang="ts">
export interface NotificationItem {
  id?: number | string
  title?: string
  message?: string
  content?: string
  time?: string
  is_read?: boolean
  [key: string]: unknown
}

defineProps<{
  pageTitle?: string
}>()

const { fetchApi } = useApi()
const { user, logout } = useAuth()

const isMobileMenuOpen = ref(false)
const showNotificationToast = ref(false)
const showProfileMenu = ref(false)

const notifications = ref<NotificationItem[]>([])
const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length)

const adminName = computed(() => user.value?.full_name || user.value?.name || user.value?.username || 'Admin Utama')
const adminRole = computed(() => user.value?.role || 'Administrator')

const fetchNotifications = async () => {
  const { data } = await fetchApi<Record<string, unknown>>('/api/v1/notifications')
  const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : null
  if (list) {
    notifications.value = list as NotificationItem[]
  }
}

onMounted(() => {
  fetchNotifications()
})

const triggerNotification = async () => {
  showNotificationToast.value = !showNotificationToast.value
  showProfileMenu.value = false
  if (showNotificationToast.value) {
    await fetchNotifications()
  }
}

const markAllAsRead = async () => {
  await fetchApi('/api/v1/notifications/read-all', { method: 'PUT' })
  notifications.value.forEach((n) => {
    n.is_read = true
  })
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
      <h1 class="font-title text-title-lg font-bold text-primary">
        Smart-presence
      </h1>
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
          <span
            v-if="unreadCount > 0"
            class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface-white"
          />
        </button>

        <!-- Notification Dropdown Popover -->
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
            class="absolute right-0 mt-2 w-80 bg-surface-white border border-surface-container-highest rounded-lg shadow-lg p-4 z-50 text-xs text-on-surface"
          >
            <div class="flex items-center justify-between mb-3 border-b pb-2">
              <span class="font-bold text-primary flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">notifications</span> Notifications ({{ notifications.length }})
              </span>
              <button
                v-if="notifications.length"
                class="text-[10px] text-secondary hover:text-primary font-bold"
                @click="markAllAsRead"
              >
                Tandai Dibaca
              </button>
            </div>

            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="notif in notifications"
                :key="notif.id"
                class="p-2 rounded bg-surface-container-low border border-surface-container-highest text-secondary text-xs"
              >
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-on-surface">{{ notif.title || 'Notifikasi Presensi' }}</span>
                  <span class="text-[10px] text-secondary">{{ notif.time || 'Baru' }}</span>
                </div>
                <p>{{ notif.message || notif.content || 'Aktivitas sistem tercatat.' }}</p>
              </div>

              <div
                v-if="!notifications.length"
                class="text-center py-4 text-secondary"
              >
                Tidak ada notifikasi baru.
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Administrator Profile Dropdown -->
      <div class="relative">
        <div
          class="flex items-center gap-3 pl-4 md:pl-6 border-l border-surface-container-highest cursor-pointer group"
          @click="showProfileMenu = !showProfileMenu"
        >
          <div class="text-right hidden md:block">
            <p class="font-label text-label-lg text-deep-black font-bold uppercase text-[11px] tracking-widest leading-none">
              {{ adminName }}
            </p>
            <p class="font-label text-label-sm text-secondary text-[11px] capitalize">
              {{ adminRole }}
            </p>
          </div>
          <div class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm group-hover:bg-primary-dark transition-colors">
            <span class="material-symbols-outlined text-[20px]">person</span>
          </div>
        </div>

        <!-- Profile Dropdown Popover -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div
            v-if="showProfileMenu"
            class="absolute right-0 mt-2 w-48 bg-surface-white border border-surface-container-highest rounded-xl shadow-lg p-2 z-50 text-xs text-on-surface"
          >
            <div class="px-3 py-2 border-b border-surface-container-highest mb-1">
              <p class="font-bold text-on-surface text-xs truncate">
                {{ adminName }}
              </p>
              <p class="text-[10px] text-secondary capitalize">
                {{ adminRole }}
              </p>
            </div>
            <button
              class="w-full text-left px-3 py-2 rounded-lg font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
              @click="logout"
            >
              <span class="material-symbols-outlined text-sm">logout</span> Keluar
            </button>
          </div>
        </Transition>
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
            <h2 class="font-bold text-primary font-title">
              Smart-presence
            </h2>
            <button @click="isMobileMenuOpen = false">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav class="flex flex-col gap-2">
            <NuxtLink
              to="/"
              class="p-3 rounded-lg hover:bg-surface-container font-label text-sm flex items-center gap-3 text-secondary"
              @click="isMobileMenuOpen = false"
            >
              <span class="material-symbols-outlined">grid_view</span> Dashboard
            </NuxtLink>
            <NuxtLink
              to="/absensi"
              class="p-3 rounded-lg hover:bg-surface-container font-label text-sm flex items-center gap-3 text-secondary"
              @click="isMobileMenuOpen = false"
            >
              <span class="material-symbols-outlined">calendar_today</span> Absensi Harian
            </NuxtLink>
            <NuxtLink
              to="/siswa"
              class="p-3 rounded-lg hover:bg-surface-container font-label text-sm flex items-center gap-3 text-secondary"
              @click="isMobileMenuOpen = false"
            >
              <span class="material-symbols-outlined">group</span> Data Siswa
            </NuxtLink>
            <NuxtLink
              to="/laporan"
              class="p-3 rounded-lg hover:bg-surface-container font-label text-sm flex items-center gap-3 text-secondary"
              @click="isMobileMenuOpen = false"
            >
              <span class="material-symbols-outlined">bar_chart</span> Laporan
            </NuxtLink>
            <NuxtLink
              to="/token-qr"
              class="p-3 rounded-lg hover:bg-surface-container font-label text-sm flex items-center gap-3 text-secondary"
              @click="isMobileMenuOpen = false"
            >
              <span class="material-symbols-outlined">settings</span> Settings
            </NuxtLink>
            <NuxtLink
              to="/whatsapp-bot"
              class="p-3 rounded-lg hover:bg-surface-container font-label text-sm flex items-center gap-3 text-secondary"
              @click="isMobileMenuOpen = false"
            >
              <span class="material-symbols-outlined">chat</span> WhatsApp Bot
            </NuxtLink>
            <button
              class="p-3 rounded-lg hover:bg-rose-50 font-label text-sm flex items-center gap-3 text-rose-600 font-bold mt-4 border-t pt-4"
              @click="logout"
            >
              <span class="material-symbols-outlined">logout</span> Keluar
            </button>
          </nav>
        </div>
      </div>
    </Teleport>
  </header>
</template>
