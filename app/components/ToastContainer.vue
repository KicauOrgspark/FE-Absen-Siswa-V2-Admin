<script setup lang="ts">
const { toasts, removeToast } = useAppToast()

const getIcon = (type?: string) => {
  switch (type) {
    case 'success':
      return 'check_circle'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    case 'error':
    default:
      return 'error'
  }
}

const getStyles = (type?: string) => {
  switch (type) {
    case 'success':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    case 'warning':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'info':
      return 'bg-blue-50 text-blue-800 border-blue-200'
    case 'error':
    default:
      return 'bg-rose-50 text-rose-800 border-rose-200'
  }
}

const getIconColor = (type?: string) => {
  switch (type) {
    case 'success':
      return 'text-emerald-600'
    case 'warning':
      return 'text-amber-600'
    case 'info':
      return 'text-blue-600'
    case 'error':
    default:
      return 'text-rose-600'
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <TransitionGroup
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-4"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-sm transition-all duration-200"
          :class="getStyles(toast.type)"
        >
          <span
            class="material-symbols-outlined text-[22px] shrink-0 mt-0.5"
            :class="getIconColor(toast.type)"
          >
            {{ getIcon(toast.type) }}
          </span>
          <div class="flex-1 text-xs sm:text-sm font-medium leading-snug">
            {{ toast.message }}
          </div>
          <button
            class="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5"
            @click="removeToast(toast.id)"
          >
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
