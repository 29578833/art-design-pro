<template>
  <ElDialog
    v-model="dialogVisible"
    class="notice-dialog-full"
    :title="isEdit ? '编辑公告' : '新增公告'"
    width="860px"
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="标题" prop="title">
        <ElInput v-model="form.title" placeholder="请输入公告标题" maxlength="100" />
      </ElFormItem>
      <ElFormItem label="内容" prop="content" class="el-form-item--fill">
        <ArtWangEditor
          v-if="dialogVisible"
          v-model="form.content"
          fill
          placeholder="请输入公告内容"
        />
      </ElFormItem>
      <ElRow :gutter="16">
        <ElCol :span="12">
          <ElFormItem label="排序" prop="sort">
            <ElInputNumber v-model="form.sort" :min="0" controls-position="right" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="启用" prop="is_show">
            <ElSwitch v-model="form.is_show" :active-value="1" :inactive-value="0" />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchNoticeSave, fetchNoticeUpdate } from '@/api/recycle/miniprogram-config'
  import type { MiniNoticeItem } from '@/types/recycle/recovery/commerce/miniprogram'
  import ArtWangEditor from '@/components/core/forms/art-wang-editor/index.vue'

  interface Props {
    visible: boolean
    record?: MiniNoticeItem | null
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
    title: '',
    content: '',
    sort: 0,
    is_show: 1
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
          if (!text) callback(new Error('请输入公告内容'))
          else callback()
        },
        trigger: 'blur'
      }
    ]
  }

  watch(
    () => props.visible,
    (val) => {
      if (!val) return
      const row = props.record
      form.title = row?.title || ''
      form.content = row?.content || ''
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
        title: form.title.trim(),
        content: form.content,
        sort: form.sort,
        is_show: form.is_show
      }
      if (isEdit.value && props.record?.id) {
        await fetchNoticeUpdate(props.record.id, payload)
      } else {
        await fetchNoticeSave(payload)
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

<style lang="scss">
  .notice-dialog-full {
    --el-dialog-margin-top: 0;

    display: flex;
    flex-direction: column;
    height: 100vh;
    max-height: 100vh;
    padding: 0 !important;
    margin: 0 auto;
    overflow: hidden;
    border-radius: 0 !important;

    .el-dialog__header {
      flex-shrink: 0;
      padding: 16px 56px 16px 24px;
      margin-right: 0;
      border-bottom: 1px solid var(--art-gray-300);
    }

    .el-dialog__body {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-height: 0;
      padding: 20px 24px;
      overflow-y: auto;

      > .el-form {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-height: 0;

        .el-form-item--fill {
          display: flex;
          flex: 1;
          flex-direction: column;
          min-height: 0;

          .el-form-item__content {
            display: flex;
            flex: 1;
            flex-direction: column;
            min-height: 0;
          }
        }
      }
    }

    .el-dialog__footer {
      flex-shrink: 0;
      padding: 16px 24px;
      background: #f9fafb;
      border-top: 1px solid var(--art-gray-300);
    }
  }
</style>
