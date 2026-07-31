<script setup lang="ts">
const { qrSession, refreshQRToken, toggleQRActive } = useAttendance()
const { fetchApi, apiBase } = useApi()

const isLoading = ref(false)
const qrImageRef = ref<HTMLCanvasElement | null>(null)
const serverQrImageUrl = ref('')
const activeTokenCode = ref('TRB-8941-SECURE')
const tokenList = ref<Record<string, unknown>[]>([])

const fetchQRFromServer = async () => {
  isLoading.value = true
  const { data } = await fetchApi<Record<string, unknown>>('/api/v1/token/qr_code/active')
  isLoading.value = false

  if (data) {
    qrSession.value.isActive = true
    activeTokenCode.value = String(data.token_code || data.token || 'TRB-8941-SECURE')
    qrSession.value.token = activeTokenCode.value
    if (data.id) {
      serverQrImageUrl.value = `${apiBase.replace(/\/$/, '')}/api/v1/token/${data.id}/image`
    }
  } else {
    refreshQRToken()
    activeTokenCode.value = qrSession.value.token
  }

  await nextTick()
  if (!serverQrImageUrl.value) {
    drawDummyQR()
  }
}

const fetchTokensList = async () => {
  const { data } = await fetchApi<Record<string, unknown>>('/api/v1/token', { params: { page: 1, limit: 10 } })
  const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : null
  if (list) {
    tokenList.value = list as Record<string, unknown>[]
  }
}

const createQuickTokenHadir = async () => {
  isLoading.value = true
  const { data } = await fetchApi('/api/v1/token/create/hadir', { method: 'POST' })
  isLoading.value = false
  if (data) {
    await fetchQRFromServer()
    await fetchTokensList()
  } else {
    refreshQRToken()
  }
}

const createQuickTokenTelat = async () => {
  isLoading.value = true
  const { data } = await fetchApi('/api/v1/token/create/telat', { method: 'POST' })
  isLoading.value = false
  if (data) {
    await fetchQRFromServer()
    await fetchTokensList()
  } else {
    refreshQRToken()
  }
}

const drawDummyQR = () => {
  const canvas = qrImageRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const size = 300
  canvas.width = size
  canvas.height = size

  const modules = 25
  const cellSize = size / modules

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  const token = activeTokenCode.value
  const seed = token.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

  ctx.fillStyle = '#1a1a1a'
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      const inFinderTL = row < 7 && col < 7
      const inFinderTR = row < 7 && col >= modules - 7
      const inFinderBL = row >= modules - 7 && col < 7

      if (inFinderTL || inFinderTR || inFinderBL) {
        const lr = inFinderTL ? row : inFinderTR ? row : row - (modules - 7)
        const lc = inFinderTL ? col : inFinderTR ? col - (modules - 7) : col
        const isOuter = lr === 0 || lr === 6 || lc === 0 || lc === 6
        const isInner = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4
        if (isOuter || isInner) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
        }
      } else {
        const hash = ((row * 31 + col * 17 + seed) * 2654435761) >>> 0
        if (hash % 3 !== 0) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
        }
      }
    }
  }

  const centerX = size / 2
  const centerY = size / 2
  const logoSize = 50
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(centerX - logoSize / 2 - 4, centerY - logoSize / 2 - 4, logoSize + 8, logoSize + 8)
  ctx.fillStyle = '#6750A4'
  ctx.fillRect(centerX - logoSize / 2, centerY - logoSize / 2, logoSize, logoSize)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 11px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('SP', centerX, centerY)
}

const handleActivate = async () => {
  toggleQRActive()
  await fetchQRFromServer()
}

const handleRefresh = async () => {
  await fetchQRFromServer()
}

const handleDownload = () => {
  const canvas = qrImageRef.value
  if (serverQrImageUrl.value) {
    window.open(serverQrImageUrl.value, '_blank')
    return
  }
  if (!canvas) return

  const link = document.createElement('a')
  link.download = `QR-Presensi-${activeTokenCode.value}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

onMounted(() => {
  fetchQRFromServer()
  fetchTokensList()
})
</script>

<template>
  <div class="max-w-[1200px] mx-auto space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h2 class="font-headline text-headline-lg text-on-surface font-bold mb-1">
          Token QR Absensi
        </h2>
        <p class="font-body text-sm text-secondary">
          QR Code dihasilkan oleh server. Ambil dan tampilkan untuk sesi presensi.
        </p>
        <div
          v-if="qrSession.isActive"
          class="flex items-center gap-1.5 mt-2 text-xs text-secondary"
        >
          <span class="material-symbols-outlined text-[14px]">sync</span>
          <span>Terakhir diperbarui: {{ qrSession.lastUpdated }}</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
          :disabled="isLoading"
          @click="createQuickTokenHadir"
        >
          <span class="material-symbols-outlined text-sm">add_circle</span>
          Buat Token Hadir
        </button>

        <button
          class="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-all shadow-sm active:scale-95"
          :disabled="isLoading"
          @click="createQuickTokenTelat"
        >
          <span class="material-symbols-outlined text-sm">schedule</span>
          Buat Token Telat
        </button>

        <button
          v-if="qrSession.isActive"
          class="flex items-center gap-2 px-4 py-2 bg-surface-white border border-surface-container-highest rounded-lg text-on-surface hover:bg-surface-container-low transition-all shadow-sm self-start active:scale-95 font-label text-sm font-bold"
          :disabled="isLoading"
          @click="handleRefresh"
        >
          <span
            class="material-symbols-outlined text-[18px]"
            :class="{ 'animate-spin': isLoading }"
          >refresh</span>
          {{ isLoading ? 'Memuat...' : 'Refresh QR' }}
        </button>
      </div>
    </div>

    <!-- Main QR Card -->
    <div class="bg-surface-white border border-surface-container-highest rounded-2xl p-8 md:p-12 shadow-sm flex flex-col items-center justify-center min-h-[420px] transition-all hover:shadow-md">
      <!-- State: Inactive -->
      <template v-if="!qrSession.isActive && !isLoading">
        <div class="w-20 h-20 bg-surface-container-low rounded-3xl flex items-center justify-center text-secondary mb-6 border border-surface-container-highest">
          <span class="material-symbols-outlined text-4xl">qr_code_2</span>
        </div>
        <h3 class="font-title text-lg font-bold text-on-surface mb-2">
          Tidak ada QR aktif
        </h3>
        <p class="font-body text-sm text-secondary text-center max-w-sm mb-6">
          Belum ada sesi QR presensi yang berjalan. Tekan tombol di bawah untuk mengambil QR terbaru dari server.
        </p>
        <button
          class="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold font-label text-sm shadow-md hover:brightness-110 transition-all active:scale-95"
          @click="handleActivate"
        >
          <span class="material-symbols-outlined text-[20px]">cloud_download</span>
          Ambil QR dari Server
        </button>
      </template>

      <!-- State: Loading -->
      <template v-else-if="isLoading">
        <div class="flex flex-col items-center gap-5">
          <div class="w-20 h-20 rounded-3xl bg-surface-container-low border border-surface-container-highest flex items-center justify-center">
            <span class="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          </div>
          <div class="text-center">
            <h3 class="font-title text-lg font-bold text-on-surface mb-1">
              Mengambil QR dari server...
            </h3>
            <p class="font-body text-sm text-secondary">
              Memuat data QR Code terbaru dari server
            </p>
          </div>
        </div>
      </template>

      <!-- State: Active QR -->
      <template v-else>
        <div class="flex flex-col items-center space-y-6">
          <!-- QR Image from server or canvas -->
          <div class="relative p-5 bg-white border-2 border-primary/20 rounded-2xl shadow-lg">
            <img
              v-if="serverQrImageUrl"
              :src="serverQrImageUrl"
              alt="QR Code Server"
              class="w-[250px] h-[250px] rounded-lg object-contain"
            >
            <canvas
              v-else
              ref="qrImageRef"
              class="w-[250px] h-[250px] rounded-lg"
              width="300"
              height="300"
            />

            <!-- Active badge -->
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-[11px] font-bold rounded-full shadow-md">
              <span class="w-2 h-2 rounded-full bg-white animate-pulse" />
              SESI AKTIF
            </div>
          </div>

          <!-- Token Info -->
          <div class="text-center space-y-1">
            <p class="font-mono text-lg font-bold text-primary tracking-wider">
              {{ activeTokenCode }}
            </p>
            <p class="text-xs text-secondary">
              Token ini digenerate oleh server · Berlaku selama sesi aktif
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center justify-center gap-3">
            <button
              class="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold font-label text-sm shadow-md hover:brightness-110 transition-all active:scale-95"
              @click="handleDownload"
            >
              <span class="material-symbols-outlined text-[18px]">download</span>
              Download QR
            </button>
            <button
              class="flex items-center gap-2 px-5 py-2.5 border border-error text-error rounded-xl font-label text-sm font-bold hover:bg-error-container/30 transition-colors active:scale-95"
              @click="toggleQRActive"
            >
              <span class="material-symbols-outlined text-[18px]">stop_circle</span>
              Hentikan Sesi
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- History / Recent Tokens Table -->
    <div
      v-if="tokenList.length"
      class="bg-surface-white border border-surface-container-highest rounded-2xl p-6 shadow-sm"
    >
      <h3 class="font-title text-base font-bold text-on-surface mb-4 flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-lg">history</span> Riwayat Token Server
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
                Durasi
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
                {{ String(tok.category || 'HADIR') }}
              </td>
              <td class="p-3">
                {{ String(tok.duration || 30) }} Menit
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
