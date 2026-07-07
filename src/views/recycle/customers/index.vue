<template>
  <div class="customers-page art-full-height">
    <CustomerSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <GradeSummaryCards
      :stats="gradeStats"
      :active-grade="activeGrade"
      @select="handleGradeSelect"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshAll">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="showDialog('add')" v-ripple>新增档案</ElButton>
            <ElButton @click="handleExport" v-ripple>导出</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <CustomerDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :partner-data="currentPartner"
      @submit="handleDialogSubmit"
    />

    <CustomerDetailDrawer v-model:visible="drawerVisible" :partner="detailPartner" />
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { fetchPartnerGradeStats, fetchPartnerList } from '@/api/recycle/customer'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    CustomerGrade,
    GradeStatItem,
    PartnerSearchParams,
    RecyclePartner
  } from '@/types/recycle/customer'
  import {
    COOPERATION_TYPE_CONFIG,
    GRADE_CONFIG,
    PARTNER_CATEGORY_CONFIG,
    PARTNER_STATUS_CONFIG
  } from '@/types/recycle/customer'
  import type { DialogType } from '@/types'
  import CustomerSearch from './modules/customer-search.vue'
  import CustomerDialog from './modules/customer-dialog.vue'
  import CustomerDetailDrawer from './modules/customer-detail-drawer.vue'
  import GradeSummaryCards from './modules/grade-summary-cards.vue'
  import { ElTag } from 'element-plus'

  defineOptions({ name: 'RecycleCustomers' })

  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const drawerVisible = ref(false)
  const currentPartner = ref<Partial<RecyclePartner>>({})
  const detailPartner = ref<RecyclePartner | null>(null)
  const gradeStats = ref<GradeStatItem[]>([])
  const activeGrade = ref<CustomerGrade | 'all'>('all')

  const searchForm = ref<PartnerSearchParams>({
    current: 1,
    size: 20,
    keyword: undefined,
    category: 'all',
    type: 'all',
    grade: 'all',
    cooperationType: 'all',
    status: 'all'
  })

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchPartnerList,
      apiParams: {
        current: 1,
        size: 20,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        {
          prop: 'code',
          label: '编号',
          width: 130
        },
        {
          prop: 'name',
          label: '姓名/企业',
          minWidth: 180,
          formatter: (row) =>
            h('div', [
              h('div', { class: 'font-medium' }, row.name),
              row.enterprise
                ? h('div', { class: 'text-xs text-g-500 truncate' }, row.enterprise)
                : null
            ])
        },
        {
          prop: 'category',
          label: '分类',
          width: 90,
          formatter: (row) =>
            h(
              ElTag,
              { type: row.category === 'customer' ? 'primary' : 'warning', size: 'small' },
              () => PARTNER_CATEGORY_CONFIG[row.category].label
            )
        },
        { prop: 'phone', label: '联系电话', width: 130 },
        {
          prop: 'cooperationType',
          label: '合作商类型',
          width: 130,
          formatter: (row) => COOPERATION_TYPE_CONFIG[row.cooperationType].label
        },
        {
          prop: 'grade',
          label: '客户分级',
          width: 110,
          formatter: (row) => {
            const cfg = GRADE_CONFIG[row.grade]
            return h(
              ElTag,
              {
                style: {
                  color: cfg.color,
                  background: cfg.bgColor,
                  border: 'none'
                },
                size: 'small'
              },
              () => cfg.label
            )
          }
        },
        {
          prop: 'totalVehicles',
          label: '累计交车',
          width: 100,
          formatter: (row) => `${row.totalVehicles}辆`
        },
        {
          prop: 'totalTradeAmount',
          label: '累计交易额',
          width: 120,
          formatter: (row) => `¥${(row.totalTradeAmount || 0).toLocaleString()}`
        },
        { prop: 'lastDealDate', label: '最近交易', width: 110 },
        {
          prop: 'status',
          label: '状态',
          width: 80,
          formatter: (row) => {
            const cfg = PARTNER_STATUS_CONFIG[row.status]
            return h(ElTag, { type: cfg.type, size: 'small' }, () => cfg.label)
          }
        },
        {
          prop: 'operation',
          label: '操作',
          width: 120,
          fixed: 'right',
          formatter: (row) =>
            h('div', [
              h(ArtButtonTable, {
                type: 'view',
                onClick: () => showDetail(row)
              }),
              h(ArtButtonTable, {
                type: 'edit',
                onClick: () => showDialog('edit', row)
              })
            ])
        }
      ]
    }
  })

  async function loadGradeStats() {
    gradeStats.value = await fetchPartnerGradeStats({
      category: searchForm.value.category === 'all' ? undefined : searchForm.value.category
    })
  }

  function refreshAll() {
    refreshData()
    loadGradeStats()
  }

  function handleSearch(params: PartnerSearchParams) {
    replaceSearchParams({
      ...params,
      grade: activeGrade.value === 'all' ? params.grade : activeGrade.value
    })
    getData()
    loadGradeStats()
  }

  function handleReset() {
    activeGrade.value = 'all'
    resetSearchParams()
    searchForm.value = {
      current: 1,
      size: 20,
      keyword: undefined,
      category: 'all',
      type: 'all',
      grade: 'all',
      cooperationType: 'all',
      status: 'all'
    }
    getData()
    loadGradeStats()
  }

  function handleGradeSelect(grade: CustomerGrade | 'all') {
    activeGrade.value = grade
    searchForm.value.grade = grade
    replaceSearchParams({ grade })
    getData()
  }

  function showDialog(type: DialogType, row?: RecyclePartner) {
    dialogType.value = type
    currentPartner.value = row || {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  function showDetail(row: RecyclePartner) {
    detailPartner.value = row
    drawerVisible.value = true
  }

  function handleDialogSubmit() {
    refreshAll()
  }

  function handleExport() {
    ElMessage.info('导出功能开发中')
  }

  onMounted(() => {
    loadGradeStats()
  })
</script>

<style scoped lang="scss">
  .customers-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
</style>
