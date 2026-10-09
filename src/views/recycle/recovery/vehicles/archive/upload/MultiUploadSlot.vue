<template>
  <div class="ae-multi-slot">
    <div class="ae-slot-label">
      {{ label }}
      <span class="ae-multi-count">（已上传 {{ urls.length }} 张）</span>
    </div>
    <div class="ae-multi-grid">
      <div
        v-for="(url, index) in urls"
        :key="`${url}-${index}`"
        class="ae-slot-box ae-multi-item"
        :class="{ done: !!url }"
      >
        <ElImage
          :src="url"
          fit="contain"
          loading="lazy"
          class="ae-slot-img"
          :preview-src-list="urls"
          :initial-index="index"
          preview-teleported
          hide-on-click-modal
        />
        <button
          v-if="!readonly"
          type="button"
          class="ae-slot-del"
          title="删除"
          @click.stop="emit('remove', index)"
        >
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
      <div
        v-if="!readonly && urls.length < max"
        class="ae-slot-box ae-slot-empty ae-multi-add"
        @click="triggerPick"
      >
        <ArtSvgIcon icon="ri:add-line" style="font-size: 20px; color: #d1d5db" />
        <div class="slot-text">点击上传（可多选）</div>
      </div>
    </div>
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

  defineOptions({ name: 'VehicleArchiveMultiUploadSlot' })

  interface Props {
    /** 上传项名称。 */
    label: string
    /** 已上传图片地址列表。 */
    urls?: string[]
    /** 是否只读。 */
    readonly?: boolean
    /** 最多可上传张数。 */
    max?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    urls: () => [],
    max: 9
  })

  const emit = defineEmits<{
    /** 选中本地文件（支持一次多选）。 */
    upload: [files: File[]]
    /** 删除指定下标的图片。 */
    remove: [index: number]
  }>()

  const inputRef = ref<HTMLInputElement>()

  function triggerPick() {
    if (props.readonly) return
    inputRef.value?.click()
  }

  function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    if (files.length) {
      const remain = Math.max(0, props.max - props.urls.length)
      emit('upload', files.slice(0, remain || files.length))
    }
    input.value = ''
  }
</script>

<style scoped lang="scss">
  .ae-multi-slot {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ae-multi-count {
    color: #8c8c8c;
  }

  .ae-multi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
</style>
