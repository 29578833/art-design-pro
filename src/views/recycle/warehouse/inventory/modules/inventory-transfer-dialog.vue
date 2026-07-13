<template>
  <ElDialog
    v-model="dialogVisible"
    title="库位调拨"
    width="440px"
    align-center
    destroy-on-close
    @open="loadLocations"
    @closed="handleClosed"
  >
    <div v-if="record" class="inv-transfer-info">
      <div class="inv-transfer-name">{{ record.item_name || '—' }}</div>
      <div class="inv-transfer-meta">
        当前库位：{{ record.location || '—' }} · 编号：{{
          record.item_no || record.storage_no || '—'
        }}
      </div>
    </div>

    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="目标库位" prop="target_location">
        <ElSelect
          v-model="form.target_location"
          filterable
          allow-create
          default-first-option
          :loading="loadingLocations"
          placeholder="请选择或输入目标库位"
          class="w-full"
        >
          <ElOption
            v-for="loc in locationOptions"
            :key="loc.id"
            :label="getLocationLabel(loc)"
            :value="loc.location_no || ''"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="调拨原因" prop="reason">
        <ElInput
          v-model="form.reason"
          type="textarea"
          :rows="3"
          placeholder="请输入调拨原因（选填）"
          maxlength="200"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认调拨</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchInventoryTransfer } from '@/api/recycle/inventory-item'
  import { fetchAllWarehouseLocations } from '@/api/recycle/warehouse'
  import type { InventoryItem } from '@/types/recycle/inventory-item'
  import type { WarehouseLocationOption } from '@/types/recycle/warehouse'

  interface Props {
    visible: boolean
    record?: InventoryItem | null
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

  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const loadingLocations = ref(false)
  const locationOptions = ref<WarehouseLocationOption[]>([])
  const form = reactive({
    target_location: '',
    reason: ''
  })

  const rules: FormRules = {
    target_location: [{ required: true, message: '请选择目标库位', trigger: 'change' }]
  }

  function getLocationLabel(loc: WarehouseLocationOption) {
    const code = loc.location_no || '—'
    if (loc.area) return `${loc.area}-${code}`
    return code
  }

  async function loadLocations() {
    loadingLocations.value = true
    try {
      locationOptions.value = (await fetchAllWarehouseLocations()) || []
    } catch {
      locationOptions.value = []
    } finally {
      loadingLocations.value = false
    }
  }

  async function handleSubmit() {
    if (!props.record?.id) return
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
      await fetchInventoryTransfer({
        item_id: props.record.id,
        target_location: form.target_location.trim(),
        reason: form.reason.trim() || undefined
      })
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    form.target_location = ''
    form.reason = ''
    formRef.value?.resetFields()
  }
</script>

<style scoped lang="scss">
  .inv-transfer-info {
    padding: 12px;
    margin-bottom: 16px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .inv-transfer-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .inv-transfer-meta {
    margin-top: 4px;
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .w-full {
    width: 100%;
  }
</style>
