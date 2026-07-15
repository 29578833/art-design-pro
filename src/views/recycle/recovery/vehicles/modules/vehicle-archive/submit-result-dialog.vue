<template>
  <ElDialog v-model="visible" title="提交成功" width="640px" align-center append-to-body>
    <ElAlert
      type="success"
      :closable="false"
      show-icon
      :title="`${result?.vin || '—'} · ${result?.plate_no || '—'} 档案已成功提交至商务部`"
    />
    <ElDescriptions :column="2" border style="margin-top: 16px">
      <ElDescriptionsItem label="车架号">{{ result?.vin || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="车牌号">{{ result?.plate_no || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所有人">{{ result?.owner_name || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="联系电话">{{ result?.owner_phone || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="提交时间">{{ result?.submit_time || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="流水号">{{ result?.djid || '—' }}</ElDescriptionsItem>
    </ElDescriptions>
    <template #footer>
      <ElButton @click="visible = false">关闭</ElButton>
      <ElButton type="primary" @click="emit('fetch-archive')">抓取车辆档案信息</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { AcceptSubmitResult } from '@/types/recycle/accept'

  defineOptions({ name: 'VehicleArchiveSubmitResultDialog' })

  interface Props {
    /** 提交结果详情。 */
    result: AcceptSubmitResult | null
  }

  defineProps<Props>()

  const visible = defineModel<boolean>('visible', { required: true })

  const emit = defineEmits<{
    /** 抓取商务部车辆档案。 */
    'fetch-archive': []
  }>()
</script>
