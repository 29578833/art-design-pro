<template>
  <ElDialog
    v-model="dialogVisible"
    title="新增角色"
    width="420px"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="角色名称" prop="role_name">
        <ElInput v-model="form.role_name" placeholder="请输入角色名称" maxlength="50" />
      </ElFormItem>
      <ElFormItem label="角色描述" prop="role_desc">
        <ElInput
          v-model="form.role_desc"
          type="textarea"
          :rows="2"
          placeholder="选填"
          maxlength="200"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">创建</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchSystemRoleSave } from '@/api/recycle/system-role'

  interface Props {
    visible: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success', roleId?: number): void
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
    role_name: '',
    role_desc: ''
  })

  const rules: FormRules = {
    role_name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
  }

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    submitting.value = true
    try {
      await fetchSystemRoleSave(0, {
        role_name: form.role_name.trim(),
        role_desc: form.role_desc.trim(),
        status: 1,
        checked_menus: [],
        mini_program_roles: []
      })
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    form.role_name = ''
    form.role_desc = ''
    formRef.value?.resetFields()
  }
</script>
