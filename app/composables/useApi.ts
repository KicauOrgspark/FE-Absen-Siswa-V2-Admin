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

  // Use a single shared cookie ref for the token
  const tokenCookie = useCookie<string | null>('auth_token')

  const getToken = (): string => {
    let t = tokenCookie.value || ''
    if (!t && import.meta.client) {
      t = localStorage.getItem('token') || ''
      if (t) {
        tokenCookie.value = t
      }
    }
    if (t) {
      t = t.replace(/^["']|["']$/g, '').trim()
    }
    return t
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
      const errorObj = err as {
        message?: string
        status?: number
        statusCode?: number
        data?: { error?: string, message?: string }
        response?: { status?: number, _data?: { error?: string, message?: string } }
      }
      const status = errorObj?.response?.status || errorObj?.status || errorObj?.statusCode || 500
      const errMsg = errorObj?.data?.error || errorObj?.data?.message || errorObj?.response?._data?.error || errorObj?.response?._data?.message || errorObj?.message || ''

      const isAuthError = status === 401 || status === 403 || String(errMsg).toLowerCase().includes('authorization') || String(errMsg).toLowerCase().includes('unauthorized')

      // On 401/403 or missing authorization header, clear auth and redirect to login
      if (isAuthError && import.meta.client) {
        tokenCookie.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        const currentPath = window.location.pathname
        if (currentPath !== '/login') {
          window.location.href = '/login'
          return {
            data: null,
            error: new Error('missing authorization header'),
            status: 401
          }
        }
      }

      console.warn(`[useApi] Request failed for ${url}:`, errMsg || err)
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(errMsg || 'API request failed')),
        status
      }
    }
  }

  const getExportUrl = (endpoint: string, params: Record<string, unknown> = {}): string => {
    const fullUrl = buildApiUrl(apiBase, endpoint)
    const query = new URLSearchParams()
    const token = getToken()

    if (token && !params.token && !params.access_token) {
      query.append('token', token)
    }

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
