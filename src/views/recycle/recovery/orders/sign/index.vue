<template>
  <div class="orders-page art-full-height sign-page">
    <div class="order-page-header">
      <div>
        <div class="order-page-title">订单附件签名</div>
        <div class="order-page-desc">
          展示所有含待签名附件的正式回收订单，支持逐单签名或批量一键完成签名，可保存签名模板复用
        </div>
      </div>
    </div>

    <div class="order-toolbar sign-toolbar">
      <ElInput
        v-model="keyword"
        class="order-toolbar-search"
        placeholder="搜索订单号 / 车主姓名 / 车牌号"
        clearable
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="order-toolbar-search-icon" />
        </template>
      </ElInput>

      <span class="sign-toolbar-count">
        共 <em>{{ pagination.total || 0 }}</em> 条待签名
      </span>

      <ElButton @click="templateVisible = true">
        <ArtSvgIcon icon="ri:star-line" class="mr-1" />
        签名模板
      </ElButton>

      <ElButton type="primary" :disabled="!selectedRows.length" @click="openBatchSign">
        <ArtSvgIcon icon="ri:check-line" class="mr-1" />
        批量一键签名{{ selectedRows.length ? `（${selectedRows.length}）` : '' }}
      </ElButton>
    </div>

    <ElCard
      class="order-table-card art-table-card"
      shadow="never"
      :body-style="{ padding: 0, paddingBottom: '20px' }"
    >
      <ArtTable
        ref="tableRef"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        :show-table-header="false"
        :stripe="false"
        row-key="id"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <OrderSignDialog
      v-model:visible="orderSignVisible"
      :order-id="signingOrderId"
      :order-no="signingOrderNo"
      :real-name="signingRealName"
      :plate-no="signingPlateNo"
      :brand="signingBrand"
      :model="signingModel"
      @signed="handleSigned"
    />

    <BatchOrderSignDialog
      v-model:visible="batchSignVisible"
      :order-ids="selectedOrderIds"
      :order-nos="selectedOrderNos"
      :pending-attach-count="selectedPendingCount"
      @signed="handleSigned"
    />

    <SignTemplateManagerDialog v-model:visible="templateVisible" />

    <FormalOrderDetailDialog
      v-model:visible="formalDetailVisible"
      :order-id="formalDetailOrderId"
      @refresh="handleSigned"
    />
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { ColumnOption } from '@/types/component'
  import { fetchOrderList } from '@/api/recycle/order'
  import { useTable } from '@/hooks/core/useTable'
  import type { OrderSearchParams, RecycleOrder } from '@/types/recycle/order'
  import { getOrderDisplayNo } from '@/types/recycle/order'
  import OrderSignDialog from '../modules/order-sign-dialog.vue'
  import BatchOrderSignDialog from '../modules/batch-order-sign-dialog.vue'
  import SignTemplateManagerDialog from '../modules/sign-template-manager-dialog.vue'
  import FormalOrderDetailDialog from '../modules/formal-order-detail-dialog.vue'

  defineOptions({ name: 'RecycleOrderSign' })

  const keyword = ref('')
  const selectedRows = ref<RecycleOrder[]>([])
  const tableRef = ref<{
    elTableRef?: {
      clearSelection: () => void
    }
  } | null>(null)

  const templateVisible = ref(false)
  const orderSignVisible = ref(false)
  const batchSignVisible = ref(false)
  const formalDetailVisible = ref(false)
  const formalDetailOrderId = ref<number | null>(null)
  const signingOrderId = ref<number | null>(null)
  const signingOrderNo = ref('')
  const signingRealName = ref('')
  const signingPlateNo = ref('')
  const signingBrand = ref('')
  const signingModel = ref('')

  const selectedOrderIds = computed(() => selectedRows.value.map((r) => r.id))
  const selectedOrderNos = computed(() => selectedRows.value.map((r) => getOrderDisplayNo(r)))
  const selectedPendingCount = computed(() => {
    const sum = selectedRows.value.reduce((acc, row) => {
      const n = Number(row.pending_sign_count ?? row.unsigned_attach_count ?? 0)
      return acc + (Number.isFinite(n) ? n : 0)
    }, 0)
    return sum > 0 ? sum : undefined
  })

  function getPendingCount(row: RecycleOrder) {
    const n = Number(row.pending_sign_count ?? row.unsigned_attach_count)
    if (Number.isFinite(n) && n > 0) return n
    return null
  }

  function renderCustomerCell(row: RecycleOrder) {
    return h('div', { class: 'order-customer-cell' }, [
      h('div', { class: 'order-customer-name' }, row.real_name || '—')
    ])
  }

  function renderVehicleCell(row: RecycleOrder) {
    if (row.batch_display) {
      return h('div', { class: 'order-vehicle-cell' }, [
        h('div', { class: 'order-batch-title' }, row.batch_display),
        h(
          'div',
          { class: 'order-vehicle-sub' },
          [row.brand, row.model].filter(Boolean).join(' ') || '—'
        )
      ])
    }
    return h('div', { class: 'order-vehicle-cell' }, [
      h('div', { class: 'order-customer-name' }, row.plate_no || '—'),
      h(
        'div',
        { class: 'order-vehicle-sub' },
        [row.brand, row.model].filter(Boolean).join(' ') || '—'
      )
    ])
  }

  function renderPendingCount(row: RecycleOrder) {
    const n = getPendingCount(row)
    if (n == null) {
      return h('span', { class: 'order-muted' }, '待签')
    }
    return h('span', {}, [
      h('span', { class: 'sign-pending-num' }, String(n)),
      h('span', { class: 'order-muted' }, ' 份')
    ])
  }

  function openOrderSign(row: RecycleOrder) {
    signingOrderId.value = row.id
    signingOrderNo.value = getOrderDisplayNo(row)
    signingRealName.value = row.real_name || ''
    signingPlateNo.value = row.plate_no || ''
    signingBrand.value = row.brand || ''
    signingModel.value = row.model || ''
    orderSignVisible.value = true
  }

  function openOrderDetail(row: RecycleOrder) {
    formalDetailOrderId.value = row.id
    formalDetailVisible.value = true
  }

  function buildColumns(): ColumnOption<RecycleOrder>[] {
    return [
      { type: 'selection', width: 48, fixed: 'left' },
      {
        prop: 'order_no',
        width: 200,
        label: '订单编号',
        formatter: (row: RecycleOrder) =>
          h(
            'a',
            {
              href: 'javascript:void(0)',
              class: 'order-no',
              onClick: () => openOrderDetail(row)
            },
            getOrderDisplayNo(row)
          )
      },
      {
        prop: 'real_name',
        label: '车主信息',
        formatter: (row: RecycleOrder) => renderCustomerCell(row)
      },
      {
        prop: 'plate_no',
        label: '车辆信息',
        formatter: (row: RecycleOrder) => renderVehicleCell(row)
      },
      {
        prop: 'add_time_text',
        label: '创建时间',
        formatter: (row: RecycleOrder) =>
          h('span', { class: 'order-time' }, row.add_time_text || '—')
      },
      {
        prop: 'pending_sign_count',
        label: '待签附件',
        formatter: (row: RecycleOrder) => renderPendingCount(row)
      },
      {
        prop: 'sign_status',
        label: '签名状态',
        formatter: () => h('span', { class: 'order-status-tag sign-status-pending' }, '待签名')
      },
      {
        prop: 'operation',
        label: '操作',
        align: 'center',
        fixed: 'right',
        formatter: (row: RecycleOrder) =>
          h('div', { class: 'order-actions' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn ghost',
                onClick: () => openOrderSign(row)
              },
              [
                h(ArtSvgIcon, { icon: 'ri:pen-nib-line', class: 'order-action-icon' }),
                h('span', '去签名')
              ]
            )
          ])
      }
    ]
  }

  const defaultParams = (): OrderSearchParams => ({
    current: 1,
    size: 20,
    tab: 'formal_order',
    signStatus: 'pending_sign',
    keyword: undefined,
    progress: 'all',
    orderSource: 'all',
    orderStatus: 'all',
    batchType: 'all',
    leadFollowStatus: 'all',
    leadType: 'all',
    towingStatus: 'all'
  })

  const {
    columns,
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchOrderList,
      apiParams: {
        ...defaultParams()
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    }
  })

  function handleSearch() {
    selectedRows.value = []
    tableRef.value?.elTableRef?.clearSelection?.()
    replaceSearchParams({
      ...defaultParams(),
      keyword: keyword.value.trim() || undefined,
      current: 1
    })
    getData()
  }

  function handleSelectionChange(rows: RecycleOrder[]) {
    selectedRows.value = rows
  }

  function openBatchSign() {
    if (!selectedRows.value.length) {
      ElMessage.warning('请先勾选待签名订单')
      return
    }
    batchSignVisible.value = true
  }

  function handleSigned() {
    selectedRows.value = []
    tableRef.value?.elTableRef?.clearSelection?.()
    refreshData()
  }
</script>

<style lang="scss">
  @use '../orders';
</style>

<style lang="scss">
  .sign-page {
    .sign-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      padding: 16px;
      background: var(--default-box-color);
      border: 1px solid var(--art-card-border);
      border-radius: calc(var(--custom-radius) + 2px);
    }

    .order-toolbar-search {
      flex: 1;
      min-width: 260px;

      :deep(.el-input__wrapper) {
        box-shadow: 0 0 0 1px var(--art-card-border) inset;
      }
    }

    .order-toolbar-search-icon {
      font-size: 16px;
      color: var(--art-gray-400);
    }

    .sign-toolbar-count {
      flex-shrink: 0;
      font-size: 13px;
      color: var(--art-gray-500);
      white-space: nowrap;

      em {
        font-style: normal;
        font-weight: 600;
        color: var(--art-gray-800);
      }
    }

    .sign-pending-num {
      font-size: 14px;
      font-weight: 600;
      color: #d48806;
    }

    .sign-status-pending {
      color: #d48806 !important;
      background: #fffbe6 !important;
      border-color: #ffe58f !important;
    }

    background: #f5f5f5;
  }
</style>
