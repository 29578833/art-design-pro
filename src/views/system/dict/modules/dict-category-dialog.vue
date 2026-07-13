<template>
  <ElDialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑分类' : '新增分类'"
    width="420px"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="字典名称" prop="name">
        <ElInput v-model="form.name" placeholder="如：车辆类型" maxlength="50" />
      </ElFormItem>
      <ElFormItem label="字典标识" prop="mark">
        <ElInput
          v-model="form.mark"
          placeholder="如：VEHICLE_TYPE"
          maxlength="50"
          :disabled="isEdit"
        />
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElRadioGroup v-model="form.status">
          <ElRadio :value="1">显示</ElRadio>
          <ElRadio :value="0">隐藏</ElRadio>
        </ElRadioGroup>
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
  import { fetchDataDictCategorySave } from '@/api/recycle/data-dict'
  import type { DataDictCategory } from '@/types/recycle/system'

  interface Props {
    visible: boolean
    record?: DataDictCategory | null
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
    name: '',
    mark: '',
    level: 0,
    status: 1
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
    mark: [{ required: true, message: '请输入字典标识', trigger: 'blur' }]
  }

  watch(
    () => props.visible,
    (val) => {
      if (!val) return
      const row = props.record
      form.name = row?.name || ''
      form.mark = row?.mark || ''
      form.level = Number(row?.level ?? 0)
      form.status = Number(row?.status ?? 1)
    }
  )

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    submitting.value = true
    try {
      await fetchDataDictCategorySave(isEdit.value ? Number(props.record!.id) : 0, {
        name: form.name.trim(),
        mark: form.mark.trim(),
        level: form.level,
        status: form.status
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
