<template>
  <div class="foa-root">
    <!-- 电子签名进度卡 -->
    <div class="foa-progress-card">
      <div class="foa-progress-header">
        <div class="foa-progress-title">
          <ArtSvgIcon icon="ri:pen-nib-line" class="foa-progress-title-icon" />
          电子签名进度
        </div>
        <span class="foa-progress-count">{{ signedCount }} / {{ needSignCount }} 已签名</span>
      </div>
      <div class="foa-progress-track">
        <div class="foa-progress-fill" :style="{ width: `${progressPct}%` }" />
      </div>
      <p v-if="signedCount < needSignCount" class="foa-progress-tip foa-progress-tip--warn">
        <ArtSvgIcon icon="ri:error-warning-line" />
        还有 {{ needSignCount - signedCount }} 份文件需要电子签名
      </p>
      <p v-else-if="needSignCount > 0" class="foa-progress-tip foa-progress-tip--ok">
        <ArtSvgIcon icon="ri:checkbox-circle-line" />
        所有需签名文件已完成签署
      </p>
    </div>

    <!-- 列表区标题 + 一键签名 -->
    <div class="foa-list-header">
      <span class="foa-list-title"> 订单附件（{{ totalCount }} 种类型） </span>
      <ElButton v-if="pendingSignList.length" size="small" type="primary" @click="handleBatchSign">
        <ArtSvgIcon icon="ri:zap-line" class="mr-1" />
        一键签名
      </ElButton>
    </div>

    <!-- 附件列表 -->
    <div v-if="!totalCount" class="foa-empty">暂无附件</div>

    <div v-else class="foa-list">
      <div
        v-for="att in props.detail.attachments"
        :key="att.id"
        class="foa-row"
        :class="{ 'foa-row--signed': isAttSigned(att) }"
      >
        <!-- 左侧：图标 + 名称 -->
        <div class="foa-row-left">
          <div class="foa-file-icon" :class="{ 'foa-file-icon--signed': isAttSigned(att) }">
            <ArtSvgIcon
              icon="ri:file-text-line"
              class="foa-file-svg"
              :class="isAttSigned(att) ? 'foa-file-svg--signed' : 'foa-file-svg--plain'"
            />
          </div>
          <div class="foa-row-info">
            <div class="foa-row-name">{{ att.type_name || `附件 ${att.id}` }}</div>
            <div class="foa-row-sub">
              <!-- 需要签名的标记 -->
              <span class="foa-sign-required" :style="signRequiredStyle(att)"> ● 需电子签名 </span>
              <span v-if="att.sign_time && isAttSigned(att)" class="foa-sign-time">
                签署时间：{{ att.sign_time }}
              </span>
            </div>
          </div>
        </div>

        <!-- 右侧：状态 + 操作 -->
        <div class="foa-row-right">
          <!-- 状态徽章 -->
          <span v-if="!isAttSigned(att)" class="foa-badge foa-badge--pending">待签名</span>
          <span v-else class="foa-badge foa-badge--signed">已签名</span>

          <!-- 查看按钮 -->
          <button
            v-if="att.file_url"
            type="button"
            class="foa-btn foa-btn--view"
            @click="handlePreview(att.file_url!)"
          >
            <ArtSvgIcon icon="ri:download-line" class="foa-btn-icon" />
            查看
          </button>

          <!-- 签名按钮（仅待签名显示） -->
          <button
            v-if="!isAttSigned(att)"
            type="button"
            class="foa-btn foa-btn--sign"
            @click="openSign(att)"
          >
            <ArtSvgIcon icon="ri:pen-nib-line" class="foa-btn-icon" />
            签名
          </button>

          <!-- 已签名标记 -->
          <span v-if="isAttSigned(att)" class="foa-signed-check">
            <ArtSvgIcon icon="ri:checkbox-circle-line" />
            已签名
          </span>
        </div>
      </div>
    </div>

    <!-- 签名弹窗 -->
    <FormalOrderSignDialog
      v-if="signDialogVisible"
      v-model:visible="signDialogVisible"
      :attachment="signingAttachment"
      @signed="handleSigned"
    />

    <!-- 文件预览 -->
    <ElDialog v-model="previewVisible" width="80vw" align-center destroy-on-close title="文件预览">
      <div class="foa-preview-wrap">
        <iframe v-if="previewUrl" :src="previewUrl" class="foa-preview-frame" />
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { OrderAttachment, OrderDetail } from '@/types/recycle/order'
  import FormalOrderSignDialog from './formal-order-sign-dialog.vue'

  const props = defineProps<{
    detail: Partial<OrderDetail>
  }>()

  const emit = defineEmits<{
    (e: 'signed', attachmentId: number): void
  }>()

  // ========== 统计 ==========
  const totalCount = computed(() => props.detail.attachments?.length ?? 0)

  const needSignCount = computed(() => totalCount.value)

  const signedCount = computed(
    () => props.detail.attachments?.filter((a) => isAttSigned(a)).length ?? 0
  )

  const pendingSignList = computed(
    () => props.detail.attachments?.filter((a) => !isAttSigned(a)) ?? []
  )

  const progressPct = computed(() =>
    needSignCount.value ? Math.round((signedCount.value / needSignCount.value) * 100) : 0
  )

  function isAttSigned(att: OrderAttachment): boolean {
    return att.sign_status === 1 || att.signed === true
  }

  // 需签名的行：状态文字颜色与签名状态一致
  function signRequiredStyle(att: OrderAttachment) {
    if (isAttSigned(att)) return { color: '#52C41A' }
    return { color: '#FA8C16' }
  }

  // ========== 签名弹窗 ==========
  const signDialogVisible = ref(false)
  const signingAttachment = ref<OrderAttachment | null>(null)
  const batchQueue = ref<OrderAttachment[]>([])

  function openSign(att: OrderAttachment) {
    signingAttachment.value = att
    signDialogVisible.value = true
  }

  function handleBatchSign() {
    if (!pendingSignList.value.length) return
    batchQueue.value = [...pendingSignList.value]
    openSign(batchQueue.value[0])
  }

  function handleSigned(attachmentId: number) {
    emit('signed', attachmentId)
    const remaining = batchQueue.value.filter((a) => a.id !== attachmentId && !isAttSigned(a))
    batchQueue.value = remaining
    if (remaining.length) {
      openSign(remaining[0])
    } else {
      batchQueue.value = []
    }
  }

  // ========== 文件预览 ==========
  const previewVisible = ref(false)
  const previewUrl = ref('')

  function handlePreview(url: string) {
    previewUrl.value = url
    previewVisible.value = true
  }
</script>

<style scoped lang="scss">
  .foa-root {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ===== 签名进度卡 ===== */
  .foa-progress-card {
    padding: 14px 16px;
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 8px;
  }

  .foa-progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .foa-progress-title {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
    color: #1890ff;
  }

  .foa-progress-title-icon {
    font-size: 15px;
  }

  .foa-progress-count {
    font-size: 12px;
    color: #595959;
  }

  .foa-progress-track {
    height: 6px;
    overflow: hidden;
    background: #d0e8f7;
    border-radius: 6px;
  }

  .foa-progress-fill {
    min-width: 2px;
    height: 100%;
    background: #1890ff;
    border-radius: 6px;
    transition: width 0.4s ease;
  }

  .foa-progress-tip {
    display: flex;
    gap: 4px;
    align-items: center;
    margin-top: 8px;
    font-size: 12px;

    &--warn {
      color: #fa8c16;
    }

    &--ok {
      color: #52c41a;
    }
  }

  /* ===== 列表标题行 ===== */
  .foa-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .foa-list-title {
    font-size: 13px;
    font-weight: 600;
    color: #262626;
  }

  .foa-empty {
    padding: 32px 0;
    font-size: 13px;
    color: #bfbfbf;
    text-align: center;
  }

  /* ===== 附件列表 ===== */
  .foa-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .foa-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: #f8f9fb;
    border-radius: 8px;
    transition: background 0.15s;

    &:hover {
      background: #f0f0f0;
    }

    &--signed {
      background: #f8f9fb;
    }
  }

  .foa-row-left {
    display: flex;
    flex: 1;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .foa-file-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #fff;
    border-radius: 6px;

    &--signed {
      background: #f6ffed;
    }
  }

  .foa-file-svg {
    font-size: 18px;

    &--plain {
      color: #bfbfbf;
    }

    &--signed {
      color: #52c41a;
    }
  }

  .foa-row-info {
    min-width: 0;
  }

  .foa-row-name {
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    color: #262626;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .foa-row-sub {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 2px;
  }

  .foa-sign-required {
    font-size: 11px;
  }

  .foa-sign-time {
    font-size: 11px;
    color: #8c8c8c;
  }

  /* ===== 右侧操作 ===== */
  .foa-row-right {
    display: flex;
    flex-shrink: 0;
    gap: 6px;
    align-items: center;
    margin-left: 12px;
  }

  /* ===== 状态徽章 ===== */
  .foa-badge {
    padding: 1px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;

    &--signed {
      color: #52c41a;
      background: #f6ffed;
    }

    &--pending {
      color: #fa8c16;
      background: #fff7e6;
    }
  }

  /* ===== 按钮 ===== */
  .foa-btn {
    display: inline-flex;
    gap: 3px;
    align-items: center;
    padding: 3px 10px;
    font-size: 12px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.15s;

    &--view {
      color: #595959;
      background: #fff;
      border: 1px solid #d9d9d9;

      &:hover {
        background: #f5f5f5;
      }
    }

    &--sign {
      color: #fff;
      background: #fa8c16;
      border: 1px solid transparent;

      &:hover {
        background: #d46b08;
      }
    }
  }

  .foa-btn-icon {
    font-size: 12px;
  }

  /* ===== 已签名 check ===== */
  .foa-signed-check {
    display: inline-flex;
    gap: 3px;
    align-items: center;
    font-size: 12px;
    color: #52c41a;
  }

  /* ===== 预览 ===== */
  .foa-preview-wrap {
    height: 70vh;
  }

  .foa-preview-frame {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 4px;
  }
</style>
