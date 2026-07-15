<template>
  <div class="ae-scene">
    <div class="ae-scene-group">
      <div class="ae-scene-title">车辆属地 *</div>
      <div class="ae-scene-grid cols-3">
        <button
          v-for="item in hplxOptions"
          :key="item.value"
          type="button"
          class="ae-scene-card"
          :class="{ active: hplx === item.value }"
          @click="hplx = item.value"
        >
          <div class="name">{{ item.label }}</div>
          <div class="desc">{{ item.desc }}</div>
        </button>
      </div>
    </div>
    <div class="ae-scene-group">
      <div class="ae-scene-title">所有权类型 *</div>
      <div class="ae-scene-grid cols-2">
        <button
          v-for="item in syqOptions"
          :key="item.value"
          type="button"
          class="ae-scene-card"
          :class="{ active: syq === item.value }"
          @click="syq = item.value"
        >
          <div class="name">{{ item.label }}</div>
          <div class="desc">{{ item.desc }}</div>
        </button>
      </div>
    </div>
    <div class="ae-scene-summary">
      当前场景：
      <b>{{ hplxLabel }} · {{ syqLabel }}</b>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { AcceptHplx, AcceptSyq } from '@/types/recycle/accept'
  import type { ArchiveSceneOption } from './types'

  defineOptions({ name: 'VehicleArchiveSceneSelector' })

  interface Props {
    /** 车辆属地选项。 */
    hplxOptions: ArchiveSceneOption<AcceptHplx>[]
    /** 所有权类型选项。 */
    syqOptions: ArchiveSceneOption<AcceptSyq>[]
    /** 当前车辆属地名称。 */
    hplxLabel: string
    /** 当前所有权类型名称。 */
    syqLabel: string
  }

  defineProps<Props>()

  /** 当前车辆属地。 */
  const hplx = defineModel<AcceptHplx>('hplx', { required: true })
  /** 当前所有权类型。 */
  const syq = defineModel<AcceptSyq>('syq', { required: true })
</script>
