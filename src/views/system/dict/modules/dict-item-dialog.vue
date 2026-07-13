<template>
  <ElDialog
    v-model="dialogVisible"
    title="编辑字典项"
    width="420px"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="显示名称" prop="dict_label">
        <ElInput v-model="form.dict_label" placeholder="显示名称" maxlength="100" />
      </ElFormItem>
      <ElFormItem label="字典值" prop="dict_value">
        <ElInput v-model="form.dict_value" placeholder="字典值" maxlength="100" />
      </ElFormItem>
      <ElFormItem label="排序" prop="sort">
        <ElInputNumber v-model="form.sort" :min="0" controls-position="right" />
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElSwitch v-model="form.status" :active-value="1" :inactive-value="0" />
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
  import { fetchDataDictUpdate } from '@/api/recycle/data-dict'
  import type { DataDictItem } from '@/types/recycle/system'

  interface Props {
    visible: boolean
    record?: DataDictItem | null
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

  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const form = reactive({
    dict_label: '',
    dict_value: '',
    sort: 0,
    status: 1 as 0 | 1
  })

  const rules: FormRules = {
    dict_label: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
    dict_value: [{ required: true, message: '请输入字典值', trigger: 'blur' }]
  }

  watch(
    () => props.visible,
    (val) => {
      if (!val) return
      const row = props.record
      form.dict_label = row?.dict_label || ''
      form.dict_value = row?.dict_value || ''
      form.sort = Number(row?.sort || 0)
      form.status = Number(row?.status ?? 1) as 0 | 1
    }
  )

  async function handleSubmit() {
    if (!props.record?.id) return
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    submitting.value = true
    try {
      await fetchDataDictUpdate(props.record.id, {
        dict_type: props.record.dict_type || '',
        dict_label: form.dict_label.trim(),
        dict_value: form.dict_value.trim(),
        sort: form.sort,
        status: form.status,
        remark: props.record.remark || ''
      })
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
