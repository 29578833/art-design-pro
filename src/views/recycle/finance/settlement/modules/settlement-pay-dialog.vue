<template>
  <ElDialog
    v-model="dialogVisible"
    width="560px"
    align-center
    destroy-on-close
    append-to-body
    class="stl-pay-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div>
        <div class="stl-pay-title">付款操作</div>
        <p class="stl-pay-sub">
          {{ record?.settlement_no || '—' }} · {{ record?.plate_no || '—' }} ·
          {{ record?.owner_name || '—' }}
        </p>
      </div>
    </template>

    <div v-if="record" class="stl-pay-body">
      <div class="stl-pay-amount-box">
        <div class="stl-pay-amount-label">待付金额</div>
        <div class="stl-pay-amount-value">{{ formatMoney(record.final_price) }}</div>
        <div class="stl-pay-amount-meta"> {{ ownerTypeText }} · {{ settlementTypeText }} </div>
      </div>

      <div class="stl-pay-block">
        <div class="stl-pay-block-title">付款方式</div>
        <div class="stl-pay-methods">
          <div
            v-if="isIndividual"
            class="stl-pay-method"
            :class="{ 'is-active is-wechat': payMethod === 'wechat' }"
            @click="payMethod = 'wechat'"
          >
            <div class="stl-pay-method-head">
              <ArtSvgIcon icon="ri:qr-code-line" class="stl-pay-method-ico is-wechat" />
              <span :style="{ color: payMethod === 'wechat' ? '#07C160' : '#262626' }">
                微信支付
              </span>
            </div>
            <div class="stl-pay-method-desc">适用：对私（车主个人）</div>
          </div>
          <div
            class="stl-pay-method"
            :class="{ 'is-active is-bank': payMethod === 'bank_transfer' }"
            @click="payMethod = 'bank_transfer'"
          >
            <div class="stl-pay-method-head">
              <ArtSvgIcon icon="ri:bank-card-line" class="stl-pay-method-ico is-bank" />
              <span :style="{ color: payMethod === 'bank_transfer' ? '#1890FF' : '#262626' }">
                银行转账
              </span>
            </div>
            <div class="stl-pay-method-desc">适用：对私/对公均可</div>
          </div>
        </div>
      </div>

      <div class="stl-pay-bank-box">
        <div class="stl-pay-block-title">
          {{ payMethod === 'wechat' ? '收款方信息' : '收款银行账户' }}
        </div>
        <div v-if="payMethod === 'wechat'" class="stl-pay-wechat-info">
          <div class="stl-pay-qr-placeholder">
            <ArtSvgIcon icon="ri:qr-code-line" />
          </div>
          <div class="stl-pay-wechat-rows">
            <div class="stl-pay-kv">
              <span class="k">收款人</span>
              <span class="v">{{ record.owner_name || '—' }}</span>
            </div>
            <div class="stl-pay-kv">
              <span class="k">手机号</span>
              <span class="v">{{ phone || '—' }}</span>
            </div>
            <div class="stl-pay-kv">
              <span class="k">金额</span>
              <span class="v is-amount">{{ formatMoney(record.final_price) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="stl-pay-bank-grid">
          <div v-for="row in bankInfoRows" :key="row.label" class="stl-pay-kv">
            <span class="k">{{ row.label }}：</span>
            <span class="v">{{ row.value }}</span>
          </div>
        </div>
      </div>

      <div class="stl-pay-block">
        <div class="stl-pay-block-title">付款凭证上传</div>
        <div v-if="proofUrl" class="stl-pay-voucher-ok">
          <ArtSvgIcon icon="ri:checkbox-circle-fill" />
          付款凭证已上传
          <ElImage
            :src="proofUrl"
            fit="cover"
            class="stl-pay-voucher-img"
            :preview-src-list="[proofUrl]"
          />
          <ElButton text type="primary" size="small" @click="triggerUpload">重新上传</ElButton>
        </div>
        <div v-else class="stl-pay-voucher-upload" @click="triggerUpload">
          <ArtSvgIcon icon="ri:upload-2-line" class="stl-pay-upload-ico" />
          <div>{{ uploading ? '上传中…' : '点击上传付款截图 / 转账凭证' }}</div>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="stl-pay-file-input"
          @change="handleFileChange"
        />
      </div>
    </div>

    <template #footer>
      <div class="stl-pay-footer">
        <span class="stl-pay-footer-tip">付款完成后请上传凭证，便于财务核对</span>
        <div class="stl-pay-footer-btns">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton class="stl-pay-confirm-btn" :loading="submitting" @click="handleSubmit">
            <ArtSvgIcon icon="ri:check-line" class="mr-1" />
            确认付款完成
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { uploadFileGetUrl } from '@/api/upload'
  import { fetchOrderDetail } from '@/api/recycle/order'
  import { fetchSettlementPay, fetchUserBankList } from '@/api/recycle/settlement'
  import type { SettlementItem } from '@/types/recycle/settlement'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    visible: boolean
    record?: SettlementItem | null
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

  const submitting = ref(false)
  const uploading = ref(false)
  const proofUrl = ref('')
  const fileInputRef = ref<HTMLInputElement>()
  const payMethod = ref<'wechat' | 'bank_transfer'>('bank_transfer')
  const phone = ref('')
  const accountName = ref('')
  const bankName = ref('')
  const bankAccount = ref('')

  const isIndividual = computed(() => {
    const t = props.record?.owner_type
    return t !== 'company' && props.record?.owner_type_text !== '企业'
  })

  const ownerTypeText = computed(() => (isIndividual.value ? '个人车主' : '企业客户'))

  const settlementTypeText = computed(() => '报废')

  const bankInfoRows = computed(() => [
    { label: '收款人', value: accountName.value || props.record?.owner_name || '—' },
    { label: '联系电话', value: phone.value || '—' },
    { label: '开户银行', value: bankName.value || props.record?.bank_name || '—' },
    {
      label: '银行卡号',
      value: bankAccount.value || props.record?.bank_account_no || '—'
    },
    { label: '转账金额', value: formatMoney(props.record?.final_price) },
    { label: '附言', value: props.record?.settlement_no || '—' }
  ])

  function formatMoney(val?: number | string) {
    const num = Number(val)
    if (Number.isNaN(num) || num <= 0) return '¥0'
    return `¥${num.toLocaleString()}`
  }

  watch(
    () => props.visible,
    async (vis) => {
      if (!vis || !props.record) return
      payMethod.value = isIndividual.value ? 'wechat' : 'bank_transfer'
      phone.value = ''
      accountName.value = props.record.bank_account_name || ''
      bankName.value = props.record.bank_name || ''
      bankAccount.value = props.record.bank_account_no || ''
      if (!props.record.order_id) return
      try {
        const detail = await fetchOrderDetail(props.record.order_id)
        phone.value = detail?.phone || ''
        accountName.value = detail?.bank_account_name || accountName.value
        bankName.value = detail?.bank_name || bankName.value
        bankAccount.value = detail?.bank_card_number || bankAccount.value
        const uid = Number(detail?.uid || 0)
        const bankId = Number(props.record.bank_account_id || 0)
        if (uid > 0 && bankId > 0) {
          const banks = await fetchUserBankList(uid)
          const bank = banks.find((b) => b.id === bankId)
          if (bank) {
            accountName.value = bank.account_name || accountName.value
            bankName.value = bank.bank_name || bankName.value
            bankAccount.value = bank.bank_account || bank.account_no || bankAccount.value
          }
        }
      } catch {
        // ignore
      }
    }
  )

  function triggerUpload() {
    fileInputRef.value?.click()
  }

  async function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    uploading.value = true
    try {
      proofUrl.value = await uploadFileGetUrl(file, { showSuccessMessage: true })
    } finally {
      uploading.value = false
      input.value = ''
    }
  }

  async function handleSubmit() {
    if (!props.record?.id) return
    submitting.value = true
    try {
      await fetchSettlementPay(props.record.id, proofUrl.value)
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    proofUrl.value = ''
    payMethod.value = 'bank_transfer'
  }
</script>

<style scoped lang="scss">
  .stl-pay-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .stl-pay-sub {
    margin: 2px 0 0;
    font-size: 12px;
    color: #9ca3af;
  }

  .stl-pay-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .stl-pay-amount-box {
    padding: 20px;
    text-align: center;
    background: #e6f7ff;
    border-radius: 12px;
  }

  .stl-pay-amount-label {
    margin-bottom: 4px;
    font-size: 14px;
    color: #1890ff;
  }

  .stl-pay-amount-value {
    font-size: 36px;
    font-weight: 700;
    color: #1890ff;
  }

  .stl-pay-amount-meta {
    margin-top: 4px;
    font-size: 12px;
    color: #69b1ff;
  }

  .stl-pay-block-title {
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
  }

  .stl-pay-methods {
    display: flex;
    gap: 12px;
  }

  .stl-pay-method {
    flex: 1;
    padding: 12px;
    text-align: left;
    cursor: pointer;
    background: #fff;
    border: 2px solid #e8e8e8;
    border-radius: 8px;
    transition: all 0.15s;

    &.is-wechat {
      background: #f0fff4;
      border-color: #07c160;
    }

    &.is-bank {
      background: #e6f7ff;
      border-color: #1890ff;
    }
  }

  .stl-pay-method-head {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 500;
  }

  .stl-pay-method-ico {
    font-size: 16px;

    &.is-wechat {
      color: #07c160;
    }

    &.is-bank {
      color: #1890ff;
    }
  }

  .stl-pay-method-desc {
    font-size: 12px;
    color: #9ca3af;
  }

  .stl-pay-bank-box {
    box-sizing: border-box;
    height: 142px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .stl-pay-wechat-info {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .stl-pay-qr-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    font-size: 40px;
    color: #d1d5db;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .stl-pay-wechat-rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stl-pay-bank-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 24px;
  }

  .stl-pay-kv {
    display: flex;
    font-size: 12px;

    .k {
      flex-shrink: 0;
      width: 64px;
      color: #9ca3af;
    }

    .v {
      font-weight: 500;
      color: #1f2937;

      &.is-amount {
        color: #1890ff;
      }
    }
  }

  .stl-pay-voucher-ok {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 12px;
    font-size: 12px;
    color: #389e0d;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    border-radius: 8px;
  }

  .stl-pay-voucher-img {
    width: 48px;
    height: 48px;
    border-radius: 4px;
  }

  .stl-pay-voucher-upload {
    padding: 16px;
    font-size: 12px;
    color: #6b7280;
    text-align: center;
    cursor: pointer;
    border: 2px dashed #e5e7eb;
    border-radius: 8px;
    transition: all 0.15s;

    &:hover {
      background: #e6f7ff;
      border-color: #1890ff;
    }
  }

  .stl-pay-upload-ico {
    margin-bottom: 4px;
    font-size: 20px;
    color: #9ca3af;
  }

  .stl-pay-file-input {
    display: none;
  }

  .stl-pay-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .stl-pay-footer-tip {
    font-size: 12px;
    color: #9ca3af;
  }

  .stl-pay-footer-btns {
    display: flex;
    gap: 12px;
  }

  .mr-1 {
    margin-right: 4px;
  }
</style>

<style lang="scss">
  .stl-pay-dialog {
    padding: 0 !important;

    .el-dialog__header {
      padding: 16px 24px;
      margin-right: 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .el-dialog__body {
      padding: 20px 24px;
    }

    .el-dialog__footer {
      padding: 16px 24px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }

    .stl-pay-confirm-btn {
      color: #fff !important;
      background: #52c41a !important;
      border-color: #52c41a !important;

      &:hover {
        background: #73d13d !important;
        border-color: #73d13d !important;
      }
    }
  }
</style>
