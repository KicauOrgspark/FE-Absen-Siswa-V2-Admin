<script setup lang="ts">
const route = useRoute()

const getPageTitle = computed(() => {
  switch (route.path) {
    case '/':
      return 'Smart-presence'
    case '/absensi':
      return 'Absensi Harian'
    case '/siswa':
      return 'Student Management'
    case '/laporan':
      return 'Attendance Reports'
    case '/token-qr':
      return 'Token QR Absensi'
    case '/whatsapp-bot':
      return 'WhatsApp Bot Config'
    default:
      return 'Smart-presence'
  }
})
</script>

<template>
  <div class="bg-background-cream text-on-background font-body antialiased min-h-screen flex">
    <!-- Sidebar Navigation -->
    <SidebarNav />

    <!-- Main Workspace Container -->
    <main class="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
      <TopAppBar :page-title="getPageTitle" />
      <div class="p-margin-page max-w-container-max-width mx-auto w-full flex-grow flex flex-col gap-stack-lg">
        <slot />
      </div>
    </main>
  </div>
</template>
