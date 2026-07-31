<script setup lang="ts">
defineProps<{
  currentStatus: string
}>()

const emit = defineEmits<{
  (e: 'updateStatus', status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa'): void
}>()
</script>

<template>
  <div class="flex items-center justify-center gap-1.5">
    <!-- Hadir (H) -->
    <button
      class="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all duration-200 active:scale-90"
      :class="[
        currentStatus === 'Hadir'
          ? 'bg-[#00875a] text-white shadow-sm'
          : 'bg-surface-container-highest hover:bg-[#00875a]/20 text-secondary hover:text-[#00875a]'
      ]"
      title="Tandai Hadir"
      @click="emit('updateStatus', 'Hadir')"
    >
      H
    </button>

    <!-- Izin (I) -->
    <button
      class="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all duration-200 active:scale-90"
      :class="[
        currentStatus === 'Izin'
          ? 'bg-amber-600 text-white shadow-sm'
          : 'bg-surface-container-highest hover:bg-amber-600/20 text-secondary hover:text-amber-700'
      ]"
      title="Tandai Izin"
      @click="emit('updateStatus', 'Izin')"
    >
      I
    </button>

    <!-- Sakit (S) -->
    <button
      class="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all duration-200 active:scale-90"
      :class="[
        currentStatus === 'Sakit'
          ? 'bg-secondary text-white shadow-sm'
          : 'bg-surface-container-highest hover:bg-secondary/20 text-secondary hover:text-deep-black'
      ]"
      title="Tandai Sakit"
      @click="emit('updateStatus', 'Sakit')"
    >
      S
    </button>

    <!-- Alpa (A) -->
    <button
      class="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all duration-200 active:scale-90"
      :class="[
        currentStatus === 'Alpa'
          ? 'bg-[#de350b] text-white shadow-sm'
          : 'bg-surface-container-highest hover:bg-[#de350b]/20 text-secondary hover:text-[#de350b]'
      ]"
      title="Tandai Alpa"
      @click="emit('updateStatus', 'Alpa')"
    >
      A
    </button>
  </div>
</template>
