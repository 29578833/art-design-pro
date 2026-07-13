<template>
  <ElDialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑仓库' : '新增入库仓库'"
    width="480px"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="仓库名称" prop="name">
        <ElInput v-model="form.name" placeholder="如：原料仓A区" maxlength="50" />
      </ElFormItem>
      <div class="loc-area-form-row">
        <ElFormItem label="仓库编码" prop="tag" class="loc-area-form-half">
          <ElInput v-model="form.tag" placeholder="如：A" maxlength="4" />
          <div class="loc-area-form-hint">库位格式将为：编码区-01、02…</div>
        </ElFormItem>
        <ElFormItem label="库位容量（个）" prop="total" class="loc-area-form-half">
          <ElInputNumber
            v-model="form.total"
            :min="1"
            :max="9999"
            controls-position="right"
            class="w-full"
          />
        </ElFormItem>
      </div>
      <ElFormItem label="备注说明" prop="remark">
        <ElInput v-model="form.remark" placeholder="仓库用途说明（选填）" maxlength="200" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">
        {{ isEdit ? '保存' : '保存仓库' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    fetchWarehouseAreaSave,
    fetchWarehouseAreaUpdate
  } from '@/api/recycle/warehouse-location'
  import type {
    WarehouseAreaOverviewItem,
    WarehouseAreaSaveParams
  } from '@/types/recycle/warehouse-location'

  interface Props {
    visible: boolean
    record?: WarehouseAreaOverviewItem | null
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

  const isEdit = computed(() => !!props.record?.id)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const form = reactive<WarehouseAreaSaveParams>({
    name: '',
    tag: '',
    total: 10,
    remark: ''
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入仓库名称', trigger: 'blur' }],
    tag: [{ required: true, message: '请输入仓库编码', trigger: 'blur' }]
  }

  function resetForm() {
    form.name = ''
    form.tag = ''
    form.total = 10
    form.remark = ''
  }

  function fillForm(record: WarehouseAreaOverviewItem) {
    form.name = record.name || ''
    form.tag = record.tag || ''
    form.total = record.total || 10
    form.remark = record.remark || ''
  }

  watch(
    () => [props.visible, props.record] as const,
    ([visible, record]) => {
      if (!visible) return
      if (record?.id) fillForm(record)
      else resetForm()
    }
  )

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
      const payload: WarehouseAreaSaveParams = {
        name: form.name.trim(),
        tag: (form.tag || '').trim().toUpperCase(),
        total: form.total || 10,
        remark: form.remark?.trim() || ''
      }
      if (isEdit.value && props.record?.id) {
        await fetchWarehouseAreaUpdate(props.record.id, payload)
      } else {
        await fetchWarehouseAreaSave(payload)
      }
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
  .loc-area-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .loc-area-form-half {
    margin-bottom: 18px;
  }

  .loc-area-form-hint {
    margin-top: 4px;
    font-size: 12px;
    color: #9ca3af;
  }

  .w-full {
    width: 100%;
  }
</style>
