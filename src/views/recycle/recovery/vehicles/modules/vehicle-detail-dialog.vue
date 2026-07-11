<template>
  <ElDialog
    v-model="dialogVisible"
    width="1100px"
    align-center
    destroy-on-close
    :show-close="false"
    class="vehicle-detail-dialog"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="vd-shell">
      <!-- Header -->
      <div class="vd-header">
        <div class="vd-header-top">
          <div>
            <div class="vd-plate-row">
              <span class="vd-plate">{{ detail.plate_no || '—' }}</span>
              <span class="vd-archive-badge">{{
                detail.vehicle_no || detail.archive_no || '—'
              }}</span>
            </div>
            <div class="vd-subtitle">
              {{ brandModelText }}<span v-if="detail.color"> · {{ detail.color }}</span>
            </div>
          </div>
          <button type="button" class="vd-close-btn" @click="dialogVisible = false">
            <ArtSvgIcon icon="ri:close-line" />
          </button>
        </div>

        <!-- 三维状态概览 -->
        <div class="vd-dim-bar">
          <div v-for="item in dimOverview" :key="item.label" class="vd-dim-item">
            <div class="vd-dim-icon" :style="{ background: item.bg }">
              <ArtSvgIcon :icon="item.icon" :style="{ color: item.color }" />
            </div>
            <div>
              <div class="vd-dim-label">{{ item.label }}</div>
              <div class="vd-dim-value" :style="{ color: item.color }">{{ item.text }}</div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="vd-tabs">
          <button
            v-for="tab in TABS"
            :key="tab.key"
            type="button"
            class="vd-tab"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <ArtSvgIcon :icon="tab.icon" class="vd-tab-icon" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="vd-body">
        <!-- 档案信息 -->
        <div v-if="activeTab === 'info'" class="vd-info">
          <div class="vd-section">
            <div class="vd-section-title">关联单号</div>
            <div class="vd-section-box">
              <div class="vd-row"
                ><span class="vd-row-label">车辆档案单号</span
                ><span class="vd-row-value mono">{{
                  detail.vehicle_no || detail.archive_no || '—'
                }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">关联回收订单号</span
                ><span class="vd-row-value link">{{ detail.order_no || '—' }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">关联拖车订单号</span
                ><span class="vd-row-value">—</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">线索单号</span><span class="vd-row-value">—</span></div
              >
            </div>
          </div>

          <div class="vd-photo-section">
            <div class="vd-photo-section-head">
              <span class="vd-section-title">所有人信息</span>
              <span class="vd-photo-count">{{ ownerPhotoSlots.length }}张</span>
            </div>
            <div class="vd-photo-grid cols-3">
              <div v-for="slot in ownerPhotoSlots" :key="slot.key" class="vd-photo-slot">
                <div class="vd-photo-box">
                  <ElImage
                    v-if="slot.url"
                    :src="slot.url"
                    fit="cover"
                    class="vd-photo-img"
                    :preview-src-list="[slot.url]"
                  />
                  <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
                </div>
                <span class="vd-photo-name">{{ slot.label }}</span>
              </div>
            </div>
            <div class="vd-section-box">
              <div class="vd-row"
                ><span class="vd-row-label">证件类型</span
                ><span class="vd-row-value">{{ ownerIdType }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">{{ ownerNameLabel }}</span
                ><span class="vd-row-value">{{ detail.owner_name || '—' }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">{{ ownerIdLabel }}</span
                ><span class="vd-row-value">{{ detail.owner_id_card || '—' }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">联系电话</span
                ><span class="vd-row-value">{{ detail.owner_phone || '—' }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">联系地址</span
                ><span class="vd-row-value">{{ detail.owner_address || '—' }}</span></div
              >
            </div>
          </div>

          <div class="vd-photo-section">
            <div class="vd-photo-section-head">
              <span class="vd-section-title">车辆信息</span>
              <span class="vd-photo-count">4张</span>
            </div>
            <div class="vd-photo-grid cols-4">
              <div v-for="slot in vehicleDocSlots" :key="slot.key" class="vd-photo-slot">
                <div class="vd-photo-box">
                  <ElImage
                    v-if="slot.url"
                    :src="slot.url"
                    fit="cover"
                    class="vd-photo-img"
                    :preview-src-list="slot.url ? [slot.url] : []"
                  />
                  <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
                </div>
                <span class="vd-photo-name">{{ slot.label }}</span>
              </div>
            </div>
            <div class="vd-section-box">
              <div class="vd-row"
                ><span class="vd-row-label">车牌号</span
                ><span class="vd-row-value">{{ detail.plate_no || '—' }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">号牌类型</span
                ><span class="vd-row-value">{{ detail.plate_type || '—' }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">车辆类型</span
                ><span class="vd-row-value">{{
                  detail.vehicle_type_text || detail.vehicle_type || '—'
                }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">燃料性质</span
                ><span class="vd-row-value">{{
                  detail.fuel_type_text || detail.fuel_type || '—'
                }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">品牌型号</span
                ><span class="vd-row-value">{{ brandModelText }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">注册登记日期</span
                ><span class="vd-row-value">{{ detail.reg_date || '—' }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">VIN码（车架号）</span
                ><span class="vd-row-value mono">{{ detail.vin || '—' }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">发动机号码</span
                ><span class="vd-row-value">{{ detail.engine_no || '—' }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">车身颜色</span
                ><span class="vd-row-value">{{ detail.color || '—' }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">表显里程</span
                ><span class="vd-row-value">{{
                  detail.mileage ? `${detail.mileage}万公里` : '—'
                }}</span></div
              >
            </div>
          </div>

          <div class="vd-section">
            <div class="vd-section-title">送货方式 & 结算信息</div>
            <div class="vd-section-box">
              <div class="vd-row"
                ><span class="vd-row-label">送货方式</span
                ><span class="vd-row-value">{{ deliveryText }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">结算类型</span
                ><span class="vd-row-value">{{
                  detail.settlement_type_text || detail.settlement_type || '—'
                }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">结算方式</span
                ><span class="vd-row-value">{{
                  detail.settlement_method_text || detail.settlement_method || '—'
                }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">结算金额</span
                ><span class="vd-row-value">{{ detail.settlement_amount ?? '—' }}</span></div
              >
            </div>
          </div>

          <div class="vd-section">
            <div class="vd-section-title">收款银行卡</div>
            <div class="vd-section-box">
              <div class="vd-row"
                ><span class="vd-row-label">开户姓名/名称</span
                ><span class="vd-row-value">{{ detail.bank_name || '—' }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">开户银行</span
                ><span class="vd-row-value">{{ detail.bank_branch || '—' }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">银行卡号</span
                ><span class="vd-row-value">{{ detail.bank_card_no || '—' }}</span></div
              >
            </div>
          </div>

          <div class="vd-photo-section">
            <div class="vd-photo-section-head">
              <span class="vd-section-title">代理人信息</span>
              <span class="vd-photo-count">3张</span>
            </div>
            <div class="vd-photo-grid cols-3">
              <div v-for="slot in agentPhotoSlots" :key="slot.key" class="vd-photo-slot">
                <div class="vd-photo-box">
                  <ArtSvgIcon icon="ri:camera-line" class="vd-photo-camera" />
                </div>
                <span class="vd-photo-name">{{ slot.label }}</span>
              </div>
            </div>
            <div class="vd-section-box">
              <div class="vd-row"
                ><span class="vd-row-label">代理人姓名</span
                ><span class="vd-row-value">{{
                  detail.agent_name || '无代理人（本人办理）'
                }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">代理人证件号</span
                ><span class="vd-row-value">—</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">代理人电话</span
                ><span class="vd-row-value">{{ detail.agent_phone || '—' }}</span></div
              >
            </div>
          </div>

          <div class="vd-section">
            <div class="vd-section-title">备注说明</div>
            <div class="vd-section-box">
              <div class="vd-row"
                ><span class="vd-row-label">备注</span
                ><span class="vd-row-value">{{ detail.remark || '—' }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">库位</span
                ><span class="vd-row-value">{{
                  detail.warehouse_slot || detail.warehouse_name || '—'
                }}</span></div
              >
              <div class="vd-row"
                ><span class="vd-row-label">最后更新</span
                ><span class="vd-row-value">{{
                  detail.update_time_text || detail.add_time_text || '—'
                }}</span></div
              >
            </div>
          </div>

          <!-- 影像材料 -->
          <div class="vd-media-block">
            <div class="vd-media-title">影像材料</div>
            <div v-if="photoList.length" class="vd-photo-grid cols-4">
              <div v-for="item in photoList" :key="item.key" class="vd-photo-slot">
                <div class="vd-photo-box">
                  <ElImage
                    :src="item.url"
                    fit="cover"
                    class="vd-photo-img"
                    :preview-src-list="[item.url]"
                  />
                </div>
                <span class="vd-photo-name">{{ item.label }}</span>
              </div>
            </div>
            <div v-else class="vd-media-empty">暂无影像材料</div>
          </div>
        </div>

        <!-- 拖车进度 -->
        <div v-else-if="activeTab === 'tow'" class="vd-tab-panel">
          <div class="vd-panel-label">拖车进度记录</div>
          <div v-if="needTow && towSteps.length" class="vd-timeline">
            <div v-for="(step, idx) in towSteps" :key="idx" class="vd-timeline-item">
              <div class="vd-timeline-rail">
                <div class="vd-timeline-dot" :class="{ done: step.done }">
                  <ArtSvgIcon v-if="step.done" icon="ri:check-line" class="vd-check-icon" />
                </div>
                <div
                  v-if="idx < towSteps.length - 1"
                  class="vd-timeline-line"
                  :class="{ done: step.done }"
                />
              </div>
              <div class="vd-timeline-content">
                <div class="vd-timeline-label" :class="{ muted: !step.done }">{{ step.label }}</div>
                <div v-if="step.time && step.time !== '—'" class="vd-timeline-time">{{
                  step.time
                }}</div>
                <div v-if="step.note" class="vd-timeline-note">{{ step.note }}</div>
              </div>
            </div>
          </div>
          <div v-else class="vd-empty-panel">
            <ArtSvgIcon icon="ri:truck-line" class="vd-empty-icon" />
            <p>该车辆无需拖车</p>
          </div>
        </div>

        <!-- 入厂拆解 -->
        <div v-else-if="activeTab === 'entry'" class="vd-tab-panel">
          <div class="vd-panel-label">入厂拆解 · V20 五步流转</div>
          <div v-if="factorySteps.length" class="vd-v20-list">
            <div
              v-for="(step, idx) in factorySteps"
              :key="idx"
              class="vd-v20-card"
              :class="step.state"
            >
              <div class="vd-v20-left">
                <div class="vd-v20-circle" :class="step.state">{{
                  step.state === 'done' ? '✓' : idx + 1
                }}</div>
                <div class="vd-v20-text">
                  <div class="vd-v20-title-row">
                    <span class="vd-v20-title" :class="{ muted: step.state === 'pending' }">{{
                      step.label
                    }}</span>
                    <span class="vd-v20-badge" :class="step.state">{{ step.badge }}</span>
                  </div>
                  <div v-if="step.desc" class="vd-v20-desc">{{ step.desc }}</div>
                  <div v-if="step.time" class="vd-v20-time">{{ step.time }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="vd-empty-panel">
            <ArtSvgIcon icon="ri:building-2-line" class="vd-empty-icon" />
            <p>暂无入厂拆解进度</p>
          </div>
        </div>

        <!-- 注销办证 -->
        <div v-else-if="activeTab === 'cancel'" class="vd-tab-panel">
          <div class="vd-panel-label">注销办证进度（四步流程）</div>
          <div v-if="cancelSteps.length" class="vd-timeline">
            <div v-for="(step, idx) in cancelSteps" :key="idx" class="vd-timeline-item">
              <div class="vd-timeline-rail">
                <div class="vd-timeline-dot" :class="{ done: step.done }">
                  <ArtSvgIcon v-if="step.done" icon="ri:check-line" class="vd-check-icon" />
                </div>
                <div
                  v-if="idx < cancelSteps.length - 1"
                  class="vd-timeline-line"
                  :class="{ done: step.done }"
                />
              </div>
              <div class="vd-timeline-content">
                <div class="vd-timeline-label" :class="{ muted: !step.done }">{{ step.label }}</div>
                <div v-if="step.time && step.time !== '—'" class="vd-timeline-time">{{
                  step.time
                }}</div>
                <div v-if="step.note" class="vd-timeline-note">{{ step.note }}</div>
              </div>
            </div>
          </div>
          <div v-else class="vd-empty-panel">
            <ArtSvgIcon icon="ri:file-list-3-line" class="vd-empty-icon" />
            <p>暂无注销办证进度</p>
          </div>
        </div>

        <!-- 操作日志 -->
        <div v-else-if="activeTab === 'log'" class="vd-tab-panel">
          <div class="vd-panel-label">操作日志</div>
          <div v-if="logItems.length" class="vd-log-list">
            <div v-for="(item, idx) in logItems" :key="idx" class="vd-log-item">
              <div class="vd-log-rail">
                <div class="vd-log-dot" />
                <div v-if="idx < logItems.length - 1" class="vd-log-line" />
              </div>
              <div class="vd-log-content">
                <div class="vd-log-action">
                  <span class="vd-log-title">{{ item.title }}</span>
                  <span v-if="item.operator_name" class="vd-log-op">{{ item.operator_name }}</span>
                </div>
                <div v-if="item.time" class="vd-timeline-time">{{ item.time }}</div>
              </div>
            </div>
          </div>
          <div v-else class="vd-empty-panel">
            <ArtSvgIcon icon="ri:clipboard-line" class="vd-empty-icon" />
            <p>暂无操作日志</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="vd-footer">
        <ElButton @click="dialogVisible = false">关闭</ElButton>
      </div>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchVehicleDetail } from '@/api/recycle/vehicle'
  import type {
    ScrapVehicleDetail,
    VehicleDimStatusItem,
    VehicleFlowStep
  } from '@/types/recycle/vehicle'

  interface Props {
    visible: boolean
    vehicleId?: number
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
  }

  const props = withDefaults(defineProps<Props>(), {
    vehicleId: 0
  })
  const emit = defineEmits<Emits>()

  const TABS = [
    { key: 'info', label: '档案信息', icon: 'ri:car-line' },
    { key: 'tow', label: '拖车进度', icon: 'ri:truck-line' },
    { key: 'entry', label: '入厂拆解', icon: 'ri:box-3-line' },
    { key: 'cancel', label: '注销办证', icon: 'ri:file-text-line' },
    { key: 'log', label: '操作日志', icon: 'ri:clipboard-line' }
  ] as const

  type TabKey = (typeof TABS)[number]['key']

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val: boolean) => emit('update:visible', val)
  })

  const loading = ref(false)
  const activeTab = ref<TabKey>('info')
  const detail = ref<ScrapVehicleDetail>({ id: 0, status: 0 })

  const brandModelText = computed(
    () =>
      detail.value.brand_model ||
      [detail.value.brand, detail.value.model].filter(Boolean).join(' ') ||
      '—'
  )

  const ownerIdType = computed(() =>
    detail.value.owner_type === 'company' ? '统一社会信用代码' : '居民身份证'
  )
  const ownerNameLabel = computed(() =>
    detail.value.owner_type === 'company' ? '企业完整名称' : '所有人姓名'
  )
  const ownerIdLabel = computed(() =>
    detail.value.owner_type === 'company' ? '统一社会信用代码' : '身份证号码'
  )

  const deliveryText = computed(() => {
    if (detail.value.delivery_method_text) return detail.value.delivery_method_text
    if (detail.value.delivery_method === 'tow') return '需要拖车运输（预约上门取车）'
    if (detail.value.delivery_method === 'self') return '自行送车'
    return '—'
  })

  const needTow = computed(() => detail.value.delivery_method === 'tow')

  const dimOverview = computed(() => {
    const dim = detail.value.dim_status
    const fallback = (label: string, icon: string): VehicleDimStatusItem & { icon: string } => ({
      label,
      icon,
      text: '—',
      color: '#8c8c8c',
      bg: '#f5f5f5'
    })
    if (!dim) {
      return [
        { ...fallback('拖车', 'ri:truck-line'), text: detail.value.status_text || '—' },
        { ...fallback('入厂', 'ri:box-3-line'), text: detail.value.status_text || '—' },
        { ...fallback('注销', 'ri:file-text-line'), text: detail.value.status_text || '—' }
      ]
    }
    return [
      {
        label: '拖车',
        icon: 'ri:truck-line',
        text: dim.tow?.label || '—',
        color: dim.tow?.color || '#8c8c8c',
        bg: dim.tow?.bg || '#f5f5f5'
      },
      {
        label: '入厂',
        icon: 'ri:box-3-line',
        text: dim.factory?.label || '—',
        color: dim.factory?.color || '#8c8c8c',
        bg: dim.factory?.bg || '#f5f5f5'
      },
      {
        label: '注销',
        icon: 'ri:file-text-line',
        text: dim.cancel?.label || '—',
        color: dim.cancel?.color || '#8c8c8c',
        bg: dim.cancel?.bg || '#f5f5f5'
      }
    ]
  })

  const PHOTO_LABELS: Record<string, string> = {
    front: '车辆正前方',
    rear: '车辆正后方',
    interior: '车辆内饰',
    vin: '车架号拓号照',
    exterior: '车辆外观',
    loading: '装车照片',
    unloading: '卸车照片'
  }

  const photoList = computed(() => {
    const photos = detail.value.photos || {}
    return Object.entries(photos)
      .filter(([, url]) => !!url)
      .map(([key, url]) => ({ key, url: String(url), label: PHOTO_LABELS[key] || key }))
  })

  const ownerPhotoSlots = computed(() => [
    { key: 'id_front', label: '身份证正面', url: '' },
    { key: 'id_back', label: '身份证反面', url: '' },
    { key: 'missing', label: '缺失情况说明', url: '' }
  ])

  const vehicleDocSlots = computed(() => [
    { key: 'xszzp', label: '行驶证正页', url: '' },
    { key: 'xszzpfy', label: '行驶证副页', url: '' },
    { key: 'xszbmzp', label: '正副背面', url: '' },
    { key: 'czzp', label: '产证一二页', url: '' }
  ])

  const agentPhotoSlots = [
    { key: 'a1', label: '代理人身份证正面' },
    { key: 'a2', label: '代理人身份证反面' },
    { key: 'a3', label: '委托说明' }
  ]

  function mapFlowSteps(steps?: VehicleFlowStep[]) {
    return (steps || []).map((s) => ({
      label: s.label || '',
      done: !!s.done,
      time: s.time || '',
      note: s.desc || s.operator || '',
      desc: s.desc || ''
    }))
  }

  const towSteps = computed(() => mapFlowSteps(detail.value.tow_progress))
  const cancelSteps = computed(() => mapFlowSteps(detail.value.cancel_flow))

  const factorySteps = computed(() => {
    const flow = detail.value.factory_flow || []
    const currentIdx = flow.findIndex((s) => !s.done)
    const idx = currentIdx === -1 ? flow.length : currentIdx
    return flow.map((step, i) => {
      const isDone = i < idx || (currentIdx === -1 && !!step.done)
      const isCurrent = i === idx && currentIdx !== -1
      // const isPending = i > idx
      let state: 'done' | 'current' | 'pending' = 'pending'
      if (isDone) state = 'done'
      else if (isCurrent) state = 'current'
      let badge = '待执行'
      if (isCurrent) badge = '当前'
      else if (isDone) badge = '已完成'
      return {
        label: step.label || '',
        desc: step.desc || '',
        time: step.time || '',
        state,
        badge
      }
    })
  })

  const logItems = computed(() => {
    const logs = detail.value.operation_logs || detail.value.status_logs || []
    return logs.map((log) => ({
      title: log.title || '操作',
      operator_name: log.operator_name || '',
      time: log.time || ''
    }))
  })

  async function loadDetail() {
    if (!props.vehicleId) return
    loading.value = true
    try {
      detail.value = await fetchVehicleDetail(props.vehicleId)
    } catch {
      detail.value = { id: props.vehicleId, status: 0 }
    } finally {
      loading.value = false
    }
  }

  function handleClosed() {
    activeTab.value = 'info'
    detail.value = { id: 0, status: 0 }
  }

  watch(
    () => props.visible,
    (val) => {
      if (val) loadDetail()
    }
  )
</script>

<style scoped lang="scss">
  @use '../vehicles-dialog' as *;

  .vd-shell {
    display: flex;
    flex-direction: column;
    height: 94vh;
    margin: -16px -20px -20px;
    overflow: hidden;
    background: #fff;
    border-radius: 8px;
  }

  .vd-header {
    flex-shrink: 0;
    padding: 16px 20px 0;
    border-bottom: 1px solid $vm-border;
  }

  .vd-header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .vd-plate-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 4px;
  }

  .vd-plate {
    font-size: 18px;
    font-weight: 700;
    color: $vm-text;
  }

  .vd-archive-badge {
    padding: 2px 8px;
    font-size: 12px;
    color: $vm-text-sub;
    background: $vm-gray-100;
    border-radius: 4px;
  }

  .vd-subtitle {
    font-size: 14px;
    color: $vm-text-sub;
  }

  .vd-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    font-size: 20px;
    color: $vm-text-sub;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;

    &:hover {
      background: $vm-gray-100;
    }
  }

  .vd-dim-bar {
    display: flex;
    gap: 16px;
    padding: 12px;
    margin-bottom: 12px;
    background: $vm-gray-50;
    border-radius: 8px;
  }

  .vd-dim-item {
    display: flex;
    flex: 1;
    gap: 8px;
    align-items: center;
  }

  .vd-dim-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 14px;
    border-radius: 8px;
  }

  .vd-dim-label {
    font-size: 12px;
    color: $vm-text-sub;
  }

  .vd-dim-value {
    font-size: 12px;
    font-weight: 600;
  }

  .vd-tabs {
    display: flex;
    gap: 0;
    padding: 0 20px;
    margin: 0 -20px;
    border-bottom: 1px solid #f0f0f0;
  }

  .vd-tab {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 500;
    color: $vm-text-sub;
    cursor: pointer;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;

    &.active {
      color: $vm-primary;
      border-bottom-color: $vm-primary;
    }

    &:hover:not(.active) {
      color: #595959;
    }
  }

  .vd-tab-icon {
    font-size: 14px;
  }

  .vd-body {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

  .vd-info {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .vd-section-title {
    padding-bottom: 6px;
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 600;
    color: $vm-text-sub;
    text-transform: uppercase;
    border-bottom: 1px solid #f0f0f0;
  }

  .vd-section-box {
    padding: 4px 16px;
    background: $vm-gray-50;
    border-radius: 8px;
  }

  .vd-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 10px 0;
    border-bottom: 1px solid #fafafa;

    &:last-child {
      border-bottom: none;
    }
  }

  .vd-row-label {
    flex-shrink: 0;
    width: 112px;
    padding-top: 2px;
    font-size: 12px;
    color: $vm-text-sub;
  }

  .vd-row-value {
    flex: 1;
    font-size: 14px;
    color: $vm-text;
    word-break: break-all;

    &.mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    &.link {
      color: $vm-primary;
    }
  }

  .vd-photo-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 6px;
    margin-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;

    .vd-section-title {
      margin-bottom: 0;
      border-bottom: none;
    }
  }

  .vd-photo-count {
    font-size: 12px;
    color: $vm-text-sub;
  }

  .vd-photo-grid {
    display: grid;
    gap: 8px;
    margin-bottom: 12px;

    &.cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    &.cols-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .vd-photo-box {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: $vm-gray-100;
    border: 1px dashed $vm-border;
    border-radius: 6px;
    transition: border-color 0.2s;

    &:hover {
      border-color: $vm-primary;
    }
  }

  .vd-photo-img {
    width: 100%;
    height: 100%;
  }

  .vd-photo-camera {
    font-size: 14px;
    color: #d9d9d9;
  }

  .vd-photo-name {
    display: block;
    margin-top: 4px;
    overflow: hidden;
    font-size: 9px;
    color: $vm-text-sub;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vd-media-block {
    padding-top: 16px;
    border-top: 2px solid #f0f0f0;
  }

  .vd-media-title {
    margin-bottom: 16px;
    font-size: 14px;
    font-weight: 600;
    color: #434343;
  }

  .vd-media-empty {
    padding: 24px 0;
    font-size: 13px;
    color: $vm-text-sub;
    text-align: center;
  }

  .vd-panel-label {
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 600;
    color: $vm-text-sub;
    text-transform: uppercase;
  }

  .vd-timeline-item {
    display: flex;
    gap: 12px;
  }

  .vd-timeline-rail {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    align-items: center;
  }

  .vd-timeline-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-top: 2px;
    background: $vm-gray-100;
    border: 2px solid #d9d9d9;
    border-radius: 50%;

    &.done {
      background: $vm-success;
      border-color: $vm-success;
    }
  }

  .vd-check-icon {
    font-size: 12px;
    color: #fff;
  }

  .vd-timeline-line {
    flex: 1;
    width: 1px;
    min-height: 20px;
    margin: 4px 0;
    background: $vm-border;

    &.done {
      background: $vm-success;
    }
  }

  .vd-timeline-content {
    flex: 1;
    min-width: 0;
    padding-bottom: 16px;
  }

  .vd-timeline-label {
    font-size: 14px;
    font-weight: 500;
    color: $vm-text;

    &.muted {
      color: $vm-text-sub;
    }
  }

  .vd-timeline-time,
  .vd-timeline-note {
    margin-top: 2px;
    font-size: 12px;
    color: $vm-text-sub;
  }

  .vd-v20-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .vd-v20-card {
    padding: 16px;
    border: 1px solid $vm-border;
    border-radius: 8px;

    &.done {
      background: #fafffe;
      border-color: #b7eb8f;
    }

    &.current {
      background: #fff7e6;
      border-color: #fa8c16;
    }

    &.pending {
      background: $vm-gray-50;
      border-color: $vm-border;
    }
  }

  .vd-v20-left {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .vd-v20-circle {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    border-radius: 50%;

    &.done {
      background: $vm-success;
    }

    &.current {
      background: #fa8c16;
    }

    &.pending {
      color: $vm-text-sub;
      background: $vm-border;
    }
  }

  .vd-v20-title-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .vd-v20-title {
    font-size: 14px;
    font-weight: 600;
    color: $vm-text;

    &.muted {
      color: $vm-text-sub;
    }
  }

  .vd-v20-badge {
    padding: 2px 6px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 4px;

    &.done {
      color: $vm-success;
      background: #f6ffed;
    }

    &.current {
      color: #fa8c16;
      background: #fff7e6;
    }

    &.pending {
      color: $vm-text-sub;
      background: $vm-gray-100;
    }
  }

  .vd-v20-desc,
  .vd-v20-time {
    margin-top: 4px;
    font-size: 12px;
    color: $vm-text-sub;
  }

  .vd-log-list {
    display: flex;
    flex-direction: column;
  }

  .vd-log-item {
    display: flex;
    gap: 12px;
  }

  .vd-log-rail {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .vd-log-dot {
    width: 8px;
    height: 8px;
    margin-top: 6px;
    background: $vm-primary;
    border-radius: 50%;
  }

  .vd-log-line {
    flex: 1;
    width: 1px;
    margin: 4px 0;
    background: #e8e8e8;
  }

  .vd-log-content {
    flex: 1;
    padding-bottom: 16px;
  }

  .vd-log-action {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .vd-log-title {
    font-size: 14px;
    font-weight: 500;
    color: $vm-text;
  }

  .vd-log-op {
    font-size: 12px;
    color: $vm-text-sub;
  }

  .vd-empty-panel {
    padding: 32px 0;
    color: $vm-text-sub;
    text-align: center;

    p {
      margin-top: 8px;
      font-size: 14px;
    }
  }

  .vd-empty-icon {
    font-size: 32px;
    color: #d9d9d9;
  }

  .vd-footer {
    display: flex;
    flex-shrink: 0;
    justify-content: flex-end;
    padding: 16px 20px;
    border-top: 1px solid $vm-border;
  }
</style>

<style lang="scss">
  .vehicle-detail-dialog {
    .el-dialog__header {
      display: none;
    }

    .el-dialog__body {
      padding: 0;
    }

    .el-dialog__footer {
      display: none;
    }
  }
</style>
