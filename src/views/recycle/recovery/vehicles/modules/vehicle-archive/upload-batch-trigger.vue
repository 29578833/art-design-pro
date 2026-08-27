<template>
  <div v-if="!disabled" class="ae-batch-upload">
    <button
      type="button"
      class="ae-batch-upload-btn"
      :class="{ 'is-loading': loading }"
      :disabled="loading"
      @click="triggerPick"
    >
      <span v-if="loading" class="ae-batch-upload-spin" />
      <ArtSvgIcon v-else icon="ri:upload-2-line" />
      {{ loading ? '上传中…' : '批量上传' }}
    </button>
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  defineOptions({ name: 'VehicleArchiveUploadBatchTrigger' })

  defineProps<{
    /** 是否禁用。 */
    disabled?: boolean
    /** 是否正在上传。 */
    loading?: boolean
  }>()

  const emit = defineEmits<{
    /** 选中多张本地图片。 */
    select: [files: File[]]
  }>()

  const inputRef = ref<HTMLInputElement>()

  function triggerPick() {
    inputRef.value?.click()
  }

  function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const files = input.files ? Array.from(input.files) : []
    if (files.length) emit('select', files)
    input.value = ''
  }
</script>
