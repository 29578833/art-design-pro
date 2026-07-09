<template>
  <ElDialog
    v-model="dialogVisible"
    width="600px"
    align-center
    destroy-on-close
    :show-close="false"
    class="fo-sign-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div class="fos-header">
        <span class="fos-title">
          <ArtSvgIcon icon="ri:pen-nib-line" class="fos-title-icon" />
          电子签名
        </span>
        <span v-if="props.attachment?.type_name" class="fos-subtitle">
          — {{ props.attachment.type_name }}
        </span>
        <button type="button" class="fos-close-btn" @click="dialogVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <!-- Canvas 签名区 -->
    <div class="fos-canvas-wrap">
      <canvas
        ref="canvasRef"
        width="550"
        height="180"
        class="fos-canvas"
        @mousedown="startDraw"
        @mousemove="drawing"
        @mouseup="stopDraw"
        @mouseleave="stopDraw"
        @touchstart.prevent="startDrawTouch"
        @touchmove.prevent="drawingTouch"
        @touchend="stopDraw"
      />
      <div class="fos-canvas-hint">请在上方区域手写签名</div>
    </div>

    <template #footer>
      <div class="fos-footer">
        <ElButton @click="clearCanvas">
          <ArtSvgIcon icon="ri:eraser-line" class="mr-1" />
          清除重签
        </ElButton>
        <div class="fos-footer-right">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton type="primary" :loading="submitting" @click="confirmSign">
            <ArtSvgIcon icon="ri:check-line" class="mr-1" />
            确认签名
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { OrderAttachment } from '@/types/recycle/order'

  interface Props {
    visible: boolean
    attachment: OrderAttachment | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', v: boolean): void
    (e: 'signed', attachmentId: number): void
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  // ========== Canvas 签名逻辑 ==========
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const isDrawing = ref(false)
  let lastX = 0
  let lastY = 0
  let hasStroke = false

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

  function getCanvasPos(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = canvasRef.value!.getBoundingClientRect()
    const scaleX = canvasRef.value!.width / rect.width
    const scaleY = canvasRef.value!.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  function startDraw(e: MouseEvent) {
    isDrawing.value = true
    const { x, y } = getCanvasPos(e)
    lastX = x
    lastY = y
  }

  function drawing(e: MouseEvent) {
    if (!isDrawing.value) return
    const ctx = getCtx()
    if (!ctx) return
    const { x, y } = getCanvasPos(e)
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.stroke()
    lastX = x
    lastY = y
    hasStroke = true
  }

  function stopDraw() {
    isDrawing.value = false
  }

  function startDrawTouch(e: TouchEvent) {
    const touch = e.touches[0]
    isDrawing.value = true
    const { x, y } = getCanvasPos(touch)
    lastX = x
    lastY = y
  }

  function drawingTouch(e: TouchEvent) {
    if (!isDrawing.value) return
    const touch = e.touches[0]
    const ctx = getCtx()
    if (!ctx) return
    const { x, y } = getCanvasPos(touch)
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.stroke()
    lastX = x
    lastY = y
    hasStroke = true
  }

  function clearCanvas() {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    hasStroke = false
  }

  function handleClosed() {
    clearCanvas()
    hasStroke = false
  }

  // ========== 确认签名 ==========
  const submitting = ref(false)

  async function confirmSign() {
    if (!hasStroke) {
      ElMessage.warning('请先完成签名')
      return
    }
    if (!props.attachment?.id) {
      ElMessage.error('附件信息缺失')
      return
    }

    submitting.value = true
    try {
      // 当后端签名 API 可用时，此处调用上传 canvas 数据并提交
      // 目前本地状态模拟：直接 emit signed
      await new Promise((r) => setTimeout(r, 500))
      emit('signed', props.attachment.id!)
      dialogVisible.value = false
      ElMessage.success('签名完成')
    } finally {
      submitting.value = false
    }
  }
</script>

<style lang="scss">
  .fo-sign-dialog {
    .el-dialog__header {
      padding: 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .el-dialog__body {
      padding: 16px 20px;
    }

    .el-dialog__footer {
      padding: 0;
      border-top: 1px solid #f0f0f0;
    }
  }
</style>

<style scoped lang="scss">
  /* ===== Header ===== */
  .fos-header {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 14px 20px;
  }

  .fos-title {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 15px;
    font-weight: 600;
    color: #262626;
  }

  .fos-title-icon {
    font-size: 16px;
    color: #1677ff;
  }

  .fos-subtitle {
    font-size: 13px;
    color: #8c8c8c;
  }

  .fos-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin-left: auto;
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

  /* ===== Canvas ===== */
  .fos-canvas-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }

  .fos-canvas {
    width: 100%;
    max-width: 550px;
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

  .fos-canvas-hint {
    font-size: 12px;
    color: #bfbfbf;
  }

  /* ===== Footer ===== */
  .fos-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
  }

  .fos-footer-right {
    display: flex;
    gap: 8px;
  }
</style>
