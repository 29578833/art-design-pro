<template>
  <div class="commerce-page art-full-height">
    <div class="commerce-page-header">
      <div>
        <h1 class="commerce-page-title">商务部对接</h1>
        <p class="commerce-page-desc">车辆受理登记、资料核验及商务部报废机动车平台提交</p>
      </div>
      <ElButton type="primary" @click="pickerVisible = true">
        <ArtSvgIcon icon="ri:add-line" />
        新增车辆受理
      </ElButton>
    </div>

    <div class="commerce-summary">
      <div v-for="item in summaryCards" :key="item.label" class="commerce-summary-item">
        <div class="commerce-summary-icon" :style="{ color: item.color, background: item.bg }">
          <ArtSvgIcon :icon="item.icon" />
        </div>
        <div>
          <div class="commerce-summary-value">{{ item.value }}</div>
          <div class="commerce-summary-label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <ElCard class="commerce-filter-card" shadow="never">
      <ElForm :model="searchForm" label-position="top" @submit.prevent>
        <div class="commerce-filter-grid">
          <ElFormItem label="车辆分类">
            <ElSelect v-model="searchForm.is_vehicle_mgmt" clearable placeholder="全部分类">
              <ElOption label="车管车辆" :value="1" />
              <ElOption label="非车管（场内）" :value="0" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="车架号 VIN">
            <ElInput v-model="searchForm.clsbdh" clearable placeholder="请输入车架号" />
          </ElFormItem>
          <ElFormItem label="受理人">
            <ElInput v-model="searchForm.yhsjhm" clearable placeholder="请输入受理人" />
          </ElFormItem>
          <ElFormItem label="所有人">
            <ElInput v-model="searchForm.syr" clearable placeholder="姓名或单位名称" />
          </ElFormItem>
          <ElFormItem label="代理人">
            <ElInput v-model="searchForm.jbr" clearable placeholder="请输入代理人" />
          </ElFormItem>
          <ElFormItem label="实名认证">
            <ElSelect v-model="searchForm.syrsmrz" clearable placeholder="全部状态">
              <ElOption label="已认证" value="1" />
              <ElOption label="未认证" value="0" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="受理时间">
            <ElDatePicker
              v-model="dateRange"
              type="daterange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              unlink-panels
            />
          </ElFormItem>
          <div class="commerce-filter-actions">
            <ElButton type="primary" @click="handleSearch">
              <ArtSvgIcon icon="ri:search-line" />
              查询
            </ElButton>
            <ElButton @click="handleReset">
              <ArtSvgIcon icon="ri:refresh-line" />
              重置
            </ElButton>
          </div>
        </div>
      </ElForm>
    </ElCard>

    <ElCard
      class="commerce-table-card art-table-card"
      shadow="never"
      :body-style="{ padding: 0, paddingBottom: '20px' }"
    >
      <div class="commerce-table-heading">
        <div>
          <div class="commerce-table-title">车辆受理记录</div>
          <div class="commerce-table-subtitle">共 {{ pagination.total }} 条记录</div>
        </div>
        <ElButton :loading="loading" @click="refreshData">
          <ArtSvgIcon icon="ri:refresh-line" />
          刷新
        </ElButton>
      </div>
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        :show-table-header="false"
        row-key="vehicle_id"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <VehiclePickerDialog v-model:visible="pickerVisible" @confirm="openArchiveEditor" />
    <VehicleArchiveEditDialog
      v-model:visible="editorVisible"
      :vehicle-id="selectedVehicleId"
      :vehicle-row="selectedVehicleRow"
      @success="handleEditorSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { fetchAcceptLocalList } from '@/api/recycle/accept'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import type { ColumnOption } from '@/types/component'
  import type { AcceptListItem, AcceptListParams } from '@/types/recycle/accept'
  import type { ScrapVehicle } from '@/types/recycle/vehicle'
  import { ElMessage, ElTag } from 'element-plus'
  import VehicleArchiveEditDialog from '../vehicles/modules/vehicle-archive-edit-dialog.vue'
  import VehiclePickerDialog from './modules/vehicle-picker-dialog.vue'
  import './commerce.scss'

  defineOptions({ name: 'RecycleCommerce' })

  const searchForm = ref<AcceptListParams>({
    is_vehicle_mgmt: '',
    clsbdh: '',
    yhsjhm: '',
    syr: '',
    jbr: '',
    syrsmrz: '',
    jbrsmrz: '',
    zt: ''
  })
  const dateRange = ref<[string, string] | null>(null)
  const pickerVisible = ref(false)
  const editorVisible = ref(false)
  const selectedVehicleId = ref(0)
  const selectedVehicleRow = ref<ScrapVehicle | null>(null)

  function statusMeta(row: AcceptListItem) {
    if (Number(row.is_submitted_commerce) === 1) {
      return { label: '已提交商务部', type: 'success' as const, icon: 'ri:checkbox-circle-line' }
    }
    if (row.zt_text) {
      return { label: row.zt_text, type: 'primary' as const, icon: 'ri:time-line' }
    }
    if (!row.clsbdh || !row.syr) {
      return { label: '资料待补全', type: 'warning' as const, icon: 'ri:error-warning-line' }
    }
    return { label: '待登记提交', type: 'primary' as const, icon: 'ri:file-edit-line' }
  }

  function openRowEditor(row: AcceptListItem) {
    if (!row.vehicle_id) {
      ElMessage.warning('该记录尚未关联本地车辆档案')
      return
    }
    selectedVehicleId.value = Number(row.vehicle_id)
    selectedVehicleRow.value = {
      id: Number(row.vehicle_id),
      status: Number(row.order_status || 0),
      order_no: row.order_no,
      plate_no: row.hphm,
      vin: row.clsbdh,
      owner_name: row.syr,
      owner_phone: row.dh,
      owner_sync_id: Number(row.owner_sync_id || 0),
      is_submitted_commerce: Number(row.is_submitted_commerce || 0)
    }
    editorVisible.value = true
  }

  function renderStatus(row: AcceptListItem) {
    const meta = statusMeta(row)
    return h(
      ElTag,
      { type: meta.type, effect: 'light', round: false },
      {
        default: () => [h(ArtSvgIcon, { icon: meta.icon, class: 'commerce-tag-icon' }), meta.label]
      }
    )
  }

  function renderActions(row: AcceptListItem) {
    const submitted = Number(row.is_submitted_commerce) === 1
    return h('div', { class: 'order-actions' }, [
      h(
        'button',
        {
          type: 'button',
          class: `order-action-btn ${submitted ? 'default' : 'primary'}`,
          onClick: () => openRowEditor(row)
        },
        [
          h(ArtSvgIcon, {
            icon: submitted ? 'ri:eye-line' : 'ri:edit-line',
            class: 'order-action-icon'
          }),
          submitted ? '查看资料' : '登记资料'
        ]
      )
    ])
  }

  function buildColumns(): ColumnOption<AcceptListItem>[] {
    return [
      {
        prop: 'clsbdh',
        label: '车辆信息',
        minWidth: 190,
        formatter: (row: AcceptListItem) =>
          h('div', { class: 'commerce-vehicle-cell' }, [
            h('div', { class: 'commerce-vin' }, row.clsbdh || 'VIN 待补录'),
            h('div', { class: 'commerce-cell-secondary' }, [
              row.hphm || '无号牌',
              row.order_no ? ` · ${row.order_no}` : ''
            ])
          ])
      },
      {
        prop: 'cllx_name',
        label: '车辆分类',
        minWidth: 130,
        formatter: (row: AcceptListItem) =>
          h('div', null, [
            h('div', null, row.is_vehicle_mgmt ? '车管车辆' : '非车管（场内）'),
            row.cllx_name ? h('div', { class: 'commerce-cell-secondary' }, row.cllx_name) : null
          ])
      },
      {
        prop: 'syr',
        label: '所有人',
        minWidth: 150,
        formatter: (row: AcceptListItem) =>
          h('div', null, [
            h('div', { class: 'commerce-person-line' }, [
              h('span', null, row.syr || '—'),
              row.syr_verified
                ? h(ArtSvgIcon, { icon: 'ri:verified-badge-fill', class: 'commerce-verified' })
                : null
            ]),
            row.dh ? h('div', { class: 'commerce-cell-secondary' }, row.dh) : null
          ])
      },
      {
        prop: 'jbr',
        label: '代理人',
        minWidth: 130,
        formatter: (row: AcceptListItem) =>
          h('div', null, [
            h('div', { class: 'commerce-person-line' }, [
              h('span', null, row.jbr || '无代理人'),
              row.jbr_verified
                ? h(ArtSvgIcon, { icon: 'ri:verified-badge-fill', class: 'commerce-verified' })
                : null
            ]),
            row.jbrdh ? h('div', { class: 'commerce-cell-secondary' }, row.jbrdh) : null
          ])
      },
      {
        prop: 'bidui_text',
        label: '平台预查',
        minWidth: 115,
        formatter: (row: AcceptListItem) => {
          if (!row.bidui_text) return h('span', { class: 'commerce-cell-muted' }, '未预查')
          const isError = row.bidui_type === 'error'
          return h(
            'span',
            { class: isError ? 'commerce-precheck error' : 'commerce-precheck success' },
            row.bidui_text
          )
        }
      },
      {
        prop: 'accept_time',
        label: '受理信息',
        minWidth: 145,
        formatter: (row: AcceptListItem) =>
          h('div', null, [
            h('div', null, row.accept_time || '—'),
            row.yhsjhm_dictText
              ? h('div', { class: 'commerce-cell-secondary' }, `受理人：${row.yhsjhm_dictText}`)
              : null
          ])
      },
      {
        prop: 'status',
        label: '状态',
        minWidth: 135,
        formatter: (row: AcceptListItem) => renderStatus(row)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 130,
        align: 'center',
        fixed: 'right',
        formatter: (row: AcceptListItem) => renderActions(row)
      }
    ]
  }

  const {
    data,
    loading,
    columns,
    pagination,
    getData,
    refreshData,
    replaceSearchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: fetchAcceptLocalList,
      apiParams: { ...searchForm.value, current: 1, size: 20 },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    }
  })

  const summaryCards = computed(() => {
    const rows = data.value as AcceptListItem[]
    const submitted = rows.filter((row) => Number(row.is_submitted_commerce) === 1).length
    const verified = rows.filter((row) => row.syr_verified).length
    return [
      {
        label: '当前筛选记录',
        value: pagination.total,
        icon: 'ri:file-list-3-line',
        color: '#1677ff',
        bg: '#e6f4ff'
      },
      {
        label: '本页待登记',
        value: rows.length - submitted,
        icon: 'ri:time-line',
        color: '#d97706',
        bg: '#fff7e6'
      },
      {
        label: '本页已实名',
        value: verified,
        icon: 'ri:verified-badge-line',
        color: '#08979c',
        bg: '#e6fffb'
      },
      {
        label: '本页已提交',
        value: submitted,
        icon: 'ri:send-plane-line',
        color: '#389e0d',
        bg: '#f6ffed'
      }
    ]
  })

  function queryParams() {
    return {
      ...searchForm.value,
      startsj: dateRange.value?.[0] || '',
      endsj: dateRange.value?.[1] || ''
    }
  }

  function handleSearch() {
    replaceSearchParams({ ...queryParams(), current: 1 })
    getData()
  }

  function handleReset() {
    searchForm.value = {
      is_vehicle_mgmt: '',
      clsbdh: '',
      yhsjhm: '',
      syr: '',
      jbr: '',
      syrsmrz: '',
      jbrsmrz: '',
      zt: ''
    }
    dateRange.value = null
    resetSearchParams()
    replaceSearchParams({ ...queryParams(), current: 1, size: 20 })
    getData()
  }

  function openArchiveEditor(vehicle: ScrapVehicle) {
    selectedVehicleId.value = vehicle.id
    selectedVehicleRow.value = vehicle
    editorVisible.value = true
  }

  function handleEditorSuccess() {
    getData()
  }
</script>
