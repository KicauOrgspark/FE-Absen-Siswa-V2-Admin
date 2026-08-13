<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  icon: string
  accentColor?: 'green' | 'red' | 'default'
  subBadges?: Array<{ text: string, color: string }>
}>()
</script>

<template>
  <div class="bg-surface-white border border-surface-container-highest rounded-lg p-4 md:p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
    <!-- Accent Bar -->
    <div
      v-if="accentColor === 'green'"
      class="absolute top-0 left-0 w-full h-1 bg-[#00875a]"
    />
    <div
      v-else-if="accentColor === 'red'"
      class="absolute top-0 left-0 w-full h-1 bg-[#de350b]"
    />

    <!-- Header -->
    <div class="flex justify-between items-center mb-3 md:mb-6 z-10">
      <span class="font-label text-[10px] md:text-[11px] text-secondary font-bold uppercase tracking-widest leading-tight">{{ title }}</span>
      <span
        class="material-symbols-outlined text-[18px] md:text-[20px]"
        :class="[
          accentColor === 'green' ? 'text-[#00875a]' : '',
          accentColor === 'red' ? 'text-[#de350b]' : '',
          !accentColor || accentColor === 'default' ? 'text-secondary/40' : ''
        ]"
      >
        {{ icon }}
      </span>
    </div>

    <!-- Value & Subtext -->
    <div class="flex justify-between items-end z-10">
      <div class="font-headline text-[24px] md:text-[32px] text-deep-black font-bold leading-none">
        {{ value }}
      </div>
      <div
        v-if="subBadges && subBadges.length"
        class="text-right flex flex-col gap-0.5"
      >
        <p
          v-for="(badge, index) in subBadges"
          :key="index"
          class="font-label text-[9px] md:text-[11px] font-bold"
          :style="{ color: badge.color }"
        >
          {{ badge.text }}
        </p>
      </div>
    </div>
  </div>
</template>
