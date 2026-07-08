<template>
  <ElDialog
    v-model="dialogVisible"
    width="760px"
    align-center
    destroy-on-close
    :show-close="false"
    class="order-edit-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div>
          <div class="dialog-title">编辑回收订单</div>
          <div class="dialog-sub">{{ orderNo }}</div>
        </div>
        <button type="button" class="btn-close" @click="dialogVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <div v-loading="loading" class="dialog-body">
      <!-- 车辆信息 -->
      <div class="info-card">
        <div class="info-card-title">车辆信息</div>
        <ElRow :gutter="16">
          <ElCol :span="12">
            <label class="field-label">车牌号 <span class="required">*</span></label>
            <ElInput v-model="form.plate_no" placeholder="如：京A·12345" />
          </ElCol>
          <ElCol :span="12">
            <label class="field-label">车架号(VIN)</label>
            <ElInput v-model="form.vin" placeholder="17位车架号" maxlength="17" />
          </ElCol>
          <ElCol :span="12">
            <label class="field-label">车辆品牌</label>
            <ElInput v-model="form.brand" placeholder="如：大众" />
          </ElCol>
          <ElCol :span="12">
            <label class="field-label">车系/型号</label>
            <ElInput v-model="form.model" placeholder="如：帕萨特2020款" />
          </ElCol>
          <ElCol :span="12">
            <label class="field-label">出厂年份</label>
            <ElInput v-model="form.year" placeholder="如：2019" />
          </ElCol>
        </ElRow>
      </div>

      <!-- 客户信息 -->
      <div class="info-card">
        <div class="info-card-title">客户信息</div>
        <ElRow :gutter="16">
          <ElCol :span="12">
            <label class="field-label">客户姓名 <span class="required">*</span></label>
            <ElInput v-model="form.real_name" placeholder="姓名" />
          </ElCol>
          <ElCol :span="12">
            <label class="field-label">联系电话 <span class="required">*</span></label>
            <ElInput v-model="form.phone" placeholder="手机号" />
          </ElCol>
          <ElCol :span="24">
            <label class="field-label">联系地址</label>
            <ElInput v-model="form.address" placeholder="详细地址" />
          </ElCol>
        </ElRow>
      </div>

      <!-- 订单信息 -->
      <div class="info-card">
        <div class="info-card-title">订单信息</div>
        <ElRow :gutter="16">
          <ElCol :span="12">
            <label class="field-label">交付方式</label>
            <ElSelect v-model="form.delivery_type" placeholder="请选择">
              <ElOption label="自行送厂" value="self" />
              <ElOption label="预约拖车" value="tow" />
            </ElSelect>
          </ElCol>
          <ElCol :span="12">
            <label class="field-label">预估残值（元）</label>
            <ElInput v-model="form.settlement_amount" type="number" placeholder="0" :min="0" />
          </ElCol>
        </ElRow>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSave">保存</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchOrderDetail, fetchSaveOrder } from '@/api/recycle/order'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { OrderDetail, OrderSavePayload, RecycleOrder } from '@/types/recycle/order'
  import { getOrderDisplayNo } from '@/types/recycle/order'

  interface OrderEditForm {
    plate_no: string
    vin: string
    brand: string
    model: string
    year: string
    real_name: string
    phone: string
    address: string
    delivery_type: 'self' | 'tow'
    settlement_amount: string
    owner_type: 'personal' | 'non_personal'
  }

  interface Props {
    visible: boolean
    orderData?: RecycleOrder | null
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const saving = ref(false)
  const loading = ref(false)
  const orderDetail = ref<OrderDetail | null>(null)

  const defaultForm = (): OrderEditForm => ({
    plate_no: '',
    vin: '',
    brand: '',
    model: '',
    year: '',
    real_name: '',
    phone: '',
    address: '',
    delivery_type: 'self',
    settlement_amount: '',
    owner_type: 'personal'
  })

  const form = ref<OrderEditForm>(defaultForm())

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const orderNo = computed(() => (props.orderData ? getOrderDisplayNo(props.orderData) : '—'))

  function resolveYear(vehicle?: OrderDetail['vehicle']) {
    if (!vehicle) return ''
    if (vehicle.vehicle_year) return String(vehicle.vehicle_year)
    if (vehicle.reg_date) return String(vehicle.reg_date).slice(0, 4)
    return ''
  }

  function fillForm(detail: OrderDetail) {
    const vehicle = detail.vehicles?.[0] || detail.vehicle

    form.value = {
      plate_no: vehicle?.plate_no || detail.plate_no || '',
      vin: vehicle?.vin || detail.vin || '',
      brand: vehicle?.brand || detail.brand || '',
      model: vehicle?.model || detail.model || '',
      year: resolveYear(vehicle),
      real_name: detail.real_name || '',
      phone: detail.phone || '',
      address: detail.address || '',
      delivery_type: (detail.delivery_type as OrderEditForm['delivery_type']) || 'self',
      settlement_amount: detail.settlement_amount != null ? String(detail.settlement_amount) : '',
      owner_type: detail.owner_type === 'non_personal' ? 'non_personal' : 'personal'
    }
  }

  function buildRegDate(year: string, origin?: string) {
    if (!year) return origin || ''
    if (origin && origin.startsWith(`${year}-`)) return origin
    return `${year}-01-01`
  }

  function buildSavePayload(): OrderSavePayload {
    const detail = orderDetail.value
    const originVehicle = detail?.vehicles?.[0] || detail?.vehicle

    return {
      id: detail?.id,
      real_name: form.value.real_name.trim(),
      phone: form.value.phone.trim(),
      address: form.value.address,
      delivery_type: form.value.delivery_type,
      owner_type: form.value.owner_type,
      settlement_amount: Number(form.value.settlement_amount) || 0,
      uid: Number(detail?.uid) || 0,
      vehicles: [
        {
          plate_no: form.value.plate_no,
          vin: form.value.vin,
          brand: form.value.brand,
          model: form.value.model,
          reg_date: buildRegDate(form.value.year, originVehicle?.reg_date)
        }
      ]
    }
  }

  async function loadDetail() {
    if (!props.orderData?.id) {
      form.value = defaultForm()
      orderDetail.value = null
      return
    }

    loading.value = true
    try {
      const detail = await fetchOrderDetail(props.orderData.id)
      orderDetail.value = detail
      fillForm(detail)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => props.visible,
    (visible) => {
      if (!visible) return
      loadDetail()
    }
  )

  async function handleSave() {
    if (!form.value.plate_no || !form.value.real_name || !form.value.phone) {
      ElMessage.warning('请填写必填项')
      return
    }
    if (!orderDetail.value?.id) {
      ElMessage.warning('订单信息加载失败，请关闭后重试')
      return
    }

    saving.value = true
    try {
      await fetchSaveOrder(buildSavePayload())
      dialogVisible.value = false
      emit('submit')
    } finally {
      saving.value = false
    }
  }
</script>

<style scoped lang="scss">
  .order-edit-dialog {
    :deep(.el-dialog) {
      display: flex;
      flex-direction: column;
      max-height: 88vh;
      padding: 0;
      overflow: hidden;
      border-radius: 8px;
    }

    :deep(.el-dialog__header) {
      padding: 0;
      margin: 0;
    }

    :deep(.el-dialog__body) {
      flex: 1;
      min-height: 0;
      padding: 0;
      overflow: hidden;
    }

    :deep(.el-dialog__footer) {
      padding: 0;
    }

    .dialog-header {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .dialog-title {
      font-size: 16px;
      font-weight: 600;
      color: #262626;
    }

    .dialog-sub {
      margin-top: 2px;
      font-size: 12px;
      color: #8c8c8c;
    }

    .btn-close {
      padding: 4px;
      color: #8c8c8c;
      cursor: pointer;
      background: transparent;
      border: none;
      border-radius: 4px;
      transition: background 0.2s;

      &:hover {
        background: #f5f5f5;
      }
    }

    .dialog-body {
      flex: 1;
      min-height: 0;
      max-height: calc(88vh - 130px);
      padding: 20px 24px;
      overflow-y: auto;
      background: #f5f5f5;
    }

    .info-card {
      padding: 20px;
      margin-bottom: 20px;
      background: #fff;
      border-radius: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .info-card-title {
      padding-bottom: 8px;
      margin-bottom: 16px;
      font-size: 12px;
      font-weight: 600;
      color: #8c8c8c;
      text-transform: uppercase;
      border-bottom: 1px solid #f0f0f0;
    }

    .field-label {
      display: block;
      margin-bottom: 6px;
      font-size: 12px;
      color: #595959;

      .required {
        color: #ff4d4f;
      }
    }

    :deep(.el-row) {
      row-gap: 16px;
    }

    :deep(.el-input),
    :deep(.el-select) {
      width: 100%;
    }

    :deep(.el-input__inner),
    :deep(.el-select__wrapper) {
      font-size: 13px;
    }

    .dialog-footer {
      display: flex;
      flex-shrink: 0;
      gap: 12px;
      align-items: center;
      justify-content: flex-end;
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
    }
  }
</style>
