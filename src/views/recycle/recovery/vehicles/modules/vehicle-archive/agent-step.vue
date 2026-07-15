<template>
  <div class="ae-section">
    <ElCheckbox v-model="hasAgent" :disabled="readonly" @change="onAgentToggle(!!$event)">
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
          @upload="(file) => handleUpload('jbrsfz1zp', file)"
          @remove="handleRemove('jbrsfz1zp')"
          @ocr="runAgentIdOcr('front')"
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
          @upload="(file) => handleUpload('jbrsfz2zp', file)"
          @remove="handleRemove('jbrsfz2zp')"
          @ocr="runAgentIdOcr('back')"
        />
        <UploadSlot
          label="委托说明"
          required
          :url="images.jbrzp"
          :readonly="readonly"
          @upload="(file) => handleUpload('jbrzp', file)"
          @remove="handleRemove('jbrzp')"
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
  import {
    fetchAcceptRecognizeIdCard,
    fetchAcceptSaveAgent,
    fetchAcceptUploadImage
  } from '@/api/recycle/accept'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { ElMessage } from 'element-plus'
  import { AGENT_OCR_KEY } from './archive-constants'
  import { applyIdCardFrontResult } from './ocr'
  import UploadSlot from './upload-slot.vue'
  import type { ArchiveAgentForm, ArchiveAgentImages, ArchiveOcrState } from './types'

  defineOptions({ name: 'VehicleArchiveAgentStep' })

  const props = defineProps<{
    /** 车辆 ID。 */
    vehicleId: number
    /** 是否只读。 */
    readonly: boolean
  }>()

  const hasAgent = defineModel<boolean>('hasAgent', { required: true })
  const form = defineModel<ArchiveAgentForm>('form', { required: true })
  const images = defineModel<ArchiveAgentImages>('images', { required: true })

  const ocrLoading = reactive<ArchiveOcrState>({})
  const ocrDone = reactive<ArchiveOcrState>({})
  const ocrFilled = computed(() => !!(ocrDone.agent_front || ocrDone.agent_back))

  function clearOcrState() {
    Object.keys(ocrLoading).forEach((k) => delete ocrLoading[k])
    Object.keys(ocrDone).forEach((k) => delete ocrDone[k])
  }

  function onAgentToggle(val: boolean) {
    if (!val) {
      form.value.jbr = ''
      form.value.jbrsfzmhm = ''
      form.value.jbrdh = ''
      form.value.jbrsmrz = ''
      images.value.jbrsfz1zp = ''
      images.value.jbrsfz2zp = ''
      images.value.jbrzp = ''
    }
  }

  async function handleUpload(field: keyof ArchiveAgentImages, file: File) {
    const url = await fetchAcceptUploadImage({
      file,
      vehicle_id: props.vehicleId,
      field
    })
    if (url) images.value[field] = url
  }

  function handleRemove(field: keyof ArchiveAgentImages) {
    images.value[field] = ''
    const ocrKey = AGENT_OCR_KEY[field]
    if (ocrKey) {
      delete ocrDone[ocrKey]
      delete ocrLoading[ocrKey]
    }
  }

  async function runAgentIdOcr(side: 'front' | 'back') {
    const url = side === 'front' ? images.value.jbrsfz1zp : images.value.jbrsfz2zp
    if (!url) {
      ElMessage.warning(`请先上传代理人身份证${side === 'front' ? '正面' : '反面'}`)
      return
    }
    const key = side === 'front' ? 'agent_front' : 'agent_back'
    ocrLoading[key] = true
    try {
      const data = await fetchAcceptRecognizeIdCard(url, side)
      if (side === 'front') {
        applyIdCardFrontResult(data as Record<string, unknown>, form.value, false)
        ocrDone[key] = true
        ElMessage.success('OCR识别成功')
      } else if (data.id_number && data.id_number !== form.value.jbrsfzmhm) {
        ElMessage.warning('身份证号码不一致，请核实')
      } else {
        ocrDone[key] = true
        ElMessage.success('身份证反面识别成功')
      }
    } finally {
      ocrLoading[key] = false
    }
  }

  async function save() {
    await fetchAcceptSaveAgent({
      vehicle_id: props.vehicleId,
      has_agent: hasAgent.value ? 1 : 0,
      jbr: form.value.jbr || '',
      jbrsfzmhm: form.value.jbrsfzmhm || '',
      jbrdh: form.value.jbrdh || '',
      jbrsmrz: form.value.jbrsmrz || '',
      jbrzp: images.value.jbrzp || '',
      jbrsfz1zp: images.value.jbrsfz1zp || '',
      jbrsfz2zp: images.value.jbrsfz2zp || ''
    } as never)
  }

  defineExpose({ save, clearOcrState, handleUpload, handleRemove })
</script>
