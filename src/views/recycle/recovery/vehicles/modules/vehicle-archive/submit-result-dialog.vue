<template>
  <ElDialog
    v-model="visible"
    width="1100px"
    align-center
    append-to-body
    :show-close="false"
    style="padding: 0 !important"
    class="submit-success-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div class="success-header">
        <div class="success-header-left">
          <ArtSvgIcon icon="ri:checkbox-circle-fill" class="success-header-icon" />
          <span class="success-header-title">提交成功</span>
        </div>
        <button type="button" class="success-header-close" @click="visible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
      <div class="success-subtitle">
        {{ displayData.vin || '—' }} · {{ displayData.plate_no || '—' }}
        档案已成功提交至商务部数字化管理平台（车信盟）
      </div>
    </template>

    <div class="success-card">
      <div class="success-card-header">
        <ArtSvgIcon icon="ri:checkbox-circle-fill" class="success-card-icon" />
        <span>已成功提交至商务部数字化管理平台（车信盟）</span>
      </div>
      <div class="success-card-body">
        <div class="info-row">
          <div class="info-item">
            <div class="info-item-label">车架号（VIN）</div>
            <div class="info-item-value">{{ displayData.vin || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-item-label">车牌号码</div>
            <div class="info-item-value">{{ displayData.plate_no || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-item-label">所有人</div>
            <div class="info-item-value">{{ displayData.owner_name || '—' }}</div>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item">
            <div class="info-item-label">联系电话</div>
            <div class="info-item-value">{{ displayData.owner_phone || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-item-label">提交时间</div>
            <div class="info-item-value">{{ displayData.submit_time || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-item-label">流水号</div>
            <div class="info-item-value">{{ displayData.djid || '—' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="certificate-section">
      <div class="certificate-section-header">
        <div class="certificate-section-title-wrap">
          <ArtSvgIcon icon="ri:file-text-line" class="certificate-section-icon" />
          <span class="certificate-section-title">报废机动车回收证明</span>
          <ElTag size="small" type="success" effect="plain">商务部已开具</ElTag>
        </div>
      </div>
      <div class="certificate-preview">
        <div v-if="certLoading" class="certificate-loading">
          <ArtSvgIcon icon="ri:loader-4-line" class="is-loading" />
          加载回收证明数据...
        </div>
        <CertificateTable
          v-else-if="certData && certData.hszmbh"
          :cert-data="certData"
          :qr-link="qrLink"
          :cllx-options="certCllxOptions"
        />
        <div v-else class="certificate-empty">暂无回收证明数据</div>
      </div>
    </div>

    <template #footer>
      <div class="footer-tip">证明文件由商务部系统自动生成，如需更新请重新抓取</div>
      <div class="dialog-footer-actions">
        <ElButton @click="visible = false">关闭</ElButton>
        <ElButton type="success" plain @click="handlePrintCertificate">
          <ArtSvgIcon icon="ri:printer-line" />
          打印回收证明
        </ElButton>
        <ElButton type="primary" @click="emit('fetch-archive')">
          <ArtSvgIcon icon="ri:refresh-line" />
          抓取车辆档案信息
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchBfdjPrintHszm } from '@/api/recycle/bfdj'
  import { fetchDataDictList } from '@/api/recycle/data-dict'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { AcceptSubmitResult } from '@/types/recycle/accept'
  import type { BfdjHszmData } from '@/types/recycle/bfdj'
  import { ElMessage } from 'element-plus'
  import CertificateTable from './certificate-table.vue'
  import './submit-result-dialog.scss'

  defineOptions({ name: 'VehicleArchiveSubmitResultDialog' })

  interface Props {
    /** 提交结果详情。 */
    result: AcceptSubmitResult | null
  }

  const props = defineProps<Props>()
  const visible = defineModel<boolean>('visible', { required: true })

  const emit = defineEmits<{
    /** 抓取商务部车辆档案。 */
    'fetch-archive': []
  }>()

  const certData = ref<BfdjHszmData | null>(null)
  const certLoading = ref(false)
  const certCllxOptions = ref<{ label: string; value: string }[]>([])

  const displayData = computed(() => ({
    vin: props.result?.vin || props.result?.vehicle_vin || '',
    plate_no: props.result?.plate_no || props.result?.vehicle_plate || '',
    owner_name: props.result?.owner_name || '',
    owner_phone: props.result?.owner_phone || '',
    submit_time: props.result?.submit_time || '',
    djid: props.result?.djid || ''
  }))

  const qrLink = computed(() => {
    const carid = certData.value?.carid
    return carid ? `https://bfc.chexinmeng.com/carInfo.html?id=${carid}` : ''
  })

  async function loadCertificateData(djid: string) {
    if (!djid || certLoading.value) return
    certLoading.value = true
    try {
      const [hszmRes, cllxRes] = await Promise.all([
        fetchBfdjPrintHszm(djid).catch(() => null),
        fetchDataDictList({ dict_type: 'car_cllx_ga', status: 1, limit: 1000 }).catch(() => ({
          list: []
        }))
      ])
      certData.value = hszmRes
      certCllxOptions.value = (cllxRes?.list || []).map((item) => ({
        label: item.dict_label,
        value: item.dict_value
      }))
    } finally {
      certLoading.value = false
    }
  }

  function handlePrintCertificate() {
    const djid = displayData.value.djid
    if (!djid) {
      ElMessage.warning('缺少登记ID，无法打印回收证明')
      return
    }
    window.open(`https://bfc.chexinmeng.com/hszma4?id=${djid}`, '_blank')
  }

  function handleClosed() {
    certData.value = null
    certCllxOptions.value = []
  }

  watch(
    () => visible.value,
    (open) => {
      if (open) {
        const djid = displayData.value.djid
        if (djid) loadCertificateData(djid)
      } else {
        handleClosed()
      }
    }
  )
</script>
