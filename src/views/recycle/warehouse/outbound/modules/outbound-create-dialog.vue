<template>
  <ElDialog
    v-model="dialogVisible"
    width="780px"
    align-center
    destroy-on-close
    :show-close="true"
    class="outbound-create-dialog"
    style="padding: 0 !important"
    @open="loadInventoryItems"
    @closed="handleClosed"
  >
    <template #header>
      <div class="ob-dialog-header">
        <div class="ob-dialog-title">新建出库单</div>
        <div class="ob-dialog-subtitle">销售出库 / 库位调拨 / 报废处理</div>
      </div>
    </template>

    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <div class="ob-dialog-body">
        <section class="ob-form-section">
          <div class="ob-section-heading">出库类型</div>
          <ElFormItem prop="exit_type" class="ob-type-form-item">
            <div class="ob-type-cards">
              <button
                v-for="opt in typeOptions"
                :key="opt.value"
                type="button"
                class="ob-type-card"
                :class="{ 'is-active': form.exit_type === opt.value }"
                :style="
                  form.exit_type === opt.value
                    ? { borderColor: opt.color, background: `${opt.color}08` }
                    : undefined
                "
                @click="form.exit_type = opt.value"
              >
                <span
                  class="ob-type-card-label"
                  :style="{ color: form.exit_type === opt.value ? opt.color : '#262626' }"
                >
                  {{ opt.label }}
                </span>
                <span class="ob-type-card-desc">{{ opt.desc }}</span>
              </button>
            </div>
          </ElFormItem>

          <div v-if="form.exit_type !== 'scrap'" class="ob-customer-row">
            <ElFormItem prop="customer_name" class="ob-customer-field">
              <template #label>
                <span class="ob-field-label">
                  {{ form.exit_type === 'sale' ? '购买客户' : '调拨目的地' }}
                  <span class="ob-required">*</span>
                </span>
              </template>
              <ElInput
                v-model="form.customer_name"
                :placeholder="form.exit_type === 'sale' ? '客户名称' : '目的仓库/部门'"
                maxlength="100"
              />
            </ElFormItem>
            <ElFormItem prop="contact_phone" class="ob-customer-field">
              <template #label><span class="ob-field-label">联系电话</span></template>
              <ElInput v-model="form.contact_phone" placeholder="联系方式" maxlength="32" />
            </ElFormItem>
          </div>
        </section>

        <section class="ob-form-section">
          <div class="ob-section-heading ob-items-heading">
            <span>出库物品</span>
            <ElButton class="ob-add-item-btn" @click="addItem">
              <ArtSvgIcon icon="ri:add-line" />
              添加物品
            </ElButton>
          </div>

          <div class="ob-item-grid ob-item-grid-header">
            <span>物品名称*</span>
            <span>数量*</span>
            <span>单位</span>
            <span>{{ form.exit_type === 'sale' ? '单价(元)*' : '单价' }}</span>
            <span>小计</span>
            <span></span>
          </div>

          <div v-loading="loadingInventory" class="ob-item-list">
            <div v-for="(item, index) in items" :key="item.key" class="ob-item-grid ob-item-row">
              <ElSelect
                v-model="item.inventoryId"
                filterable
                placeholder="选择物品"
                class="ob-item-select"
                @change="selectInventoryItem(index)"
              >
                <ElOption
                  v-for="option in inventoryItems"
                  :key="option.id"
                  :label="getInventoryLabel(option)"
                  :value="option.id"
                />
              </ElSelect>
              <ElInput
                v-model.number="item.quantity"
                type="number"
                min="1"
                :max="item.stockQuantity || undefined"
                class="ob-number-input"
              />
              <span class="ob-item-unit">{{ item.unit || '—' }}</span>
              <ElInput
                v-model.number="item.unitPrice"
                type="number"
                min="0"
                placeholder="0.00"
                class="ob-number-input"
              />
              <span class="ob-item-subtotal">{{ formatAmount(getSubtotal(item)) }}</span>
              <button
                type="button"
                class="ob-remove-item-btn"
                :disabled="items.length === 1"
                title="删除物品"
                @click="removeItem(index)"
              >
                <ArtSvgIcon icon="ri:close-line" />
              </button>
            </div>
          </div>

          <div class="ob-total-row">
            <div class="ob-total-box">
              <span>合计金额：</span>
              <strong>{{ formatAmount(totalAmount) }}</strong>
            </div>
          </div>
        </section>

        <section class="ob-form-section ob-remark-section">
          <ElFormItem prop="remark" class="ob-remark-item">
            <template #label><span class="ob-field-label">备注说明</span></template>
            <ElInput
              v-model="form.remark"
              type="textarea"
              :rows="2"
              placeholder="出库备注"
              maxlength="1000"
              resize="none"
            />
          </ElFormItem>
        </section>
      </div>
    </ElForm>

    <template #footer>
      <div class="ob-dialog-footer">
        <span class="ob-footer-summary">
          共 {{ items.length }} 种物品 · 合计 {{ formatAmount(totalAmount) }}
        </span>
        <div class="ob-footer-actions">
          <ElButton class="ob-cancel-btn" @click="dialogVisible = false">取消</ElButton>
          <ElButton
            type="primary"
            class="ob-submit-btn"
            :loading="submitting"
            :disabled="!hasValidItems"
            @click="handleSubmit"
          >
            <ArtSvgIcon v-if="!submitting" icon="ri:check-line" />
            提交出库申请
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchInventoryItemList } from '@/api/recycle/inventory-item'
  import { fetchSaleOutboundCreate } from '@/api/recycle/sale-outbound'
  import type { InventoryItem } from '@/types/recycle/inventory-item'
  import type { SaleOutboundCreateParams, SaleOutboundType } from '@/types/recycle/sale-outbound'
  import { SALE_OUTBOUND_TYPE_CONFIG } from '@/types/recycle/sale-outbound'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    visible: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  interface OutboundFormItem {
    key: number
    inventoryId?: number
    name: string
    quantity: number
    stockQuantity: number
    unitPrice?: number
    unit: string
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const loadingInventory = ref(false)
  const inventoryItems = ref<InventoryItem[]>([])
  let itemKey = 0

  const typeOptions = (
    Object.entries(SALE_OUTBOUND_TYPE_CONFIG) as [
      SaleOutboundType,
      (typeof SALE_OUTBOUND_TYPE_CONFIG)[SaleOutboundType]
    ][]
  ).map(([value, cfg]) => ({
    value,
    label: cfg.label,
    color: cfg.color,
    desc:
      value === 'sale'
        ? '销售给外部客户'
        : value === 'transfer'
          ? '内部仓库间转移'
          : '不可使用物品报废'
  }))

  const form = reactive<SaleOutboundCreateParams>({
    exit_type: 'sale',
    customer_name: '',
    contact_phone: '',
    items_desc: '',
    total_amount: 0,
    remark: ''
  })

  const items = ref<OutboundFormItem[]>([createEmptyItem()])

  const rules: FormRules = {
    exit_type: [{ required: true, message: '请选择出库类型', trigger: 'change' }],
    customer_name: [
      {
        validator: (_rule, value, callback) => {
          if (form.exit_type !== 'scrap' && !String(value || '').trim()) {
            callback(new Error(form.exit_type === 'sale' ? '请输入客户名称' : '请输入调拨目的地'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ]
  }

  const totalAmount = computed(() =>
    Number(items.value.reduce((total, item) => total + getSubtotal(item), 0).toFixed(2))
  )

  const hasValidItems = computed(() =>
    items.value.every(
      (item) =>
        !!item.inventoryId &&
        Number(item.quantity) > 0 &&
        (!item.stockQuantity || Number(item.quantity) <= item.stockQuantity)
    )
  )

  function createEmptyItem(): OutboundFormItem {
    itemKey += 1
    return {
      key: itemKey,
      name: '',
      quantity: 1,
      stockQuantity: 0,
      unitPrice: undefined,
      unit: '件'
    }
  }

  async function loadInventoryItems() {
    loadingInventory.value = true
    try {
      const result = await fetchInventoryItemList({ status: 0, page: 1, limit: 500 })
      inventoryItems.value = result.records.filter((item) => Number(item.quantity || 0) > 0)
    } catch {
      inventoryItems.value = []
    } finally {
      loadingInventory.value = false
    }
  }

  function getInventoryLabel(item: InventoryItem) {
    return `${item.item_name || item.item_no || '未命名物品'}（${item.quantity ?? 0}${item.quantity_unit || '件'}）`
  }

  function addItem() {
    items.value.push(createEmptyItem())
  }

  function removeItem(index: number) {
    if (items.value.length === 1) return
    items.value.splice(index, 1)
  }

  function selectInventoryItem(index: number) {
    const row = items.value[index]
    const selected = inventoryItems.value.find((item) => item.id === row.inventoryId)
    if (!selected) return

    row.name = selected.item_name || selected.item_no || '未命名物品'
    row.unit = selected.quantity_unit || '件'
    row.stockQuantity = Number(selected.quantity || 0)
    row.unitPrice = selected.unit_price === undefined ? undefined : Number(selected.unit_price)
  }

  function getSubtotal(item: OutboundFormItem) {
    return Number(item.quantity || 0) * Number(item.unitPrice || 0)
  }

  function formatAmount(value: number) {
    return `¥${Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
  }

  function buildItemsDescription() {
    return items.value.map((item) => `${item.name}×${item.quantity}${item.unit}`).join('、')
  }

  function resetForm() {
    form.exit_type = 'sale'
    form.customer_name = ''
    form.contact_phone = ''
    form.items_desc = ''
    form.total_amount = 0
    form.remark = ''
    items.value = [createEmptyItem()]
  }

  async function handleSubmit() {
    if (!hasValidItems.value) {
      ElMessage.warning('请选择出库物品并填写正确的数量')
      return
    }

    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    form.items_desc = buildItemsDescription()
    form.total_amount = totalAmount.value
    submitting.value = true
    try {
      await fetchSaleOutboundCreate({
        exit_type: form.exit_type,
        customer_name: form.exit_type === 'scrap' ? '' : form.customer_name.trim(),
        contact_phone: form.exit_type === 'scrap' ? '' : form.contact_phone?.trim() || '',
        items_desc: form.items_desc,
        total_amount: form.total_amount,
        remark: form.remark?.trim() || ''
      })
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    formRef.value?.resetFields()
    resetForm()
  }
</script>

<style scoped lang="scss">
  .ob-dialog-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .ob-dialog-subtitle {
    margin-top: 2px;
    font-size: 12px;
    color: #9ca3af;
  }

  .ob-dialog-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .ob-section-heading {
    padding-bottom: 6px;
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    border-bottom: 1px solid #f3f4f6;
  }

  .ob-items-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ob-type-form-item {
    margin-bottom: 16px;

    :deep(.el-form-item__content) {
      width: 100%;
    }
  }

  .ob-type-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    width: 100%;
  }

  .ob-type-card {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px;
    text-align: left;
    cursor: pointer;
    background: #fff;
    border: 2px solid #e8e8e8;
    border-radius: 8px;
    transition:
      border-color 0.2s,
      background 0.2s;
  }

  .ob-type-card-label {
    font-size: 14px;
    font-weight: 500;
  }

  .ob-type-card-desc {
    font-size: 12px;
    color: #9ca3af;
  }

  .ob-customer-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .ob-customer-field,
  .ob-remark-item {
    margin-bottom: 0;
  }

  .ob-field-label {
    font-size: 12px;
    color: #4b5563;
  }

  .ob-required {
    color: #ff4d4f;
  }

  .ob-add-item-btn {
    height: 30px;
    padding: 0 12px;
    font-size: 12px;
    color: #1890ff;
    border-color: #1890ff;
    border-radius: 4px;

    :deep(.art-svg-icon) {
      margin-right: 6px;
      font-size: 14px;
    }
  }

  .ob-item-grid {
    display: grid;
    grid-template-columns: minmax(180px, 2.5fr) 70px 70px 90px 80px 28px;
    gap: 8px;
    align-items: center;
  }

  .ob-item-grid-header {
    padding: 0 8px;
    margin-bottom: 4px;
    font-size: 12px;
    color: #9ca3af;
  }

  .ob-item-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 50px;
  }

  .ob-item-row {
    padding: 8px;
    border: 1px solid #f3f4f6;
    border-radius: 8px;
  }

  .ob-item-select {
    width: 100%;
  }

  .ob-number-input {
    :deep(input) {
      padding: 0 8px;
      font-size: 12px;
    }
  }

  .ob-item-unit {
    overflow: hidden;
    font-size: 12px;
    color: #6b7280;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ob-item-subtotal {
    overflow: hidden;
    font-size: 12px;
    font-weight: 600;
    color: #1890ff;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ob-remove-item-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    font-size: 16px;
    color: #f87171;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 4px;

    &:hover:not(:disabled) {
      background: #fef2f2;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.3;
    }
  }

  .ob-total-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }

  .ob-total-box {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px;
    font-size: 14px;
    color: #1d4ed8;
    background: #eff6ff;
    border-radius: 8px;

    strong {
      font-size: 20px;
      color: #1890ff;
    }
  }

  .ob-dialog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .ob-footer-summary {
    font-size: 12px;
    color: #9ca3af;
  }

  .ob-footer-actions {
    display: flex;
    gap: 12px;
  }

  .ob-cancel-btn,
  .ob-submit-btn {
    height: 36px;
    border-radius: 4px;
  }

  .ob-cancel-btn {
    padding: 0 16px;
    color: #4b5563;
    border-color: #d1d5db;
  }

  .ob-submit-btn {
    padding: 0 24px;
    background: #1890ff;
    border-color: #1890ff;

    :deep(.art-svg-icon) {
      margin-right: 4px;
      font-size: 16px;
    }
  }

  @media (width <= 720px) {
    .ob-type-cards,
    .ob-customer-row {
      grid-template-columns: 1fr;
    }

    .ob-item-list {
      overflow-x: auto;
    }

    .ob-item-grid {
      min-width: 690px;
    }

    .ob-item-grid-header {
      display: none;
    }

    .ob-dialog-footer {
      flex-direction: column;
      gap: 12px;
      align-items: flex-end;
    }
  }
</style>

<style lang="scss">
  .outbound-create-dialog {
    max-width: calc(100vw - 32px);

    .el-dialog__header {
      padding: 16px 24px;
      margin-right: 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .el-dialog__body {
      max-height: calc(88vh - 140px);
      padding: 20px 24px;
      overflow-y: auto;
    }

    .el-dialog__footer {
      padding: 16px 24px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }

    .el-form-item__label {
      padding-bottom: 6px;
      line-height: 18px;
    }

    .el-input__wrapper,
    .el-select__wrapper,
    .el-textarea__inner {
      border-radius: 4px;
    }
  }
</style>
