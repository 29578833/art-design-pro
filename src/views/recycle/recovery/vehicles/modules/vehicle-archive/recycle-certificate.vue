<template>
  <div class="rc-box">
    <div class="rc-head">
      <span class="rc-title">
        报废机动车回收证明
        <span class="rc-badge">{{ tag }}</span>
      </span>
      <span v-if="showActions" class="rc-actions">
        <ElButton size="small" @click="handleOpen">查看</ElButton>
        <ElButton size="small" type="primary" @click="handleOpen">下载</ElButton>
      </span>
    </div>
    <div class="rc-preview">
      <div v-if="loading || certLoading" class="rc-empty">
        <ArtSvgIcon icon="ri:loader-4-line" class="rc-loading-icon" />
        加载回收证明数据...
      </div>
      <CertificateTable
        v-else-if="certData && certData.hszmbh"
        :cert-data="certData"
        :qr-link="certQrLink"
        :cllx-options="certCllxOptions"
      />
      <div v-else class="rc-empty">暂无回收证明数据</div>
    </div>
    <div v-if="showOpenFull && certData && certData.hszmbh" class="rc-footer">
      <ElButton size="small" @click="handleOpen">打开完整版（含六联）</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { fetchBfdjPrintHszm } from '@/api/recycle/bfdj'
  import { fetchDataDictList } from '@/api/recycle/data-dict'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { BfdjHszmData } from '@/types/recycle/recovery/vehicles/bfdj'
  import { ElMessage } from 'element-plus'
  import CertificateTable from './certificate-table.vue'

  defineOptions({ name: 'VehicleArchiveRecycleCertificate' })

  interface Props {
    /** 报废登记单 ID（回收证明唯一标识）。 */
    djid: string
    /** 外部加载状态（例如影像材料缓存加载中）。 */
    loading?: boolean
    /** 头部标签文案。 */
    tag?: string
    /** 是否展示头部查看/下载按钮。 */
    showActions?: boolean
    /** 是否展示底部打开完整版按钮。 */
    showOpenFull?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    tag: '商务部同步 · 只读',
    showActions: true,
    showOpenFull: true
  })

  const certData = ref<BfdjHszmData | null>(null)
  const certLoading = ref(false)
  const certCllxOptions = ref<{ label: string; value: string }[]>([])
  /** 请求序号，用于忽略过期请求的响应。 */
  let certLoadSeq = 0

  const certQrLink = computed(() => {
    const carid = certData.value?.carid
    return carid ? `https://bfc.chexinmeng.com/carInfo.html?id=${carid}` : ''
  })

  async function loadCertificateData(djid: string) {
    if (!djid) return
    const seq = ++certLoadSeq
    certLoading.value = true
    try {
      const [hszmRes, cllxRes] = await Promise.all([
        fetchBfdjPrintHszm(djid).catch(() => null),
        fetchDataDictList({ dict_type: 'car_cllx_ga', status: 1, limit: 1000 }).catch(() => ({
          list: []
        }))
      ])
      if (seq !== certLoadSeq) return
      certData.value = hszmRes
      certCllxOptions.value = (cllxRes?.list || []).map((item) => ({
        label: item.dict_label ?? '',
        value: item.dict_value ?? ''
      }))
    } finally {
      if (seq === certLoadSeq) certLoading.value = false
    }
  }

  function handleOpen() {
    if (!props.djid) {
      ElMessage.warning('暂无回收证明数据')
      return
    }
    window.open(`https://bfc.chexinmeng.com/hszma4?id=${props.djid}`, '_blank')
  }

  /** 重置并重新加载回收证明数据（弹窗再次打开时调用）。 */
  async function reload() {
    certData.value = null
    certCllxOptions.value = []
    if (props.djid) await loadCertificateData(props.djid)
  }

  watch(
    () => props.djid,
    (val) => {
      if (val) loadCertificateData(val)
      else {
        certLoadSeq++
        certData.value = null
        certCllxOptions.value = []
        certLoading.value = false
      }
    },
    { immediate: true }
  )

  defineExpose({ reload })
</script>

<style scoped lang="scss">
  .rc-box {
    margin-bottom: 16px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .rc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    background: #f9fafb;
    border-bottom: 1px solid #f3f4f6;
  }

  .rc-title {
    display: inline-flex;
    align-items: center;
  }

  .rc-badge {
    padding: 2px 6px;
    margin-left: 8px;
    font-size: 10px;
    font-weight: 500;
    color: #8c8c8c;
    background: #f0f0f0;
    border-radius: 4px;
  }

  .rc-actions {
    display: inline-flex;
    gap: 8px;
  }

  .rc-preview {
    padding: 16px;
    background: #fff;
  }

  .rc-empty {
    padding: 20px;
    font-size: 13px;
    color: #8c8c8c;
    text-align: center;
  }

  .rc-loading-icon {
    margin-right: 6px;
    vertical-align: -2px;
    animation: rc-cert-spin 1s linear infinite;
  }

  .rc-footer {
    display: flex;
    justify-content: flex-end;
    padding: 10px 16px 12px;
    background: #fff;
    border-top: 1px solid #f0f0f0;
  }

  @keyframes rc-cert-spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
</style>
