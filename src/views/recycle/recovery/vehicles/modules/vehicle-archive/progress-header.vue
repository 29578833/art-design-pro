<template>
  <div class="ae-step-bar">
    <template v-for="(item, index) in steps" :key="item.id">
      <button type="button" class="ae-step-item" @click="emit('change-step', item.id)">
        <span
          class="ae-step-num"
          :class="{ cur: currentStep === item.id, done: stepComplete[item.id - 1] }"
        >
          {{ stepComplete[item.id - 1] ? '✓' : index + 1 }}
        </span>
        <span
          class="ae-step-label"
          :class="{ cur: currentStep === item.id, done: stepComplete[item.id - 1] }"
        >
          {{ item.label }}
        </span>
      </button>
      <div
        v-if="index < steps.length - 1"
        class="ae-step-line"
        :class="{ done: stepComplete[item.id - 1] }"
      />
    </template>
  </div>

  <div class="ae-meta-bar">
    <div>
      <span class="ae-meta-label">车辆属地：</span>
      <span class="ae-meta-value">{{ hplxLabel }}</span>
    </div>
    <div>
      <span class="ae-meta-label">所有权：</span>
      <span class="ae-meta-value">{{ syqLabel }}</span>
    </div>
    <div>
      <span class="ae-meta-label">受理时间：</span>
      <span class="ae-meta-value">{{ acceptTime }}</span>
    </div>
    <div>
      <span class="ae-meta-label">受理人：</span>
      <span class="ae-meta-value">当前用户</span>
    </div>
  </div>

  <div class="ae-link-bar">
    <div>
      <span class="ae-link-label">关联回收订单号</span>
      <span v-if="linkInfo.order_no" class="ae-link-chip">{{ linkInfo.order_no }}</span>
      <span v-else class="ae-link-chip empty">未关联</span>
    </div>
    <div>
      <span class="ae-link-label">车辆档案单号</span>
      <span v-if="linkInfo.archive_no" class="ae-link-chip gray">{{ linkInfo.archive_no }}</span>
      <span v-else class="ae-link-chip empty">待生成</span>
    </div>
    <div>
      <span class="ae-link-label">拖车订单号</span>
      <span v-if="linkInfo.tow_order_no" class="ae-link-chip gray">{{
        linkInfo.tow_order_no
      }}</span>
      <span v-else class="ae-link-chip empty">无拖车单</span>
    </div>
    <div>
      <span class="ae-link-label">线索单号</span>
      <span v-if="linkInfo.lead_no" class="ae-link-chip gray">{{ linkInfo.lead_no }}</span>
      <span v-else class="ae-link-chip empty">无线索单</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ArchiveLinkInfo, ArchiveStep } from './types'

  defineOptions({ name: 'VehicleArchiveProgressHeader' })

  interface Props {
    /** 流程步骤列表。 */
    steps: ArchiveStep[]
    /** 当前步骤序号。 */
    currentStep: number
    /** 各步骤是否完成。 */
    stepComplete: boolean[]
    /** 车辆属地名称。 */
    hplxLabel: string
    /** 所有权类型名称。 */
    syqLabel: string
    /** 受理时间。 */
    acceptTime: string
    /** 关联业务单据信息。 */
    linkInfo: ArchiveLinkInfo
  }

  defineProps<Props>()

  const emit = defineEmits<{
    /** 切换到指定步骤。 */
    'change-step': [step: number]
  }>()
</script>
