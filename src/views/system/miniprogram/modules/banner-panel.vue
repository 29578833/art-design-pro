<template>
  <div class="mini-sub">
    <div class="mini-panel-head">
      <div class="mini-panel-tip">管理小程序首页轮播图，支持排序和启用/禁用控制。</div>
      <ElButton type="primary" @click="openCreate">
        <ArtSvgIcon icon="ri:add-line" class="mr-1" />
        新增轮播图
      </ElButton>
    </div>

    <div v-loading="loading" class="mini-banner-list">
      <div v-for="(row, idx) in list" :key="row.id" class="mini-banner-card">
        <!-- 排序 -->
        <div class="mini-banner-sort">
          <button
            type="button"
            class="mini-banner-sort-btn"
            :disabled="idx === 0"
            @click="handleSort(row, 'up')"
          >
            <ArtSvgIcon icon="ri:arrow-up-s-line" />
          </button>
          <span class="mini-banner-sort-num">{{ idx + 1 }}</span>
          <button
            type="button"
            class="mini-banner-sort-btn"
            :disabled="idx === list.length - 1"
            @click="handleSort(row, 'down')"
          >
            <ArtSvgIcon icon="ri:arrow-down-s-line" />
          </button>
        </div>

        <!-- 预览图 -->
        <div class="mini-banner-preview">
          <img v-if="row.image" :src="row.image" alt="" />
          <ArtSvgIcon v-else icon="ri:image-line" class="mini-banner-preview-empty" />
        </div>

        <!-- 信息 -->
        <div class="mini-banner-info">
          <div class="mini-banner-title">{{ row.title || '—' }}</div>
          <div class="mini-banner-meta">
            跳转链接：{{ row.url || '—' }} · 创建于 {{ formatTime(row.add_time) }}
          </div>
        </div>

        <!-- 操作 -->
        <div class="mini-banner-ops">
          <button
            type="button"
            class="mini-banner-status"
            :class="Number(row.is_show) === 1 ? 'is-on' : 'is-off'"
            @click="toggleShow(row)"
          >
            <ArtSvgIcon :icon="Number(row.is_show) === 1 ? 'ri:eye-line' : 'ri:eye-off-line'" />
            {{ Number(row.is_show) === 1 ? '已启用' : '已禁用' }}
          </button>
          <button type="button" class="mini-banner-edit" @click="openEdit(row)">编辑</button>
          <button type="button" class="mini-banner-del" @click="handleDelete(row)">
            <ArtSvgIcon icon="ri:delete-bin-line" />
          </button>
        </div>
      </div>

      <div v-if="!loading && !list.length" class="mini-banner-empty">暂无轮播图</div>
    </div>

    <BannerDialog v-model:visible="dialogVisible" :record="current" @success="loadList" />
  </div>
</template>

<script setup lang="ts">
  import { ElMessageBox } from 'element-plus'
  import {
    fetchBannerDelete,
    fetchBannerList,
    fetchBannerSort,
    fetchBannerUpdate
  } from '@/api/recycle/miniprogram-config'
  import type { MiniBannerItem } from '@/types/recycle/miniprogram'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import BannerDialog from './banner-dialog.vue'

  const loading = ref(false)
  const list = ref<MiniBannerItem[]>([])
  const dialogVisible = ref(false)
  const current = ref<MiniBannerItem | null>(null)

  function formatTime(val?: number | string) {
    if (val === undefined || val === null || val === '') return '—'
    if (typeof val === 'string' && val.includes('-')) return val.slice(0, 10)
    const n = Number(val)
    if (!Number.isNaN(n) && n > 0) {
      const d = new Date(n < 1e12 ? n * 1000 : n)
      if (!Number.isNaN(d.getTime())) {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
    }
    return String(val)
  }

  function openCreate() {
    current.value = null
    dialogVisible.value = true
  }

  function openEdit(row: MiniBannerItem) {
    current.value = row
    dialogVisible.value = true
  }

  async function toggleShow(row: MiniBannerItem) {
    const next = Number(row.is_show) === 1 ? 0 : 1
    await fetchBannerUpdate(row.id, {
      title: row.title || '',
      image: row.image || '',
      url: row.url || '',
      sort: Number(row.sort || 0),
      is_show: next
    })
    await loadList()
  }

  async function handleSort(row: MiniBannerItem, direction: 'up' | 'down') {
    await fetchBannerSort(row.id, direction)
    await loadList()
  }

  async function handleDelete(row: MiniBannerItem) {
    try {
      await ElMessageBox.confirm(`确认删除轮播图「${row.title || row.id}」？`, '删除确认', {
        type: 'warning',
        confirmButtonText: '确认删除'
      })
    } catch {
      return
    }
    await fetchBannerDelete(row.id)
    await loadList()
  }

  async function loadList() {
    loading.value = true
    try {
      const res = await fetchBannerList({ page: 1, limit: 200 })
      list.value = res.list
    } finally {
      loading.value = false
    }
  }

  onMounted(loadList)
</script>
