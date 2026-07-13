<template>
  <div class="admin-user-page art-full-height">
    <div class="admin-user-header">
      <div>
        <div class="admin-user-title">用户账户</div>
        <div class="admin-user-desc">后台管理员账号维护</div>
      </div>
      <ElButton type="primary" @click="openCreate">
        <ArtSvgIcon icon="ri:add-line" class="mr-1" />
        新增用户
      </ElButton>
    </div>

    <UserSearch
      v-model:search-form="searchForm"
      @search="handleToolbarSearch"
      @reset="handleToolbarReset"
    />

    <div class="admin-user-list">
      <ElCard
        class="admin-user-table-card art-table-card"
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
          row-key="id"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </ElCard>
    </div>

    <UserDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :admin-id="currentAdminId"
      @success="refreshData"
    />

    <UserResetPwdDialog
      v-model:visible="resetVisible"
      :admin-id="resetAdminId"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElMessageBox } from 'element-plus'
  import { fetchAdminDelete, fetchAdminList, fetchAdminSetStatus } from '@/api/recycle/system-admin'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type { SystemAdminItem, SystemAdminSearchParams } from '@/types/recycle/system'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import UserSearch from './modules/user-search.vue'
  import UserDialog from './modules/user-dialog.vue'
  import UserResetPwdDialog from './modules/user-reset-pwd-dialog.vue'

  defineOptions({ name: 'User' })

  const searchForm = ref<SystemAdminSearchParams>({ name: undefined })
  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentAdminId = ref<number | null>(null)
  const resetVisible = ref(false)
  const resetAdminId = ref<number | null>(null)

  function openCreate() {
    dialogType.value = 'add'
    currentAdminId.value = null
    dialogVisible.value = true
  }

  function openEdit(row: SystemAdminItem) {
    dialogType.value = 'edit'
    currentAdminId.value = row.id
    dialogVisible.value = true
  }

  function openReset(row: SystemAdminItem) {
    resetAdminId.value = row.id
    resetVisible.value = true
  }

  async function handleDelete(row: SystemAdminItem) {
    try {
      await ElMessageBox.confirm(
        `确认删除管理员「${row.real_name || row.account}」？`,
        '删除确认',
        {
          type: 'warning',
          confirmButtonText: '确认删除'
        }
      )
    } catch {
      return
    }
    await fetchAdminDelete(row.id)
    refreshData()
  }

  async function toggleStatus(row: SystemAdminItem) {
    const next = row.status === 1 ? 0 : 1
    await fetchAdminSetStatus(row.id, next)
    refreshData()
  }

  function buildColumns() {
    const cols: ColumnOption<SystemAdminItem>[] = [
      {
        prop: 'account',
        label: '用户名',
        minWidth: 120,
        formatter: (row) => h('span', { class: 'admin-mono' }, row.account || '—')
      },
      {
        prop: 'real_name',
        label: '真实姓名',
        minWidth: 140,
        formatter: (row) => {
          const name = row.real_name || '—'
          const initial = (row.real_name || row.account || '?').slice(0, 1)
          return h('div', { class: 'admin-name-cell' }, [
            h('span', { class: 'admin-avatar' }, initial),
            h('span', null, name)
          ])
        }
      },
      {
        prop: 'phone',
        label: '手机号',
        minWidth: 120,
        formatter: (row) => row.phone || '—'
      },
      {
        prop: 'roles',
        label: '所属角色',
        minWidth: 120,
        formatter: (row) => {
          const text = typeof row.roles === 'string' ? row.roles : ''
          if (!text) return h('span', { class: 'admin-muted' }, '—')
          return h('span', { class: 'admin-role-tag' }, text)
        }
      },
      {
        prop: 'department',
        label: '部门',
        minWidth: 100,
        formatter: (row) => row.department || '—'
      },
      {
        prop: 'status',
        label: '状态',
        minWidth: 90,
        formatter: (row) =>
          h(
            'button',
            {
              type: 'button',
              class: 'admin-status-btn',
              onClick: () => toggleStatus(row)
            },
            [
              h('span', {
                class: ['admin-status-dot', row.status === 1 ? 'is-on' : 'is-off']
              }),
              h(
                'span',
                { class: row.status === 1 ? 'is-on-text' : 'is-off-text' },
                row.status === 1 ? '正常' : '禁用'
              )
            ]
          )
      },
      {
        prop: '_last_time',
        label: '最近登录',
        minWidth: 160,
        formatter: (row) => h('span', { class: 'admin-muted' }, row._last_time || '—')
      },
      {
        prop: 'operation',
        label: '操作',
        width: 260,
        align: 'center',
        fixed: 'right',
        formatter: (row) =>
          h('div', { class: 'order-actions' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn ghost',
                onClick: () => openEdit(row)
              },
              [h(ArtSvgIcon, { icon: 'ri:pencil-line', class: 'order-action-icon' }), '编辑']
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn default',
                onClick: () => openReset(row)
              },
              [
                h(ArtSvgIcon, { icon: 'ri:lock-password-line', class: 'order-action-icon' }),
                '重置密码'
              ]
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn warning',
                onClick: () => handleDelete(row)
              },
              [h(ArtSvgIcon, { icon: 'ri:delete-bin-line', class: 'order-action-icon' }), '删除']
            )
          ])
      }
    ]
    return cols
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
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchAdminList,
      apiParams: {
        name: searchForm.value.name,
        page: 1,
        limit: 20
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    }
  })

  function handleToolbarSearch(form: SystemAdminSearchParams) {
    searchForm.value = form
    replaceSearchParams({ name: form.name })
    getData()
  }

  function handleToolbarReset() {
    searchForm.value = { name: undefined }
    resetSearchParams()
    replaceSearchParams({ name: undefined })
    getData()
  }
</script>

<style lang="scss">
  @use './user';
</style>
