<template>
  <ElDialog
    v-model="dialogVisible"
    width="480px"
    align-center
    destroy-on-close
    class="fs-form-dialog fs-pay-dialog"
    :show-close="true"
  >
    <template #header>
      <div class="fs-pay-dialog-title">
        <ArtSvgIcon icon="ri:upload-2-line" />

        <span>上传支付凭证</span>
      </div>
    </template>

    <template v-if="row">
      <div class="fs-dialog-summary fs-dialog-summary--flat">
        <div class="fs-dialog-summary-line">
          <span
            >合同编号：<b>{{ row.contract_no }}</b></span
          >

          <span>申请人：{{ row.applicant }}</span>
        </div>

        <div class="fs-dialog-summary-line">
          <span class="fs-dialog-summary-row">
            结算类型：

            <span
              class="fs-tag"
              :style="{
                color: SETTLEMENT_BILL_TYPE_CONFIG[row.settlement_type].color,

                background: SETTLEMENT_BILL_TYPE_CONFIG[row.settlement_type].bg
              }"
            >
              {{ row.settlement_type }}
            </span>
          </span>

          <span
            >结算金额：<b class="fs-amount">¥ {{ row.amount.toLocaleString() }}</b></span
          >
        </div>
      </div>

      <div class="fs-form-block">
        <div class="fs-form-label">支付凭证照片</div>

        <div
          v-if="!previewUrl"
          class="fs-upload-zone"
          @click="triggerFileInput"
          @dragover.prevent
          @drop.prevent="onDrop"
        >
          <div class="fs-upload-icon">
            <ArtSvgIcon icon="ri:image-add-line" />
          </div>

          <div class="fs-upload-text">点击或拖拽上传支付凭证</div>

          <div class="fs-upload-hint">支持 JPG、PNG、PDF，大小不超过 10MB</div>

          <ElButton type="primary" size="small" @click.stop="triggerFileInput">
            <ArtSvgIcon icon="ri:upload-2-line" class="mr-1" />

            选择文件
          </ElButton>
        </div>

        <div v-else class="fs-upload-preview">
          <img v-if="previewIsImage" :src="previewUrl" alt="支付凭证预览" />

          <div v-else class="fs-upload-pdf">
            <ArtSvgIcon icon="ri:file-pdf-line" />

            <span>{{ fileName }}</span>
          </div>

          <div class="fs-upload-preview-bar">
            <span class="fs-upload-filename">{{ fileName }}</span>

            <button type="button" class="fs-upload-remove" @click="clearFile">
              <ArtSvgIcon icon="ri:delete-bin-line" />

              删除
            </button>
          </div>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          accept="image/*,.pdf"
          class="fs-hidden-input"
          @change="onFileChange"
        />

        <div v-if="previewUrl" class="fs-upload-success">
          <ArtSvgIcon icon="ri:checkbox-circle-line" />

          凭证已上传，确认保存后完成支付
        </div>
      </div>
    </template>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>

      <ElButton type="primary" :disabled="!fileName" :loading="submitting" @click="handleSubmit">
        <ArtSvgIcon icon="ri:checkbox-circle-line" class="mr-1" />

        确认保存，完成支付
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'

  import { fetchSettlementBillPay } from '@/api/recycle/finance-settlement.mock'

  import type { SettlementBillItem } from '@/types/recycle/finance-settlement'

  import { SETTLEMENT_BILL_TYPE_CONFIG } from '@/types/recycle/finance-settlement'

  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  const props = defineProps<{
    visible: boolean

    row: SettlementBillItem | null
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]

    success: []
  }>()

  const dialogVisible = computed({
    get: () => props.visible,

    set: (v) => emit('update:visible', v)
  })

  const fileInputRef = ref<HTMLInputElement | null>(null)

  const fileName = ref('')

  const previewUrl = ref('')

  const previewIsImage = ref(true)

  const submitting = ref(false)

  watch(
    () => props.visible,

    (v) => {
      if (v) clearFile()
    }
  )

  function triggerFileInput() {
    fileInputRef.value?.click()
  }

  function applyFile(file: File) {
    fileName.value = file.name

    previewIsImage.value = file.type.startsWith('image/')

    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)

    previewUrl.value = URL.createObjectURL(file)
  }

  function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]

    if (file) applyFile(file)
  }

  function onDrop(e: DragEvent) {
    const file = e.dataTransfer?.files?.[0]

    if (file) applyFile(file)
  }

  function clearFile() {
    fileName.value = ''

    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)

    previewUrl.value = ''

    if (fileInputRef.value) fileInputRef.value.value = ''
  }

  async function handleSubmit() {
    if (!props.row || !fileName.value) {
      ElMessage.warning('请上传支付凭证')

      return
    }

    submitting.value = true

    try {
      await fetchSettlementBillPay(props.row.id, fileName.value)

      ElMessage.success('付款已确认')

      dialogVisible.value = false

      emit('success')
    } finally {
      submitting.value = false
    }
  }
</script>

<style scoped lang="scss">
  @use './settlement-dialog';
</style>
