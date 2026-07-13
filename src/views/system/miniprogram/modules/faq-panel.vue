<template>
  <div class="mini-sub">
    <div class="mini-panel-head">
      <div class="mini-panel-tip">管理小程序常见问题列表，支持分类、排序和启用控制。</div>
      <ElButton type="primary" @click="openCreate">
        <ArtSvgIcon icon="ri:add-line" class="mr-1" />
        新增FAQ
      </ElButton>
    </div>

    <div class="mini-search-bar">
      <ElSelect
        v-model="category"
        clearable
        placeholder="全部分类"
        style="width: 180px"
        @change="handleSearch"
        @clear="handleSearch"
      >
        <ElOption v-for="item in FAQ_CATEGORIES" :key="item" :label="item" :value="item" />
      </ElSelect>
    </div>

    <ElCard
      class="mini-table-card art-table-card mt-0!"
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

    <FaqDialog v-model:visible="dialogVisible" :record="current" @success="loadList" />
  </div>
</template>

<script setup lang="ts">
  import { ElMessageBox } from 'element-plus'
  import {
    fetchFaqDelete,
    fetchFaqList,
    fetchFaqSort,
    fetchFaqUpdate
  } from '@/api/recycle/miniprogram-config'
  import type { ColumnOption } from '@/types/component'
  import type { MiniFaqItem } from '@/types/recycle/miniprogram'
  import { FAQ_CATEGORIES } from '@/types/recycle/miniprogram'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import FaqDialog from './faq-dialog.vue'

  const loading = ref(false)
  const list = ref<MiniFaqItem[]>([])
  const category = ref('')
  const dialogVisible = ref(false)
  const current = ref<MiniFaqItem | null>(null)
  const pagination = reactive({
    current: 1,
    size: 20,
    total: 0
  })

  function openCreate() {
    current.value = null
    dialogVisible.value = true
  }

  function openEdit(row: MiniFaqItem) {
    current.value = row
    dialogVisible.value = true
  }

  function handleSearch() {
    pagination.current = 1
    loadList()
  }

  async function toggleShow(row: MiniFaqItem) {
    const next = Number(row.is_show) === 1 ? 0 : 1
    await fetchFaqUpdate(row.id, {
      question: row.question || '',
      answer: row.answer || '',
      category: row.category || '其他',
      sort: Number(row.sort || 0),
      is_show: next
    })
    await loadList()
  }

  async function handleSort(row: MiniFaqItem, direction: 1 | -1) {
    await fetchFaqSort(row.id, direction)
    await loadList()
  }

  async function handleDelete(row: MiniFaqItem) {
    try {
      await ElMessageBox.confirm(`确认删除该 FAQ？`, '删除确认', {
        type: 'warning',
        confirmButtonText: '确认删除'
      })
    } catch {
      return
    }
    await fetchFaqDelete(row.id)
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

  function rowIndex(idx: number) {
    return (pagination.current - 1) * pagination.size + idx + 1
  }

  const columns = computed<ColumnOption<MiniFaqItem>[]>(() => [
    {
      prop: 'sort',
      label: '排序',
      width: 72,
      formatter: (row) => {
        const idx = list.value.findIndex((i) => i.id === row.id)
        const globalIdx = rowIndex(idx)
        const isFirst = pagination.current === 1 && idx === 0
        const isLast = (pagination.current - 1) * pagination.size + idx >= pagination.total - 1
        return h('div', { class: 'mini-faq-sort' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'mini-faq-sort-btn',
              disabled: isFirst,
              onClick: () => handleSort(row, 1)
            },
            [h(ArtSvgIcon, { icon: 'ri:arrow-up-s-line' })]
          ),
          h('span', { class: 'mini-faq-sort-num' }, String(globalIdx)),
          h(
            'button',
            {
              type: 'button',
              class: 'mini-faq-sort-btn',
              disabled: isLast,
              onClick: () => handleSort(row, -1)
            },
            [h(ArtSvgIcon, { icon: 'ri:arrow-down-s-line' })]
          )
        ])
      }
    },
    {
      prop: 'question',
      label: '问题',
      minWidth: 260,
      formatter: (row) => {
        const answer = row.answer || ''
        const preview = answer.length > 50 ? `${answer.slice(0, 50)}…` : answer
        return h('div', { class: 'mini-faq-q' }, [
          h('div', { class: 'mini-faq-q-title' }, row.question || '—'),
          preview ? h('div', { class: 'mini-faq-q-sub' }, preview) : null
        ])
      }
    },
    {
      prop: 'category',
      label: '分类',
      width: 120,
      formatter: (row) => h('span', { class: 'mini-faq-cat' }, row.category || '—')
    },
    {
      prop: 'is_show',
      label: '状态',
      width: 120,
      formatter: (row) => {
        const on = Number(row.is_show) === 1
        return h(
          'button',
          {
            type: 'button',
            class: ['mini-faq-status', on ? 'is-on' : 'is-off'],
            onClick: () => toggleShow(row)
          },
          on ? '显示中' : '已隐藏'
        )
      }
    },
    {
      prop: 'operation',
      label: '操作',
      width: 160,
      formatter: (row) =>
        h('div', { class: 'mini-faq-ops' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'mini-faq-edit',
              onClick: () => openEdit(row)
            },
            '编辑'
          ),
          h('span', { class: 'mini-faq-sep' }, '|'),
          h(
            'button',
            {
              type: 'button',
              class: 'mini-faq-del',
              onClick: () => handleDelete(row)
            },
            '删除'
          )
        ])
    }
  ])

  async function loadList() {
    loading.value = true
    try {
      const res = await fetchFaqList({
        page: pagination.current,
        limit: pagination.size,
        category: category.value || ''
      })
      list.value = res.list
      pagination.total = res.count
    } finally {
      loading.value = false
    }
  }

  onMounted(loadList)
</script>
