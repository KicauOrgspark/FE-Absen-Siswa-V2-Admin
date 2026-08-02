<script setup lang="ts">
import QRCode from 'qrcode'

const { fetchApi } = useApi()
const { showSuccess } = useAppToast()

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

const fetchActiveTokenFromServer = async () => {
  isLoading.value = true
  let res = await fetchApi<Record<string, unknown>>('/api/v1/token/qr_code/active')
  if (!res.data) {
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

  await nextTick()
  await renderIndustryStandardQR()
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

const fetchTokensList = async () => {
  const { data } = await fetchApi<Record<string, unknown>>('/api/v1/token', { params: { page: 1, limit: 10 } })
  const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : null
  if (list) {
    tokenList.value = list as Record<string, unknown>[]
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

onMounted(() => {
  fetchActiveTokenFromServer()
  fetchTokensList()

  // Auto-polling every 5 seconds to sync with server-generated Postman tokens
  autoPollInterval.value = setInterval(() => {
    fetchActiveTokenFromServer()
  }, 5000)
})

onUnmounted(() => {
  if (autoPollInterval.value) {
    clearInterval(autoPollInterval.value)
  }
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

    <!-- History / Recent Tokens Table from Server -->
    <div
      v-if="tokenList.length"
      class="bg-surface-white border border-surface-container-highest rounded-2xl p-6 shadow-sm"
    >
      <h3 class="font-title text-base font-bold text-on-surface mb-4 flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-lg">history</span> Riwayat Token dari Server (Postman/BE)
      </h3>
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
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="tok in tokenList"
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
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
