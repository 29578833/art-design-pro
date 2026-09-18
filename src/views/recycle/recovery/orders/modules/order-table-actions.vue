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
    <button
      v-if="pendingReview"
      v-auth="AUTH_SCRAP_ORDER_AUDIT_APPROVE"
      type="button"
      class="order-action-btn primary"
      @click="emit('approve', row)"
    >
      <ArtSvgIcon icon="ri:checkbox-circle-line" class="order-action-icon" />
      <span>通过</span>
    </button>
    <button
      v-if="pendingReview"
      v-auth="AUTH_SCRAP_ORDER_AUDIT_REJECT"
      type="button"
      class="order-action-btn danger"
      @click="emit('reject', row)"
    >
      <ArtSvgIcon icon="ri:close-circle-line" class="order-action-icon" />
      <span>驳回</span>
    </button>
  </div>
</template>

<script setup lang="ts">
  import type { RecycleOrder } from '@/types/recycle/recovery/orders/order'
  import {
    isLeadAssigned,
    isLeadOrder,
    isLeadPending,
    isLeadViewed,
    isPendingFormalReview,
    isTowOrder
  } from '@/types/recycle/recovery/orders/order'
  import {
    AUTH_SCRAP_ORDER_AUDIT_APPROVE,
    AUTH_SCRAP_ORDER_AUDIT_REJECT
  } from '@/constants/auth'

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
  const pendingReview = computed(() => isPendingFormalReview(props.row))

  const visibleActions = computed<ActionItem[]>(() => {
    const row = props.row
    const actions: ActionItem[] = []
    const isPending = pendingReview.value

    if (!isPending) {
      actions.push({
        key: 'view',
        label: '查看',
        icon: 'ri:eye-line',
        variant: 'default',
        onClick: () => emit('view', row)
      })
    }

    // 客户/员工订单待审核 status=1（通过/驳回由模板 v-auth 控制）
    if (isPending) {
      actions.push({
        key: 'audit',
        label: '审核详情',
        icon: 'ri:file-list-3-line',
        variant: 'ghost',
        onClick: () => emit('audit', row)
      })
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

    // 正式回收订单：审核通过（status=2）或审核驳回（status=-1）可编辑
    if (
      (row.order_type === 'customer_order' || row.order_type === 'staff_order') &&
      (row.status === 2 || row.status === -1)
    ) {
      actions.push({
        key: 'edit',
        label: '编辑订单',
        icon: 'ri:edit-line',
        variant: 'ghost',
        onClick: () => emit('edit', row)
      })
    }

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

<!-- 操作按钮样式见 @/assets/styles/custom/order-table-actions.scss（全局引入） -->
