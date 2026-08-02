export interface ToastMessage {
  id: string
  message: string
  type: 'error' | 'success' | 'warning' | 'info'
  duration?: number
}

export const useAppToast = () => {
  const toasts = useState<ToastMessage[]>('global_app_toasts', () => [])

  const addToast = (message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const toast: ToastMessage = { id, message, type, duration }
    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const showError = (message: string, duration = 4000) => addToast(message, 'error', duration)
  const showSuccess = (message: string, duration = 3000) => addToast(message, 'success', duration)
  const showWarning = (message: string, duration = 4000) => addToast(message, 'warning', duration)
  const showInfo = (message: string, duration = 3000) => addToast(message, 'info', duration)

  return {
    toasts,
    addToast,
    removeToast,
    showError,
    showSuccess,
    showWarning,
    showInfo
  }
}
