<template>
  <div class="ae-section-title">所有人代人代理实名认证（请完成一项实名认证）</div>
  <div class="ae-ocr-box">
    <div class="ae-auth-row">
      <span style="width: 72px; font-size: 12px; color: #9ca3af">所有人认证</span>
      <span style="flex: 1; font-weight: 500">
        {{ ownerForm.syr || (isPersonal ? '（请填写所有人姓名）' : '（请填写企业名称）') }}
      </span>
      <ElTag :type="ownerAuthed ? 'success' : 'warning'" size="small">
        {{ ownerAuthed ? '已认证' : '待认证' }}
      </ElTag>
      <ElButton size="small" type="primary" @click="openAuth('syr')"> 去认证 </ElButton>
    </div>
    <div class="ae-auth-meta">
      <span>证件号：{{ ownerForm.sfzmhm || '—' }}</span>
      <span>联系电话：{{ ownerForm.dh || '—' }}</span>
    </div>
    <div class="ae-auth-row">
      <span style="width: 72px; font-size: 12px; color: #9ca3af">代理人认证</span>
      <span style="flex: 1; font-weight: 500">{{ agentForm.jbr || '（请填写代理人姓名）' }}</span>
      <ElTag :type="agentAuthed ? 'success' : 'warning'" size="small">
        {{ agentAuthed ? '已认证' : '待认证' }}
      </ElTag>
      <ElButton size="small" type="primary" @click="openAuth('dlr')"> 去认证 </ElButton>
    </div>
    <div class="ae-auth-meta">
      <span>证件号：{{ agentForm.jbrsfzmhm || '—' }}</span>
      <span>联系电话：{{ agentForm.jbrdh || '—' }}</span>
    </div>
  </div>

  <ElDialog
    v-model="authVisible"
    width="680px"
    align-center
    append-to-body
    class="vehicle-auth-dialog"
    :show-close="false"
    @closed="handleAuthDialogClosed"
  >
    <template #header>
      <div class="auth-dialog-header">
        <div class="auth-dialog-header-main">
          <div class="auth-dialog-header-icon">
            <ArtSvgIcon icon="ri:shield-user-line" />
          </div>
          <div class="auth-dialog-header-text">
            <div class="auth-dialog-header-title">实名认证</div>
            <div class="auth-dialog-header-desc">{{ authTypeLabel }}：{{ authPersonName }}</div>
          </div>
        </div>
        <button type="button" class="auth-dialog-header-close" @click="authVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <div class="auth-dialog-body">
      <div class="auth-phone-field">
        <div class="auth-field-label">认证手机号</div>
        <ElInput
          v-model="authPhone"
          placeholder="请输入认证人手机号"
          maxlength="11"
          clearable
          class="auth-phone-input"
        />
      </div>

      <div class="auth-mode-grid">
        <div
          class="auth-mode-card"
          :class="{ 'is-active': authMode === 'sms' }"
          @click="authMode = 'sms'"
        >
          <div class="auth-mode-card-head">
            <div class="auth-mode-icon sms"><ArtSvgIcon icon="ri:message-3-line" /></div>
            <div class="auth-mode-title">短信认证</div>
            <span class="auth-mode-radio" :class="{ 'is-active': authMode === 'sms' }" />
          </div>
          <p class="auth-mode-desc">验证码将发送至上方手机号，按短信提示回复即可完成认证。</p>
          <div v-if="authMode === 'sms'" class="auth-mode-extra">
            <div v-if="authSmsCountdown > 0" class="auth-sms-hint">
              验证码已发送，{{ authSmsCountdown }} 秒后可重新发送。
            </div>
            <div v-else-if="authSending" class="auth-sms-hint">短信发送中...</div>
            <div v-else-if="authPhone" class="auth-sms-hint">
              即将发送认证短信到【{{ authPhone }}】。
            </div>
          </div>
        </div>

        <div
          class="auth-mode-card"
          :class="{ 'is-active': authMode === 'qr' }"
          @click="authMode = 'qr'"
        >
          <div class="auth-mode-card-head">
            <div class="auth-mode-icon qr"><ArtSvgIcon icon="ri:qr-scan-line" /></div>
            <div class="auth-mode-title">扫码认证</div>
            <span class="auth-mode-radio" :class="{ 'is-active': authMode === 'qr' }" />
          </div>
          <p class="auth-mode-desc">
            跳转至认证页面进行扫码认证，请打开支付宝 APP（推荐）或微信扫码。
          </p>
          <ol class="auth-qr-steps">
            <li><span class="auth-qr-step-no">1</span>进入认证页面</li>
            <li><span class="auth-qr-step-no">2</span>扫码认证完成后关闭本窗口即可</li>
          </ol>
          <ElButton
            v-if="authMode === 'qr'"
            type="primary"
            class="auth-qr-btn"
            :loading="authQrLoading"
            @click="handleAuthQrScan"
          >
            <ArtSvgIcon icon="ri:qr-scan-line" />
            去认证
          </ElButton>
        </div>
      </div>

      <div v-if="authMode === 'sms'" class="auth-dialog-alert">
        <ArtSvgIcon icon="ri:error-warning-line" class="auth-dialog-alert-icon" />
        <span>短信实名认证期间请勿更改姓名和身份证，以免实名认证无法通过！</span>
      </div>
    </div>

    <template #footer>
      <div class="auth-dialog-footer-tip">
        <ArtSvgIcon icon="ri:shield-check-line" />
        认证信息将与车辆档案绑定
      </div>
      <div class="auth-dialog-footer-actions">
        <ElButton @click="authVisible = false">取消</ElButton>
        <ElButton
          v-if="authMode === 'sms'"
          type="primary"
          :loading="authSending"
          :disabled="authSmsCountdown > 0"
          @click="handleAuthSendSms"
        >
          {{ authSmsCountdown > 0 ? `短信已发送(${authSmsCountdown})` : '发送认证短信' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchAcceptAuthSms } from '@/api/recycle/accept'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { ElMessage } from 'element-plus'
  import type { ArchiveAgentForm, ArchiveOwnerForm } from './types'
  import './authentication-step.scss'

  defineOptions({ name: 'VehicleArchiveAuthenticationStep' })

  const props = defineProps<{
    /** 受理记录 ID。 */
    cjid: string
    /** 是否已提交。 */
    isSubmitted: boolean
    /** 所有人表单。 */
    ownerForm: ArchiveOwnerForm
    /** 代理人表单。 */
    agentForm: ArchiveAgentForm
    /** 是否为个人所有人。 */
    isPersonal: boolean
    /** 是否只读。 */
    readonly: boolean
    /** 车信盟 Token 检测：无效时返回 false（登录框由父级弹出），认证请求前调用 */
    checkCxmToken?: () => Promise<boolean>
  }>()

  const emit = defineEmits<{
    /** 认证弹窗关闭后刷新状态。 */
    refreshed: []
  }>()

  const ownerAuthed = computed(() => props.ownerForm.syrsmrz === '1')
  const agentAuthed = computed(() => props.agentForm.jbrsmrz === '1')

  const authVisible = ref(false)
  const authType = ref<'syr' | 'dlr'>('syr')
  const authMode = ref<'sms' | 'qr'>('sms')
  const authPhone = ref('')
  const authSending = ref(false)
  const authSmsCountdown = ref(0)
  const authQrLoading = ref(false)
  let authSmsTimer: ReturnType<typeof setInterval> | null = null

  const authPersonName = computed(() =>
    authType.value === 'syr' ? props.ownerForm.syr || '—' : props.agentForm.jbr || '—'
  )
  const authTypeLabel = computed(() => (authType.value === 'syr' ? '所有人' : '代理人'))

  function openAuth(type: 'syr' | 'dlr') {
    const person = type === 'syr' ? props.ownerForm.syr : props.agentForm.jbr
    if (!person) {
      ElMessage.warning('请先填写认证人信息')
      return
    }
    authType.value = type
    authPhone.value = type === 'syr' ? props.ownerForm.dh : props.agentForm.jbrdh
    authMode.value = 'sms'
    authSmsCountdown.value = 0
    authVisible.value = true
  }

  function handleAuthDialogClosed() {
    if (authSmsTimer) {
      clearInterval(authSmsTimer)
      authSmsTimer = null
    }
    authSmsCountdown.value = 0
    emit('refreshed')
  }

  async function handleAuthSendSms() {
    if (!authPhone.value.trim()) {
      ElMessage.warning('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(authPhone.value)) {
      ElMessage.warning('手机号格式不正确')
      return
    }
    if (!props.cjid) {
      ElMessage.warning('受理记录初始化中，请稍后重试')
      return
    }
    // 车信盟 Token 无效时弹出登录框，中止本次认证
    if (props.checkCxmToken && !(await props.checkCxmToken())) return
    authSending.value = true
    try {
      await fetchAcceptAuthSms({
        cjid: props.cjid,
        tel: authPhone.value,
        type: authType.value,
        verifyType: 'sms'
      })
      authSmsCountdown.value = 30
      if (authSmsTimer) clearInterval(authSmsTimer)
      authSmsTimer = setInterval(() => {
        authSmsCountdown.value -= 1
        if (authSmsCountdown.value <= 0 && authSmsTimer) {
          clearInterval(authSmsTimer)
          authSmsTimer = null
        }
      }, 1000)
    } finally {
      authSending.value = false
    }
  }

  async function handleAuthQrScan() {
    if (!authPhone.value.trim()) {
      ElMessage.warning('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(authPhone.value)) {
      ElMessage.warning('手机号格式不正确')
      return
    }
    if (!props.cjid) {
      ElMessage.warning('受理记录初始化中，请稍后重试')
      return
    }
    // 车信盟 Token 无效时弹出登录框，中止本次认证
    if (props.checkCxmToken && !(await props.checkCxmToken())) return
    authQrLoading.value = true
    try {
      const res = (await fetchAcceptAuthSms({
        cjid: props.cjid,
        tel: authPhone.value,
        type: authType.value,
        verifyType: 'scan'
      })) as Record<string, unknown>
      const result = res?.result
      let url = ''
      if (typeof result === 'string' && result.startsWith('http')) url = result
      else if (result && typeof result === 'object') {
        const r = result as Record<string, string>
        url = r.url || r.authorizeUrl || r.redirectUrl || r.link || r.scanUrl || r.qrUrl || ''
      }
      if (!url) {
        url = String(
          res.url || res.authorizeUrl || res.redirectUrl || res.link || res.scanUrl || ''
        )
      }
      if (url) window.open(url, '_blank')
      else ElMessage.warning('未获取到扫码认证链接')
    } finally {
      authQrLoading.value = false
    }
  }
</script>
