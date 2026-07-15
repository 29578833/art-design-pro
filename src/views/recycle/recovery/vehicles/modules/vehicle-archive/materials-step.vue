<template>
  <div class="ae-readonly-box">
    <div class="ae-readonly-head">
      <span>
        报废机动车回收证明
        <span class="ae-readonly-badge">商务部同步 · 只读</span>
      </span>
      <ElButton size="small" type="primary" @click="emit('download-certificate')">下载</ElButton>
    </div>
    <div class="ae-cert-preview">
      <div v-if="scrapFilesLoading" class="ae-cert-empty">加载回收证明数据...</div>
      <div v-else-if="scrapDjid" class="ae-cert-empty">
        登记单号：{{ scrapDjid }}，可点击右上角查看/下载完整回收证明
      </div>
      <div v-else class="ae-cert-empty">暂无回收证明数据</div>
    </div>
  </div>

  <div class="ae-material-tip" :class="{ warn: readonly }">
    <ArtSvgIcon :icon="readonly ? 'ri:error-warning-line' : 'ri:information-line'" />
    {{
      readonly
        ? '已提交至商务部，材料不可修改，但可点击查看大图。'
        : '所有材料支持单/多图上传、预览、删除；核心材料均支持上传“缺失情况说明图片”作为替代凭证。'
    }}
  </div>

  <div class="ae-section-title">所有人证件材料</div>
  <div class="ae-ocr-grid" :class="isCompany ? '' : 'cols-3'">
    <template v-if="isCompany">
      <UploadSlot
        label="营业执照原件"
        required
        :url="ownerImages.syrzp"
        :readonly="readonly"
        @upload="(file) => emit('upload-owner', 'syrzp', file)"
        @remove="emit('remove-owner', 'syrzp')"
      />
      <UploadSlot
        label="缺失情况说明"
        :url="ownerImages.qksmzp"
        :readonly="readonly"
        @upload="(file) => emit('upload-owner', 'qksmzp', file)"
        @remove="emit('remove-owner', 'qksmzp')"
      />
    </template>
    <template v-else>
      <UploadSlot
        label="身份证正面"
        required
        :url="ownerImages.sfz1zp || ownerImages.syrzp"
        :readonly="readonly"
        @upload="(file) => emit('upload-owner', 'sfz1zp', file)"
        @remove="emit('remove-owner', 'sfz1zp')"
      />
      <UploadSlot
        label="身份证反面"
        required
        :url="ownerImages.sfz2zp"
        :readonly="readonly"
        @upload="(file) => emit('upload-owner', 'sfz2zp', file)"
        @remove="emit('remove-owner', 'sfz2zp')"
      />
      <UploadSlot
        label="缺失情况说明"
        :url="ownerImages.qksmzp"
        :readonly="readonly"
        @upload="(file) => emit('upload-owner', 'qksmzp', file)"
        @remove="emit('remove-owner', 'qksmzp')"
      />
    </template>
  </div>

  <div class="ae-section-title">车辆证件材料</div>
  <div class="ae-ocr-grid cols-4">
    <UploadSlot
      label="行驶证正页"
      required
      :url="vehicleImages.xszzp"
      :readonly="readonly"
      @upload="(file) => emit('upload-vehicle', 'xszzp', file)"
      @remove="emit('remove-vehicle', 'xszzp')"
    />
    <UploadSlot
      label="行驶证副页"
      required
      :url="vehicleImages.xszzpfy"
      :readonly="readonly"
      @upload="(file) => emit('upload-vehicle', 'xszzpfy', file)"
      @remove="emit('remove-vehicle', 'xszzpfy')"
    />
    <UploadSlot
      label="正副背面"
      required
      :url="vehicleImages.xszbmzp"
      :readonly="readonly"
      @upload="(file) => emit('upload-vehicle', 'xszbmzp', file)"
      @remove="emit('remove-vehicle', 'xszbmzp')"
    />
    <UploadSlot
      label="产证一二页"
      required
      :url="vehicleImages.czzp"
      :readonly="readonly"
      @upload="(file) => emit('upload-vehicle', 'czzp', file)"
      @remove="emit('remove-vehicle', 'czzp')"
    />
  </div>
  <div class="ae-ocr-grid cols-4" style="margin-top: 12px">
    <UploadSlot
      label="产权变更页（如有）"
      :url="ownerImages.blpzzp"
      :readonly="readonly"
      @upload="(file) => emit('upload-owner', 'blpzzp', file)"
      @remove="emit('remove-owner', 'blpzzp')"
    />
  </div>

  <div class="ae-section-title">拖车进场照片</div>
  <div v-if="readonly" class="ae-ocr-grid cols-4">
    <ReadonlyPhoto
      v-for="item in towReadonlyItems"
      :key="item.field"
      :item="item"
      :url="getScrapFileUrl(item.field)"
    />
  </div>
  <div v-else class="ae-ocr-grid cols-4">
    <UploadSlot
      label="拖车单"
      required
      :url="materialImages.photo_front"
      @upload="(file) => emit('upload-material', 'photo_front', file)"
      @remove="emit('remove-material', 'photo_front')"
    />
    <UploadSlot
      label="整车照"
      required
      :url="materialImages.photo_side"
      @upload="(file) => emit('upload-material', 'photo_side', file)"
      @remove="emit('remove-material', 'photo_side')"
    />
    <UploadSlot
      label="车架拓印照"
      :url="materialImages.photo_back"
      @upload="(file) => emit('upload-material', 'photo_back', file)"
      @remove="emit('remove-material', 'photo_back')"
    />
    <UploadSlot
      label="车架号照"
      :url="materialImages.photo_interior"
      @upload="(file) => emit('upload-material', 'photo_interior', file)"
      @remove="emit('remove-material', 'photo_interior')"
    />
  </div>

  <div class="ae-section-title">代理人证件材料</div>
  <div class="ae-ocr-grid">
    <UploadSlot
      label="代理人身份证正面"
      required
      :url="agentImages.jbrsfz1zp"
      :readonly="readonly"
      @upload="(file) => emit('upload-agent', 'jbrsfz1zp', file)"
      @remove="emit('remove-agent', 'jbrsfz1zp')"
    />
    <UploadSlot
      label="代理人身份证反面"
      required
      :url="agentImages.jbrsfz2zp"
      :readonly="readonly"
      @upload="(file) => emit('upload-agent', 'jbrsfz2zp', file)"
      @remove="emit('remove-agent', 'jbrsfz2zp')"
    />
    <UploadSlot
      label="委托说明"
      required
      :url="agentImages.jbrzp"
      :readonly="readonly"
      @upload="(file) => emit('upload-agent', 'jbrzp', file)"
      @remove="emit('remove-agent', 'jbrzp')"
    />
  </div>

  <div class="ae-material-tip warn">
    <ArtSvgIcon icon="ri:error-warning-line" />
    以下照片是从商务部系统同步的，数据不可在本系统修改。
  </div>

  <div class="ae-readonly-box">
    <div class="ae-readonly-head">
      <span>报废车拆解照片 <span class="ae-readonly-badge">本地缓存 · 只读</span></span>
    </div>
    <div class="ae-readonly-grid">
      <ReadonlyPhoto
        v-for="item in dismantlePhotoItems"
        :key="item.field"
        :item="item"
        :url="getScrapFileUrl(item.field)"
      />
    </div>
  </div>

  <div class="ae-readonly-box">
    <div class="ae-readonly-head">
      <span>办证注销 <span class="ae-readonly-badge">商务部同步 · 只读</span></span>
    </div>
    <div class="ae-readonly-grid">
      <div class="ae-readonly-photo">
        <div class="ae-readonly-photo-label">回收证明</div>
        <div class="ae-readonly-slot">
          <ArtSvgIcon icon="ri:camera-line" style="margin-bottom: 4px; font-size: 20px" />
          {{ scrapDjid ? '已领取' : '未领取' }}
        </div>
      </div>
      <ReadonlyPhoto
        v-for="item in cancelPhotoItems"
        :key="item.field"
        :item="item"
        :url="getScrapFileUrl(item.field)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ReadonlyPhoto from './readonly-photo.vue'
  import UploadSlot from './upload-slot.vue'
  import type {
    ArchiveAgentImages,
    ArchiveMaterialImages,
    ArchiveOwnerImages,
    ArchivePhotoItem,
    ArchiveVehicleImages
  } from './types'

  defineOptions({ name: 'VehicleArchiveMaterialsStep' })

  interface Props {
    /** 是否为企业或单位所有人。 */
    isCompany: boolean
    /** 是否只读。 */
    readonly: boolean
    /** 回收登记单号。 */
    scrapDjid: string
    /** 回收证明文件是否加载中。 */
    scrapFilesLoading: boolean
    /** 所有人证件图片。 */
    ownerImages: ArchiveOwnerImages
    /** 车辆证件图片。 */
    vehicleImages: ArchiveVehicleImages
    /** 代理人证件图片。 */
    agentImages: ArchiveAgentImages
    /** 进场材料图片。 */
    materialImages: ArchiveMaterialImages
    /** 拖车只读照片配置。 */
    towReadonlyItems: ArchivePhotoItem[]
    /** 拆解只读照片配置。 */
    dismantlePhotoItems: ArchivePhotoItem[]
    /** 注销只读照片配置。 */
    cancelPhotoItems: ArchivePhotoItem[]
    /** 按后端字段名获取商务部缓存图片地址。 */
    getScrapFileUrl: (field: string) => string
  }

  defineProps<Props>()

  const emit = defineEmits<{
    /** 下载回收证明。 */
    'download-certificate': []
    /** 上传所有人材料。 */
    'upload-owner': [field: keyof ArchiveOwnerImages, file: File]
    /** 删除所有人材料。 */
    'remove-owner': [field: keyof ArchiveOwnerImages]
    /** 上传车辆材料。 */
    'upload-vehicle': [field: keyof ArchiveVehicleImages, file: File]
    /** 删除车辆材料。 */
    'remove-vehicle': [field: keyof ArchiveVehicleImages]
    /** 上传代理人材料。 */
    'upload-agent': [field: keyof ArchiveAgentImages, file: File]
    /** 删除代理人材料。 */
    'remove-agent': [field: keyof ArchiveAgentImages]
    /** 上传进场材料。 */
    'upload-material': [field: keyof ArchiveMaterialImages, file: File]
    /** 删除进场材料。 */
    'remove-material': [field: keyof ArchiveMaterialImages]
  }>()
</script>
