<template>
  <div class="vd-info">
    <div class="vd-section">
      <div class="vd-section-title">关联单号</div>
      <div class="vd-section-box">
        <div class="vd-row"
          ><span class="vd-row-label">车辆档案单号</span
          ><span class="vd-row-value mono">{{
            detail.vehicle_no || detail.archive_no || '—'
          }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">关联回收订单号</span
          ><span class="vd-row-value link">{{ detail.order_no || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">关联拖车订单号</span
          ><span class="vd-row-value">{{ detail.tow_order_no || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">线索单号</span
          ><span class="vd-row-value">{{ detail.lead_no || '—' }}</span></div
        >
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
        <div class="vd-row"
          ><span class="vd-row-label">证件类型</span
          ><span class="vd-row-value">{{ ownerIdType }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">{{ ownerNameLabel }}</span
          ><span class="vd-row-value">{{ detail.owner_name || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">{{ ownerIdLabel }}</span
          ><span class="vd-row-value">{{
            maskIdCard(detail.owner_id_number || detail.owner_id_card)
          }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">联系电话</span
          ><span class="vd-row-value">{{ maskPhone(detail.owner_phone) }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">联系地址</span
          ><span class="vd-row-value">{{ detail.owner_address || '—' }}</span></div
        >
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
        <div class="vd-row"
          ><span class="vd-row-label">车牌号</span
          ><span class="vd-row-value">{{ detail.plate_no || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">号牌类型</span
          ><span class="vd-row-value">{{ detail.plate_type || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">车辆类型</span
          ><span class="vd-row-value">{{
            detail.vehicle_type_text || detail.vehicle_type || '—'
          }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">燃料性质</span
          ><span class="vd-row-value">{{
            detail.fuel_type_text || detail.fuel_type || '—'
          }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">品牌型号</span
          ><span class="vd-row-value">{{ brandModel }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">行驶证编号</span
          ><span class="vd-row-value mono">{{ detail.license_no || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">产证编号</span
          ><span class="vd-row-value mono">{{ detail.cert_no || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">车辆型号</span
          ><span class="vd-row-value">{{ detail.vehicle_model || detail.model || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">出厂年份</span
          ><span class="vd-row-value">{{ detail.year || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">使用性质</span
          ><span class="vd-row-value">{{
            detail.usage_type || detail.fuel_nature || '—'
          }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">排量/功率</span
          ><span class="vd-row-value">{{
            detail.displacement || detail.power_kw
              ? `${detail.displacement || '—'}/${detail.power_kw || '—'}`
              : '—'
          }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">监销类型</span
          ><span class="vd-row-value">{{ detail.monitor_type || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">注册登记日期</span
          ><span class="vd-row-value">{{
            detail.register_date || detail.reg_date || '—'
          }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">VIN码（车架号）</span
          ><span class="vd-row-value mono">{{ detail.vin || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">发动机号码</span
          ><span class="vd-row-value">{{ detail.engine_no || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">车身颜色</span
          ><span class="vd-row-value">{{ detail.color || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">表显里程</span
          ><span class="vd-row-value">{{
            detail.mileage ? `${detail.mileage}万公里` : '—'
          }}</span></div
        >
      </div>
    </div>

    <div class="vd-section">
      <div class="vd-section-title">送货方式 & 结算信息</div>
      <div class="vd-section-box">
        <div class="vd-row"
          ><span class="vd-row-label">送货方式</span
          ><span class="vd-row-value">{{ delivery }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">结算类型</span
          ><span class="vd-row-value">{{
            detail.settlement_type_text || detail.settlement_type || '—'
          }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">结算方式</span
          ><span class="vd-row-value">{{
            detail.settlement_method_text || detail.settlement_method || '—'
          }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">结算金额</span
          ><span class="vd-row-value">{{ detail.settlement_amount ?? '—' }}</span></div
        >
      </div>
    </div>

    <div class="vd-section">
      <div class="vd-section-title">收款银行卡</div>
      <div class="vd-section-box">
        <div class="vd-row"
          ><span class="vd-row-label">开户姓名/名称</span
          ><span class="vd-row-value">{{ detail.bank_name || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">开户银行</span
          ><span class="vd-row-value">{{ detail.bank_branch || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">银行卡号</span
          ><span class="vd-row-value">{{ detail.bank_card_no || '—' }}</span></div
        >
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
        <div class="vd-row"
          ><span class="vd-row-label">代理人姓名</span
          ><span class="vd-row-value">{{
            detail.agent_name || (detail.has_agent === 0 ? '无代理人（本人办理）' : '—')
          }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">代理人证件号</span
          ><span class="vd-row-value">{{ maskIdCard(detail.agent_id_number) || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">代理人电话</span
          ><span class="vd-row-value">{{ detail.agent_phone || '—' }}</span></div
        >
      </div>
    </div>

    <div class="vd-section">
      <div class="vd-section-title">备注说明</div>
      <div class="vd-section-box">
        <div class="vd-row"
          ><span class="vd-row-label">备注</span
          ><span class="vd-row-value">{{ detail.remark || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">库位</span
          ><span class="vd-row-value">{{
            detail.warehouse_slot || detail.warehouse_name || '—'
          }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">创建时间</span
          ><span class="vd-row-value">{{
            detail.created_at || detail.add_time_text || '—'
          }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">创建人</span
          ><span class="vd-row-value">{{ detail.created_by || '—' }}</span></div
        >
        <div class="vd-row"
          ><span class="vd-row-label">最后更新</span
          ><span class="vd-row-value">{{
            detail.update_time_text || detail.add_time_text || '—'
          }}</span></div
        >
      </div>
    </div>

    <div class="vd-media-block">
      <div class="vd-media-title">影像材料</div>

      <div v-if="scrapDjid" class="vd-cert-card">
        <div class="vd-cert-head">
          <div class="vd-cert-head-left">
            <ArtSvgIcon icon="ri:file-text-line" class="vd-cert-icon" />
            <span class="vd-cert-head-title">报废车机动车回收证明</span>
            <span class="vd-cert-tag">商务部同步 · 只读</span>
          </div>
          <div class="vd-cert-actions">
            <button type="button" class="vd-cert-btn outline" @click="handleOpenCert">
              <ArtSvgIcon icon="ri:zoom-in-line" />查看
            </button>
            <button type="button" class="vd-cert-btn primary" @click="handleOpenCert">
              <ArtSvgIcon icon="ri:download-line" />下载
            </button>
          </div>
        </div>
        <div class="vd-cert-body">
          <div class="vd-cert-preview">
            <div class="vd-cert-preview-title">报废机动车回收证明</div>
            <div class="vd-cert-preview-meta">
              <span>回收企业：<em>鑫广再生资源（上海）有限公司</em></span>
              <span
                >证明编号：<em class="mono">{{ scrapDjid }}</em></span
              >
            </div>
            <div class="vd-cert-preview-grid">
              <div
                ><span class="lbl">车主名称</span><span>{{ detail.owner_name || '—' }}</span></div
              >
              <div
                ><span class="lbl">车主证件号</span
                ><span class="mono">{{
                  detail.owner_id_number || detail.owner_id_card || '—'
                }}</span></div
              >
              <div
                ><span class="lbl">车辆牌照</span><span>{{ detail.plate_no || '—' }}</span></div
              >
              <div
                ><span class="lbl">车辆识别代号(VIN)</span
                ><span class="mono">{{ detail.vin || '—' }}</span></div
              >
              <div
                ><span class="lbl">车辆品牌型号</span><span>{{ brandModel }}</span></div
              >
            </div>
          </div>
        </div>
      </div>

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
        v-if="detail.has_agent !== 0 && (detail.agent_name || agentPhotoSlots.some((s) => s.url))"
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
  import type { ScrapVehicleDetail } from '@/types/recycle/vehicle'
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
    openRecycleCert,
    previewUrls
  } from './vehicle-detail-utils'

  defineOptions({ name: 'VehicleDetailInfoTab' })

  const props = defineProps<{
    detail: ScrapVehicleDetail
    scrapDjid: string
    scrapCacheFiles: Record<string, { url?: string }>
  }>()

  const isCommercial = computed(() => isCommercialOwner(props.detail))
  const brandModel = computed(() => brandModelText(props.detail))
  const delivery = computed(() => deliveryText(props.detail))

  const ownerIdType = computed(() => (isCommercial.value ? '统一社会信用代码' : '居民身份证'))
  const ownerNameLabel = computed(() => (isCommercial.value ? '企业完整名称' : '所有人姓名'))
  const ownerIdLabel = computed(() => (isCommercial.value ? '统一社会信用代码' : '身份证号码'))

  const ownerPhotoSlots = computed(() => buildOwnerPhotoSlots(props.detail))
  const mediaOwnerSlots = computed(() => ownerPhotoSlots.value)
  const vehicleDocSlots = computed(() => buildVehicleDocSlots(props.detail))
  const mediaVehicleDocSlots = computed(() => vehicleDocSlots.value)
  const agentPhotoSlots = computed(() => buildAgentPhotoSlots(props.detail))
  const entryPhotoItems = computed(() => buildEntryPhotoItems(props.detail))
  const dismantlePhotoSlots = computed(() => buildDismantlePhotoSlots(props.scrapCacheFiles))

  const ownerPreviewList = computed(() => previewUrls(ownerPhotoSlots.value))
  const vehicleDocPreviewList = computed(() => previewUrls(vehicleDocSlots.value))
  const agentPreviewList = computed(() => previewUrls(agentPhotoSlots.value))
  const entryPhotoPreviewList = computed(() => previewUrls(entryPhotoItems.value))
  const dismantlePreviewList = computed(() => previewUrls(dismantlePhotoSlots.value))

  function handleOpenCert() {
    openRecycleCert(props.scrapDjid, props.detail.id)
  }
</script>

<style scoped lang="scss">
  @use './vehicle-detail-tab' as *;
</style>
