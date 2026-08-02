<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  title?: string
  message?: string
  confirmText?: string
  confirmLabel?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  confirmVariant?: 'danger' | 'warning' | 'info'
}>()

const emit = defineEmits<{
  (e: 'confirm' | 'cancel'): void
}>()

const activeVariant = computed(() => props.variant || props.confirmVariant || 'danger')
const activeConfirmText = computed(() => props.confirmText || props.confirmLabel || 'Konfirmasi')

const variantConfig = computed(() => {
  switch (activeVariant.value) {
    case 'warning':
      return {
        icon: 'warning',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        btnClass: 'bg-amber-600 hover:bg-amber-700'
      }
    case 'info':
      return {
        icon: 'info',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        btnClass: 'bg-blue-600 hover:bg-blue-700'
      }
    case 'danger':
    default:
      return {
        icon: 'delete_forever',
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
        btnClass: 'bg-rose-600 hover:bg-rose-700'
      }
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-xs"
          @click="emit('cancel')"
        />

        <!-- Dialog Box -->
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
          appear
        >
          <div class="relative bg-surface-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-surface-container-highest">
            <!-- Top Accent Bar -->
            <div
              class="h-1"
              :class="variant === 'warning' ? 'bg-amber-500' : variant === 'info' ? 'bg-blue-500' : 'bg-rose-500'"
            />

            <div class="p-6 text-center">
              <!-- Icon -->
              <div
                class="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                :class="variantConfig.iconBg"
              >
                <span
                  class="material-symbols-outlined text-3xl"
                  :class="variantConfig.iconColor"
                >
                  {{ variantConfig.icon }}
                </span>
              </div>

              <!-- Title -->
              <h3 class="font-headline text-headline-sm font-bold text-on-surface mb-2">
                {{ title || 'Konfirmasi Tindakan' }}
              </h3>

              <!-- Message -->
              <p class="font-body text-body-md text-secondary leading-relaxed">
                {{ message || 'Apakah Anda yakin ingin melanjutkan tindakan ini?' }}
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="px-6 pb-6 flex items-center gap-3">
              <button
                type="button"
                class="flex-1 px-5 py-2.5 border border-surface-container-highest rounded-xl font-label text-label-lg text-secondary hover:bg-surface-container-low transition-colors"
                @click="emit('cancel')"
              >
                {{ cancelText || 'Batal' }}
              </button>
              <button
                type="button"
                class="flex-1 px-5 py-2.5 text-white font-label text-label-lg font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                :class="variantConfig.btnClass"
                @click="emit('confirm')"
              >
                <span class="material-symbols-outlined text-lg">{{ variantConfig.icon }}</span>
                {{ activeConfirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
