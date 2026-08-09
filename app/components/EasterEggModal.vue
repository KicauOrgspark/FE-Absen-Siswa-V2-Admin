<script setup lang="ts">
const isOpen = useState('easterEggOpen', () => false)

const developers = [
  { name: 'Muhamad Fauzan Pratama', role: 'Full Stack Developer', icon: 'code', color: 'from-purple-500 to-indigo-600' },
  { name: 'Raihan Aditiya', role: 'Sysadmin & Backend Engineer', icon: 'terminal', color: 'from-blue-500 to-teal-600' },
  { name: 'Alvin Rizky', role: 'UI/UX & Frontend Engineer', icon: 'palette', color: 'from-emerald-500 to-pink-600' }
]

const closeModal = () => {
  isOpen.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="easter-egg-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        @click.self="closeModal"
      >
        <div class="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden text-white animate-easter-egg-pop">
          <!-- Background Glow Effect -->
          <div class="absolute -top-24 -left-24 w-48 h-48 bg-primary/30 rounded-full blur-3xl pointer-events-none" />
          <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />

          <!-- Close Button -->
          <button
            class="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full transition-colors flex items-center justify-center"
            title="Tutup Modal"
            @click="closeModal"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>

          <!-- Header -->
          <div class="text-center mb-6 pt-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-mono font-bold mb-3">
              <span class="material-symbols-outlined text-[16px] animate-bounce">auto_awesome</span>
              DEVELOPER CREDITS
            </div>
            <h3 class="text-2xl font-bold tracking-tight text-white font-headline">
              Behind The Presence
            </h3>
            <p class="text-slate-400 text-xs mt-1">
              Tim Pengembang & Kreator Smart-Presence V2
            </p>
          </div>

          <!-- Developers Cards -->
          <div class="space-y-3">
            <div
              v-for="dev in developers"
              :key="dev.name"
              class="group flex items-center gap-4 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-500 transition-all hover:translate-x-1"
            >
              <div
                class="w-11 h-11 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-md"
                :class="dev.color"
              >
                <span class="material-symbols-outlined text-[22px]">{{ dev.icon }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-sm text-white group-hover:text-primary transition-colors truncate">
                  {{ dev.name }}
                </h4>
                <p class="text-slate-400 text-xs font-mono">
                  {{ dev.role }}
                </p>
              </div>
              <span class="material-symbols-outlined text-slate-500 group-hover:text-primary text-[18px] transition-colors">verified</span>
            </div>
          </div>

          <!-- Footer Badge -->
          <div class="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>SMK PLUS PERBANI</span>
            <button
              class="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              @click="closeModal"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.easter-egg-fade-enter-active,
.easter-egg-fade-leave-active {
  transition: opacity 0.25s ease;
}

.easter-egg-fade-enter-from,
.easter-egg-fade-leave-to {
  opacity: 0;
}

@keyframes easterEggPop {
  0% {
    transform: scale(0.9) translateY(10px);
    opacity: 0;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.animate-easter-egg-pop {
  animation: easterEggPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
