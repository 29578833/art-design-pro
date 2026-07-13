<template>
  <ElDialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑轮播图' : '新增轮播图'"
    width="480px"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="图片上传" prop="image" required>
        <ElUpload
          class="mini-banner-uploader"
          drag
          :show-file-list="false"
          accept="image/*"
          :http-request="handleUpload"
        >
          <div v-if="form.image" class="mini-banner-uploader-preview">
            <img :src="form.image" alt="banner" />
            <div class="mini-banner-uploader-mask">点击或拖拽重新上传</div>
          </div>
          <div v-else class="mini-banner-uploader-empty">
            <ArtSvgIcon icon="ri:upload-cloud-2-line" class="mini-banner-uploader-ico" />
            <p>点击或拖拽上传图片（建议尺寸 750×360px）</p>
          </div>
        </ElUpload>
      </ElFormItem>
      <ElFormItem label="标题说明" prop="title">
        <ElInput v-model="form.title" placeholder="轮播图说明文字" maxlength="100" />
      </ElFormItem>
      <ElFormItem label="点击跳转链接" prop="url">
        <ElInput v-model="form.url" placeholder="/booking 或外部链接" maxlength="255" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">
        {{ isEdit ? '保存' : '发布轮播图' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
  import { fetchBannerSave, fetchBannerUpdate } from '@/api/recycle/miniprogram-config'
  import { uploadFileGetUrl } from '@/api/upload'
  import type { MiniBannerItem } from '@/types/recycle/miniprogram'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    visible: boolean
    record?: MiniBannerItem | null
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
    image: '',
    url: '',
    sort: 0,
    is_show: 1
  })

  const rules: FormRules = {
    image: [{ required: true, message: '请上传图片', trigger: 'change' }],
    title: [{ required: true, message: '请输入标题说明', trigger: 'blur' }]
  }

  watch(
    () => props.visible,
    (val) => {
      if (!val) return
      const row = props.record
      form.title = row?.title || ''
      form.image = row?.image || ''
      form.url = row?.url || ''
      form.sort = Number(row?.sort || 0)
      form.is_show = Number(row?.is_show ?? 1)
    }
  )

  async function handleUpload(options: UploadRequestOptions) {
    form.image = await uploadFileGetUrl(options.file as File, { showSuccessMessage: false })
    formRef.value?.validateField('image')
  }

  async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        title: form.title.trim(),
        image: form.image,
        url: form.url.trim(),
        sort: form.sort,
        is_show: form.is_show
      }
      if (isEdit.value && props.record?.id) {
        await fetchBannerUpdate(props.record.id, payload)
      } else {
        await fetchBannerSave(payload)
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
