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

    <!-- 列表区标题行 -->
    <div class="foa-list-header">
      <span class="foa-list-title"> 订单附件（{{ totalCount }} 种类型） </span>
      <div class="foa-list-actions">
        <!-- 管理模板 -->
        <ElButton @click="templateManagerVisible = true">
          <ArtSvgIcon icon="ri:star-line" class="mr-1" />
          管理模板（{{ templateCount }}）
        </ElButton>
        <!-- 一键签名 -->
        <ElButton type="primary" :disabled="!pendingList.length" @click="handleBatchSign">
          <ArtSvgIcon icon="ri:edit-line" class="mr-1" />
          一键签名
        </ElButton>
      </div>
    </div>

    <!-- 无附件 -->
    <div v-if="!totalCount" class="foa-empty">暂无附件</div>

    <!-- 附件列表 -->
    <div v-else class="foa-list">
      <div
        v-for="att in attachmentList"
        :key="att.id"
        class="foa-row"
        :class="{ 'foa-row--signed': isSigned(att) }"
      >
        <!-- 左侧：图标 + 名称 + 标签 -->
        <div class="foa-row-left">
          <div class="foa-file-icon" :class="{ 'foa-file-icon--signed': isSigned(att) }">
            <ArtSvgIcon
              icon="ri:file-text-line"
              class="foa-file-svg"
              :class="isSigned(att) ? 'foa-file-svg--signed' : 'foa-file-svg--plain'"
            />
          </div>
          <div class="foa-row-info">
            <div class="foa-row-name">{{ att.name || `附件 ${att.id}` }}</div>
            <div class="foa-row-sub">
              <template v-if="isSigned(att)">
                <span class="foa-sign-time"> 签名人：{{ att.sign_by || '-' }} </span>
                <span class="foa-sign-time"> 签署时间：{{ att.sign_time }} </span>
              </template>
              <template v-else>
                <span class="foa-sign-required" :style="signRequiredStyle(att)">
                  ● 需电子签名
                </span>
              </template>
            </div>
          </div>
        </div>

        <!-- 右侧：状态 + 操作 -->
        <div class="foa-row-right">
          <!-- unsigned（PDF 未生成）：仅显示徽章，无操作按钮 -->
          <template v-if="getStatus(att) === 'unsigned'">
            <span class="foa-badge foa-badge--unsigned">未生成</span>
          </template>

          <!-- uploaded_unsigned：待签名 -->
          <template v-else-if="getStatus(att) === 'uploaded_unsigned'">
            <span class="foa-badge foa-badge--pending">待签名</span>
            <ElButton
              size="small"
              plain
              class="foa-act-btn foa-act-btn--view"
              @click="openAttachPreview(att)"
            >
              <ArtSvgIcon icon="ri:eye-line" class="foa-act-icon" />查看
            </ElButton>
            <ElButton
              v-if="isTemplateAtt(att)"
              size="small"
              plain
              class="foa-act-btn foa-act-btn--neutral"
              :loading="downloadingAttachId === att.id"
              @click="handleDownloadTemplate(att)"
            >
              <ArtSvgIcon icon="ri:download-line" class="foa-act-icon" />下载模板
            </ElButton>
            <ElButton
              size="small"
              plain
              type="primary"
              class="foa-act-btn"
              :loading="uploadingAttachId === att.id"
              @click="triggerUploadAttach(att)"
            >
              <ArtSvgIcon icon="ri:upload-2-line" class="foa-act-icon" />上传签名附件
            </ElButton>
            <ElButton
              size="small"
              type="warning"
              class="foa-act-btn foa-act-btn--esign"
              @click="handleSingleSign(att)"
            >
              <ArtSvgIcon icon="ri:edit-line" class="foa-act-icon" />电子签名
            </ElButton>
          </template>

          <!-- signed：已签名 -->
          <template v-else>
            <span class="foa-badge foa-badge--signed">已签名</span>
            <ElButton
              size="small"
              plain
              class="foa-act-btn foa-act-btn--view"
              @click="openAttachPreview(att)"
            >
              <ArtSvgIcon icon="ri:eye-line" class="foa-act-icon" />查看
            </ElButton>
          </template>
        </div>
      </div>
    </div>

    <!-- 签名画布弹窗 -->
    <SignCanvasDialog
      v-if="canvasDialogVisible"
      v-model:visible="canvasDialogVisible"
      :mode="canvasMode"
      :attachment-id="signingAttachId ?? undefined"
      :attachment-ids="signingAttachIds"
      :attachment-name="signingAttachName"
      :order-id="props.orderId"
      @signed="handleSigned"
    />

    <!-- 模板管理弹窗 -->
    <SignTemplateManagerDialog
      v-if="templateManagerVisible"
      v-model:visible="templateManagerVisible"
    />

    <OrderAttachmentPreviewDialog
      v-model="attachPreviewVisible"
      :attachments="attachmentList"
      :initial-index="attachPreviewInitialIndex"
      :order-id="props.orderId"
      ref="attachPreviewRef"
      @signed="handlePreviewSigned"
    />
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import MD5 from 'crypto-js/md5'
  import { useUserStore } from '@/store/modules/user'
  import { uploadFileGetUrl } from '@/api/upload'
  import { fetchUploadSignedAttachment, buildOrderAttachmentPdfUrl } from '@/api/recycle/order'
  import { fetchSignTemplates } from '@/api/recycle/sign'
  import type { OrderAttachment, OrderDetail } from '@/types/recycle/order'
  import { resolveVehicleAttachments } from '@/types/recycle/order'
  import SignCanvasDialog from './sign-canvas-dialog.vue'
  import SignTemplateManagerDialog from './sign-template-manager-dialog.vue'
  import OrderAttachmentPreviewDialog from './order-attachment-preview-dialog.vue'

  const props = defineProps<{
    detail: Partial<OrderDetail>
    /** 与详情弹窗批次车辆切换条联动 */
    selectedVehicleIdx?: number
    orderId?: number
  }>()

  const emit = defineEmits<{
    (e: 'signed'): void
  }>()

  const attachmentList = computed(() =>
    resolveVehicleAttachments(props.detail, props.selectedVehicleIdx ?? 0)
  )

  // ===== 附件状态判断 =====
  // 'unsigned'：未生成文件
  // 'uploaded_unsigned'：已上传文件但未签名
  // 'signed'：已签名
  type AttachStatus = 'unsigned' | 'uploaded_unsigned' | 'signed'

  function getStatus(att: OrderAttachment): AttachStatus {
    if (att.sign_status === 1 || att.signed) return 'signed'
    if (att.download_url) return 'uploaded_unsigned'
    return 'unsigned'
  }

  function isSigned(att: OrderAttachment): boolean {
    return getStatus(att) === 'signed'
  }

  function isTemplateAtt(att: OrderAttachment) {
    return att.attachment_type === 'template'
  }

  // "需电子签名"标签颜色：已签=绿色，待签=橙色，未生成=灰色
  function signRequiredStyle(att: OrderAttachment) {
    const s = getStatus(att)
    if (s === 'signed') return { color: '#52C41A' }
    if (s === 'uploaded_unsigned') return { color: '#FA8C16' }
    return { color: '#BFBFBF' }
  }

  // ===== 统计 =====
  const totalCount = computed(() => attachmentList.value.length)
  const needSignCount = computed(() => totalCount.value)
  const signedCount = computed(() => attachmentList.value.filter((a) => isSigned(a)).length)
  const pendingList = computed(
    () => attachmentList.value.filter((a) => getStatus(a) === 'uploaded_unsigned') ?? []
  )
  const progressPct = computed(() =>
    needSignCount.value ? Math.round((signedCount.value / needSignCount.value) * 100) : 0
  )

  // ===== 模板数量（用于按钮显示） =====
  const templateCount = ref(0)

  async function refreshTemplateCount() {
    try {
      const list = await fetchSignTemplates()
      templateCount.value = list.length
    } catch {
      templateCount.value = 0
    }
  }

  onMounted(refreshTemplateCount)

  // ===== 签名画布弹窗 =====
  const canvasDialogVisible = ref(false)
  const canvasMode = ref<'single' | 'attachments'>('single')
  const signingAttachId = ref<number | null>(null)
  const signingAttachIds = ref<number[]>([])
  const signingAttachName = ref('')

  function handleSingleSign(att: OrderAttachment) {
    canvasMode.value = 'single'
    signingAttachId.value = att.id ?? null
    signingAttachIds.value = []
    signingAttachName.value = att.name || `附件 ${att.id}`
    canvasDialogVisible.value = true
  }

  function handleBatchSign() {
    const ids = pendingList.value.map((a) => a.id!).filter(Boolean)
    if (!ids.length) return
    canvasMode.value = 'attachments'
    signingAttachId.value = null
    signingAttachIds.value = ids
    signingAttachName.value = ''
    canvasDialogVisible.value = true
  }

  function handleSigned() {
    emit('signed')
    refreshTemplateCount()
    attachPreviewRef.value?.refreshCurrentPreview()
  }

  // ===== 模板管理弹窗 =====
  const templateManagerVisible = ref(false)

  watch(templateManagerVisible, (v) => {
    if (!v) refreshTemplateCount()
  })

  // ===== 附件列表预览弹窗 =====
  const attachPreviewVisible = ref(false)
  const attachPreviewInitialIndex = ref(0)
  const attachPreviewRef = ref<InstanceType<typeof OrderAttachmentPreviewDialog> | null>(null)

  function openAttachPreview(att: OrderAttachment) {
    const idx = attachmentList.value.findIndex((a) => a.id === att.id)
    attachPreviewInitialIndex.value = idx >= 0 ? idx : 0
    attachPreviewVisible.value = true
  }

  function handlePreviewSigned() {
    emit('signed')
    attachPreviewRef.value?.refreshCurrentPreview()
  }

  // ===== 下载模板 / 上传签名附件 =====
  const userStore = useUserStore()
  const downloadingAttachId = ref<number | null>(null)
  const uploadingAttachId = ref<number | null>(null)

  async function handleDownloadTemplate(att: OrderAttachment) {
    const attachId = att.id
    if (!attachId) {
      ElMessage.warning('该附件缺少ID')
      return
    }
    downloadingAttachId.value = attachId
    try {
      const rawToken = (userStore.accessToken || '').replace(/^Bearer\s+/i, '')
      const debugToken = rawToken ? MD5(rawToken).toString() : ''
      const url = buildOrderAttachmentPdfUrl(attachId, {
        mergeSign: false,
        debugToken
      })
      const res = await fetch(url, {
        headers: {
          'Authori-zation': `Bearer ${userStore.accessToken}`
        }
      })
      if (!res.ok) throw new Error('下载失败')
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${att.name || '模板'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      ElMessage.error('下载失败，请稍后重试')
    } finally {
      downloadingAttachId.value = null
    }
  }

  function triggerUploadAttach(att: OrderAttachment) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) void doUploadSignedAttach(att, file)
    }
    input.click()
  }

  async function doUploadSignedAttach(att: OrderAttachment, file: File) {
    if (!att.id) {
      ElMessage.warning('该附件缺少ID')
      return
    }
    uploadingAttachId.value = att.id
    try {
      const fileUrl = await uploadFileGetUrl(file, { showSuccessMessage: false })
      await fetchUploadSignedAttachment({ attach_id: att.id, upload_url: fileUrl })
      emit('signed')
      attachPreviewRef.value?.refreshCurrentPreview()
    } catch {
      // 错误提示由 http / upload 层处理
    } finally {
      uploadingAttachId.value = null
    }
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
    font-size: 13px;

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

  .foa-list-actions {
    display: flex;
    gap: 8px;
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
    border: 1px solid #eee;
    border-radius: 8px;
    transition: background 0.15s;

    &:hover {
      background: #f0f0f0;
    }

    &--signed:hover {
      background: #f6ffed;
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

    &--unsigned {
      color: #8c8c8c;
      background: #f5f5f5;
    }
  }

  /* ===== 行内操作按钮（Element Plus + 设计稿色） ===== */
  .foa-row-right :deep(.foa-act-btn) {
    height: 28px;
    padding: 0 10px;
    margin-left: 0;
    font-size: 12px;
    border-radius: 4px;
  }

  .foa-row-right :deep(.foa-act-btn--view) {
    color: #1890ff;
    border-color: #91d5ff;

    &:hover,
    &:focus {
      color: #1890ff;
      background: #e6f7ff;
      border-color: #69c0ff;
    }
  }

  .foa-row-right :deep(.foa-act-btn--neutral) {
    color: #434343;
    border-color: #d9d9d9;

    &:hover,
    &:focus {
      color: #262626;
      background: #fafafa;
      border-color: #bfbfbf;
    }
  }

  .foa-row-right :deep(.foa-act-btn--esign) {
    color: #fff;
    background: #fa8c16;
    border-color: #fa8c16;

    &:hover,
    &:focus {
      color: #fff;
      background: #d46b08;
      border-color: #d46b08;
    }
  }

  .foa-act-icon {
    margin-right: 4px;
    font-size: 14px;
  }
</style>
