<template>
  <ElDialog
    v-model="dialogVisible"
    width="860px"
    align-center
    destroy-on-close
    class="product-create-dialog"
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
        <div class="product-operator-field">
          <label class="product-field-label">入库操作人 <span class="required">*</span></label>
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

      <div class="product-section">
        <div class="product-section-head">
          <div class="product-section-title">入库物品明细</div>
          <ElButton type="primary" plain size="small" @click="addItem">
            <ArtSvgIcon icon="ri:add-line" class="mr-1" />
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
            <ElInput v-model="item.item_name" placeholder="物品名称" size="small" />
            <ElSelect
              v-model="item.category"
              size="small"
              @change="(val) => handleCategoryChange(index, val)"
            >
              <ElOption
                v-for="opt in categoryOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
            <ElInput v-model="item.spec" placeholder="规格" size="small" />
            <ElInputNumber
              v-model="item.quantity"
              :min="0.01"
              :precision="2"
              size="small"
              controls-position="right"
            />
            <ElInput v-model="item.unit" size="small" />
            <ElInputNumber
              v-model="item.weight"
              :min="0.01"
              :precision="2"
              size="small"
              controls-position="right"
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
              v-if="items.length > 1"
              type="button"
              class="product-item-remove"
              @click="removeItem(index)"
            >
              <ArtSvgIcon icon="ri:close-line" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" :disabled="!canSubmit" @click="handleSubmit">
        确认入库
      </ElButton>
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
  .product-create-dialog {
    :deep(.el-dialog__header) {
      padding: 16px 20px 0;
      margin-right: 0;
    }

    :deep(.el-dialog__body) {
      padding: 16px 20px;
    }
  }

  .product-dialog-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .product-dialog-subtitle {
    margin-top: 4px;
    font-size: 12px;
    color: var(--art-gray-400);
  }

  .product-create-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: 60vh;
    overflow-y: auto;
  }

  .product-section-title {
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 600;
    color: var(--art-gray-500);
    text-transform: uppercase;
  }

  .product-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .product-section-title {
      margin-bottom: 0;
    }
  }

  .product-operator-select {
    width: 240px;
  }

  .product-field-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--art-gray-600);

    .required {
      color: #ff4d4f;
    }
  }

  .product-item-table {
    overflow-x: auto;
  }

  .product-item-header,
  .product-item-row {
    display: grid;
    grid-template-columns: 1.4fr 0.9fr 1fr 0.7fr 0.6fr 0.8fr 1fr 0.9fr 28px;
    gap: 8px;
    align-items: center;
  }

  .product-item-header {
    padding: 0 4px 8px;
    font-size: 12px;
    font-weight: 500;
    color: var(--art-gray-400);
  }

  .product-item-row {
    margin-bottom: 8px;
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
  }
</style>
