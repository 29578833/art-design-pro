<template>
  <div class="sys-log-page art-full-height">
    <div class="sys-log-header">
      <div class="sys-log-title">操作日志</div>
      <div class="sys-log-desc">后台管理员操作记录查询</div>
    </div>

    <LogSearch
      v-model:search-form="searchForm"
      @search="handleToolbarSearch"
      @reset="handleToolbarReset"
    />

    <div class="sys-log-list">
      <ElCard
        class="sys-log-table-card art-table-card"
        shadow="never"
        :body-style="{ padding: '0 0 12px' }"
      >
        <ArtTable
          :loading="loading"
          :data="data"
          :columns="columns"
          :pagination="pagination"
          :show-table-header="false"
          :stripe="false"
          row-key="id"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </ElCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { fetchSystemLogList } from '@/api/recycle/system-log'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type { SystemLogItem, SystemLogSearchParams } from '@/types/recycle/system-log'
  import LogSearch from './modules/log-search.vue'

  defineOptions({ name: 'SystemLog' })

  const searchForm = ref<SystemLogSearchParams>({})

  function formatTime(val?: number | string) {
    const n = Number(val || 0)
    if (!n) return '—'
    const d = new Date(n * 1000)
    const pad = (x: number) => String(x).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  function buildColumns(): ColumnOption<SystemLogItem>[] {
    return [
      {
        prop: 'admin_name',
        label: '操作人',
        minWidth: 110,
        formatter: (row) => h('span', null, row.admin_name || '—')
      },
      {
        prop: 'page',
        label: '页面',
        minWidth: 140,
        formatter: (row) => h('span', { class: 'log-page-tag' }, row.page || '—')
      },
      {
        prop: 'path_name',
        label: '操作名称',
        minWidth: 160,
        formatter: (row) => h('span', null, row.path_name || '—')
      },
      {
        prop: 'path',
        label: '访问路径',
        minWidth: 200,
        formatter: (row) => h('span', { class: 'log-muted' }, row.path || '—')
      },
      {
        prop: 'ip',
        label: 'IP',
        minWidth: 130,
        formatter: (row) => h('span', { class: 'log-mono' }, row.ip || '—')
      },
      {
        prop: 'add_time',
        label: '操作时间',
        minWidth: 170,
        formatter: (row) => h('span', { class: 'log-muted' }, formatTime(row.add_time))
      }
    ]
  }

  const {
    columns,
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: fetchSystemLogList,
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => buildColumns()
    }
  })

  function handleToolbarSearch(form: SystemLogSearchParams) {
    searchForm.value = { ...form }
    replaceSearchParams({
      pages: form.pages || '',
      path: form.path || '',
      ip: '',
      admin_id: form.admin_id ?? '',
      data: form.data || ''
    })
    getData()
  }

  function handleToolbarReset() {
    searchForm.value = {}
    resetSearchParams()
  }
</script>

<style lang="scss">
  @use './log';
</style>
