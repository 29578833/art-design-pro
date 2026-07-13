<template>
  <ElDialog
    v-model="dialogVisible"
    width="760px"
    align-center
    destroy-on-close
    append-to-body
    class="stl-detail-dialog"
    @open="handleOpen"
    @closed="handleClosed"
  >
    <template #header>
      <div class="stl-dh">
        <div class="stl-dh-left">
          <div class="stl-dh-icon">
            <ArtSvgIcon icon="ri:money-cny-circle-line" />
          </div>
          <div>
            <div class="stl-dh-title-row">
              <h3 class="stl-dh-title">结算详情</h3>
              <span v-if="statusCfg" class="stl-dh-badge" :style="statusBadgeStyle">
                {{ record?.settlement_status_text || statusCfg.label }}
              </span>
            </div>
            <p class="stl-dh-sub">
              {{ record?.settlement_no || '—' }} · {{ record?.plate_no || '—' }} ·
              {{ record?.owner_name || '—' }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <div v-loading="enriching" class="stl-detail-wrap">
      <!-- 流程步骤 -->
      <div class="stl-steps-bar">
        <div class="stl-steps-row">
          <div v-for="(label, i) in SETTLEMENT_STEPS" :key="label" class="stl-step-item">
            <div class="stl-step-node">
              <div class="stl-step-circle" :style="getStepCircleStyle(i)">
                <ArtSvgIcon
                  v-if="isRejected && i === 1"
                  icon="ri:close-line"
                  class="stl-step-ico"
                />
                <ArtSvgIcon
                  v-else-if="!isRejected && i < stepIdx"
                  icon="ri:check-line"
                  class="stl-step-ico"
                />
                <span v-else>{{ i + 1 }}</span>
              </div>
              <span class="stl-step-text" :style="{ color: getStepTextColor(i) }">
                {{ label }}
              </span>
            </div>
            <div
              v-if="i < SETTLEMENT_STEPS.length - 1"
              class="stl-step-line"
              :style="{ background: !isRejected && i < stepIdx ? '#1890FF' : '#E8E8E8' }"
            />
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="stl-tabs">
        <div
          v-for="t in tabs"
          :key="t.id"
          class="stl-tab"
          :class="{ 'is-active': activeTab === t.id }"
          @click="activeTab = t.id"
        >
          {{ t.label }}
        </div>
      </div>

      <!-- Body -->
      <div class="stl-detail-body">
        <!-- 结算明细 -->
        <div v-if="activeTab === 'detail'" class="stl-detail-grid">
          <div class="stl-detail-col">
            <div class="stl-section">
              <div class="stl-section-title">车辆信息</div>
              <div class="stl-info-card">
                <div v-for="row in vehicleRows" :key="row.label" class="stl-info-row">
                  <span class="stl-info-label">{{ row.label }}</span>
                  <span class="stl-info-value">{{ row.value }}</span>
                </div>
              </div>
            </div>
            <div class="stl-section">
              <div class="stl-section-title">车主信息</div>
              <div class="stl-info-card">
                <div v-for="row in ownerRows" :key="row.label" class="stl-info-row">
                  <span class="stl-info-label">{{ row.label }}</span>
                  <span class="stl-info-value">{{ row.value }}</span>
                </div>
              </div>
            </div>
            <div class="stl-section">
              <div class="stl-section-title">收款信息</div>
              <div class="stl-info-card">
                <div v-for="row in bankRows" :key="row.label" class="stl-info-row">
                  <span class="stl-info-label">{{ row.label }}</span>
                  <span class="stl-info-value">{{ row.value }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="stl-detail-col">
            <div class="stl-section">
              <div class="stl-section-title">费用明细</div>
              <div class="stl-info-card stl-fee-card">
                <FeeBreakdown :record="record" />
              </div>
            </div>
            <div class="stl-section">
              <div class="stl-section-title">时间轴</div>
              <div class="stl-info-card stl-timeline-card">
                <div class="stl-timeline-row">
                  <span class="stl-tl-label">结算申请</span>
                  <span class="stl-tl-value">{{ formatTime(record?.add_time) }}</span>
                </div>
                <div v-if="record?.audit_time" class="stl-timeline-row">
                  <span class="stl-tl-label">财务审核</span>
                  <span class="stl-tl-value">{{ record.audit_time }}</span>
                </div>
                <div v-if="record?.approve_time" class="stl-timeline-row">
                  <span class="stl-tl-label">管理员审批</span>
                  <span class="stl-tl-value">{{ record.approve_time }}</span>
                </div>
                <div v-if="record?.pay_time" class="stl-timeline-row">
                  <span class="stl-tl-label">付款完成</span>
                  <span class="stl-tl-value is-paid">{{ record.pay_time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 审核 / 审批 -->
        <div v-else-if="activeTab === 'audit'" class="stl-audit-pane">
          <!-- 财务审核记录 -->
          <div
            v-if="hasFinanceAuditRecord"
            class="stl-audit-record"
            :class="financeAuditRejected ? 'is-reject' : 'is-pass'"
          >
            <div class="stl-audit-record-head">
              <ArtSvgIcon
                :icon="financeAuditRejected ? 'ri:close-circle-fill' : 'ri:checkbox-circle-fill'"
                class="stl-audit-record-ico"
              />
              <span class="stl-audit-record-title">
                财务审核{{ financeAuditRejected ? '驳回' : '通过' }}
              </span>
              <span class="stl-audit-record-time">{{ record?.audit_time || '' }}</span>
            </div>
            <div v-if="record?.audit_user_name" class="stl-audit-record-meta">
              审核人：{{ record.audit_user_name }}
            </div>
            <div v-if="financeAuditRemark" class="stl-audit-record-meta">
              审核意见：{{ financeAuditRemark }}
            </div>
          </div>

          <!-- 管理员审批记录 -->
          <div
            v-if="hasApproveRecord"
            class="stl-audit-record"
            :class="approveRejected ? 'is-reject' : 'is-approve'"
          >
            <div class="stl-audit-record-head">
              <ArtSvgIcon
                :icon="approveRejected ? 'ri:close-circle-fill' : 'ri:checkbox-circle-fill'"
                class="stl-audit-record-ico"
              />
              <span class="stl-audit-record-title">
                管理员审批{{ approveRejected ? '驳回' : '通过' }}
              </span>
              <span class="stl-audit-record-time">
                {{ approveRejected ? '' : record?.approve_time || '' }}
              </span>
            </div>
            <div v-if="record?.approve_user_name" class="stl-audit-record-meta">
              审批人：{{ record.approve_user_name }}
            </div>
            <div v-if="approveRemark" class="stl-audit-record-meta">
              审批意见：{{ approveRemark }}
            </div>
          </div>

          <template v-if="record?.settlement_status === 1">
            <div class="stl-check-card">
              <div class="stl-check-title">财务审核核对要点</div>
              <div v-for="item in auditChecklist" :key="item.label" class="stl-check-row">
                <span>{{ item.label }}</span>
                <span class="stl-check-val">{{ item.value }}</span>
              </div>
            </div>
            <div class="stl-audit-form">
              <label class="stl-audit-label"> 审核意见<span class="req">*</span> </label>
              <ElInput
                v-model="auditNote"
                type="textarea"
                :rows="3"
                placeholder="填写审核意见（通过原因或驳回理由）"
                maxlength="500"
              />
            </div>
            <div class="stl-audit-actions">
              <ElButton
                class="stl-btn-reject"
                :disabled="!auditNote.trim()"
                :loading="acting"
                @click="handleAuditReject"
              >
                <ArtSvgIcon icon="ri:close-circle-line" class="mr-1" />
                驳回
              </ElButton>
              <ElButton
                class="stl-btn-pass"
                :disabled="!auditNote.trim()"
                :loading="acting"
                @click="handleAuditPass"
              >
                <ArtSvgIcon icon="ri:checkbox-circle-line" class="mr-1" />
                审核通过
              </ElButton>
            </div>
          </template>

          <template v-else-if="record?.settlement_status === 2">
            <div class="stl-approve-alert">
              <div class="stl-approve-alert-head">
                <ArtSvgIcon icon="ri:error-warning-line" />
                <span>大额结算，需管理员审批</span>
              </div>
              <div class="stl-approve-alert-desc">
                结算金额 {{ formatMoney(record.final_price) }} 需管理员审批后方可付款
              </div>
            </div>
            <div class="stl-check-card">
              <div class="stl-check-title">财务已审核信息</div>
              <div class="stl-check-row">
                <span>审核人</span>
                <span class="stl-check-val">{{ record.audit_user_name || '—' }}</span>
              </div>
              <div class="stl-check-row">
                <span>审核时间</span>
                <span class="stl-check-val">{{ record.audit_time || '—' }}</span>
              </div>
              <div class="stl-check-row">
                <span>审核意见</span>
                <span class="stl-check-val">{{ record.audit_remark || '—' }}</span>
              </div>
            </div>
            <div class="stl-audit-actions">
              <ElButton class="stl-btn-reject" :loading="acting" @click="handleApproveReject">
                驳回
              </ElButton>
              <ElButton class="stl-btn-approve" :loading="acting" @click="handleApprovePass">
                <ArtSvgIcon icon="ri:check-line" class="mr-1" />
                审批通过
              </ElButton>
            </div>
          </template>

          <div v-else-if="!hasFinanceAuditRecord && !hasApproveRecord" class="stl-empty-tip">
            暂无审核记录
          </div>
        </div>

        <!-- 付款操作 -->
        <div v-else class="stl-pay-pane">
          <div v-if="record?.settlement_status === 4" class="stl-paid-card">
            <ArtSvgIcon icon="ri:checkbox-circle-fill" class="stl-paid-ico" />
            <div class="stl-paid-title">付款已完成</div>
            <div class="stl-paid-sub"> {{ methodText }} · {{ record.pay_time || '—' }} </div>
            <div class="stl-paid-amount">{{ formatMoney(record.final_price) }}</div>
            <div v-if="record.settlement_proof" class="stl-paid-proof">
              <ArtSvgIcon icon="ri:file-text-line" />
              付款凭证已上传
              <ElImage
                :src="String(record.settlement_proof)"
                fit="cover"
                class="stl-paid-proof-img"
                :preview-src-list="[String(record.settlement_proof)]"
              />
            </div>
          </div>

          <template v-else-if="record?.settlement_status === 3">
            <div class="stl-fee-wrap">
              <FeeBreakdown :record="record" />
            </div>
            <div class="stl-pay-tip">
              <ArtSvgIcon icon="ri:error-warning-line" />
              付款前请再次核对车主账户信息，确保转账信息准确无误
            </div>
            <ElButton class="stl-btn-pay-now" @click="emitPay">
              <ArtSvgIcon icon="ri:money-cny-circle-line" class="mr-1" />
              立即付款 {{ formatMoney(record.final_price) }}
            </ElButton>
          </template>

          <div v-else class="stl-empty-tip">
            <ArtSvgIcon icon="ri:time-line" class="stl-empty-ico" />
            <p>
              {{ isRejected ? '结算已驳回，无法付款' : '请先完成审核流程后再付款' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="stl-detail-footer">
        <ElButton @click="handlePrint">
          <ArtSvgIcon icon="ri:printer-line" class="mr-1" />
          打印结算单
        </ElButton>
        <ElButton @click="dialogVisible = false">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { fetchOrderDetail } from '@/api/recycle/order'
  import {
    fetchSettlementApprove,
    fetchSettlementAudit,
    fetchSettlementReject,
    fetchUserBankList
  } from '@/api/recycle/settlement'
  import type { SettlementItem, SettlementStatus } from '@/types/recycle/settlement'
  import { SETTLEMENT_STATUS_CONFIG, SETTLEMENT_STEPS } from '@/types/recycle/settlement'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import FeeBreakdown from './settlement-fee-breakdown.vue'

  type DetailTab = 'detail' | 'audit' | 'payment'

  interface Props {
    visible: boolean
    record?: SettlementItem | null
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
    (e: 'pay', record: SettlementItem): void
  }

  interface EnrichData {
    vin?: string
    brand?: string
    model?: string
    vehicle_type?: string
    phone?: string
    id_card?: string
    account_name?: string
    bank_name?: string
    bank_account?: string
    settlement_type?: string
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const activeTab = ref<DetailTab>('detail')
  const auditNote = ref('')
  const acting = ref(false)
  const enriching = ref(false)
  const enrich = ref<EnrichData>({})

  const statusCfg = computed(() => {
    const status = props.record?.settlement_status as SettlementStatus | undefined
    return status ? SETTLEMENT_STATUS_CONFIG[status] : null
  })

  const statusBadgeStyle = computed(() => {
    if (!statusCfg.value) return {}
    return {
      color: statusCfg.value.color,
      background: statusCfg.value.bg
    }
  })

  const isRejected = computed(() => props.record?.settlement_status === 5)
  const stepIdx = computed(() => statusCfg.value?.step ?? 0)

  /** 财务阶段直接驳回：无审核人，仅有驳回意见 */
  const financeAuditRejected = computed(
    () => isRejected.value && !props.record?.audit_user_name && !!props.record?.audit_remark
  )

  /** 财务审核记录：审核通过有审核人，或财务直接驳回 */
  const hasFinanceAuditRecord = computed(
    () => !!props.record?.audit_user_name || financeAuditRejected.value
  )

  /** 管理员审批驳回：财务已通过，但未落审批人且已驳回 */
  const approveRejected = computed(
    () => isRejected.value && !!props.record?.audit_user_name && !props.record?.approve_user_name
  )

  /** 管理员审批记录：审批通过有审批人，或审批阶段驳回 */
  const hasApproveRecord = computed(
    () => !!props.record?.approve_user_name || approveRejected.value
  )

  /** 财务审核意见：审批驳回时 audit_remark 被复写为驳回原因，财务卡不再展示 */
  const financeAuditRemark = computed(() => {
    if (approveRejected.value) return ''
    return props.record?.audit_remark || ''
  })

  const approveRemark = computed(() => {
    if (approveRejected.value) return props.record?.audit_remark || ''
    return props.record?.approve_remark || ''
  })

  const tabs = computed(() => {
    const status = props.record?.settlement_status
    let auditLabel = '审核记录'
    if (status === 1) auditLabel = '财务审核'
    else if (status === 2) auditLabel = '管理员审批'
    return [
      { id: 'detail' as DetailTab, label: '结算明细' },
      { id: 'audit' as DetailTab, label: auditLabel },
      { id: 'payment' as DetailTab, label: '付款操作' }
    ]
  })

  const methodText = computed(() => {
    const m = props.record?.settlement_method
    if (m === 'wechat') return '微信支付'
    if (m === 'alipay') return '支付宝'
    if (m === 'cash') return '现金'
    return '银行转账'
  })

  function formatMoney(val?: number | string) {
    const num = Number(val)
    if (Number.isNaN(num) || num <= 0) return '¥0'
    return `¥${num.toLocaleString()}`
  }

  function formatTime(val?: number | string) {
    if (val === undefined || val === null || val === '') return '—'
    if (typeof val === 'number' || /^\d+$/.test(String(val))) {
      const ts = Number(val)
      if (!ts) return '—'
      const d = new Date(ts < 1e12 ? ts * 1000 : ts)
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
    return String(val)
  }

  function getStepCircleStyle(i: number) {
    if (isRejected.value) {
      return {
        background: i === 1 ? '#FF4D4F' : '#F5F5F5',
        color: i === 1 ? '#fff' : '#8C8C8C'
      }
    }
    const active = i <= stepIdx.value
    return {
      background: active ? '#1890FF' : '#F5F5F5',
      color: active ? '#fff' : '#8C8C8C'
    }
  }

  function getStepTextColor(i: number) {
    if (isRejected.value) return i === 1 ? '#FF4D4F' : '#8C8C8C'
    return i <= stepIdx.value ? '#1890FF' : '#8C8C8C'
  }

  const vehicleRows = computed(() => {
    const r = props.record
    const e = enrich.value
    const brandModel = [e.brand, e.model].filter(Boolean).join(' ') || '—'
    return [
      { label: '车牌号', value: r?.plate_no || '—' },
      { label: 'VIN码', value: e.vin || '—' },
      { label: '品牌车型', value: brandModel },
      { label: '车辆类型', value: e.vehicle_type || '—' },
      { label: '结算类型', value: e.settlement_type || '报废' },
      { label: '负责业务员', value: r?.business_name || '—' }
    ]
  })

  const ownerRows = computed(() => {
    const r = props.record
    const e = enrich.value
    const ownerType =
      r?.owner_type_text ||
      (r?.owner_type === 'company' ? '企业客户' : r?.owner_type ? '个人车主' : '—')
    return [
      { label: '车主姓名', value: r?.owner_name || '—' },
      { label: '客户类型', value: ownerType },
      { label: '联系电话', value: e.phone || '—' },
      { label: '身份证号', value: e.id_card || '—' }
    ]
  })

  const bankRows = computed(() => {
    const e = enrich.value
    const r = props.record
    return [
      {
        label: '账户名',
        value: e.account_name || r?.bank_account_name || '—'
      },
      { label: '开户银行', value: e.bank_name || r?.bank_name || '—' },
      {
        label: '银行卡号',
        value: e.bank_account || r?.bank_account_no || '—'
      }
    ]
  })

  const auditChecklist = computed(() => {
    const amount = Number(props.record?.final_price) || 0
    const deduct = Number(props.record?.deduction_price) || 0
    return [
      {
        label: '结算金额是否与合同一致',
        value: amount > 0 ? '✓ 金额合规' : '待核实'
      },
      { label: '车主身份信息核实', value: '待核实' },
      { label: '银行账号与身份证匹配', value: '待核实' },
      {
        label: '质检扣款依据完整',
        value: deduct > 0 ? '有质检扣款' : '无扣款'
      }
    ]
  })

  async function loadEnrich() {
    const item = props.record
    if (!item?.order_id) {
      enrich.value = {}
      return
    }
    enriching.value = true
    try {
      const detail = await fetchOrderDetail(item.order_id)
      const vehicle =
        detail?.vehicles?.find((v) => v.id === item.vehicle_id) ||
        detail?.vehicles?.[0] ||
        detail?.vehicle
      const next: EnrichData = {
        vin: vehicle?.vin || detail?.vin,
        brand: vehicle?.brand || detail?.brand,
        model: vehicle?.model || detail?.model,
        vehicle_type:
          String(vehicle?.fuel_type || (detail as Record<string, unknown>)?.fuel_type || '') ||
          undefined,
        phone: detail?.phone,
        id_card: String((detail as Record<string, unknown>)?.id_card || '') || undefined,
        account_name: detail?.bank_account_name,
        bank_name: detail?.bank_name,
        bank_account: detail?.bank_card_number,
        settlement_type: '报废'
      }

      const uid = Number(detail?.uid || 0)
      const bankId = Number(item.bank_account_id || 0)
      if (uid > 0 && bankId > 0) {
        const banks = await fetchUserBankList(uid)
        const bank = banks.find((b) => b.id === bankId)
        if (bank) {
          next.account_name = bank.account_name || next.account_name
          next.bank_name = bank.bank_name || next.bank_name
          next.bank_account = bank.bank_account || bank.account_no || next.bank_account
        }
      }
      enrich.value = next
    } catch {
      enrich.value = {}
    } finally {
      enriching.value = false
    }
  }

  function handleOpen() {
    activeTab.value = 'detail'
    auditNote.value = ''
    loadEnrich()
  }

  async function handleAuditPass() {
    if (!props.record?.id || !auditNote.value.trim()) return
    acting.value = true
    try {
      await fetchSettlementAudit(props.record.id, auditNote.value.trim())
      emit('success')
    } finally {
      acting.value = false
    }
  }

  async function handleAuditReject() {
    if (!props.record?.id || !auditNote.value.trim()) return
    acting.value = true
    try {
      await fetchSettlementReject(props.record.id, auditNote.value.trim())
      emit('success')
    } finally {
      acting.value = false
    }
  }

  async function handleApprovePass() {
    if (!props.record?.id) return
    acting.value = true
    try {
      await fetchSettlementApprove(props.record.id)
      emit('success')
    } finally {
      acting.value = false
    }
  }

  async function handleApproveReject() {
    if (!props.record?.id) return
    try {
      const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回结算', {
        type: 'warning',
        confirmButtonText: '确认驳回',
        inputPattern: /\S+/,
        inputErrorMessage: '请填写驳回原因'
      })
      acting.value = true
      await fetchSettlementReject(props.record.id, value)
      emit('success')
    } catch {
      // cancel
    } finally {
      acting.value = false
    }
  }

  function emitPay() {
    if (props.record) emit('pay', props.record)
  }

  function handlePrint() {
    ElMessage.info('打印模板对接中，请稍后')
  }

  function handleClosed() {
    activeTab.value = 'detail'
    auditNote.value = ''
    enrich.value = {}
  }
</script>

<style scoped lang="scss">
  .stl-dh {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .stl-dh-left {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .stl-dh-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 16px;
    color: #1890ff;
    background: #e6f7ff;
    border-radius: 8px;
  }

  .stl-dh-title-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .stl-dh-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #111827;
  }

  .stl-dh-badge {
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 4px;
  }

  .stl-dh-sub {
    margin: 2px 0 0;
    font-size: 12px;
    color: #9ca3af;
  }

  .stl-detail-wrap {
    // margin: -8px -16px 0;
  }

  .stl-steps-bar {
    padding: 16px 26px;
    border-bottom: 1px solid #f3f4f6;
  }

  .stl-steps-row {
    display: flex;
    align-items: center;
  }

  .stl-step-item {
    display: flex;
    flex: 1;
    align-items: center;
  }

  .stl-step-node {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .stl-step-circle {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 12px;
    font-weight: 700;
    border-radius: 50%;
  }

  .stl-step-ico {
    font-size: 14px;
  }

  .stl-step-text {
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  .stl-step-line {
    flex: 1;
    height: 1px;
    margin: 0 8px;
  }

  .stl-tabs {
    display: flex;
    padding: 0 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  .stl-tab {
    padding: 12px 20px;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;

    &:hover {
      color: #374151;
    }

    &.is-active {
      color: #1890ff;
      border-bottom-color: #1890ff;
    }
  }

  .stl-detail-body {
    height: calc(90vh - 280px);
    padding: 24px;
    overflow-y: auto;
  }

  .stl-detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .stl-detail-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .stl-section-title {
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
  }

  .stl-info-card {
    padding: 4px 16px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .stl-fee-card {
    padding: 8px 16px;
  }

  .stl-timeline-card {
    padding: 12px 16px;
  }

  .stl-info-row {
    display: flex;
    align-items: flex-start;
    padding: 8px 0;
    border-bottom: 1px solid #f9fafb;

    &:last-child {
      border-bottom: none;
    }
  }

  .stl-info-label {
    flex-shrink: 0;
    width: 96px;
    padding-top: 2px;
    font-size: 12px;
    color: #9ca3af;
  }

  .stl-info-value {
    flex: 1;
    font-size: 14px;
    color: #1f2937;
    word-break: break-all;
  }

  .stl-timeline-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .stl-tl-label {
    flex-shrink: 0;
    width: 80px;
    color: #9ca3af;
  }

  .stl-tl-value {
    color: #374151;

    &.is-paid {
      font-weight: 500;
      color: #52c41a;
    }
  }

  .stl-audit-pane {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .stl-audit-record {
    padding: 16px;
    border-radius: 8px;

    &.is-pass {
      background: #f6ffed;
      border: 1px solid #b7eb8f;
    }

    &.is-reject {
      background: #fff1f0;
      border: 1px solid #ffa39e;
    }
  }

  .stl-audit-record-head {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .stl-audit-record-ico {
    font-size: 16px;
  }

  .stl-audit-record.is-pass .stl-audit-record-ico,
  .stl-audit-record.is-pass .stl-audit-record-title {
    color: #389e0d;
  }

  .stl-audit-record.is-approve {
    background: #f9f0ff;
    border: 1px solid #d3adf7;
  }

  .stl-audit-record.is-approve .stl-audit-record-ico,
  .stl-audit-record.is-approve .stl-audit-record-title {
    color: #531dab;
  }

  .stl-audit-record.is-reject .stl-audit-record-ico,
  .stl-audit-record.is-reject .stl-audit-record-title {
    color: #cf1322;
  }

  .stl-audit-record-title {
    font-size: 14px;
    font-weight: 500;
  }

  .stl-audit-record-time {
    margin-left: auto;
    font-size: 12px;
    color: #9ca3af;
  }

  .stl-audit-record-meta {
    margin-top: 2px;
    font-size: 12px;
    color: #4b5563;
  }

  .stl-check-card {
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .stl-check-title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
  }

  .stl-check-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 12px;
    color: #4b5563;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .stl-check-val {
    font-weight: 500;
    color: #374151;
  }

  .stl-audit-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: #4b5563;

    .req {
      color: #ff4d4f;
    }
  }

  .stl-audit-actions {
    display: flex;
    gap: 12px;
  }

  .stl-btn-reject,
  .stl-btn-pass,
  .stl-btn-approve {
    flex: 1;
    height: 40px;
    margin: 0 !important;
    border-radius: 4px;
  }

  .stl-btn-reject {
    color: #ff4d4f !important;
    background: #fff !important;
    border: 2px solid #ff4d4f !important;
  }

  .stl-btn-pass {
    color: #fff !important;
    background: #52c41a !important;
    border-color: #52c41a !important;
  }

  .stl-btn-approve {
    color: #fff !important;
    background: #722ed1 !important;
    border-color: #722ed1 !important;
  }

  .stl-btn-pay-now {
    width: 100%;
    height: 44px !important;
    margin: 0 !important;
    color: #fff !important;
    background: #1890ff !important;
    border-color: #1890ff !important;
  }

  .stl-approve-alert {
    padding: 16px;
    background: #f9f0ff;
    border: 1px solid #d3adf7;
    border-radius: 8px;
  }

  .stl-approve-alert-head {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #531dab;
  }

  .stl-approve-alert-desc {
    font-size: 12px;
    color: #722ed1;
  }

  .stl-pay-pane {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .stl-paid-card {
    padding: 20px;
    text-align: center;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    border-radius: 12px;
  }

  .stl-paid-ico {
    font-size: 40px;
    color: #52c41a;
  }

  .stl-paid-title {
    margin-top: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #389e0d;
  }

  .stl-paid-sub {
    margin-top: 4px;
    font-size: 14px;
    color: #52c41a;
  }

  .stl-paid-amount {
    margin-top: 12px;
    font-size: 24px;
    font-weight: 700;
    color: #1890ff;
  }

  .stl-paid-proof {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: center;
    margin-top: 12px;
    font-size: 12px;
    color: #52c41a;
  }

  .stl-paid-proof-img {
    width: 64px;
    height: 64px;
    border: 1px solid #b7eb8f;
    border-radius: 6px;
  }

  .stl-pay-tip {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 16px;
    font-size: 12px;
    color: #096dd9;
    background: #e6f7ff;
    border-radius: 8px;
  }

  .stl-fee-wrap {
    padding: 8px 0;
  }

  .stl-empty-tip {
    padding: 40px 0;
    font-size: 14px;
    color: #9ca3af;
    text-align: center;
  }

  .stl-empty-ico {
    margin-bottom: 8px;
    font-size: 32px;
    color: #d1d5db;
  }

  .stl-detail-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    width: 100%;
  }

  .mr-1 {
    margin-right: 4px;
  }
</style>

<style lang="scss">
  .stl-detail-dialog {
    padding: 0 !important;
    overflow: hidden;
    border-radius: 8px !important;

    .el-dialog__header {
      padding: 16px 24px;
      margin-right: 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .el-dialog__body {
      padding: 0;
    }

    .el-dialog__footer {
      padding: 16px 24px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
  }
</style>
