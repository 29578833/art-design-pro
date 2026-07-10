<template>
  <ElDialog
    v-model="dialogVisible"
    width="560px"
    align-center
    destroy-on-close
    :show-close="false"
    class="bos-dialog"
    style="padding: 0 0 16px !important"
  >
    <template #header>
      <div class="bos-header">
        <div class="bos-header-left">
          <ArtSvgIcon icon="ri:pen-nib-line" class="bos-header-icon" />
          <span class="bos-header-title">批量一键签名</span>
        </div>
        <button type="button" class="bos-close-btn" @click="dialogVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <div class="bos-body">
      <div class="bos-summary">
        <div class="bos-stat">
          <div class="bos-stat-num">{{ props.orderIds.length }}</div>
          <div class="bos-stat-label">订单数</div>
        </div>
        <div class="bos-stat-divider" />
        <div class="bos-stat">
          <div class="bos-stat-num amber">{{ pendingAttachHint }}</div>
          <div class="bos-stat-label">待签名附件</div>
        </div>
        <div class="bos-stat-divider" />
        <div class="bos-orders">
          <div class="bos-orders-label">涉及订单</div>
          <div class="bos-orders-tags">
            <span v-for="no in displayOrderNos.slice(0, 4)" :key="no" class="bos-tag">{{
              no
            }}</span>
            <span v-if="displayOrderNos.length > 4" class="bos-tag-more">
              +{{ displayOrderNos.length - 4 }}个
            </span>
          </div>
        </div>
      </div>

      <p class="bos-hint">签名将统一应用到所选订单的全部待签名附件</p>
    </div>

    <template #footer>
      <div class="bos-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :disabled="!props.orderIds.length" @click="openCanvas">
          <ArtSvgIcon icon="ri:pen-nib-line" class="mr-1" />
          开始签名
        </ElButton>
      </div>
    </template>
  </ElDialog>

  <SignCanvasDialog
    v-if="canvasVisible"
    v-model:visible="canvasVisible"
    mode="orders"
    :order-ids="props.orderIds"
    @signed="handleSigned"
  />
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import SignCanvasDialog from './sign-canvas-dialog.vue'

  interface Props {
    visible: boolean
    /** 选中的订单 ID */
    orderIds: number[]
    /** 订单编号展示（与 orderIds 顺序对应） */
    orderNos?: string[]
    /** 待签附件总数（有则展示，无则显示「全部」） */
    pendingAttachCount?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    orderNos: () => [],
    pendingAttachCount: undefined
  })

  const emit = defineEmits<{
    (e: 'update:visible', v: boolean): void
    (e: 'signed'): void
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  const canvasVisible = ref(false)

  const displayOrderNos = computed(() => {
    if (props.orderNos.length) return props.orderNos
    return props.orderIds.map(String)
  })

  const pendingAttachHint = computed(() => {
    if (typeof props.pendingAttachCount === 'number' && props.pendingAttachCount > 0) {
      return props.pendingAttachCount
    }
    return '全部'
  })

  function openCanvas() {
    if (!props.orderIds.length) {
      ElMessage.warning('请先选择订单')
      return
    }
    canvasVisible.value = true
  }

  function handleSigned() {
    emit('signed')
    dialogVisible.value = false
  }
</script>

<style lang="scss">
  .bos-dialog {
    .el-dialog__header {
      padding: 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .el-dialog__body {
      padding: 16px 20px;
    }

    .el-dialog__footer {
      padding: 0;
      background: #fafafa;
      border-top: 1px solid #f0f0f0;
    }
  }
</style>

<style scoped lang="scss">
  .bos-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
  }

  .bos-header-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .bos-header-icon {
    font-size: 16px;
    color: #1890ff;
  }

  .bos-header-title {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
  }

  .bos-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 16px;
    color: #8c8c8c;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 6px;

    &:hover {
      color: #262626;
      background: #f5f5f5;
    }
  }

  .bos-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .bos-summary {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 14px;
    background: #f5f8ff;
    border-radius: 8px;
  }

  .bos-stat {
    text-align: center;
  }

  .bos-stat-num {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.2;
    color: #1677ff;

    &.amber {
      color: #faad14;
    }
  }

  .bos-stat-label {
    margin-top: 2px;
    font-size: 11px;
    color: #8c8c8c;
  }

  .bos-stat-divider {
    width: 1px;
    height: 36px;
    background: #e5e7eb;
  }

  .bos-orders {
    flex: 1;
    min-width: 0;
  }

  .bos-orders-label {
    margin-bottom: 4px;
    font-size: 11px;
    color: #8c8c8c;
  }

  .bos-orders-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .bos-tag {
    padding: 2px 6px;
    font-size: 11px;
    color: #595959;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }

  .bos-tag-more {
    font-size: 11px;
    color: #bfbfbf;
  }

  .bos-hint {
    margin: 0;
    font-size: 12px;
    color: #8c8c8c;
  }

  .bos-footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 12px 20px;
  }
</style>
