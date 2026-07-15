<template>
  <ElDialog
    v-model="dialogVisible"
    title="车信盟账号登录"
    width="420px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
      <ElFormItem label="手机号" prop="mobile">
        <ElInput v-model="form.mobile" placeholder="请输入手机号" maxlength="11" clearable />
      </ElFormItem>
      <ElFormItem label="验证码" prop="captcha">
        <div class="cxm-login-captcha">
          <ElInput v-model="form.captcha" placeholder="请输入验证码" clearable />
          <ElButton
            type="primary"
            :loading="smsSending"
            :disabled="smsCountdown > 0"
            @click="handleSendSms"
          >
            {{ smsCountdown > 0 ? `${smsCountdown}s 后重发` : '获取验证码' }}
          </ElButton>
        </div>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="loginLoading" @click="handleLogin">登录</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchAcceptPhoneLogin, fetchAcceptSendSms } from '@/api/recycle/accept'
  import { CXM_PUBLIC_KEY } from '@/constants/cxm'
  import { sm2 } from 'sm-crypto'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'CxmLoginDialog' })

  const props = defineProps<{ visible: boolean }>()
  const emit = defineEmits<{
    'update:visible': [boolean]
    success: []
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const formRef = ref<FormInstance>()
  const form = reactive({ mobile: '', captcha: '' })
  const rules: FormRules = {
    mobile: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }
    ],
    captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
  }

  const smsSending = ref(false)
  const loginLoading = ref(false)
  const smsCountdown = ref(0)
  let smsTimer: ReturnType<typeof setInterval> | null = null

  function clearSmsTimer() {
    if (smsTimer) {
      clearInterval(smsTimer)
      smsTimer = null
    }
    smsCountdown.value = 0
  }

  function startSmsCountdown() {
    clearSmsTimer()
    smsCountdown.value = 60
    smsTimer = setInterval(() => {
      smsCountdown.value -= 1
      if (smsCountdown.value <= 0) clearSmsTimer()
    }, 1000)
  }

  async function handleSendSms() {
    const valid = await formRef.value?.validateField('mobile').catch(() => false)
    if (!valid) return
    smsSending.value = true
    try {
      await fetchAcceptSendSms({ mobile: form.mobile })
      startSmsCountdown()
    } finally {
      smsSending.value = false
    }
  }

  async function handleLogin() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    loginLoading.value = true
    try {
      await fetchAcceptPhoneLogin({
        mobile: sm2.doEncrypt(form.mobile, CXM_PUBLIC_KEY, 1),
        captcha: sm2.doEncrypt(form.captcha, CXM_PUBLIC_KEY, 1)
      })
      dialogVisible.value = false
      emit('success')
    } finally {
      loginLoading.value = false
    }
  }

  function handleClosed() {
    form.mobile = ''
    form.captcha = ''
    loginLoading.value = false
    clearSmsTimer()
    formRef.value?.resetFields()
  }

  onBeforeUnmount(() => clearSmsTimer())
</script>

<style scoped lang="scss">
  .cxm-login-captcha {
    display: flex;
    gap: 10px;
    width: 100%;

    .el-input {
      flex: 1;
    }

    .el-button {
      flex-shrink: 0;
      width: 120px;
    }
  }
</style>
