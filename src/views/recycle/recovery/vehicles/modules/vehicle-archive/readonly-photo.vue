<template>
  <div class="ae-readonly-photo">
    <div class="ae-readonly-photo-label">{{ item.label }}</div>
    <div class="ae-readonly-slot">
      <ElImage
        v-if="url"
        :src="url"
        fit="cover"
        class="ae-readonly-img"
        :preview-src-list="[url]"
        preview-teleported
      />
      <template v-else>
        <ArtSvgIcon icon="ri:camera-line" style="margin-bottom: 4px; font-size: 20px" />
        暂无图片
      </template>
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
  }

  defineProps<Props>()
</script>
