<template>
  <div class="mini-sub">
    <div class="mini-panel-head">
      <div class="mini-panel-tip">管理小程序内的系统公告，支持启用/禁用。</div>
      <ElButton type="primary" @click="openCreate">
        <ArtSvgIcon icon="ri:add-line" class="mr-1" />
        新增公告
      </ElButton>
    </div>

    <ElCard
      class="mini-table-card art-table-card"
      shadow="never"
      :body-style="{ padding: 0, paddingBottom: '20px' }"
    >
      <ArtTable
        :loading="loading"
        :data="list"
        :columns="columns"
        :pagination="pagination"
        :show-table-header="false"
        :stripe="false"
        row-key="id"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <NoticeDialog v-model:visible="dialogVisible" :record="current" @success="loadList" />
  </div>
</template>

<script setup lang="ts">
  import { ElMessageBox, ElSwitch } from 'element-plus'
  import {
    fetchNoticeDelete,
    fetchNoticeList,
    fetchNoticeUpdate
  } from '@/api/recycle/miniprogram-config'
  import type { ColumnOption } from '@/types/component'
  import type { MiniNoticeItem } from '@/types/recycle/miniprogram'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import NoticeDialog from './notice-dialog.vue'

  const loading = ref(false)
  const list = ref<MiniNoticeItem[]>([])
  const dialogVisible = ref(false)
  const current = ref<MiniNoticeItem | null>(null)
  const pagination = reactive({
    current: 1,
    size: 20,
    total: 0
  })

  function openCreate() {
    current.value = null
    dialogVisible.value = true
  }

  function openEdit(row: MiniNoticeItem) {
    current.value = row
    dialogVisible.value = true
  }

  async function toggleShow(row: MiniNoticeItem, val: number) {
    await fetchNoticeUpdate(row.id, {
      title: row.title || '',
      content: row.content || '',
      sort: Number(row.sort || 0),
      is_show: val
    })
    await loadList()
  }

  async function handleDelete(row: MiniNoticeItem) {
    try {
      await ElMessageBox.confirm(`确认删除公告「${row.title || row.id}」？`, '删除确认', {
        type: 'warning',
        confirmButtonText: '确认删除'
      })
    } catch {
      return
    }
    await fetchNoticeDelete(row.id)
    await loadList()
  }

  function handleSizeChange(size: number) {
    pagination.size = size
    pagination.current = 1
    loadList()
  }

  function handleCurrentChange(page: number) {
    pagination.current = page
    loadList()
  }

  const columns = computed<ColumnOption<MiniNoticeItem>[]>(() => [
    {
      prop: 'title',
      label: '标题',
      minWidth: 180,
      formatter: (row) => row.title || '—'
    },
    {
      prop: 'content',
      label: '内容',
      minWidth: 260,
      formatter: (row) => h('span', { class: 'mini-ellipsis' }, row.content || '—')
    },
    {
      prop: 'sort',
      label: '排序',
      width: 80,
      formatter: (row) => row.sort ?? 0
    },
    {
      prop: 'is_show',
      label: '启用',
      width: 90,
      formatter: (row) =>
        h(ElSwitch, {
          modelValue: Number(row.is_show) === 1 ? 1 : 0,
          activeValue: 1,
          inactiveValue: 0,
          'onUpdate:modelValue': (val: string | number | boolean) => toggleShow(row, Number(val))
        })
    },
    {
      prop: 'operation',
      label: '操作',
      width: 180,
      align: 'center',
      fixed: 'right',
      formatter: (row) =>
        h('div', { class: 'order-actions' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'order-action-btn default',
              onClick: () => openEdit(row)
            },
            [h(ArtSvgIcon, { icon: 'ri:pencil-line', class: 'order-action-icon' }), '编辑']
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
  ])

  async function loadList() {
    loading.value = true
    try {
      const res = await fetchNoticeList({
        page: pagination.current,
        limit: pagination.size
      })
      list.value = res.list
      pagination.total = res.count
    } finally {
      loading.value = false
    }
  }

  onMounted(loadList)
</script>
