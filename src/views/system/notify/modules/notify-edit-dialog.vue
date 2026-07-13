<template>
  <ElDialog
    v-model="dialogVisible"
    title="配置站内通知"
    width="560px"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <div v-loading="loading">
      <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
        <ElFormItem label="通知名称" prop="name">
          <ElInput v-model="form.name" maxlength="50" />
        </ElFormItem>
        <ElFormItem label="站内信标题" prop="system_title">
          <ElInput v-model="form.system_title" maxlength="100" placeholder="推送标题" />
        </ElFormItem>
        <ElFormItem label="站内信内容" prop="system_text">
          <ElInput
            v-model="form.system_text"
            type="textarea"
            :rows="5"
            maxlength="500"
            placeholder="推送正文，可使用模板变量"
          />
        </ElFormItem>
        <ElFormItem label="站内通知">
          <ElSwitch v-model="systemEnabled" />
        </ElFormItem>
      </ElForm>
    </div>
    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchNotificationInfo, fetchNotificationSave } from '@/api/recycle/system-notification'

  interface Props {
    visible: boolean
    notifyId: number | null
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
  const loading = ref(false)
  const submitting = ref(false)
  const form = reactive({
    id: 0,
    name: '',
    title: '',
    system_title: '',
    system_text: '',
    is_system: 0,
    is_app: 0
  })

  const systemEnabled = computed({
    get: () => Number(form.is_system) === 1,
    set: (val: boolean) => {
      form.is_system = val ? 1 : 0
    }
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请填写通知名称', trigger: 'blur' }]
  }

  watch(
    () => props.visible,
    async (val) => {
      if (!val || !props.notifyId) return
      loading.value = true
      try {
        const info = await fetchNotificationInfo(props.notifyId, 'is_system')
        form.id = Number(info.id || props.notifyId)
        form.name = info.name || ''
        form.title = info.title || info.name || ''
        form.system_title = info.system_title || ''
        form.system_text = info.system_text || info.content || ''
        form.is_system = Number(info.is_system ?? 0)
        form.is_app = Number(info.is_app ?? 0)
      } finally {
        loading.value = false
      }
    }
  )

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    submitting.value = true
    try {
      await fetchNotificationSave({
        id: form.id,
        type: 'is_system',
        name: form.name.trim(),
        title: form.title.trim() || form.name.trim(),
        is_system: form.is_system,
        is_app: form.is_app,
        system_title: form.system_title.trim(),
        system_text: form.system_text.trim()
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
