<template>
  <div class="customers-page art-full-height">
    <div class="partner-page-header">
      <div>
        <div class="partner-page-title">客户与供应商管理</div>
        <div class="partner-page-desc">管理所有客户信息及分级</div>
      </div>
      <div class="partner-page-actions">
        <ElButton :loading="exporting" @click="handleExport" v-ripple>
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
      :active-level-id="activeLevelId"
      @select="handleLevelSelect"
    />

    <CustomerSearch
      v-model="searchForm"
      v-model:active-level-id="activeLevelId"
      :level-options="levelOptions"
      :group-options="groupOptions"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ElCard
      class="partner-table-card art-table-card"
      shadow="never"
      :body-style="{ padding: 0, paddingBottom: '20px' }"
    >
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        :show-table-header="false"
        :stripe="false"
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
  import {
    fetchPartnerGradeStats,
    fetchPartnerList,
    fetchPartnerListForExport,
    fetchUserGroupList,
    fetchUserLevelList
  } from '@/api/recycle/customer'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    GradeStatItem,
    PartnerSearchParams,
    RecyclePartner,
    UserGroupOption,
    UserLevelOption
  } from '@/types/recycle/customer'
  import { resolveLevelStyle } from '@/types/recycle/customer'
  import type { DialogType } from '@/types'
  import * as XLSX from 'xlsx'
  import CustomerSearch from './modules/customer-search.vue'
  import CustomerDialog from './modules/customer-dialog.vue'
  import CustomerDetailDrawer from './modules/customer-detail-drawer.vue'
  import GradeSummaryCards from './modules/grade-summary-cards.vue'

  defineOptions({ name: 'RecycleCustomers' })

  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const drawerVisible = ref(false)
  const exporting = ref(false)
  const currentPartner = ref<Partial<RecyclePartner>>({})
  const detailPartner = ref<RecyclePartner | null>(null)
  const gradeStats = ref<GradeStatItem[]>([])
  const levelOptions = ref<UserLevelOption[]>([])
  const groupOptions = ref<UserGroupOption[]>([])
  const activeLevelId = ref<number | 'all'>('all')

  const searchForm = ref<PartnerSearchParams>({
    current: 1,
    size: 20,
    keyword: undefined,
    groupId: 'all',
    levelId: 'all',
    cooperationType: 'all',
    status: 'all'
  })

  const {
    columns,
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
        page: 1,
        limit: 20,
        ...searchForm.value
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => [
        {
          prop: 'code',
          label: '客户编号',
          width: 168,
          formatter: (row) => h('span', { class: 'partner-code' }, row.code)
        },
        {
          prop: 'name',
          label: '姓名/企业',
          minWidth: 240,
          formatter: (row) =>
            h('div', { class: 'partner-name-cell' }, [
              h(
                'div',
                {
                  class: 'partner-avatar',
                  style: { background: '#1D84FF' }
                },
                row.name.slice(0, 1)
              ),
              h('div', { class: 'min-w-0' }, [
                h('div', { class: 'partner-name-main' }, row.name),
                row.groupName
                  ? h('div', { class: 'partner-name-sub' }, row.groupName)
                  : h('div', { class: 'partner-name-sub' }, row.phone)
              ])
            ])
        },
        {
          prop: 'phone',
          label: '联系电话',
          width: 168,
          formatter: (row) => h('span', { class: 'partner-phone' }, row.phone)
        },
        {
          prop: 'levelName',
          label: '客户分级',
          width: 168,
          formatter: (row) => {
            const cfg = resolveLevelStyle(row.levelName || '普通客户')
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
          width: 168,
          formatter: (row) =>
            h('div', { class: 'p-l-16' }, [
              h('span', { class: 'partner-metric' }, `${row.totalVehicles}辆`)
            ])
        },
        {
          prop: 'lastDealDate',
          label: '最近交车',
          width: 168,
          formatter: (row) => h('span', { class: 'partner-date' }, row.lastDealDate)
        },
        {
          prop: 'status',
          label: '状态',
          width: 168,
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
          width: 168,
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

  async function loadMetaOptions() {
    const [levels, groups] = await Promise.all([fetchUserLevelList(), fetchUserGroupList()])
    levelOptions.value = levels
    groupOptions.value = groups
  }

  async function loadGradeStats() {
    gradeStats.value = await fetchPartnerGradeStats()
  }

  function refreshAll() {
    refreshData()
    loadGradeStats()
  }

  function handleSearch() {
    replaceSearchParams({
      ...searchForm.value,
      levelId: activeLevelId.value
    })
    getData()
    loadGradeStats()
  }

  function handleReset() {
    activeLevelId.value = 'all'
    resetSearchParams()
    searchForm.value = {
      current: 1,
      size: 20,
      keyword: undefined,
      groupId: 'all',
      levelId: 'all',
      cooperationType: 'all',
      status: 'all'
    }
    getData()
    loadGradeStats()
  }

  function handleLevelSelect(levelId: number | 'all') {
    activeLevelId.value = levelId
    searchForm.value.levelId = levelId
    replaceSearchParams({ levelId })
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

  async function handleExport() {
    exporting.value = true
    try {
      const list = await fetchPartnerListForExport({
        ...searchForm.value,
        levelId: activeLevelId.value
      })

      if (!list.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }

      const rows = list.map((item) => ({
        客户编号: item.code,
        姓名: item.name,
        联系电话: item.phone,
        客户分级: item.levelName,
        客户类型: item.groupName,
        累计交车: item.totalVehicles,
        最近交车: item.lastDealDate,
        状态: item.status === 'active' ? '正常' : '禁用',
        备注: item.remark || '',
        注册时间: item.createTime
      }))

      const sheet = XLSX.utils.json_to_sheet(rows)
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, '客户列表')
      XLSX.writeFile(book, `客户列表_${new Date().toISOString().slice(0, 10)}.xlsx`)
      ElMessage.success('导出成功')
    } finally {
      exporting.value = false
    }
  }

  onMounted(() => {
    loadMetaOptions()
    loadGradeStats()
  })
</script>

<style lang="scss">
  @use './customers';
</style>
