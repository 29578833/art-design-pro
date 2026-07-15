<template>
  <div class="ae-section">
    <ElCheckbox v-model="hasAgent" :disabled="readonly" @change="emit('toggle', !!$event)">
      代办场景（有代理人代为办理）
    </ElCheckbox>
  </div>
  <template v-if="hasAgent">
    <div class="ae-ocr-box">
      <div class="ae-ocr-head">
        <ArtSvgIcon icon="ri:qr-scan-2-line" />
        代理人证件上传 & OCR智能识别
        <span class="ae-ocr-tip">— 点击各照片格的 OCR识别 按钮，自动填充下方字段</span>
      </div>
      <div class="ae-ocr-grid">
        <UploadSlot
          label="代理人身份证正面"
          required
          enable-ocr
          ocr-hint="代理人姓名·身份证号码…"
          :url="images.jbrsfz1zp"
          :ocr-loading="!!ocrLoading.agent_front"
          :ocr-done="!!ocrDone.agent_front"
          :readonly="readonly"
          @upload="(file) => emit('upload', 'jbrsfz1zp', file)"
          @remove="emit('remove', 'jbrsfz1zp')"
          @ocr="emit('ocr-id-card', 'front')"
        />
        <UploadSlot
          label="代理人身份证反面"
          required
          enable-ocr
          ocr-hint="代理人身份证号码（核验）"
          ocr-filled-text="已核验"
          :url="images.jbrsfz2zp"
          :ocr-loading="!!ocrLoading.agent_back"
          :ocr-done="!!ocrDone.agent_back"
          :readonly="readonly"
          @upload="(file) => emit('upload', 'jbrsfz2zp', file)"
          @remove="emit('remove', 'jbrsfz2zp')"
          @ocr="emit('ocr-id-card', 'back')"
        />
        <UploadSlot
          label="委托说明"
          required
          :url="images.jbrzp"
          :readonly="readonly"
          @upload="(file) => emit('upload', 'jbrzp', file)"
          @remove="emit('remove', 'jbrzp')"
        />
      </div>
      <div v-if="ocrFilled" class="ae-ocr-ok">
        <ArtSvgIcon icon="ri:checkbox-circle-line" />
        OCR已识别，以下字段已自动填充，请核对后继续
      </div>
    </div>
    <div class="ae-section">
      <div class="ae-section-title">代理人信息</div>
      <ElForm label-position="top">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="代理人姓名" required><ElInput v-model="form.jbr" /></ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="代理人证件号码（18位）" required>
              <ElInput v-model="form.jbrsfzmhm" maxlength="18" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="代理人联系电话（11位）" required>
              <ElInput v-model="form.jbrdh" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </div>
  </template>
  <ElEmpty v-else description="未勾选代办，可直接进入下一步" :image-size="80" />
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import UploadSlot from './upload-slot.vue'
  import type { ArchiveAgentForm, ArchiveAgentImages, ArchiveOcrState } from './types'

  defineOptions({ name: 'VehicleArchiveAgentStep' })

  interface Props {
    /** 代理人证件图片。 */
    images: ArchiveAgentImages
    /** OCR 加载状态。 */
    ocrLoading: ArchiveOcrState
    /** OCR 完成状态。 */
    ocrDone: ArchiveOcrState
    /** 是否已有 OCR 字段回填。 */
    ocrFilled: boolean
    /** 是否只读。 */
    readonly: boolean
  }

  defineProps<Props>()

  /** 是否由代理人代办。 */
  const hasAgent = defineModel<boolean>('hasAgent', { required: true })
  /** 代理人表单模型。 */
  const form = defineModel<ArchiveAgentForm>('form', { required: true })

  const emit = defineEmits<{
    /** 切换是否代办。 */
    toggle: [enabled: boolean]
    /** 上传代理人材料。 */
    upload: [field: keyof ArchiveAgentImages, file: File]
    /** 删除代理人材料。 */
    remove: [field: keyof ArchiveAgentImages]
    /** 识别代理人身份证。 */
    'ocr-id-card': [side: 'front' | 'back']
  }>()
</script>
