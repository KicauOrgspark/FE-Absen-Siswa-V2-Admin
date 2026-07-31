<script setup lang="ts">
const props = defineProps<{
  status: 'Hadir' | 'Sakit' | 'Alpa' | 'Belum Absen' | 'Active' | 'Inactive' | string
}>()

const badgeClasses = computed(() => {
  switch (props.status) {
    case 'Hadir':
    case 'Active':
    case 'AKTIF':
      return 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant border border-tertiary-fixed-dim/30 font-bold'
    case 'PKL':
      return 'bg-purple-100 text-purple-900 border border-purple-300/80 font-bold'
    case 'Sakit':
      return 'bg-secondary-container text-on-secondary-container border border-outline-variant/40'
    case 'Izin':
      return 'bg-amber-100 text-amber-900 border border-amber-300/60'
    case 'Alpa':
      return 'bg-error-container text-on-error-container border border-error-container'
    case 'Belum Absen':
    case 'Inactive':
    case 'Non-Aktif':
    case 'NON AKTIF':
    default:
      return 'bg-surface-container-highest text-secondary border border-surface-container-highest'
  }
})

const dotColor = computed(() => {
  switch (props.status) {
    case 'Hadir':
    case 'Active':
    case 'AKTIF':
      return 'bg-tertiary-fixed-dim'
    case 'PKL':
      return 'bg-purple-600'
    case 'Sakit':
      return 'bg-secondary'
    case 'Izin':
      return 'bg-amber-600'
    case 'Alpa':
      return 'bg-error'
    case 'Belum Absen':
    case 'Inactive':
    case 'Non-Aktif':
    case 'NON AKTIF':
    default:
      return 'bg-muted-text'
  }
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label text-xs font-medium"
    :class="badgeClasses"
  >
    <span class="w-1.5 h-1.5 rounded-full block shrink-0" :class="dotColor"></span>
    <span>{{ status }}</span>
  </span>
</template>
