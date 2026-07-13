<template>
  <ElDialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑收车价格' : '新增收车价格规则'"
    width="520px"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <div class="price-form-row">
        <ElFormItem label="品牌" prop="brand" class="price-form-half">
          <ElInput v-model="form.brand" placeholder="如：大众" maxlength="50" />
        </ElFormItem>
        <ElFormItem label="车辆类型" prop="vehicle_type" class="price-form-half">
          <ElSelect
            v-model="form.vehicle_type"
            placeholder="请选择"
            style="width: 100%"
            @change="handleVehicleTypeChange"
          >
            <ElOption
              v-for="item in VEHICLE_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </div>
      <div class="price-form-row">
        <ElFormItem label="年份起" prop="year_start" class="price-form-half">
          <ElInputNumber
            v-model="form.year_start"
            :min="0"
            :max="9999"
            controls-position="right"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="年份止" prop="year_end" class="price-form-half">
          <ElInputNumber
            v-model="form.year_end"
            :min="0"
            :max="9999"
            controls-position="right"
            style="width: 100%"
          />
        </ElFormItem>
      </div>
      <div class="price-form-row">
        <ElFormItem label="里程起（万公里）" prop="mileage_start" class="price-form-half">
          <ElInputNumber
            v-model="form.mileage_start"
            :min="0"
            :precision="1"
            controls-position="right"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="里程止（万公里）" prop="mileage_end" class="price-form-half">
          <ElInputNumber
            v-model="form.mileage_end"
            :min="0"
            :precision="1"
            controls-position="right"
            style="width: 100%"
          />
        </ElFormItem>
      </div>
      <ElFormItem label="基础价格（元）" prop="base_price">
        <ElInputNumber
          v-model="form.base_price"
          :min="0"
          :precision="0"
          controls-position="right"
          style="width: 100%"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchCollectPriceSave, fetchCollectPriceUpdate } from '@/api/recycle/price-config'
  import type { CollectPriceItem } from '@/types/recycle/system'

  /** 收车价格车辆类型：与后端 scrap_collect_price 注释一致 */
  const VEHICLE_TYPE_OPTIONS = [
    { value: 'gasoline', label: '汽油' },
    { value: 'diesel', label: '柴油' },
    { value: 'new_energy', label: '新能源' }
  ] as const

  interface Props {
    visible: boolean
    record?: CollectPriceItem | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const isEdit = computed(() => !!props.record?.id)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const form = reactive({
    brand: '',
    vehicle_type: '',
    vehicle_type_name: '',
    year_start: 0,
    year_end: 0,
    mileage_start: 0,
    mileage_end: 0,
    base_price: 0,
    sort: 0,
    is_show: 1 as 0 | 1
  })

  const rules: FormRules = {
    brand: [{ required: true, message: '请填写品牌', trigger: 'blur' }],
    vehicle_type: [{ required: true, message: '请选择车辆类型', trigger: 'change' }],
    base_price: [{ required: true, message: '请填写基础价格', trigger: 'blur' }]
  }

  function syncVehicleTypeName(code: string) {
    const hit = VEHICLE_TYPE_OPTIONS.find((item) => item.value === code)
    form.vehicle_type_name = hit?.label || ''
  }

  function handleVehicleTypeChange(code: string) {
    syncVehicleTypeName(code)
  }

  watch(
    () => props.visible,
    (val) => {
      if (!val) return
      const row = props.record
      form.brand = row?.brand || ''
      form.vehicle_type = row?.vehicle_type || ''
      form.vehicle_type_name = row?.vehicle_type_name || ''
      if (form.vehicle_type) syncVehicleTypeName(form.vehicle_type)
      form.year_start = Number(row?.year_start || 0)
      form.year_end = Number(row?.year_end || 0)
      form.mileage_start = Number(row?.mileage_start || 0)
      form.mileage_end = Number(row?.mileage_end || 0)
      form.base_price = Number(row?.base_price || 0)
      form.sort = Number(row?.sort || 0)
      form.is_show = Number(row?.is_show ?? 1) as 0 | 1
    }
  )

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    submitting.value = true
    try {
      syncVehicleTypeName(form.vehicle_type)
      const payload = {
        brand: form.brand.trim(),
        vehicle_type: form.vehicle_type,
        vehicle_type_name: form.vehicle_type_name,
        year_start: form.year_start,
        year_end: form.year_end,
        mileage_start: form.mileage_start,
        mileage_end: form.mileage_end,
        base_price: form.base_price,
        sort: form.sort,
        is_show: form.is_show
      }
      if (isEdit.value && props.record?.id) {
        await fetchCollectPriceUpdate(props.record.id, payload)
      } else {
        await fetchCollectPriceSave(payload)
      }
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    formRef.value?.resetFields()
  }
</script>

<style scoped>
  .price-form-row {
    display: flex;
    gap: 12px;
  }

  .price-form-half {
    flex: 1;
    min-width: 0;
  }
</style>
