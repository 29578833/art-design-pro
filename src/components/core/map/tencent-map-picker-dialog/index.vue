<template>
  <ElDialog
    v-model="visible"
    title="选择上门取车地址"
    width="800px"
    append-to-body
    destroy-on-close
    class="tencent-map-picker-dialog"
    @opened="initPicker"
  >
    <iframe
      id="mapPagePickup"
      width="100%"
      height="500px"
      frameborder="0"
      :src="pickerUrl"
      allow="geolocation"
    />
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchTencentMapKey } from '@/api/system-manage'
  import { getTencentMapKey } from '@/utils/map/tencent-map'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'TencentMapPickerDialog' })

  const props = defineProps<{
    /** 初始经纬度，格式 lat,lng，打开时定位到已保存的坐标点 */
    initialLatLng?: string
  }>()

  const emit = defineEmits<{
    confirm: [result: { address: string; latlng: string }]
  }>()

  const visible = defineModel<boolean>({ default: false })

  /** 腾讯地图定位器 iframe 地址（对齐 admin 选择上门取车地址实现） */
  const pickerUrl = ref('')

  async function initPicker() {
    if (pickerUrl.value) return
    // 与 admin 一致：优先从后端门店配置获取地图 key，失败时回退到环境变量
    let key = ''
    try {
      const res = await fetchTencentMapKey()
      key = res?.key || ''
    } catch {
      key = ''
    }
    if (!key) key = getTencentMapKey()
    if (!key) {
      ElMessage.error('未配置腾讯地图 Key')
      return
    }
    const coord = props.initialLatLng?.trim()
    pickerUrl.value = `https://apis.map.qq.com/tools/locpicker?type=1&key=${key}&referer=myapp${coord ? `&coord=${coord}` : ''}`
  }

  /** 处理腾讯地图定位器 postMessage 结果 */
  function handleMapMessage(event: MessageEvent) {
    const loc = event.data as {
      module?: string
      latlng?: { lat?: number; lng?: number }
      poiaddress?: string
      poiname?: string
    } | null
    if (!loc || loc.module !== 'locationPicker') return

    // 地址 = poiaddress（完整地址）+ poiname（POI 名称），若 poiname 已包含则不重复拼接
    const fullAddress = (loc.poiaddress || '').trim()
    const poiName = (loc.poiname || '').trim()
    let address = fullAddress
    if (poiName && !fullAddress.includes(poiName)) {
      address = fullAddress ? fullAddress + poiName : poiName
    }

    if (!address) {
      ElMessage.warning('未能获取到地址信息，请重试')
      visible.value = false
      return
    }

    // 经纬度 lat,lng
    const lat = loc.latlng?.lat
    const lng = loc.latlng?.lng
    const latlng = lat && lng ? `${lat},${lng}` : ''

    emit('confirm', { address, latlng })
    visible.value = false
  }

  onMounted(() => {
    window.addEventListener('message', handleMapMessage, false)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('message', handleMapMessage)
  })
</script>

<style lang="scss" scoped>
  .tencent-map-picker-dialog {
    :deep(.el-dialog__body) {
      padding: 0;
      overflow: hidden;
    }

    iframe {
      display: block;
      border: 0;
    }
  }
</style>
