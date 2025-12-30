<script setup lang="ts">
import QRCode from 'qrcode'

const props = defineProps<{
  roomCode: string
}>()

const qrCodeDataUrl = ref('')
const joinUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/party/${props.roomCode}/play`
})

watch(() => props.roomCode, async (newCode) => {
  if (newCode && typeof window !== 'undefined') {
    try {
      qrCodeDataUrl.value = await QRCode.toDataURL(joinUrl.value, {
        width: 200,
        margin: 2,
        color: {
          dark: '#00fff5',
          light: '#0a0a0f'
        }
      })
    } catch (err) {
      console.error('Failed to generate QR code:', err)
    }
  }
}, { immediate: true })

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(joinUrl.value)
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = joinUrl.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <!-- QR Code -->
    <div class="p-4 bg-arcade-bg rounded-lg border-2 border-neon-cyan/50 shadow-[0_0_20px_rgba(0,255,245,0.3)]">
      <img
        v-if="qrCodeDataUrl"
        :src="qrCodeDataUrl"
        alt="QR Code to join party"
        class="w-48 h-48"
      />
      <div v-else class="w-48 h-48 flex items-center justify-center">
        <Icon name="mdi:loading" class="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    </div>

    <!-- Room Code -->
    <div class="text-center">
      <p class="text-sm font-retro text-white/70 mb-1">Room Code</p>
      <div class="flex items-center gap-2">
        <span class="text-3xl font-pixel text-neon-yellow tracking-wider">{{ roomCode }}</span>
        <button
          @click="copyToClipboard"
          class="p-2 text-neon-cyan/70 hover:text-neon-cyan transition-colors"
          title="Copy join link"
        >
          <Icon name="mdi:content-copy" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Instructions -->
    <p class="text-sm font-retro text-white/50 text-center max-w-xs">
      Scan the QR code with your phone to join, or enter the room code at
      <span class="text-neon-cyan">{{ joinUrl.replace('https://', '').replace('http://', '').split('/')[0] }}/party</span>
    </p>
  </div>
</template>
