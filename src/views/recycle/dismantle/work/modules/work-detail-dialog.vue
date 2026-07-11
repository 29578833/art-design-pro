<template>
  <ElDialog
    v-model="dialogVisible"
    width="860px"
    align-center
    destroy-on-close
    :show-close="false"
    class="work-detail-dialog"
    style="padding: 0 !important"
    @closed="handleClosed"
  >
    <template #header>
      <div class="work-detail-header">
        <div class="work-detail-header-left">
          <div class="work-detail-icon">
            <ArtSvgIcon icon="ri:tools-line" />
          </div>
          <div>
            <div class="work-detail-title-row">
              <span class="work-detail-title">拆解工单</span>
              <span v-if="plateItem" class="work-detail-status-tag" :style="statusStyle">
                {{
                  plateItem.status_text ||
                  PLATE_STATUS_CONFIG[plateItem.status as 0 | 1]?.label ||
                  '—'
                }}
              </span>
            </div>
            <div class="work-detail-sub">
              {{ plateItem?.plate_no || '—' }} · {{ plateItem?.vehicle_model || '—' }} ·
              {{ plateItem?.vehicle_type_text || '—' }} · {{ plateItem?.archive_no || '—' }}
            </div>
          </div>
        </div>
        <button type="button" class="work-detail-close" @click="dialogVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <div v-loading="initializing" class="work-detail-body">
      <div class="work-summary-bar">
        <div v-for="item in summaryItems" :key="item.label" class="work-summary-item">
          <span class="label">{{ item.label }}：</span>
          <span class="value">{{ item.value }}</span>
        </div>
      </div>

      <div class="work-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="work-tab"
          :class="{ 'is-active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <ArtSvgIcon :icon="tab.icon" />
          {{ tab.label }}
        </button>
      </div>

      <div class="work-tab-panel">
        <!-- 报废拆解照片 -->
        <div v-show="activeTab === 'photos'" class="work-photos-panel">
          <div class="work-time-section">
            <div class="work-time-head">
              <span class="work-time-title">拆解时间登记</span>
              <span class="work-time-required">必填</span>
            </div>
            <div class="work-time-grid">
              <div class="work-time-field">
                <label>拆解日期 <span class="required">*</span></label>
                <ElDatePicker
                  v-model="dismantleTime.dismantle_date"
                  type="date"
                  placeholder="年/月/日"
                  value-format="YYYY-MM-DD"
                  format="YYYY/MM/DD"
                  class="work-full-width"
                  :disabled="isCompleted"
                />
              </div>
              <div class="work-time-field">
                <label>掀顶/断粱时间 <span class="required">*</span></label>
                <ElDatePicker
                  v-model="dismantleTime.roof_cut_time"
                  type="datetime"
                  placeholder="年/月/日 --:--"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  format="YYYY/MM/DD HH:mm"
                  class="work-full-width"
                  :disabled="isCompleted"
                />
              </div>
              <div class="work-time-field">
                <label>五大总成拆解时间 <span class="required">*</span></label>
                <ElDatePicker
                  v-model="dismantleTime.assembly_dismantle_time"
                  type="datetime"
                  placeholder="年/月/日 --:--"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  format="YYYY/MM/DD HH:mm"
                  class="work-full-width"
                  :disabled="isCompleted"
                />
              </div>
            </div>
            <div v-if="!timeFieldsFilled" class="work-time-tip">
              请填写以上三项必填时间信息后，再上传拆解照片
            </div>
          </div>

          <div class="work-photos-head">
            <div class="work-panel-title">报废拆解照片（工序二）</div>
            <span class="work-photos-count">{{ uploadedPhotoCount }}/9 已上传</span>
          </div>
          <div class="work-photos-tip">
            <ArtSvgIcon icon="ri:information-line" />
            上传拆解照片后将同步至商务部数字化管理平台（车信盟），请确保照片清晰完整
          </div>
          <div class="work-photo-grid">
            <div v-for="(photo, index) in photoList" :key="photo.code" class="work-photo-card">
              <div
                class="work-photo-upload"
                :class="{
                  'has-image': photo.url,
                  'is-disabled': !photo.url && (!timeFieldsFilled || isCompleted)
                }"
              >
                <template v-if="photo.url">
                  <button
                    v-if="!isCompleted"
                    type="button"
                    class="work-photo-delete"
                    @click.stop="removePhoto(index)"
                  >
                    <ArtSvgIcon icon="ri:close-line" />
                  </button>
                  <ElImage
                    :src="photo.url"
                    :preview-src-list="previewUrlList"
                    :initial-index="getPreviewIndex(index)"
                    fit="cover"
                    class="work-photo-preview"
                    preview-teleported
                  />
                </template>
                <div v-else class="work-photo-empty" @click="handlePhotoClick(index)">
                  <ArtSvgIcon icon="ri:camera-line" class="text-2xl" />
                  <span>点击上传</span>
                </div>
                <input
                  :ref="(el) => setPhotoInputRef(el, index)"
                  type="file"
                  accept="image/*"
                  class="work-photo-input"
                  @change="(e) => handlePhotoChange(e, index)"
                />
              </div>
              <div class="work-photo-info">
                <div class="name">{{ photo.name }}</div>
                <div class="code">{{ photo.code }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作日志 -->
        <div v-show="activeTab === 'log'" class="work-log-panel">
          <div class="work-panel-title">操作日志</div>
          <div v-if="!logs.length" class="work-log-empty">暂无操作日志</div>
          <div v-else class="work-log-list">
            <div v-for="(log, index) in logs" :key="index" class="work-log-item">
              <div class="work-log-line">
                <div class="dot" />
                <div v-if="index < logs.length - 1" class="line" />
              </div>
              <div class="work-log-content">
                <div class="work-log-action">
                  <span>{{ log.action || '—' }}</span>
                  <span class="operator">{{ log.operator_name || '—' }}</span>
                </div>
                <div class="work-log-time">{{ log.add_time_text || '—' }}</div>
                <div v-if="log.content" class="work-log-note">{{ log.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="work-detail-footer">
        <div class="work-footer-progress">照片进度：{{ uploadedPhotoCount }}/9 张已上传</div>
        <div class="work-footer-actions">
          <ElButton @click="dialogVisible = false">关闭</ElButton>
          <ElButton
            v-if="!isCompleted"
            type="success"
            :loading="completing"
            @click="handleComplete"
          >
            完成拆解 → 进入待缴库
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { uploadFile } from '@/api/upload'
  import {
    fetchDismantleInit,
    fetchDismantleLog,
    fetchDismantleSave,
    fetchPlateDetail,
    fetchPlateUpdateStatus
  } from '@/api/recycle/plate'
  import type { DismantlePhotoItem, DismantleTimeForm, PlateItem } from '@/types/recycle/plate'
  import { MINISTRY_DISMANTLE_PHOTOS, PLATE_STATUS_CONFIG } from '@/types/recycle/plate'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    visible: boolean
    plateId?: number
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const initializing = ref(false)
  const completing = ref(false)
  const uploadingIndex = ref<number>()
  const activeTab = ref<'photos' | 'log'>('photos')
  const plateItem = ref<PlateItem | null>(null)
  const logs = ref<
    { action?: string; content?: string; operator_name?: string; add_time_text?: string }[]
  >([])
  const dismantleTime = ref<DismantleTimeForm>({
    dismantle_date: '',
    roof_cut_time: '',
    assembly_dismantle_time: ''
  })
  const photoList = ref<DismantlePhotoItem[]>([])
  const photoInputRefs = ref<(HTMLInputElement | null)[]>([])

  const tabs = [
    { id: 'photos' as const, label: '② 报废拆解照片', icon: 'ri:archive-line' },
    { id: 'log' as const, label: '操作日志', icon: 'ri:file-text-line' }
  ]

  const isCompleted = computed(() => plateItem.value?.status === 1)

  const timeFieldsFilled = computed(
    () =>
      Boolean(dismantleTime.value.dismantle_date) &&
      Boolean(dismantleTime.value.roof_cut_time) &&
      Boolean(dismantleTime.value.assembly_dismantle_time)
  )

  const uploadedPhotoCount = computed(() => photoList.value.filter((item) => item.url).length)

  const previewUrlList = computed(() =>
    photoList.value.filter((item) => item.url).map((item) => item.url!)
  )

  function getPreviewIndex(index: number) {
    return photoList.value.slice(0, index + 1).filter((item) => item.url).length - 1
  }

  const statusStyle = computed(() => {
    const status = plateItem.value?.status
    if (status === undefined || status === null) return {}
    const cfg = PLATE_STATUS_CONFIG[status as 0 | 1]
    return cfg ? { color: cfg.color, background: cfg.bg } : {}
  })

  const summaryItems = computed(() => {
    const item = plateItem.value
    return [
      { label: '净重', value: item?.net_weight ? `${item.net_weight}${item.unit || 'kg'}` : '—' },
      { label: '库位', value: item?.parking_spot || '—' },
      { label: '关联订单', value: item?.order_no ? String(item.order_no) : '—' },
      { label: '质检结论', value: item?.qc_result || '—' },
      { label: '负责人', value: item?.person_in_charge || '未指派' },
      { label: '创建时间', value: item?.add_time_text || '—' }
    ]
  })

  function buildDefaultPhotos(savedPhotos: DismantlePhotoItem[] = []) {
    const savedMap = new Map(savedPhotos.map((item) => [item.code || item.id, item.url]))
    return MINISTRY_DISMANTLE_PHOTOS.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      url: savedMap.get(item.code) || savedMap.get(item.id) || ''
    }))
  }

  function setPhotoInputRef(el: unknown, index: number) {
    photoInputRefs.value[index] = el as HTMLInputElement | null
  }

  function handlePhotoClick(index: number) {
    if (!timeFieldsFilled.value || isCompleted.value) return
    photoInputRefs.value[index]?.click()
  }

  function removePhoto(index: number) {
    if (isCompleted.value) return
    photoList.value[index] = { ...photoList.value[index], url: '' }
  }

  async function handlePhotoChange(event: Event, index: number) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    uploadingIndex.value = index
    try {
      const { url } = await uploadFile(file, { showSuccessMessage: false })
      photoList.value[index] = { ...photoList.value[index], url }
    } catch {
      ElMessage.error('照片上传失败')
    } finally {
      uploadingIndex.value = undefined
    }
  }

  async function loadDetail() {
    if (!props.plateId) return
    initializing.value = true
    try {
      const [detail, init, logRes] = await Promise.all([
        fetchPlateDetail(props.plateId),
        fetchDismantleInit(props.plateId),
        fetchDismantleLog(props.plateId)
      ])
      plateItem.value = detail
      dismantleTime.value = {
        dismantle_date: init.dismantle_date || '',
        roof_cut_time: init.roof_cut_time || '',
        assembly_dismantle_time: init.assembly_dismantle_time || ''
      }
      photoList.value = buildDefaultPhotos(init.photos || [])
      logs.value = logRes.logs || []
    } finally {
      initializing.value = false
    }
  }

  function buildSavePayload() {
    return {
      dismantle_time: { ...dismantleTime.value },
      photos: photoList.value
    }
  }

  async function handleComplete() {
    if (!props.plateId) return
    if (!timeFieldsFilled.value) {
      ElMessage.warning('请先填写三项必填拆解时间')
      return
    }
    try {
      await ElMessageBox.confirm(
        '确认该车辆拆解工作已全部线下完成？完成后工单将进入待缴库流程。',
        '完成拆解',
        { type: 'warning', confirmButtonText: '确认完成', cancelButtonText: '取消' }
      )
    } catch {
      return
    }

    completing.value = true
    try {
      await fetchDismantleSave(props.plateId, buildSavePayload())
      await fetchPlateUpdateStatus(props.plateId, 1, 100)
      ElMessage.success('拆解已完成，已进入待缴库流程')
      emit('success')
      dialogVisible.value = false
    } finally {
      completing.value = false
    }
  }

  function handleClosed() {
    activeTab.value = 'photos'
    plateItem.value = null
    logs.value = []
    dismantleTime.value = { dismantle_date: '', roof_cut_time: '', assembly_dismantle_time: '' }
    photoList.value = []
    photoInputRefs.value = []
  }

  watch(
    () => [props.visible, props.plateId] as const,
    ([visible, plateId]) => {
      if (visible && plateId) {
        loadDetail()
      }
    }
  )
</script>

<style lang="scss">
  .work-detail-dialog {
    .el-dialog__header {
      padding-bottom: 0 !important;
      margin-right: 0;
    }

    .work-detail-body {
      display: flex;
      flex-direction: column;
      height: 700px;
      padding: 0;
    }

    .el-dialog__footer {
      padding: 0;
    }

    .work-detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .work-detail-header-left {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .work-detail-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      font-size: 16px;
      color: #fa8c16;
      background: #fff7e6;
      border-radius: 8px;
    }

    .work-detail-title-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .work-detail-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--art-gray-900);
    }

    .work-detail-status-tag {
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 500;
      border-radius: 4px;
    }

    .work-detail-sub {
      margin-top: 4px;
      font-size: 12px;
      color: var(--art-gray-600);
    }

    .work-detail-close {
      padding: 4px;
      cursor: pointer;
      background: transparent;
      border: none;
      border-radius: 4px;

      &:hover {
        background: #f3f4f6;
      }
    }

    .work-summary-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px 24px;
      padding: 12px 20px;
      background: #f9fafb;
      border-bottom: 1px solid #f3f4f6;
    }

    .work-summary-item {
      font-size: 12px;

      .label {
        color: var(--art-gray-600);
      }

      .value {
        font-weight: 500;
        color: var(--art-gray-700);
      }
    }

    .work-tabs {
      display: flex;
      padding: 0 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .work-tab {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--art-gray-500);
      cursor: pointer;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;

      &.is-active {
        color: #1677ff;
        border-bottom-color: #1677ff;
      }
    }

    .work-tab-panel {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }

    .work-time-section {
      padding: 16px;
      margin-bottom: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .work-time-head {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 16px;
    }

    .work-time-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--art-gray-800);
    }

    .work-time-required {
      padding: 1px 6px;
      font-size: 11px;
      color: #ff4d4f;
      background: #fff1f0;
      border-radius: 4px;
    }

    .work-time-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .work-time-field {
      label {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        color: var(--art-gray-600);

        .required {
          color: #ff4d4f;
        }
      }
    }

    .work-full-width {
      width: 100%;
    }

    .work-time-tip {
      margin-top: 12px;
      font-size: 12px;
      color: #ff4d4f;
    }

    .work-photos-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .work-panel-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--art-gray-800);
    }

    .work-photos-count {
      font-size: 12px;
      color: var(--art-gray-500);
    }

    .work-photos-tip {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #1677ff;
      background: #e6f7ff;
      border: 1px solid #91d5ff;
      border-radius: 8px;
    }

    .work-photo-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .work-photo-card {
      overflow: hidden;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .work-photo-upload {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      font-size: 14px;
      color: #9ca3af;
      background: #f3f4f6;
      transition: background 0.2s;

      &.has-image {
        cursor: default;
        background: #000;
      }

      &.is-disabled .work-photo-empty {
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .work-photo-empty {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      cursor: pointer;
      transition: background 0.2s;

      .work-photo-upload:not(.is-disabled) &:hover {
        background: #e5e7eb;
      }
    }

    .work-photo-delete {
      position: absolute;
      top: 4px;
      right: 4px;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      font-size: 12px;
      color: #fff;
      cursor: pointer;
      background: rgb(0 0 0 / 55%);
      border: none;
      border-radius: 50%;

      &:hover {
        background: rgb(0 0 0 / 75%);
      }
    }

    .work-photo-preview {
      width: 100%;
      height: 100%;
      cursor: zoom-in;

      :deep(.el-image__inner) {
        width: 100%;
        height: 100%;
      }
    }

    .work-photo-input {
      display: none;
    }

    .work-photo-info {
      padding: 8px 12px;

      .name {
        font-size: 12px;
        font-weight: 500;
        color: var(--art-gray-800);
      }

      .code {
        margin-top: 2px;
        font-size: 12px;
        color: var(--art-gray-600);
      }
    }

    .work-log-empty {
      padding: 24px 0;
      font-size: 12px;
      color: var(--art-gray-600);
      text-align: center;
    }

    .work-log-list {
      display: flex;
      flex-direction: column;
    }

    .work-log-item {
      display: flex;
      gap: 12px;
    }

    .work-log-line {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 8px;

      .dot {
        flex-shrink: 0;
        width: 8px;
        height: 8px;
        margin-top: 6px;
        background: #1677ff;
        border-radius: 50%;
      }

      .line {
        flex: 1;
        width: 1px;
        margin: 4px 0;
        background: #e5e7eb;
      }
    }

    .work-log-content {
      flex: 1;
      padding-bottom: 16px;
    }

    .work-log-action {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 14px;
      font-weight: 500;
      color: var(--art-gray-800);

      .operator {
        font-size: 12px;
        font-weight: 400;
        color: var(--art-gray-600);
      }
    }

    .work-log-time,
    .work-log-note {
      margin-top: 4px;
      font-size: 12px;
      color: var(--art-gray-600);
    }

    .work-detail-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }

    .work-footer-progress {
      font-size: 12px;
      color: var(--art-gray-600);
    }

    .work-footer-actions {
      display: flex;
      gap: 8px;
    }
  }
</style>
