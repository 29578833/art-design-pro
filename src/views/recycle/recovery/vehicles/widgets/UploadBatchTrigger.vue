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

<style scoped lang="scss">
  .ae-batch-upload-btn {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 500;
    color: #1890ff;
    cursor: pointer;
    background: #fff;
    border: 1px solid #1890ff;
    border-radius: 4px;
    transition:
      background 0.2s,
      border-color 0.2s,
      color 0.2s;

    &:hover:not(:disabled) {
      background: #e6f7ff;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    &.is-loading {
      color: #9ca3af;
      border-color: #d1d5db;
    }
  }

  .ae-batch-upload-spin {
    width: 12px;
    height: 12px;
    border: 2px solid #d1d5db;
    border-top-color: #1890ff;
    border-radius: 50%;
    animation: ae-batch-spin 0.8s linear infinite;
  }

  @keyframes ae-batch-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
