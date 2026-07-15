<template>
  <div class="ae-ocr-box">
    <div class="ae-ocr-head">
      <ArtSvgIcon icon="ri:qr-scan-2-line" />
      证件照片上传 & OCR智能识别
      <span class="ae-ocr-tip">— 点击各照片格的 OCR识别 按钮，自动填充下方字段</span>
    </div>
    <div class="ae-ocr-grid">
      <template v-if="isCompany">
        <UploadSlot
          label="营业执照原件"
          required
          enable-ocr
          ocr-hint="企业全称·统一社会信用代码…"
          :url="images.syrzp"
          :ocr-loading="!!ocrLoading.license"
          :ocr-done="!!ocrDone.license"
          :readonly="readonly"
          @upload="(file) => emit('upload', 'syrzp', file)"
          @remove="emit('remove', 'syrzp')"
          @ocr="emit('ocr-license')"
        />
        <UploadSlot
          label="缺失情况说明"
          :url="images.qksmzp"
          :readonly="readonly"
          @upload="(file) => emit('upload', 'qksmzp', file)"
          @remove="emit('remove', 'qksmzp')"
        />
      </template>
      <template v-else>
        <UploadSlot
          label="身份证正面"
          required
          enable-ocr
          ocr-hint="所有人姓名·身份证号码…"
          :url="images.sfz1zp || images.syrzp"
          :ocr-loading="!!ocrLoading.id_front"
          :ocr-done="!!ocrDone.id_front"
          :readonly="readonly"
          @upload="(file) => emit('upload', 'sfz1zp', file)"
          @remove="emit('remove', 'sfz1zp')"
          @ocr="emit('ocr-id-card', 'front')"
        />
        <UploadSlot
          label="身份证反面"
          required
          enable-ocr
          ocr-hint="身份证号码（核验）"
          ocr-filled-text="已核验"
          :url="images.sfz2zp"
          :ocr-loading="!!ocrLoading.id_back"
          :ocr-done="!!ocrDone.id_back"
          :readonly="readonly"
          @upload="(file) => emit('upload', 'sfz2zp', file)"
          @remove="emit('remove', 'sfz2zp')"
          @ocr="emit('ocr-id-card', 'back')"
        />
        <UploadSlot
          label="缺失情况说明"
          :url="images.qksmzp"
          :readonly="readonly"
          @upload="(file) => emit('upload', 'qksmzp', file)"
          @remove="emit('remove', 'qksmzp')"
        />
      </template>
    </div>
    <div v-if="ocrFilled" class="ae-ocr-ok">
      <ArtSvgIcon icon="ri:checkbox-circle-line" />
      OCR已识别，以下字段已自动填充，请核对后继续
    </div>
  </div>

  <div class="ae-section">
    <div class="ae-section-title">所有人信息</div>
    <ElForm label-position="top" :disabled="readonly">
      <ElRow :gutter="16">
        <ElCol :span="12">
          <ElFormItem label="证件类型" required>
            <ElSelect v-model="form.sfzmmc" placeholder="请选择" style="width: 100%">
              <ElOption
                v-for="option in idTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem :label="isCompany ? '企业完整名称' : '所有人姓名'" required>
            <ElInput
              v-model="form.syr"
              :placeholder="isCompany ? '企业工商注册全称' : '真实姓名'"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem
            :label="isCompany ? '统一社会信用代码（18位）' : '身份证号码（18位）'"
            required
          >
            <ElInput v-model="form.sfzmhm" maxlength="18" placeholder="18位证件号码" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem :label="isCompany ? '联系电话' : '联系电话（11位）'" required>
            <ElInput v-model="form.dh" placeholder="联系电话" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="24">
          <ElFormItem :label="isCompany ? '企业注册地址' : '联系地址'" required>
            <ElInput v-model="form.dz" placeholder="详细地址" />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import UploadSlot from './upload-slot.vue'
  import type {
    ArchiveDictOption,
    ArchiveOcrState,
    ArchiveOwnerForm,
    ArchiveOwnerImages
  } from './types'

  defineOptions({ name: 'VehicleArchiveOwnerStep' })

  interface Props {
    /** 是否为企业或单位所有人。 */
    isCompany: boolean
    /** 所有人证件图片。 */
    images: ArchiveOwnerImages
    /** 可选证件类型。 */
    idTypeOptions: ArchiveDictOption[]
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

  /** 所有人表单模型。 */
  const form = defineModel<ArchiveOwnerForm>('form', { required: true })

  const emit = defineEmits<{
    /** 上传所有人材料。 */
    upload: [field: keyof ArchiveOwnerImages, file: File]
    /** 删除所有人材料。 */
    remove: [field: keyof ArchiveOwnerImages]
    /** 识别所有人身份证。 */
    'ocr-id-card': [side: 'front' | 'back']
    /** 识别企业营业执照。 */
    'ocr-license': []
  }>()
</script>
