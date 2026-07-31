<script setup lang="ts">
const { qrSession, refreshQRToken, toggleQRActive } = useAttendance()

const isLoading = ref(false)
const qrImageRef = ref<HTMLCanvasElement | null>(null)

// Dummy: simulate fetching QR from server
const fetchQRFromServer = async () => {
  isLoading.value = true
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1200))
  refreshQRToken()
  isLoading.value = false
  // Draw dummy QR on canvas after render
  await nextTick()
  drawDummyQR()
}

// Generate a deterministic dummy QR pattern on canvas
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

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  // Seed pattern from token string
  const token = qrSession.value.token
  const seed = token.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

  // Draw QR-like modules
  ctx.fillStyle = '#1a1a1a'
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      // Position patterns (top-left, top-right, bottom-left)
      const inFinderTL = row < 7 && col < 7
      const inFinderTR = row < 7 && col >= modules - 7
      const inFinderBL = row >= modules - 7 && col < 7

      if (inFinderTL || inFinderTR || inFinderBL) {
        // Finder pattern
        const lr = inFinderTL ? row : inFinderTR ? row : row - (modules - 7)
        const lc = inFinderTL ? col : inFinderTR ? col - (modules - 7) : col
        const isOuter = lr === 0 || lr === 6 || lc === 0 || lc === 6
        const isInner = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4
        if (isOuter || isInner) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
        }
      } else {
        // Pseudo-random data modules
        const hash = ((row * 31 + col * 17 + seed) * 2654435761) >>> 0
        if (hash % 3 !== 0) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
        }
      }
    }
  }

  // Center logo area (white box with text)
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
  if (!canvas) return

  const link = document.createElement('a')
  link.download = `QR-Presensi-${qrSession.token}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

// Draw QR on mount if session is active
onMounted(() => {
  if (qrSession.value.isActive) {
    nextTick(() => drawDummyQR())
  }
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
        <div v-if="qrSession.isActive" class="flex items-center gap-1.5 mt-2 text-xs text-secondary">
          <span class="material-symbols-outlined text-[14px]">sync</span>
          <span>Terakhir diperbarui: {{ qrSession.lastUpdated }}</span>
        </div>
      </div>
      <button
        v-if="qrSession.isActive"
        class="flex items-center gap-2 px-4 py-2 bg-surface-white border border-surface-container-highest rounded-lg text-on-surface hover:bg-surface-container-low transition-all shadow-sm self-start active:scale-95 font-label text-sm font-bold"
        :disabled="isLoading"
        @click="handleRefresh"
      >
        <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': isLoading }">refresh</span>
        {{ isLoading ? 'Memuat...' : 'Refresh QR' }}
      </button>
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
            <h3 class="font-title text-lg font-bold text-on-surface mb-1">Mengambil QR dari server...</h3>
            <p class="font-body text-sm text-secondary">Memuat data QR Code terbaru dari server</p>
          </div>
        </div>
      </template>

      <!-- State: Active QR -->
      <template v-else>
        <div class="flex flex-col items-center space-y-6">
          <!-- QR Image from server (dummy canvas) -->
          <div class="relative p-5 bg-white border-2 border-primary/20 rounded-2xl shadow-lg">
            <canvas
              ref="qrImageRef"
              class="w-[250px] h-[250px] rounded-lg"
              width="300"
              height="300"
            ></canvas>

            <!-- Active badge -->
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-[11px] font-bold rounded-full shadow-md">
              <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              SESI AKTIF
            </div>
          </div>

          <!-- Token Info -->
          <div class="text-center space-y-1">
            <p class="font-mono text-lg font-bold text-primary tracking-wider">{{ qrSession.token }}</p>
            <p class="text-xs text-secondary">Token ini digenerate oleh server · Berlaku selama sesi aktif</p>
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

    <!-- Info Card -->
    <div class="bg-surface-white border border-surface-container-highest rounded-2xl p-6 shadow-sm">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary border border-surface-container-highest shrink-0">
          <span class="material-symbols-outlined text-xl">info</span>
        </div>
        <div class="space-y-2">
          <h4 class="font-title text-sm font-bold text-on-surface">Cara Kerja QR Presensi</h4>
          <ul class="space-y-1.5 text-xs text-secondary leading-relaxed">
            <li class="flex items-start gap-2">
              <span class="material-symbols-outlined text-[14px] mt-0.5 text-primary">cloud_sync</span>
              QR Code digenerate di sisi server dan diambil oleh admin panel.
            </li>
            <li class="flex items-start gap-2">
              <span class="material-symbols-outlined text-[14px] mt-0.5 text-primary">qr_code_scanner</span>
              Siswa menscan QR melalui aplikasi untuk mencatat presensi.
            </li>
            <li class="flex items-start gap-2">
              <span class="material-symbols-outlined text-[14px] mt-0.5 text-primary">download</span>
              Download QR untuk ditampilkan di layar kelas atau dicetak.
            </li>
            <li class="flex items-start gap-2">
              <span class="material-symbols-outlined text-[14px] mt-0.5 text-primary">refresh</span>
              Gunakan tombol Refresh untuk mengambil QR terbaru dari server.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
