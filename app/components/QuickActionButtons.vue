<script setup lang="ts">
const props = defineProps<{
  currentStatus: string
}>()

const emit = defineEmits<{
  (e: 'updateStatus', status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa'): void
}>()

const isHadir = computed(() => props.currentStatus?.toLowerCase() === 'hadir')
const isIzin = computed(() => props.currentStatus?.toLowerCase() === 'izin')
const isSakit = computed(() => props.currentStatus?.toLowerCase() === 'sakit')
const isAlpa = computed(() => props.currentStatus?.toLowerCase() === 'alpa' || props.currentStatus?.toLowerCase() === 'alfa')
</script>

<template>
  <div class="flex items-center justify-center gap-1.5">
    <!-- Hadir (H) -->
    <button
      class="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all duration-200 active:scale-90"
      :class="[
        isHadir
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
        isIzin
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
        isSakit
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
        isAlpa
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
