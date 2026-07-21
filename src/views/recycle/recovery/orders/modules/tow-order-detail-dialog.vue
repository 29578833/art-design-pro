<template>
  <ElDialog
    v-model="dialogVisible"
    width="960px"
    align-center
    destroy-on-close
    :show-close="false"
    class="td-detail-dialog"
    @closed="handleClosed"
  >
    <!-- ===== 标题 ===== -->
    <template #header>
      <div class="td-header">
        <div class="td-header-left">
          <span class="td-title">拖车订单详情</span>
          <span class="td-type-tag">拖车单</span>
          <span v-if="!loading" class="td-status-badge" :style="statusBadgeStyle">{{
            statusLabel
          }}</span>
          <span v-if="!loading && towNo !== '—'" class="td-order-no">{{ towNo }}</span>
        </div>
        <button type="button" class="td-close-btn" @click="dialogVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <!-- ===== Tab 栏 ===== -->
    <div class="td-tab-bar">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        class="td-tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <ArtSvgIcon :icon="tab.icon" class="td-tab-icon" />
        {{ tab.label }}
      </button>
    </div>

    <!-- ===== 内容区 ===== -->
    <div v-loading="loading" class="td-body">
      <!-- Tab: 基础信息 -->
      <template v-if="activeTab === 'basic'">
        <div class="td-cards">
          <!-- 车辆信息 -->
          <div class="td-card">
            <div class="td-card-title">车辆信息</div>
            <ElRow :gutter="24">
              <ElCol :span="8">
                <div class="td-item">
                  <div class="td-label">车牌号</div>
                  <div class="td-value td-value--bold td-value--plate">{{ plateNo }}</div>
                </div>
              </ElCol>
              <ElCol :span="8">
                <div class="td-item">
                  <div class="td-label">VIN 码</div>
                  <div class="td-value td-value--mono">{{ vin }}</div>
                </div>
              </ElCol>
              <ElCol :span="8">
                <div class="td-item">
                  <div class="td-label">品牌车型</div>
                  <div class="td-value">{{ brandModel }}</div>
                </div>
              </ElCol>
            </ElRow>
          </div>

          <!-- 任务信息 -->
          <div class="td-card">
            <div class="td-card-title">任务信息</div>
            <ElRow :gutter="24">
              <ElCol :span="8">
                <div class="td-item">
                  <div class="td-label">拖车单号</div>
                  <div class="td-value td-value--mono td-value--primary">{{ towNo }}</div>
                </div>
              </ElCol>
              <ElCol :span="8">
                <div class="td-item">
                  <div class="td-label">关联回收订单</div>
                  <div class="td-value td-value--link">{{ relatedOrderNo }}</div>
                </div>
              </ElCol>
              <ElCol :span="8">
                <div class="td-item">
                  <div class="td-label">托运方式</div>
                  <div class="td-value">预约拖车</div>
                </div>
              </ElCol>
              <ElCol :span="8">
                <div class="td-item">
                  <div class="td-label">创建时间</div>
                  <div class="td-value">{{ createTimeText }}</div>
                </div>
              </ElCol>
              <ElCol :span="8">
                <div class="td-item">
                  <div class="td-label">创建人</div>
                  <div class="td-value">{{ creatorName }}</div>
                </div>
              </ElCol>
              <ElCol v-if="completionTimeText !== '—'" :span="8">
                <div class="td-item">
                  <div class="td-label">完成时间</div>
                  <div class="td-value">{{ completionTimeText }}</div>
                </div>
              </ElCol>
              <ElCol v-if="remarkText !== '—'" :span="24">
                <div class="td-item">
                  <div class="td-label">备注</div>
                  <div class="td-value">{{ remarkText }}</div>
                </div>
              </ElCol>
            </ElRow>
          </div>

          <!-- 拖车路线 -->
          <div class="td-card">
            <div class="td-card-title">拖车路线</div>
            <div class="td-route">
              <div class="td-route-point">
                <div class="td-route-icon td-route-icon--start">
                  <ArtSvgIcon icon="ri:map-pin-2-line" />
                </div>
                <div>
                  <div class="td-label">取车地址</div>
                  <div class="td-value">{{ pickupAddress }}</div>
                </div>
              </div>
              <div class="td-route-spine" />
              <div class="td-route-point">
                <div class="td-route-icon td-route-icon--end">
                  <ArtSvgIcon icon="ri:map-pin-line" />
                </div>
                <div>
                  <div class="td-label">送达地址</div>
                  <div class="td-value">{{ deliveryAddress }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 客户信息 -->
          <div class="td-card">
            <div class="td-card-title">客户信息</div>
            <ElRow :gutter="24">
              <ElCol :span="8">
                <div class="td-item">
                  <div class="td-label">客户姓名</div>
                  <div class="td-value">{{ customerName }}</div>
                </div>
              </ElCol>
              <ElCol :span="8">
                <div class="td-item">
                  <div class="td-label">联系电话</div>
                  <div class="td-phone-row">
                    <span class="td-value">{{ customerPhone }}</span>
                    <button
                      v-if="customerPhone !== '—'"
                      type="button"
                      class="td-call-btn"
                      @click="handleCallCustomer"
                    >
                      <ArtSvgIcon icon="ri:phone-line" />
                    </button>
                  </div>
                </div>
              </ElCol>
            </ElRow>
          </div>

          <!-- 司机信息（已派单后显示） -->
          <div v-if="driverName !== '—' || driverPhone !== '—'" class="td-card">
            <div class="td-card-title">司机信息</div>
            <ElRow :gutter="24">
              <ElCol :span="8">
                <div class="td-item">
                  <div class="td-label">司机姓名</div>
                  <div class="td-value">{{ driverName }}</div>
                </div>
              </ElCol>
              <ElCol :span="8">
                <div class="td-item">
                  <div class="td-label">司机电话</div>
                  <div class="td-phone-row">
                    <span class="td-value">{{ driverPhone }}</span>
                    <button
                      v-if="driverPhone !== '—'"
                      type="button"
                      class="td-call-btn"
                      @click="handleCallDriver"
                    >
                      <ArtSvgIcon icon="ri:phone-line" />
                    </button>
                  </div>
                </div>
              </ElCol>
              <ElCol v-if="dispatchTimeText !== '—'" :span="8">
                <div class="td-item">
                  <div class="td-label">派单时间</div>
                  <div class="td-value">{{ dispatchTimeText }}</div>
                </div>
              </ElCol>
              <ElCol v-if="dispatchBy !== '—'" :span="8">
                <div class="td-item">
                  <div class="td-label">派单人</div>
                  <div class="td-value">{{ dispatchBy }}</div>
                </div>
              </ElCol>
              <ElCol v-if="acceptTimeText !== '—'" :span="8">
                <div class="td-item">
                  <div class="td-label">接单时间</div>
                  <div class="td-value">{{ acceptTimeText }}</div>
                </div>
              </ElCol>
            </ElRow>
          </div>
        </div>
      </template>

      <!-- Tab: 全链路进度 -->
      <template v-else-if="activeTab === 'progress'">
        <div class="td-progress">
          <!-- 横向步骤条 -->
          <div class="td-steps-card">
            <div class="td-steps-track">
              <div class="td-steps-bg-line" />
              <div
                v-if="currentStepIdx > 0"
                class="td-steps-fill-line"
                :style="{ width: stepFillWidth }"
              />
              <div v-for="(step, i) in TOW_STEPS" :key="step.key" class="td-step-col">
                <div
                  class="td-step-circle"
                  :class="{
                    'td-step-circle--done': i < currentStepIdx,
                    'td-step-circle--active': i === currentStepIdx,
                    'td-step-circle--pending': i > currentStepIdx
                  }"
                >
                  <ArtSvgIcon
                    v-if="i < currentStepIdx"
                    icon="ri:checkbox-circle-line"
                    class="td-step-check"
                  />
                  <span v-else class="td-step-num">{{ i + 1 }}</span>
                </div>
                <span
                  class="td-step-label"
                  :class="{
                    'td-step-label--done': i < currentStepIdx,
                    'td-step-label--active': i === currentStepIdx
                  }"
                  >{{ step.label }}</span
                >
                <span class="td-step-sub">{{ step.sub }}</span>
              </div>
            </div>
          </div>

          <!-- 全链路操作记录（纵向时间线） -->
          <div class="td-timeline-card">
            <div class="td-timeline-header">
              <ArtSvgIcon icon="ri:time-line" class="td-timeline-hicon" />
              <span class="td-timeline-htitle">全链路操作记录</span>
              <span class="td-timeline-hsub">（含管理员及司机操作节点）</span>
            </div>
            <div class="td-timeline-body">
              <div v-for="(node, i) in timelineNodes" :key="node.id" class="td-tl-row">
                <!-- 节点轴 -->
                <div class="td-tl-axis">
                  <div
                    class="td-tl-dot"
                    :class="{
                      'td-tl-dot--done': node.status === 'done',
                      'td-tl-dot--active': node.status === 'active',
                      'td-tl-dot--pending': node.status === 'pending'
                    }"
                  />
                  <div
                    v-if="i < timelineNodes.length - 1"
                    class="td-tl-line"
                    :class="{ 'td-tl-line--done': node.status === 'done' }"
                  />
                </div>
                <!-- 节点内容 -->
                <div
                  class="td-tl-content"
                  :class="{ 'td-tl-content--pending': node.status === 'pending' }"
                >
                  <div class="td-tl-title-row">
                    <span
                      class="td-tl-stage"
                      :class="{
                        'td-tl-stage--done': node.status === 'done',
                        'td-tl-stage--active': node.status === 'active'
                      }"
                      >{{ node.stage }}</span
                    >
                    <span
                      v-if="node.role"
                      class="td-tl-role"
                      :class="{ 'td-tl-role--driver': node.role === '拖车司机' }"
                      >{{ node.role }}</span
                    >
                    <span v-if="node.status === 'active'" class="td-tl-ing">进行中</span>
                  </div>
                  <div v-if="node.name && node.name !== '—'" class="td-tl-person">
                    <ArtSvgIcon icon="ri:user-line" class="td-tl-person-icon" />
                    <span>{{ node.name }}</span>
                    <template v-if="node.phone && node.phone !== '—'">
                      <ArtSvgIcon icon="ri:phone-line" class="td-tl-person-icon" />
                      <span>{{ node.phone }}</span>
                    </template>
                  </div>
                  <div v-if="node.extra" class="td-tl-extra">{{ node.extra }}</div>
                  <div class="td-tl-time">
                    <ArtSvgIcon icon="ri:time-line" class="td-tl-time-icon" />
                    {{ node.time }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Tab: 照片 & 签名 -->
      <template v-else-if="activeTab === 'photos'">
        <div class="td-media">
          <!-- 到达照片 -->
          <div>
            <div class="td-media-header">
              <ArtSvgIcon icon="ri:camera-line" class="td-media-hicon" />
              <span class="td-media-htitle">到达照片</span>
            </div>
            <div class="td-photos-grid">
              <template v-if="completionPhotos.length > 0">
                <div
                  v-for="(photo, i) in completionPhotos"
                  :key="i"
                  class="td-photo-item"
                  @click="handlePreviewPhoto(photo)"
                >
                  <img :src="photo" :alt="`到达照片${i + 1}`" class="td-photo-img" />
                </div>
              </template>
              <template v-else>
                <div v-for="n in 4" :key="n" class="td-photo-item td-photo-item--empty">
                  <ArtSvgIcon icon="ri:camera-line" class="td-photo-empty-icon" />
                  <span class="td-photo-empty-text">暂无照片</span>
                </div>
              </template>
            </div>
            <p class="td-media-tip">司机到达取车现场后在回收小程序拍摄并上传的车辆到达状态照片</p>
          </div>

          <!-- 司机签名 -->
          <div>
            <div class="td-media-header">
              <ArtSvgIcon icon="ri:pen-nib-line" class="td-media-hicon" />
              <span class="td-media-htitle">司机签名</span>
            </div>
            <div class="td-signature-box">
              <img
                v-if="driverSignature !== '—'"
                :src="driverSignature"
                alt="司机电子签名"
                class="td-signature-img"
              />
              <div v-else class="td-signature-empty">
                <ArtSvgIcon icon="ri:pen-nib-line" class="td-signature-empty-icon" />
                <p class="td-signature-empty-text">
                  {{ statusCode === 4 ? '暂无签名数据' : '拖车完成后司机进行签名确认' }}
                </p>
              </div>
            </div>
            <p class="td-media-tip">司机在回收小程序完成拖车任务后的电子签名确认，具有法律效力</p>
          </div>
        </div>
      </template>
    </div>

    <!-- ===== 底栏 ===== -->
    <template #footer>
      <div class="td-footer">
        <div class="td-footer-left">
          <span v-if="towNo !== '—'" class="td-footer-no">
            <ArtSvgIcon icon="ri:truck-line" class="td-footer-no-icon" />
            {{ towNo }}
          </span>
        </div>
        <div class="td-footer-right">
          <ElButton size="large" @click="dialogVisible = false">关闭</ElButton>
          <ElButton
            v-if="statusCode === 2 || statusCode === 3"
            size="large"
            :loading="submitting"
            @click="handleReassign"
          >
            重新指派
          </ElButton>
          <ElButton
            v-if="statusCode === 1"
            size="large"
            type="primary"
            :loading="submitting"
            @click="dispatchDialogVisible = true"
          >
            <ArtSvgIcon icon="ri:truck-line" class="mr-1" />
            指派司机
          </ElButton>
          <ElButton
            v-if="statusCode === 3"
            size="large"
            type="success"
            :loading="submitting"
            @click="handleComplete"
          >
            <ArtSvgIcon icon="ri:check-line" class="mr-1" />
            确认完成
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>

  <TowDriverAssignDialog
    v-model:visible="dispatchDialogVisible"
    :order-id="props.orderId"
    :current-driver-id="detail.driver_id"
    :delivery-address="deliveryAddress !== '—' ? deliveryAddress : ''"
    @success="handleDispatchSuccess"
  />

  <!-- 图片预览 -->
  <ElImageViewer
    v-if="previewVisible"
    :url-list="previewList"
    :initial-index="previewIndex"
    @close="previewVisible = false"
  />
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchTowOrderDetail, fetchUpdateTowStatus } from '@/api/recycle/order'
  import type { OrderDetail, OrderStatusLog, OrderVehicle } from '@/types/recycle/order'
  import TowDriverAssignDialog from './tow-driver-assign-dialog.vue'

  type TabKey = 'basic' | 'progress' | 'photos'
  type NodeStatus = 'done' | 'active' | 'pending'

  interface TowDriverInfo {
    real_name?: string
    nickname?: string
    name?: string
    phone?: string
  }

  interface TowOperationLog {
    action?: string
    content?: string
    operator_id?: number
    operator_name?: string
    operator_role?: string
    add_time?: number | string
    change_time?: number
    change_message?: string
    to_status?: number
    /** 兼容 OrderDetail.operation_logs 的索引签名 */
    [key: string]: unknown
  }

  interface TowDetail extends OrderDetail {
    /** 拖车状态码 */
    tow_status?: number
    /** 拖车状态文案 */
    tow_status_text?: string
    /** 拖车单号 */
    tow_order_no?: string
    /** 创建时间 */
    create_time?: number | string
    /** 创建时间文案 */
    create_time_text?: string
    /** 完成时间 */
    complete_time?: number | string
    /** 完成时间文案 */
    complete_time_text?: string
    /** 完成时间 */
    finish_time?: number | string
    /** 完成时间文案 */
    finish_time_text?: string
    /** 出发时间 */
    depart_time?: number | string
    /** 到达照片 */
    images?: string[] | string
    /** 关联订单客户姓名 */
    order_real_name?: string
    /** 关联订单客户电话 */
    order_phone?: string
    /** 关联订单车牌号 */
    order_plate_no?: string
    /** 关联订单 VIN */
    order_vin?: string
    /** 品牌车型拼接文案 */
    brand_model?: string
    /** 车牌/拖车车牌 */
    truck_plate?: string
    /** 拖车公司 */
    tow_company?: string
    /** 客户姓名 */
    customer_name?: string
    /** 客户电话 */
    customer_phone?: string
    /** 目的地地址 */
    destination_address?: string
    /** 回收厂地址 */
    factory_address?: string
    /** 司机姓名 */
    assigned_driver_name?: string
    /** 派单人姓名 */
    dispatcher_name?: string
    /** 司机签名 */
    sign_url?: string
    /** 司机签名 */
    signature_url?: string
    /** 到达照片 */
    photos?: string[] | string
    /** 到达照片 */
    arrival_photos?: string[] | string
    /** 到达照片 */
    finish_photos?: string[] | string
    /** 关联订单 */
    order?: Partial<OrderDetail> & { customer_name?: string; customer_phone?: string }
    /** 关联车辆 */
    vehicle?: Partial<OrderVehicle>
    /** 司机信息 */
    driver?: TowDriverInfo
    /** 创建人信息 */
    creator?: TowDriverInfo
    /** 派单人信息 */
    dispatcher?: TowDriverInfo
    /** 操作日志 */
    logs?: TowOperationLog[]
    /** 操作日志 */
    status_log?: TowOperationLog[]
    /** 后端 tow/detail 合并后的全链路日志 */
    operation_logs?: TowOperationLog[]
  }

  interface Props {
    visible: boolean
    orderId: number | null
  }

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'basic', label: '基础信息', icon: 'ri:file-text-line' },
    { key: 'progress', label: '全链路进度', icon: 'ri:git-branch-line' },
    { key: 'photos', label: '照片 & 签名', icon: 'ri:camera-line' }
  ]

  /** 拖车状态配置 */
  const TOW_STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: '待派单', color: '#FAAD14', bg: '#FFFBE6' },
    2: { label: '待拖车', color: '#1677ff', bg: '#E6F7FF' },
    3: { label: '拖车中', color: '#13C2C2', bg: '#E6FFFB' },
    4: { label: '已完成', color: '#52C41A', bg: '#F6FFED' }
  }

  /** 步骤条定义 */
  const TOW_STEPS = [
    { key: 'pending_dispatch', label: '待派单', sub: '等待指派司机' },
    { key: 'pending_towing', label: '已派单', sub: '司机待接单' },
    { key: 'towing', label: '拖车中', sub: '司机执行拖车' },
    { key: 'completed', label: '已完成', sub: '拖车完成' }
  ]

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', v: boolean): void
    (e: 'refresh'): void
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  // ========== 数据 ==========
  const loading = ref(false)
  const detail = ref<Partial<TowDetail>>({})
  const activeTab = ref<TabKey>('basic')
  const submitting = ref(false)

  async function loadDetail() {
    if (!props.orderId) return
    loading.value = true
    try {
      const res = await fetchTowOrderDetail(props.orderId)
      detail.value = res as Partial<TowDetail>
    } finally {
      loading.value = false
    }
  }

  watch(
    () => props.visible,
    (v) => {
      if (v && props.orderId) loadDetail()
    },
    { immediate: true }
  )

  function handleClosed() {
    detail.value = {}
    activeTab.value = 'basic'
  }

  function firstValue<T = unknown>(...values: T[]): T | undefined {
    return values.find((value) => value !== undefined && value !== null && value !== '')
  }

  function textValue(...values: unknown[]): string {
    const value = firstValue(...values)
    return value === undefined ? '—' : String(value)
  }

  const orderInfo = computed(() => detail.value.order ?? {})
  const vehicleInfo = computed(() => detail.value.vehicle ?? detail.value.vehicles?.[0] ?? {})
  const driverInfo = computed(() => detail.value.driver ?? {})
  const creatorInfo = computed(() => detail.value.creator ?? {})
  const dispatcherInfo = computed(() => detail.value.dispatcher ?? {})
  const operationLogs = computed<TowOperationLog[]>(
    () => detail.value.operation_logs ?? detail.value.logs ?? detail.value.status_log ?? []
  )

  const towNo = computed(() => textValue(detail.value.tow_no, detail.value.tow_order_no))
  const relatedOrderNo = computed(() => textValue(detail.value.order_no, orderInfo.value.order_no))
  const plateNo = computed(() =>
    textValue(detail.value.order_plate_no, detail.value.plate_no, vehicleInfo.value.plate_no)
  )
  const vin = computed(() =>
    textValue(detail.value.order_vin, detail.value.vin, vehicleInfo.value.vin)
  )
  const customerName = computed(() =>
    textValue(
      detail.value.order_real_name,
      detail.value.real_name,
      detail.value.customer_name,
      orderInfo.value.real_name,
      orderInfo.value.customer_name
    )
  )
  const customerPhone = computed(() =>
    textValue(
      detail.value.order_phone,
      detail.value.phone,
      detail.value.customer_phone,
      detail.value.pickup_contact_phone,
      orderInfo.value.phone,
      orderInfo.value.customer_phone
    )
  )
  const pickupAddress = computed(() =>
    textValue(detail.value.pickup_address, orderInfo.value.pickup_address, detail.value.address)
  )
  const deliveryAddress = computed(() =>
    textValue(
      detail.value.delivery_address,
      detail.value.destination_address,
      detail.value.factory_address,
      orderInfo.value.delivery_address
    )
  )
  const creatorName = computed(() =>
    textValue(
      detail.value.creator_name,
      creatorInfo.value.real_name,
      creatorInfo.value.nickname,
      creatorInfo.value.name
    )
  )
  const driverName = computed(() =>
    textValue(
      detail.value.driver_name,
      detail.value.assigned_driver_name,
      driverInfo.value.real_name,
      driverInfo.value.nickname,
      driverInfo.value.name
    )
  )
  const driverPhone = computed(() =>
    textValue(detail.value.driver_phone, detail.value.assigned_driver_phone, driverInfo.value.phone)
  )
  const dispatchBy = computed(() =>
    textValue(
      detail.value.dispatch_by,
      detail.value.dispatcher_name,
      dispatcherInfo.value.real_name,
      dispatcherInfo.value.nickname,
      dispatcherInfo.value.name
    )
  )
  const remarkText = computed(() => textValue(detail.value.remark, orderInfo.value.remark))

  // ========== 状态标签 ==========
  const statusCfg = computed(() => {
    const s = statusCode.value
    return TOW_STATUS_MAP[s] ?? { label: '未知', color: '#8C8C8C', bg: '#F5F5F5' }
  })
  const statusCode = computed(() => Number(detail.value.status ?? detail.value.tow_status ?? 0))
  const statusLabel = computed(
    () =>
      detail.value.current_status_text ||
      detail.value.status_text ||
      detail.value.tow_status_text ||
      statusCfg.value.label
  )
  const statusBadgeStyle = computed(() => ({
    background: statusCfg.value.bg,
    color: statusCfg.value.color
  }))

  // ========== 基础信息 computed ==========
  const brandModel = computed(() => {
    if (detail.value.brand_model) return detail.value.brand_model
    const b = detail.value.brand || vehicleInfo.value.brand || ''
    const m = detail.value.model || vehicleInfo.value.model || ''
    return [b, m].filter(Boolean).join(' ') || '—'
  })

  // ========== 进度步骤条 ==========
  const currentStepIdx = computed(() => {
    const s = statusCode.value || 1
    return Math.max(0, Math.min(s - 1, TOW_STEPS.length - 1))
  })

  const stepFillWidth = computed(() => {
    const idx = currentStepIdx.value
    if (idx === 0) return '0%'
    const total = TOW_STEPS.length - 1
    return `${(idx / total) * 92}%`
  })

  // ========== 时间线工具函数 ==========
  function formatTime(val?: unknown, fallback = '—'): string {
    if (!val) return fallback
    if (typeof val === 'string' && !/^\d+$/.test(val)) return val || fallback
    const ts = Number(val)
    if (!ts) return fallback
    const d = new Date(ts > 1_000_000_000_000 ? ts : ts * 1000)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  function formatTimestamp(ts?: number): string {
    return ts ? formatTime(ts, '') : ''
  }

  const createTimeText = computed(() =>
    textValue(
      detail.value.add_time_text,
      detail.value.create_time_text,
      formatTime(firstValue(detail.value.add_time, detail.value.create_time), '')
    )
  )
  const dispatchTimeText = computed(() => formatTime(detail.value.dispatch_time))
  const acceptTimeText = computed(() => formatTime(detail.value.accept_time))
  const completionTimeText = computed(() =>
    textValue(
      detail.value.complete_time_text,
      detail.value.finish_time_text,
      formatTime(
        firstValue(
          detail.value.completion_time,
          detail.value.complete_time,
          detail.value.finish_time
        ),
        ''
      )
    )
  )

  function findOperationLog(action: string, contentKeyword = '') {
    return operationLogs.value.find((log) => {
      if (log.action === action) return true
      return contentKeyword ? String(log.content || '').includes(contentKeyword) : false
    })
  }

  // ========== 从 status_logs 提取各状态日志 ==========
  const statusLogsMap = computed<Record<number, OrderStatusLog[]>>(() => {
    const map: Record<number, OrderStatusLog[]> = {}
    for (const log of detail.value.status_logs ?? []) {
      const s = Number(log.to_status)
      if (!map[s]) map[s] = []
      map[s].push(log)
    }
    return map
  })

  // ========== 时间线节点 ==========
  interface TimelineNode {
    id: string
    stage: string
    role: string
    name: string
    phone: string
    time: string
    status: NodeStatus
    extra?: string
  }

  const timelineNodes = computed<TimelineNode[]>(() => {
    const d = detail.value
    const s = statusCode.value || 1
    const currentDriverName = driverName.value
    const currentDriverPhone = driverPhone.value

    const assignLog = findOperationLog('assign_driver', '指派司机')
    const claimLog = findOperationLog('claim', '司机接单')
    const towingStatusLog = operationLogs.value.find(
      (log) => log.action === 'status_change' && String(log.content || '').includes('拖车中')
    )
    const completedStatusLog = operationLogs.value.find(
      (log) => log.action === 'status_change' && String(log.content || '').includes('已完成')
    )
    const dispatchedLog = statusLogsMap.value[2]?.[0]
    const towingLog = statusLogsMap.value[3]?.[0]
    const completedLog = statusLogsMap.value[4]?.[0]

    const nodes: TimelineNode[] = []

    // 1. 拖车单创建
    nodes.push({
      id: 'created',
      stage: '拖车单创建',
      role: '拖车管理员',
      name: creatorName.value !== '—' ? creatorName.value : '系统生成',
      phone: '—',
      time: createTimeText.value,
      status: 'done'
    })

    // 2. 指派司机
    if (s >= 2) {
      const dispatchTime =
        formatTime(assignLog?.add_time, '') ||
        formatTime(d.dispatch_time, '') ||
        formatTimestamp(dispatchedLog?.change_time) ||
        '—'
      const currentDispatchBy =
        dispatchBy.value !== '—'
          ? dispatchBy.value
          : assignLog?.operator_name || dispatchedLog?.operator_name || '管理员'
      nodes.push({
        id: 'dispatched',
        stage: '指派司机',
        role: '拖车管理员',
        name: currentDispatchBy,
        phone: '—',
        time: dispatchTime,
        status: 'done',
        extra:
          currentDriverName !== '—'
            ? `指派司机：${currentDriverName}（${currentDriverPhone !== '—' ? currentDriverPhone : '—'}）`
            : undefined
      })
    } else {
      nodes.push({
        id: 'dispatched',
        stage: '指派司机',
        role: '拖车管理员',
        name: '—',
        phone: '—',
        time: '待操作',
        status: 'active'
      })
    }

    // 3. 司机接单
    if (s >= 3) {
      nodes.push({
        id: 'accepted',
        stage: '司机接单',
        role: '拖车司机',
        name: currentDriverName,
        phone: currentDriverPhone,
        time:
          formatTime(claimLog?.add_time, '') ||
          formatTime(d.accept_time, '') ||
          formatTimestamp(towingLog?.change_time) ||
          '—',
        status: 'done'
      })
    } else if (s === 2) {
      nodes.push({
        id: 'accepted',
        stage: '司机接单',
        role: '拖车司机',
        name: currentDriverName,
        phone: currentDriverPhone,
        time: '待接单',
        status: 'active'
      })
    } else {
      nodes.push({
        id: 'accepted',
        stage: '司机接单',
        role: '拖车司机',
        name: '—',
        phone: '—',
        time: '待完成',
        status: 'pending'
      })
    }

    // 4. 出发执行拖车
    if (s >= 4) {
      nodes.push({
        id: 'towing',
        stage: '出发执行拖车',
        role: '拖车司机',
        name: currentDriverName,
        phone: currentDriverPhone,
        time:
          formatTime(towingStatusLog?.add_time, '') ||
          formatTime(d.depart_time, '') ||
          formatTimestamp(towingLog?.change_time) ||
          '—',
        status: 'done'
      })
    } else if (s === 3) {
      nodes.push({
        id: 'towing',
        stage: '出发执行拖车',
        role: '拖车司机',
        name: currentDriverName,
        phone: currentDriverPhone,
        time:
          formatTime(towingStatusLog?.add_time, '') ||
          formatTime(d.depart_time, '') ||
          formatTime(d.accept_time),
        status: 'active'
      })
    } else {
      nodes.push({
        id: 'towing',
        stage: '出发执行拖车',
        role: '拖车司机',
        name: '—',
        phone: '—',
        time: '待完成',
        status: 'pending'
      })
    }

    // 5. 拖车完成 · 到达确认
    if (s === 4) {
      nodes.push({
        id: 'completed',
        stage: '拖车完成 · 到达确认',
        role: '拖车司机',
        name: currentDriverName,
        phone: currentDriverPhone,
        time:
          formatTime(firstValue(d.completion_time, d.complete_time, d.finish_time), '') ||
          formatTime(completedStatusLog?.add_time, '') ||
          formatTimestamp(completedLog?.change_time) ||
          '—',
        status: 'done',
        extra: '司机在回收小程序提交到达照片并完成电子签名'
      })
    } else {
      nodes.push({
        id: 'completed',
        stage: '拖车完成 · 到达确认',
        role: '拖车司机',
        name: '—',
        phone: '—',
        time: '待完成',
        status: 'pending'
      })
    }

    return nodes
  })

  // ========== 照片 & 签名 ==========
  const completionPhotos = computed<string[]>(() => {
    const raw = firstValue(
      detail.value.completion_photos,
      detail.value.images,
      detail.value.arrival_photos,
      detail.value.finish_photos,
      detail.value.photos
    )
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    try {
      const parsed = JSON.parse(raw as string)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return (raw as string).split(',').filter(Boolean)
    }
  })
  const driverSignature = computed(() =>
    textValue(detail.value.driver_signature, detail.value.sign_url, detail.value.signature_url)
  )

  const previewVisible = ref(false)
  const previewList = ref<string[]>([])
  const previewIndex = ref(0)

  function handlePreviewPhoto(url: string) {
    previewList.value = completionPhotos.value
    previewIndex.value = completionPhotos.value.indexOf(url)
    previewVisible.value = true
  }

  // ========== 联系 ==========
  function handleCallCustomer() {
    if (customerPhone.value === '—') return
    ElMessageBox.alert(`客户电话：${customerPhone.value}`, '联系客户', {
      confirmButtonText: '知道了'
    })
  }

  function handleCallDriver() {
    if (driverPhone.value === '—') return
    ElMessageBox.alert(`司机电话：${driverPhone.value}`, '联系司机', {
      confirmButtonText: '知道了'
    })
  }

  // ========== 指派司机 ==========
  const dispatchDialogVisible = ref(false)

  async function handleDispatchSuccess() {
    await loadDetail()
    emit('refresh')
  }

  // ========== 重新指派 ==========
  async function handleReassign() {
    dispatchDialogVisible.value = true
  }

  // ========== 确认完成 ==========
  async function handleComplete() {
    if (!props.orderId) return
    await ElMessageBox.confirm(
      `确认拖车任务 ${towNo.value !== '—' ? towNo.value : props.orderId} 已完成？`,
      '确认完成',
      { type: 'warning', confirmButtonText: '确认完成', cancelButtonText: '取消' }
    )
    submitting.value = true
    try {
      await fetchUpdateTowStatus(props.orderId, 4)
      await loadDetail()
      emit('refresh')
    } finally {
      submitting.value = false
    }
  }
</script>

<!-- el-dialog 深层覆盖（不含 scoped） -->
<style lang="scss">
  .td-detail-dialog {
    padding: 0 !important;

    .el-dialog__header {
      padding: 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .el-dialog__body {
      padding: 0;
      background: #fafafa;
    }

    .el-dialog__footer {
      padding: 0;
      border-top: 1px solid #f0f0f0;
    }

    .el-button {
      font-size: 14px;
    }
  }
</style>

<style scoped lang="scss">
  /* ===== Header ===== */
  .td-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
  }

  .td-header-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .td-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f1f1f;
  }

  .td-type-tag {
    padding: 4px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #0e7490;
    background: #e6fffb;
    border: 1px solid #b5f5ec;
    border-radius: 20px;
  }

  .td-status-badge {
    padding: 4px 12px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 20px;
  }

  .td-order-no {
    font-size: 13px;
    font-weight: 500;
    // font-family: ui-monospace, 'Courier New', monospace;
    color: #595959;
  }

  .td-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 16px;
    color: #8c8c8c;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      color: #262626;
      background: #f5f5f5;
    }
  }

  /* ===== Tab 栏 ===== */
  .td-tab-bar {
    display: flex;
    padding: 0 20px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
  }

  .td-tab-btn {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 14px 18px;
    font-size: 14px;
    font-weight: 500;
    color: #434343;
    cursor: pointer;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;

    &:hover {
      color: #1677ff;
    }

    &.active {
      color: #1677ff;
      border-bottom-color: #1677ff;
    }
  }

  .td-tab-icon {
    font-size: 17px;
  }

  /* ===== 内容区（滚动容器） ===== */
  .td-body {
    min-height: 320px;
    max-height: calc(90vh - 200px);
    padding: 16px 20px;
    overflow-y: auto;
  }

  /* ===== 信息卡片公共 ===== */
  .td-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .td-card {
    padding: 16px 20px;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
  }

  .td-card-title {
    margin-bottom: 14px;
    font-size: 14px;
    font-weight: 600;
    color: #434343;
    letter-spacing: 0.02em;
  }

  .td-item {
    margin-bottom: 12px;
  }

  .td-label {
    margin-bottom: 4px;
    font-size: 13px;
    color: #595959;
  }

  .td-value {
    font-size: 15px;
    color: #1f1f1f;

    &--bold {
      font-weight: 600;
    }

    &--mono {
      font-size: 14px;
    }

    &--plate {
      display: inline-block;
      padding: 2px 8px;
      color: #1d4ed8;
      letter-spacing: 0.05em;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
    }

    &--primary {
      color: #1677ff;
    }

    &--link {
      color: #1677ff;
      cursor: default;
    }
  }

  /* ===== 拨打按钮 ===== */
  .td-phone-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .td-call-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 14px;
    color: #52c41a;
    cursor: pointer;
    background: #f6ffed;
    border: none;
    border-radius: 4px;
    transition: background 0.2s;

    &:hover {
      background: #d9f7be;
    }
  }

  /* ===== 拖车路线 ===== */
  .td-route {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .td-route-point {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .td-route-spine {
    width: 2px;
    height: 16px;
    margin: 4px 0 4px 11px;
    background: #e0e0e0;
  }

  .td-route-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 14px;
    border-radius: 50%;

    &--start {
      color: #52c41a;
      background: #f6ffed;
    }

    &--end {
      color: #1677ff;
      background: #e6f4ff;
    }
  }

  /* ===== 全链路进度 ===== */
  .td-progress {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* 步骤条 */
  .td-steps-card {
    padding: 20px 24px;
    background: #f5f5f5;
    border-radius: 8px;
  }

  .td-steps-track {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  .td-steps-bg-line {
    position: absolute;
    top: 16px;
    right: 4%;
    left: 4%;
    height: 2px;
    background: #e0e0e0;
  }

  .td-steps-fill-line {
    position: absolute;
    top: 16px;
    left: 4%;
    height: 2px;
    background: #1677ff;
    transition: width 0.4s ease;
  }

  .td-step-col {
    position: relative;
    z-index: 1;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 6px;
    align-items: center;
  }

  .td-step-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    transition: all 0.2s;

    &--done {
      color: #fff;
      background: #52c41a;
    }

    &--active {
      color: #fff;
      background: #1677ff;
      box-shadow: 0 0 0 4px #e0eeff;
    }

    &--pending {
      color: #bfbfbf;
      background: #fff;
      border: 2px solid #e0e0e0;
    }
  }

  .td-step-check {
    font-size: 16px;
  }

  .td-step-num {
    font-size: 13px;
    font-weight: 700;
  }

  .td-step-label {
    font-size: 13px;
    color: #737373;
    text-align: center;

    &--done {
      font-weight: 500;
      color: #52c41a;
    }

    &--active {
      font-weight: 600;
      color: #1677ff;
    }
  }

  .td-step-sub {
    font-size: 12px;
    color: #737373;
    text-align: center;
  }

  /* 时间线 */
  .td-timeline-card {
    overflow: hidden;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
  }

  .td-timeline-header {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid #f0f0f0;
  }

  .td-timeline-hicon {
    font-size: 15px;
    color: #1677ff;
  }

  .td-timeline-htitle {
    font-size: 15px;
    font-weight: 600;
    color: #1f1f1f;
  }

  .td-timeline-hsub {
    font-size: 13px;
    color: #737373;
  }

  .td-timeline-body {
    padding: 16px 20px 8px;
  }

  .td-tl-row {
    display: flex;
    gap: 16px;
  }

  .td-tl-axis {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    align-items: center;
    width: 14px;
    padding-top: 2px;
  }

  .td-tl-dot {
    flex-shrink: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;

    &--done {
      background: #1677ff;
      border: 2px solid #1677ff;
    }

    &--active {
      background: #faad14;
      border: 2px solid #faad14;
    }

    &--pending {
      background: #fff;
      border: 2px solid #d9d9d9;
    }
  }

  .td-tl-line {
    flex: 1;
    width: 2px;
    min-height: 44px;
    margin: 4px 0;
    background: #f0f0f0;

    &--done {
      background: rgb(22 119 255 / 20%);
    }
  }

  .td-tl-content {
    flex: 1;
    padding-bottom: 20px;

    &--pending {
      opacity: 0.72;
    }
  }

  .td-tl-title-row {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 4px;
  }

  .td-tl-stage {
    font-size: 14px;
    font-weight: 500;
    color: #737373;

    &--done {
      color: #1f1f1f;
    }

    &--active {
      color: #faad14;
    }
  }

  .td-tl-role {
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;
    color: #1677ff;
    background: #e6f4ff;
    border: 1px solid #91caff;
    border-radius: 4px;

    &--driver {
      color: #0e7490;
      background: #e6fffb;
      border-color: #87e8de;
    }
  }

  .td-tl-ing {
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 600;
    color: #faad14;
    background: #fffbe6;
    border: 1px solid #ffe58f;
    border-radius: 4px;
  }

  .td-tl-person {
    display: flex;
    gap: 4px;
    align-items: center;
    margin-bottom: 4px;
    font-size: 13px;
    color: #434343;
  }

  .td-tl-person-icon {
    font-size: 13px;
    color: #737373;
  }

  .td-tl-extra {
    padding: 6px 10px;
    margin-bottom: 4px;
    font-size: 13px;
    color: #434343;
    background: #f8f9fb;
    border: 1px solid #f0f0f0;
    border-radius: 6px;
  }

  .td-tl-time {
    display: flex;
    gap: 4px;
    align-items: center;
    font-size: 13px;
    color: #737373;
  }

  .td-tl-time-icon {
    font-size: 12px;
  }

  /* ===== 照片 & 签名 ===== */
  .td-media {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .td-media-header {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 12px;
  }

  .td-media-hicon {
    font-size: 15px;
    color: #1677ff;
  }

  .td-media-htitle {
    font-size: 15px;
    font-weight: 600;
    color: #1f1f1f;
  }

  .td-media-tip {
    margin-top: 8px;
    font-size: 13px;
    color: #737373;
  }

  .td-photos-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .td-photo-item {
    aspect-ratio: 1;
    overflow: hidden;
    cursor: pointer;
    background: #f5f5f5;
    border-radius: 8px;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.85;
    }

    &--empty {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
      justify-content: center;
      cursor: default;
      background: #fafafa;
      border: 2px dashed #e0e0e0;

      &:hover {
        opacity: 1;
      }
    }
  }

  .td-photo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .td-photo-empty-icon {
    font-size: 28px;
    color: #d9d9d9;
  }

  .td-photo-empty-text {
    font-size: 13px;
    color: #8c8c8c;
  }

  .td-signature-box {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 160px;
    background: #fafafa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
  }

  .td-signature-img {
    max-width: 100%;
    max-height: 130px;
    padding: 16px;
    object-fit: contain;
  }

  .td-signature-empty {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    padding: 32px;
    text-align: center;
  }

  .td-signature-empty-icon {
    font-size: 36px;
    color: #e0e0e0;
  }

  .td-signature-empty-text {
    font-size: 14px;
    color: #737373;
  }

  /* ===== 底栏 ===== */
  .td-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
  }

  .td-footer-left {
    flex: 1;
  }

  .td-footer-no {
    display: flex;
    gap: 4px;
    align-items: center;
    font-size: 13px;
    color: #595959;
  }

  .td-footer-no-icon {
    font-size: 13px;
  }

  .td-footer-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }
</style>
