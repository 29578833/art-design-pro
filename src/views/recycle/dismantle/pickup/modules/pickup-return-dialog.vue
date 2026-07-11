<template>
  <ElDialog
    v-model="dialogVisible"
    width="624px"
    align-center
    destroy-on-close
    class="pickup-return-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div class="pickup-dialog-header">
        <div class="pickup-dialog-title">领料整单退库</div>
        <div class="pickup-dialog-subtitle">
          {{ materialItem?.archive_no || '—' }} · {{ materialItem?.plate_no || '—' }}
        </div>
      </div>
    </template>

    <div v-if="materialItem" class="pickup-return-body">
      <div class="pickup-return-tip">
        将已领料出库的车辆退回仓库重新入库，退库后状态恢复为"待领料"。请选择退库库位。
      </div>

      <div class="pickup-return-info">
        <div class="pickup-return-row">
          <span class="pickup-return-label">出库单号</span>
          <span class="pickup-return-value">{{ materialItem.outbound_no || '—' }}</span>
        </div>
        <div class="pickup-return-row">
          <span class="pickup-return-label">领料人</span>
          <span class="pickup-return-value">{{ materialItem.receiver || '—' }}</span>
        </div>
        <div class="pickup-return-row">
          <span class="pickup-return-label">领料时间</span>
          <span class="pickup-return-value">{{ materialItem.outbound_time || '—' }}</span>
        </div>
        <div class="pickup-return-row">
          <span class="pickup-return-label">退库单号（系统生成）</span>
          <span class="pickup-return-value mono">{{ previewReturnNo }}</span>
        </div>
      </div>

      <ElForm
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        class="pickup-form"
      >
        <ElFormItem prop="location_id">
          <template #label>
            <span class="pickup-field-label">退库库位</span>
          </template>
          <ElSelect
            v-model="formData.location_id"
            :placeholder="locationPlaceholder"
            :loading="loadingLocations"
            filterable
            class="pickup-field-control"
          >
            <ElOption
              v-for="loc in locationOptions"
              :key="loc.id"
              :label="getLocationLabel(loc)"
              :value="loc.id"
              :disabled="isLocationFull(loc)"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <ElButton class="pickup-btn-cancel" @click="dialogVisible = false">取消</ElButton>
      <ElButton
        type="warning"
        class="pickup-btn-return"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中…' : '确认退库' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchMaterialReturn } from '@/api/recycle/material'
  import { fetchAllWarehouseLocations } from '@/api/recycle/warehouse'
  import type { MaterialItem } from '@/types/recycle/material'
  import type { WarehouseLocationOption } from '@/types/recycle/warehouse'

  interface Props {
    visible: boolean
    materialItem: MaterialItem | null
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const locationOptions = ref<WarehouseLocationOption[]>([])
  const loadingLocations = ref(false)
  const submitting = ref(false)

  const formData = reactive({
    location_id: undefined as number | undefined
  })

  const rules: FormRules = {
    location_id: [{ required: true, message: '请选择退库库位', trigger: 'change' }]
  }

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const previewReturnNo = computed(() => {
    const date = new Date()
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    return `TK${ymd}${String(Date.now()).slice(-4)}`
  })

  const locationPlaceholder = computed(() => {
    if (loadingLocations.value) return '加载库位中…'
    if (!locationOptions.value.length) return '暂无可用库位'
    return '请选择退库库位'
  })

  function isLocationFull(loc: WarehouseLocationOption): boolean {
    return loc.status === 1 && (loc.vehicle_count || 0) >= (loc.max_capacity || 1)
  }

  function getLocationLabel(loc: WarehouseLocationOption): string {
    const code = loc.location_no || '—'
    const suffix = isLocationFull(loc) ? '（已满）' : ''
    if (loc.area) return `${loc.area}-${code}${suffix}`
    return `${code}${suffix}`
  }

  async function loadAllLocations() {
    loadingLocations.value = true
    try {
      locationOptions.value = await fetchAllWarehouseLocations()
    } catch {
      locationOptions.value = []
    } finally {
      loadingLocations.value = false
    }
  }

  function resetForm() {
    formData.location_id = undefined
    locationOptions.value = []
    formRef.value?.clearValidate()
  }

  async function handleSubmit() {
    if (!props.materialItem?.id) return
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid || !formData.location_id) return

    submitting.value = true
    try {
      await fetchMaterialReturn({
        id: props.materialItem.id,
        location_id: formData.location_id
      })
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    resetForm()
  }

  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        resetForm()
        loadAllLocations()
      }
    }
  )
</script>

<style scoped lang="scss">
  .pickup-dialog-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .pickup-dialog-subtitle {
    margin-top: 2px;
    font-size: 12px;
    color: #9ca3af;
  }

  .pickup-return-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pickup-return-tip {
    padding: 12px;
    font-size: 14px;
    line-height: 1.5;
    color: #fa8c16;
    background: #fff7e6;
    border: 1px solid #ffd591;
    border-radius: 8px;
  }

  .pickup-return-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .pickup-return-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
  }

  .pickup-return-label {
    color: #6b7280;
  }

  .pickup-return-value {
    color: #111827;

    &.mono {
      font-size: 12px;
    }
  }

  .pickup-field-label {
    font-size: 12px;
    color: #4b5563;
  }

  .pickup-required {
    color: #ff4d4f;
  }

  .pickup-field-control {
    width: 100%;
  }

  .pickup-btn-cancel {
    height: 36px;
    padding: 0 16px;
    color: #4b5563;
    border: 1px solid #d1d5db;
    border-radius: 4px;
  }

  .pickup-btn-return {
    height: 36px;
    padding: 0 20px;
    background: #fa8c16;
    border-color: #fa8c16;
    border-radius: 4px;
  }
</style>

<style lang="scss">
  .pickup-return-dialog {
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
      border-top: 1px solid #e5e7eb;
    }
  }
</style>
