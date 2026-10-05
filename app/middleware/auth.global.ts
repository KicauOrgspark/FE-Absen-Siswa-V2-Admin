export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, isReadOnly } = useAuth()

  const isPublicPage = to.path === '/login'

  if (!isAuthenticated.value && !isPublicPage) {
    return navigateTo('/login')
  }

  if (isAuthenticated.value && to.path === '/login') {
    return navigateTo('/')
  }

  // ws tidak punya akses ke halaman WhatsApp Bot
  if (isReadOnly.value && to.path.startsWith('/whatsapp-bot')) {
    return navigateTo('/')
  }
})
