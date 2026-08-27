<template>
  <RecycleCertificate :djid="scrapDjid" :loading="scrapFilesLoading" />

  <div v-if="readonly" class="ae-material-tip warn">
    <ArtSvgIcon icon="ri:error-warning-line" class="ae-material-tip-icon" />
    <span>已提交至商务部，材料不可修改，但可点击查看大图。</span>
  </div>
  <div v-else class="ae-material-tip">
    所有材料支持上传、预览、删除；核心材料均支持上传"缺失情况说明图片"作为替代凭证。
  </div>

  <div class="vd-cert-card">
    <div class="vd-cert-head">
      <div class="vd-cert-head-left">
        <span class="vd-cert-head-title">所有人证件材料</span>
      </div>
      <UploadBatchTrigger
        v-if="!readonly"
        :loading="ownerBatchUploading"
        @select="(files) => handleOwnerBatchUpload(files)"
      />
    </div>
    <div class="vd-cert-body">
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
    </div>
  </div>

  <div class="vd-cert-card">
    <div class="vd-cert-head">
      <div class="vd-cert-head-left">
        <span class="vd-cert-head-title">车辆证件材料</span>
      </div>
      <UploadBatchTrigger
        v-if="!readonly"
        :loading="vehicleBatchUploading"
        @select="(files) => handleVehicleBatchUpload(files)"
      />
    </div>
    <div class="vd-cert-body">
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
    </div>
  </div>

  <div class="vd-cert-card">
    <div class="vd-cert-head">
      <div class="vd-cert-head-left">
        <span class="vd-cert-head-title">代理人证件材料</span>
      </div>
      <UploadBatchTrigger
        v-if="!readonly"
        :loading="agentBatchUploading"
        @select="(files) => handleAgentBatchUpload(files)"
      />
    </div>
    <div class="vd-cert-body">
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
    </div>
  </div>

  <div class="vd-cert-card">
    <div class="vd-cert-head">
      <div class="vd-cert-head-left">
        <span class="vd-cert-head-title">拖车进场照片</span>
        <span class="vd-cert-tag">质检同步 · 只读</span>
      </div>
    </div>
    <div class="vd-cert-body">
      <div class="vd-photo-grid cols-4">
        <ReadonlyPhoto
          v-for="(item, index) in ENTRY_PHOTO_ITEMS"
          :key="item.field"
          :item="item"
          :url="getEntryPhotoUrl(item.field)"
          :preview-src-list="entryPreviewList"
          :initial-index="previewIndexAt(entryPhotoUrls, index)"
        />
      </div>
    </div>
  </div>

  <div class="ae-material-tip warn">
    <ArtSvgIcon icon="ri:error-warning-line" class="ae-material-tip-icon" />
    <span>以下照片是从商务部系统同步的，数据不可在本系统修改。</span>
  </div>

  <div class="vd-cert-card">
    <div class="vd-cert-head">
      <div class="vd-cert-head-left">
        <span class="vd-cert-head-title">报废车拆解照片</span>
        <span class="vd-cert-tag">本地缓存 · 只读</span>
      </div>
    </div>
    <div class="vd-cert-body">
      <div class="vd-photo-grid cols-4">
        <ReadonlyPhoto
          v-for="(item, index) in DISMANTLE_PHOTO_ITEMS"
          :key="item.field"
          :item="item"
          :url="getDismantlePhotoUrl(item.field)"
          :preview-src-list="dismantlePreviewList"
          :initial-index="previewIndexAt(dismantlePhotoUrls, index)"
        />
      </div>
    </div>
  </div>

  <div class="vd-cert-card">
    <div class="vd-cert-head">
      <div class="vd-cert-head-left">
        <span class="vd-cert-head-title">办证注销</span>
        <span class="vd-cert-tag">商务部同步 · 只读</span>
      </div>
    </div>
    <div class="vd-cert-body">
      <div class="vd-photo-grid cols-4">
        <div class="vd-photo-slot">
          <div class="vd-photo-label-top">回收证明</div>
          <div class="vd-photo-box vd-receipt-card" @click="handleCertificateAction">
            <span class="vd-receipt-card__link">点击查看</span>
            <span class="vd-receipt-card__status">
              拍摄情况：<em :class="{ done: !!scrapDjid }">{{ scrapDjid ? '已领取' : '未领取' }}</em>
            </span>
          </div>
        </div>
        <ReadonlyPhoto
          v-for="(item, index) in CANCEL_PHOTO_ITEMS"
          :key="item.field"
          :item="item"
          :url="getScrapFileUrl(item.field)"
          :preview-src-list="cancelPreviewList"
          :initial-index="previewIndexAt(cancelPhotoUrls, index)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { fetchAcceptFilesCache, fetchAcceptUploadImage } from '@/api/recycle/accept'
  import { fetchQualityByOrder } from '@/api/recycle/quality'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { ElMessage } from 'element-plus'
  import {
    CANCEL_PHOTO_ITEMS,
    DISMANTLE_PHOTO_ITEMS,
    ENTRY_PHOTO_ITEMS
  } from './archive-constants'
  import { previewIndexAt, resolveDismantlePhotoUrl, str, batchFillUploadSlots } from './archive-utils'
  import ReadonlyPhoto from './readonly-photo.vue'
  import RecycleCertificate from './recycle-certificate.vue'
  import UploadBatchTrigger from './upload-batch-trigger.vue'
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
    /** 关联订单 ID，用于拉取质检入场照片。 */
    orderId?: number
    /** 是否为企业或单位所有人。 */
    isCompany: boolean
    /** 是否只读。 */
    readonly: boolean
    /** vehicle/detail 拆解照片，bfcj 无值时回退。 */
    dismantlePhotos?: Record<string, string> | null
  }>()

  const ownerImages = defineModel<ArchiveOwnerImages>('ownerImages', { required: true })
  const vehicleImages = defineModel<ArchiveVehicleImages>('vehicleImages', { required: true })
  const agentImages = defineModel<ArchiveAgentImages>('agentImages', { required: true })
  const materialImages = defineModel<ArchiveMaterialImages>('materialImages', { required: true })

  const scrapDjid = ref('')
  const scrapFilesLoading = ref(false)
  const scrapCacheFiles = ref<Record<string, ArchiveCacheFile>>({})
  const entryPhotos = ref<Record<string, string>>({})
  const ownerBatchUploading = ref(false)
  const vehicleBatchUploading = ref(false)
  const agentBatchUploading = ref(false)

  const ownerUploadFields = computed((): (keyof ArchiveOwnerImages)[] =>
    props.isCompany ? ['syrzp', 'qksmzp'] : ['sfz1zp', 'sfz2zp', 'qksmzp']
  )

  const vehicleUploadFields: (keyof ArchiveVehicleImages | keyof ArchiveOwnerImages)[] = [
    'xszzp',
    'xszzpfy',
    'xszbmzp',
    'czzp',
    'blpzzp'
  ]

  const agentUploadFields: (keyof ArchiveAgentImages)[] = ['jbrsfz1zp', 'jbrsfz2zp', 'jbrzp']

  function getScrapFileUrl(field: string) {
    const fileData = scrapCacheFiles.value[field]
    if (!fileData) return ''
    if (typeof fileData === 'string') return fileData
    return fileData.url || ''
  }

  function getDismantlePhotoUrl(field: string) {
    return resolveDismantlePhotoUrl(field, scrapCacheFiles.value, props.dismantlePhotos)
  }

  function getEntryPhotoUrl(field: string) {
    return entryPhotos.value[field] || ''
  }

  const entryPhotoUrls = computed(() =>
    ENTRY_PHOTO_ITEMS.map((item) => getEntryPhotoUrl(item.field))
  )
  const entryPreviewList = computed(() => entryPhotoUrls.value.filter(Boolean))

  const dismantlePhotoUrls = computed(() =>
    DISMANTLE_PHOTO_ITEMS.map((item) => getDismantlePhotoUrl(item.field))
  )
  const dismantlePreviewList = computed(() => dismantlePhotoUrls.value.filter(Boolean))

  const cancelPhotoUrls = computed(() =>
    CANCEL_PHOTO_ITEMS.map((item) => getScrapFileUrl(item.field))
  )
  const cancelPreviewList = computed(() => cancelPhotoUrls.value.filter(Boolean))

  function clearScrapFiles() {
    scrapCacheFiles.value = {}
    scrapDjid.value = ''
    entryPhotos.value = {}
  }

  async function loadEntryPhotos() {
    const orderId = Number(props.orderId || 0)
    if (!orderId) {
      entryPhotos.value = {}
      return
    }
    try {
      const res = await fetchQualityByOrder(orderId, props.vehicleId)
      if (res) {
        entryPhotos.value = {
          full_image: str(res.full_image),
          vin_rub_image: str(res.vin_rub_image),
          vin_image: str(res.vin_image),
          engine_image: str(res.engine_image),
          other_image: str(res.other_image)
        }
      } else {
        entryPhotos.value = {}
      }
    } catch {
      entryPhotos.value = {}
    }
  }

  async function loadScrapFiles() {
    if (!props.vehicleId || scrapFilesLoading.value) return
    scrapFilesLoading.value = true
    try {
      const res = await fetchAcceptFilesCache(props.vehicleId)
      scrapCacheFiles.value = (res.bfcj || {}) as Record<string, ArchiveCacheFile>
      scrapDjid.value = str(res.djid)
      await loadEntryPhotos()
    } catch {
      scrapCacheFiles.value = {}
      scrapDjid.value = ''
      entryPhotos.value = {}
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

  async function runBatchUpload<T extends string>(
    loading: Ref<boolean>,
    fields: readonly T[],
    upload: (field: T, file: File) => Promise<void>,
    files: File[]
  ) {
    if (props.readonly || loading.value || !files.length) return
    loading.value = true
    try {
      const { filled, excess } = await batchFillUploadSlots(fields, files, upload)
      if (!filled) {
        ElMessage.warning('未能上传图片，请重试')
      } else if (excess > 0) {
        ElMessage.warning(`已按顺序填入 ${filled} 张，还有 ${excess} 张超出槽位`)
      } else {
        ElMessage.success(`已按顺序上传 ${filled} 张图片`)
      }
    } finally {
      loading.value = false
    }
  }

  function handleOwnerBatchUpload(files: File[]) {
    return runBatchUpload(ownerBatchUploading, ownerUploadFields.value, handleOwnerUpload, files)
  }

  async function handleVehicleFieldUpload(
    field: keyof ArchiveVehicleImages | 'blpzzp',
    file: File
  ) {
    if (field === 'blpzzp') {
      await handleOwnerUpload('blpzzp', file)
      return
    }
    await handleVehicleUpload(field, file)
  }

  function handleVehicleBatchUpload(files: File[]) {
    return runBatchUpload(
      vehicleBatchUploading,
      vehicleUploadFields,
      handleVehicleFieldUpload,
      files
    )
  }

  function handleAgentBatchUpload(files: File[]) {
    return runBatchUpload(agentBatchUploading, agentUploadFields, handleAgentUpload, files)
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
