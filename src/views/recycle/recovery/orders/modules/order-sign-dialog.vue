<template>
  <ElDialog
    v-model="dialogVisible"
    width="640px"
    align-center
    destroy-on-close
    :show-close="false"
    class="osd-dialog"
    style="padding: 0 0 16px !important"
    @opened="onOpened"
  >
    <template #header>
      <div class="osd-header">
        <div class="osd-header-left">
          <ArtSvgIcon icon="ri:pen-nib-line" class="osd-header-icon" />
          <span class="osd-header-title">订单附件签名</span>
        </div>
        <button type="button" class="osd-close-btn" @click="dialogVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <div v-loading="loading" class="osd-body">
      <!-- 订单摘要 -->
      <div class="osd-summary">
        <div class="osd-summary-item">
          <ArtSvgIcon icon="ri:file-text-line" />
          订单号：<em>{{ displayNo }}</em>
        </div>
        <div class="osd-summary-item">
          <ArtSvgIcon icon="ri:user-line" />
          车主：<em>{{ props.realName || '—' }}</em>
        </div>
        <div class="osd-summary-item">
          <ArtSvgIcon icon="ri:car-line" />
          <em>{{ vehicleText }}</em>
        </div>
      </div>

      <!-- 附件勾选 -->
      <div class="osd-section">
        <div class="osd-section-title">选择需要签名的附件</div>
        <div v-if="!pendingList.length && !loading" class="osd-empty">暂无待签名附件</div>
        <div v-else class="osd-attach-list">
          <div
            v-for="att in pendingList"
            :key="att.id"
            class="osd-attach-row"
            :class="{ active: selectedIds.includes(att.id!) }"
          >
            <ElCheckbox
              :model-value="selectedIds.includes(att.id!)"
              @change="(v) => toggleAttach(att.id!, Boolean(v))"
            />
            <ArtSvgIcon icon="ri:file-text-line" class="osd-attach-icon" />
            <div class="osd-attach-info">
              <div class="osd-attach-name">{{ att.name || `附件 ${att.id}` }}</div>
            </div>
            <span class="osd-attach-badge">待签名</span>
            <button
              v-if="att.download_url"
              type="button"
              class="osd-view-btn"
              @click.stop="handlePreview(att.download_url!)"
            >
              <ArtSvgIcon icon="ri:eye-line" class="osd-view-icon" />
              查看
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="osd-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :disabled="!selectedIds.length" @click="openCanvas">
          <ArtSvgIcon icon="ri:pen-nib-line" class="mr-1" />
          确认签名（{{ selectedIds.length }}份）
        </ElButton>
      </div>
    </template>
  </ElDialog>

  <SignCanvasDialog
    v-if="canvasVisible"
    v-model:visible="canvasVisible"
    mode="attachments"
    :attachment-ids="selectedIds"
    @signed="handleSigned"
  />

  <ElDialog v-model="previewVisible" width="80vw" align-center destroy-on-close title="文件预览">
    <div class="osd-preview-wrap">
      <iframe v-if="previewUrl" :src="previewUrl" class="osd-preview-frame" />
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchOrderDetail } from '@/api/recycle/order'
  import { resolveOrderAttachmentsAll, type OrderAttachment } from '@/types/recycle/order'
  import SignCanvasDialog from './sign-canvas-dialog.vue'

  interface Props {
    visible: boolean
    orderId: number | null
    orderNo?: string
    realName?: string
    plateNo?: string
    brand?: string
    model?: string
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

  const loading = ref(false)
  const attachments = ref<OrderAttachment[]>([])
  const selectedIds = ref<number[]>([])
  const canvasVisible = ref(false)

  const displayNo = computed(() => props.orderNo || (props.orderId ? String(props.orderId) : '—'))
  const vehicleText = computed(() => {
    const plate = props.plateNo || '—'
    const car = [props.brand, props.model].filter(Boolean).join('')
    return car ? `${plate} · ${car}` : plate
  })

  function isPending(att: OrderAttachment) {
    if (att.sign_status === 1 || att.signed) return false
    return Boolean(att.download_url)
  }

  const pendingList = computed(() => attachments.value.filter(isPending))

  function toggleAttach(id: number, checked: boolean) {
    if (checked) {
      if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
    } else {
      selectedIds.value = selectedIds.value.filter((x) => x !== id)
    }
  }

  async function loadAttachments() {
    if (!props.orderId) return
    loading.value = true
    try {
      // 附件列表从订单详情接口取，与详情页附件 Tab 同源
      const detail = await fetchOrderDetail(props.orderId)
      const list = resolveOrderAttachmentsAll(detail)
      attachments.value = list
      selectedIds.value = list
        .filter(isPending)
        .map((a) => a.id!)
        .filter(Boolean)
    } catch {
      attachments.value = []
      selectedIds.value = []
    } finally {
      loading.value = false
    }
  }

  function onOpened() {
    attachments.value = []
    selectedIds.value = []
    loadAttachments()
  }

  function openCanvas() {
    if (!selectedIds.value.length) {
      ElMessage.warning('请选择需要签名的附件')
      return
    }
    canvasVisible.value = true
  }

  function handleSigned() {
    emit('signed')
    dialogVisible.value = false
  }

  const previewVisible = ref(false)
  const previewUrl = ref('')

  function handlePreview(url: string) {
    previewUrl.value = url
    previewVisible.value = true
  }
</script>

<style lang="scss">
  .osd-dialog {
    .el-dialog__header {
      padding: 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .el-dialog__body {
      height: 600px;
      // max-height: calc(88vh - 140px);
      padding: 16px 20px;
      overflow-y: auto;
    }

    .el-dialog__footer {
      padding: 0;
      background: #fafafa;
      border-top: 1px solid #f0f0f0;
    }
  }
</style>

<style scoped lang="scss">
  .osd-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
  }

  .osd-header-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .osd-header-icon {
    font-size: 16px;
    color: #1890ff;
  }

  .osd-header-title {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
  }

  .osd-close-btn {
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

  .osd-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 120px;
  }

  .osd-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    padding: 12px;
    background: #f5f8ff;
    border-radius: 8px;
  }

  .osd-summary-item {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    color: #595959;

    em {
      font-style: normal;
      font-weight: 500;
      color: #262626;
    }
  }

  .osd-section-title {
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #434343;
  }

  .osd-empty {
    padding: 24px;
    font-size: 13px;
    color: #bfbfbf;
    text-align: center;
  }

  .osd-attach-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .osd-attach-row {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    cursor: pointer;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.15s;

    &:hover,
    &.active {
      background: #f5f8ff;
      border-color: rgb(22 119 255 / 40%);
    }
  }

  .osd-attach-icon {
    font-size: 16px;
    color: #8c8c8c;
  }

  .osd-attach-info {
    flex: 1;
    min-width: 0;
  }

  .osd-attach-name {
    overflow: hidden;
    font-size: 13px;
    font-weight: 500;
    color: #262626;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .osd-attach-badge {
    padding: 2px 8px;
    font-size: 11px;
    color: #d48806;
    background: #fffbe6;
    border: 1px solid #ffe58f;
    border-radius: 4px;
  }

  .osd-view-btn {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
    line-height: 1;
    color: var(--art-gray-700);
    white-space: nowrap;
    cursor: pointer;
    background: #fff;
    border: 1px solid transparent;
    border-color: var(--art-card-border);
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
      color: #1677ff;
      background: #f0f7ff;
      border-color: #91caff;
    }
  }

  .osd-view-icon {
    font-size: 14px;
  }

  .osd-preview-wrap {
    height: 70vh;
  }

  .osd-preview-frame {
    width: 100%;
    height: 100%;
    border: none;
  }

  .osd-footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 12px 20px;
  }
</style>
