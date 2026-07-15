<template>
  <div class="ae-readonly-box">
    <div class="ae-readonly-head">
      <span>
        报废机动车回收证明
        <span class="ae-readonly-badge">商务部同步 · 只读</span>
      </span>
      <ElButton size="small" type="primary" @click="handleCertificateAction">下载</ElButton>
    </div>
    <div class="ae-cert-preview">
      <div v-if="scrapFilesLoading" class="ae-cert-empty">加载回收证明数据...</div>
      <div v-else-if="scrapDjid" class="ae-cert-empty">
        登记单号：{{ scrapDjid }}，可点击右上角查看/下载完整回收证明
      </div>
      <div v-else class="ae-cert-empty">暂无回收证明数据</div>
    </div>
  </div>

  <div v-if="readonly" class="ae-material-tip warn">
    <ArtSvgIcon icon="ri:error-warning-line" class="ae-material-tip-icon" />
    <span>已提交至商务部，材料不可修改，但可点击查看大图。</span>
  </div>
  <div v-else class="ae-material-tip">
    所有材料支持上传、预览、删除；核心材料均支持上传"缺失情况说明图片"作为替代凭证。
  </div>

  <div class="ae-section-title">所有人证件材料</div>
  <div class="ae-ocr-grid" :class="isCompany ? '' : 'cols-3'">
    <template v-if="isCompany">
      <UploadSlot
        label="营业执照原件"
        required
        :url="ownerImages.syrzp"
        :readonly="readonly"
        @upload="(file) => handleOwnerUpload('syrzp', file)"
        @remove="handleOwnerRemove('syrzp')"
      />
      <UploadSlot
        label="缺失情况说明"
        :url="ownerImages.qksmzp"
        :readonly="readonly"
        @upload="(file) => handleOwnerUpload('qksmzp', file)"
        @remove="handleOwnerRemove('qksmzp')"
      />
    </template>
    <template v-else>
      <UploadSlot
        label="身份证正面"
        required
        :url="ownerImages.sfz1zp || ownerImages.syrzp"
        :readonly="readonly"
        @upload="(file) => handleOwnerUpload('sfz1zp', file)"
        @remove="handleOwnerRemove('sfz1zp')"
      />
      <UploadSlot
        label="身份证反面"
        required
        :url="ownerImages.sfz2zp"
        :readonly="readonly"
        @upload="(file) => handleOwnerUpload('sfz2zp', file)"
        @remove="handleOwnerRemove('sfz2zp')"
      />
      <UploadSlot
        label="缺失情况说明"
        :url="ownerImages.qksmzp"
        :readonly="readonly"
        @upload="(file) => handleOwnerUpload('qksmzp', file)"
        @remove="handleOwnerRemove('qksmzp')"
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
      @upload="(file) => handleVehicleUpload('xszzp', file)"
      @remove="handleVehicleRemove('xszzp')"
    />
    <UploadSlot
      label="行驶证副页"
      required
      :url="vehicleImages.xszzpfy"
      :readonly="readonly"
      @upload="(file) => handleVehicleUpload('xszzpfy', file)"
      @remove="handleVehicleRemove('xszzpfy')"
    />
    <UploadSlot
      label="正副背面"
      required
      :url="vehicleImages.xszbmzp"
      :readonly="readonly"
      @upload="(file) => handleVehicleUpload('xszbmzp', file)"
      @remove="handleVehicleRemove('xszbmzp')"
    />
    <UploadSlot
      label="产证一二页"
      required
      :url="vehicleImages.czzp"
      :readonly="readonly"
      @upload="(file) => handleVehicleUpload('czzp', file)"
      @remove="handleVehicleRemove('czzp')"
    />
  </div>
  <div class="ae-ocr-grid cols-4" style="margin-top: 12px">
    <UploadSlot
      label="产权变更页（如有）"
      :url="ownerImages.blpzzp"
      :readonly="readonly"
      @upload="(file) => handleOwnerUpload('blpzzp', file)"
      @remove="handleOwnerRemove('blpzzp')"
    />
  </div>

  <div class="ae-section-title">拖车进场照片</div>
  <div v-if="readonly" class="ae-ocr-grid cols-4">
    <ReadonlyPhoto
      v-for="item in TOW_READONLY_ITEMS"
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
      @upload="(file) => handleMaterialUpload('photo_front', file)"
      @remove="handleMaterialRemove('photo_front')"
    />
    <UploadSlot
      label="整车照"
      required
      :url="materialImages.photo_side"
      @upload="(file) => handleMaterialUpload('photo_side', file)"
      @remove="handleMaterialRemove('photo_side')"
    />
    <UploadSlot
      label="车架拓印照"
      :url="materialImages.photo_back"
      @upload="(file) => handleMaterialUpload('photo_back', file)"
      @remove="handleMaterialRemove('photo_back')"
    />
    <UploadSlot
      label="车架号照"
      :url="materialImages.photo_interior"
      @upload="(file) => handleMaterialUpload('photo_interior', file)"
      @remove="handleMaterialRemove('photo_interior')"
    />
  </div>

  <div class="ae-section-title">代理人证件材料</div>
  <div class="ae-ocr-grid">
    <UploadSlot
      label="代理人身份证正面"
      required
      :url="agentImages.jbrsfz1zp"
      :readonly="readonly"
      @upload="(file) => handleAgentUpload('jbrsfz1zp', file)"
      @remove="handleAgentRemove('jbrsfz1zp')"
    />
    <UploadSlot
      label="代理人身份证反面"
      required
      :url="agentImages.jbrsfz2zp"
      :readonly="readonly"
      @upload="(file) => handleAgentUpload('jbrsfz2zp', file)"
      @remove="handleAgentRemove('jbrsfz2zp')"
    />
    <UploadSlot
      label="委托说明"
      required
      :url="agentImages.jbrzp"
      :readonly="readonly"
      @upload="(file) => handleAgentUpload('jbrzp', file)"
      @remove="handleAgentRemove('jbrzp')"
    />
  </div>

  <div class="ae-material-tip warn">
    <ArtSvgIcon icon="ri:error-warning-line" class="ae-material-tip-icon" />
    <span>以下照片是从商务部系统同步的，数据不可在本系统修改。</span>
  </div>

  <div class="ae-readonly-box">
    <div class="ae-readonly-head">
      <span>报废车拆解照片 <span class="ae-readonly-badge">本地缓存 · 只读</span></span>
    </div>
    <div class="ae-readonly-grid">
      <ReadonlyPhoto
        v-for="item in DISMANTLE_PHOTO_ITEMS"
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
        v-for="item in CANCEL_PHOTO_ITEMS"
        :key="item.field"
        :item="item"
        :url="getScrapFileUrl(item.field)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { fetchAcceptFilesCache, fetchAcceptUploadImage } from '@/api/recycle/accept'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { ElMessage } from 'element-plus'
  import {
    CANCEL_PHOTO_ITEMS,
    DISMANTLE_PHOTO_ITEMS,
    TOW_READONLY_ITEMS
  } from './archive-constants'
  import { str } from './archive-utils'
  import ReadonlyPhoto from './readonly-photo.vue'
  import UploadSlot from './upload-slot.vue'
  import type {
    ArchiveAgentImages,
    ArchiveCacheFile,
    ArchiveMaterialImages,
    ArchiveOwnerImages,
    ArchiveVehicleImages
  } from './types'

  defineOptions({ name: 'VehicleArchiveMaterialsStep' })

  const props = defineProps<{
    /** 车辆 ID。 */
    vehicleId: number
    /** 是否为企业或单位所有人。 */
    isCompany: boolean
    /** 是否只读。 */
    readonly: boolean
  }>()

  const ownerImages = defineModel<ArchiveOwnerImages>('ownerImages', { required: true })
  const vehicleImages = defineModel<ArchiveVehicleImages>('vehicleImages', { required: true })
  const agentImages = defineModel<ArchiveAgentImages>('agentImages', { required: true })
  const materialImages = defineModel<ArchiveMaterialImages>('materialImages', { required: true })

  const scrapDjid = ref('')
  const scrapFilesLoading = ref(false)
  const scrapCacheFiles = ref<Record<string, ArchiveCacheFile>>({})

  function getScrapFileUrl(field: string) {
    const fileData = scrapCacheFiles.value[field]
    if (!fileData) return ''
    if (typeof fileData === 'string') return fileData
    return fileData.url || ''
  }

  function clearScrapFiles() {
    scrapCacheFiles.value = {}
    scrapDjid.value = ''
  }

  async function loadScrapFiles() {
    if (!props.vehicleId || scrapFilesLoading.value) return
    scrapFilesLoading.value = true
    try {
      const res = await fetchAcceptFilesCache(props.vehicleId)
      scrapCacheFiles.value = (res.bfcj || {}) as Record<string, ArchiveCacheFile>
      scrapDjid.value = str(res.djid)
    } catch {
      scrapCacheFiles.value = {}
      scrapDjid.value = ''
    } finally {
      scrapFilesLoading.value = false
    }
  }

  async function uploadImage(field: string, file: File) {
    return fetchAcceptUploadImage({
      file,
      vehicle_id: props.vehicleId,
      field
    })
  }

  async function handleOwnerUpload(field: keyof ArchiveOwnerImages, file: File) {
    const url = await uploadImage(field, file)
    if (url) {
      ownerImages.value[field] = url
      if (field === 'sfz1zp') ownerImages.value.syrzp = url
    }
  }

  function handleOwnerRemove(field: keyof ArchiveOwnerImages) {
    ownerImages.value[field] = ''
    if (field === 'sfz1zp') ownerImages.value.syrzp = ''
  }

  async function handleVehicleUpload(field: keyof ArchiveVehicleImages, file: File) {
    const url = await uploadImage(field, file)
    if (url) vehicleImages.value[field] = url
  }

  function handleVehicleRemove(field: keyof ArchiveVehicleImages) {
    vehicleImages.value[field] = ''
  }

  async function handleAgentUpload(field: keyof ArchiveAgentImages, file: File) {
    const url = await uploadImage(field, file)
    if (url) agentImages.value[field] = url
  }

  function handleAgentRemove(field: keyof ArchiveAgentImages) {
    agentImages.value[field] = ''
  }

  async function handleMaterialUpload(field: keyof ArchiveMaterialImages, file: File) {
    const url = await uploadImage(field, file)
    if (url) materialImages.value[field] = url
  }

  function handleMaterialRemove(field: keyof ArchiveMaterialImages) {
    materialImages.value[field] = ''
  }

  function handleCertificateAction() {
    if (!scrapDjid.value) {
      ElMessage.warning('暂无回收证明数据')
      return
    }
    window.open(`https://bfc.chexinmeng.com/hszma4?id=${scrapDjid.value}`, '_blank')
  }

  defineExpose({ loadScrapFiles, clearScrapFiles })
</script>
