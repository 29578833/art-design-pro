<template>
  <div class="ae-ocr-box">
    <div class="ae-ocr-head">
      <ArtSvgIcon icon="ri:qr-scan-2-line" />
      行驶证 / 产证上传 & OCR智能识别
      <span class="ae-ocr-tip">— 点击各照片格的 OCR识别 按钮，自动填充下方字段</span>
    </div>
    <div class="ae-ocr-grid cols-4">
      <UploadSlot
        label="行驶证正页"
        required
        enable-ocr
        ocr-hint="车牌号·车辆类型…"
        :url="images.xszzp"
        :ocr-loading="!!ocrLoading.driving_front"
        :ocr-done="!!ocrDone.driving_front"
        :readonly="readonly"
        @upload="(file) => handleUpload('xszzp', file)"
        @remove="handleRemove('xszzp')"
        @ocr="runDrivingOcr('front')"
      />
      <UploadSlot
        label="行驶证副页"
        required
        enable-ocr
        ocr-hint="车牌号·行驶证编号…"
        :url="images.xszzpfy"
        :ocr-loading="!!ocrLoading.driving_back"
        :ocr-done="!!ocrDone.driving_back"
        :readonly="readonly"
        @upload="(file) => handleUpload('xszzpfy', file)"
        @remove="handleRemove('xszzpfy')"
        @ocr="runDrivingOcr('back')"
      />
      <UploadSlot
        label="正副背面"
        required
        enable-ocr
        ocr-hint="车牌号·品牌型号"
        :url="images.xszbmzp"
        :ocr-loading="!!ocrLoading.driving_both"
        :ocr-done="!!ocrDone.driving_both"
        :readonly="readonly"
        @upload="(file) => handleUpload('xszbmzp', file)"
        @remove="handleRemove('xszbmzp')"
        @ocr="runDrivingOcr('both')"
      />
      <UploadSlot
        label="产证一二页"
        required
        enable-ocr
        ocr-hint="产证编号·行驶证编号…"
        :url="images.czzp"
        :ocr-loading="!!ocrLoading.cert"
        :ocr-done="!!ocrDone.cert"
        :readonly="readonly"
        @upload="(file) => handleUpload('czzp', file)"
        @remove="handleRemove('czzp')"
        @ocr="runRegCertOcr"
      />
    </div>
    <div v-if="ocrFilled" class="ae-ocr-ok">
      <ArtSvgIcon icon="ri:checkbox-circle-line" />
      OCR已识别，以下字段已自动填充，请核对后继续
    </div>
  </div>

  <div class="ae-section">
    <div class="ae-section-title">车辆信息</div>
    <ElForm label-position="top" :disabled="readonly">
      <ElRow :gutter="16">
        <ElCol :span="24">
          <ElFormItem label="车架号" required>
            <ElInput v-model="form.clsbdh" placeholder="请填写" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="号牌号码" required>
            <ElInput v-model="form.hphm" placeholder="如：沪BE8210" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="号牌种类" required>
            <ElSelect v-model="form.hpzl" placeholder="请选择" filterable clearable>
              <ElOption
                v-for="option in hpzlDict"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="车辆类型">
            <ElCascader
              v-model="cllxPath"
              :options="cascaderOptions"
              :props="{
                value: 'value',
                label: 'label',
                children: 'children',
                emitPath: false
              }"
              clearable
              filterable
              style="width: 100%"
              @change="onCllxChange"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="使用性质">
            <ElSelect v-model="form.syxz" placeholder="请选择" filterable clearable>
              <ElOption
                v-for="option in syxzDict"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="行驶证编号" required>
            <ElInput v-model="form.xszbh" placeholder="请输入行驶证编号" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="产证编号" required>
            <ElInput v-model="form.czbh" placeholder="请输入产证编号" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="24">
          <ElFormItem label="品牌型号" required>
            <ElInput v-model="form.ppxh" placeholder="如：中沃牌SWB6106MG" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="车辆品牌"
            ><ElInput v-model="form.clpp1" placeholder="品牌"
          /></ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="车辆型号"
            ><ElInput v-model="form.clxh" placeholder="型号"
          /></ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="注册登记日期">
            <ElDatePicker
              v-model="form.ccdjrq"
              type="date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="燃油种类">
            <ElSelect v-model="form.rlzl" placeholder="请选择" filterable clearable>
              <ElOption
                v-for="option in rlzlDict"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12"
          ><ElFormItem label="发动机号码"><ElInput v-model="form.fdjh" /></ElFormItem
        ></ElCol>
        <ElCol :span="12"
          ><ElFormItem label="发动机型号"><ElInput v-model="form.fdjxh" /></ElFormItem
        ></ElCol>
        <ElCol :span="8"
          ><ElFormItem label="外廓长(mm)"><ElInput v-model="form.cwkc" type="number" /></ElFormItem
        ></ElCol>
        <ElCol :span="8"
          ><ElFormItem label="外廓宽(mm)"><ElInput v-model="form.cwkk" type="number" /></ElFormItem
        ></ElCol>
        <ElCol :span="8"
          ><ElFormItem label="外廓高(mm)"><ElInput v-model="form.cwkg" type="number" /></ElFormItem
        ></ElCol>
        <ElCol :span="12"
          ><ElFormItem label="排量(ml)"><ElInput v-model="form.pl" type="number" /></ElFormItem
        ></ElCol>
        <ElCol :span="12"
          ><ElFormItem label="功率(kw)"><ElInput v-model="form.gl" type="number" /></ElFormItem
        ></ElCol>
        <ElCol :span="12"
          ><ElFormItem label="整备质量(kg)"
            ><ElInput v-model="form.zbzl" type="number" /></ElFormItem
        ></ElCol>
        <ElCol :span="12"
          ><ElFormItem label="总质量(kg)"><ElInput v-model="form.zzl" type="number" /></ElFormItem
        ></ElCol>
        <ElCol :span="12"
          ><ElFormItem label="核定载人数"><ElInput v-model="form.hdzk" type="number" /></ElFormItem
        ></ElCol>
        <ElCol :span="12"
          ><ElFormItem label="车身颜色"><ElInput v-model="form.csys" /></ElFormItem
        ></ElCol>
      </ElRow>
    </ElForm>
  </div>

  <div class="ae-section">
    <div class="ae-section-title">送货方式</div>
    <div class="ae-delivery-grid">
      <button
        type="button"
        class="ae-delivery-card"
        :class="{ active: form.delivery_method === 'tow' }"
        @click="form.delivery_method = 'tow'"
      >
        <div class="name">需要拖车运输</div>
        <div class="desc">预约上门取车</div>
      </button>
      <button
        type="button"
        class="ae-delivery-card"
        :class="{ active: form.delivery_method === 'self' }"
        @click="form.delivery_method = 'self'"
      >
        <div class="name">自行送车</div>
        <div class="desc">车主自行驾驶或运输</div>
      </button>
    </div>
    <ElForm label-position="top">
      <ElRow :gutter="16">
        <ElCol :span="24">
          <ElFormItem :label="form.delivery_method === 'tow' ? '上门取车地址' : '自送地址'">
            <ElInput v-if="form.delivery_method === 'tow'" v-model="form.tow_pickup_address" />
            <ElInput v-else v-model="form.self_delivery_address" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="联系人">
            <ElInput v-if="form.delivery_method === 'tow'" v-model="form.tow_pickup_contact" />
            <ElInput v-else v-model="form.self_delivery_name" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="联系电话">
            <ElInput v-if="form.delivery_method === 'tow'" v-model="form.tow_pickup_phone" />
            <ElInput v-else v-model="form.self_delivery_phone" />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>
  </div>

  <div class="ae-section">
    <div class="ae-section-title">结算信息</div>
    <ElForm label-position="top">
      <ElRow :gutter="16">
        <ElCol :span="8">
          <ElFormItem label="结算类型">
            <ElSelect v-model="form.settlement_type" clearable>
              <ElOption label="报废" value="报废" />
              <ElOption label="卖废铁" value="卖废铁" />
              <ElOption label="其他" value="其他" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="8">
          <ElFormItem label="结算方式">
            <ElSelect v-model="form.settlement_method" clearable>
              <ElOption label="重量结算" value="重量结算" />
              <ElOption label="整备质量结算" value="整备质量结算" />
              <ElOption label="整车结算" value="整车结算" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="8"
          ><ElFormItem label="结算金额（元）"
            ><ElInput v-model="form.settlement_amount" type="number" /></ElFormItem
        ></ElCol>
        <ElCol :span="8"
          ><ElFormItem label="开户姓名/名称"><ElInput v-model="form.bank_name" /></ElFormItem
        ></ElCol>
        <ElCol :span="8"
          ><ElFormItem label="开户银行"><ElInput v-model="form.bank_branch" /></ElFormItem
        ></ElCol>
        <ElCol :span="8"
          ><ElFormItem label="银行卡号"
            ><ElInput v-model="form.bank_card_no" maxlength="19" /></ElFormItem
        ></ElCol>
        <ElCol :span="24"
          ><ElFormItem label="备注说明"
            ><ElInput v-model="form.remark" type="textarea" :rows="3" /></ElFormItem
        ></ElCol>
      </ElRow>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchAcceptRecognizeDrivingLicense,
    fetchAcceptRecognizeRegCert,
    fetchAcceptSaveVehicle,
    fetchAcceptUploadImage
  } from '@/api/recycle/accept'
  import type { AcceptHplx } from '@/types/recycle/accept'
  import { fetchCllxCascade, fetchDataDictList } from '@/api/recycle/data-dict'
  import type { CllxCascadeNode } from '@/types/recycle/data-dict'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { CascaderOption } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { FALLBACK_HPZL, FALLBACK_RLZL, FALLBACK_SYXZ, VEHICLE_OCR_KEY } from './archive-constants'
  import { str } from './archive-utils'
  import { applyDrivingOcrResult, applyRegCertOcrResult } from './ocr'
  import UploadSlot from './upload-slot.vue'
  import type {
    ArchiveDictOption,
    ArchiveOcrState,
    ArchiveOwnerForm,
    ArchiveVehicleForm,
    ArchiveVehicleImages
  } from './types'

  defineOptions({ name: 'VehicleArchiveVehicleStep' })

  const props = defineProps<{
    /** 车辆 ID。 */
    vehicleId: number
    /** 车辆属地。 */
    hplx: AcceptHplx
    /** 所有人表单（OCR 回填用）。 */
    ownerForm: ArchiveOwnerForm
    /** 是否只读。 */
    readonly: boolean
  }>()

  const form = defineModel<ArchiveVehicleForm>('form', { required: true })
  const images = defineModel<ArchiveVehicleImages>('images', { required: true })
  const cllxPath = defineModel<string>('cllxPath', { required: true })

  const ocrLoading = reactive<ArchiveOcrState>({})
  const ocrDone = reactive<ArchiveOcrState>({})
  const hpzlDict = ref<ArchiveDictOption[]>([])
  const syxzDict = ref<ArchiveDictOption[]>([])
  const rlzlDict = ref<ArchiveDictOption[]>([])
  const cllxOptions = ref<CllxCascadeNode[]>([])

  const cascaderOptions = computed(() => cllxOptions.value as unknown as CascaderOption[])
  const ocrFilled = computed(
    () => !!(ocrDone.driving_front || ocrDone.driving_back || ocrDone.driving_both || ocrDone.cert)
  )

  async function loadDict(type: string, fallback: ArchiveDictOption[]) {
    try {
      const res = await fetchDataDictList({ dict_type: type, status: 1, page: 1, limit: 200 })
      const list = (res.list || []).map((i) => ({
        label: i.dict_label || String(i.dict_value ?? ''),
        value: String(i.dict_value ?? '')
      }))
      return list.length ? list : fallback
    } catch {
      return fallback
    }
  }

  async function loadOptions() {
    const [hpzl, syxz, rlzl, cascade] = await Promise.all([
      loadDict('hpzl', FALLBACK_HPZL),
      loadDict('syxz', FALLBACK_SYXZ),
      loadDict('rlzl', FALLBACK_RLZL),
      fetchCllxCascade().catch(() => [] as CllxCascadeNode[])
    ])
    hpzlDict.value = hpzl
    syxzDict.value = syxz
    rlzlDict.value = rlzl
    cllxOptions.value = cascade || []
  }

  function clearOcrState() {
    Object.keys(ocrLoading).forEach((k) => delete ocrLoading[k])
    Object.keys(ocrDone).forEach((k) => delete ocrDone[k])
  }

  function onCllxChange(val: unknown) {
    form.value.cllx = val == null || Array.isArray(val) ? '' : String(val)
  }

  async function handleUpload(field: keyof ArchiveVehicleImages, file: File) {
    const url = await fetchAcceptUploadImage({
      file,
      vehicle_id: props.vehicleId,
      field
    })
    if (url) images.value[field] = url
  }

  function handleRemove(field: keyof ArchiveVehicleImages) {
    images.value[field] = ''
    const ocrKey = VEHICLE_OCR_KEY[field]
    if (ocrKey) {
      delete ocrDone[ocrKey]
      delete ocrLoading[ocrKey]
    }
  }

  async function runDrivingOcr(side: 'front' | 'back' | 'both') {
    const fieldMap = { front: 'xszzp', back: 'xszzpfy', both: 'xszbmzp' } as const
    const labelMap = { front: '正页', back: '副页', both: '正副背面' } as const
    const keyMap = { front: 'driving_front', back: 'driving_back', both: 'driving_both' } as const
    const field = fieldMap[side]
    const url = images.value[field]
    if (!url) {
      ElMessage.warning(`请先上传行驶证${labelMap[side]}照片`)
      return
    }
    const key = keyMap[side]
    ocrLoading[key] = true
    try {
      const data = await fetchAcceptRecognizeDrivingLicense(url)
      applyDrivingOcrResult(data as unknown as Record<string, unknown>, form.value, props.ownerForm)
      if (data.vehicle_type) cllxPath.value = str(data.vehicle_type)
      ocrDone[key] = true
      ElMessage.success('OCR识别成功')
    } finally {
      ocrLoading[key] = false
    }
  }

  async function runRegCertOcr() {
    if (!images.value.czzp) {
      ElMessage.warning('请先上传产证一二页照片')
      return
    }
    ocrLoading.cert = true
    try {
      const data = await fetchAcceptRecognizeRegCert(images.value.czzp)
      applyRegCertOcrResult(data as Record<string, unknown>, form.value)
      if (data.vehicle_type) cllxPath.value = str(data.vehicle_type)
      ocrDone.cert = true
      ElMessage.success('OCR识别成功')
    } finally {
      ocrLoading.cert = false
    }
  }

  async function save() {
    await fetchAcceptSaveVehicle({
      vehicle_id: props.vehicleId,
      hplx: props.hplx,
      ...form.value,
      xszzp: images.value.xszzp || '',
      xszzpfy: images.value.xszzpfy || '',
      xszbmzp: images.value.xszbmzp || '',
      czzp: images.value.czzp || ''
    } as never)
  }

  defineExpose({ save, clearOcrState, loadOptions, handleUpload, handleRemove })
</script>
