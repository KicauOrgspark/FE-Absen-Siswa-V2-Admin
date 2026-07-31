<script setup lang="ts">
const route = useRoute()
const { logout } = useAuth()

const isCollapsed = ref(false)

const navItems = [
  { label: 'Dashboard', path: '/', icon: 'grid_view' },
  { label: 'Absensi Harian', path: '/absensi', icon: 'calendar_today' },
  { label: 'Data Siswa', path: '/siswa', icon: 'group' },
  { label: 'Laporan', path: '/laporan', icon: 'bar_chart' },
  { label: 'Settings', path: '/token-qr', icon: 'settings' },
  { label: 'WhatsApp Bot', path: '/whatsapp-bot', icon: 'chat' }
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <aside
    class="hidden md:flex flex-col h-screen sticky top-0 left-0 border-r border-surface-container-highest bg-surface-white py-stack-lg z-50 transition-all duration-300 shrink-0"
    :class="isCollapsed ? 'w-20' : 'w-sidebar-width'"
  >
    <!-- Brand Header -->
    <div class="px-gutter-grid mb-stack-lg flex items-center gap-3">
      <div class="bg-primary text-white p-2 rounded-lg flex-shrink-0 flex items-center justify-center">
        <span
          class="material-symbols-outlined text-[24px]"
          data-fill="1"
        >shield</span>
      </div>
      <div
        v-if="!isCollapsed"
        class="overflow-hidden"
      >
        <h1 class="font-title text-title-lg font-bold text-primary leading-tight truncate">
          Smart-presence
        </h1>
        <p class="font-label text-label-sm text-secondary uppercase tracking-widest text-[10px] truncate">
          Administrative Panel
        </p>
      </div>
      <button
        class="ml-auto text-secondary hover:text-primary transition-colors p-1 rounded hover:bg-surface-container-low"
        :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="isCollapsed = !isCollapsed"
      >
        <span class="material-symbols-outlined text-sm">
          {{ isCollapsed ? 'chevron_right' : 'chevron_left' }}
        </span>
      </button>
    </div>

    <!-- Navigation Items -->
    <nav class="flex flex-col gap-1 flex-grow px-3 overflow-y-auto">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-4 py-3 rounded-md font-label text-label-lg transition-colors duration-200"
        :class="[
          isActive(item.path)
            ? 'bg-primary text-white font-bold shadow-sm'
            : 'text-secondary hover:text-primary hover:bg-surface-container-low'
        ]"
      >
        <span
          class="material-symbols-outlined text-[20px]"
          :data-fill="isActive(item.path) ? '1' : '0'"
        >
          {{ item.icon }}
        </span>
        <span
          v-if="!isCollapsed"
          class="truncate"
        >{{ item.label }}</span>
      </NuxtLink>

      <button
        class="flex items-center gap-3 px-4 py-3 mt-auto rounded-md font-label text-label-lg text-rose-600 hover:bg-rose-50 transition-colors duration-200 font-bold"
        :title="isCollapsed ? 'Keluar / Logout' : ''"
        @click="logout"
      >
        <span class="material-symbols-outlined text-[20px]">logout</span>
        <span
          v-if="!isCollapsed"
          class="truncate"
        >Keluar</span>
      </button>
    </nav>

    <!-- Footer Credits -->
    <div
      v-if="!isCollapsed"
      class="px-gutter-grid mt-auto pt-6 border-t border-surface-container-highest text-center"
    >
      <p class="font-label text-[10px] text-muted-text leading-relaxed">
        © 2026 SMK Plus Pelita Nusantara.<br>
        All rights reserved.<br>
        Developed by KicawOrgspark<br>
        Powered by DEVACTO IT RPL
      </p>
    </div>
  </aside>
</template>
