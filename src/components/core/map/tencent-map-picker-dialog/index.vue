<template>
  <ElDialog
    v-model="visible"
    title="地图选点"
    width="720px"
    append-to-body
    destroy-on-close
    class="tencent-map-picker-dialog"
    @opened="initMap"
    @closed="handleClosed"
  >
    <div v-loading="mapLoading" class="map-picker-body">
      <div class="map-search-bar">
        <ElInput
          v-model="keyword"
          placeholder="搜索地址、地点"
          clearable
          @input="handleSearchInput"
          @keyup.enter="handleSearchEnter"
        >
          <template #prefix>
            <ArtSvgIcon icon="ri:search-line" />
          </template>
        </ElInput>
        <ul v-if="suggestions.length" class="map-suggest-list">
          <li
            v-for="(item, index) in suggestions"
            :key="`${item.title}-${index}`"
            class="map-suggest-item"
            @click="selectSuggestion(item)"
          >
            <div class="map-suggest-title">{{ item.title || '—' }}</div>
            <div class="map-suggest-address">{{ item.address || '—' }}</div>
          </li>
        </ul>
      </div>

      <div class="map-wrap">
        <div ref="mapContainerRef" class="map-container" />
        <button
          type="button"
          class="map-locate-btn"
          title="定位当前位置"
          @click="locateCurrentPosition"
        >
          <ArtSvgIcon icon="ri:crosshair-2-line" />
        </button>
      </div>

      <div class="map-selected-address">
        <span class="map-selected-label">已选地址</span>
        <span class="map-selected-value">{{
          selectedAddress || '请在地图上点击或搜索选择地址'
        }}</span>
      </div>
    </div>

    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :disabled="!selectedAddress" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { loadTencentMapSdk } from '@/utils/map/tencent-map'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'TencentMapPickerDialog' })

  const props = defineProps<{
    /** 初始地址，用于打开时定位 */
    initialAddress?: string
  }>()

  const emit = defineEmits<{
    confirm: [address: string]
  }>()

  const visible = defineModel<boolean>({ default: false })

  const DEFAULT_CENTER = { lat: 31.2304, lng: 121.4737 }
  /** 腾讯地图内置默认标记样式 id */
  const MARKER_STYLE_ID = 'marker'

  const mapContainerRef = ref<HTMLElement | null>(null)
  const mapLoading = ref(false)
  const keyword = ref('')
  const selectedAddress = ref('')
  const suggestions = ref<TMap.service.SuggestionItem[]>([])

  let mapInstance: TMap.Map | null = null
  let markerLayer: TMap.MultiMarker | null = null
  let geocoder: TMap.service.Geocoder | null = null
  let suggestService: TMap.service.Suggestion | null = null
  let searchTimer: ReturnType<typeof setTimeout> | null = null
  let mapClickHandler: ((evt: TMap.MapClickEvent) => void) | null = null
  let mapInitialized = false

  function createMarkerStyles() {
    return {
      [MARKER_STYLE_ID]: new TMap.MarkerStyle({
        width: 34,
        height: 50,
        anchor: { x: 17, y: 50 }
      })
    }
  }

  function buildMarkerGeometry(lat: number, lng: number): TMap.MultiMarkerGeometry {
    return {
      id: 'selected',
      styleId: MARKER_STYLE_ID,
      position: new TMap.LatLng(lat, lng)
    }
  }

  function buildAddress(title?: string, address?: string) {
    const parts = [title, address].map((item) => (item || '').trim()).filter(Boolean)
    return [...new Set(parts)].join('')
  }

  function setMarkerPosition(lat: number, lng: number) {
    if (!mapInstance || !markerLayer) return
    markerLayer.updateGeometries([buildMarkerGeometry(lat, lng)])
    mapInstance.setCenter(new TMap.LatLng(lat, lng))
  }

  async function reverseGeocode(lat: number, lng: number) {
    if (!geocoder) return
    try {
      const result = await geocoder.getAddress({ location: new TMap.LatLng(lat, lng) })
      selectedAddress.value = result.result?.address || ''
    } catch {
      ElMessage.warning('地址解析失败，请重新选点')
    }
  }

  async function forwardGeocode(address: string) {
    if (!geocoder || !address.trim()) return
    try {
      const result = await geocoder.getLocation({ address: address.trim() })
      const location = result.result?.location
      if (!location) return
      const lat = location.getLat()
      const lng = location.getLng()
      setMarkerPosition(lat, lng)
      selectedAddress.value = result.result?.address || address.trim()
    } catch {
      // 地址无法解析时保持默认中心
    }
  }

  function handleMapClick(evt: TMap.MapClickEvent) {
    const lat = evt.latLng.getLat()
    const lng = evt.latLng.getLng()
    setMarkerPosition(lat, lng)
    reverseGeocode(lat, lng)
    suggestions.value = []
  }

  async function initMap() {
    if (!mapContainerRef.value || mapInitialized) return
    mapLoading.value = true
    try {
      await loadTencentMapSdk()
      if (!window.TMap) {
        throw new Error('腾讯地图 SDK 未就绪')
      }

      geocoder = new TMap.service.Geocoder()
      suggestService = new TMap.service.Suggestion({ pageSize: 8 })

      mapInstance = new TMap.Map(mapContainerRef.value, {
        center: new TMap.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        zoom: 14,
        viewMode: '2D'
      })

      markerLayer = new TMap.MultiMarker({
        map: mapInstance,
        styles: createMarkerStyles(),
        geometries: [buildMarkerGeometry(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)]
      })

      mapClickHandler = handleMapClick
      mapInstance.on('click', mapClickHandler)
      mapInitialized = true

      await nextTick()
      ;(mapInstance as TMap.Map & { resize?: () => void }).resize?.()

      selectedAddress.value = props.initialAddress?.trim() || ''
      keyword.value = props.initialAddress?.trim() || ''
      if (props.initialAddress?.trim()) {
        await forwardGeocode(props.initialAddress)
      }
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '地图加载失败')
      visible.value = false
    } finally {
      mapLoading.value = false
    }
  }

  function locateCurrentPosition() {
    if (!navigator.geolocation) {
      ElMessage.warning('当前浏览器不支持定位')
      return
    }
    mapLoading.value = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setMarkerPosition(lat, lng)
        reverseGeocode(lat, lng)
        suggestions.value = []
        mapLoading.value = false
      },
      () => {
        ElMessage.warning('获取当前位置失败，请检查浏览器定位权限')
        mapLoading.value = false
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  function destroyMap() {
    if (searchTimer) {
      clearTimeout(searchTimer)
      searchTimer = null
    }
    if (mapInstance && mapClickHandler) {
      mapInstance.off('click', mapClickHandler)
    }
    markerLayer?.setMap(null)
    markerLayer = null
    mapInstance?.destroy()
    mapInstance = null
    geocoder = null
    suggestService = null
    mapClickHandler = null
    mapInitialized = false
  }

  function handleSearchInput(value: string) {
    if (searchTimer) clearTimeout(searchTimer)
    if (!value.trim()) {
      suggestions.value = []
      return
    }
    searchTimer = setTimeout(async () => {
      if (!suggestService) return
      try {
        const result = await suggestService.getSuggestions({ keyword: value.trim() })
        suggestions.value = result.data || []
      } catch {
        suggestions.value = []
      }
    }, 300)
  }

  function handleSearchEnter() {
    if (suggestions.value.length) {
      selectSuggestion(suggestions.value[0])
      return
    }
    if (keyword.value.trim()) {
      forwardGeocode(keyword.value)
      suggestions.value = []
    }
  }

  function selectSuggestion(item: TMap.service.SuggestionItem) {
    const location = item.location
    if (!location) return
    const lat = location.getLat()
    const lng = location.getLng()
    setMarkerPosition(lat, lng)
    selectedAddress.value =
      buildAddress(item.title, item.address) || item.address || item.title || ''
    keyword.value = selectedAddress.value
    suggestions.value = []
  }

  function handleConfirm() {
    if (!selectedAddress.value.trim()) {
      ElMessage.warning('请先选择地址')
      return
    }
    emit('confirm', selectedAddress.value.trim())
    visible.value = false
  }

  function handleClosed() {
    destroyMap()
    keyword.value = ''
    selectedAddress.value = ''
    suggestions.value = []
  }
</script>

<style lang="scss" scoped>
  .map-picker-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .map-search-bar {
    position: relative;
  }

  .map-suggest-list {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    left: 0;
    z-index: 10;
    max-height: 220px;
    padding: 4px 0;
    margin: 0;
    overflow: auto;
    list-style: none;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgb(15 23 42 / 8%);
  }

  .map-suggest-item {
    padding: 8px 12px;
    cursor: pointer;

    &:hover {
      background: #f5f7ff;
    }
  }

  .map-suggest-title {
    font-size: 14px;
    color: #262626;
  }

  .map-suggest-address {
    margin-top: 2px;
    font-size: 12px;
    color: #8c8c8c;
  }

  .map-wrap {
    position: relative;
  }

  .map-container {
    width: 100%;
    height: 420px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .map-locate-btn {
    position: absolute;
    right: 12px;
    bottom: 12px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    font-size: 18px;
    color: #4169ff;
    cursor: pointer;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgb(15 23 42 / 10%);

    &:hover {
      background: #f5f7ff;
    }
  }

  .map-selected-address {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 10px 12px;
    background: #f8faff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .map-selected-label {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 500;
    color: #595959;
  }

  .map-selected-value {
    font-size: 13px;
    line-height: 1.5;
    color: #262626;
    word-break: break-all;
  }
</style>
