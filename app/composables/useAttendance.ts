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

export const normalizeStatus = (st: string): string => {
  if (!st) return 'Belum Absen'
  const lower = String(st).toLowerCase().trim()
  if (lower === 'hadir') return 'Hadir'
  if (lower === 'sakit') return 'Sakit'
  if (lower === 'izin') return 'Izin'
  if (lower === 'alpa' || lower === 'alfa') return 'Alpa'
  if (lower === 'pkl') return 'PKL'
  if (lower === 'aktif' || lower === 'active') return 'AKTIF'
  if (lower === 'non_aktif' || lower === 'non-aktif' || lower === 'non aktif' || lower === 'inactive') return 'NON AKTIF'
  if (lower === 'belum_absen' || lower === 'belum absen') return 'Belum Absen'
  return st
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
    isFetching.value = false

    const list = extractList(data)
    students.value = list.map((item: Record<string, unknown>) => ({
      id: String(item.id || item.user_id || `std-${Math.random()}`),
      nisn: String(item.nisn || item.username || '-'),
      name: String(item.full_name || item.name || 'Siswa'),
      username: String(item.username || ''),
      email: String(item.email || ''),
      parentName: String(item.parent_name || ''),
      parentPhone: String(item.parent_phone || ''),
      class: String(item.class_group || item.class || 'X DKV-1'),
      major: String(item.jurusan || item.major || (String(item.class_group || '').split(' ')?.[1]) || 'DKV'),
      grade: String(item.angkatan || item.grade || (String(item.class_group || '').split(' ')?.[0]) || 'X'),
      time: String(item.time || item.created_at || '-'),
      status: normalizeStatus(String(item.status || 'Belum Absen')),
      activeStatus: normalizeStatus(String(item.active_status || item.role || 'AKTIF')),
      alpaCount: Number(item.alpa_count || item.total_alfa || 0),
      avatarInitials: getInitials(String(item.full_name || item.name || ''))
    }))
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

  const fetchUsers = async (params: { page?: number, limit?: number, role?: string, class_group?: string, search?: string } = {}) => {
    isFetching.value = true
    const { data } = await fetchApi<Record<string, unknown>>('/api/v1/users', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        role: params.role || 'siswa',
        class_group: params.class_group,
        search: params.search
      }
    })
    isFetching.value = false

    const list = extractList(data)
    students.value = list.map((u: Record<string, unknown>) => ({
      id: String(u.id),
      nisn: String(u.nisn || u.username || '-'),
      name: String(u.full_name || u.name || 'Siswa'),
      username: String(u.username || ''),
      email: String(u.email || ''),
      parentName: String(u.parent_name || ''),
      parentPhone: String(u.parent_phone || ''),
      class: String(u.class_group || u.class || 'X DKV-1'),
      major: String(u.jurusan || (String(u.class_group || '').split(' ')?.[1]) || 'DKV'),
      grade: String(u.angkatan || (String(u.class_group || '').split(' ')?.[0]) || 'X'),
      time: String(u.created_at || '-'),
      status: normalizeStatus(String(u.status || 'Belum Absen')),
      activeStatus: normalizeStatus(String(u.active_status || 'AKTIF')),
      alpaCount: Number(u.alpa_count || 0),
      avatarInitials: getInitials(String(u.full_name || u.name || ''))
    }))
    return data
  }

  const addStudent = async (studentData: Omit<Student, 'id' | 'avatarInitials'>) => {
    const payload = {
      nisn: studentData.nisn,
      full_name: studentData.name,
      username: studentData.username || studentData.nisn,
      password: studentData.password || 'password123',
      role: 'siswa',
      class_group: studentData.class,
      parent_phone: studentData.parentPhone || ''
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
    if (updatedData.class) payload.class_group = updatedData.class
    if (updatedData.parentPhone) payload.parent_phone = updatedData.parentPhone

    const { data } = await fetchApi(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: payload
    })

    if (data) {
      fetchUsers()
    }
  }

  const deleteStudent = async (id: string) => {
    const { status } = await fetchApi(`/api/v1/users/${id}`, {
      method: 'DELETE'
    })

    if (status === 200) {
      fetchUsers()
    } else {
      students.value = students.value.filter(s => s.id !== id)
    }
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
