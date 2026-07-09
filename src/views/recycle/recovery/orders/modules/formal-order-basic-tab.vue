<template>
  <div class="fob-root">
    <!-- 订单概要 -->
    <div class="fob-card">
      <div class="fob-card-title">订单概要</div>
      <ElRow :gutter="24">
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">订单编号</div>
            <div class="fob-value fob-value--mono fob-value--primary">{{
              detail.order_no || '—'
            }}</div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">订单来源</div>
            <span class="fob-tag" :style="sourceStyle">{{ sourceLabel }}</span>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">订单状态</div>
            <span class="fob-tag" :style="orderStatusStyle">{{ orderStatusLabel }}</span>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">创建时间</div>
            <div class="fob-value">{{ addTimeText }}</div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">创建人</div>
            <div class="fob-value">{{ detail.creator_name || detail.real_name || '—' }}</div>
          </div>
        </ElCol>
        <ElCol v-if="reviewLog" :span="8">
          <div class="fob-item">
            <div class="fob-label">审核人</div>
            <div class="fob-value">{{ reviewLog.operator_name || '—' }}</div>
          </div>
        </ElCol>
        <ElCol v-if="reviewLog?.change_time" :span="8">
          <div class="fob-item">
            <div class="fob-label">审核时间</div>
            <div class="fob-value">{{ formatTime(reviewLog.change_time) }}</div>
          </div>
        </ElCol>
      </ElRow>
    </div>

    <!-- 关联车辆档案 -->
    <div class="fob-card">
      <div class="fob-card-header">
        <div class="fob-card-title">
          关联车辆档案
          <span v-if="isBatch" class="fob-card-subtitle"
            >· 共 {{ detail.vehicles?.length }} 台</span
          >
        </div>
      </div>
      <ElRow :gutter="24">
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">车牌号</div>
            <div class="fob-value fob-value--bold fob-value--plate">{{
              currentVehicle?.plate_no || '—'
            }}</div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">车架号（VIN）</div>
            <div class="fob-value fob-value--mono">{{ currentVehicle?.vin || '—' }}</div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">品牌车型</div>
            <div class="fob-value">{{ brandModel }}</div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">车辆年份</div>
            <div class="fob-value">{{ currentVehicle?.vehicle_year || '—' }}</div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">回收类型</div>
            <div class="fob-value">{{ isBatch ? '批量回收' : '单台回收' }}</div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">送厂方式</div>
            <div class="fob-value">
              <span
                v-if="detail.delivery_type === 'tow'"
                class="fob-delivery-tag fob-delivery-tag--tow"
              >
                <ArtSvgIcon icon="ri:truck-line" />预约拖车
              </span>
              <span v-else-if="detail.delivery_type === 'self'" class="fob-delivery-tag">
                自行送厂
              </span>
              <span v-else>—</span>
            </div>
          </div>
        </ElCol>

        <!-- 自行送厂 -->
        <template v-if="detail.delivery_type === 'self' || !detail.delivery_type">
          <ElCol :span="8">
            <div class="fob-item">
              <div class="fob-label">送车人姓名</div>
              <div class="fob-value">{{ detail.real_name || '—' }}</div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="fob-item">
              <div class="fob-label">送车人电话</div>
              <div class="fob-value">{{ detail.phone || '—' }}</div>
            </div>
          </ElCol>
        </template>

        <!-- 预约拖车 -->
        <template v-if="detail.delivery_type === 'tow'">
          <ElCol :span="8">
            <div class="fob-item">
              <div class="fob-label">取车联系人</div>
              <div class="fob-value">{{ detail.pickup_contact_name || '—' }}</div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="fob-item">
              <div class="fob-label">取车联系电话</div>
              <div class="fob-value">{{ detail.pickup_contact_phone || '—' }}</div>
            </div>
          </ElCol>
          <ElCol :span="24">
            <div class="fob-item">
              <div class="fob-label">取车地址</div>
              <div class="fob-value">{{ detail.pickup_address || '—' }}</div>
            </div>
          </ElCol>
        </template>

        <ElCol v-if="isBatch && detail.batch_vehicle_count" :span="8">
          <div class="fob-item">
            <div class="fob-label">批次车辆数</div>
            <div class="fob-value">{{ detail.batch_vehicle_count }} 辆</div>
          </div>
        </ElCol>

        <ElCol v-if="currentVehicle?.fuel_type" :span="8">
          <div class="fob-item">
            <div class="fob-label">燃料类型</div>
            <div class="fob-value">{{ currentVehicle.fuel_type }}</div>
          </div>
        </ElCol>
        <ElCol v-if="currentVehicle?.emission_standard" :span="8">
          <div class="fob-item">
            <div class="fob-label">排放标准</div>
            <div class="fob-value">{{ currentVehicle.emission_standard }}</div>
          </div>
        </ElCol>
      </ElRow>
    </div>

    <!-- 客户信息 -->
    <div class="fob-card">
      <div class="fob-card-title">客户信息</div>
      <ElRow :gutter="24">
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">客户姓名</div>
            <div class="fob-value fob-value--bold">{{ detail.real_name || '—' }}</div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">联系电话</div>
            <div class="fob-value fob-value--bold">{{ detail.phone || '—' }}</div>
          </div>
        </ElCol>
        <ElCol v-if="detail.address" :span="24">
          <div class="fob-item">
            <div class="fob-label">客户地址</div>
            <div class="fob-value">{{ detail.address }}</div>
          </div>
        </ElCol>
      </ElRow>
    </div>

    <!-- 结算信息 -->
    <div class="fob-card">
      <div class="fob-card-title">结算信息</div>
      <ElRow :gutter="24">
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">结算类型</div>
            <div class="fob-value">{{ ownerTypeLabel }}</div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">结算方式</div>
            <div class="fob-value">{{ detail.settlement_method || '—' }}</div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">回收单价</div>
            <div class="fob-value">{{ formatAmount(detail.unit_price) }}</div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">缺件免扣款</div>
            <span
              class="fob-bool-tag"
              :style="
                detail.deduct_missing
                  ? { color: '#52C41A', background: '#F6FFED' }
                  : { color: '#FF4D4F', background: '#FFF1F0' }
              "
            >
              {{ detail.deduct_missing ? '是' : '否' }}
            </span>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">自送费补贴</div>
            <div class="fob-value">
              {{ detail.self_delivery_subsidy ? `+¥ ${detail.self_delivery_subsidy}` : '—' }}
            </div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">结算金额</div>
            <div class="fob-value fob-value--bold fob-value--amount">
              {{ formatAmount(detail.settlement_amount) }}
            </div>
          </div>
        </ElCol>
      </ElRow>
    </div>

    <!-- 代理人信息 -->
    <div class="fob-card">
      <div class="fob-card-title">代理人信息</div>
      <ElRow :gutter="24">
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">是否有代理人</div>
            <span
              class="fob-bool-tag"
              :style="
                detail.has_agent
                  ? { color: '#1677ff', background: '#E6F7FF' }
                  : { color: '#8C8C8C', background: '#F5F5F5' }
              "
            >
              {{ detail.has_agent ? '有代理人' : '无代理人' }}
            </span>
          </div>
        </ElCol>
        <template v-if="detail.has_agent">
          <ElCol :span="8">
            <div class="fob-item">
              <div class="fob-label">代理人姓名</div>
              <div class="fob-value">{{ detail.agent_name || '—' }}</div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="fob-item">
              <div class="fob-label">代理人电话</div>
              <div class="fob-value">{{ detail.agent_phone || '—' }}</div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="fob-item">
              <div class="fob-label">代理服务费</div>
              <div class="fob-value">{{ formatAmount(detail.agent_fee) }}</div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="fob-item">
              <div class="fob-label">服务费发票号</div>
              <div class="fob-value fob-value--mono">{{ detail.agent_invoice_no || '—' }}</div>
            </div>
          </ElCol>
        </template>
      </ElRow>
    </div>

    <!-- 收款银行卡信息 -->
    <div class="fob-card">
      <div class="fob-card-title">收款银行卡信息</div>
      <ElRow :gutter="24">
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">户名</div>
            <div class="fob-value fob-value--bold">{{ detail.bank_account_name || '—' }}</div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">开户行</div>
            <div class="fob-value">{{ detail.bank_name || '—' }}</div>
          </div>
        </ElCol>
        <ElCol :span="8">
          <div class="fob-item">
            <div class="fob-label">银行卡号</div>
            <div class="fob-value fob-value--mono">{{ maskedCardNo }}</div>
          </div>
        </ElCol>
      </ElRow>
    </div>

    <!-- 备注 -->
    <div v-if="detail.remark" class="fob-card">
      <div class="fob-card-title">备注</div>
      <div class="fob-remark">{{ detail.remark }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { OrderDetail, OrderStatusLog } from '@/types/recycle/order'

  const props = defineProps<{
    detail: Partial<OrderDetail>
    selectedVehicleIdx: number
  }>()

  const isBatch = computed(() => Number(props.detail.is_batch) === 1)

  const currentVehicle = computed(
    () => props.detail.vehicles?.[props.selectedVehicleIdx] ?? props.detail.vehicle
  )

  const brandModel = computed(() => {
    const v = currentVehicle.value
    if (!v) return '—'
    return [v.brand, v.model].filter(Boolean).join(' ') || '—'
  })

  // 审核日志（to_status=2 的第一条，即审核通过）
  const reviewLog = computed<OrderStatusLog | undefined>(() =>
    props.detail.status_logs?.find((l) => l.to_status === 2)
  )

  function formatTime(ts?: number) {
    if (!ts) return '—'
    return new Date(Number(ts) * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const addTimeText = computed(() => formatTime(props.detail.add_time))

  function formatAmount(val?: number | string) {
    if (val === undefined || val === null || val === '') return '—'
    return `¥ ${val}`
  }

  const maskedCardNo = computed(() => {
    const raw = props.detail.bank_card_number || ''
    if (raw.length >= 8) {
      return `${raw.slice(0, 4)} **** **** ${raw.slice(-4)}`
    }
    return raw || '—'
  })

  // ===== 标签样式 =====
  const sourceLabel = computed(() => {
    const src = props.detail.source || ''
    return ['miniapp', 'mini_program'].includes(src) ? '客户申请' : '员工创建'
  })

  const sourceStyle = computed(() => {
    const src = props.detail.source || ''
    return ['miniapp', 'mini_program'].includes(src)
      ? { background: '#F9F0FF', color: '#722ED1' }
      : { background: '#E6F7FF', color: '#1677ff' }
  })

  const ORDER_STATUS: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: '待审核', color: '#1890FF', bg: '#E6F7FF' },
    2: { label: '审核通过', color: '#52C41A', bg: '#F6FFED' },
    [-1]: { label: '审核驳回', color: '#FF4D4F', bg: '#FFF1F0' },
    3: { label: '已完成', color: '#87D068', bg: '#F6FFED' }
  }

  const orderStatusLabel = computed(() => {
    const s = props.detail.status
    return s !== undefined ? (ORDER_STATUS[s]?.label ?? '未知') : '—'
  })

  const orderStatusStyle = computed(() => {
    const s = props.detail.status
    const cfg = s !== undefined ? ORDER_STATUS[s] : undefined
    return cfg
      ? { background: cfg.bg, color: cfg.color }
      : { background: '#F5F5F5', color: '#8C8C8C' }
  })

  const ownerTypeLabel = computed(() => {
    const t = props.detail.owner_type
    if (t === 'personal') return '个人结算'
    if (t === 'company') return '非个人结算'
    return '—'
  })
</script>

<style scoped lang="scss">
  .fob-root {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ===== 卡片 ===== */
  .fob-card {
    padding: 14px 16px 6px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .fob-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    margin-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  .fob-card-title {
    padding-bottom: 10px;
    margin-bottom: 12px;
    font-size: 11px;
    font-weight: 700;
    color: #8c8c8c;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 1px solid #f0f0f0;
  }

  .fob-card-header .fob-card-title {
    padding-bottom: 0;
    margin-bottom: 0;
    border-bottom: none;
  }

  .fob-card-subtitle {
    font-size: 12px;
    font-weight: 500;
    color: #1677ff;
    text-transform: none;
    letter-spacing: 0;
  }

  /* ===== 字段 ===== */
  .fob-item {
    padding-bottom: 14px;
  }

  .fob-label {
    margin-bottom: 4px;
    font-size: 12px;
    color: #8c8c8c;
  }

  .fob-value {
    font-size: 14px;
    line-height: 1.5;
    color: #262626;

    &--bold {
      font-weight: 600;
    }

    &--mono {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: #434343;
    }

    &--primary {
      color: #1677ff;
    }

    &--plate {
      font-size: 15px;
      font-weight: 700;
      color: #1677ff;
      letter-spacing: 0.05em;
    }

    &--amount {
      font-size: 16px;
      color: #1677ff;
    }
  }

  /* ===== 标签 ===== */
  .fob-tag {
    display: inline-block;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 20px;
  }

  .fob-bool-tag {
    display: inline-block;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 4px;
  }

  /* ===== 送厂方式标签 ===== */
  .fob-delivery-tag {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 2px 8px;
    font-size: 12px;
    color: #595959;
    background: #f5f5f5;
    border-radius: 4px;

    &--tow {
      color: #13c2c2;
      background: #e6fffb;
    }
  }

  /* ===== 备注 ===== */
  .fob-remark {
    padding: 10px 12px;
    margin-bottom: 6px;
    font-size: 13px;
    line-height: 1.7;
    color: #595959;
    background: #f8f9fb;
    border-radius: 6px;
  }
</style>
