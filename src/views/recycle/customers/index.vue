<template>
  <div class="customers-page art-full-height">
    <div class="partner-page-header">
      <div>
        <div class="partner-page-title">客户与供应商管理</div>
        <div class="partner-page-desc">管理所有客户信息及分级</div>
      </div>
      <div class="partner-page-actions">
        <ElButton @click="handleExport" v-ripple>
          <ArtSvgIcon icon="ri:download-2-line" class="mr-1" />
          导出
        </ElButton>
        <ElButton type="primary" @click="showDialog('add')" v-ripple>
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          新增客户
        </ElButton>
      </div>
    </div>

    <GradeSummaryCards
      :stats="gradeStats"
      :active-grade="activeGrade"
      @select="handleGradeSelect"
    />

    <CustomerSearch
      v-model="searchForm"
      v-model:active-grade="activeGrade"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ElCard class="partner-table-card art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshAll" />

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        stripe
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
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchPartnerGradeStats, fetchPartnerList } from '@/api/recycle/customer'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    CustomerGrade,
    GradeStatItem,
    PartnerSearchParams,
    RecyclePartner
  } from '@/types/recycle/customer'
  import { GRADE_CONFIG } from '@/types/recycle/customer'
  import type { DialogType } from '@/types'
  import CustomerSearch from './modules/customer-search.vue'
  import CustomerDialog from './modules/customer-dialog.vue'
  import CustomerDetailDrawer from './modules/customer-detail-drawer.vue'
  import GradeSummaryCards from './modules/grade-summary-cards.vue'

  defineOptions({ name: 'RecycleCustomers' })

  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const drawerVisible = ref(false)
  const currentPartner = ref<Partial<RecyclePartner>>({})
  const detailPartner = ref<RecyclePartner | null>(null)
  const gradeStats = ref<GradeStatItem[]>([])
  const activeGrade = ref<CustomerGrade | 'all'>('all')

  const avatarColors = ['#1890FF', '#722ED1', '#13C2C2', '#FA8C16', '#52C41A', '#EB2F96']

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

  function getAvatarColor(name: string) {
    return avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length]
  }

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
        {
          prop: 'code',
          label: '客户编号',
          width: 136,
          formatter: (row) => h('span', { class: 'partner-code' }, row.code)
        },
        {
          prop: 'name',
          label: '姓名/企业',
          minWidth: 220,
          formatter: (row) =>
            h('div', { class: 'partner-name-cell' }, [
              h(
                'div',
                {
                  class: 'partner-avatar',
                  style: { background: getAvatarColor(row.name) }
                },
                row.name.slice(0, 1)
              ),
              h('div', { class: 'min-w-0' }, [
                h('div', { class: 'partner-name-main' }, row.name),
                row.enterprise
                  ? h('div', { class: 'partner-name-sub' }, row.enterprise)
                  : h('div', { class: 'partner-name-sub' }, row.phone)
              ])
            ])
        },
        {
          prop: 'phone',
          label: '联系电话',
          width: 132,
          formatter: (row) => h('span', { class: 'partner-phone' }, row.phone)
        },
        {
          prop: 'grade',
          label: '客户分级',
          width: 118,
          formatter: (row) => {
            const cfg = GRADE_CONFIG[row.grade]
            return h(
              'span',
              {
                class: 'partner-grade-tag',
                style: { color: cfg.color, background: cfg.bgColor }
              },
              [h(ArtSvgIcon, { icon: cfg.icon, style: { fontSize: '12px' } }), cfg.label]
            )
          }
        },
        {
          prop: 'totalVehicles',
          label: '累计交车',
          width: 96,
          align: 'center',
          formatter: (row) => h('span', { class: 'partner-metric' }, `${row.totalVehicles}辆`)
        },
        {
          prop: 'lastDealDate',
          label: '最近交车',
          width: 112,
          formatter: (row) => h('span', { class: 'partner-date' }, row.lastDealDate)
        },
        {
          prop: 'status',
          label: '状态',
          width: 84,
          align: 'center',
          formatter: (row) =>
            h(
              'span',
              {
                class: ['partner-status-tag', row.status === 'active' ? 'active' : 'inactive']
              },
              row.status === 'active' ? '正常' : '禁用'
            )
        },
        {
          prop: 'operation',
          label: '操作',
          width: 100,
          fixed: 'right',
          align: 'center',
          formatter: (row) =>
            h('div', { class: 'partner-table-actions' }, [
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

  function handleSearch() {
    replaceSearchParams({
      ...searchForm.value,
      grade: activeGrade.value
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

<style lang="scss">
  @use './customers';
</style>
