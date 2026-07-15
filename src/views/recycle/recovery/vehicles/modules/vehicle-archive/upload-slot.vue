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

  interface Props {
    /** 上传项名称。 */
    label: string
    /** 是否为必传项。 */
    required?: boolean
    /** 已上传图片地址。 */
    url?: string
    /** 是否启用 OCR 操作。 */
    enableOcr?: boolean
    /** OCR 是否正在识别。 */
    ocrLoading?: boolean
    /** OCR 是否识别完成。 */
    ocrDone?: boolean
    /** OCR 可识别字段提示。 */
    ocrHint?: string
    /** OCR 完成后的按钮文案。 */
    ocrFilledText?: string
    /** 是否只读。 */
    readonly?: boolean
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    /** 选中本地文件。 */
    upload: [file: File]
    /** 请求执行 OCR。 */
    ocr: []
    /** 请求删除已上传文件。 */
    remove: []
  }>()

  const inputRef = ref<HTMLInputElement>()
  const showOcr = computed(() => !props.readonly && !!props.enableOcr)

  const filledLabel = computed(() => {
    if (props.ocrFilledText) return props.ocrFilledText
    if (!props.ocrHint) return '已填入'
    const count = props.ocrHint.replace(/…/, '').split('·').filter(Boolean).length
    return count ? `已填入（${count}项）` : '已填入'
  })

  function triggerPick() {
    if (props.readonly) return
    inputRef.value?.click()
  }

  function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) emit('upload', file)
    input.value = ''
  }
</script>
