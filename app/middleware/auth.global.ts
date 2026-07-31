export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()

  const isPublicPage = to.path === '/login'

  if (!isAuthenticated.value && !isPublicPage) {
    return navigateTo('/login')
  }

  if (isAuthenticated.value && to.path === '/login') {
    return navigateTo('/')
  }
})
