<template>
  <div class="mini-sub">
    <div class="mini-panel-tip" style="margin-bottom: 4px">
      管理小程序用户协议、隐私政策等法律文件，编辑后直接生效。
    </div>

    <div v-loading="loading" class="mini-agree-grid">
      <div v-for="item in agreements" :key="item.type" class="mini-agree-card">
        <div class="mini-agree-name">{{ item.label }}</div>
        <div class="mini-agree-meta">
          版本 {{ item.data?.version || '—' }} · 生效日 {{ item.data?.effective_date || '—' }}
        </div>
        <div class="mini-agree-meta mini-ellipsis" style="min-height: 36px; margin-top: 8px">
          {{ stripHtml(item.data?.content) || '暂无内容' }}
        </div>
        <div class="mini-agree-actions">
          <ElButton type="primary" @click="openEdit(item)">编辑</ElButton>
        </div>
      </div>
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="`编辑 — ${editingLabel}`"
      width="860px"
      align-center
      destroy-on-close
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="mini-agree-form-row">
          <ElFormItem label="协议标题" prop="title" class="mini-agree-form-title">
            <ElInput v-model="form.title" maxlength="100" />
          </ElFormItem>
          <ElFormItem label="版本号" prop="version" class="mini-agree-form-version">
            <ElInput v-model="form.version" placeholder="如 1.0" />
          </ElFormItem>
          <ElFormItem label="生效日期" prop="effective_date" class="mini-agree-form-date">
            <ElDatePicker
              v-model="form.effective_date"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择日期"
              style="width: 100%"
            />
          </ElFormItem>
        </div>
        <ElFormItem label="协议内容" prop="content">
          <ArtWangEditor
            v-if="dialogVisible"
            v-model="form.content"
            height="420px"
            placeholder="请输入协议内容"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存并生效</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchAgreement, fetchAgreementSave } from '@/api/recycle/miniprogram-agreement'
  import type { MiniAgreementItem, MiniAgreementType } from '@/types/recycle/miniprogram'
  import ArtWangEditor from '@/components/core/forms/art-wang-editor/index.vue'

  const AGREEMENT_DEFS: { type: MiniAgreementType; label: string }[] = [
    { type: 4, label: '用户服务协议' },
    { type: 3, label: '隐私政策' },
    { type: 5, label: '报废回收服务协议' }
  ]

  const loading = ref(false)
  const submitting = ref(false)
  const dialogVisible = ref(false)
  const editingType = ref<MiniAgreementType>(4)
  const editingLabel = ref('')
  const formRef = ref<FormInstance>()

  const agreements = ref<
    { type: MiniAgreementType; label: string; data: MiniAgreementItem | null }[]
  >(AGREEMENT_DEFS.map((d) => ({ ...d, data: null })))

  const form = reactive({
    id: 0,
    title: '',
    content: '',
    version: '1.0',
    effective_date: ''
  })

  const rules: FormRules = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    content: [
      {
        required: true,
        validator: (_rule, value, callback) => {
          const text = String(value || '')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim()
          if (!text) callback(new Error('请输入协议内容'))
          else callback()
        },
        trigger: 'blur'
      }
    ]
  }

  function stripHtml(html?: string) {
    if (!html) return ''
    return html.replace(/<[^>]+>/g, '').trim()
  }

  async function loadAll() {
    loading.value = true
    try {
      const results = await Promise.all(
        AGREEMENT_DEFS.map(async (def) => {
          try {
            const data = await fetchAgreement(def.type)
            return { ...def, data: data || null }
          } catch {
            return { ...def, data: null }
          }
        })
      )
      agreements.value = results
    } finally {
      loading.value = false
    }
  }

  function openEdit(item: {
    type: MiniAgreementType
    label: string
    data: MiniAgreementItem | null
  }) {
    editingType.value = item.type
    editingLabel.value = item.label
    form.id = Number(item.data?.id || 0)
    form.title = item.data?.title || item.label
    form.content = item.data?.content || ''
    form.version = item.data?.version || '1.0'
    form.effective_date = item.data?.effective_date || ''
    dialogVisible.value = true
  }

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    submitting.value = true
    try {
      await fetchAgreementSave({
        id: form.id,
        type: editingType.value,
        title: form.title.trim(),
        content: form.content,
        version: form.version.trim() || '1.0',
        effective_date: form.effective_date || ''
      })
      dialogVisible.value = false
      await loadAll()
    } finally {
      submitting.value = false
    }
  }

  onMounted(loadAll)
</script>
