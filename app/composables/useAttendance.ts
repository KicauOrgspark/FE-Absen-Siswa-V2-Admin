export interface Student {
  id: string
  nisn: string
  name: string
  username?: string
  password?: string
  email?: string
  parentName?: string
  parentPhone?: string
  class: string
  major: 'RPL' | 'TKJ' | 'DKV' | 'LPB' | 'TOI' | string
  grade: 'X' | 'XI' | 'XII' | string
  time?: string
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Belum Absen' | string
  role?: 'siswa' | 'admin' | string
  activeStatus: 'AKTIF' | 'PKL' | 'NON AKTIF' | string
  alpaCount: number
  avatarInitials: string
}

export interface WATemplateState {
  automationEnabled: boolean
  activeTab: 'izin' | 'sakit' | 'alfa'
  templates: {
    izin: string
    sakit: string
    alfa: string
  }
}

export interface ClassItem {
  id?: number | string
  name?: string
  class_name?: string
  code?: string
  [key: string]: unknown
}

const initialStudents: Student[] = []

export const normalizeActiveStatus = (st: unknown): string => {
  if (st === undefined || st === null) return 'AKTIF'
  const str = String(st).trim()
  if (!str || str === 'undefined' || str === 'null') return 'AKTIF'
  const lower = str.toLowerCase().replace(/[-_ ]/g, '')
  if (lower === 'pkl') return 'PKL'
  if (lower === 'nonaktif' || lower === 'inactive' || lower === 'non') return 'NON AKTIF'
  if (lower === 'aktif' || lower === 'active') return 'AKTIF'
  return str.toUpperCase()
}

export const normalizeStatus = (st: string): string => {
  if (!st || st === 'undefined' || st === 'null' || st.trim() === '') return 'Hadir'
  const lower = String(st).toLowerCase().trim()
  if (lower === 'hadir') return 'Hadir'
  if (lower === 'sakit') return 'Sakit'
  if (lower === 'izin') return 'Izin'
  if (lower === 'alpa' || lower === 'alfa') return 'Alpa'
  if (lower === 'pkl') return 'PKL'
  if (lower === 'belum_absen' || lower === 'belum absen') return 'Hadir'
  return st
}

const getGradeFromClass = (cls: string): string => {
  if (!cls) return 'X'
  const upper = cls.trim().toUpperCase()
  if (upper.startsWith('XII')) return 'XII'
  if (upper.startsWith('XI')) return 'XI'
  if (upper.startsWith('X')) return 'X'
  return 'X'
}

const getMajorFromClass = (cls: string): string => {
  if (!cls) return 'RPL'
  const upper = cls.trim().toUpperCase()
  if (upper.includes('RPL')) return 'RPL'
  if (upper.includes('TKJ')) return 'TKJ'
  if (upper.includes('DKV')) return 'DKV'
  if (upper.includes('LPB')) return 'LPB'
  if (upper.includes('TOI')) return 'TOI'
  return 'RPL'
}

const extractList = (res: unknown): Record<string, unknown>[] => {
  if (!res) return []
  if (Array.isArray(res)) return res as Record<string, unknown>[]
  const obj = res as Record<string, unknown>
  if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[]
  if (Array.isArray(obj.users)) return obj.users as Record<string, unknown>[]
  if (Array.isArray(obj.students)) return obj.students as Record<string, unknown>[]
  if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[]
  if (Array.isArray(obj.result)) return obj.result as Record<string, unknown>[]
  if (obj.data && typeof obj.data === 'object') {
    const subObj = obj.data as Record<string, unknown>
    if (Array.isArray(subObj.users)) return subObj.users as Record<string, unknown>[]
    if (Array.isArray(subObj.students)) return subObj.students as Record<string, unknown>[]
    if (Array.isArray(subObj.data)) return subObj.data as Record<string, unknown>[]
    if (Array.isArray(subObj.items)) return subObj.items as Record<string, unknown>[]
    if (Array.isArray(subObj.result)) return subObj.result as Record<string, unknown>[]
  }
  return []
}

export const useAttendance = () => {
  const { fetchApi } = useApi()

  const students = useState<Student[]>('students', () => initialStudents)
  const availableClasses = useState<ClassItem[]>('availableClasses', () => [])
  const isFetching = useState<boolean>('isFetchingAttendance', () => false)

  const dashboardMetrics = useState('dashboardMetrics', () => ({
    totalStudents: 0,
    totalAbsenHariIni: 0,
    hadirCount: 0,
    sakitCount: 0,
    alpaCount: 0,
    izinCount: 0
  }))

  const trendData = useState('trendData', () => ({
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    hadir: [0, 0, 0, 0, 0, 0, 0],
    alpa: [0, 0, 0, 0, 0, 0, 0]
  }))

  const waConfig = useState<WATemplateState>('waConfig', () => ({
    automationEnabled: true,
    activeTab: 'izin',
    templates: {
      izin: 'Assalamualaikum, kami menginformasikan bahwa anak Bapak/Ibu *{nama}* (Kelas: {kelas}) hari ini tercatat *Izin*. Terima kasih.',
      sakit: 'Assalamualaikum, kami menginformasikan bahwa anak Bapak/Ibu *{nama}* (Kelas: {kelas}) hari ini tercatat *Sakit*. Semoga lekas sembuh.',
      alfa: 'PEMBERITAHUAN: Siswa *{nama}* (Kelas: {kelas}) tidak hadir tanpa keterangan (*Alfa*) pada hari ini. Mohon konfirmasi ke pihak sekolah.'
    }
  }))

  const qrSession = useState('qrSession', () => ({
    id: '1',
    token: 'TRB-8941-SECURE',
    lastUpdated: '09.35.12',
    countdown: 30,
    isActive: false,
    imageUrl: ''
  }))

  const getInitials = (name: string): string => {
    if (!name) return 'S'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const fetchDashboardStats = async () => {
    const { data } = await fetchApi<Record<string, unknown>>('/api/v1/dashboard')
    if (data) {
      dashboardMetrics.value = {
        totalStudents: Number(data.total_siswa ?? data.total_students ?? dashboardMetrics.value.totalStudents),
        totalAbsenHariIni: Number(data.total_absen_hari_ini ?? data.total_absen ?? 0),
        hadirCount: Number(data.hadir_count ?? data.hadir ?? 0),
        sakitCount: Number(data.sakit_count ?? data.sakit ?? 0),
        alpaCount: Number(data.alpa_count ?? data.alpa ?? 0),
        izinCount: Number(data.izin_count ?? data.izin ?? 0)
      }
    }
  }

  const fetchDashboardTrend = async () => {
    const { data } = await fetchApi<Record<string, unknown>>('/api/v1/dashboard/trend')
    if (data) {
      trendData.value = {
        labels: (data.labels as string[]) || trendData.value.labels,
        hadir: (data.hadir as number[]) || trendData.value.hadir,
        alpa: (data.alpa as number[]) || trendData.value.alpa
      }
    }
  }

  const fetchAttendanceStudents = async (filters?: { class_group?: string, status?: string, angkatan?: string, jurusan?: string }) => {
    isFetching.value = true
    const apiParams = { ...filters }
    if (apiParams.status && apiParams.status.toLowerCase() === 'alpa') {
      apiParams.status = 'alfa'
    } else if (apiParams.status) {
      apiParams.status = apiParams.status.toLowerCase()
    }

    const { data } = await fetchApi<Record<string, unknown>>('/api/v1/attendance/students', { params: apiParams })

    let list = extractList(data)

    // Fallback: if attendance endpoint returns empty, fetch users directly from DB
    if (!list.length) {
      const { data: usersData } = await fetchApi<Record<string, unknown>>('/api/v1/users', {
        params: { limit: 100, role: 'siswa', class_group: filters?.class_group }
      })
      list = extractList(usersData)
    }

    students.value = list.map((item: Record<string, unknown>) => {
      const cls = String(item.class_group || item.class || 'X DKV-1')
      return {
        id: String(item.id || item.user_id || `std-${Math.random()}`),
        nisn: String(item.nisn || item.username || '-'),
        name: String(item.full_name || item.name || 'Siswa'),
        username: String(item.username || ''),
        email: String(item.email || ''),
        parentName: String(item.parent_name || ''),
        parentPhone: String(item.parent_phone || ''),
        class: cls,
        major: String(item.jurusan || item.major || getMajorFromClass(cls)),
        grade: String(item.angkatan || item.grade || getGradeFromClass(cls)),
        time: String(item.time || item.created_at || '07:00'),
        status: normalizeStatus(String(item.attendance_status || item.presensi_status || 'Hadir')),
        activeStatus: normalizeActiveStatus(item.active_status ?? item.status_keaktifan),
        alpaCount: Number(item.alpa_count || item.total_alfa || 0),
        avatarInitials: getInitials(String(item.full_name || item.name || ''))
      }
    })
    isFetching.value = false
  }

  const fetchClassesList = async () => {
    const { data } = await fetchApi<Record<string, unknown>>('/api/v1/classes')
    const list = extractList(data)
    if (list.length) {
      availableClasses.value = list
    }
  }

  const updateStudentStatus = async (studentId: string, status: Student['status']) => {
    const student = students.value.find(s => s.id === studentId)
    if (student) {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      student.status = normalizeStatus(status)
      student.time = status === 'Belum Absen' ? '-' : timeStr

      const apiStatus = status.toLowerCase() === 'alpa' ? 'alfa' : status.toLowerCase()

      const { error: err } = await fetchApi('/api/v1/attendance/status', {
        method: 'PUT',
        body: {
          user_id: Number(studentId) || studentId,
          status: apiStatus
        }
      })

      if (!err) {
        fetchDashboardStats()
      }
    }
  }

  const fetchUsers = async (params: { page?: number, limit?: number, role?: string, class_group?: string, search?: string, status?: string } = {}) => {
    isFetching.value = true
    const { data } = await fetchApi<Record<string, unknown>>('/api/v1/users', {
      params: {
        page: params.page || 1,
        limit: params.limit || 100,
        role: params.role || 'siswa',
        class_group: params.class_group,
        search: params.search,
        status: params.status
      }
    })

    let list = extractList(data)

    // Fallback: If filtering by role='siswa' returns empty, retry without role filter to get DB users
    if (!list.length) {
      const { data: fallbackData } = await fetchApi<Record<string, unknown>>('/api/v1/users', {
        params: {
          page: params.page || 1,
          limit: params.limit || 100,
          class_group: params.class_group,
          search: params.search
        }
      })
      list = extractList(fallbackData)
    }
    isFetching.value = false

    students.value = list.map((u: Record<string, unknown>) => {
      const cls = String(u.class_group || u.class || 'X DKV-1')
      return {
        id: String(u.id),
        nisn: String(u.nisn || u.username || '-'),
        name: String(u.full_name || u.name || 'Siswa'),
        username: String(u.username || ''),
        email: String(u.email || ''),
        parentName: String(u.parent_name || ''),
        parentPhone: String(u.parent_phone || ''),
        class: cls,
        major: String(u.jurusan || getMajorFromClass(cls)),
        grade: String(u.angkatan || getGradeFromClass(cls)),
        time: String(u.created_at || '-'),
        status: normalizeStatus(String(u.attendance_status || u.presensi_status || 'Hadir')),
        role: String(u.role || 'siswa'),
        activeStatus: normalizeActiveStatus(u.status ?? u.status_keaktifan),
        alpaCount: Number(u.alpa_count || 0),
        avatarInitials: getInitials(String(u.full_name || u.name || ''))
      }
    })
    return data
  }

  const addStudent = async (studentData: Omit<Student, 'id' | 'avatarInitials'>) => {
    const payload = {
      nisn: studentData.nisn,
      full_name: studentData.name,
      username: studentData.username || studentData.nisn,
      password: studentData.password || 'password123',
      role: studentData.role || 'siswa',
      class_group: studentData.class,
      parent_phone: studentData.parentPhone || '',
      status: studentData.activeStatus === 'NON AKTIF' ? 'NONAKTIF' : (studentData.activeStatus || 'AKTIF')
    }

    const { data } = await fetchApi('/api/v1/users', {
      method: 'POST',
      body: payload
    })

    if (data) {
      fetchUsers()
    }
  }

  const updateStudent = async (id: string, updatedData: Partial<Student>) => {
    const payload: Record<string, unknown> = {}
    if (updatedData.nisn) payload.nisn = updatedData.nisn
    if (updatedData.name) payload.full_name = updatedData.name
    if (updatedData.username) payload.username = updatedData.username
    if (updatedData.role) payload.role = updatedData.role
    if (updatedData.class) payload.class_group = updatedData.class
    if (updatedData.parentPhone) payload.parent_phone = updatedData.parentPhone
    if (updatedData.activeStatus) {
      payload.status = updatedData.activeStatus === 'NON AKTIF' ? 'NONAKTIF' : updatedData.activeStatus
    }

    const { data } = await fetchApi(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: payload
    })

    if (data) {
      fetchUsers()
    }
  }

  const deleteStudent = async (id: string) => {
    let { status, error } = await fetchApi(`/api/v1/users/${id}`, {
      method: 'DELETE'
    })

    const isMissingAuth = status === 401 && String(error?.message || '').toLowerCase().includes('missing authorization header')

    // Token ada di browser tapi header tidak ikut terkirim - retry sekali
    if (isMissingAuth && import.meta.client && localStorage.getItem('token')) {
      console.warn('[deleteStudent] Header auth tidak terkirim, retry...')
      const retry = await fetchApi(`/api/v1/users/${id}`, {
        method: 'DELETE'
      })
      status = retry.status
      error = retry.error
    }

    const isSuccess = !error || (status >= 200 && status < 300)

    if (isSuccess) {
      students.value = students.value.filter(s => s.id !== id)
      await fetchUsers()
    } else {
      console.warn('[deleteStudent] Gagal menghapus user:', error?.message || status)
    }
    return { status, error }
  }

  const resetStudentPassword = async (id: string, newPassword: string) => {
    return await fetchApi(`/api/v1/users/${id}/reset-password`, {
      method: 'POST',
      body: { new_password: newPassword }
    })
  }

  const importUsersExcel = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return await fetchApi('/api/v1/import/users', {
      method: 'POST',
      body: formData,
      isFormData: true
    })
  }

  const stats = computed(() => {
    const totalAbsenHariIni = students.value.filter(s => s.status?.toLowerCase() !== 'belum absen' && s.status?.toLowerCase() !== 'belum_absen').length
    const hadir = students.value.filter(s => s.status?.toLowerCase() === 'hadir').length
    const sakit = students.value.filter(s => s.status?.toLowerCase() === 'sakit').length
    const alpa = students.value.filter(s => s.status?.toLowerCase() === 'alpa' || s.status?.toLowerCase() === 'alfa').length

    return {
      totalStudents: dashboardMetrics.value.totalStudents || students.value.length,
      totalAbsenHariIni: dashboardMetrics.value.totalAbsenHariIni || totalAbsenHariIni,
      hadirCount: dashboardMetrics.value.hadirCount || hadir,
      sakitCount: dashboardMetrics.value.sakitCount || sakit,
      alpaCount: dashboardMetrics.value.alpaCount || alpa
    }
  })

  const departmentStats = computed(() => {
    const majors: Array<'RPL' | 'TKJ' | 'DKV' | 'LPB' | 'TOI'> = ['RPL', 'TKJ', 'DKV', 'LPB', 'TOI']
    return majors.map((m) => {
      const list = students.value.filter(s => s.major === m)
      if (!list.length) return { major: m, percentage: 0 }
      const present = list.filter(s => s.status?.toLowerCase() === 'hadir').length
      const percentage = Math.round((present / list.length) * 100)
      return { major: m, percentage }
    })
  })

  const topAbsents = computed(() => {
    return [...students.value]
      .sort((a, b) => b.alpaCount - a.alpaCount)
      .slice(0, 10)
  })

  const refreshQRToken = () => {
    const randomCode = 'TRB-' + Math.floor(1000 + Math.random() * 9000) + '-SECURE'
    const now = new Date()
    const timeStr = now.toTimeString().split(' ')[0]
    qrSession.value = {
      ...qrSession.value,
      token: randomCode,
      lastUpdated: timeStr,
      countdown: 30
    }
  }

  const toggleQRActive = () => {
    qrSession.value.isActive = !qrSession.value.isActive
  }

  return {
    students,
    availableClasses,
    dashboardMetrics,
    trendData,
    waConfig,
    qrSession,
    isFetching,
    stats,
    departmentStats,
    topAbsents,
    fetchDashboardStats,
    fetchDashboardTrend,
    fetchAttendanceStudents,
    fetchClassesList,
    fetchUsers,
    updateStudentStatus,
    addStudent,
    updateStudent,
    deleteStudent,
    resetStudentPassword,
    importUsersExcel,
    refreshQRToken,
    toggleQRActive
  }
}
