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
          「查验类型显示」列按配件名称聚合三种查验类型（汽油/柴油、电/混动、摩托车），点击标签即可切换该配件是否适用于对应查验类型。
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
            row-key="key"
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
  import { ElInputNumber, ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchCollectPriceDelete,
    fetchCollectPriceList,
    fetchInspectionItemGroupedList,
    fetchInspectionItemRequired,
    fetchInspectionItemUpdate
  } from '@/api/recycle/price-config'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    CollectPriceItem,
    InspectionItemGrouped,
    InspectionItemType,
    InspectionItemTypeConfig
  } from '@/types/recycle/system/system'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import CollectPriceDialog from './modules/collect-price-dialog.vue'

  defineOptions({ name: 'SystemPrice' })

  const activeTab = ref<'vehicle' | 'parts'>('vehicle')
  const collectDialogVisible = ref(false)
  const collectEditing = ref<CollectPriceItem | null>(null)
  const editPartKey = ref<string | null>(null)
  const editPartAmount = ref(0)
  /** 正在提交查验类型变更的配件，避免重复点击 */
  const savingTypeKey = ref<string | null>(null)

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

  // ----- 配件查验：查验类型 / 扣款金额 -----

  /** 查验类型枚举与展示文案（后端 item_type：gasoline|electric|motorcycle） */
  const INSPECTION_TYPE_OPTIONS: { value: InspectionItemType; label: string }[] = [
    { value: 'gasoline', label: '汽油/柴油' },
    { value: 'electric', label: '电/混动' },
    { value: 'motorcycle', label: '摩托车' }
  ]

  /** 取配件在某一查验类型下的配置项，无记录表示该类型未配置该配件 */
  function getTypeConfig(
    row: InspectionItemGrouped,
    type: InspectionItemType
  ): InspectionItemTypeConfig | undefined {
    const config = row.items?.[type]
    return config?.id ? config : undefined
  }

  /** 该配件在某查验类型下是否适用（接口 is_required：1适用） */
  function isTypeApplicable(row: InspectionItemGrouped, type: InspectionItemType) {
    const config = getTypeConfig(row, type)
    if (!config) return false
    return Number(config.is_required ?? 1) === 1
  }

  /** 汇总聚合行下所有查验类型的配置项 */
  function getRowTypeConfigs(row: InspectionItemGrouped): InspectionItemTypeConfig[] {
    return INSPECTION_TYPE_OPTIONS.map((opt) => getTypeConfig(row, opt.value)).filter(
      (config): config is InspectionItemTypeConfig => !!config
    )
  }

  /** 渲染「查验类型显示」列：适用类型高亮，点击切换适用状态 */
  function renderInspectionTypes(row: InspectionItemGrouped) {
    const tags = INSPECTION_TYPE_OPTIONS.map((opt) => {
      const config = getTypeConfig(row, opt.value)
      if (!config) return null
      const applicable = isTypeApplicable(row, opt.value)
      const saving = savingTypeKey.value === row.key
      return h(
        'button',
        {
          type: 'button',
          class: ['price-inspect-tag', `is-${opt.value}`, applicable ? 'is-on' : 'is-off'],
          title: `点击${applicable ? '取消' : '设为'}「${opt.label}」适用`,
          disabled: saving,
          onClick: () => toggleInspectionType(row, opt.value)
        },
        opt.label
      )
    }).filter(Boolean)
    if (!tags.length) return h('span', null, '—')
    return h('div', { class: 'price-type-tags' }, tags)
  }

  /** 切换配件在指定查验类型下的适用状态 */
  async function toggleInspectionType(row: InspectionItemGrouped, type: InspectionItemType) {
    const config = getTypeConfig(row, type)
    if (!config || savingTypeKey.value) return
    const isRequired = isTypeApplicable(row, type) ? 0 : 1
    savingTypeKey.value = row.key
    try {
      await fetchInspectionItemRequired([{ id: config.id, is_required: isRequired }])
      await getInspectData()
    } finally {
      savingTypeKey.value = null
    }
  }

  function startPartEdit(row: InspectionItemGrouped) {
    editPartKey.value = row.key
    editPartAmount.value = Number(row.deduction_amount || 0)
  }

  function cancelPartEdit() {
    editPartKey.value = null
  }

  /** 保存扣款金额：聚合行包含多种查验类型的记录，需同步更新 */
  async function savePartAmount(row: InspectionItemGrouped) {
    const targets = getRowTypeConfigs(row)
    if (!targets.length) {
      editPartKey.value = null
      return
    }
    for (const target of targets) {
      await fetchInspectionItemUpdate(target.id, editPartAmount.value, {
        showSuccessMessage: false
      })
    }
    ElMessage.success('更新成功')
    editPartKey.value = null
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

  function buildInspectColumns(): ColumnOption<InspectionItemGrouped>[] {
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
        prop: 'inspection_types',
        label: '查验类型显示',
        minWidth: 240,
        formatter: (row) => renderInspectionTypes(row)
      },
      {
        prop: 'deduction_amount',
        label: '缺失扣款金额（元）',
        minWidth: 200,
        formatter: (row) => {
          if (editPartKey.value === row.key) {
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
      apiFn: fetchInspectionItemGroupedList,
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
