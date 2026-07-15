<template>
  <ElDialog
    v-model="dialogVisible"
    width="860px"
    align-center
    destroy-on-close
    class="product-create-dialog"
    style="padding: 0 !important"
    @closed="handleClosed"
  >
    <template #header>
      <div class="product-dialog-header">
        <div class="product-dialog-title">新建入库单</div>
        <div class="product-dialog-subtitle">登记拆解产物入库信息</div>
      </div>
    </template>

    <div v-loading="loadingOperators || loadingLocations" class="product-create-body">
      <div class="product-section">
        <div class="product-section-title">操作信息</div>
        <div class="product-operator-grid">
          <div class="product-operator-field">
            <label class="product-field-label"> 入库操作人 <span class="required">*</span> </label>
            <ElSelect
              v-model="operatorId"
              placeholder="请选择"
              filterable
              clearable
              class="product-operator-select"
            >
              <ElOption
                v-for="op in operatorList"
                :key="op.id"
                :label="op.real_name || op.phone || `用户${op.id}`"
                :value="op.id"
              />
            </ElSelect>
          </div>
        </div>
      </div>

      <div class="product-section">
        <div class="product-section-head">
          <div class="product-section-title">入库物品明细</div>
          <ElButton class="product-add-btn" @click="addItem">
            <ArtSvgIcon icon="ri:add-line" />
            新增物品行
          </ElButton>
        </div>

        <div class="product-item-table">
          <div class="product-item-header">
            <span>物品名称 *</span>
            <span>分类 *</span>
            <span>规格型号</span>
            <span>数量 *</span>
            <span>单位</span>
            <span>重量(kg) *</span>
            <span>库位 *</span>
            <span>备注</span>
            <span />
          </div>
          <div v-for="(item, index) in items" :key="index" class="product-item-row">
            <ElInput v-model="item.item_name" placeholder="如：发动机总成" size="small" />
            <ElSelect
              v-model="item.category"
              size="small"
              :style="{ color: getCategoryColor(item.category) }"
              @change="(val) => handleCategoryChange(index, val)"
            >
              <ElOption
                v-for="opt in categoryOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
            <ElInput v-model="item.spec" placeholder="规格/型号" size="small" />
            <ElInput v-model.number="item.quantity" type="number" min="1" size="small" />
            <ElSelect v-model="item.unit" size="small">
              <ElOption v-for="unit in unitOptions" :key="unit" :label="unit" :value="unit" />
            </ElSelect>
            <ElInput
              v-model.number="item.weight"
              type="number"
              min="0"
              placeholder="0.0"
              size="small"
            />
            <ElSelect
              v-model="item.location"
              filterable
              allow-create
              default-first-option
              placeholder="库位"
              size="small"
            >
              <ElOption
                v-for="loc in locationOptions"
                :key="loc.id"
                :label="getLocationLabel(loc)"
                :value="loc.location_no || ''"
              />
            </ElSelect>
            <ElInput v-model="item.remark" placeholder="备注" size="small" />
            <button
              type="button"
              class="product-item-remove"
              :disabled="items.length === 1"
              title="删除物品"
              @click="removeItem(index)"
            >
              <ArtSvgIcon icon="ri:close-line" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="hasHazardousItem" class="product-hazardous-warning">
        <ArtSvgIcon icon="ri:alert-line" class="product-warning-icon" />
        <div>
          <strong>危险废物处置提示：</strong>
          含危险废物（动力电池/三元催化等），须严格按环保法规操作，存放于专用危废区域，并委托有资质的专业机构处置，留存转移联单备查。
        </div>
      </div>
    </div>

    <template #footer>
      <div class="product-dialog-footer">
        <span class="product-footer-summary">
          共 {{ items.length }} 种产物 · 总重量 {{ totalWeight.toFixed(1) }} kg
        </span>
        <div class="product-footer-actions">
          <ElButton class="product-cancel-btn" @click="dialogVisible = false">取消</ElButton>
          <ElButton
            type="primary"
            class="product-submit-btn"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            <ArtSvgIcon v-if="!submitting" icon="ri:check-line" />
            确认入库
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import {
    fetchProductStoreCreate,
    fetchProductStoreOperatorList
  } from '@/api/recycle/product-store'
  import { fetchAllWarehouseLocations } from '@/api/recycle/warehouse'
  import type {
    ProductStoreCategory,
    ProductStoreCreateItem,
    ProductStoreOperator
  } from '@/types/recycle/product-store'
  import { PRODUCT_STORE_CATEGORY_CONFIG } from '@/types/recycle/product-store'
  import type { WarehouseLocationOption } from '@/types/recycle/warehouse'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    visible: boolean
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

  const loadingOperators = ref(false)
  const loadingLocations = ref(false)
  const submitting = ref(false)
  const operatorId = ref<number>()
  const operatorList = ref<ProductStoreOperator[]>([])
  const locationOptions = ref<WarehouseLocationOption[]>([])
  const items = ref<ProductStoreCreateItem[]>([createEmptyItem()])

  const categoryOptions = Object.entries(PRODUCT_STORE_CATEGORY_CONFIG).map(([value, cfg]) => ({
    value: value as ProductStoreCategory,
    label: cfg.label
  }))
  const unitOptions = ['件', 'kg', '吨', '套', '组', '批']

  const totalWeight = computed(() =>
    items.value.reduce((total, item) => total + Number(item.weight || 0), 0)
  )

  const hasHazardousItem = computed(() => items.value.some((item) => item.category === 'hazardous'))

  const canSubmit = computed(() => {
    if (!operatorId.value) return false
    return items.value.every(
      (item) =>
        item.item_name?.trim() &&
        item.category &&
        item.quantity > 0 &&
        item.weight > 0 &&
        item.location?.trim()
    )
  })

  function getLocationLabel(loc: WarehouseLocationOption): string {
    const code = loc.location_no || '—'
    if (loc.area) return `${loc.area}-${code}`
    return code
  }

  function getCategoryColor(category: ProductStoreCategory) {
    return PRODUCT_STORE_CATEGORY_CONFIG[category]?.color || '#262626'
  }

  function createEmptyItem(): ProductStoreCreateItem {
    return {
      item_name: '',
      category: 'reusable',
      spec: '',
      quantity: 1,
      unit: '件',
      weight: 0,
      location: '',
      remark: ''
    }
  }

  function handleCategoryChange(index: number, category: ProductStoreCategory) {
    const cfg = PRODUCT_STORE_CATEGORY_CONFIG[category]
    if (cfg) {
      items.value[index].unit = cfg.defaultUnit
    }
  }

  function addItem() {
    items.value.push(createEmptyItem())
  }

  function removeItem(index: number) {
    if (items.value.length === 1) return
    items.value.splice(index, 1)
  }

  async function loadOperators() {
    loadingOperators.value = true
    try {
      operatorList.value = (await fetchProductStoreOperatorList()) || []
    } finally {
      loadingOperators.value = false
    }
  }

  async function loadLocations() {
    loadingLocations.value = true
    try {
      locationOptions.value = (await fetchAllWarehouseLocations()) || []
    } finally {
      loadingLocations.value = false
    }
  }

  async function handleSubmit() {
    if (!operatorId.value) return
    submitting.value = true
    try {
      await fetchProductStoreCreate({
        operator_id: operatorId.value,
        items: items.value.map((item) => ({
          item_name: item.item_name.trim(),
          category: item.category,
          spec: item.spec?.trim() || '',
          quantity: item.quantity,
          unit: item.unit || '件',
          weight: item.weight,
          location: item.location.trim(),
          remark: item.remark?.trim() || ''
        }))
      })
      emit('success')
      dialogVisible.value = false
    } catch {
      ElMessage.error('入库失败，请重试')
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    operatorId.value = undefined
    items.value = [createEmptyItem()]
  }

  watch(
    () => props.visible,
    (val) => {
      if (val) {
        loadOperators()
        loadLocations()
      }
    }
  )
</script>

<style scoped lang="scss">
  .product-dialog-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .product-dialog-subtitle {
    margin-top: 2px;
    font-size: 12px;
    color: #9ca3af;
  }

  .product-create-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .product-section-title {
    padding-bottom: 6px;
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    border-bottom: 1px solid #f3f4f6;
  }

  .product-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    border-bottom: 1px solid #f3f4f6;

    .product-section-title {
      padding-bottom: 6px;
      margin-bottom: 0;
      border-bottom: 0;
    }
  }

  .product-operator-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .product-operator-select {
    width: 100%;
  }

  .product-field-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: #4b5563;

    .required {
      color: #ff4d4f;
    }
  }

  .product-add-btn {
    height: 30px;
    padding: 0 12px;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 500;
    color: #1890ff;
    border-color: #1890ff;
    border-radius: 4px;

    :deep(.art-svg-icon) {
      margin-right: 6px;
      font-size: 14px;
    }
  }

  .product-item-table {
    overflow-x: auto;
  }

  .product-item-header,
  .product-item-row {
    display: grid;
    grid-template-columns: 2fr 100px 1fr 60px 80px 80px 80px 1fr 28px;
    gap: 8px;
    align-items: center;
  }

  .product-item-header {
    padding: 0 8px 4px;
    font-size: 12px;
    font-weight: 500;
    color: var(--art-gray-400);
  }

  .product-item-row {
    min-width: 812px;
    padding: 8px;
    margin-bottom: 8px;
    border: 1px solid #f3f4f6;
    border-radius: 8px;
    transition: border-color 0.2s;

    &:hover {
      border-color: #e5e7eb;
    }

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
      padding-right: 8px;
      padding-left: 8px;
      border-radius: 4px;
    }

    :deep(input) {
      font-size: 12px;
    }
  }

  .product-item-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    color: #ff4d4f;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;

    &:hover {
      background: #fff1f0;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.3;
    }
  }

  .product-hazardous-warning {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 16px;
    font-size: 12px;
    line-height: 1.6;
    color: #b91c1c;
    background: #fff1f0;
    border: 1px solid #fecaca;
    border-radius: 8px;
  }

  .product-warning-icon {
    flex-shrink: 0;
    margin-top: 2px;
    font-size: 16px;
    color: #ef4444;
  }

  .product-dialog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .product-footer-summary {
    font-size: 12px;
    color: #9ca3af;
  }

  .product-footer-actions {
    display: flex;
    gap: 12px;
  }

  .product-cancel-btn,
  .product-submit-btn {
    height: 36px;
    border-radius: 4px;
  }

  .product-cancel-btn {
    padding: 0 16px;
    color: #4b5563;
    border-color: #d1d5db;
  }

  .product-submit-btn {
    padding: 0 24px;
    background: #1890ff;
    border-color: #1890ff;

    :deep(.art-svg-icon) {
      margin-right: 4px;
      font-size: 16px;
    }
  }

  @media (width <= 720px) {
    .product-operator-grid {
      grid-template-columns: 1fr;
    }

    .product-dialog-footer {
      flex-direction: column;
      gap: 12px;
      align-items: flex-end;
    }
  }
</style>

<style lang="scss">
  .product-create-dialog {
    max-width: calc(100vw - 32px);

    .el-dialog__header {
      padding: 16px 24px;
      margin-right: 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .el-dialog__body {
      max-height: calc(90vh - 140px);
      padding: 20px 24px;
      overflow-y: auto;
    }

    .el-dialog__footer {
      padding: 16px 24px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
  }
</style>
