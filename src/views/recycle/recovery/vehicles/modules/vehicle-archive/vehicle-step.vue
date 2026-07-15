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
        @upload="(file) => emit('upload', 'xszzp', file)"
        @remove="emit('remove', 'xszzp')"
        @ocr="emit('ocr-driving', 'front')"
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
        @upload="(file) => emit('upload', 'xszzpfy', file)"
        @remove="emit('remove', 'xszzpfy')"
        @ocr="emit('ocr-driving', 'back')"
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
        @upload="(file) => emit('upload', 'xszbmzp', file)"
        @remove="emit('remove', 'xszbmzp')"
        @ocr="emit('ocr-driving', 'both')"
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
        @upload="(file) => emit('upload', 'czzp', file)"
        @remove="emit('remove', 'czzp')"
        @ocr="emit('ocr-cert')"
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
                v-for="option in hpzlOptions"
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
              @change="emit('change-cllx', $event)"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="使用性质">
            <ElSelect v-model="form.syxz" placeholder="请选择" filterable clearable>
              <ElOption
                v-for="option in syxzOptions"
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
                v-for="option in rlzlOptions"
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
  import type { CllxCascadeNode } from '@/types/recycle/data-dict'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { CascaderOption } from 'element-plus'
  import UploadSlot from './upload-slot.vue'
  import type {
    ArchiveDictOption,
    ArchiveOcrState,
    ArchiveVehicleForm,
    ArchiveVehicleImages
  } from './types'

  defineOptions({ name: 'VehicleArchiveVehicleStep' })

  interface Props {
    /** 车辆证件图片。 */
    images: ArchiveVehicleImages
    /** 号牌种类选项。 */
    hpzlOptions: ArchiveDictOption[]
    /** 使用性质选项。 */
    syxzOptions: ArchiveDictOption[]
    /** 燃料种类选项。 */
    rlzlOptions: ArchiveDictOption[]
    /** 车辆类型级联选项。 */
    cllxOptions: CllxCascadeNode[]
    /** OCR 加载状态。 */
    ocrLoading: ArchiveOcrState
    /** OCR 完成状态。 */
    ocrDone: ArchiveOcrState
    /** 是否已有 OCR 字段回填。 */
    ocrFilled: boolean
    /** 是否只读。 */
    readonly: boolean
  }

  const props = defineProps<Props>()

  const cascaderOptions = computed(() => props.cllxOptions as unknown as CascaderOption[])

  /** 车辆表单模型。 */
  const form = defineModel<ArchiveVehicleForm>('form', { required: true })
  /** 当前车辆类型值。 */
  const cllxPath = defineModel<string>('cllxPath', { required: true })

  const emit = defineEmits<{
    /** 上传车辆证件。 */
    upload: [field: keyof ArchiveVehicleImages, file: File]
    /** 删除车辆证件。 */
    remove: [field: keyof ArchiveVehicleImages]
    /** 识别行驶证。 */
    'ocr-driving': [side: 'front' | 'back' | 'both']
    /** 识别机动车登记证书。 */
    'ocr-cert': []
    /** 修改车辆类型。 */
    'change-cllx': [value: unknown]
  }>()
</script>
