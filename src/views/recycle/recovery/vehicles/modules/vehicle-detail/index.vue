<template>
  <ElDialog
    v-model="dialogVisible"
    width="1100px"
    align-center
    destroy-on-close
    :show-close="false"
    class="vehicle-detail-dialog"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="vd-shell">
      <div class="vd-header">
        <div class="vd-header-top">
          <div>
            <div class="vd-plate-row">
              <span class="vd-plate">{{ detail.plate_no || '—' }}</span>
              <span class="vd-archive-badge">{{
                detail.vehicle_no || detail.archive_no || '—'
              }}</span>
            </div>
            <div class="vd-subtitle">
              {{ headerBrandModel }}<span v-if="detail.color"> · {{ detail.color }}</span>
            </div>
          </div>
          <button type="button" class="vd-close-btn" @click="dialogVisible = false">
            <ArtSvgIcon icon="ri:close-line" />
          </button>
        </div>

        <div class="vd-dim-bar">
          <div v-for="item in dimOverview" :key="item.label" class="vd-dim-item">
            <div class="vd-dim-icon" :style="{ background: item.bg }">
              <ArtSvgIcon :icon="item.icon" :style="{ color: item.color }" />
            </div>
            <div>
              <div class="vd-dim-label">{{ item.label }}</div>
              <div class="vd-dim-value" :style="{ color: item.color }">{{ item.text }}</div>
            </div>
          </div>
        </div>

        <div class="vd-tabs">
          <button
            v-for="tab in TABS"
            :key="tab.key"
            type="button"
            class="vd-tab"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <ArtSvgIcon :icon="tab.icon" class="vd-tab-icon" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="vd-body">
        <!-- 档案信息 -->
        <VehicleDetailInfoTab
          v-if="activeTab === 'info'"
          :detail="detail"
          :accept-sync-files="acceptSyncFiles"
          :scrap-djid="scrapDjid"
          :scrap-cache-files="scrapCacheFiles"
          :entry-quality-photos="entryQualityPhotos"
        />
        <!-- 拖车进度 -->
        <VehicleDetailTowTab v-else-if="activeTab === 'tow'" :detail="detail" />
        <!-- 入厂拆解 -->
        <VehicleDetailEntryTab v-else-if="activeTab === 'entry'" :detail="detail" />
        <!-- 注销办证 -->
        <VehicleDetailCancelTab v-else-if="activeTab === 'cancel'" :detail="detail" />
        <!-- 操作日志 -->
        <VehicleDetailLogTab v-else-if="activeTab === 'log'" :detail="detail" />
      </div>

      <div class="vd-footer">
        <ElButton @click="dialogVisible = false">关闭</ElButton>
      </div>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchAcceptFilesCache, fetchAcceptSyncFiles } from '@/api/recycle/accept'
  import { fetchQualityByOrder } from '@/api/recycle/quality'
  import { fetchVehicleDetail } from '@/api/recycle/vehicle'
  import type { AcceptSyncFiles } from '@/types/recycle/recovery/commerce/accept'
  import type {
    ScrapVehicleDetail,
    VehicleDimStatusItem
  } from '@/types/recycle/recovery/vehicles/vehicle'
  import VehicleDetailCancelTab from './vehicle-detail-cancel-tab.vue'
  import VehicleDetailEntryTab from './vehicle-detail-entry-tab.vue'
  import VehicleDetailInfoTab from './vehicle-detail-info-tab.vue'
  import VehicleDetailLogTab from './vehicle-detail-log-tab.vue'
  import VehicleDetailTowTab from './vehicle-detail-tow-tab.vue'
  import { brandModelText } from './vehicle-detail-utils'

  defineOptions({ name: 'VehicleDetailDialog' })

  interface Props {
    visible: boolean
    vehicleId?: number
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
  }

  const props = withDefaults(defineProps<Props>(), {
    vehicleId: 0
  })
  const emit = defineEmits<Emits>()

  const TABS = [
    { key: 'info', label: '档案信息', icon: 'ri:car-line' },
    { key: 'tow', label: '拖车进度', icon: 'ri:truck-line' },
    { key: 'entry', label: '入厂拆解', icon: 'ri:box-3-line' },
    { key: 'cancel', label: '注销办证', icon: 'ri:file-text-line' },
    { key: 'log', label: '操作日志', icon: 'ri:clipboard-line' }
  ] as const

  type TabKey = (typeof TABS)[number]['key']

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val: boolean) => emit('update:visible', val)
  })

  const loading = ref(false)
  const activeTab = ref<TabKey>('info')
  const detail = ref<ScrapVehicleDetail>({ id: 0, status: 0 })
  const acceptSyncFiles = ref<AcceptSyncFiles | null>(null)
  const scrapCacheFiles = ref<Record<string, { url?: string }>>({})
  const scrapDjid = ref('')
  const entryQualityPhotos = ref<Record<string, string>>({})

  const headerBrandModel = computed(() => brandModelText(detail.value))

  const dimOverview = computed(() => {
    const dim = detail.value.dim_status
    const toItem = (
      label: string,
      icon: string,
      data?: VehicleDimStatusItem
    ): VehicleDimStatusItem & { icon: string; label: string; text: string } => ({
      label,
      icon,
      text: data?.label || '—',
      color: data?.color || '#8c8c8c',
      bg: data?.bg || '#f5f5f5'
    })
    return [
      toItem('拖车', 'ri:truck-line', dim?.tow),
      toItem('入厂', 'ri:box-3-line', dim?.factory),
      toItem('注销', 'ri:file-text-line', dim?.cancel)
    ]
  })

  async function loadEntryQualityPhotos(orderId?: number, vehicleId?: number) {
    if (!orderId) {
      entryQualityPhotos.value = {}
      return
    }
    try {
      const res = await fetchQualityByOrder(orderId, vehicleId)
      if (res) {
        entryQualityPhotos.value = {
          full_image: String(res.full_image || ''),
          vin_rub_image: String(res.vin_rub_image || ''),
          vin_image: String(res.vin_image || ''),
          engine_image: String(res.engine_image || ''),
          other_image: String(res.other_image || '')
        }
      } else {
        entryQualityPhotos.value = {}
      }
    } catch {
      entryQualityPhotos.value = {}
    }
  }

  async function loadScrapFilesCache() {
    if (!props.vehicleId) return
    try {
      const res = await fetchAcceptFilesCache(props.vehicleId)
      scrapCacheFiles.value = (res.bfcj || {}) as Record<string, { url?: string }>
      scrapDjid.value = String(res.djid || '')
    } catch {
      scrapCacheFiles.value = {}
      scrapDjid.value = ''
    }
  }

  async function loadDetail() {
    if (!props.vehicleId) return
    loading.value = true
    acceptSyncFiles.value = null
    scrapCacheFiles.value = {}
    scrapDjid.value = ''
    entryQualityPhotos.value = {}
    try {
      const [vehicleDetail, syncFiles] = await Promise.all([
        fetchVehicleDetail(props.vehicleId),
        fetchAcceptSyncFiles({ vehicle_id: props.vehicleId }).catch(() => null)
      ])
      detail.value = vehicleDetail
      acceptSyncFiles.value = syncFiles
      await Promise.all([
        loadScrapFilesCache(),
        loadEntryQualityPhotos(vehicleDetail.order_id, props.vehicleId)
      ])
    } catch {
      detail.value = { id: props.vehicleId, status: 0 }
    } finally {
      loading.value = false
    }
  }

  function handleClosed() {
    activeTab.value = 'info'
    detail.value = { id: 0, status: 0 }
    acceptSyncFiles.value = null
    scrapCacheFiles.value = {}
    scrapDjid.value = ''
    entryQualityPhotos.value = {}
  }

  watch(
    () => props.visible,
    (val) => {
      if (val) loadDetail()
    }
  )
</script>

<style scoped lang="scss">
  @use '../../vehicles-dialog' as *;

  .vd-shell {
    display: flex;
    flex-direction: column;
    height: 94vh;
    margin: -16px -20px -20px;
    overflow: hidden;
    background: #fff;
    border-radius: 8px;
  }

  .vd-header {
    flex-shrink: 0;
    padding: 16px 20px 0;
    border-bottom: 1px solid $vm-border;
  }

  .vd-header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .vd-plate-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 4px;
  }

  .vd-plate {
    font-size: 18px;
    font-weight: 700;
    color: $vm-text;
  }

  .vd-archive-badge {
    padding: 2px 8px;
    font-size: 12px;
    color: $vm-text-sub;
    background: $vm-gray-100;
    border-radius: 4px;
  }

  .vd-subtitle {
    font-size: 14px;
    color: $vm-text-sub;
  }

  .vd-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    font-size: 20px;
    color: $vm-text-sub;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;

    &:hover {
      background: $vm-gray-100;
    }
  }

  .vd-dim-bar {
    display: flex;
    gap: 16px;
    padding: 12px;
    margin-bottom: 12px;
    background: $vm-gray-50;
    border-radius: 8px;
  }

  .vd-dim-item {
    display: flex;
    flex: 1;
    gap: 8px;
    align-items: center;
  }

  .vd-dim-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 14px;
    border-radius: 8px;
  }

  .vd-dim-label {
    font-size: 14px;
    color: #333;
  }

  .vd-dim-value {
    font-size: 14px;
    font-weight: 600;
  }

  .vd-tabs {
    display: flex;
    gap: 0;
    padding: 0 20px;
    margin: 0 -20px;
    border-bottom: 1px solid #f0f0f0;
  }

  .vd-tab {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 500;
    color: $vm-text-sub;
    cursor: pointer;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;

    &.active {
      color: $vm-primary;
      border-bottom-color: $vm-primary;
    }

    &:hover:not(.active) {
      color: #595959;
    }
  }

  .vd-tab-icon {
    font-size: 14px;
  }

  .vd-body {
    flex: 1;
    padding: 20px 36px;
    overflow-y: auto;
  }

  .vd-footer {
    display: flex;
    flex-shrink: 0;
    justify-content: flex-end;
    padding: 16px 20px;
    border-top: 1px solid $vm-border;
  }
</style>

<style lang="scss">
  .vehicle-detail-dialog {
    .el-dialog__header {
      display: none;
    }

    .el-dialog__body {
      padding: 0;
    }

    .el-dialog__footer {
      display: none;
    }
  }
</style>
