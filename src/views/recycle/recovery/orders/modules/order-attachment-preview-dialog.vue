<template>
  <ElDialog
    v-model="dialogVisible"
    width="1000px"
    align-center
    destroy-on-close
    :show-close="false"
    :fullscreen="isDialogFullscreen"
    class="oap-dialog"
    append-to-body
    @opened="onOpened"
    @closed="onClosed"
  >
    <!-- <template #header>
      <div class="oap-header">
        <span class="oap-header-title">附件列表</span>
        <button type="button" class="oap-close-btn" @click="dialogVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template> -->

    <div class="oap-layout">
      <!-- 左侧附件列表 -->
      <aside class="oap-sidebar">
        <div class="oap-sidebar-head">
          <div class="oap-sidebar-title">附件列表</div>
          <div class="oap-sidebar-count">{{ attachments.length }} 份文件</div>
        </div>
        <div class="oap-sidebar-list">
          <button
            v-for="(att, idx) in attachments"
            :key="att.id ?? idx"
            type="button"
            class="oap-sidebar-item"
            :class="{ 'oap-sidebar-item--active': currentPreviewIndex === idx }"
            @click="goToPreview(idx)"
          >
            <div
              class="oap-sidebar-icon"
              :class="isSigned(att) ? 'oap-sidebar-icon--signed' : 'oap-sidebar-icon--pending'"
            >
              <ArtSvgIcon icon="ri:file-text-line" />
            </div>
            <div class="oap-sidebar-info">
              <div class="oap-sidebar-name">{{ att.name || `附件 ${att.id}` }}</div>
              <div
                class="oap-sidebar-status"
                :class="
                  isSigned(att) ? 'oap-sidebar-status--signed' : 'oap-sidebar-status--pending'
                "
              >
                {{ isSigned(att) ? '已签名' : '待签名' }}
              </div>
            </div>
          </button>
        </div>
      </aside>

      <!-- 右侧预览 -->
      <div v-if="currentPreviewAtt" class="oap-main">
        <div class="oap-main-head">
          <div class="oap-main-head-left">
            <span class="oap-main-title">{{
              currentPreviewAtt.name || `附件 ${currentPreviewAtt.id}`
            }}</span>
            <span
              class="oap-status-pill"
              :class="
                isSigned(currentPreviewAtt) ? 'oap-status-pill--signed' : 'oap-status-pill--pending'
              "
            >
              {{ isSigned(currentPreviewAtt) ? '已签名' : '待签名' }}
            </span>
          </div>
          <div class="oap-main-head-right">
            <div class="oap-mode-toggle">
              <button
                type="button"
                class="oap-mode-btn"
                :class="{ 'oap-mode-btn--active': previewMode === 'sign' }"
                @click="switchPreviewMode('sign')"
              >
                <ArtSvgIcon icon="ri:eye-line" class="oap-mode-icon" />
                电子签名附件预览
              </button>
              <button
                type="button"
                class="oap-mode-btn"
                :class="{ 'oap-mode-btn--active': previewMode === 'upload' }"
                @click="switchPreviewMode('upload')"
              >
                <ArtSvgIcon icon="ri:upload-2-line" class="oap-mode-icon" />
                上传签名附件预览
              </button>
            </div>
            <ElButton
              v-if="showEsignAction"
              size="small"
              type="warning"
              class="oap-action-btn"
              @click="openEsignDialog"
            >
              <ArtSvgIcon icon="ri:edit-line" class="oap-action-icon" />电子签名
            </ElButton>
            <ElButton
              v-if="showUploadAction"
              size="small"
              plain
              type="primary"
              class="oap-action-btn"
              :loading="uploadingAttachId === currentPreviewAtt?.id"
              @click="triggerUploadAttach"
            >
              <ArtSvgIcon icon="ri:upload-2-line" class="oap-action-icon" />上传签名附件
            </ElButton>
            <div class="oap-head-actions">
              <button
                type="button"
                class="oap-icon-btn"
                title="全屏"
                @click="toggleDialogFullscreen"
              >
                <ArtSvgIcon
                  :icon="isDialogFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'"
                />
              </button>
              <button
                type="button"
                class="oap-icon-btn"
                title="关闭"
                @click="dialogVisible = false"
              >
                <ArtSvgIcon icon="ri:close-line" />
              </button>
            </div>
          </div>
        </div>

        <div v-loading="previewLoading" class="oap-body">
          <div v-if="currentPreviewUrl" class="oap-doc-wrap">
            <iframe
              v-if="isPdf(currentPreviewUrl)"
              :src="currentPreviewUrl"
              class="oap-doc-iframe"
              title="附件预览"
            />
            <img
              v-else-if="isImage(currentPreviewUrl)"
              :src="currentPreviewUrl"
              class="oap-doc-image"
              alt="附件预览"
            />
            <div v-else class="oap-doc-fallback">
              <ArtSvgIcon icon="ri:file-text-line" class="oap-doc-fallback-icon" />
              <p>该文件类型暂不支持在线预览</p>
            </div>
          </div>
          <div v-else class="oap-doc-empty">
            <ArtSvgIcon icon="ri:file-text-line" class="oap-doc-empty-icon" />
            <p>{{ previewMode === 'upload' ? '暂无上传签名文件' : '暂无预览内容' }}</p>
          </div>

          <!-- 已签信息 -->
          <!-- <template v-if="isSigned(currentPreviewAtt) && previewMode === 'sign'">
            <div class="oap-sign-area">
              <div class="oap-sign-block">
                <div class="oap-sign-label">甲方签署</div>
                <div class="oap-sign-image-wrap">
                  <img
                    v-if="currentPreviewAtt.sign_url"
                    :src="currentPreviewAtt.sign_url"
                    class="oap-sign-image"
                    alt="签名"
                  />
                  <div class="oap-sign-badge">
                    <ArtSvgIcon icon="ri:check-line" />
                  </div>
                </div>
                <div class="oap-sign-meta">
                  {{ currentPreviewAtt.sign_by || '-' }} · {{ currentPreviewAtt.sign_time || '-' }}
                </div>
              </div>
              <div class="oap-sign-validity">
                <div class="oap-sign-validity-circle">
                  <ArtSvgIcon icon="ri:shield-check-line" class="oap-sign-validity-icon" />
                  <span class="oap-sign-validity-label">电子<br />验签</span>
                </div>
                <div class="oap-sign-validity-text">签名有效</div>
              </div>
            </div>
            <div class="oap-sign-tip">
              <ArtSvgIcon icon="ri:checkbox-circle-line" class="oap-sign-tip-icon" />
              电子签名有效 · {{ currentPreviewAtt.sign_by || '-' }} 于
              {{ currentPreviewAtt.sign_time || '-' }} 签署
            </div>
          </template> -->
        </div>

        <div class="oap-footer">
          <button
            type="button"
            class="oap-nav-btn"
            :disabled="currentPreviewIndex <= 0"
            @click="prevAttach"
          >
            <ArtSvgIcon icon="ri:arrow-left-s-line" />
            上一份
          </button>
          <span class="oap-page">{{ currentPreviewIndex + 1 }} / {{ attachments.length }}</span>
          <button
            type="button"
            class="oap-nav-btn"
            :disabled="currentPreviewIndex >= attachments.length - 1"
            @click="nextAttach"
          >
            下一份
            <ArtSvgIcon icon="ri:arrow-right-s-line" />
          </button>
        </div>
      </div>
      <div v-else class="oap-main oap-main--empty">
        <p>暂无附件</p>
      </div>
    </div>

    <SignCanvasDialog
      v-if="canvasDialogVisible"
      v-model:visible="canvasDialogVisible"
      mode="single"
      :attachment-id="currentPreviewAtt?.id"
      :attachment-name="esignAttachName"
      :order-id="props.orderId"
      @signed="onCanvasSigned"
    />
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchPreviewOrderAttachment, fetchUploadSignedAttachment } from '@/api/recycle/order'
  import { uploadFileGetUrl } from '@/api/upload'
  import type { OrderAttachment } from '@/types/recycle/order'
  import SignCanvasDialog from './sign-canvas-dialog.vue'

  const props = withDefaults(
    defineProps<{
      modelValue: boolean
      attachments: OrderAttachment[]
      initialIndex?: number
      orderId?: number
    }>(),
    { initialIndex: 0 }
  )

  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'signed'): void
  }>()

  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  type PreviewMode = 'sign' | 'upload'

  const currentPreviewIndex = ref(0)
  const previewMode = ref<PreviewMode>('sign')
  const previewDocUrl = ref('')
  const previewLoading = ref(false)
  const isDialogFullscreen = ref(false)
  const canvasDialogVisible = ref(false)
  const uploadingAttachId = ref<number | null>(null)

  const currentPreviewAtt = computed(() => props.attachments[currentPreviewIndex.value] ?? null)

  const showEsignAction = computed(
    () =>
      previewMode.value === 'sign' && currentPreviewAtt.value && !isSigned(currentPreviewAtt.value)
  )

  const showUploadAction = computed(
    () => previewMode.value === 'upload' && !!currentPreviewAtt.value
  )

  const esignAttachName = computed(
    () => currentPreviewAtt.value?.name || `附件 ${currentPreviewAtt.value?.id ?? ''}`
  )

  const currentPreviewUrl = computed(() => {
    const att = currentPreviewAtt.value
    if (!att) return ''
    if (previewMode.value === 'upload') return att.upload_url || ''
    return previewDocUrl.value
  })

  function toggleDialogFullscreen() {
    isDialogFullscreen.value = !isDialogFullscreen.value
  }

  function isSigned(att: OrderAttachment) {
    return att.sign_status === 1 || att.signed === true
  }

  function isPdf(url: string) {
    if (!url) return false
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || ''
    return ext === 'pdf' || url.includes('application/pdf')
  }

  function isImage(url: string) {
    if (!url) return false
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || ''
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)
  }

  async function loadPreviewDoc() {
    const att = currentPreviewAtt.value
    if (!att?.id || previewMode.value !== 'sign') return
    previewDocUrl.value = ''
    previewLoading.value = true
    try {
      const res = await fetchPreviewOrderAttachment(att.id)
      previewDocUrl.value = res?.download_url || ''
    } catch {
      previewDocUrl.value = att.download_url || ''
    } finally {
      previewLoading.value = false
    }
  }

  function goToPreview(index: number) {
    if (index < 0 || index >= props.attachments.length) return
    currentPreviewIndex.value = index
    if (previewMode.value === 'sign') loadPreviewDoc()
  }

  function prevAttach() {
    if (currentPreviewIndex.value > 0) {
      currentPreviewIndex.value--
      if (previewMode.value === 'sign') loadPreviewDoc()
    }
  }

  function nextAttach() {
    if (currentPreviewIndex.value < props.attachments.length - 1) {
      currentPreviewIndex.value++
      if (previewMode.value === 'sign') loadPreviewDoc()
    }
  }

  function switchPreviewMode(mode: PreviewMode) {
    previewMode.value = mode
    if (mode === 'sign') loadPreviewDoc()
  }

  function openEsignDialog() {
    const att = currentPreviewAtt.value
    if (!att?.id) {
      ElMessage.warning('该附件缺少ID')
      return
    }
    canvasDialogVisible.value = true
  }

  function onCanvasSigned() {
    emit('signed')
    loadPreviewDoc()
  }

  function triggerUploadAttach() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) void doUploadSignedAttach(file)
    }
    input.click()
  }

  async function doUploadSignedAttach(file: File) {
    const att = currentPreviewAtt.value
    if (!att?.id) {
      ElMessage.warning('该附件缺少ID')
      return
    }
    uploadingAttachId.value = att.id
    try {
      const fileUrl = await uploadFileGetUrl(file, { showSuccessMessage: false })
      await fetchUploadSignedAttachment({ attach_id: att.id, upload_url: fileUrl })
      emit('signed')
    } catch {
      // 错误提示由 http / upload 层处理
    } finally {
      uploadingAttachId.value = null
    }
  }

  function onOpened() {
    const idx = Math.min(Math.max(props.initialIndex, 0), Math.max(props.attachments.length - 1, 0))
    currentPreviewIndex.value = idx
    previewMode.value = 'sign'
    previewDocUrl.value = ''
    nextTick(() => loadPreviewDoc())
  }

  function onClosed() {
    currentPreviewIndex.value = 0
    previewDocUrl.value = ''
    previewMode.value = 'sign'
    isDialogFullscreen.value = false
  }

  /** 外部刷新当前预览（签名成功后调用） */
  function refreshCurrentPreview() {
    if (!dialogVisible.value) return
    if (previewMode.value === 'sign') loadPreviewDoc()
  }

  defineExpose({ refreshCurrentPreview })
</script>

<style lang="scss">
  .oap-dialog {
    padding: 0 !important;
    overflow: hidden;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgb(0 0 0 / 18%);

    .el-dialog__header {
      padding: 0;
      margin: 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .el-dialog__body {
      padding: 0;
    }
  }

  .oap-dialog.is-fullscreen {
    display: flex;
    flex-direction: column;

    .el-dialog__body {
      flex: 1;
      min-height: 0;
    }

    .oap-layout {
      height: 100%;
    }
  }
</style>

<style scoped lang="scss">
  .oap-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
  }

  .oap-header-title {
    font-size: 14px;
    font-weight: 600;
    color: #101828;
  }

  .oap-close-btn {
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
    border-radius: 4px;

    &:hover {
      color: #262626;
      background: #f5f5f5;
    }
  }

  .oap-layout {
    display: flex;
    height: 92vh;
  }

  .oap-sidebar {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 224px;
    background: #fff;
    border-right: 1px solid #f3f4f6;
  }

  .oap-sidebar-head {
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
  }

  .oap-sidebar-title {
    font-size: 14px;
    font-weight: 600;
    color: #101828;
  }

  .oap-sidebar-count {
    margin-top: 2px;
    font-size: 12px;
    color: #99a1af;
  }

  .oap-sidebar-list {
    flex: 1;
    padding: 8px 0;
    overflow-y: auto;
  }

  .oap-sidebar-item {
    display: flex;
    gap: 10px;
    align-items: center;
    width: 100%;
    padding: 10px 12px;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: none;
    border-left: 2.4px solid transparent;
    transition: background 0.15s;

    &:hover {
      background: #f0f5ff;
    }

    &--active {
      background: #e6f7ff;
      border-left-color: #1890ff;
    }
  }

  .oap-sidebar-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 14px;
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

  .oap-sidebar-info {
    flex: 1;
    min-width: 0;
  }

  .oap-sidebar-name {
    overflow: hidden;
    font-size: 14px;
    font-weight: 500;
    color: #262626;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .oap-sidebar-item--active .oap-sidebar-name {
    color: #1890ff;
  }

  .oap-sidebar-status {
    margin-top: 2px;
    font-size: 12px;
    font-weight: 500;

    &--signed {
      color: #52c41a;
    }

    &--pending {
      color: #fa8c16;
    }
  }

  .oap-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;

    &--empty {
      align-items: center;
      justify-content: center;
      font-size: 13px;
      color: #99a1af;
    }
  }

  .oap-main-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid #f3f4f6;
  }

  .oap-main-head-left {
    display: flex;
    gap: 12px;
    align-items: center;
    min-width: 0;
  }

  .oap-main-title {
    overflow: hidden;
    font-size: 14px;
    font-weight: 600;
    color: #101828;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .oap-status-pill {
    flex-shrink: 0;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 500;
    border-radius: 12px;

    &--signed {
      color: #52c41a;
      background: #f6ffed;
    }

    &--pending {
      color: #fa8c16;
      background: #fff7e6;
    }
  }

  .oap-main-head-right {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
    align-items: center;
  }

  .oap-mode-toggle {
    display: flex;
    gap: 2px;
    padding: 2px;
    background: #f3f4f6;
    border-radius: 4px;
  }

  .oap-mode-btn {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: #595959;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;
    transition: all 0.15s;

    &--active {
      color: #fff;
      background: #1890ff;
    }
  }

  .oap-mode-icon {
    font-size: 12px;
  }

  .oap-action-btn {
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
  }

  .oap-action-icon {
    margin-right: 4px;
    font-size: 14px;
  }

  .oap-head-actions {
    display: flex;
    gap: 4px;
    align-items: center;
    padding-left: 4px;
  }

  .oap-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 16px;
    color: #434343;
    cursor: pointer;
    background: #fff;
    border: none;
    border-radius: 4px;

    &:hover {
      color: #262626;
      background: #f5f5f5;
    }
  }

  .oap-body {
    flex: 1;
    padding: 16px;
    overflow-y: hidden;
    background: #f0f5ff;
  }

  .oap-doc-wrap {
    height: 100%;
    overflow: hidden;
    background: #fff;
    border: 1px solid #91d5ff;
    border-radius: 4px;
    box-shadow:
      0 1px 2px -1px rgb(0 0 0 / 10%),
      0 1px 3px 0 rgb(0 0 0 / 10%);
  }

  .oap-doc-iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: none;
  }

  .oap-doc-image {
    display: block;
    width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .oap-doc-fallback,
  .oap-doc-empty {
    padding: 80px 20px;
    color: #99a1af;
    text-align: center;
  }

  .oap-doc-fallback-icon,
  .oap-doc-empty-icon {
    display: block;
    margin: 0 auto 12px;
    font-size: 48px;
  }

  .oap-sign-area {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding: 20px 24px;
    margin-top: 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgb(0 0 0 / 8%);
  }

  .oap-sign-label {
    margin-bottom: 8px;
    font-size: 10px;
    color: #99a1af;
  }

  .oap-sign-image-wrap {
    position: relative;
    display: inline-block;
    padding: 6px 12px;
    background: #e6f7ff;
    border: 1px solid rgb(24 144 255 / 30%);
    border-radius: 4px;
  }

  .oap-sign-image {
    max-width: 160px;
    height: 32px;
    object-fit: contain;
  }

  .oap-sign-badge {
    position: absolute;
    top: -7px;
    right: -7px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 10px;
    color: #fff;
    background: #52c41a;
    border-radius: 50%;
  }

  .oap-sign-meta {
    margin-top: 4px;
    font-size: 10px;
    color: #99a1af;
  }

  .oap-sign-validity {
    text-align: center;
  }

  .oap-sign-validity-circle {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    background: rgb(255 255 255 / 80%);
    border: 1.6px solid #1890ff;
    border-radius: 50%;
  }

  .oap-sign-validity-icon {
    font-size: 14px;
    color: #1890ff;
  }

  .oap-sign-validity-label {
    margin-top: 2px;
    font-size: 8px;
    font-weight: 500;
    line-height: 10px;
    color: #1890ff;
    text-align: center;
  }

  .oap-sign-validity-text {
    margin-top: 4px;
    font-size: 8px;
    color: #99a1af;
  }

  .oap-sign-tip {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding: 6px 12px;
    margin-top: 12px;
    font-size: 12px;
    color: #52c41a;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    border-radius: 999px;
  }

  .oap-sign-tip-icon {
    font-size: 14px;
  }

  .oap-footer {
    display: flex;
    gap: 30px;
    align-items: center;
    justify-content: center;
    padding: 12px 20px;
    background: #f9fafb;
    border-top: 1px solid #f3f4f6;
  }

  .oap-nav-btn {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 6px 12px;
    font-size: 12px;
    color: #4a5565;
    cursor: pointer;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 4px;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.3;
    }

    &:not(:disabled):hover {
      background: #f5f5f5;
    }
  }

  .oap-page {
    font-size: 12px;
    color: #99a1af;
  }
</style>
