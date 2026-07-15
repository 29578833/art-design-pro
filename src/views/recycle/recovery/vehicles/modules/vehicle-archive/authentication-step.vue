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
      <ElButton
        size="small"
        type="primary"
        :disabled="readonly"
        @click="emit('authenticate', 'syr')"
      >
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
      <ElButton
        size="small"
        type="primary"
        :disabled="readonly"
        @click="emit('authenticate', 'dlr')"
      >
        去认证
      </ElButton>
    </div>
    <div class="ae-auth-meta">
      <span>证件号：{{ agentForm.jbrsfzmhm || '—' }}</span>
      <span>联系电话：{{ agentForm.jbrdh || '—' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ArchiveAgentForm, ArchiveOwnerForm } from './types'

  defineOptions({ name: 'VehicleArchiveAuthenticationStep' })

  interface Props {
    /** 所有人表单。 */
    ownerForm: ArchiveOwnerForm
    /** 代理人表单。 */
    agentForm: ArchiveAgentForm
    /** 是否为个人所有人。 */
    isPersonal: boolean
    /** 所有人是否已认证。 */
    ownerAuthed: boolean
    /** 代理人是否已认证。 */
    agentAuthed: boolean
    /** 是否只读。 */
    readonly: boolean
  }

  defineProps<Props>()

  const emit = defineEmits<{
    /** 发起指定人员的实名认证。 */
    authenticate: [type: 'syr' | 'dlr']
  }>()
</script>
