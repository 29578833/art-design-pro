<template>
  <div class="mini-sub">
    <!-- 统计 -->
    <div v-loading="statsLoading" class="mini-review-stats">
      <div class="mini-review-stat mini-review-stat--avg">
        <div class="mini-review-avg-num">{{ avgDisplay }}</div>
        <div class="mini-stars">
          <ArtSvgIcon
            v-for="i in 5"
            :key="i"
            :icon="i <= avgRounded ? 'ri:star-fill' : 'ri:star-line'"
            :class="i <= avgRounded ? '' : 'mini-star-empty'"
          />
        </div>
        <div class="mini-review-stat-label">综合评分</div>
      </div>
      <div v-for="star in [5, 4, 3]" :key="star" class="mini-review-stat">
        <div class="mini-review-star-row">
          <span class="mini-stars">
            <ArtSvgIcon
              v-for="i in 5"
              :key="i"
              :icon="i <= star ? 'ri:star-fill' : 'ri:star-line'"
              :class="i <= star ? '' : 'mini-star-empty'"
            />
          </span>
          <span class="mini-review-star-label">{{ star }}星</span>
        </div>
        <div class="mini-review-star-count">{{ starCount(star) }}条</div>
      </div>
    </div>

    <!-- 列表 -->
    <div v-loading="loading" class="mini-review-list">
      <div
        v-for="row in list"
        :key="row.id"
        class="mini-review-card"
        :class="{ 'is-hidden': isHidden(row) }"
      >
        <div class="mini-review-card-head">
          <div class="mini-review-user">
            <div class="mini-review-avatar">{{ avatarText(row) }}</div>
            <div>
              <div class="mini-review-name-row">
                <span class="mini-review-name">{{ displayName(row) }}</span>
                <span class="mini-stars">
                  <ArtSvgIcon
                    v-for="i in 5"
                    :key="i"
                    :icon="i <= Number(row.rating || 0) ? 'ri:star-fill' : 'ri:star-line'"
                    :class="i <= Number(row.rating || 0) ? '' : 'mini-star-empty'"
                  />
                </span>
                <span v-if="isHidden(row)" class="mini-review-hidden-tag">已隐藏</span>
              </div>
              <div class="mini-review-meta">
                {{ row.order_no || '—' }} · {{ row.license_plate || '—' }} ·
                {{ row.add_time || '—' }}
              </div>
            </div>
          </div>
          <div class="mini-review-ops">
            <button
              v-if="!row.make"
              type="button"
              class="mini-review-reply-btn"
              @click="toggleReply(row.id)"
            >
              <ArtSvgIcon icon="ri:chat-1-line" />
              回复
            </button>
            <button
              type="button"
              class="mini-review-hide-btn"
              :class="isHidden(row) ? 'is-show' : 'is-hide'"
              @click="handleHide(row)"
            >
              {{ isHidden(row) ? '取消隐藏' : '隐藏' }}
            </button>
          </div>
        </div>

        <p class="mini-review-content">{{ row.content || '—' }}</p>

        <div v-if="row.make" class="mini-review-official">
          <span class="mini-review-official-label">官方回复：</span>{{ row.make }}
        </div>

        <div v-if="replyId === row.id" class="mini-review-reply-form">
          <ElInput
            v-model="replyText"
            type="textarea"
            :rows="3"
            placeholder="输入官方回复内容…"
            maxlength="500"
          />
          <div class="mini-review-reply-actions">
            <ElButton size="small" @click="cancelReply">取消</ElButton>
            <ElButton
              type="primary"
              size="small"
              :loading="replying"
              :disabled="!replyText.trim()"
              @click="submitReply(row.id)"
            >
              发布回复
            </ElButton>
          </div>
        </div>
      </div>

      <div v-if="!loading && !list.length" class="mini-review-empty">暂无评价</div>
    </div>

    <div v-if="pagination.total > 0" class="mini-review-pager">
      <ElPagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchReviewHide,
    fetchReviewList,
    fetchReviewReply,
    fetchReviewStats
  } from '@/api/recycle/miniprogram-review'
  import type { MiniReviewItem, MiniReviewStats } from '@/types/recycle/miniprogram'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  const loading = ref(false)
  const statsLoading = ref(false)
  const list = ref<MiniReviewItem[]>([])
  const stats = ref<MiniReviewStats>({})
  const replyId = ref<number | null>(null)
  const replyText = ref('')
  const replying = ref(false)
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  const avgDisplay = computed(() => {
    const v = Number(stats.value.avg_rating)
    if (Number.isNaN(v)) return '—'
    return v.toFixed(1)
  })

  const avgRounded = computed(() => Math.round(Number(stats.value.avg_rating) || 0))

  function starCount(n: number) {
    const counts = stats.value.star_counts || {}
    return counts[n] ?? counts[String(n)] ?? 0
  }

  function isHidden(row: MiniReviewItem) {
    return Number(row.status) === 2
  }

  function displayName(row: MiniReviewItem) {
    return row.rela_name || row.phone || '用户'
  }

  function avatarText(row: MiniReviewItem) {
    return displayName(row).slice(0, 1)
  }

  function toggleReply(id: number) {
    if (replyId.value === id) {
      cancelReply()
      return
    }
    replyId.value = id
    replyText.value = ''
  }

  function cancelReply() {
    replyId.value = null
    replyText.value = ''
  }

  async function submitReply(id: number) {
    if (!replyText.value.trim()) return
    replying.value = true
    try {
      await fetchReviewReply(id, replyText.value.trim())
      cancelReply()
      await refreshAll()
    } finally {
      replying.value = false
    }
  }

  async function handleHide(row: MiniReviewItem) {
    await fetchReviewHide(row.id)
    await refreshAll()
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

  async function loadStats() {
    statsLoading.value = true
    try {
      stats.value = (await fetchReviewStats()) || {}
    } catch {
      stats.value = {}
    } finally {
      statsLoading.value = false
    }
  }

  async function loadList() {
    loading.value = true
    try {
      const res = await fetchReviewList({
        page: pagination.current,
        limit: pagination.size
      })
      list.value = res.list
      pagination.total = res.count
    } finally {
      loading.value = false
    }
  }

  async function refreshAll() {
    await Promise.all([loadStats(), loadList()])
  }

  onMounted(refreshAll)
</script>
