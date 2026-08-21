<template>
  <ElDialog
    v-model="dialogVisible"
    title="设置密码"
    width="400px"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="新密码" prop="pwd">
        <ElInput v-model="form.pwd" type="password" show-password placeholder="6-32位" />
      </ElFormItem>
      <ElFormItem label="确认密码" prop="conf_pwd">
        <ElInput v-model="form.conf_pwd" type="password" show-password placeholder="再次输入" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认设置</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchPartnerResetPassword } from '@/api/recycle/customer'

  interface Props {
    visible: boolean
    userId?: string | number | null
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
  const form = reactive({ pwd: '', conf_pwd: '' })

  const rules: FormRules = {
    pwd: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, max: 32, message: '密码长度 6-32 位', trigger: 'blur' }
    ],
    conf_pwd: [
      { required: true, message: '请确认密码', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          if (value !== form.pwd) callback(new Error('两次密码不一致'))
          else callback()
        },
        trigger: 'blur'
      }
    ]
  }

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid || props.userId === undefined || props.userId === null || props.userId === '') return
    submitting.value = true
    try {
      await fetchPartnerResetPassword(props.userId, {
        pwd: form.pwd,
        conf_pwd: form.conf_pwd
      })
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    form.pwd = ''
    form.conf_pwd = ''
    formRef.value?.resetFields()
  }
</script>
