<template>
  <div class="order-actions">
    <button
      v-for="action in visibleActions"
      :key="action.key"
      type="button"
      class="order-action-btn"
      :class="action.variant"
      @click="action.onClick"
    >
      <ArtSvgIcon v-if="action.icon" :icon="action.icon" class="order-action-icon" />
      <span>{{ action.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
  import type { RecycleOrder } from '@/types/recycle/order'
  import {
    isLeadAssigned,
    isLeadOrder,
    isLeadPending,
    isLeadViewed,
    isTowOrder
  } from '@/types/recycle/order'

  export interface OrderActionEvent {
    (e: 'view', row: RecycleOrder): void
    (e: 'audit', row: RecycleOrder): void
    (e: 'approve', row: RecycleOrder): void
    (e: 'reject', row: RecycleOrder): void
    (e: 'assign-lead', row: RecycleOrder): void
    (e: 'create-order', row: RecycleOrder): void
    (e: 'edit', row: RecycleOrder): void
    (e: 'assign-driver', row: RecycleOrder): void
    (e: 'contact-driver', row: RecycleOrder): void
    (e: 'reassign-driver', row: RecycleOrder): void
    (e: 'complete-tow', row: RecycleOrder): void
  }

  interface ActionItem {
    key: string
    label: string
    icon?: string
    variant: 'default' | 'primary' | 'success' | 'danger' | 'ghost'
    onClick: () => void
  }

  const props = defineProps<{ row: RecycleOrder }>()
  const emit = defineEmits<OrderActionEvent>()

  const visibleActions = computed<ActionItem[]>(() => {
    const row = props.row
    const actions: ActionItem[] = [
      {
        key: 'view',
        label: '查看',
        icon: 'ri:eye-line',
        variant: 'default',
        onClick: () => emit('view', row)
      }
    ]

    // 客户订单待审核 status=1
    // row.order_type === 'customer_order' &&
    if (['customer_order', 'staff_order'].includes(row.order_type) && row.status === 1) {
      actions.push(
        // {
        //   key: 'audit',
        //   label: '审核详情',
        //   icon: 'ri:file-list-3-line',
        //   variant: 'ghost',
        //   onClick: () => emit('audit', row)
        // },
        {
          key: 'approve',
          label: '通过',
          icon: 'ri:checkbox-circle-line',
          variant: 'primary',
          onClick: () => emit('approve', row)
        },
        {
          key: 'reject',
          label: '驳回',
          icon: 'ri:close-circle-line',
          variant: 'danger',
          onClick: () => emit('reject', row)
        }
      )
      return actions
    }

    // 线索订单
    if (isLeadOrder(row)) {
      if (isLeadPending(row)) {
        actions.push(
          {
            key: 'assign-lead',
            label: '指派跟进人',
            icon: 'ri:user-shared-line',
            variant: 'ghost',
            onClick: () => emit('assign-lead', row)
          },
          {
            key: 'create-order',
            label: '创建订单',
            icon: 'ri:add-line',
            variant: 'primary',
            onClick: () => emit('create-order', row)
          }
        )
      } else if (isLeadAssigned(row)) {
        actions.push({
          key: 'create-order',
          label: '创建订单',
          icon: 'ri:add-line',
          variant: 'primary',
          onClick: () => emit('create-order', row)
        })
      } else if (isLeadViewed(row)) {
        actions.push({
          key: 'create-order',
          label: '创建订单',
          icon: 'ri:add-line',
          variant: 'primary',
          onClick: () => emit('create-order', row)
        })
      }
      return actions
    }

    // 正式回收订单
    // if (row.order_type === 'customer_order' || row.order_type === 'staff_order') {
    //   actions.push({
    //     key: 'edit',
    //     label: '编辑',
    //     icon: 'ri:edit-line',
    //     variant: 'ghost',
    //     onClick: () => emit('edit', row)
    //   })
    //   return actions
    // }

    // 拖车订单 status: 1待派单 2待拖车 3拖车中 4已完成
    if (isTowOrder(row)) {
      if (row.status === 1) {
        actions.push({
          key: 'assign-driver',
          label: '指派司机',
          icon: 'ri:truck-line',
          variant: 'primary',
          onClick: () => emit('assign-driver', row)
        })
      } else if (row.status === 2) {
        actions.push(
          {
            key: 'contact-driver',
            label: '联系司机',
            icon: 'ri:phone-line',
            variant: 'ghost',
            onClick: () => emit('contact-driver', row)
          },
          {
            key: 'reassign-driver',
            label: '重新指派',
            icon: 'ri:refresh-line',
            variant: 'default',
            onClick: () => emit('reassign-driver', row)
          }
        )
      } else if (row.status === 3) {
        actions.push(
          {
            key: 'contact-driver',
            label: '联系司机',
            icon: 'ri:phone-line',
            variant: 'ghost',
            onClick: () => emit('contact-driver', row)
          },
          {
            key: 'complete-tow',
            label: '确认完成',
            icon: 'ri:check-double-line',
            variant: 'success',
            onClick: () => emit('complete-tow', row)
          }
        )
      }
    }

    return actions
  })
</script>

<!-- 操作按钮样式见 ../orders.scss -->
