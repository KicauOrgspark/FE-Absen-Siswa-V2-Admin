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

export const extractApiErrorMessage = (err: unknown, defaultMessage = 'Terjadi kesalahan pada server.'): string => {
  if (!err) return defaultMessage

  const errorObj = err as {
    message?: string
    status?: number
    statusCode?: number
    data?: { error?: string, message?: string, err?: string }
    response?: { status?: number, _data?: { error?: string, message?: string, err?: string } }
  }

  const status = errorObj?.response?.status || errorObj?.status || errorObj?.statusCode || 500

  const backendMsg = errorObj?.data?.error
    || errorObj?.data?.message
    || errorObj?.data?.err
    || errorObj?.response?._data?.error
    || errorObj?.response?._data?.message
    || errorObj?.response?._data?.err

  const isRawFetchString = (str?: string) => str && (str.startsWith('[POST]') || str.startsWith('[GET]') || str.startsWith('[PUT]') || str.startsWith('[DELETE]'))

  if (backendMsg && !isRawFetchString(backendMsg)) {
    const lower = backendMsg.toLowerCase()
    if (lower.includes('not found user with this nisn') || lower.includes('not found user')) {
      return 'NISN / Username tidak terdaftar di sistem.'
    }
    if (lower.includes('password invalid') || lower.includes('invalid password')) {
      return 'Password yang Anda masukkan salah.'
    }
    if (lower.includes('invalid payload')) {
      return 'Format data yang dikirimkan tidak valid.'
    }
    if (lower.includes('too many failed login attempts') || lower.includes('too many requests')) {
      return 'Terlalu banyak percobaan. Silakan coba lagi nanti.'
    }
    return backendMsg
  }

  switch (status) {
    case 400:
      return 'Data yang dikirimkan tidak sesuai.'
    case 401:
      return 'Sesi telah berakhir atau Anda belum memiliki akses. Silakan login kembali.'
    case 403:
      return 'Anda tidak memiliki hak akses untuk melakukan tindakan ini.'
    case 404:
      return 'Data atau layanan yang diminta tidak ditemukan.'
    case 409:
      return 'Data sudah terdaftar di sistem (misal: NISN atau Username telah digunakan).'
    case 422:
      return 'Format isian form tidak valid.'
    case 429:
      return 'Terlalu banyak permintaan. Silakan tunggu beberapa menit.'
    case 500:
    case 502:
    case 503:
      return 'Terjadi gangguan pada server. Silakan coba lagi nanti.'
    default:
      if (errorObj?.message && !isRawFetchString(errorObj.message)) {
        return errorObj.message
      }
      return defaultMessage
  }
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = (config.public.apiBase as string) || 'https://api.smart-presence.smkpluspnb.sch.id'

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

    if (import.meta.client && options.method && options.method !== 'GET') {
      console.log(`[useApi] ${options.method} ${endpoint} | token terkirim: ${token ? 'YA (' + token.length + ' chars)' : 'TIDAK (kosong)'} | cookie: ${tokenCookie.value ? 'ada' : 'kosong'} | localStorage: ${localStorage.getItem('token') ? 'ada' : 'kosong'}`)
    }

    const MAX_429_RETRIES = 3
    const retryDelay = (attempt: number) => 1000 * 2 ** attempt + Math.random() * 500

    let retryCount = 0

    while (true) {
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

        if (status === 429 && import.meta.client && retryCount < MAX_429_RETRIES) {
          retryCount++
          const delay = retryDelay(retryCount)
          console.warn(`[useApi] Rate limit (429) untuk ${url}, retry ${retryCount}/${MAX_429_RETRIES} dalam ${Math.round(delay)}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        const errMsg = extractApiErrorMessage(err)

        if (status === 204) {
          return { data: null, error: null, status: 204 }
        }

        const hadToken = !!getToken()
        const isAuthError = hadToken && (status === 401 || status === 403)

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

        console.warn(`[useApi] Request failed for ${url}:`, errMsg)
        return {
          data: null,
          error: new Error(errMsg),
          status
        }
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
