<template>
  <div class="vd-photo-slot">
    <div class="vd-photo-label-top">{{ item.label }}</div>
    <div class="vd-photo-box">
      <ElImage
        v-if="url"
        :src="url"
        fit="cover"
        class="vd-photo-img"
        :preview-src-list="previewList"
        :initial-index="previewInitialIndex"
        preview-teleported
      />
      <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { ArchivePhotoItem } from './types'

  defineOptions({ name: 'VehicleArchiveReadonlyPhoto' })

  interface Props {
    /** 照片配置。 */
    item: ArchivePhotoItem
    /** 图片访问地址。 */
    url: string
    /** 同组预览 URL 列表，不传则仅预览当前图。 */
    previewSrcList?: string[]
    /** 当前图在 previewSrcList 中的索引。 */
    initialIndex?: number
  }

  const props = defineProps<Props>()

  const previewList = computed(() =>
    props.previewSrcList?.length ? props.previewSrcList : props.url ? [props.url] : []
  )
  const previewInitialIndex = computed(() =>
    props.previewSrcList?.length ? (props.initialIndex ?? 0) : 0
  )
</script>

<style scoped lang="scss">
  @use '../../vehicles-dialog' as *;
</style>
