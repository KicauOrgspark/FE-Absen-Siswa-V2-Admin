export interface User {
  id?: string | number
  nisn?: string
  username?: string
  email?: string
  full_name?: string
  name?: string
  role?: string
  class_group?: string
  avatar?: string
}

interface ApiResponseData {
  id?: string | number
  nisn?: string
  username?: string
  email?: string
  full_name?: string
  name?: string
  role?: string
  access_token?: string
  token?: string
  user?: ApiResponseData
  data?: ApiResponseData
  message?: string
}

export function useAuth() {
  const config = useRuntimeConfig()
  const rawApiBase = (config.public.apiBase as string) || 'https://api.smart-presence.smkpluspnb.sch.id'
  const apiBase = rawApiBase.replace(/\/$/, '')

  const token = useCookie<string | null>('auth_token', { default: () => null, maxAge: 60 * 60 * 24 * 7 })
  const user = useCookie<User | null>('auth_user', { default: () => null, maxAge: 60 * 60 * 24 * 7 })

  const isAuthenticated = computed(() => {
    if (token.value) return true
    if (import.meta.client && localStorage.getItem('token')) return true
    return false
  })

  async function login(identifier: string, pass: string): Promise<{ success: boolean, message?: string }> {
    if (!identifier || !pass) {
      return { success: false, message: 'Username / NISN dan Password wajib diisi!' }
    }

    try {
      const response = await $fetch<ApiResponseData>(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          nisn: identifier,
          password: pass
        }
      })

      const accessToken = response?.access_token || response?.data?.access_token || response?.token || response?.data?.token

      if (accessToken) {
        const cleanToken = String(accessToken).replace(/^["']|["']$/g, '').trim()
        token.value = cleanToken
        if (import.meta.client) {
          localStorage.setItem('token', cleanToken)
        }

        const userData = response?.user || response?.data?.user || response?.data

        try {
          const profile = await $fetch<ApiResponseData>(`${apiBase}/api/v1/auth/me`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          })
          const profileData = profile?.data || profile
          const resolvedUser: User = {
            id: profileData.id || userData?.id,
            username: profileData.username || userData?.username || identifier,
            nisn: profileData.nisn || userData?.nisn || identifier,
            email: profileData.email || userData?.email,
            full_name: profileData.full_name || profileData.name || userData?.full_name || userData?.name || 'Administrator',
            role: profileData.role || userData?.role || 'admin',
            avatar: profileData.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPwpfoTK-9UMzYf3hIdUlhE443HLrWv6hm8hZpc1zd0G8MzKVjMOTwMvQCKGMExziHegaKIb0SkzrOd2-6Qfbu6MWFLbL23UAppwTlcFfnu4r-brXBwEv9W-_oO_ao6jnHwmRj7d-u3lW1a6HstMqmeSBTVXlsqTboju8zWkMQKKU98vMcIVk6XBjfJzihE-XBKSJcp4nkCkVNPv7a5kMbwev6fIJljJSSbRVCIwkBeM77sENPYIFRAQ'
          }
          user.value = resolvedUser
          if (import.meta.client) {
            localStorage.setItem('user', JSON.stringify(resolvedUser))
          }
        } catch {
          const resolvedUser: User = {
            id: userData?.id,
            username: userData?.username || identifier,
            nisn: userData?.nisn || identifier,
            full_name: userData?.full_name || userData?.name || 'Administrator',
            role: userData?.role || 'admin',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPwpfoTK-9UMzYf3hIdUlhE443HLrWv6hm8hZpc1zd0G8MzKVjMOTwMvQCKGMExziHegaKIb0SkzrOd2-6Qfbu6MWFLbL23UAppwTlcFfnu4r-brXBwEv9W-_oO_ao6jnHwmRj7d-u3lW1a6HstMqmeSBTVXlsqTboju8zWkMQKKU98vMcIVk6XBjfJzihE-XBKSJcp4nkCkVNPv7a5kMbwev6fIJljJSSbRVCIwkBeM77sENPYIFRAQ'
          }
          user.value = resolvedUser
          if (import.meta.client) {
            localStorage.setItem('user', JSON.stringify(resolvedUser))
          }
        }

        return { success: true }
      } else {
        return { success: false, message: response?.message || 'Login gagal. Token tidak ditemukan.' }
      }
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }, response?: { _data?: { message?: string } }, message?: string }
      const errMsg = errorObj?.data?.message || errorObj?.response?._data?.message || errorObj?.message || 'Login gagal. Periksa Username / NISN dan Password Anda.'
      return { success: false, message: errMsg }
    }
  }

  async function fetchProfile(): Promise<boolean> {
    const activeToken = token.value || (import.meta.client ? localStorage.getItem('token') : null)
    if (!activeToken) return false

    try {
      const profile = await $fetch<ApiResponseData>(`${apiBase}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      })
      const profileData = profile?.data || profile
      if (profileData && (profileData.username || profileData.id || profileData.full_name || profileData.name)) {
        const resolvedUser: User = {
          id: profileData.id || user.value?.id,
          username: profileData.username || user.value?.username || '',
          nisn: profileData.nisn || user.value?.nisn,
          email: profileData.email || user.value?.email,
          full_name: profileData.full_name || profileData.name || user.value?.full_name || 'Administrator',
          role: profileData.role || user.value?.role || 'admin',
          avatar: profileData.avatar || user.value?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPwpfoTK-9UMzYf3hIdUlhE443HLrWv6hm8hZpc1zd0G8MzKVjMOTwMvQCKGMExziHegaKIb0SkzrOd2-6Qfbu6MWFLbL23UAppwTlcFfnu4r-brXBwEv9W-_oO_ao6jnHwmRj7d-u3lW1a6HstMqmeSBTVXlsqTboju8zWkMQKKU98vMcIVk6XBjfJzihE-XBKSJcp4nkCkVNPv7a5kMbwev6fIJljJSSbRVCIwkBeM77sENPYIFRAQ'
        }
        user.value = resolvedUser
        if (import.meta.client) {
          localStorage.setItem('user', JSON.stringify(resolvedUser))
        }
      }
      return true
    } catch (err: unknown) {
      const errorObj = err as { status?: number, statusCode?: number, response?: { status?: number } }
      const status = errorObj?.status || errorObj?.statusCode || errorObj?.response?.status
      if (status === 401 || status === 403) {
        logout()
        return false
      }
      return true
    }
  }

  function logout() {
    token.value = null
    user.value = null
    if (import.meta.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    const router = useRouter()
    router.push('/login')
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    fetchProfile,
    logout
  }
}
