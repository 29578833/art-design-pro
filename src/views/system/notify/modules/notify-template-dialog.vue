<template>
  <ElDialog
    v-model="dialogVisible"
    width="720px"
    align-center
    destroy-on-close
    style="padding: 0 !important;"
    class="sys-notify-template-dialog"
  >
    <template #header>
      <div class="tpl-header">
        <div class="tpl-header-main">
          <span class="tpl-title">消息模板</span>
          <span v-if="displayCode" class="tpl-code">{{ displayCode }}</span>
          <span
            v-if="displayName"
            class="tpl-name-tag"
            :style="{
              color: displayTagColor,
              background: displayTagBg,
              borderColor: displayTagColor
            }"
          >
            {{ displayName }}
          </span>
        </div>
        <div class="tpl-header-sub">{{ displayMeta }}</div>
      </div>
    </template>

    <div v-loading="templateLoading" class="tpl-body">
      <ElForm v-if="templateData" label-position="top" class="tpl-form">
        <ElFormItem label="消息标题">
          <ElInput v-model="templateForm.system_title" placeholder="请输入消息标题" />
        </ElFormItem>

        <ElFormItem label="消息正文">
          <ElInput
            v-model="templateForm.system_text"
            type="textarea"
            :rows="7"
            resize="none"
            placeholder="消息正文，使用 {变量名} 插入动态内容"
          />
          <div class="form-hint">支持换行，用 {变量名} 格式插入动态内容，发送时自动替换</div>
        </ElFormItem>

        <ElFormItem>
          <template #label>
            <span>可用变量</span>
            <span class="label-hint">（点击可插入到正文末尾）</span>
          </template>
          <div class="variable-tags">
            <button
              v-for="v in templateVariables"
              :key="v"
              type="button"
              class="variable-tag"
              @click="insertVariable(v)"
            >
              {{ v }}
            </button>
            <span v-if="!templateVariables.length" class="variable-empty">暂无变量</span>
          </div>
        </ElFormItem>
      </ElForm>

      <div v-if="templateData" class="preview-section">
        <div class="preview-label">预览</div>
        <div class="preview-card">
          <h4 class="preview-title">{{ templateForm.system_title || '消息标题' }}</h4>
          <div class="preview-body" v-html="renderPreview(templateForm.system_text)" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="tpl-footer">
        <span class="footer-tip">后续支持按渠道（系统消息/微信/短信）分别配置模板</span>
        <div class="footer-actions">
          <ElButton @click="dialogVisible = false">关闭</ElButton>
          <ElButton type="primary" :loading="templateSaving" @click="saveTemplate">
            保存模板
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    fetchNotificationTemplate,
    fetchNotificationTemplateSave
  } from '@/api/recycle/system-notification'
  import type {
    SystemNotificationItem,
    SystemNotificationTemplate
  } from '@/types/recycle/system/system-notification'

  defineOptions({ name: 'NotifyTemplateDialog' })

  /** 打开弹窗时传入的通知行数据（含列表展示信息） */
  type TemplateRow = SystemNotificationItem & {
    _code?: string
    _tagColor?: string
    _tagBg?: string
    _typeName?: string
  }

  interface Props {
    visible: boolean
    row: TemplateRow | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }>()

  // ==================== 展示辅助 ====================

  const ROLE_LABEL: Record<string, string> = {
    C: '回收用户',
    S: '普通员工',
    R: '审核员工',
    A: '拖车管理员',
    D: '拖车司机',
    PS: '普通员工',
    PR: '审核员工',
    PF: '财务人员',
    PA: '拖车管理员',
    PM: '超级管理员'
  }

  const ROLE_TAG: Record<string, { color: string; bg: string }> = {
    C: { color: '#1890FF', bg: '#E6F7FF' },
    S: { color: '#722ED1', bg: '#F9F0FF' },
    R: { color: '#EB2F96', bg: '#FFF0F6' },
    A: { color: '#FA8C16', bg: '#FFF7E6' },
    D: { color: '#13C2C2', bg: '#E6FFFB' },
    PS: { color: '#722ED1', bg: '#F9F0FF' },
    PR: { color: '#EB2F96', bg: '#FFF0F6' },
    PF: { color: '#52C41A', bg: '#F6FFED' },
    PA: { color: '#FA8C16', bg: '#FFF7E6' },
    PM: { color: '#FF4D4F', bg: '#FFF1F0' }
  }

  function getRoleLabel(role?: string) {
    return ROLE_LABEL[role || ''] || role || '—'
  }

  function getPlatformLabel(platform?: string) {
    return platform === 'pc_admin' ? 'PC管理后台' : '小程序端'
  }

  const displayCode = computed(
    () => props.row?._code || templateData.value?.mark || ''
  )

  const displayName = computed(
    () => templateData.value?.name || props.row?.name || ''
  )

  const displayTagColor = computed(() => {
    if (props.row?._tagColor) return props.row._tagColor
    const role = templateData.value?.role || props.row?.role || ''
    return ROLE_TAG[role]?.color || '#4169FF'
  })

  const displayTagBg = computed(() => {
    if (props.row?._tagBg) return props.row._tagBg
    const role = templateData.value?.role || props.row?.role || ''
    return ROLE_TAG[role]?.bg || '#EEF2FF'
  })

  const displayMeta = computed(() => {
    const role = templateData.value?.role || props.row?.role
    const platform = templateData.value?.platform || props.row?.platform
    const typeName = props.row?._typeName || getRoleLabel(role)
    return `${typeName} · ${getPlatformLabel(platform)}`
  })

  // ==================== 弹窗显隐 ====================

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  watch(
    () => props.visible,
    (val) => {
      if (val) loadTemplate()
    }
  )

  // ==================== 模板数据加载 ====================

  const templateLoading = ref(false)
  const templateData = ref<(SystemNotificationItem & SystemNotificationTemplate) | null>(null)

  async function loadTemplate() {
    if (!props.row) return
    templateLoading.value = true
    try {
      const data = await fetchNotificationTemplate(props.row.id)
      templateData.value = { ...props.row, ...data }
      templateForm.system_title = data.system_title || ''
      templateForm.system_text = data.system_text || ''
      const backendVars = Array.isArray(data.variables) ? data.variables : []
      templateVariables.value = [
        ...new Set([...backendVars, ...extractVariables(templateForm.system_text)])
      ]
    } finally {
      templateLoading.value = false
    }
  }

  // ==================== 模板编辑与保存 ====================

  const templateSaving = ref(false)
  const templateForm = reactive({
    system_title: '',
    system_text: ''
  })
  const templateVariables = ref<string[]>([])

  function extractVariables(text: string) {
    const matches = text.match(/\{([^}]+)\}/g) || []
    return [...new Set(matches)]
  }

  function insertVariable(variable: string) {
    templateForm.system_text += variable
    templateVariables.value = [
      ...new Set([...templateVariables.value, ...extractVariables(templateForm.system_text)])
    ]
  }

  function renderPreview(text: string) {
    if (!text) return '<span class="preview-empty">暂无内容</span>'
    return text
      .replace(
        /\{([^}]+)\}/g,
        '<span class="preview-var">{$1}</span>'
      )
      .replace(/\n/g, '<br>')
  }

  async function saveTemplate() {
    if (!templateData.value) return
    templateSaving.value = true
    try {
      await fetchNotificationTemplateSave({
        id: templateData.value.id,
        system_title: templateForm.system_title,
        system_text: templateForm.system_text
      })
      dialogVisible.value = false
      emit('success')
    } finally {
      templateSaving.value = false
    }
  }
</script>

<style lang="scss">
  .sys-notify-template-dialog {
    &.el-dialog {
      border-radius: 12px;
      overflow: hidden;
    }

    .el-dialog__header {
      padding: 20px 24px 12px;
      margin: 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .el-dialog__body {
      max-height: calc(90vh - 160px);
      padding: 0;
      overflow-y: auto;
    }

    .el-dialog__footer {
      padding: 12px 24px;
      border-top: 1px solid #f3f4f6;
    }

    .tpl-header-main {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .tpl-title {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
    }

    .tpl-code {
      padding: 1px 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      font-weight: 500;
      color: #9ca3af;
      background: #f3f4f6;
      border-radius: 4px;
    }

    .tpl-name-tag {
      padding: 2px 10px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid;
      border-radius: 999px;
    }

    .tpl-header-sub {
      margin-top: 6px;
      font-size: 12px;
      color: #9ca3af;
    }

    .tpl-body {
      min-height: 200px;
      padding: 20px 24px 24px;
    }

    .tpl-form {
      .el-form-item {
        margin-bottom: 18px;
      }

      .el-form-item__label {
        margin-bottom: 6px;
        font-size: 13px;
        font-weight: 600;
        color: #374151;
        line-height: 1.4;
      }

      .el-textarea__inner {
        font-family: inherit;
        line-height: 1.7;
      }
    }

    .label-hint {
      margin-left: 4px;
      font-size: 12px;
      font-weight: 400;
      color: #9ca3af;
    }

    .form-hint {
      margin-top: 6px;
      font-size: 12px;
      color: #c0c4cc;
      line-height: 1.5;
    }

    .variable-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .variable-tag {
      padding: 0px 10px;
      height: 34px;
      line-height: 34px;
      font-size: 12px;
      color: #4169ff;
      cursor: pointer;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 6px;
      transition: all 0.15s;

      &:hover {
        color: #fff;
        background: #4169ff;
        border-color: #4169ff;
      }
    }

    .variable-empty {
      font-size: 13px;
      color: #c0c4cc;
    }

    .preview-section {
      margin-top: 4px;
    }

    .preview-label {
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
    }

    .preview-card {
      padding: 16px 18px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .preview-title {
      margin: 0 0 10px;
      font-size: 15px;
      font-weight: 700;
      color: #111827;
    }

    .preview-body {
      font-size: 13px;
      line-height: 1.8;
      color: #4b5563;
      word-break: break-word;

      .preview-empty {
        color: #c0c4cc;
      }

      .preview-var {
        padding: 1px 5px;
        font-size: 12px;
        color: #4169ff;
        background: #eef2ff;
        border-radius: 3px;
      }
    }

    .tpl-footer {
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .footer-tip {
      flex: 1;
      min-width: 0;
      font-size: 12px;
      color: #c0c4cc;
      text-align: left;
    }

    .footer-actions {
      display: flex;
      flex-shrink: 0;
      gap: 10px;
    }
  }
</style>
