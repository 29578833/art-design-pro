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
          @upload="(file) => handleUpload('syrzp', file)"
          @remove="handleRemove('syrzp')"
          @ocr="runLicenseOcr"
        />
        <UploadSlot
          label="缺失情况说明"
          :url="images.qksmzp"
          :readonly="readonly"
          @upload="(file) => handleUpload('qksmzp', file)"
          @remove="handleRemove('qksmzp')"
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
          @upload="(file) => handleUpload('sfz1zp', file)"
          @remove="handleRemove('sfz1zp')"
          @ocr="runIdCardOcr('front')"
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
          @upload="(file) => handleUpload('sfz2zp', file)"
          @remove="handleRemove('sfz2zp')"
          @ocr="runIdCardOcr('back')"
        />
        <UploadSlot
          label="缺失情况说明"
          :url="images.qksmzp"
          :readonly="readonly"
          @upload="(file) => handleUpload('qksmzp', file)"
          @remove="handleRemove('qksmzp')"
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
  import {
    fetchAcceptRecognizeIdCard,
    fetchAcceptRecognizeLicense,
    fetchAcceptSaveOwner,
    fetchAcceptUploadImage
  } from '@/api/recycle/accept'
  import type { AcceptHplx, AcceptSyq } from '@/types/recycle/accept'
  import { fetchDataDictList } from '@/api/recycle/data-dict'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { ElMessage } from 'element-plus'
  import { COMPANY_ID_TYPE_OPTIONS, OWNER_OCR_KEY } from './archive-constants'
  import { applyIdCardFrontResult, applyLicenseOcrResult } from './ocr'
  import UploadSlot from './upload-slot.vue'
  import type {
    ArchiveDictOption,
    ArchiveOcrState,
    ArchiveOwnerForm,
    ArchiveOwnerImages,
    ArchiveVehicleForm,
    ArchiveVehicleImages
  } from './types'

  defineOptions({ name: 'VehicleArchiveOwnerStep' })

  const props = defineProps<{
    /** 车辆 ID。 */
    vehicleId: number
    /** 车辆属地。 */
    hplx: AcceptHplx
    /** 所有权类型。 */
    syq: AcceptSyq
    /** 是否只读。 */
    readonly: boolean
    /** 车辆表单（保存时需要 hpzl）。 */
    vehicleForm: ArchiveVehicleForm
    /** 车辆证件图片（保存时需要）。 */
    vehicleImages: ArchiveVehicleImages
  }>()

  const form = defineModel<ArchiveOwnerForm>('form', { required: true })
  const images = defineModel<ArchiveOwnerImages>('images', { required: true })

  const isCompany = computed(() => props.syq === 1)
  const isPersonal = computed(() => props.syq === 2)
  const ocrLoading = reactive<ArchiveOcrState>({})
  const ocrDone = reactive<ArchiveOcrState>({})
  const naturalIdTypeOptions = ref<ArchiveDictOption[]>([{ label: '居民身份证', value: 'A' }])

  const idTypeOptions = computed(() =>
    isCompany.value ? COMPANY_ID_TYPE_OPTIONS : naturalIdTypeOptions.value
  )
  const ocrFilled = computed(() => !!(ocrDone.license || ocrDone.id_front || ocrDone.id_back))

  async function loadIdTypeOptions() {
    try {
      const res = await fetchDataDictList({
        dict_type: 'id_type_natural',
        status: 1,
        page: 1,
        limit: 200
      })
      const list = (res.list || []).map((i) => ({
        label: i.dict_label || String(i.dict_value ?? ''),
        value: String(i.dict_value ?? '')
      }))
      naturalIdTypeOptions.value = list.length ? list : [{ label: '居民身份证', value: 'A' }]
    } catch {
      naturalIdTypeOptions.value = [{ label: '居民身份证', value: 'A' }]
    }
  }

  function clearOcrState() {
    Object.keys(ocrLoading).forEach((k) => delete ocrLoading[k])
    Object.keys(ocrDone).forEach((k) => delete ocrDone[k])
  }

  async function handleUpload(field: keyof ArchiveOwnerImages, file: File) {
    const url = await fetchAcceptUploadImage({
      file,
      vehicle_id: props.vehicleId,
      field
    })
    if (url) {
      images.value[field] = url
      if (field === 'sfz1zp') images.value.syrzp = url
    }
  }

  function handleRemove(field: keyof ArchiveOwnerImages) {
    images.value[field] = ''
    if (field === 'sfz1zp') images.value.syrzp = ''
    const ocrKey = OWNER_OCR_KEY[field]
    if (ocrKey) {
      delete ocrDone[ocrKey]
      delete ocrLoading[ocrKey]
    }
  }

  async function runIdCardOcr(side: 'front' | 'back') {
    const url = side === 'front' ? images.value.sfz1zp || images.value.syrzp : images.value.sfz2zp
    if (!url) {
      ElMessage.warning(`请先上传身份证${side === 'front' ? '正面' : '反面'}`)
      return
    }
    const key = side === 'front' ? 'id_front' : 'id_back'
    ocrLoading[key] = true
    try {
      const data = await fetchAcceptRecognizeIdCard(url, side)
      if (side === 'front') {
        applyIdCardFrontResult(data as Record<string, unknown>, form.value, true)
        ocrDone[key] = true
        ElMessage.success('OCR识别成功')
      } else if (data.id_number && data.id_number !== form.value.sfzmhm) {
        ElMessage.warning('身份证号码不一致，请核实')
      } else {
        ocrDone[key] = true
        ElMessage.success('身份证反面识别成功')
      }
    } finally {
      ocrLoading[key] = false
    }
  }

  async function runLicenseOcr() {
    if (!images.value.syrzp) {
      ElMessage.warning('请先上传营业执照原件')
      return
    }
    ocrLoading.license = true
    try {
      const data = await fetchAcceptRecognizeLicense(images.value.syrzp)
      applyLicenseOcrResult(data as Record<string, unknown>, form.value)
      ocrDone.license = true
      ElMessage.success('OCR识别成功')
    } finally {
      ocrLoading.license = false
    }
  }

  function mapOwnerFields() {
    const base: Record<string, unknown> = {
      vehicle_id: props.vehicleId,
      syr: form.value.syr || '',
      sfzmhm: form.value.sfzmhm || '',
      dh: form.value.dh || '',
      dz: form.value.dz || '',
      sfzmmc: form.value.sfzmmc || (isPersonal.value ? 'A' : 'N'),
      hpzl: props.vehicleForm.hpzl || form.value.hpzl || '',
      syq: String(props.syq),
      zcbj: props.hplx === 3 ? '0' : '1',
      sfyd: props.hplx === 1 ? '0' : '1',
      syrsmrz: form.value.syrsmrz || '',
      syrzp: isPersonal.value
        ? images.value.sfz1zp || images.value.syrzp || ''
        : images.value.syrzp || '',
      qksmzp: images.value.qksmzp || '',
      xszzp: props.vehicleImages.xszzp || '',
      tcjczp: props.vehicleImages.xszzpfy || '',
      xszbmzp: props.vehicleImages.xszbmzp || '',
      czzp: props.vehicleImages.czzp || '',
      blpzzp: images.value.blpzzp || ''
    }
    if (isPersonal.value) {
      base.sfz1zp = images.value.sfz1zp || images.value.syrzp || ''
      base.sfz2zp = images.value.sfz2zp || ''
    }
    return base
  }

  async function save() {
    await fetchAcceptSaveOwner(mapOwnerFields() as never)
  }

  onMounted(() => {
    loadIdTypeOptions()
  })

  defineExpose({ save, clearOcrState, handleUpload, handleRemove })
</script>
