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
        <VehicleDetailInfoTab
          v-if="activeTab === 'info'"
          :detail="detail"
          :scrap-djid="scrapDjid"
          :scrap-cache-files="scrapCacheFiles"
        />
        <VehicleDetailTowTab v-else-if="activeTab === 'tow'" :detail="detail" />
        <VehicleDetailEntryTab v-else-if="activeTab === 'entry'" :detail="detail" />
        <VehicleDetailCancelTab v-else-if="activeTab === 'cancel'" :detail="detail" />
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
  import { fetchVehicleDetail } from '@/api/recycle/vehicle'
  import type { ScrapVehicleDetail, VehicleDimStatusItem } from '@/types/recycle/vehicle'
  import VehicleDetailCancelTab from './vehicle-detail-cancel-tab.vue'
  import VehicleDetailEntryTab from './vehicle-detail-entry-tab.vue'
  import VehicleDetailInfoTab from './vehicle-detail-info-tab.vue'
  import VehicleDetailLogTab from './vehicle-detail-log-tab.vue'
  import VehicleDetailTowTab from './vehicle-detail-tow-tab.vue'
  import { brandModelText, mergeAcceptSyncPatch } from './vehicle-detail-utils'

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
  const scrapCacheFiles = ref<Record<string, { url?: string }>>({})
  const scrapDjid = ref('')

  const headerBrandModel = computed(() => brandModelText(detail.value))

  const dimOverview = computed(() => {
    const dim = detail.value.dim_status
    const fallback = (label: string, icon: string): VehicleDimStatusItem & { icon: string } => ({
      label,
      icon,
      text: '—',
      color: '#8c8c8c',
      bg: '#f5f5f5'
    })
    if (!dim) {
      return [
        { ...fallback('拖车', 'ri:truck-line'), text: detail.value.status_text || '—' },
        { ...fallback('入厂', 'ri:box-3-line'), text: detail.value.status_text || '—' },
        { ...fallback('注销', 'ri:file-text-line'), text: detail.value.status_text || '—' }
      ]
    }
    return [
      {
        label: '拖车',
        icon: 'ri:truck-line',
        text: dim.tow?.label || '—',
        color: dim.tow?.color || '#8c8c8c',
        bg: dim.tow?.bg || '#f5f5f5'
      },
      {
        label: '入厂',
        icon: 'ri:box-3-line',
        text: dim.factory?.label || '—',
        color: dim.factory?.color || '#8c8c8c',
        bg: dim.factory?.bg || '#f5f5f5'
      },
      {
        label: '注销',
        icon: 'ri:file-text-line',
        text: dim.cancel?.label || '—',
        color: dim.cancel?.color || '#8c8c8c',
        bg: dim.cancel?.bg || '#f5f5f5'
      }
    ]
  })

  async function loadScrapFilesCache() {
    if (!props.vehicleId) return
    try {
      const res = await fetchAcceptFilesCache(props.vehicleId)
      scrapCacheFiles.value = (res.bfcj || {}) as Record<string, { url?: string }>
      scrapDjid.value = String(res.djid || props.vehicleId)
    } catch {
      scrapCacheFiles.value = {}
      scrapDjid.value = props.vehicleId ? String(props.vehicleId) : ''
    }
  }

  async function loadDetail() {
    if (!props.vehicleId) return
    loading.value = true
    scrapCacheFiles.value = {}
    scrapDjid.value = ''
    try {
      detail.value = await fetchVehicleDetail(props.vehicleId)
      try {
        const sync = await fetchAcceptSyncFiles({ vehicle_id: props.vehicleId })
        if (sync) Object.assign(detail.value, mergeAcceptSyncPatch(sync))
      } catch {
        // sync 失败不阻断详情
      }
      await loadScrapFilesCache()
    } catch {
      detail.value = { id: props.vehicleId, status: 0 }
    } finally {
      loading.value = false
    }
  }

  function handleClosed() {
    activeTab.value = 'info'
    detail.value = { id: 0, status: 0 }
    scrapCacheFiles.value = {}
    scrapDjid.value = ''
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
    font-size: 12px;
    color: $vm-text-sub;
  }

  .vd-dim-value {
    font-size: 12px;
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
    font-size: 12px;
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
    padding: 20px;
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
