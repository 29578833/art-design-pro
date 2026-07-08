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
        label: row.orderType === 'lead' ? '查看' : '查看',
        icon: 'ri:eye-line',
        variant: 'default',
        onClick: () => emit('view', row)
      }
    ]

    // 客户订单待审核
    if (row.orderType === 'customer' && row.status === 'pending_review') {
      actions.push(
        {
          key: 'audit',
          label: '审核详情',
          icon: 'ri:file-list-3-line',
          variant: 'ghost',
          onClick: () => emit('audit', row)
        },
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
    if (row.orderType === 'lead') {
      if (row.status === 'pending') {
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
      } else if (row.status === 'assigned') {
        actions.push({
          key: 'create-order',
          label: '创建订单',
          icon: 'ri:add-line',
          variant: 'primary',
          onClick: () => emit('create-order', row)
        })
      } else if (row.status === 'viewed') {
        actions.push({
          key: row.linkedOrderId ? 'edit' : 'create-order',
          label: row.linkedOrderId ? '编辑订单' : '创建订单',
          icon: row.linkedOrderId ? 'ri:edit-line' : 'ri:add-line',
          variant: 'primary',
          onClick: () => (row.linkedOrderId ? emit('edit', row) : emit('create-order', row))
        })
      }
      return actions
    }

    // 正式回收订单
    if (row.orderType === 'customer' || row.orderType === 'staff') {
      actions.push({
        key: 'edit',
        label: '编辑',
        icon: 'ri:edit-line',
        variant: 'ghost',
        onClick: () => emit('edit', row)
      })
      return actions
    }

    // 拖车订单
    if (row.orderType === 'towing') {
      if (row.status === 'pending_dispatch') {
        actions.push({
          key: 'assign-driver',
          label: '指派司机',
          icon: 'ri:truck-line',
          variant: 'primary',
          onClick: () => emit('assign-driver', row)
        })
      } else if (row.status === 'pending_towing') {
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
      } else if (row.status === 'towing') {
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

<style scoped lang="scss">
  .order-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    justify-content: center;
  }

  .order-action-btn {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 6px;
    transition: all 0.2s;

    &.default {
      color: var(--art-gray-700);
      background: #fff;
      border-color: var(--art-card-border);

      &:hover {
        color: #1677ff;
        background: #f0f7ff;
        border-color: #91caff;
      }
    }

    &.ghost {
      color: #1677ff;
      background: #f0f7ff;
      border-color: #91caff;

      &:hover {
        background: #e6f4ff;
      }
    }

    &.primary {
      color: #fff;
      background: #1677ff;
      border-color: #1677ff;

      &:hover {
        background: #0958d9;
        border-color: #0958d9;
      }
    }

    &.success {
      color: #fff;
      background: #52c41a;
      border-color: #52c41a;

      &:hover {
        background: #389e0d;
        border-color: #389e0d;
      }
    }

    &.danger {
      color: #ff4d4f;
      background: #fff;
      border-color: #ff4d4f;

      &:hover {
        background: #fff1f0;
      }
    }
  }

  .order-action-icon {
    font-size: 13px;
  }
</style>
