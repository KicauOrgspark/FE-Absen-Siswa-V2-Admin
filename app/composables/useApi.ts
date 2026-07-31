export const buildApiUrl = (base: string, path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  let normalizedBase = base.trim().replace(/\/$/, '')
  if (!normalizedBase.startsWith('http://') && !normalizedBase.startsWith('https://')) {
    normalizedBase = `https://${normalizedBase}`
  }

  let normalizedPath = path.trim()
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`
  }

  if (normalizedBase.endsWith('/api/v1')) {
    if (normalizedPath.startsWith('/api/v1/')) {
      normalizedPath = normalizedPath.substring(7)
    } else if (normalizedPath === '/api/v1') {
      normalizedPath = ''
    }
  } else {
    if (!normalizedPath.startsWith('/api/v1/') && normalizedPath !== '/api/v1') {
      normalizedPath = `/api/v1${normalizedPath}`
    }
  }

  return `${normalizedBase}${normalizedPath}`
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = (config.public.apiBase as string) || 'https://api.smart-presence.smkpluspnb.sch.id'

  const getToken = (): string => {
    const tokenCookie = useCookie<string>('auth_token')
    if (tokenCookie.value) return tokenCookie.value

    if (import.meta.client) {
      const storedToken = localStorage.getItem('token')
      if (storedToken) return storedToken
    }
    return ''
  }

  const fetchApi = async <T = unknown>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
      params?: Record<string, unknown>
      body?: unknown
      headers?: Record<string, string>
      isFormData?: boolean
    } = {}
  ): Promise<{ data: T | null, error: Error | null, status: number }> => {
    const token = getToken()
    const url = buildApiUrl(apiBase, endpoint)

    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }

    if (!options.isFormData && options.method && options.method !== 'GET') {
      headers['Content-Type'] = 'application/json'
    }

    try {
      const res = await $fetch<T>(url, {
        method: options.method || 'GET',
        query: options.params as Record<string, string | number | boolean>,
        body: options.isFormData ? (options.body as BodyInit) : (options.body ? JSON.stringify(options.body) : undefined),
        headers
      })

      return { data: res, error: null, status: 200 }
    } catch (err: unknown) {
      const errorObj = err as { message?: string, response?: { status?: number }, status?: number, statusCode?: number }
      const status = errorObj?.response?.status || errorObj?.status || errorObj?.statusCode || 500

      if (status === 401 && import.meta.client) {
        const tokenCookie = useCookie<string | null>('auth_token')
        tokenCookie.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        const router = useRouter()
        if (router.currentRoute.value.path !== '/login') {
          router.push('/login')
        }
      }

      console.warn(`[useApi] Request failed for ${url}:`, errorObj?.message || err)
      return {
        data: null,
        error: err instanceof Error ? err : new Error(errorObj?.message || 'API request failed'),
        status
      }
    }
  }

  const getExportUrl = (endpoint: string, params: Record<string, unknown> = {}): string => {
    const fullUrl = buildApiUrl(apiBase, endpoint)
    const query = new URLSearchParams()

    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val))
      }
    })

    const queryString = query.toString()
    return `${fullUrl}${queryString ? '?' + queryString : ''}`
  }

  return {
    apiBase,
    getToken,
    fetchApi,
    getExportUrl
  }
}
