<template>
  <ElDialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑FAQ' : '新增FAQ'"
    width="520px"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="分类" prop="category">
        <ElSelect v-model="form.category" placeholder="请选择分类" style="width: 100%">
          <ElOption v-for="item in FAQ_CATEGORIES" :key="item" :label="item" :value="item" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="问题" prop="question">
        <ElInput v-model="form.question" placeholder="常见问题标题" maxlength="200" />
      </ElFormItem>
      <ElFormItem label="回答" prop="answer">
        <ElInput
          v-model="form.answer"
          type="textarea"
          :rows="4"
          placeholder="详细解答内容"
          maxlength="2000"
          show-word-limit
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchFaqSave, fetchFaqUpdate } from '@/api/recycle/miniprogram-config'
  import type { MiniFaqItem } from '@/types/recycle/miniprogram'
  import { FAQ_CATEGORIES } from '@/types/recycle/miniprogram'

  interface Props {
    visible: boolean
    record?: MiniFaqItem | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const isEdit = computed(() => !!props.record?.id)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const form = reactive({
    question: '',
    answer: '',
    category: '流程相关',
    sort: 0,
    is_show: 1
  })

  const rules: FormRules = {
    category: [{ required: true, message: '请选择分类', trigger: 'change' }],
    question: [{ required: true, message: '请输入问题', trigger: 'blur' }],
    answer: [{ required: true, message: '请输入回答', trigger: 'blur' }]
  }

  watch(
    () => props.visible,
    (val) => {
      if (!val) return
      const row = props.record
      form.question = row?.question || ''
      form.answer = row?.answer || ''
      form.category = row?.category || '流程相关'
      form.sort = Number(row?.sort || 0)
      form.is_show = Number(row?.is_show ?? 1)
    }
  )

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        category: form.category || '其他',
        sort: form.sort,
        is_show: form.is_show
      }
      if (isEdit.value && props.record?.id) {
        await fetchFaqUpdate(props.record.id, payload)
      } else {
        await fetchFaqSave(payload)
      }
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    formRef.value?.resetFields()
  }
</script>
