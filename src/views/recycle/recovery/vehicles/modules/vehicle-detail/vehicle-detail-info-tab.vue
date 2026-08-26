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
        <div v-for="slot in ownerPhotoSlots" :key="slot.key" class="vd-photo-slot">
          <div class="vd-photo-box">
            <ElImage
              v-if="slot.url"
              :src="slot.url"
              fit="cover"
              class="vd-photo-img"
              :preview-src-list="ownerPreviewList"
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
        <div v-for="slot in vehicleDocSlots" :key="slot.key" class="vd-photo-slot">
          <div class="vd-photo-box">
            <ElImage
              v-if="slot.url"
              :src="slot.url"
              fit="cover"
              class="vd-photo-img"
              :preview-src-list="vehicleDocPreviewList"
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
          ><span class="vd-row-value">{{
            archiveDetail.vehicle_type_text || archiveDetail.vehicle_type || '—'
          }}</span>
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
        <div v-for="slot in agentPhotoSlots" :key="slot.key" class="vd-photo-slot">
          <div class="vd-photo-box">
            <ElImage
              v-if="slot.url"
              :src="slot.url"
              fit="cover"
              class="vd-photo-img"
              :preview-src-list="agentPreviewList"
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

      <div class="vd-media-grid-section">
        <div class="vd-media-grid-head">
          <span>所有人证件材料</span>
          <span class="vd-photo-count">{{ mediaOwnerSlots.length }}张</span>
        </div>
        <div class="vd-photo-grid cols-4">
          <div v-for="slot in mediaOwnerSlots" :key="slot.key" class="vd-photo-slot">
            <div class="vd-photo-label-top">{{ slot.label }}</div>
            <div class="vd-photo-box">
              <ElImage
                v-if="slot.url"
                :src="slot.url"
                fit="cover"
                class="vd-photo-img"
                :preview-src-list="ownerPreviewList"
              />
              <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
            </div>
          </div>
        </div>
      </div>

      <div class="vd-media-grid-section">
        <div class="vd-media-grid-head">
          <span>车辆证件材料</span>
          <span class="vd-photo-count">{{ mediaVehicleDocSlots.length }}张</span>
        </div>
        <div class="vd-photo-grid cols-4">
          <div v-for="slot in mediaVehicleDocSlots" :key="slot.key" class="vd-photo-slot">
            <div class="vd-photo-label-top">{{ slot.label }}</div>
            <div class="vd-photo-box">
              <ElImage
                v-if="slot.url"
                :src="slot.url"
                fit="cover"
                class="vd-photo-img"
                :preview-src-list="vehicleDocPreviewList"
              />
              <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
            </div>
          </div>
        </div>
      </div>

      <div class="vd-media-grid-section">
        <div class="vd-media-grid-head">
          <span>车辆实拍照</span>
          <span class="vd-photo-count">{{ entryPhotoItems.length }}张</span>
        </div>
        <div class="vd-photo-grid cols-4">
          <div v-for="item in entryPhotoItems" :key="item.key" class="vd-photo-slot">
            <div class="vd-photo-label-top">{{ item.label }}</div>
            <div class="vd-photo-box">
              <ElImage
                v-if="item.url"
                :src="item.url"
                fit="cover"
                class="vd-photo-img"
                :preview-src-list="entryPhotoPreviewList"
              />
              <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="
          archiveDetail.has_agent !== 0 &&
          (archiveDetail.agent_name || agentPhotoSlots.some((s) => s.url))
        "
        class="vd-media-grid-section"
      >
        <div class="vd-media-grid-head">
          <span>代理人证件材料</span>
          <span class="vd-photo-count">{{ agentPhotoSlots.length }}张</span>
        </div>
        <div class="vd-photo-grid cols-4">
          <div v-for="slot in agentPhotoSlots" :key="slot.key" class="vd-photo-slot">
            <div class="vd-photo-label-top">{{ slot.label }}</div>
            <div class="vd-photo-box">
              <ElImage
                v-if="slot.url"
                :src="slot.url"
                fit="cover"
                class="vd-photo-img"
                :preview-src-list="agentPreviewList"
              />
              <ArtSvgIcon v-else icon="ri:camera-line" class="vd-photo-camera" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="dismantlePhotoSlots.length" class="vd-cert-card">
        <div class="vd-cert-head">
          <div class="vd-cert-head-left">
            <span class="vd-cert-head-title">报废车拆解照片</span>
            <span class="vd-cert-tag">商务部同步 · 只读</span>
          </div>
          <span class="vd-cert-source">数据来源：拆解管理 · 拆解工单</span>
        </div>
        <div class="vd-cert-body">
          <div class="vd-photo-grid cols-4">
            <div v-for="slot in dismantlePhotoSlots" :key="slot.key" class="vd-photo-slot">
              <div class="vd-photo-label-top">{{ slot.label }}</div>
              <div class="vd-photo-box">
                <ElImage
                  v-if="slot.url"
                  :src="slot.url"
                  fit="cover"
                  class="vd-photo-img"
                  :preview-src-list="dismantlePreviewList"
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
  import RecycleCertificate from '../vehicle-archive/recycle-certificate.vue'
  import {
    brandModelText,
    buildAgentPhotoSlots,
    buildDismantlePhotoSlots,
    buildEntryPhotoItems,
    buildOwnerPhotoSlots,
    buildVehicleDocSlots,
    deliveryText,
    isCommercialOwner,
    maskIdCard,
    maskPhone,
    mergeAcceptSyncPatch,
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
  const entryPhotoItems = computed(() => buildEntryPhotoItems(archiveDetail.value))
  const dismantlePhotoSlots = computed(() => buildDismantlePhotoSlots(props.scrapCacheFiles))

  const ownerPreviewList = computed(() => previewUrls(ownerPhotoSlots.value))
  const vehicleDocPreviewList = computed(() => previewUrls(vehicleDocSlots.value))
  const agentPreviewList = computed(() => previewUrls(agentPhotoSlots.value))
  const entryPhotoPreviewList = computed(() => previewUrls(entryPhotoItems.value))
  const dismantlePreviewList = computed(() => previewUrls(dismantlePhotoSlots.value))
</script>

<style scoped lang="scss">
  @use './vehicle-detail-tab' as *;
</style>
