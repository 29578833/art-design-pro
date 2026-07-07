<!-- ERP 管理后台登录页 -->
<template>
  <div class="erp-login-page">
    <div class="erp-login-container">
      <!-- 左侧品牌区 -->
      <div class="erp-login-brand">
        <div class="erp-login-brand-logo">
          <div class="erp-login-brand-icon">
            <ArtSvgIcon icon="ri:computer-line" class="text-2xl" />
          </div>
          <div>
            <div class="erp-login-brand-title">ERP管理后台</div>
            <div class="erp-login-brand-subtitle">Enterprise Resource Planning</div>
          </div>
        </div>

        <h2 class="erp-login-brand-heading"> 智能回收<br />企业管理系统 </h2>
        <p class="erp-login-brand-desc"> 全流程数字化管理，覆盖拆解、注销、结算等业务模块 </p>

        <div class="space-y-3">
          <div v-for="item in features" :key="item" class="erp-login-feature">
            <div class="erp-login-feature-dot">
              <div class="erp-login-feature-dot-inner" />
            </div>
            {{ item }}
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="erp-login-card">
        <div class="erp-login-card-header">
          <div class="erp-login-card-icon">
            <ArtSvgIcon icon="ri:computer-line" class="text-3xl" />
          </div>
          <div class="erp-login-card-title">管理员登录</div>
          <div class="erp-login-card-subtitle">ERP 企业管理后台</div>
        </div>

        <ElForm ref="formRef" :model="formData" :rules="rules" @keyup.enter="handleSubmit">
          <ElFormItem prop="account">
            <label class="erp-login-form-label">账号</label>
            <ElInput
              v-model.trim="formData.account"
              class="erp-login-input"
              placeholder="请输入账号"
              autofocus
            >
              <template #prefix>
                <ArtSvgIcon icon="ri:user-3-line" class="text-gray-400" />
              </template>
            </ElInput>
          </ElFormItem>

          <ElFormItem prop="pwd">
            <div class="erp-login-form-label-row">
              <label class="erp-login-form-label !mb-0">密码</label>
              <RouterLink class="erp-login-forgot-link" :to="{ name: 'ForgetPassword' }">
                忘记密码？
              </RouterLink>
            </div>
            <ElInput
              v-model.trim="formData.pwd"
              class="erp-login-input"
              type="password"
              placeholder="请输入密码"
              autocomplete="off"
              show-password
            >
              <template #prefix>
                <ArtSvgIcon icon="ri:lock-line" class="text-gray-400" />
              </template>
            </ElInput>
          </ElFormItem>

          <ElFormItem class="!mb-0">
            <ElButton class="erp-login-btn" type="primary" :loading="loading" @click="handleSubmit">
              登录
              <ArtSvgIcon icon="ri:arrow-right-line" class="ml-1" />
            </ElButton>
          </ElFormItem>
        </ElForm>
      </div>
    </div>

    <div class="erp-login-footer"> © 2026 鑫广智能回收 · ERP v1.0.0 </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import { useUserStore } from '@/store/modules/user'
  import { useI18n } from 'vue-i18n'
  import { HttpError } from '@/utils/http/error'
  import { fetchLogin } from '@/api/auth'
  import { resetRouterState } from '@/router/guards/beforeEach'
  import { ElNotification, type FormInstance, type FormRules } from 'element-plus'

  defineOptions({ name: 'Login' })

  const { t } = useI18n()
  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()

  const features = ['数据看板实时监控', '智能流程管理', '多模块集成管理']

  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const systemName = AppConfig.systemInfo.name

  const formData = reactive({
    account: 'admin',
    pwd: '123456'
  })

  const rules: FormRules = {
    account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
    pwd: [{ required: true, message: '请输入密码', trigger: 'blur' }]
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      const valid = await formRef.value.validate()
      if (!valid) return

      loading.value = true

      const loginResult = await fetchLogin({
        account: formData.account,
        pwd: formData.pwd
      })

      if (!loginResult.token) {
        throw new Error('Login failed - no token received')
      }

      userStore.setLoginResult(loginResult)
      userStore.checkAndClearWorktabs()
      // 重置动态路由，使新账号菜单权限重新注册
      resetRouterState(0)
      showLoginSuccessNotice()

      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    } catch (error) {
      if (!(error instanceof HttpError)) {
        console.error('[Login] Unexpected error:', error)
      }
    } finally {
      loading.value = false
    }
  }

  const showLoginSuccessNotice = () => {
    setTimeout(() => {
      ElNotification({
        title: t('login.success.title'),
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `${t('login.success.message')}, ${systemName}!`
      })
    }, 500)
  }
</script>

<style scoped>
  @import './style.css';
</style>
