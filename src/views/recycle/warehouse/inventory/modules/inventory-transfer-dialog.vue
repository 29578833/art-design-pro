<template>
  <ElDialog
    v-model="dialogVisible"
    title="库位调拨"
    width="440px"
    align-center
    destroy-on-close
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
        <ElInput
          v-model="form.target_location"
          placeholder="请输入目标库位"
          clearable
          class="w-full"
        />
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
  import type { InventoryItem } from '@/types/recycle/warehouse/inventory/inventory-item'

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
  const form = reactive({
    target_location: '',
    reason: ''
  })

  const rules: FormRules = {
    target_location: [{ required: true, message: '请输入目标库位', trigger: 'blur' }]
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
