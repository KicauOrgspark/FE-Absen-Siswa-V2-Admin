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
  major: 'RPL' | 'TKJ' | 'DKV' | 'LPB' | 'TOI'
  grade: 'X' | 'XI' | 'XII'
  time?: string
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Belum Absen'
  activeStatus: 'AKTIF' | 'PKL' | 'NON AKTIF'
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

const initialStudents: Student[] = [
  {
    id: 'std-1',
    nisn: '26271007190',
    name: 'Adli Firdaus',
    email: 'adli.firdaus@student.pelitanusantara.sch.id',
    parentPhone: '081287654321',
    class: 'X DKV-1',
    major: 'DKV',
    grade: 'X',
    time: '-',
    status: 'Belum Absen',
    activeStatus: 'AKTIF',
    alpaCount: 0,
    avatarInitials: 'AF'
  },
  {
    id: 'std-2',
    nisn: '26271007217',
    name: 'Ananda Rama Saputra',
    email: 'ananda.rama@student.pelitanusantara.sch.id',
    parentPhone: '081398765432',
    class: 'X DKV-1',
    major: 'DKV',
    grade: 'X',
    time: '-',
    status: 'Belum Absen',
    activeStatus: 'AKTIF',
    alpaCount: 1,
    avatarInitials: 'AR'
  },
  {
    id: 'std-3',
    nisn: '26271007277',
    name: 'Andira Khalis Ady Pratama',
    email: 'andira.khalis@student.pelitanusantara.sch.id',
    parentPhone: '085712345678',
    class: 'X DKV-1',
    major: 'DKV',
    grade: 'X',
    time: '-',
    status: 'Belum Absen',
    activeStatus: 'AKTIF',
    alpaCount: 0,
    avatarInitials: 'AK'
  },
  {
    id: 'std-4',
    nisn: '26271007296',
    name: 'Berry Wisnu Wardana',
    email: 'berry.wisnu@student.pelitanusantara.sch.id',
    parentPhone: '081299887766',
    class: 'X DKV-1',
    major: 'DKV',
    grade: 'X',
    time: '-',
    status: 'Belum Absen',
    activeStatus: 'AKTIF',
    alpaCount: 2,
    avatarInitials: 'BW'
  },
  {
    id: 'std-5',
    nisn: '26271007108',
    name: 'Cindy Cantika Dewi',
    email: 'cindy.cantika@student.pelitanusantara.sch.id',
    parentPhone: '081311223344',
    class: 'X DKV-1',
    major: 'DKV',
    grade: 'X',
    time: '-',
    status: 'Belum Absen',
    activeStatus: 'AKTIF',
    alpaCount: 0,
    avatarInitials: 'CC'
  },
  {
    id: 'std-6',
    nisn: '26271007245',
    name: 'Dhava Nur Rahman',
    email: 'dhava.nur@student.pelitanusantara.sch.id',
    parentPhone: '085644556677',
    class: 'X DKV-1',
    major: 'DKV',
    grade: 'X',
    time: '-',
    status: 'Belum Absen',
    activeStatus: 'AKTIF',
    alpaCount: 0,
    avatarInitials: 'DN'
  },
  {
    id: 'std-7',
    nisn: '26271007264',
    name: 'Dylen Ramadhan',
    email: 'dylen.ramadhan@student.pelitanusantara.sch.id',
    parentPhone: '081255667788',
    class: 'X DKV-1',
    major: 'DKV',
    grade: 'X',
    time: '-',
    status: 'Belum Absen',
    activeStatus: 'AKTIF',
    alpaCount: 0,
    avatarInitials: 'DR'
  },
  {
    id: 'std-8',
    nisn: '26271007175',
    name: 'Eisha Marta Makarim',
    email: 'eisha.marta@student.pelitanusantara.sch.id',
    parentPhone: '081377889900',
    class: 'X DKV-1',
    major: 'DKV',
    grade: 'X',
    time: '-',
    status: 'Belum Absen',
    activeStatus: 'AKTIF',
    alpaCount: 0,
    avatarInitials: 'EM'
  },
  {
    id: 'std-9',
    nisn: 'TRB-1030',
    name: 'Jason Mendoza',
    email: 'jason.mendoza@student.pelitanusantara.sch.id',
    parentPhone: '081234567890',
    class: 'X RPL 1',
    major: 'RPL',
    grade: 'X',
    time: '-',
    status: 'Alpa',
    activeStatus: 'AKTIF',
    alpaCount: 12,
    avatarInitials: 'JM'
  },
  {
    id: 'std-10',
    nisn: 'TRB-1031',
    name: 'Tahani Al-Jamil',
    email: 'tahani.aljamil@student.pelitanusantara.sch.id',
    parentPhone: '089876543210',
    class: 'XI TKJ 2',
    major: 'TKJ',
    grade: 'XI',
    time: '08:42 AM',
    status: 'Hadir',
    activeStatus: 'PKL',
    alpaCount: 8,
    avatarInitials: 'TA'
  },
  {
    id: 'std-11',
    nisn: 'TRB-1032',
    name: 'Chidi Anagonye',
    email: 'chidi.anagonye@student.pelitanusantara.sch.id',
    parentPhone: '085612345678',
    class: 'XII TOI 1',
    major: 'TOI',
    grade: 'XII',
    time: '08:10 AM',
    status: 'Hadir',
    activeStatus: 'AKTIF',
    alpaCount: 7,
    avatarInitials: 'CA'
  },
  {
    id: 'std-12',
    nisn: 'TRB-1029',
    name: 'Eleanor Shellstrop',
    email: 'eleanor.shellstrop@student.pelitanusantara.sch.id',
    parentPhone: '081233445566',
    class: 'X RPL 1',
    major: 'RPL',
    grade: 'X',
    time: '08:15 AM',
    status: 'Hadir',
    activeStatus: 'AKTIF',
    alpaCount: 5,
    avatarInitials: 'ES'
  }
]

export const useAttendance = () => {
  const students = useState<Student[]>('students', () => initialStudents)

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
    token: 'TRB-8941-SECURE',
    lastUpdated: '09.35.12',
    countdown: 30,
    isActive: false
  }))

  // Stats Computations
  const stats = computed(() => {
    const baseTotal = 1048
    const totalAbsenHariIni = students.value.filter(s => s.status !== 'Belum Absen').length
    const hadir = students.value.filter(s => s.status === 'Hadir').length
    const sakit = students.value.filter(s => s.status === 'Sakit').length
    const alpa = students.value.filter(s => s.status === 'Alpa').length

    return {
      totalStudents: baseTotal + students.value.length - initialStudents.length,
      totalAbsenHariIni,
      hadirCount: hadir,
      sakitCount: sakit,
      alpaCount: alpa
    }
  })

  // Department Attendance Percentages
  const departmentStats = computed(() => {
    const majors: Array<'RPL' | 'TKJ' | 'DKV' | 'LPB' | 'TOI'> = ['RPL', 'TKJ', 'DKV', 'LPB', 'TOI']
    return majors.map(m => {
      const list = students.value.filter(s => s.major === m)
      if (!list.length) return { major: m, percentage: 0 }
      const present = list.filter(s => s.status === 'Hadir').length
      const percentage = Math.round((present / list.length) * 100)
      return { major: m, percentage }
    })
  })

  // Top Most Absent Students
  const topAbsents = computed(() => {
    return [...students.value]
      .sort((a, b) => b.alpaCount - a.alpaCount)
      .slice(0, 10)
  })

  // Actions
  const updateStudentStatus = (studentId: string, status: Student['status']) => {
    const student = students.value.find(s => s.id === studentId)
    if (student) {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      student.status = status
      student.time = status === 'Belum Absen' ? '-' : timeStr
      if (status === 'Alpa') {
        student.alpaCount += 1
      }
    }
  }

  const addStudent = (studentData: Omit<Student, 'id' | 'avatarInitials'>) => {
    const newId = `std-${Date.now()}`
    const initials = studentData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    students.value.unshift({
      ...studentData,
      id: newId,
      avatarInitials: initials
    })
  }

  const updateStudent = (id: string, updatedData: Partial<Student>) => {
    const index = students.value.findIndex(s => s.id === id)
    const existing = students.value[index]
    if (index !== -1 && existing) {
      students.value[index] = { ...existing, ...updatedData }
    }
  }

  const deleteStudent = (id: string) => {
    students.value = students.value.filter(s => s.id !== id)
  }

  const refreshQRToken = () => {
    const randomCode = Math.floor(1000 + Math.random() * 9000)
    const now = new Date()
    qrSession.value = {
      token: `TRB-${randomCode}-TOKEN`,
      lastUpdated: now.toLocaleTimeString('id-ID'),
      countdown: 30,
      isActive: true
    }
  }

  const toggleQRActive = () => {
    qrSession.value.isActive = !qrSession.value.isActive
  }

  const saveWATemplate = (tab: 'izin' | 'sakit' | 'alfa', content: string) => {
    waConfig.value.templates[tab] = content
  }

  return {
    students,
    waConfig,
    qrSession,
    stats,
    departmentStats,
    topAbsents,
    updateStudentStatus,
    addStudent,
    updateStudent,
    deleteStudent,
    refreshQRToken,
    toggleQRActive,
    saveWATemplate
  }
}
