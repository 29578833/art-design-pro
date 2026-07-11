<template>
  <ElDialog
    v-model="dialogVisible"
    width="820px"
    align-center
    destroy-on-close
    :show-close="false"
    class="qr-report-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div class="qr-header">
        <div>
          <div class="qr-header-title">车辆质检报告</div>
          <div v-if="detail" class="qr-header-sub">
            {{ detail.check_no || '—' }} · {{ detail.plate_no || '—' }} · {{ brandModelText }}
          </div>
        </div>
        <div class="qr-header-actions">
          <ElButton type="primary" @click="downloadPdf">
            <ArtSvgIcon icon="ri:download-2-line" class="qr-btn-icon" />
            下载PDF
          </ElButton>
          <button type="button" class="qr-close-btn" @click="dialogVisible = false">
            <ArtSvgIcon icon="ri:close-line" />
          </button>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="qr-body">
      <template v-if="detail">
        <!-- ① 报告标题区 -->
        <div class="qr-title-card">
          <div class="qr-main-title">鑫广汽车拆解 · 车辆质检报告</div>
          <div class="qr-title-meta">
            报告编号：<span class="qr-mono">{{ detail.check_no || '—' }}</span>
            <span class="qr-meta-divider">|</span>
            质检时间：{{ detail.check_time || '—' }}
            <span class="qr-meta-divider">|</span>
            质检员：{{ detail.inspector_name || '—' }}
          </div>
        </div>

        <!-- ② 车辆基本信息 -->
        <div class="qr-card">
          <div class="qr-card-title">车辆基本信息</div>
          <div class="qr-info-grid">
            <div v-for="field in vehicleFields" :key="field.label" class="qr-info-row">
              <span class="qr-info-label">{{ field.label }}</span>
              <span class="qr-info-value">{{ field.value }}</span>
            </div>
          </div>
        </div>

        <!-- ③ 入场称重信息 -->
        <div class="qr-card">
          <div class="qr-card-title">入场称重信息</div>
          <div class="qr-stat-grid cols-4">
            <div v-for="stat in weightStats" :key="stat.label" class="qr-stat-box">
              <div class="qr-stat-label">{{ stat.label }}</div>
              <div class="qr-stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
            </div>
          </div>
        </div>

        <!-- ④ 质检汇总 -->
        <div class="qr-card">
          <div class="qr-card-title">质检汇总</div>
          <div class="qr-stat-grid cols-4 mb-4">
            <div v-for="stat in summaryStats" :key="stat.label" class="qr-stat-box">
              <div class="qr-stat-label">{{ stat.label }}</div>
              <div class="qr-stat-value" :style="{ color: stat.color, fontSize: '16px' }">
                {{ stat.value }}
              </div>
            </div>
          </div>
          <div class="qr-conclusion-banner" :style="conclusionBannerStyle">
            <ArtSvgIcon
              :icon="conclusionPass ? 'ri:checkbox-circle-line' : 'ri:error-warning-line'"
              class="qr-conclusion-icon"
              :style="{ color: conclusionPass ? '#52c41a' : '#ff7875' }"
            />
            <div>
              <div
                class="qr-conclusion-main"
                :style="{ color: conclusionPass ? '#389e0d' : '#cf1322' }"
              >
                质检结论：{{ conclusionMainText }}
              </div>
              <div
                class="qr-conclusion-sub"
                :style="{ color: conclusionPass ? '#52c41a' : '#ff4d4f' }"
              >
                {{ conclusionSubText }}
              </div>
            </div>
          </div>
        </div>

        <!-- ⑤ 6大类别逐项明细 -->
        <div class="qr-card">
          <div class="qr-card-title">质检逐项明细（6大类别）</div>
          <div class="qr-category-list">
            <div v-for="cat in groupedCategories" :key="cat.name" class="qr-category-block">
              <div class="qr-category-head">
                <div class="qr-category-icon" :style="{ background: getCategoryBg(cat.name) }">
                  <ArtSvgIcon
                    :icon="getCategoryIcon(cat.name)"
                    :style="{ color: getCategoryColor(cat.name) }"
                  />
                </div>
                <span class="qr-category-name">{{ cat.name }}</span>
                <span class="qr-category-count">共 {{ cat.items.length }} 项</span>
                <span v-if="cat.missing > 0 || cat.damaged > 0" class="qr-category-problem">
                  {{ cat.missing > 0 ? `缺失${cat.missing}` : '' }}
                  {{ cat.missing > 0 && cat.damaged > 0 ? '·' : '' }}
                  {{ cat.damaged > 0 ? `损坏${cat.damaged}` : '' }}
                </span>
                <span v-else class="qr-category-ok">全部完好</span>
              </div>
              <div class="qr-item-grid">
                <div
                  v-for="item in cat.items"
                  :key="item.id"
                  class="qr-item-cell"
                  :style="getItemCellStyle(item.status)"
                >
                  <span class="qr-item-name">{{ item.item_name }}</span>
                  <div class="qr-item-right">
                    <span v-if="item.status !== 1" class="qr-item-deduct">
                      -¥{{ Number(item.deduction_amount || 0).toFixed(0) }}
                    </span>
                    <span class="qr-item-badge" :style="getItemBadgeStyle(item.status)">
                      {{ QC_ITEM_STATUS_CFG[item.status]?.short || '—' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ⑥ 缺损件扣款明细 -->
        <div v-if="badItems.length > 0" class="qr-card">
          <div class="qr-card-title">缺损件扣款明细</div>
          <table class="qr-deduct-table">
            <thead>
              <tr>
                <th>零部件名称</th>
                <th>问题类型</th>
                <th>扣款金额（元）</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in badItems" :key="item.id">
                <td>{{ item.item_name }}</td>
                <td>
                  <span class="qr-problem-tag" :style="getItemBadgeStyle(item.status)">
                    {{ QC_ITEM_STATUS_CFG[item.status]?.label }}
                  </span>
                </td>
                <td class="qr-deduct-amount">
                  -¥{{ Number(item.actual_deduction ?? item.deduction_amount ?? 0).toFixed(2) }}
                </td>
              </tr>
              <tr class="qr-deduct-total">
                <td colspan="2">合计扣款</td>
                <td class="qr-deduct-amount">
                  -¥{{ Number(detail.total_deduction || 0).toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ⑦ 确认签章 -->
        <div class="qr-card">
          <div class="qr-card-title">确认签章</div>
          <div class="qr-sign-grid">
            <div v-for="role in SIGN_ROLES" :key="role" class="qr-sign-item">
              <div class="qr-sign-role">{{ role }}</div>
              <div class="qr-sign-box">
                <span class="qr-sign-placeholder">签名 / 盖章</span>
              </div>
              <div class="qr-sign-date">日期：________________</div>
            </div>
          </div>
        </div>

        <!-- ⑧ 免责声明 -->
        <div class="qr-disclaimer">
          本报告由鑫广汽车拆解管理系统自动生成 · 报告编号 {{ detail.check_no || '—' }} ·
          如有疑问请联系质检部门
        </div>
      </template>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchQualityDetail, previewQualityPdf } from '@/api/recycle/quality'
  import type { QualityDetail, QualityCheckItem, ItemStatus } from '@/types/recycle/quality'
  import {
    QC_CATEGORY_COLORS,
    QC_CATEGORY_BG,
    QC_CATEGORY_ICONS,
    QC_ITEM_STATUS_CFG
  } from '@/types/recycle/quality'

  interface Props {
    visible: boolean
    checkId: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>()

  const SIGN_ROLES = ['质检员', '质检主管', '客户确认']

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  const loading = ref(false)
  const detail = ref<QualityDetail | null>(null)

  const brandModelText = computed(() => {
    if (!detail.value) return '—'
    if (detail.value.brand) {
      return [detail.value.brand, detail.value.model].filter(Boolean).join(' ')
    }
    return (detail.value.brand_model as string) || '—'
  })

  const netWeight = computed(() => {
    if (!detail.value) return null
    const w =
      Number(detail.value.weight || 0) -
      Number(detail.value.tare_weight || 0) -
      Number(detail.value.deduction_weight || 0)
    return Math.max(0, Number(w.toFixed(2)))
  })

  const allItems = computed<QualityCheckItem[]>(() => detail.value?.items || [])
  const badItems = computed(() => allItems.value.filter((i) => i.status === 2 || i.status === 3))
  const okCount = computed(() => allItems.value.filter((i) => i.status === 1).length)
  const missingCount = computed(() => allItems.value.filter((i) => i.status === 2).length)
  const damagedCount = computed(() => allItems.value.filter((i) => i.status === 3).length)

  const conclusionPass = computed(() => missingCount.value === 0 && damagedCount.value === 0)

  const vehicleFields = computed(() => {
    if (!detail.value) return []
    const d = detail.value
    return [
      { label: '车牌号', value: d.plate_no || '—' },
      { label: 'VIN 码', value: d.vin || '—' },
      { label: '品牌车型', value: brandModelText.value },
      { label: '车辆类型', value: d.vehicle_type || (d.vehicle_type_text as string) || '—' },
      { label: '车主姓名', value: d.owner_name || d.real_name || '—' },
      { label: '关联订单', value: d.order_no || '—' },
      { label: '档案号', value: d.check_no || '—' },
      { label: '监销类型', value: d.is_supervision ? '监销车辆' : '非监销' },
      { label: '到场时间', value: d.arrival_time || '—' }
    ]
  })

  const weightStats = computed(() => {
    const nw = netWeight.value
    return [
      {
        label: '毛重',
        value: detail.value?.weight ? `${detail.value.weight} kg` : '—',
        color: '#595959'
      },
      {
        label: '皮重',
        value: detail.value?.tare_weight ? `${detail.value.tare_weight} kg` : '—',
        color: '#595959'
      },
      { label: '净重', value: nw !== null ? `${nw} kg` : '—', color: '#1677ff' },
      {
        label: '过磅结论',
        value: nw !== null && nw > 0 ? '称重完成' : '未称重',
        color: nw !== null && nw > 0 ? '#52C41A' : '#FA8C16'
      }
    ]
  })

  const summaryStats = computed(() => {
    const bad = missingCount.value + damagedCount.value
    const deduct = Number(detail.value?.total_deduction || 0)
    return [
      { label: '检查总项', value: `${allItems.value.length}项`, color: '#595959' },
      { label: '完好件', value: `${okCount.value}项`, color: '#52C41A' },
      { label: '缺失/损坏', value: `${bad}项`, color: bad > 0 ? '#FF4D4F' : '#52C41A' },
      {
        label: '预计扣款',
        value: `¥${deduct.toFixed(2)}`,
        color: deduct > 0 ? '#FF4D4F' : '#52C41A'
      }
    ]
  })

  const groupedCategories = computed(() => {
    const map = new Map<string, QualityCheckItem[]>()
    for (const item of allItems.value) {
      const name = item.item_category || '其他'
      if (!map.has(name)) map.set(name, [])
      map.get(name)!.push(item)
    }
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      items,
      missing: items.filter((i) => i.status === 2).length,
      damaged: items.filter((i) => i.status === 3).length
    }))
  })

  const conclusionMainText = computed(() => {
    if (conclusionPass.value) return '车况正常，可进入原料入库流程'
    return `存在${missingCount.value}件缺失、${damagedCount.value}件损坏，需扣款 ¥${Number(detail.value?.total_deduction || 0).toLocaleString()}`
  })

  const conclusionSubText = computed(() =>
    conclusionPass.value ? '各部件完好，无缺失件' : '详见下方逐项明细'
  )

  const conclusionBannerStyle = computed(() => ({
    background: conclusionPass.value ? '#F6FFED' : '#FFF1F0',
    border: `1px solid ${conclusionPass.value ? '#B7EB8F' : '#FFCCC7'}`
  }))

  function getCategoryColor(name: string) {
    return QC_CATEGORY_COLORS[name] || '#1677ff'
  }

  function getCategoryBg(name: string) {
    return QC_CATEGORY_BG[name] || '#E6F7FF'
  }

  function getCategoryIcon(name: string) {
    return QC_CATEGORY_ICONS[name] || 'ri:tools-line'
  }

  function getItemCellStyle(status: ItemStatus) {
    const cfg = QC_ITEM_STATUS_CFG[status] || QC_ITEM_STATUS_CFG[1]
    return {
      borderColor: status === 1 ? '#F0F0F0' : cfg.color,
      background: status === 1 ? '#FAFAFA' : cfg.bg
    }
  }

  function getItemBadgeStyle(status: ItemStatus) {
    const cfg = QC_ITEM_STATUS_CFG[status] || QC_ITEM_STATUS_CFG[1]
    return {
      color: cfg.color,
      background: cfg.bg
    }
  }

  async function downloadPdf() {
    if (!props.checkId) return
    if (detail.value?.pdf_url) {
      window.open(detail.value.pdf_url, '_blank')
      return
    }
    try {
      const res = await previewQualityPdf(props.checkId)
      if (res?.url) {
        window.open(res.url, '_blank')
      }
    } catch {
      // 错误已由 http 拦截器处理
    }
  }

  async function loadDetail() {
    if (!props.checkId) return
    loading.value = true
    try {
      detail.value = await fetchQualityDetail(props.checkId)
    } catch {
      detail.value = null
    } finally {
      loading.value = false
    }
  }

  watch(
    () => props.visible,
    (v) => {
      if (v && props.checkId) loadDetail()
    },
    { immediate: true }
  )

  function handleClosed() {
    detail.value = null
  }
</script>

<style lang="scss">
  .qr-report-dialog {
    padding: 0 !important;

    .el-dialog__header {
      padding: 0;
      margin: 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .el-dialog__body {
      padding: 0;
    }
  }
</style>

<style scoped lang="scss">
  .qr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
  }

  .qr-header-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .qr-header-sub {
    margin-top: 2px;
    font-size: 12px;
    color: #9ca3af;
  }

  .qr-header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .qr-btn-icon {
    margin-right: 4px;
    font-size: 16px;
  }

  .qr-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 20px;
    color: #9ca3af;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;

    &:hover {
      background: #f3f4f6;
    }
  }

  .qr-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: calc(92vh - 80px);
    padding: 20px 24px;
    overflow-y: auto;
    background: #f5f5f5;
  }

  .qr-title-card {
    padding: 20px;
    text-align: center;
    background: #fff;
    border-radius: 8px;
  }

  .qr-main-title {
    margin-bottom: 4px;
    font-size: 20px;
    font-weight: 700;
    color: #111827;
  }

  .qr-title-meta {
    font-size: 12px;
    color: #6b7280;
  }

  .qr-mono {
    color: #374151;
  }

  .qr-meta-divider {
    margin: 0 12px;
    color: #e5e7eb;
  }

  .qr-card {
    padding: 20px;
    background: #fff;
    border-radius: 8px;
  }

  .qr-card-title {
    padding-bottom: 8px;
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    border-bottom: 1px solid #f3f4f6;
  }

  .qr-info-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px 32px;
  }

  .qr-info-row {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .qr-info-label {
    flex-shrink: 0;
    width: 80px;
    padding-top: 2px;
    font-size: 12px;
    color: #9ca3af;
  }

  .qr-info-value {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
  }

  .qr-stat-grid {
    display: grid;
    gap: 12px;

    &.cols-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    &.mb-4 {
      margin-bottom: 16px;
    }
  }

  .qr-stat-box {
    padding: 12px;
    text-align: center;
    background: #f9fafb;
    border-radius: 8px;
  }

  .qr-stat-label {
    margin-bottom: 4px;
    font-size: 12px;
    color: #9ca3af;
  }

  .qr-stat-value {
    font-size: 15px;
    font-weight: 700;
  }

  .qr-conclusion-banner {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 16px;
    border-radius: 8px;
  }

  .qr-conclusion-icon {
    flex-shrink: 0;
    font-size: 20px;
  }

  .qr-conclusion-main {
    font-size: 14px;
    font-weight: 600;
  }

  .qr-conclusion-sub {
    margin-top: 2px;
    font-size: 12px;
  }

  .qr-category-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .qr-category-head {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .qr-category-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
  }

  .qr-category-name {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
  }

  .qr-category-count {
    font-size: 12px;
    color: #9ca3af;
  }

  .qr-category-problem {
    padding: 2px 6px;
    font-size: 12px;
    font-weight: 500;
    color: #ff4d4f;
    background: #fff1f0;
    border-radius: 4px;
  }

  .qr-category-ok {
    font-size: 12px;
    color: #52c41a;
  }

  .qr-item-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .qr-item-cell {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border: 1px solid;
    border-radius: 4px;
  }

  .qr-item-name {
    font-size: 12px;
    color: #374151;
  }

  .qr-item-right {
    display: flex;
    flex-shrink: 0;
    gap: 6px;
    align-items: center;
  }

  .qr-item-deduct {
    font-size: 12px;
    font-weight: 500;
    color: #ff4d4f;
  }

  .qr-item-badge {
    padding: 2px 6px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;
  }

  .qr-deduct-table {
    width: 100%;
    font-size: 14px;
    border-collapse: collapse;

    th {
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      text-align: left;
      background: #f9fafb;
    }

    td {
      padding: 8px 12px;
      color: #1f2937;
      border-top: 1px solid #f3f4f6;
    }

    tr {
      height: 40px;
    }
  }

  .qr-problem-tag {
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 12px;
  }

  .qr-deduct-amount {
    font-weight: 600;
    color: #ff4d4f;
  }

  .qr-deduct-total {
    font-weight: 600;
    background: #f9fafb;
  }

  .qr-sign-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
  }

  .qr-sign-item {
    text-align: center;
  }

  .qr-sign-role {
    margin-bottom: 8px;
    font-size: 12px;
    color: #6b7280;
  }

  .qr-sign-box {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 64px;
    border: 1px dashed #e5e7eb;
    border-radius: 8px;
  }

  .qr-sign-placeholder {
    font-size: 12px;
    color: #d1d5db;
  }

  .qr-sign-date {
    margin-top: 8px;
    font-size: 12px;
    color: #9ca3af;
  }

  .qr-disclaimer {
    padding-bottom: 8px;
    font-size: 12px;
    color: #9ca3af;
    text-align: center;
  }
</style>
