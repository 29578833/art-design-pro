<template>
  <div class="ae-slot">
    <div class="ae-slot-label">
      {{ label }}
      <span v-if="required" class="req">*</span>
    </div>
    <div class="ae-slot-box" :class="{ done: !!url }">
      <template v-if="url">
        <ElImage
          :src="url"
          fit="cover"
          class="ae-slot-img"
          :preview-src-list="[url]"
          preview-teleported
          hide-on-click-modal
        />
        <button
          v-if="!readonly"
          type="button"
          class="ae-slot-del"
          title="删除"
          @click.stop="emit('remove')"
        >
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </template>
      <div v-else class="ae-slot-empty" @click="triggerPick">
        <ArtSvgIcon icon="ri:camera-line" style="font-size: 20px; color: #d1d5db" />
        <div class="slot-text">点击上传</div>
      </div>
      <input
        ref="inputRef"
        type="file"
        accept="image/*"
        style="display: none"
        @change="onFileChange"
      />
    </div>
    <button
      v-if="showOcr"
      type="button"
      class="ae-ocr-btn"
      :class="{ 'is-loading': ocrLoading, 'is-done': ocrDone }"
      :disabled="!url || ocrLoading || ocrDone"
      @click.stop="emit('ocr')"
    >
      <span v-if="ocrLoading" class="ae-ocr-spin" />
      <ArtSvgIcon v-else-if="ocrDone" icon="ri:checkbox-circle-line" class="ae-ocr-icon" />
      <ArtSvgIcon v-else icon="ri:qr-scan-2-line" class="ae-ocr-icon" />
      <span class="ae-ocr-text">
        {{
          ocrDone
            ? filledLabel
            : ocrLoading
              ? '识别中…'
              : ocrHint
                ? `OCR识别→${ocrHint}`
                : 'OCR识别'
        }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  defineOptions({ name: 'VehicleArchiveUploadSlot' })

  const props = defineProps<{
    label: string
    required?: boolean
    url?: string
    enableOcr?: boolean
    ocrLoading?: boolean
    ocrDone?: boolean
    ocrHint?: string
    ocrFilledText?: string
    readonly?: boolean
  }>()

  const emit = defineEmits<{
    upload: [file: File]
    ocr: []
    remove: []
  }>()

  const inputRef = ref<HTMLInputElement>()
  const showOcr = computed(() => !props.readonly && !!props.enableOcr)

  const filledLabel = computed(() => {
    if (props.ocrFilledText) return props.ocrFilledText
    if (!props.ocrHint) return '已填充'
    const count = props.ocrHint.replace(/…$/, '').split('·').filter(Boolean).length
    return count ? `已填充（${count}项）` : '已填充'
  })

  function triggerPick() {
    if (props.readonly) return
    inputRef.value?.click()
  }

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) emit('upload', file)
    input.value = ''
  }
</script>
