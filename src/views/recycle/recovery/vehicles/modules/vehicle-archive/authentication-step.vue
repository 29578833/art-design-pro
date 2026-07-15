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
      <ElButton size="small" type="primary" :disabled="readonly" @click="openAuth('syr')">
        去认证
      </ElButton>
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
      <ElButton size="small" type="primary" :disabled="readonly" @click="openAuth('dlr')">
        去认证
      </ElButton>
    </div>
    <div class="ae-auth-meta">
      <span>证件号：{{ agentForm.jbrsfzmhm || '—' }}</span>
      <span>联系电话：{{ agentForm.jbrdh || '—' }}</span>
    </div>
  </div>

  <ElDialog
    v-model="authVisible"
    title="实名认证"
    width="720px"
    align-center
    append-to-body
    @closed="handleAuthDialogClosed"
  >
    <div style="margin-bottom: 16px; font-size: 14px">
      认证人：
      <b>{{ authPersonName }}</b>
    </div>
    <ElRow :gutter="40">
      <ElCol :span="12">
        <ElCheckbox v-model="authSmsChecked" @change="onAuthSmsModeChange">短信认证</ElCheckbox>
        <ElInput
          v-model="authPhone"
          placeholder="请输入手机号"
          maxlength="11"
          clearable
          style="margin-top: 12px"
        />
        <div v-if="authPhone && !authSending && authSmsCountdown <= 0" class="ae-auth-hint">
          即将发送认证短信到【{{ authPhone }}】。
        </div>
        <div v-if="authSmsCountdown > 0" class="ae-auth-hint">
          验证码已发送，{{ authSmsCountdown }}秒后可重新发送。
        </div>
        <div v-if="authSending" class="ae-auth-hint">短信发送中...</div>
      </ElCol>
      <ElCol :span="12">
        <ElCheckbox v-model="authQrChecked" @change="onAuthQrModeChange">扫码认证</ElCheckbox>
        <ol class="ae-auth-qr-steps">
          <li>将跳转至认证页面进行扫码认证，请打开支付宝 APP（推荐）或微信扫码功能。</li>
          <li>扫码认证完成后关闭本窗口即可。</li>
        </ol>
        <ElButton
          v-if="authQrChecked"
          type="primary"
          size="small"
          :loading="authQrLoading"
          style="width: 100%; margin-top: 16px"
          @click="handleAuthQrScan"
        >
          去认证
        </ElButton>
      </ElCol>
    </ElRow>
    <ElAlert
      type="error"
      :closable="false"
      show-icon
      title="短信实名认证期间请勿更改姓名和身份证，以免实名认证无法通过！"
      style="margin-top: 12px"
    />
    <template #footer>
      <ElButton @click="authVisible = false">取消</ElButton>
      <ElButton
        v-if="authSmsChecked"
        type="primary"
        :loading="authSending"
        :disabled="authSmsCountdown > 0"
        @click="handleAuthSendSms"
      >
        {{ authSmsCountdown > 0 ? `短信已发送(${authSmsCountdown})` : '发送认证短信' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchAcceptAuthSms } from '@/api/recycle/accept'
  import { ElMessage } from 'element-plus'
  import type { ArchiveAgentForm, ArchiveOwnerForm } from './types'

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
  }>()

  const emit = defineEmits<{
    /** 认证弹窗关闭后刷新状态。 */
    refreshed: []
  }>()

  const ownerAuthed = computed(() => props.ownerForm.syrsmrz === '1')
  const agentAuthed = computed(() => props.agentForm.jbrsmrz === '1')

  const authVisible = ref(false)
  const authType = ref<'syr' | 'dlr'>('syr')
  const authPhone = ref('')
  const authSending = ref(false)
  const authSmsChecked = ref(true)
  const authQrChecked = ref(false)
  const authSmsCountdown = ref(0)
  const authQrLoading = ref(false)
  let authSmsTimer: ReturnType<typeof setInterval> | null = null

  const authPersonName = computed(() =>
    authType.value === 'syr' ? props.ownerForm.syr || '—' : props.agentForm.jbr || '—'
  )

  function openAuth(type: 'syr' | 'dlr') {
    if (props.isSubmitted) return
    const person = type === 'syr' ? props.ownerForm.syr : props.agentForm.jbr
    if (!person) {
      ElMessage.warning('请先填写认证人信息')
      return
    }
    authType.value = type
    authPhone.value = type === 'syr' ? props.ownerForm.dh : props.agentForm.jbrdh
    authSmsChecked.value = true
    authQrChecked.value = false
    authSmsCountdown.value = 0
    authVisible.value = true
  }

  function onAuthSmsModeChange(val: unknown) {
    if (val) authQrChecked.value = false
    else authQrChecked.value = true
  }

  function onAuthQrModeChange(val: unknown) {
    if (val) authSmsChecked.value = false
    else authSmsChecked.value = true
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
