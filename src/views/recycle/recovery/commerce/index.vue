<template>
  <div class="commerce-page art-full-height">
    <div class="commerce-page-header">
      <div>
        <div class="commerce-page-title">商务部对接</div>
        <div class="commerce-page-desc">车辆受理登记、资料核验及商务部报废机动车平台提交</div>
      </div>
      <div class="commerce-page-actions">
        <ElButton :loading="loading" @click="refreshData">
          <ArtSvgIcon icon="ri:refresh-line" />
          刷新
        </ElButton>
        <ElButton type="success" @click="loginVisible = true">
          <ArtSvgIcon icon="ri:user-line" />
          登录车信盟
        </ElButton>
      </div>
    </div>

    <div class="commerce-search-panel">
      <div class="commerce-filter-body">
        <ElForm :model="searchForm" label-position="right" label-width="76px" @submit.prevent>
          <div class="commerce-filter-grid" :class="{ 'is-expanded': filterExpanded }">
            <ElFormItem label="非车/车管" class="commerce-filter-item">
              <ElSelect v-model="searchForm.is_vehicle_mgmt" clearable placeholder="车管/非车管">
                <ElOption label="车管" :value="1" />
                <ElOption label="非车管" :value="0" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="车架/号牌" class="commerce-filter-item">
              <ElInput
                v-model="searchForm.clsbdh"
                clearable
                placeholder="输入车架号或号牌"
                @keyup.enter="handleSearch"
              />
            </ElFormItem>
            <ElFormItem label="受理人" class="commerce-filter-item">
              <ElSelect v-model="searchForm.yhsjhm" clearable filterable placeholder="受理人">
                <ElOption
                  v-for="item in dictUsernameOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="受理状态" class="commerce-filter-item">
              <ElSelect
                v-model="searchForm.zt"
                clearable
                placeholder="待登记"
                @change="handleSearch"
              >
                <ElOption label="待登记" value="4" />
                <ElOption label="已登记" value="5" />
                <ElOption label="已完成" value="6" />
                <ElOption label="全部" value="" />
              </ElSelect>
            </ElFormItem>
            <!-- <ElFormItem label="平台" class="commerce-filter-item commerce-filter-item--extra">
              <ElSelect v-model="searchForm.platform" clearable placeholder="平台系统">
                <ElOption label="平台系统" value="" />
              </ElSelect>
            </ElFormItem> -->
            <ElFormItem label="受理时间" class="commerce-filter-item">
              <ElDatePicker
                v-model="dateRange"
                type="daterange"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD"
                unlink-panels
              />
            </ElFormItem>
            <ElFormItem label="所有人" class="commerce-filter-item commerce-filter-item--extra">
              <div class="commerce-inline-filters">
                <ElInput v-model="searchForm.syr" clearable placeholder="所有人" />
                <ElSelect v-model="searchForm.syrsmrz" clearable placeholder="实名">
                  <ElOption label="实名" value="1" />
                  <ElOption label="非实名" value="0" />
                </ElSelect>
              </div>
            </ElFormItem>
            <ElFormItem label="代理人" class="commerce-filter-item commerce-filter-item--extra">
              <div class="commerce-inline-filters">
                <ElInput v-model="searchForm.jbr" clearable placeholder="代理人" />
                <ElSelect v-model="searchForm.jbrsmrz" clearable placeholder="所有">
                  <ElOption label="所有" value="" />
                  <ElOption label="实名" value="1" />
                  <ElOption label="非实名" value="0" />
                </ElSelect>
              </div>
            </ElFormItem>
            <ElFormItem label="受理状态" class="commerce-filter-item commerce-filter-item--extra">
              <ElSelect
                v-model="searchForm.zt"
                clearable
                placeholder="待登记"
                @change="handleSearch"
              >
                <ElOption label="待登记" value="4" />
                <ElOption label="已登记" value="5" />
                <ElOption label="已完成" value="6" />
                <ElOption label="全部" value="" />
              </ElSelect>
            </ElFormItem>
            <div class="commerce-filter-actions commerce-filter-item">
              <ElButton type="primary" @click="handleSearch">
                <ArtSvgIcon icon="ri:search-line" />
                查询
              </ElButton>
              <ElButton @click="handleReset">
                <ArtSvgIcon icon="ri:refresh-line" />
                重置
              </ElButton>
              <ElButton
                text
                class="commerce-filter-expand"
                @click="filterExpanded = !filterExpanded"
              >
                <ArtSvgIcon
                  :icon="filterExpanded ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'"
                />
                {{ filterExpanded ? '收起' : '展开' }}
              </ElButton>
            </div>
          </div>
        </ElForm>
      </div>

      <div class="commerce-check-box">
        <div class="commerce-check-item">
          <span class="commerce-check-label">检查1（上海车管）</span>
          <span class="commerce-check-text">
            通过车架号与上海车管所比对校验机动车状态是否异常、行驶证编号、产证编号、号牌号码、所有人、使用性质是否相符。
          </span>
        </div>
        <div class="commerce-check-item">
          <span class="commerce-check-label">检查2（全国商委）</span>
          <span class="commerce-check-text">
            通过车架号与全国报废平台比对核该辆机动车是否重复，若重复可能此车已在其他企业或者异地受理过。
          </span>
        </div>
      </div>
    </div>

    <ElCard
      class="commerce-table-card art-table-card"
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
        row-key="vehicle_id"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <CxmLoginDialog v-model:visible="loginVisible" @success="getData" />
    <CommerceValidationDialog
      v-model:visible="validationVisible"
      :row="submitRow"
      :missing="missingData"
      :submitting="submitLoading"
      @edit="handleValidationEdit"
      @submit="handleValidationResubmit"
    />
    <VehicleArchiveEditDialog
      ref="archiveRef"
      v-model:visible="editorVisible"
      :vehicle-id="selectedVehicleId"
      :vehicle-row="selectedVehicleRow"
      @success="handleEditorSuccess"
    />
    <SubmitResultDialog
      v-model:visible="submitResultVisible"
      :result="submitResult"
      @fetch-archive="handleFetchArchive"
    />
  </div>
</template>

<script setup lang="ts">
  import {
    fetchAcceptArchive,
    fetchAcceptDictUsernameList,
    fetchAcceptLocalList,
    fetchAcceptLocalScrapFiles,
    fetchAcceptSubmit,
    fetchAcceptSubmitResult
  } from '@/api/recycle/accept'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import type { ColumnOption } from '@/types/component'
  import type {
    AcceptDictUsernameOption,
    AcceptListItem,
    AcceptListParams,
    AcceptSubmitResult
  } from '@/types/recycle/accept'
  import type { ScrapVehicle } from '@/types/recycle/vehicle'
  import { ElMessage, ElTag } from 'element-plus'
  import VehicleArchiveEditDialog from '../vehicles/modules/vehicle-archive-edit-dialog.vue'
  import SubmitResultDialog from '../vehicles/modules/vehicle-archive/submit-result-dialog.vue'
  import {
    countCommerceMissing,
    validateCommerceSubmitFields,
    type CommerceMissingData
  } from './commerce-submit-validation'
  import CommerceValidationDialog from './modules/commerce-validation-dialog.vue'
  import CxmLoginDialog from './modules/cxm-login-dialog.vue'
  import './commerce.scss'

  defineOptions({ name: 'RecycleCommerce' })

  const filterExpanded = ref(false)
  const dictUsernameOptions = ref<AcceptDictUsernameOption[]>([])
  const searchForm = ref<AcceptListParams>({
    is_vehicle_mgmt: '',
    clsbdh: '',
    yhsjhm: '',
    platform: '',
    syr: '',
    syrsmrz: '',
    jbr: '',
    jbrsmrz: '',
    zt: '4'
  })
  const dateRange = ref<[string, string] | null>(null)
  const loginVisible = ref(false)
  const editorVisible = ref(false)
  const validationVisible = ref(false)
  const submitResultVisible = ref(false)
  const submitLoading = ref(false)
  const selectedVehicleId = ref(0)
  const selectedVehicleRow = ref<ScrapVehicle | null>(null)
  const submitRow = ref<AcceptListItem | null>(null)
  const submitResult = ref<AcceptSubmitResult | null>(null)
  const missingData = ref<CommerceMissingData>({
    owner: { fields: [], images: [] },
    vehicle: { fields: [], images: [] },
    agent: { fields: [], images: [] }
  })

  const archiveRef = ref<InstanceType<typeof VehicleArchiveEditDialog> | null>(null)

  function getZtMeta(zt?: string) {
    if (String(zt) === '5') return { label: '已登记', type: 'success' as const }
    if (String(zt) === '6') return { label: '已完成', type: 'info' as const }
    return { label: '待登记', type: 'warning' as const }
  }

  function renderMgmtBadge(isVehicleMgmt?: boolean) {
    const isMgmt = Boolean(isVehicleMgmt)
    return h(
      'span',
      {
        class: ['commerce-mgmt-badge', isMgmt ? 'mgmt' : 'non-mgmt']
      },
      isMgmt ? '车管' : '非车管'
    )
  }

  function renderPersonCell(
    name: string,
    phone: string | undefined,
    verified: boolean | undefined,
    onEdit: () => void,
    emptyText = '—'
  ) {
    if (!name && emptyText === '—') return emptyText
    return h('div', { class: 'commerce-person-cell' }, [
      h('div', { class: 'commerce-person-line' }, [
        h(
          'span',
          { class: name ? 'commerce-person-name' : 'commerce-person-empty' },
          name || emptyText
        ),
        verified
          ? h(ArtSvgIcon, { icon: 'ri:verified-badge-fill', class: 'commerce-verified' })
          : null,
        renderEditIcon(onEdit)
      ]),
      phone ? h('div', { class: 'commerce-cell-secondary' }, phone) : null
    ])
  }

  function buildVehicleRow(row: AcceptListItem): ScrapVehicle {
    return {
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
  }

  function openRowEditor(row: AcceptListItem, targetStep = 0) {
    if (!row.vehicle_id) {
      ElMessage.warning('该记录尚未关联本地车辆档案')
      return
    }
    selectedVehicleId.value = Number(row.vehicle_id)
    selectedVehicleRow.value = buildVehicleRow(row)
    editorVisible.value = true
    if (targetStep >= 1 && targetStep <= 5) {
      nextTick(() => archiveRef.value?.goToStep(targetStep))
    }
  }

  function renderEditIcon(onClick: () => void) {
    return h(
      'button',
      {
        type: 'button',
        class: 'commerce-cell-edit',
        onClick
      },
      [h(ArtSvgIcon, { icon: 'ri:edit-line' })]
    )
  }

  function renderActions(row: AcceptListItem) {
    return h('div', { class: 'order-actions' }, [
      h(
        'button',
        {
          type: 'button',
          class: 'order-action-btn default',
          onClick: () => openRowEditor(row)
        },
        [h(ArtSvgIcon, { icon: 'ri:file-edit-line', class: 'order-action-icon' }), '编辑档案']
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'order-action-btn submit',
          disabled: submitLoading.value,
          onClick: () => handleSubmitToBusiness(row)
        },
        [h(ArtSvgIcon, { icon: 'ri:send-plane-line', class: 'order-action-icon' }), '提交商务部']
      )
    ])
  }

  function buildColumns(): ColumnOption<AcceptListItem>[] {
    return [
      {
        prop: 'clsbdh',
        label: '车架号',
        minWidth: 190,
        formatter: (row: AcceptListItem) => h('span', { class: 'commerce-vin' }, row.clsbdh || '—')
      },
      {
        prop: 'hphm',
        label: '车辆信息',
        minWidth: 130,
        formatter: (row: AcceptListItem) => {
          if (!row.hphm) return h('span', { class: 'commerce-cell-muted' }, '—')
          return h('div', { class: 'commerce-person-line' }, [
            h('span', { class: 'commerce-plate' }, row.hphm),
            renderEditIcon(() => openRowEditor(row, 2))
          ])
        }
      },
      {
        prop: 'is_vehicle_mgmt',
        label: '车管/非车管',
        minWidth: 130,
        formatter: (row: AcceptListItem) =>
          h('div', { class: 'commerce-mgmt-cell' }, [
            renderMgmtBadge(row.is_vehicle_mgmt),
            row.cllx_name ? h('div', { class: 'commerce-cell-secondary' }, row.cllx_name) : null
          ])
      },
      {
        prop: 'syr',
        label: '所有人',
        minWidth: 170,
        formatter: (row: AcceptListItem) =>
          renderPersonCell(row.syr || '', row.dh, row.syr_verified, () => openRowEditor(row, 1))
      },
      {
        prop: 'jbr',
        label: '代理人',
        minWidth: 150,
        formatter: (row: AcceptListItem) =>
          renderPersonCell(
            row.jbr || '',
            row.jbrdh,
            row.jbr_verified,
            () => openRowEditor(row, 3),
            '无'
          )
      },
      {
        prop: 'yhsjhm_dictText',
        label: '受理时间',
        minWidth: 155,
        formatter: (row: AcceptListItem) =>
          h('div', { class: 'commerce-accept-cell' }, [
            h('div', { class: 'commerce-accept-user' }, row.yhsjhm_dictText || '—'),
            row.accept_time ? h('div', { class: 'commerce-cell-secondary' }, row.accept_time) : null
          ])
      },
      {
        prop: 'zt',
        label: '受理状态',
        minWidth: 96,
        align: 'center',
        formatter: (row: AcceptListItem) => {
          const meta = getZtMeta(row.zt)
          return h(ElTag, { type: meta.type, effect: 'light', round: true }, () => meta.label)
        }
      },
      {
        prop: 'operation',
        label: '操作',
        width: 260,
        align: 'center',
        fixed: 'right',
        formatter: (row: AcceptListItem) => renderActions(row)
      }
    ]
  }

  function queryParams() {
    const params = {
      ...searchForm.value,
      startsj: dateRange.value?.[0] || '',
      endsj: dateRange.value?.[1] || ''
    }
    if (!params.startsj) delete params.startsj
    if (!params.endsj) delete params.endsj
    return params
  }

  function handleListError(message: string) {
    if (message.includes('外部平台响应异常') || message.includes('Token未配置')) {
      loginVisible.value = true
    }
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
      apiParams: { ...queryParams(), current: 1, size: 20 },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    },
    hooks: {
      onError: (error) => handleListError(error.message)
    }
  })

  async function loadDictUsernameOptions() {
    try {
      dictUsernameOptions.value = (await fetchAcceptDictUsernameList()) || []
    } catch {
      dictUsernameOptions.value = []
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
      platform: '',
      syr: '',
      syrsmrz: '',
      jbr: '',
      jbrsmrz: '',
      zt: '4'
    }
    dateRange.value = null
    filterExpanded.value = false
    resetSearchParams()
    replaceSearchParams({ ...queryParams(), current: 1, size: 20 })
    getData()
  }

  async function handleSubmitToBusiness(row: AcceptListItem) {
    if (submitLoading.value) return
    submitRow.value = row
    const vehicleId = Number(row.vehicle_id || 0)
    if (!vehicleId) {
      ElMessage.warning('缺少车辆ID')
      return
    }

    if (Number(row.is_submitted_commerce) === 1) {
      submitLoading.value = true
      try {
        submitResult.value = await fetchAcceptSubmitResult(vehicleId)
        submitResultVisible.value = true
      } finally {
        submitLoading.value = false
      }
      return
    }

    submitLoading.value = true
    try {
      const sync = await fetchAcceptLocalScrapFiles({ vehicle_id: vehicleId })
      const missing = validateCommerceSubmitFields(sync)
      if (countCommerceMissing(missing) > 0) {
        missingData.value = missing
        validationVisible.value = true
        return
      }
      submitResult.value = await fetchAcceptSubmit(vehicleId)
      submitResultVisible.value = true
      getData()
    } finally {
      submitLoading.value = false
    }
  }

  function handleValidationEdit() {
    if (submitRow.value) openRowEditor(submitRow.value)
  }

  function handleValidationResubmit() {
    validationVisible.value = false
    if (submitRow.value) handleSubmitToBusiness(submitRow.value)
  }

  async function handleFetchArchive() {
    const vehicleId = Number(submitRow.value?.vehicle_id || 0)
    if (!vehicleId) {
      ElMessage.warning('缺少车辆ID')
      return
    }
    await fetchAcceptArchive(vehicleId)
  }

  function handleEditorSuccess() {
    getData()
  }

  onMounted(() => {
    loadDictUsernameOptions()
  })
</script>
