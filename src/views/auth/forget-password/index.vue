<!-- ERP 找回密码页 -->
<template>
  <div class="erp-forgot-page">
    <button class="erp-forgot-back" @click="toLogin">
      <ArtSvgIcon icon="ri:arrow-left-s-line" />
      返回登录
    </button>

    <div class="erp-forgot-card">
      <!-- 标题 -->
      <div class="erp-forgot-header">
        <div class="erp-forgot-header-icon">
          <ArtSvgIcon icon="ri:lock-line" class="text-xl" />
        </div>
        <div>
          <div class="erp-forgot-header-title">找回密码</div>
          <div class="erp-forgot-header-subtitle">ERP 管理后台</div>
        </div>
      </div>

      <!-- 步骤条 -->
      <div class="erp-forgot-steps">
        <template v-for="(s, i) in steps" :key="s.key">
          <div
            v-if="i > 0"
            class="erp-forgot-step-line"
            :class="i <= stepIdx ? 'done' : 'pending'"
          />
          <div class="erp-forgot-step">
            <div
              class="erp-forgot-step-circle"
              :class="i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending'"
            >
              {{ i < stepIdx ? '✓' : i + 1 }}
            </div>
            <span
              class="erp-forgot-step-label"
              :class="i <= stepIdx ? (i < stepIdx ? 'done' : 'active') : 'pending'"
            >
              {{ s.label }}
            </span>
          </div>
        </template>
      </div>

      <!-- 步骤1：验证身份 -->
      <div v-if="step === 'account'" class="space-y-5">
        <div>
          <label class="erp-forgot-form-label">账号</label>
          <ElInput v-model.trim="account" class="erp-forgot-input" placeholder="请输入账号">
            <template #prefix>
              <ArtSvgIcon icon="ri:user-3-line" class="text-gray-400" />
            </template>
          </ElInput>
        </div>
        <div>
          <label class="erp-forgot-form-label">注册手机号</label>
          <ElInput v-model.trim="phone" class="erp-forgot-input" placeholder="请输入注册手机号">
            <template #prefix>
              <ArtSvgIcon icon="ri:phone-line" class="text-gray-400" />
            </template>
          </ElInput>
        </div>
        <div>
          <label class="erp-forgot-form-label">短信验证码</label>
          <div class="flex gap-2">
            <ElInput
              v-model.trim="code"
              class="erp-forgot-input flex-1"
              placeholder="请输入验证码"
            />
            <ElButton class="erp-forgot-code-btn" :disabled="countdown > 0" @click="sendCode">
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </ElButton>
          </div>
        </div>
        <div v-if="error" class="erp-forgot-error">{{ error }}</div>
        <ElButton class="erp-forgot-submit-btn" type="primary" @click="handleVerify">
          下一步
          <ArtSvgIcon icon="ri:arrow-right-line" class="ml-1" />
        </ElButton>
      </div>

      <!-- 步骤2：设置新密码 -->
      <div v-else-if="step === 'newpwd'" class="space-y-5">
        <div>
          <label class="erp-forgot-form-label">新密码</label>
          <ElInput
            v-model.trim="newPwd"
            class="erp-forgot-input"
            type="password"
            placeholder="请输入新密码（6位以上）"
            show-password
          >
            <template #prefix>
              <ArtSvgIcon icon="ri:lock-line" class="text-gray-400" />
            </template>
          </ElInput>
        </div>
        <div>
          <label class="erp-forgot-form-label">确认新密码</label>
          <ElInput
            v-model.trim="confirmPwd"
            class="erp-forgot-input"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          >
            <template #prefix>
              <ArtSvgIcon icon="ri:lock-line" class="text-gray-400" />
            </template>
          </ElInput>
        </div>
        <div v-if="error" class="erp-forgot-error">{{ error }}</div>
        <ElButton class="erp-forgot-submit-btn" type="primary" @click="handleReset">
          确认修改
          <ArtSvgIcon icon="ri:arrow-right-line" class="ml-1" />
        </ElButton>
      </div>

      <!-- 步骤3：完成 -->
      <div v-else class="erp-forgot-done">
        <div class="erp-forgot-done-icon">
          <ArtSvgIcon icon="ri:checkbox-circle-line" class="text-4xl text-green-500" />
        </div>
        <div class="erp-forgot-done-title">密码修改成功</div>
        <div class="erp-forgot-done-desc">请使用新密码重新登录管理后台</div>
        <ElButton class="erp-forgot-submit-btn" type="primary" @click="toLogin">
          返回登录
        </ElButton>
      </div>
    </div>

    <div class="erp-forgot-footer"> © 2026 鑫广智能回收 · ERP v1.0.0 </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ForgetPassword' })

  type ForgotStep = 'account' | 'newpwd' | 'done'

  const router = useRouter()

  const step = ref<ForgotStep>('account')
  const account = ref('')
  const phone = ref('')
  const code = ref('')
  const countdown = ref(0)
  const newPwd = ref('')
  const confirmPwd = ref('')
  const error = ref('')

  const steps = [
    { key: 'account', label: '验证身份' },
    { key: 'newpwd', label: '设置新密码' },
    { key: 'done', label: '完成' }
  ]

  const stepIdx = computed(() => steps.findIndex((s) => s.key === step.value))

  let countdownTimer: ReturnType<typeof setInterval> | null = null

  const sendCode = () => {
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0 && countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  }

  const handleVerify = () => {
    if (!account.value || !phone.value || !code.value) {
      error.value = '请填写账号、手机号及验证码'
      return
    }
    error.value = ''
    step.value = 'newpwd'
  }

  const handleReset = () => {
    if (!newPwd.value || !confirmPwd.value) {
      error.value = '请填写新密码'
      return
    }
    if (newPwd.value !== confirmPwd.value) {
      error.value = '两次密码不一致'
      return
    }
    if (newPwd.value.length < 6) {
      error.value = '密码不能少于6位'
      return
    }
    error.value = ''
    step.value = 'done'
  }

  const toLogin = () => {
    router.push({ name: 'Login' })
  }

  onUnmounted(() => {
    if (countdownTimer) clearInterval(countdownTimer)
  })
</script>

<style scoped>
  @import './style.css';
</style>
