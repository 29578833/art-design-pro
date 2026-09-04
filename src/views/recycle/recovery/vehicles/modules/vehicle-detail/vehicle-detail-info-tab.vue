<template>
  <div class="vd-info">
    <div class="vd-section">
      <div class="vd-section-title">关联单号</div>
      <div class="vd-section-box">
        <div class="vd-row">
          <span class="vd-row-label">车辆档案单号</span
          ><span class="vd-row-value mono">{{
            detail.vehicle_no || detail.archive_no || '—'
          }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">关联回收订单号</span
          ><span class="vd-row-value link">{{ detail.order_no || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">关联拖车订单号</span
          ><span class="vd-row-value">{{ detail.tow_order_no || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">线索单号</span
          ><span class="vd-row-value">{{ detail.lead_no || '—' }}</span>
        </div>
      </div>
    </div>

    <div class="vd-photo-section">
      <div class="vd-photo-section-head">
        <span class="vd-section-title">所有人信息</span>
        <span class="vd-photo-count">{{ ownerPhotoSlots.length }}张</span>
      </div>
      <div class="vd-photo-grid" :class="isCommercial ? 'cols-2' : 'cols-3'">
        <div v-for="(slot, index) in ownerPhotoSlots" :key="slot.key" class="vd-photo-slot">
          <div class="vd-photo-box">
            <ElImage
              v-if="slot.url"
              :src="slot.url"
              fit="cover"
              loading="lazy"
              class="vd-photo-img"
              :preview-src-list="ownerPreviewList"
              :initial-index="previewIndexAt(ownerPhotoSlots, index)"
            />
            <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
          </div>
          <span class="vd-photo-name">{{ slot.label }}</span>
        </div>
      </div>
      <div class="vd-section-box">
        <div class="vd-row">
          <span class="vd-row-label">证件类型</span
          ><span class="vd-row-value">{{ ownerIdType }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">{{ ownerNameLabel }}</span
          ><span class="vd-row-value">{{ archiveDetail.owner_name || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">{{ ownerIdLabel }}</span
          ><span class="vd-row-value">{{
            maskIdCard(archiveDetail.owner_id_number || archiveDetail.owner_id_card)
          }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">联系电话</span
          ><span class="vd-row-value">{{ maskPhone(archiveDetail.owner_phone) }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">联系地址</span
          ><span class="vd-row-value">{{ archiveDetail.owner_address || '—' }}</span>
        </div>
      </div>
    </div>

    <div class="vd-photo-section">
      <div class="vd-photo-section-head">
        <span class="vd-section-title">车辆信息</span>
        <span class="vd-photo-count">{{ vehicleDocSlots.length }}张</span>
      </div>
      <div class="vd-photo-grid cols-4">
        <div v-for="(slot, index) in vehicleDocSlots" :key="slot.key" class="vd-photo-slot">
          <div class="vd-photo-box">
            <ElImage
              v-if="slot.url"
              :src="slot.url"
              fit="cover"
              loading="lazy"
              class="vd-photo-img"
              :preview-src-list="vehicleDocPreviewList"
              :initial-index="previewIndexAt(vehicleDocSlots, index)"
            />
            <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
          </div>
          <span class="vd-photo-name">{{ slot.label }}</span>
        </div>
      </div>
      <div class="vd-section-box">
        <div class="vd-row">
          <span class="vd-row-label">车牌号</span
          ><span class="vd-row-value">{{ archiveDetail.plate_no || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">号牌类型</span
          ><span class="vd-row-value">{{ archiveDetail.plate_type || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">车辆类型</span
          ><span class="vd-row-value">{{ archiveDetail.vehicle_type_text || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">燃料性质</span
          ><span class="vd-row-value">{{
            archiveDetail.fuel_type_text || archiveDetail.fuel_type || '—'
          }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">品牌型号</span
          ><span class="vd-row-value">{{ brandModel }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">行驶证编号</span
          ><span class="vd-row-value mono">{{ archiveDetail.license_no || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">产证编号</span
          ><span class="vd-row-value mono">{{ archiveDetail.cert_no || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">车辆型号</span
          ><span class="vd-row-value">{{
            archiveDetail.vehicle_model || archiveDetail.model || '—'
          }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">出厂年份</span
          ><span class="vd-row-value">{{ archiveDetail.year || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">使用性质</span
          ><span class="vd-row-value">{{
            archiveDetail.usage_type || archiveDetail.fuel_nature || '—'
          }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">排量/功率</span
          ><span class="vd-row-value">{{
            archiveDetail.displacement || archiveDetail.power_kw
              ? `${archiveDetail.displacement || '—'}/${archiveDetail.power_kw || '—'}`
              : '—'
          }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">监销类型</span
          ><span class="vd-row-value">{{ archiveDetail.monitor_type || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">注册登记日期</span
          ><span class="vd-row-value">{{
            archiveDetail.register_date || archiveDetail.reg_date || '—'
          }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">VIN码（车架号）</span
          ><span class="vd-row-value mono">{{ archiveDetail.vin || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">发动机号码</span
          ><span class="vd-row-value">{{ archiveDetail.engine_no || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">车身颜色</span
          ><span class="vd-row-value">{{ archiveDetail.color || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">表显里程</span
          ><span class="vd-row-value">{{
            archiveDetail.mileage ? `${archiveDetail.mileage}万公里` : '—'
          }}</span>
        </div>
      </div>
    </div>

    <div class="vd-section">
      <div class="vd-section-title">送货方式 & 结算信息</div>
      <div class="vd-section-box">
        <div class="vd-row">
          <span class="vd-row-label">送货方式</span><span class="vd-row-value">{{ delivery }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">结算类型</span
          ><span class="vd-row-value">{{
            archiveDetail.settlement_type_text || archiveDetail.settlement_type || '—'
          }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">结算方式</span
          ><span class="vd-row-value">{{
            archiveDetail.settlement_method_text || archiveDetail.settlement_method || '—'
          }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">结算金额</span
          ><span class="vd-row-value">{{ archiveDetail.settlement_amount ?? '—' }}</span>
        </div>
      </div>
    </div>

    <div class="vd-section">
      <div class="vd-section-title">收款银行卡</div>
      <div class="vd-section-box">
        <div class="vd-row">
          <span class="vd-row-label">开户姓名/名称</span
          ><span class="vd-row-value">{{ archiveDetail.bank_name || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">开户银行</span
          ><span class="vd-row-value">{{ archiveDetail.bank_branch || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">银行卡号</span
          ><span class="vd-row-value">{{ archiveDetail.bank_card_no || '—' }}</span>
        </div>
      </div>
    </div>

    <div class="vd-photo-section">
      <div class="vd-photo-section-head">
        <span class="vd-section-title">代理人信息</span>
        <span class="vd-photo-count">{{ agentPhotoSlots.length }}张</span>
      </div>
      <div class="vd-photo-grid cols-3">
        <div v-for="(slot, index) in agentPhotoSlots" :key="slot.key" class="vd-photo-slot">
          <div class="vd-photo-box">
            <ElImage
              v-if="slot.url"
              :src="slot.url"
              fit="cover"
              loading="lazy"
              class="vd-photo-img"
              :preview-src-list="agentPreviewList"
              :initial-index="previewIndexAt(agentPhotoSlots, index)"
            />
            <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
          </div>
          <span class="vd-photo-name">{{ slot.label }}</span>
        </div>
      </div>
      <div class="vd-section-box">
        <div class="vd-row">
          <span class="vd-row-label">代理人姓名</span
          ><span class="vd-row-value">{{
            archiveDetail.agent_name ||
            (archiveDetail.has_agent === 0 ? '无代理人（本人办理）' : '—')
          }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">代理人证件号</span
          ><span class="vd-row-value">{{ maskIdCard(archiveDetail.agent_id_number) || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">代理人电话</span
          ><span class="vd-row-value">{{ archiveDetail.agent_phone || '—' }}</span>
        </div>
      </div>
    </div>

    <div class="vd-section">
      <div class="vd-section-title">备注说明</div>
      <div class="vd-section-box">
        <div class="vd-row">
          <span class="vd-row-label">备注</span
          ><span class="vd-row-value">{{ archiveDetail.remark || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">库位</span
          ><span class="vd-row-value">{{
            detail.warehouse_slot || detail.warehouse_name || '—'
          }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">创建时间</span
          ><span class="vd-row-value">{{ detail.created_at || detail.add_time_text || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">创建人</span
          ><span class="vd-row-value">{{ detail.created_by || '—' }}</span>
        </div>
        <div class="vd-row">
          <span class="vd-row-label">最后更新</span
          ><span class="vd-row-value">{{
            detail.update_time_text || detail.add_time_text || '—'
          }}</span>
        </div>
      </div>
    </div>

    <div class="vd-media-block">
      <div class="vd-media-title">影像材料</div>

      <RecycleCertificate :djid="scrapDjid" />

      <div class="vd-cert-card">
        <div class="vd-cert-head">
          <div class="vd-cert-head-left">
            <span class="vd-cert-head-title">所有人证件材料</span>
          </div>
          <span class="vd-photo-count">{{ mediaOwnerSlots.length }}张</span>
        </div>
        <div class="vd-cert-body">
          <div class="vd-photo-grid cols-4">
            <div v-for="(slot, index) in mediaOwnerSlots" :key="slot.key" class="vd-photo-slot">
              <div class="vd-photo-label-top">{{ slot.label }}</div>
              <div class="vd-photo-box">
                <ElImage
                  v-if="slot.url"
                  :src="slot.url"
                  fit="cover"
                  loading="lazy"
                  class="vd-photo-img"
                  :preview-src-list="ownerPreviewList"
                  :initial-index="previewIndexAt(mediaOwnerSlots, index)"
                />
                <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="vd-cert-card">
        <div class="vd-cert-head">
          <div class="vd-cert-head-left">
            <span class="vd-cert-head-title">车辆证件材料</span>
          </div>
          <span class="vd-photo-count">{{ mediaVehicleDocSlots.length }}张</span>
        </div>
        <div class="vd-cert-body">
          <div class="vd-photo-grid cols-4">
            <div
              v-for="(slot, index) in mediaVehicleDocSlots"
              :key="slot.key"
              class="vd-photo-slot"
            >
              <div class="vd-photo-label-top">{{ slot.label }}</div>
              <div class="vd-photo-box">
                <ElImage
                  v-if="slot.url"
                  :src="slot.url"
                  fit="cover"
                  loading="lazy"
                  class="vd-photo-img"
                  :preview-src-list="vehicleDocPreviewList"
                  :initial-index="previewIndexAt(mediaVehicleDocSlots, index)"
                />
                <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="
          archiveDetail.has_agent !== 0 &&
          (archiveDetail.agent_name || agentPhotoSlots.some((s) => s.url))
        "
        class="vd-cert-card"
      >
        <div class="vd-cert-head">
          <div class="vd-cert-head-left">
            <span class="vd-cert-head-title">代理人证件材料</span>
          </div>
          <span class="vd-photo-count">{{ agentPhotoSlots.length }}张</span>
        </div>
        <div class="vd-cert-body">
          <div class="vd-photo-grid cols-4">
            <div v-for="(slot, index) in agentPhotoSlots" :key="slot.key" class="vd-photo-slot">
              <div class="vd-photo-label-top">{{ slot.label }}</div>
              <div class="vd-photo-box">
                <ElImage
                  v-if="slot.url"
                  :src="slot.url"
                  fit="cover"
                  loading="lazy"
                  class="vd-photo-img"
                  :preview-src-list="agentPreviewList"
                  :initial-index="previewIndexAt(agentPhotoSlots, index)"
                />
                <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="vd-cert-card">
        <div class="vd-cert-head">
          <div class="vd-cert-head-left">
            <span class="vd-cert-head-title">拖车进场照片</span>
            <span class="vd-cert-tag">质检同步 · 只读</span>
          </div>
          <span class="vd-photo-count">{{ entryPhotoItems.length }}张</span>
        </div>
        <div class="vd-cert-body">
          <div class="vd-photo-grid cols-4">
            <div v-for="(item, index) in entryPhotoItems" :key="item.key" class="vd-photo-slot">
              <div class="vd-photo-label-top">{{ item.label }}</div>
              <div class="vd-photo-box">
                <ElImage
                  v-if="item.url"
                  :src="item.url"
                  fit="cover"
                  loading="lazy"
                  class="vd-photo-img"
                  :preview-src-list="entryPhotoPreviewList"
                  :initial-index="previewIndexAt(entryPhotoItems, index)"
                />
                <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
              </div>
            </div>
          </div>
        </div>
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
            <div v-for="(slot, index) in dismantlePhotoSlots" :key="slot.key" class="vd-photo-slot">
              <div class="vd-photo-label-top">{{ slot.label }}</div>
              <div class="vd-photo-box">
                <ElImage
                  v-if="slot.url"
                  :src="slot.url"
                  fit="cover"
                  loading="lazy"
                  class="vd-photo-img"
                  :preview-src-list="dismantlePreviewList"
                  :initial-index="previewIndexAt(dismantlePhotoSlots, index)"
                />
                <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
              </div>
            </div>
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
                  拍摄情况：<em :class="{ done: !!scrapDjid }">{{
                    scrapDjid ? '已领取' : '未领取'
                  }}</em>
                </span>
              </div>
            </div>
            <div v-for="(slot, index) in cancelPhotoSlots" :key="slot.key" class="vd-photo-slot">
              <div class="vd-photo-label-top">{{ slot.label }}</div>
              <div class="vd-photo-box">
                <ElImage
                  v-if="slot.url"
                  :src="slot.url"
                  fit="cover"
                  loading="lazy"
                  class="vd-photo-img"
                  :preview-src-list="cancelPreviewList"
                  :initial-index="previewIndexAt(cancelPhotoSlots, index)"
                />
                <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { AcceptSyncFiles } from '@/types/recycle/recovery/commerce/accept'
  import type { ScrapVehicleDetail } from '@/types/recycle/recovery/vehicles/vehicle'
  import { ElMessage } from 'element-plus'
  import RecycleCertificate from '../vehicle-archive/recycle-certificate.vue'
  import {
    brandModelText,
    buildAgentPhotoSlots,
    buildCancelPhotoSlots,
    buildDismantlePhotoSlots,
    buildEntryPhotoItems,
    buildOwnerPhotoSlots,
    buildVehicleDocSlots,
    deliveryText,
    isCommercialOwner,
    maskIdCard,
    maskPhone,
    mergeAcceptSyncPatch,
    previewIndexAt,
    previewUrls
  } from './vehicle-detail-utils'

  defineOptions({ name: 'VehicleDetailInfoTab' })

  const props = defineProps<{
    /** vehicle/detail：关联单号、库位、创建信息等 */
    detail: ScrapVehicleDetail
    /** get_scrap_files_from_sync：档案主体展示数据 */
    acceptSyncFiles: AcceptSyncFiles | null
    scrapDjid: string
    scrapCacheFiles: Record<string, { url?: string }>
    /** scrap/quality/get_by_order 入场照片 */
    entryQualityPhotos: Record<string, string>
  }>()

  /** 档案展示：sync 覆盖 vehicle/detail 同名字段 */
  const archiveDetail = computed<ScrapVehicleDetail>(() => {
    const patch = props.acceptSyncFiles ? mergeAcceptSyncPatch(props.acceptSyncFiles) : {}
    return { ...props.detail, ...patch }
  })

  const isCommercial = computed(() => isCommercialOwner(archiveDetail.value))
  const brandModel = computed(() => brandModelText(archiveDetail.value))
  const delivery = computed(() => deliveryText(archiveDetail.value))

  const ownerIdType = computed(() => (isCommercial.value ? '统一社会信用代码' : '居民身份证'))
  const ownerNameLabel = computed(() => (isCommercial.value ? '企业完整名称' : '所有人姓名'))
  const ownerIdLabel = computed(() => (isCommercial.value ? '统一社会信用代码' : '身份证号码'))

  const ownerPhotoSlots = computed(() => buildOwnerPhotoSlots(archiveDetail.value))
  const mediaOwnerSlots = computed(() => ownerPhotoSlots.value)
  const vehicleDocSlots = computed(() => buildVehicleDocSlots(archiveDetail.value))
  const mediaVehicleDocSlots = computed(() => vehicleDocSlots.value)
  const agentPhotoSlots = computed(() => buildAgentPhotoSlots(archiveDetail.value))
  const entryPhotoItems = computed(() => buildEntryPhotoItems(props.entryQualityPhotos))
  const dismantlePhotoSlots = computed(() =>
    buildDismantlePhotoSlots(props.scrapCacheFiles, props.detail.dismantle_photos)
  )
  const cancelPhotoSlots = computed(() => buildCancelPhotoSlots(props.scrapCacheFiles))

  const ownerPreviewList = computed(() => previewUrls(ownerPhotoSlots.value))
  const vehicleDocPreviewList = computed(() => previewUrls(vehicleDocSlots.value))
  const agentPreviewList = computed(() => previewUrls(agentPhotoSlots.value))
  const entryPhotoPreviewList = computed(() => previewUrls(entryPhotoItems.value))
  const dismantlePreviewList = computed(() => previewUrls(dismantlePhotoSlots.value))
  const cancelPreviewList = computed(() => previewUrls(cancelPhotoSlots.value))

  function handleCertificateAction() {
    if (!props.scrapDjid) {
      ElMessage.warning('暂无回收证明数据')
      return
    }
    window.open(`https://bfc.chexinmeng.com/hszma4?id=${props.scrapDjid}`, '_blank')
  }
</script>

<style scoped lang="scss">
  @use './vehicle-detail-tab' as *;
</style>
