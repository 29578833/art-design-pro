<template>
  <FormalOrderBasicTab
    :detail="detail"
    :selected-vehicle-idx="selectedVehicleIdx"
    :hide-summary="hideSummary"
  />
</template>

<script setup lang="ts">
  import type { OrderDetail } from '@/types/recycle/order'
  import FormalOrderBasicTab from './formal-order-basic-tab.vue'

  defineOptions({ name: 'FormalOrderDetailViewPanel' })

  withDefaults(
    defineProps<{
      detail: Partial<OrderDetail>
      selectedVehicleIdx: number
      hideSummary?: boolean
    }>(),
    { hideSummary: false }
  )
</script>
