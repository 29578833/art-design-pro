<template>
  <div class="fo-edit-panel">
    <div class="info-card">
      <div class="info-card-title">关联车辆档案</div>
      <ElRow :gutter="16">
        <ElCol :span="8">
          <label class="field-label">车牌号 <span class="required">*</span></label>
          <ElInput v-model="form.plate_no" placeholder="如：京A·12345" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">车架号(VIN)</label>
          <ElInput v-model="form.vin" placeholder="17位车架号" maxlength="17" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">车辆品牌</label>
          <ElInput v-model="form.brand" placeholder="如：大众" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">车系/型号</label>
          <ElInput v-model="form.model" placeholder="如：帕萨特2020款" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">车辆类型</label>
          <ElSelect v-model="form.vehicle_type" placeholder="请选择">
            <ElOption v-for="t in fuelTypes" :key="t" :label="t" :value="t" />
          </ElSelect>
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">出厂年份</label>
          <ElInput v-model="form.vehicle_year" placeholder="如：2019" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">车身颜色</label>
          <ElInput v-model="form.color" placeholder="如：白色" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">表显里程（万km）</label>
          <ElInput v-model="form.mileage" type="number" placeholder="0" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">初次登记日期</label>
          <ElDatePicker
            v-model="form.first_reg_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
          />
        </ElCol>
      </ElRow>
      <div class="delivery-block">
        <div class="sub-label">送货方式</div>
        <div class="delivery-options">
          <button
            v-for="opt in deliveryOptions"
            :key="opt.value"
            type="button"
            class="delivery-opt"
            :class="{ active: form.delivery_type === opt.value }"
            @click="form.delivery_type = opt.value"
          >
            <div class="delivery-opt-label">{{ opt.label }}</div>
            <div class="delivery-opt-desc">{{ opt.desc }}</div>
          </button>
        </div>
        <ElRow v-if="form.delivery_type === 'self'" :gutter="16" class="mt-3">
          <ElCol :span="12">
            <label class="field-label">送车人姓名</label>
            <ElInput v-model="form.pickup_name" placeholder="送车人" />
          </ElCol>
          <ElCol :span="12">
            <label class="field-label">送车人电话</label>
            <ElInput v-model="form.pickup_phone" placeholder="手机号" />
          </ElCol>
        </ElRow>
        <ElRow v-else :gutter="16" class="mt-3">
          <ElCol :span="8">
            <label class="field-label">取车联系人</label>
            <ElInput v-model="form.pickup_name" placeholder="联系人" />
          </ElCol>
          <ElCol :span="8">
            <label class="field-label">取车电话</label>
            <ElInput v-model="form.pickup_phone" placeholder="手机号" />
          </ElCol>
          <ElCol :span="24">
            <label class="field-label">取车地址</label>
            <ElInput v-model="form.pickup_address" placeholder="详细地址" />
          </ElCol>
        </ElRow>
      </div>
    </div>

    <div class="info-card">
      <div class="info-card-title">客户信息</div>
      <ElRow :gutter="16">
        <ElCol :span="8">
          <label class="field-label">客户姓名 <span class="required">*</span></label>
          <ElInput v-model="form.real_name" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">联系电话 <span class="required">*</span></label>
          <ElInput v-model="form.phone" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">身份证号</label>
          <ElInput v-model="form.id_card" maxlength="18" />
        </ElCol>
        <ElCol :span="24">
          <label class="field-label">客户地址</label>
          <ElInput v-model="form.address" />
        </ElCol>
      </ElRow>
    </div>

    <div class="info-card">
      <div class="info-card-title">结算信息</div>
      <ElRow :gutter="16">
        <ElCol :span="8">
          <label class="field-label">结算类型</label>
          <ElSelect v-model="form.settlement_type" placeholder="请选择">
            <ElOption label="个人结算" value="personal" />
            <ElOption label="企业结算" value="company" />
          </ElSelect>
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">结算方式</label>
          <ElSelect v-model="form.settlement_method" placeholder="请选择">
            <ElOption label="重量结算" value="weight" />
            <ElOption label="整备质量结算" value="gross_weight" />
            <ElOption label="整车结算" value="whole_vehicle" />
          </ElSelect>
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">回收单价/残值</label>
          <ElInput v-model="form.unit_price" type="number" placeholder="0" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">自送费补贴（元）</label>
          <ElInput v-model="form.self_delivery_subsidy" type="number" placeholder="0" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">质检缺件免扣款</label>
          <ElCheckbox v-model="form.deduct_missing">勾选后缺件不计入扣款</ElCheckbox>
        </ElCol>
      </ElRow>
    </div>

    <div class="info-card">
      <div class="info-card-title-row">
        <span class="info-card-title mb-0! border-0! pb-0!">代理人信息</span>
        <ElCheckbox v-model="form.has_agent">有代理人</ElCheckbox>
      </div>
      <ElRow v-if="form.has_agent" :gutter="16">
        <ElCol :span="8">
          <label class="field-label">代理人姓名</label>
          <ElInput v-model="form.agent_name" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">代理人电话</label>
          <ElInput v-model="form.agent_phone" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">代理服务费（元）</label>
          <ElInput v-model="form.agent_fee" type="number" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">服务费发票号</label>
          <ElInput v-model="form.agent_invoice_no" />
        </ElCol>
      </ElRow>
    </div>

    <div class="info-card">
      <div class="info-card-title">收款银行卡</div>
      <ElRow :gutter="16">
        <ElCol :span="8">
          <label class="field-label">开户姓名</label>
          <ElInput v-model="form.bank_account_name" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">开户银行</label>
          <ElInput v-model="form.bank_name" />
        </ElCol>
        <ElCol :span="8">
          <label class="field-label">银行卡号</label>
          <ElInput v-model="form.bank_card_number" maxlength="19" />
        </ElCol>
      </ElRow>
    </div>

    <div class="info-card">
      <label class="field-label">备注</label>
      <ElInput v-model="form.remark" type="textarea" :rows="3" placeholder="订单备注" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { fetchUpdateOrder } from '@/api/recycle/order'
  import type { OrderDetail, OrderUpdatePayload } from '@/types/recycle/order'

  defineOptions({ name: 'FormalOrderDetailEditPanel' })

  interface OrderEditForm {
    plate_no: string
    vin: string
    brand: string
    model: string
    vehicle_type: string
    vehicle_year: string
    color: string
    mileage: string
    first_reg_date: string
    delivery_type: 'self' | 'tow'
    pickup_name: string
    pickup_phone: string
    pickup_address: string
    real_name: string
    phone: string
    address: string
    id_card: string
    settlement_type: 'personal' | 'company'
    settlement_method: string
    unit_price: string
    self_delivery_subsidy: string
    deduct_missing: boolean
    has_agent: boolean
    agent_name: string
    agent_phone: string
    agent_fee: string
    agent_invoice_no: string
    bank_account_name: string
    bank_name: string
    bank_card_number: string
    remark: string
  }

  const props = defineProps<{
    detail: Partial<OrderDetail>
    selectedVehicleIdx: number
  }>()

  const emit = defineEmits<{
    (e: 'saved'): void
  }>()

  const fuelTypes = ['汽油', '柴油', '纯电动', '插电混动', '油电混动']
  const deliveryOptions = [
    { value: 'self' as const, label: '自行送厂', desc: '自行驾驶送达' },
    { value: 'tow' as const, label: '预约拖车', desc: '上门取车' }
  ]

  const saving = ref(false)
  const vehicleId = ref(0)

  const defaultForm = (): OrderEditForm => ({
    plate_no: '',
    vin: '',
    brand: '',
    model: '',
    vehicle_type: '',
    vehicle_year: '',
    color: '',
    mileage: '',
    first_reg_date: '',
    delivery_type: 'self',
    pickup_name: '',
    pickup_phone: '',
    pickup_address: '',
    real_name: '',
    phone: '',
    address: '',
    id_card: '',
    settlement_type: 'personal',
    settlement_method: 'weight',
    unit_price: '',
    self_delivery_subsidy: '',
    deduct_missing: false,
    has_agent: false,
    agent_name: '',
    agent_phone: '',
    agent_fee: '',
    agent_invoice_no: '',
    bank_account_name: '',
    bank_name: '',
    bank_card_number: '',
    remark: ''
  })

  const form = ref<OrderEditForm>(defaultForm())

  function resolveYear(vehicle?: OrderDetail['vehicle']) {
    if (!vehicle) return ''
    if (vehicle.vehicle_year) return String(vehicle.vehicle_year)
    if (vehicle.reg_date) return String(vehicle.reg_date).slice(0, 4)
    return ''
  }

  function mapOwnerType(ownerType?: string): 'personal' | 'company' {
    if (ownerType === 'company' || ownerType === 'non_personal') return 'company'
    return 'personal'
  }

  function currentVehicle(detail: Partial<OrderDetail>) {
    return detail.vehicles?.[props.selectedVehicleIdx] ?? detail.vehicle
  }

  function fillForm(detail: Partial<OrderDetail>) {
    const vehicle = currentVehicle(detail)
    vehicleId.value = Number(vehicle?.id) || 0

    const deliveryType = (detail.delivery_type as OrderEditForm['delivery_type']) || 'self'
    const pickupName =
      deliveryType === 'tow'
        ? detail.pickup_contact_name || ''
        : (vehicle as { self_delivery_name?: string })?.self_delivery_name || detail.real_name || ''
    const pickupPhone =
      deliveryType === 'tow'
        ? detail.pickup_contact_phone || ''
        : (vehicle as { self_delivery_phone?: string })?.self_delivery_phone || detail.phone || ''

    form.value = {
      plate_no: vehicle?.plate_no || detail.plate_no || '',
      vin: vehicle?.vin || detail.vin || '',
      brand: vehicle?.brand || detail.brand || '',
      model: vehicle?.model || detail.model || '',
      vehicle_type: vehicle?.vehicle_type || vehicle?.fuel_type || '',
      vehicle_year: resolveYear(vehicle),
      color: vehicle?.color || '',
      mileage: vehicle?.mileage != null ? String(vehicle.mileage) : '',
      first_reg_date: vehicle?.reg_date || '',
      delivery_type: deliveryType,
      pickup_name: pickupName,
      pickup_phone: pickupPhone,
      pickup_address: detail.pickup_address || '',
      real_name: detail.real_name || '',
      phone: detail.phone || '',
      address: detail.address || '',
      id_card: (vehicle as { owner_id_card?: string })?.owner_id_card || '',
      settlement_type: mapOwnerType(detail.owner_type),
      settlement_method: detail.settlement_method || 'weight',
      unit_price:
        detail.unit_price != null
          ? String(detail.unit_price)
          : detail.settlement_amount != null
            ? String(detail.settlement_amount)
            : '',
      self_delivery_subsidy:
        detail.self_delivery_subsidy != null ? String(detail.self_delivery_subsidy) : '',
      deduct_missing: Number(detail.deduct_missing) === 1,
      has_agent: Number(detail.has_agent) === 1,
      agent_name: detail.agent_name || '',
      agent_phone: detail.agent_phone || '',
      agent_fee: detail.agent_fee != null ? String(detail.agent_fee) : '',
      agent_invoice_no: detail.agent_invoice_no || '',
      bank_account_name: detail.bank_account_name || '',
      bank_name: detail.bank_name || '',
      bank_card_number: detail.bank_card_number || '',
      remark: detail.remark || ''
    }
  }

  function buildUpdatePayload(): OrderUpdatePayload {
    const id = props.detail.id
    if (!id) throw new Error('missing order id')

    return {
      id,
      vehicle_id: vehicleId.value || undefined,
      has_agent: form.value.has_agent ? 1 : 0,
      remark: form.value.remark,
      vehicle: {
        plate_no: form.value.plate_no.trim(),
        vin: form.value.vin.trim(),
        brand: form.value.brand.trim(),
        model: form.value.model.trim(),
        vehicle_type: form.value.vehicle_type,
        vehicle_year: form.value.vehicle_year,
        color: form.value.color,
        mileage: form.value.mileage,
        first_reg_date: form.value.first_reg_date,
        delivery_type: form.value.delivery_type,
        pickup_name: form.value.pickup_name.trim(),
        pickup_phone: form.value.pickup_phone.trim()
      },
      customer: {
        real_name: form.value.real_name.trim(),
        phone: form.value.phone.trim(),
        address: form.value.address,
        id_card: form.value.id_card.trim()
      },
      settlement: {
        settlement_type: form.value.settlement_type,
        settlement_method: form.value.settlement_method,
        unit_price: form.value.unit_price,
        self_delivery_subsidy: form.value.self_delivery_subsidy,
        deduct_missing: form.value.deduct_missing
      },
      agent: {
        agent_name: form.value.agent_name,
        agent_phone: form.value.agent_phone,
        agent_fee: form.value.agent_fee,
        agent_invoice_no: form.value.agent_invoice_no
      },
      bank: {
        bank_account_name: form.value.bank_account_name,
        bank_name: form.value.bank_name,
        bank_card_number: form.value.bank_card_number
      }
    }
  }

  watch(
    () => [props.detail, props.selectedVehicleIdx] as const,
    ([detail]) => {
      if (!detail?.id) {
        form.value = defaultForm()
        vehicleId.value = 0
        return
      }
      fillForm(detail)
    },
    { immediate: true, deep: true }
  )

  async function submit() {
    if (!form.value.plate_no.trim() || !form.value.real_name.trim() || !form.value.phone.trim()) {
      ElMessage.warning('请填写必填项')
      return false
    }
    if (!props.detail.id) {
      ElMessage.warning('订单信息加载失败')
      return false
    }

    saving.value = true
    try {
      await fetchUpdateOrder(buildUpdatePayload())
      emit('saved')
      return true
    } finally {
      saving.value = false
    }
  }

  defineExpose({ submit, saving })
</script>

<style scoped lang="scss">
  .fo-edit-panel {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .info-card {
    padding: 20px;
    margin-bottom: 16px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .info-card-title {
    padding-bottom: 10px;
    margin-bottom: 16px;
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    border-bottom: 1px solid #f0f0f0;
  }

  .info-card-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
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

  .sub-label {
    margin: 16px 0 8px;
    font-size: 12px;
    color: #8c8c8c;
  }

  .delivery-options {
    display: flex;
    gap: 12px;
  }

  .delivery-opt {
    flex: 1;
    padding: 12px;
    text-align: left;
    cursor: pointer;
    background: #fff;
    border: 2px solid #e8e8e8;
    border-radius: 8px;
    transition: border-color 0.2s;

    &.active {
      background: #e6f7ff;
      border-color: #1890ff;
    }
  }

  .delivery-opt-label {
    font-size: 14px;
    font-weight: 500;
    color: #262626;
  }

  .delivery-opt.active .delivery-opt-label {
    color: #1890ff;
  }

  .delivery-opt-desc {
    margin-top: 4px;
    font-size: 12px;
    color: #8c8c8c;
  }

  .mt-3 {
    margin-top: 12px;
  }

  :deep(.el-row) {
    row-gap: 16px;
  }

  :deep(.el-input),
  :deep(.el-select),
  :deep(.el-date-editor) {
    width: 100%;
  }
</style>
