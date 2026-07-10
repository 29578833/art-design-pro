<template>
  <ElDialog
    v-model="dialogVisible"
    width="600px"
    align-center
    destroy-on-close
    :show-close="false"
    class="sc-dialog"
    @opened="onOpened"
    @closed="onClosed"
  >
    <!-- Header -->
    <template #header>
      <div class="sc-header">
        <div class="sc-header-left">
          <ArtSvgIcon icon="ri:pen-nib-line" class="sc-header-icon" />
          <span class="sc-header-title">{{ headerTitle }}</span>
        </div>
        <button type="button" class="sc-close-btn" @click="dialogVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <div class="sc-body">
      <!-- 多订单批量 -->
      <div v-if="resolvedMode === 'orders'" class="sc-batch-tip">
        <ArtSvgIcon icon="ri:layers-line" class="sc-batch-tip-icon" />
        <span>
          将为
          <strong>{{ orderIdsCount }}</strong>
          个订单的全部待签名附件完成签署
        </span>
      </div>

      <!-- 多附件批量 -->
      <div v-else-if="resolvedMode === 'attachments'" class="sc-batch-tip">
        <ArtSvgIcon icon="ri:zap-line" class="sc-batch-tip-icon" />
        <span>
          批量签名模式：将为
          <strong>{{ attachmentIdsCount }}</strong>
          份待签名附件完成签署
        </span>
      </div>

      <!-- 单附件 -->
      <div v-else class="sc-single-tip">
        <ArtSvgIcon icon="ri:file-text-line" class="sc-single-tip-icon" />
        <div class="sc-single-tip-text">
          <span class="sc-single-name">{{ props.attachmentName || '附件' }}</span>
          <span class="sc-single-desc">请在下方框内手写签名</span>
        </div>
      </div>

      <!-- 模板选择器（有模板时显示） -->
      <div v-if="templates.length" class="sc-template-toggle-row">
        <button
          type="button"
          class="sc-template-toggle-btn"
          @click="showTemplateSelector = !showTemplateSelector"
        >
          <ArtSvgIcon icon="ri:star-line" class="sc-template-toggle-icon" />
          {{ showTemplateSelector ? '收起' : '使用' }}签名模板（{{ templates.length }} 个）
        </button>
      </div>

      <div v-if="showTemplateSelector && templates.length" class="sc-template-grid">
        <div v-for="tpl in templates" :key="tpl.id" class="sc-tpl-item" @click="applyTemplate(tpl)">
          <img :src="tpl.sign_url" :alt="tpl.name" class="sc-tpl-img" />
          <div class="sc-tpl-name">{{ tpl.name }}</div>
        </div>
      </div>

      <!-- Canvas 签名区 -->
      <canvas
        ref="canvasRef"
        width="550"
        height="180"
        class="sc-canvas"
        @mousedown="startDraw"
        @mousemove="continueDraw"
        @mouseup="stopDraw"
        @mouseleave="stopDraw"
        @touchstart.prevent="startDrawTouch"
        @touchmove.prevent="continueDrawTouch"
        @touchend="stopDraw"
      />
      <p class="sc-canvas-hint">在上方区域手写您的签名，或使用已保存的签名模板</p>

      <!-- 保存为模板 -->
      <div class="sc-save-tpl-wrap">
        <label class="sc-save-tpl-label">
          <input v-model="saveAsTemplate" type="checkbox" class="sc-save-tpl-checkbox" />
          <span>保存为签名模板</span>
        </label>
        <input
          v-if="saveAsTemplate"
          v-model="templateName"
          type="text"
          class="sc-save-tpl-input"
          placeholder="请输入模板名称（如：张三签名）"
        />
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="sc-footer">
        <ElButton @click="clearCanvas">
          <ArtSvgIcon icon="ri:eraser-line" class="mr-1" />
          清除重签
        </ElButton>
        <div class="sc-footer-right">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton
            type="primary"
            :loading="submitting"
            :disabled="!hasContent || (saveAsTemplate && !templateName.trim())"
            @click="confirmSign"
          >
            {{ confirmLabel }}
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import {
    fetchSignAttachments,
    fetchSignOrder,
    fetchSignTemplates,
    fetchSaveTemplate
  } from '@/api/recycle/sign'
  import { uploadFileGetUrl } from '@/api/upload'
  import type { SignatureTemplate } from '@/types/recycle/order'

  /** single=单附件 / attachments=多附件 / orders=多订单；batch 兼容旧调用→attachments */
  export type SignCanvasMode = 'single' | 'attachments' | 'orders' | 'batch'

  interface Props {
    visible: boolean
    mode: SignCanvasMode
    /** single：单个附件 ID */
    attachmentId?: number
    /** attachments / 旧 batch：多个附件 ID */
    attachmentIds?: number[]
    /** 附件名称（single 提示用） */
    attachmentName?: string
    /** 兼容旧调用：单订单备用 */
    orderId?: number
    /** orders：多个订单 ID */
    orderIds?: number[]
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', v: boolean): void
    (e: 'signed'): void
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  /** 归一化模式：batch → attachments */
  const resolvedMode = computed<'single' | 'attachments' | 'orders'>(() => {
    if (props.mode === 'batch' || props.mode === 'attachments') return 'attachments'
    if (props.mode === 'orders') return 'orders'
    return 'single'
  })

  const attachmentIdsCount = computed(() => props.attachmentIds?.length ?? 0)
  const orderIdsCount = computed(() => {
    if (props.orderIds?.length) return props.orderIds.length
    return props.orderId ? 1 : 0
  })

  const headerTitle = computed(() => {
    if (resolvedMode.value === 'orders') return '批量一键签名'
    if (resolvedMode.value === 'attachments') return '批量签名'
    return '电子签名'
  })

  const confirmLabel = computed(() => {
    if (resolvedMode.value === 'orders') return '一键完成全部签名'
    if (resolvedMode.value === 'attachments') return '批量签名'
    return '确认签名'
  })

  const isBatch = computed(() => resolvedMode.value !== 'single')

  // ===== 模板 =====
  const templates = ref<SignatureTemplate[]>([])
  const showTemplateSelector = ref(false)

  async function loadTemplates() {
    try {
      templates.value = await fetchSignTemplates()
    } catch {
      templates.value = []
    }
  }

  // ===== Canvas =====
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const isDrawing = ref(false)
  const hasContent = ref(false)
  let lastX = 0
  let lastY = 0

  function getCtx() {
    const ctx = canvasRef.value?.getContext('2d')
    if (ctx) {
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    return ctx
  }

  function getPos(e: MouseEvent | Touch) {
    const rect = canvasRef.value!.getBoundingClientRect()
    const sx = canvasRef.value!.width / rect.width
    const sy = canvasRef.value!.height / rect.height
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
  }

  function startDraw(e: MouseEvent) {
    isDrawing.value = true
    const { x, y } = getPos(e)
    lastX = x
    lastY = y
  }

  function continueDraw(e: MouseEvent) {
    if (!isDrawing.value) return
    const ctx = getCtx()
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.stroke()
    lastX = x
    lastY = y
    hasContent.value = true
  }

  function stopDraw() {
    isDrawing.value = false
  }

  function startDrawTouch(e: TouchEvent) {
    isDrawing.value = true
    const { x, y } = getPos(e.touches[0])
    lastX = x
    lastY = y
  }

  function continueDrawTouch(e: TouchEvent) {
    if (!isDrawing.value) return
    const ctx = getCtx()
    if (!ctx) return
    const { x, y } = getPos(e.touches[0])
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.stroke()
    lastX = x
    lastY = y
    hasContent.value = true
  }

  function clearCanvas() {
    const c = canvasRef.value
    if (!c) return
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height)
    hasContent.value = false
  }

  function applyTemplate(tpl: SignatureTemplate) {
    const c = canvasRef.value
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.drawImage(img, 0, 0, c.width, c.height)
      hasContent.value = true
      showTemplateSelector.value = false
    }
    img.src = tpl.sign_url
  }

  // ===== 保存为模板 =====
  const saveAsTemplate = ref(false)
  const templateName = ref('')

  // ===== 提交签名 =====
  const submitting = ref(false)

  async function confirmSign() {
    if (!hasContent.value) {
      ElMessage.warning('请先完成签名')
      return
    }
    const canvas = canvasRef.value
    if (!canvas) return

    submitting.value = true
    try {
      // 1. canvas → blob → 上传
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas 导出失败'))), 'image/png')
      })
      const signUrl = await uploadFileGetUrl(blob, { fieldName: 'file' })

      // 2. 按模式提交签名
      if (resolvedMode.value === 'orders') {
        const ids = props.orderIds?.length ? props.orderIds : props.orderId ? [props.orderId] : []
        if (!ids.length) {
          ElMessage.warning('请选择要签名的订单')
          return
        }
        await fetchSignOrder(ids, signUrl)
      } else if (resolvedMode.value === 'attachments') {
        const ids = props.attachmentIds ?? []
        if (ids.length) {
          await fetchSignAttachments(ids, signUrl)
        } else if (props.orderId) {
          // 兼容：无附件 ID 时按单订单签全部待签
          await fetchSignOrder([props.orderId], signUrl)
        } else {
          ElMessage.warning('请选择要签名的附件')
          return
        }
      } else if (props.attachmentId) {
        await fetchSignAttachments([props.attachmentId], signUrl)
      } else {
        ElMessage.warning('缺少附件信息')
        return
      }

      // 3. 保存为模板（可选）
      if (saveAsTemplate.value && templateName.value.trim()) {
        try {
          await fetchSaveTemplate(templateName.value.trim(), signUrl)
          ElMessage.success(`签名模板「${templateName.value}」已保存`)
        } catch {
          ElMessage.warning('模板保存失败，但签名已完成')
        }
      }

      ElMessage.success(isBatch.value ? '批量签名完成' : '签名完成')
      emit('signed')
      dialogVisible.value = false
    } catch (e: unknown) {
      ElMessage.error(e instanceof Error ? e.message : '签名失败，请重试')
    } finally {
      submitting.value = false
    }
  }

  // ===== 生命周期 =====
  function onOpened() {
    clearCanvas()
    showTemplateSelector.value = false
    saveAsTemplate.value = false
    templateName.value = ''
    loadTemplates()
  }

  function onClosed() {
    clearCanvas()
    templates.value = []
    showTemplateSelector.value = false
    saveAsTemplate.value = false
    templateName.value = ''
  }
</script>

<style lang="scss">
  .sc-dialog {
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
  /* ===== Header ===== */
  .sc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
  }

  .sc-header-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .sc-header-icon {
    font-size: 16px;
    color: #1890ff;
  }

  .sc-header-title {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
  }

  .sc-close-btn {
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
    transition: all 0.2s;

    &:hover {
      color: #262626;
      background: #f5f5f5;
    }
  }

  /* ===== Body ===== */
  .sc-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* 批量提示条 */
  .sc-batch-tip {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 10px 14px;
    font-size: 13px;
    color: #1890ff;
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 8px;
  }

  .sc-batch-tip-icon {
    flex-shrink: 0;
    font-size: 15px;
  }

  /* 单个提示 */
  .sc-single-tip {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 14px;
    background: #f8f9fb;
    border: 1px solid #e8e8e8;
    border-left: 3px solid #1890ff;
    border-radius: 6px;
  }

  .sc-single-tip-icon {
    flex-shrink: 0;
    font-size: 20px;
    color: #1890ff;
  }

  .sc-single-tip-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sc-single-name {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
    color: #262626;
  }

  .sc-single-desc {
    font-size: 11px;
    color: #8c8c8c;
  }

  /* 模板切换 */
  .sc-template-toggle-row {
    display: flex;
  }

  .sc-template-toggle-btn {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 0;
    font-size: 12px;
    color: #1890ff;
    cursor: pointer;
    background: transparent;
    border: none;
    transition: color 0.15s;

    &:hover {
      color: #1677d9;
    }
  }

  .sc-template-toggle-icon {
    font-size: 13px;
  }

  /* 模板网格 */
  .sc-template-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    max-height: 160px;
    padding: 12px;
    overflow-y: auto;
    background: #f8f9fb;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
  }

  .sc-tpl-item {
    overflow: hidden;
    cursor: pointer;
    background: #fff;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    transition: border-color 0.15s;

    &:hover {
      border-color: #1890ff;
    }
  }

  .sc-tpl-img {
    display: block;
    width: 100%;
    height: 64px;
    object-fit: contain;
  }

  .sc-tpl-name {
    padding: 3px 6px;
    overflow: hidden;
    font-size: 10px;
    color: #595959;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-top: 1px solid #f0f0f0;
  }

  /* Canvas */
  .sc-canvas {
    display: block;
    width: 100%;
    height: 180px;
    touch-action: none;
    cursor: crosshair;
    background: #f8f9fb;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;

    &:hover {
      border-color: #91caff;
    }
  }

  .sc-canvas-hint {
    margin: 0;
    font-size: 11px;
    color: #bfbfbf;
    text-align: center;
  }

  /* 保存模板 */
  .sc-save-tpl-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: #f8f9fb;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
  }

  .sc-save-tpl-label {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    color: #434343;
    cursor: pointer;
  }

  .sc-save-tpl-checkbox {
    width: 14px;
    height: 14px;
    accent-color: #1890ff;
    cursor: pointer;
  }

  .sc-save-tpl-input {
    box-sizing: border-box;
    width: 100%;
    padding: 7px 10px;
    font-size: 12px;
    color: #262626;
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    outline: none;
    transition: border-color 0.15s;

    &:focus {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgb(24 144 255 / 15%);
    }

    &::placeholder {
      color: #bfbfbf;
    }
  }

  /* ===== Footer ===== */
  .sc-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
  }

  .sc-footer-right {
    display: flex;
    gap: 8px;
  }
</style>
