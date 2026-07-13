<template>
  <div class="price-page art-full-height">
    <div class="price-header">
      <div class="price-title">价格配置</div>
      <div class="price-desc">报废基础价格体系配置</div>
    </div>

    <div class="price-tabs">
      <button
        type="button"
        class="price-tab"
        :class="{ 'is-active': activeTab === 'vehicle' }"
        @click="activeTab = 'vehicle'"
      >
        收车价格配置
      </button>
      <button
        type="button"
        class="price-tab"
        :class="{ 'is-active': activeTab === 'parts' }"
        @click="activeTab = 'parts'"
      >
        配件查验价格配置
      </button>
    </div>

    <!-- 收车价格 -->
    <template v-if="activeTab === 'vehicle'">
      <div class="price-tip">
        <ArtSvgIcon icon="ri:information-line" class="price-tip-ico" />
        <div>
          <strong>价格体系说明：</strong>基础价格按品牌+年份+里程区间配置。 最终结算价 = 基础价格 +
          自送补贴 - 质检缺件扣款 ± 其他调整。
        </div>
      </div>

      <div class="price-list-page">
        <div class="price-panel-head">
          <span class="price-panel-title">收车价格配置列表</span>
          <ElButton type="primary" plain @click="openCollectCreate">
            <ArtSvgIcon icon="ri:add-line" class="mr-1" />
            新增规则
          </ElButton>
        </div>
        <ElCard
          class="price-table-card art-table-card"
          shadow="never"
          :body-style="{ padding: '0 0 12px' }"
        >
          <ArtTable
            :loading="collectLoading"
            :data="collectData"
            :columns="collectColumns"
            :pagination="collectPagination"
            :show-table-header="false"
            :stripe="false"
            row-key="id"
            @pagination:size-change="handleCollectSizeChange"
            @pagination:current-change="handleCollectCurrentChange"
          />
        </ElCard>
      </div>
    </template>

    <!-- 配件查验 -->
    <template v-else>
      <div class="price-tip">
        <ArtSvgIcon icon="ri:information-line" class="price-tip-ico" />
        <div>
          <strong>配件查验扣款说明：</strong>以下配件清单与质检工单第二步的查验配件保持一致，
          可配置各配件缺失时的扣款金额，系统在生成质检报告时自动计算总扣款。
        </div>
      </div>

      <div class="price-list-page">
        <div class="price-panel-head">
          <div>
            <span class="price-panel-title">配件查验价格配置列表</span>
            <span class="price-panel-meta">共 {{ inspectPagination.total }} 个配件</span>
          </div>
        </div>
        <ElCard class="price-table-card art-table-card" shadow="never" :body-style="{ padding: 0 }">
          <ArtTable
            :loading="inspectLoading"
            :data="inspectData"
            :columns="inspectColumns"
            :pagination="inspectPagination"
            :show-table-header="false"
            :stripe="false"
            row-key="id"
            @pagination:size-change="handleInspectSizeChange"
            @pagination:current-change="handleInspectCurrentChange"
          />
        </ElCard>
      </div>
    </template>

    <CollectPriceDialog
      v-model:visible="collectDialogVisible"
      :record="collectEditing"
      @success="getCollectData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElInputNumber, ElMessageBox } from 'element-plus'
  import {
    fetchCollectPriceDelete,
    fetchCollectPriceList,
    fetchInspectionItemList,
    fetchInspectionItemUpdate
  } from '@/api/recycle/price-config'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type { CollectPriceItem, InspectionItem } from '@/types/recycle/system'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import CollectPriceDialog from './modules/collect-price-dialog.vue'

  defineOptions({ name: 'SystemPrice' })

  const activeTab = ref<'vehicle' | 'parts'>('vehicle')
  const collectDialogVisible = ref(false)
  const collectEditing = ref<CollectPriceItem | null>(null)
  const editPartId = ref<number | null>(null)
  const editPartAmount = ref(0)

  function formatMoney(val?: number) {
    return Number(val || 0).toLocaleString('zh-CN')
  }

  function formatYearRange(row: CollectPriceItem) {
    const s = Number(row.year_start || 0)
    const e = Number(row.year_end || 0)
    if (!s && !e) return '—'
    return `${s || '—'}-${e || '—'}`
  }

  function formatMileageRange(row: CollectPriceItem) {
    const s = Number(row.mileage_start || 0)
    const e = Number(row.mileage_end || 0)
    if (!s && !e) return '—'
    return `${s}-${e}万km`
  }

  function openCollectCreate() {
    collectEditing.value = null
    collectDialogVisible.value = true
  }

  function openCollectEdit(row: CollectPriceItem) {
    if (!row.id) return
    collectEditing.value = { ...row }
    collectDialogVisible.value = true
  }

  async function handleCollectDelete(row: CollectPriceItem) {
    if (!row.id) return
    try {
      await ElMessageBox.confirm(`确认删除「${row.brand || row.id}」价格规则？`, '删除确认', {
        type: 'warning',
        confirmButtonText: '确认删除'
      })
    } catch {
      return
    }
    await fetchCollectPriceDelete(row.id)
    await getCollectData()
  }

  function startPartEdit(row: InspectionItem) {
    editPartId.value = row.id
    editPartAmount.value = Number(row.deduction_amount || 0)
  }

  function cancelPartEdit() {
    editPartId.value = null
  }

  async function savePartAmount(row: InspectionItem) {
    await fetchInspectionItemUpdate(row.id, editPartAmount.value)
    editPartId.value = null
    await getInspectData()
  }

  function buildCollectColumns(): ColumnOption<CollectPriceItem>[] {
    return [
      {
        prop: 'brand',
        label: '品牌',
        minWidth: 120,
        formatter: (row) => h('span', null, row.brand || '—')
      },
      {
        prop: 'vehicle_type_name',
        label: '车辆类型',
        minWidth: 110,
        formatter: (row) =>
          h('span', { class: 'price-type-tag' }, row.vehicle_type_name || row.vehicle_type || '—')
      },
      {
        prop: 'year_start',
        label: '年份区间',
        minWidth: 120,
        formatter: (row) => h('span', null, formatYearRange(row))
      },
      {
        prop: 'mileage_start',
        label: '里程区间',
        minWidth: 130,
        formatter: (row) => h('span', null, formatMileageRange(row))
      },
      {
        prop: 'base_price',
        label: '基础价格（元）',
        minWidth: 140,
        formatter: (row) => h('span', { class: 'price-amount' }, `¥${formatMoney(row.base_price)}`)
      },
      {
        prop: 'operation',
        label: '操作',
        minWidth: 180,
        align: 'center',
        fixed: 'right',
        formatter: (row) =>
          h('div', { class: 'order-actions' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn ghost',
                onClick: () => openCollectEdit(row)
              },
              [h(ArtSvgIcon, { icon: 'ri:edit-line', class: 'order-action-icon' }), '编辑']
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn danger',
                onClick: () => handleCollectDelete(row)
              },
              [h(ArtSvgIcon, { icon: 'ri:delete-bin-line', class: 'order-action-icon' }), '删除']
            )
          ])
      }
    ]
  }

  function buildInspectColumns(): ColumnOption<InspectionItem>[] {
    return [
      {
        prop: 'category_name',
        label: '配件类别',
        minWidth: 120,
        formatter: (row) => h('span', { class: 'price-cat-tag' }, row.category_name || '—')
      },
      {
        prop: 'item_name',
        label: '配件名称',
        minWidth: 160,
        formatter: (row) => h('span', null, row.item_name || '—')
      },
      {
        prop: 'deduction_amount',
        label: '缺失扣款金额（元）',
        minWidth: 200,
        formatter: (row) => {
          if (editPartId.value === row.id) {
            return h('div', { class: 'price-inline-edit' }, [
              h(ElInputNumber, {
                modelValue: editPartAmount.value,
                'onUpdate:modelValue': (v: number | undefined) => {
                  editPartAmount.value = Number(v || 0)
                },
                min: 0,
                precision: 0,
                controlsPosition: 'right',
                // size: 'small',
                class: 'price-inline-input'
              }),
              h(
                'button',
                {
                  type: 'button',
                  class: 'price-icon-btn is-ok',
                  onClick: () => savePartAmount(row)
                },
                [h(ArtSvgIcon, { icon: 'ri:check-line' })]
              ),
              h(
                'button',
                {
                  type: 'button',
                  class: 'price-icon-btn is-cancel',
                  onClick: cancelPartEdit
                },
                [h(ArtSvgIcon, { icon: 'ri:close-line' })]
              )
            ])
          }
          return h('span', { class: 'price-deduct' }, `-¥${formatMoney(row.deduction_amount)}`)
        }
      },
      {
        prop: 'operation',
        label: '操作',
        minWidth: 140,
        align: 'center',
        fixed: 'right',
        formatter: (row) =>
          h('div', { class: 'order-actions' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn ghost',
                onClick: () => startPartEdit(row)
              },
              [h(ArtSvgIcon, { icon: 'ri:edit-line', class: 'order-action-icon' }), '编辑扣款']
            )
          ])
      }
    ]
  }

  const {
    columns: collectColumns,
    data: collectData,
    loading: collectLoading,
    pagination: collectPagination,
    getData: getCollectData,
    handleSizeChange: handleCollectSizeChange,
    handleCurrentChange: handleCollectCurrentChange
  } = useTable({
    core: {
      apiFn: fetchCollectPriceList,
      apiParams: {
        current: 1,
        size: 15
      },
      columnsFactory: () => buildCollectColumns()
    }
  })

  const {
    columns: inspectColumns,
    data: inspectData,
    loading: inspectLoading,
    pagination: inspectPagination,
    getData: getInspectData,
    handleSizeChange: handleInspectSizeChange,
    handleCurrentChange: handleInspectCurrentChange
  } = useTable({
    core: {
      apiFn: fetchInspectionItemList,
      apiParams: {
        current: 1,
        size: 50
      },
      immediate: false,
      columnsFactory: () => buildInspectColumns()
    }
  })

  watch(activeTab, (tab) => {
    if (tab === 'vehicle') getCollectData()
    else getInspectData()
  })
</script>

<style lang="scss">
  @use './price';

  .mr-1 {
    margin-right: 4px;
  }
</style>
