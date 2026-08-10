<template>
  <ElDialog
    v-model="visible"
    width="1100px"
    align-center
    append-to-body
    :show-close="false"
    style="padding: 0 !important"
    class="submit-success-dialog"
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

    <RecycleCertificate
      ref="certRef"
      :djid="displayData.djid"
      :show-actions="false"
      tag="商务部已开具"
    />

    <template #footer>
      <div class="footer-tip">证明文件由商务部系统自动生成，如需更新请重新抓取</div>
      <div class="dialog-footer-actions">
        <ElButton @click="visible = false">关闭</ElButton>
        <ElButton type="success" plain @click="handlePrintCertificate">
          <ArtSvgIcon icon="ri:printer-line" />
          打印回收证明
        </ElButton>
        <ElButton type="primary" :loading="fetching" @click="emit('fetch-archive')">
          <ArtSvgIcon icon="ri:refresh-line" />
          抓取车辆档案信息
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { AcceptSubmitResult } from '@/types/recycle/recovery/commerce/accept'
  import { ElMessage } from 'element-plus'
  import RecycleCertificate from './recycle-certificate.vue'
  import './submit-result-dialog.scss'

  defineOptions({ name: 'VehicleArchiveSubmitResultDialog' })

  interface Props {
    /** 提交结果详情。 */
    result: AcceptSubmitResult | null
    /** 抓取车辆档案信息中。 */
    fetching?: boolean
  }

  const props = defineProps<Props>()
  const visible = defineModel<boolean>('visible', { required: true })

  const emit = defineEmits<{
    /** 抓取商务部车辆档案。 */
    'fetch-archive': []
  }>()

  const displayData = computed(() => ({
    vin: props.result?.vin || props.result?.vehicle_vin || '',
    plate_no: props.result?.plate_no || props.result?.vehicle_plate || '',
    owner_name: props.result?.owner_name || '',
    owner_phone: props.result?.owner_phone || '',
    submit_time: props.result?.submit_time || '',
    djid: props.result?.djid || ''
  }))

  function handlePrintCertificate() {
    const djid = displayData.value.djid
    if (!djid) {
      ElMessage.warning('缺少登记ID，无法打印回收证明')
      return
    }
    window.open(`https://bfc.chexinmeng.com/hszma4?id=${djid}`, '_blank')
  }

  const certRef = ref<InstanceType<typeof RecycleCertificate> | null>(null)

  watch(
    () => visible.value,
    (open) => {
      if (open) certRef.value?.reload()
    }
  )
</script>
