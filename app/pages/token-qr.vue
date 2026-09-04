<script setup lang="ts">
import QRCode from 'qrcode'

const { fetchApi } = useApi()
const { showSuccess, showError } = useAppToast()
const { user } = useAuth()

const isSuperAdmin = computed(() => String(user.value?.role || '').toLowerCase() === 'superadmin')

const todayLocal = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const updateForm = reactive({
  date: todayLocal(),
  from_until: '',
  late_after: '',
  valid_until: '',
  status_pkl: null,
})
const isUpdating = ref(false)
const updateTargetId = ref<number | string | null>(null)
const selectedToken = ref<Record<string, unknown> | null>(null)
const tokenSearch = ref('')
const tokenStatusFilter = ref<'all' | 'active' | 'expired'>('all')

const filteredTokens = computed(() => {
  const keyword = tokenSearch.value.trim().toLowerCase()
  return tokenList.value.filter((tok) => {
    const matchesSearch = !keyword || String(tok.token_code || tok.token || '').toLowerCase().includes(keyword)
    const status = tok.is_active ? 'active' : 'expired'
    const matchesStatus = tokenStatusFilter.value === 'all' || status === tokenStatusFilter.value
    return matchesSearch && matchesStatus
  })
})

const isLoading = ref(false)
const qrCanvasRef = ref<HTMLCanvasElement | null>(null)
const activeToken = ref<{
  id?: number | string
  token_code?: string
  category?: string
  expired_at?: string
  is_active?: boolean
} | null>(null)
const tokenList = ref<Record<string, unknown>[]>([])
const autoPollInterval = ref<ReturnType<typeof setInterval> | null>(null)
const lastSyncTime = ref<string>('-')
const lastRenderedToken = ref('')

const fetchActiveTokenFromServer = async () => {
  isLoading.value = true
  let res = await fetchApi<Record<string, unknown>>('/api/v1/token/qr_code/active')
  if (!res.data && res.status === 404) {
    res = await fetchApi<Record<string, unknown>>('/api/v1/token/active')
  }
  isLoading.value = false
  lastSyncTime.value = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const rawData = res.data
  let activeItem: Record<string, unknown> | null = null

  if (rawData) {
    if (Array.isArray(rawData.data) && rawData.data.length > 0) {
      activeItem = rawData.data[0] as Record<string, unknown>
    } else if (Array.isArray(rawData) && rawData.length > 0) {
      activeItem = rawData[0] as Record<string, unknown>
    } else if (typeof rawData === 'object' && rawData.token_code) {
      activeItem = rawData as Record<string, unknown>
    } else if (rawData.data && typeof rawData.data === 'object' && (rawData.data as Record<string, unknown>).token_code) {
      activeItem = rawData.data as Record<string, unknown>
    }
  }

  if (activeItem && activeItem.token_code) {
    const tCode = String(activeItem.token_code || activeItem.token)
    const tId = (activeItem.id as number | string) || 1
    activeToken.value = {
      id: tId,
      token_code: tCode,
      category: String(activeItem.category || 'HADIR').toUpperCase(),
      expired_at: activeItem.expired_at ? String(activeItem.expired_at) : undefined,
      is_active: activeItem.is_active !== false
    }
  } else {
    activeToken.value = null
  }

  const newCode = activeToken.value?.token_code || ''
  if (newCode && newCode !== lastRenderedToken.value) {
    lastRenderedToken.value = newCode
    await nextTick()
    await renderIndustryStandardQR()
  } else if (!newCode) {
    lastRenderedToken.value = ''
  }

  if (!selectedToken.value) {
    updateTargetId.value = activeToken.value?.id ?? null
  }
}

const renderIndustryStandardQR = async () => {
  if (!activeToken.value?.token_code || !qrCanvasRef.value) return

  try {
    // Industry Standard QR Code rendering:
    // - Error Correction Level H (30% error recovery capability)
    // - 512x512 High Resolution (Super crisp scanning across all mobile cameras)
    // - Quiet Zone Margin 2
    await QRCode.toCanvas(qrCanvasRef.value, activeToken.value.token_code, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
  } catch (err) {
    console.error('Failed to render industry standard QR code:', err)
  }
}

const extractTokenList = (data: Record<string, unknown> | null | undefined): Record<string, unknown>[] | null => {
  if (!data) return null
  const candidates: unknown[] = [
    data.tokens,
    (data.data as Record<string, unknown> | undefined)?.tokens,
    data.data,
    data
  ]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as Record<string, unknown>[]
  }
  return null
}

const fetchTokensList = async () => {
  const PAGE_SIZE = 100
  const MAX_PAGES = 200
  const all: Record<string, unknown>[] = []
  const seen = new Set<string>()
  let hasMore = true

  for (let page = 1; page <= MAX_PAGES && hasMore; page++) {
    const { data, error } = await fetchApi<Record<string, unknown>>('/api/v1/token', { params: { page, limit: PAGE_SIZE } })
    if (error) break
    const list = extractTokenList(data)
    if (!list || list.length === 0 || !data) break

    const meta = data.data as Record<string, unknown> | undefined
    const totalPages = typeof meta?.totalPages === 'number'
      ? meta.totalPages
      : typeof meta?.total === 'number' && typeof meta?.limit === 'number'
        ? Math.ceil(meta.total / meta.limit)
        : undefined

    for (const item of list) {
      const key = String(item.id ?? item.token_code ?? item.token ?? '')
      if (!key || seen.has(key)) continue
      seen.add(key)
      all.push(item)
    }

    if (totalPages !== undefined) {
      hasMore = page < totalPages
    } else if (list.length < PAGE_SIZE) {
      hasMore = false
    }
  }

  if (all.length) {
    tokenList.value = all
  }
}

const handleManualRefresh = async () => {
  showSuccess('Memperbarui token aktif dari server...')
  await fetchActiveTokenFromServer()
  await fetchTokensList()
}

const handleDownloadQR = () => {
  if (!activeToken.value?.token_code) return
  const canvas = qrCanvasRef.value
  if (!canvas) return

  const link = document.createElement('a')
  link.download = `QR-Presensi-${activeToken.value.token_code}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

const handleUpdateQR = async (targetId?: number | string) => {
  const tokenId = targetId ?? updateTargetId.value ?? activeToken.value?.id
  if (!tokenId) {
    showError('Tidak ada token yang dapat diperbarui.')
    return
  }
  if (!updateForm.date || !updateForm.from_until || !updateForm.late_after || !updateForm.valid_until) {
    showError('Semua field (tanggal & waktu) wajib diisi.')
    return
  }
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
  if (!timeRegex.test(updateForm.from_until) || !timeRegex.test(updateForm.late_after) || !timeRegex.test(updateForm.valid_until)) {
    showError('Format waktu harus HH:MM (contoh: 05:00).')
    return
  }

  isUpdating.value = true
  const { error } = await fetchApi(`/api/v1/token/${tokenId}/updatedadmin`, {
    method: 'POST',
    body: { ...updateForm }
  })
  isUpdating.value = false

  if (!error) {
    showSuccess('QR Code token berhasil diperbarui. Memuat ulang token dari server...')
    updateForm.date = todayLocal()
    updateForm.from_until = ''
    updateForm.late_after = ''
    updateForm.valid_until = ''
    await fetchActiveTokenFromServer()
    await fetchTokensList()
    resetUpdateTarget()
  } else {
    showError(error.message || 'Gagal memperbarui QR Code token.')
  }
}

const resetUpdateTarget = () => {
  updateTargetId.value = activeToken.value?.id ?? null
  selectedToken.value = null
}

const handleReactivateToken = (tok: Record<string, unknown>) => {
  const tokId = (tok.id as number | string) || (tok.token_code as string)
  updateTargetId.value = tokId
  selectedToken.value = tok
  updateForm.date = String(tok.date || todayLocal())
  updateForm.from_until = tok.from_until ? String(tok.from_until).slice(0, 5) : ''
  updateForm.late_after = tok.late_after ? String(tok.late_after).slice(0, 5) : ''
  updateForm.valid_until = tok.valid_until ? String(tok.valid_until).slice(0, 5) : ''
  const section = document.getElementById('update-section')
  section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const POLL_INTERVAL = 30_000

const startPolling = () => {
  stopPolling()
  autoPollInterval.value = setInterval(() => {
    fetchActiveTokenFromServer()
  }, POLL_INTERVAL)
}

const stopPolling = () => {
  if (autoPollInterval.value) {
    clearInterval(autoPollInterval.value)
    autoPollInterval.value = null
  }
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    fetchActiveTokenFromServer()
    startPolling()
  } else {
    stopPolling()
  }
}

onMounted(() => {
  fetchActiveTokenFromServer()
  fetchTokensList()
  startPolling()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div class="max-w-300 mx-auto space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h2 class="font-headline text-headline-lg text-on-surface font-bold">
            Token QR Presensi
          </h2>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
            Server-Side Flow
          </span>
        </div>
        <p class="font-body text-sm text-secondary">
          QR Code digenerate otomatis oleh server backend (lewat Postman/Cron). Halaman ini menampilkan QR Code aktif secara realtime.
        </p>
        <div class="flex items-center gap-2 mt-2 text-xs text-secondary">
          <span class="material-symbols-outlined text-[14px] text-emerald-600 animate-spin">sync</span>
          <span>Auto-Sync Realtime · Terakhir diperbarui: <strong class="text-on-surface">{{ lastSyncTime }}</strong></span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="flex items-center gap-2 px-4 py-2 bg-surface-white border border-surface-container-highest rounded-xl text-on-surface hover:bg-surface-container-low transition-all shadow-sm active:scale-95 font-label text-sm font-bold"
          :disabled="isLoading"
          @click="handleManualRefresh"
        >
          <span
            class="material-symbols-outlined text-[18px]"
            :class="{ 'animate-spin': isLoading }"
          >refresh</span>
          {{ isLoading ? 'Memuat...' : 'Cek Token Server' }}
        </button>
      </div>
    </div>

    <!-- Main Server QR Card -->
    <div class="bg-surface-white border border-surface-container-highest rounded-2xl p-6 md:p-8 shadow-sm flex flex-col items-center justify-center min-h-96 transition-all hover:shadow-md">
      <!-- State: Waiting for Server Token -->
      <template v-if="!activeToken && !isLoading">
        <div class="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 mb-4 border border-amber-500/20">
          <span class="material-symbols-outlined text-3xl">cloud_sync</span>
        </div>
        <h3 class="font-title text-base font-bold text-on-surface mb-1.5">
          Menunggu Token Aktif dari Server...
        </h3>
        <p class="font-body text-xs text-secondary text-center max-w-md mb-4 leading-relaxed">
          Belum ada token presensi aktif yang digenerate oleh server. Jalankan request Endpoint <code class="px-2 py-0.5 bg-surface-container rounded text-primary font-mono text-xs">/token/create/hadir</code> atau <code class="px-2 py-0.5 bg-surface-container rounded text-amber-600 font-mono text-xs">/token/create/telat</code> di <strong>Postman</strong>.
        </p>
        <div class="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg border border-surface-container-highest text-xs text-secondary">
          <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Sistem secara otomatis akan mendeteksi begitu token dibuat via Postman.</span>
        </div>
      </template>

      <!-- State: Loading -->
      <template v-else-if="isLoading && !activeToken">
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-surface-container-low border border-surface-container-highest flex items-center justify-center">
            <span class="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
          </div>
          <div class="text-center">
            <h3 class="font-title text-base font-bold text-on-surface mb-1">
              Menghubungkan ke Server...
            </h3>
            <p class="font-body text-xs text-secondary">
              Memuat data QR Code server-side terbaru
            </p>
          </div>
        </div>
      </template>

      <!-- State: Active Server QR -->
      <template v-else-if="activeToken">
        <div class="flex flex-col items-center space-y-4">
          <!-- Active Badge -->
          <div
            class="flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold shadow-sm"
            :class="activeToken.category === 'TELAT' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'"
          >
            <span
              class="w-2 h-2 rounded-full animate-pulse"
              :class="activeToken.category === 'TELAT' ? 'bg-amber-500' : 'bg-emerald-500'"
            />
            <span>TOKEN SERVER AKTIF (FASE {{ activeToken.category }})</span>
          </div>

          <!-- Industry Standard High-Res Canvas container (Slightly more compact for desktop) -->
          <div class="relative p-4 bg-white border-2 border-primary/20 rounded-2xl shadow-lg flex flex-col items-center">
            <canvas
              ref="qrCanvasRef"
              class="w-48 h-48 sm:w-52 sm:h-52 rounded-lg"
            />

            <div class="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-secondary">
              <span class="material-symbols-outlined text-sm text-emerald-600">verified</span>
              <span>Level H Error Correction (30% Recovery) · Universal Device Scan</span>
            </div>
          </div>

          <!-- Token Info Details -->
          <div class="text-center space-y-1">
            <p class="font-mono text-xl font-extrabold text-primary tracking-widest">
              {{ activeToken.token_code }}
            </p>
            <p class="text-xs text-secondary font-medium">
              Digenerate oleh Server Backend · Kategori: <strong class="text-on-surface uppercase">{{ activeToken.category }}</strong>
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center justify-center gap-3">
            <button
              class="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold font-label text-sm shadow-md hover:brightness-110 transition-all active:scale-95"
              @click="handleDownloadQR"
            >
              <span class="material-symbols-outlined text-[18px]">download</span>
              Download High-Res QR (PNG)
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Superadmin: Update QR Code -->
    <div
      v-if="isSuperAdmin"
      id="update-section"
      class="bg-surface-white border border-surface-container-highest rounded-2xl p-6 md:p-8 shadow-sm"
    >
      <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
        <h3 class="font-title text-base font-bold text-on-surface flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-lg">qr_code_2</span> Update QR Code Token
        </h3>
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-700 border border-purple-500/20 uppercase tracking-wider">
          Superadmin Only
        </span>
      </div>
      <p class="font-body text-xs text-secondary mb-5 leading-relaxed">
        Perbarui jadwal &amp; masa berlaku token QR (ID:
        <code class="px-1.5 py-0.5 bg-surface-container rounded font-mono text-primary">{{ updateTargetId ?? activeToken?.id ?? '-' }}</code>).
        Perubahan langsung diterapkan ke server.
      </p>

      <div
        v-if="selectedToken && String(selectedToken.id) !== String(activeToken?.id)"
        class="flex items-center justify-between flex-wrap gap-3 px-4 py-3 mb-5 rounded-xl bg-amber-500/10 border border-amber-500/30"
      >
        <div class="flex items-center gap-2 text-xs font-bold text-amber-800">
          <span class="material-symbols-outlined text-[16px]">history_toggle_off</span>
          <span>
            Mengupdate token <code class="px-1.5 py-0.5 bg-white/60 rounded font-mono">{{ String(selectedToken.token_code || selectedToken.token || selectedToken.id) }}</code>
            ({{ selectedToken.is_active ? 'AKTIF' : 'KEDALUWARSA' }})
          </span>
        </div>
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-white border border-amber-500/30 text-amber-800 text-xs font-bold hover:bg-amber-500/10 transition-all"
          @click="resetUpdateTarget"
        >
          <span class="material-symbols-outlined text-[14px]">close</span>
          Batal, kembali ke token aktif
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs font-bold text-secondary mb-1.5">Tanggal</label>
          <input
            v-model="updateForm.date"
            type="date"
            class="w-full px-3 py-2.5 border border-surface-container-highest rounded-xl bg-surface-white text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
        </div>
        <div>
          <label class="block text-xs font-bold text-secondary mb-1.5">Waktu Mulai (from_until)</label>
          <input
            v-model="updateForm.from_until"
            type="time"
            class="w-full px-3 py-2.5 border border-surface-container-highest rounded-xl bg-surface-white text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
        </div>
        <div>
          <label class="block text-xs font-bold text-secondary mb-1.5">Batas Telat (late_after)</label>
          <input
            v-model="updateForm.late_after"
            type="time"
            class="w-full px-3 py-2.5 border border-surface-container-highest rounded-xl bg-surface-white text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
        </div>
        <div>
          <label class="block text-xs font-bold text-secondary mb-1.5">Berlaku Sampai (valid_until)</label>
          <input
            v-model="updateForm.valid_until"
            type="time"
            class="w-full px-3 py-2.5 border border-surface-container-highest rounded-xl bg-surface-white text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
        </div>
         <div>
  <label class="flex items-center gap-2 cursor-pointer">
    <input
      v-model="updateForm.status_pkl"
      type="checkbox"
      class="w-4 h-4 rounded border-surface-container-highest text-primary focus:ring-primary/40"
    >
    <span class="text-xs font-bold text-secondary">
      Status Pkl
    </span>
  </label>
</div>
      </div>

      <div class="mt-5 flex items-center gap-3 flex-wrap">
        <button
          class="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold font-label text-sm shadow-md hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isUpdating || !(updateTargetId ?? activeToken?.id)"
          @click="handleUpdateQR()"
        >
          <span
            class="material-symbols-outlined text-[18px]"
            :class="{ 'animate-spin': isUpdating }"
          >{{ isUpdating ? 'progress_activity' : 'qr_code_2' }}</span>
          {{ isUpdating ? 'Memperbarui...' : 'Update QR Code' }}
        </button>
        <span
          v-if="!(updateTargetId ?? activeToken?.id)"
          class="text-xs text-secondary font-medium"
        >
          Menunggu token dari server untuk mengaktifkan tombol update.
        </span>
      </div>
    </div>

    <!-- History / Recent Tokens Table from Server -->
    <div
      v-if="tokenList.length"
      class="bg-surface-white border border-surface-container-highest rounded-2xl p-6 shadow-sm"
    >
      <h3 class="font-title text-base font-bold text-on-surface mb-4 flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-lg">history</span> Riwayat Token dari Server (Postman/BE)
      </h3>
      <div
        v-if="isSuperAdmin"
        class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4"
      >
        <div class="relative flex-1 max-w-sm">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-secondary">search</span>
          <input
            v-model="tokenSearch"
            type="text"
            placeholder="Cari kode token..."
            class="w-full pl-9 pr-3 py-2 border border-surface-container-highest rounded-xl bg-surface-white text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
        </div>
        <select
          v-model="tokenStatusFilter"
          class="px-3 py-2 border border-surface-container-highest rounded-xl bg-surface-white text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">
            Semua Status
          </option>
          <option value="active">
            AKTIF
          </option>
          <option value="expired">
            KEDALUWARSA
          </option>
        </select>
        <span class="text-xs text-secondary font-medium sm:ml-auto">
          {{ filteredTokens.length }} token ditemukan
        </span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-surface-container-low text-secondary uppercase border-b font-bold">
              <th class="p-3">
                Kode Token
              </th>
              <th class="p-3">
                Kategori
              </th>
              <th class="p-3">
                Status
              </th>
              <th class="p-3">
                Dibuat Pada
              </th>
              <th
                v-if="isSuperAdmin"
                class="p-3"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="tok in filteredTokens"
              :key="String(tok.id || tok.token_code)"
            >
              <td class="p-3 font-mono font-bold text-primary">
                {{ String(tok.token_code || tok.token || '-') }}
              </td>
              <td class="p-3 font-bold uppercase">
                <span :class="String(tok.category).toLowerCase() === 'telat' ? 'text-amber-600' : 'text-emerald-600'">
                  {{ String(tok.category || 'HADIR').toUpperCase() }}
                </span>
              </td>
              <td class="p-3">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="tok.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'"
                >
                  {{ tok.is_active ? 'AKTIF' : 'KEDALUWARSA' }}
                </span>
              </td>
              <td class="p-3 text-secondary">
                {{ String(tok.created_at || tok.date || '-') }}
              </td>
              <td
                v-if="isSuperAdmin"
                class="p-3"
              >
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="tok.is_active ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border border-amber-500/20'"
                  :disabled="isUpdating"
                  @click="handleReactivateToken(tok)"
                >
                  <span class="material-symbols-outlined text-[14px]">sync</span>
                  {{ tok.is_active ? 'Update' : 'Reaktivasi' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
