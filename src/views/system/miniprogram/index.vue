<template>
  <div class="mini-page art-full-height">
    <!-- 子页 -->
    <template v-if="activePage">
      <div class="mini-header">
        <div class="mini-crumb">
          <button type="button" class="mini-crumb-back" @click="activePage = null">
            <ArtSvgIcon icon="ri:smartphone-line" />
            小程序管理
          </button>
          <span class="mini-crumb-sep">/</span>
          <div class="mini-crumb-current">
            <span class="mini-crumb-ico">
              <ArtSvgIcon :icon="currentMeta.icon" />
            </span>
            {{ currentMeta.label }}
          </div>
        </div>
      </div>

      <BannerPanel v-if="activePage === 'banner'" />
      <NoticePanel v-else-if="activePage === 'notice'" />
      <AgreementPanel v-else-if="activePage === 'agreement'" />
      <FaqPanel v-else-if="activePage === 'faq'" />
      <ReviewPanel v-else-if="activePage === 'reviews'" />
    </template>

    <!-- 入口 -->
    <template v-else>
      <div class="mini-header">
        <div class="mini-title">小程序管理</div>
        <div class="mini-desc">管理鑫广智能回收小程序端的内容配置与用户运营</div>
      </div>

      <div class="mini-status-card">
        <div class="mini-status-ico">
          <ArtSvgIcon icon="ri:smartphone-line" />
        </div>
        <div>
          <div class="mini-status-name">鑫广智能回收小程序</div>
          <div class="mini-status-meta">内容配置 · 公告 / 协议 / FAQ / 评价运营</div>
        </div>
        <div class="mini-status-online">
          <span class="mini-status-dot" />
          运行正常
        </div>
      </div>

      <div class="mini-card-grid">
        <div
          v-for="item in entryCards"
          :key="item.id"
          class="mini-entry-card"
          @click="activePage = item.id"
        >
          <div class="mini-entry-top">
            <div class="mini-entry-ico">
              <ArtSvgIcon :icon="item.icon" />
            </div>
            <span v-if="item.count !== undefined" class="mini-entry-count">{{ item.count }}</span>
          </div>
          <div class="mini-entry-title">{{ item.label }}</div>
          <p class="mini-entry-desc">{{ item.description }}</p>
          <div class="mini-entry-link">
            <span>进入管理</span>
            <ArtSvgIcon icon="ri:arrow-right-s-line" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { fetchBannerList, fetchFaqList, fetchNoticeList } from '@/api/recycle/miniprogram-config'
  import { fetchReviewList } from '@/api/recycle/miniprogram-review'
  import type { MiniSubPage } from '@/types/recycle/miniprogram'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import BannerPanel from './modules/banner-panel.vue'
  import NoticePanel from './modules/notice-panel.vue'
  import AgreementPanel from './modules/agreement-panel.vue'
  import FaqPanel from './modules/faq-panel.vue'
  import ReviewPanel from './modules/review-panel.vue'

  defineOptions({ name: 'Miniprogram' })

  const activePage = ref<MiniSubPage | null>(null)

  const entryCards = ref<
    {
      id: MiniSubPage
      label: string
      icon: string
      description: string
      count?: number
    }[]
  >([
    {
      id: 'banner',
      label: '轮播图管理',
      icon: 'ri:image-line',
      description: '首页轮播图排序与发布控制'
    },
    {
      id: 'notice',
      label: '公告管理',
      icon: 'ri:notification-3-line',
      description: '系统公告启用与内容维护'
    },
    {
      id: 'agreement',
      label: '协议管理',
      icon: 'ri:file-text-line',
      description: '用户协议/隐私政策内容管理（编辑直接生效）',
      count: 3
    },
    {
      id: 'faq',
      label: 'FAQ管理',
      icon: 'ri:question-answer-line',
      description: '常见问题列表 CRUD 与排序'
    },
    {
      id: 'reviews',
      label: '评价管理',
      icon: 'ri:star-line',
      description: '用户评价查看、回复与隐藏'
    }
  ])

  const currentMeta = computed(() => {
    const found = entryCards.value.find((c) => c.id === activePage.value)
    return found || { label: '', icon: 'ri:apps-line' }
  })

  async function loadEntryCounts() {
    try {
      const [banners, notices, faqs, reviews] = await Promise.all([
        fetchBannerList({ page: 1, limit: 200 }),
        fetchNoticeList({ page: 1, limit: 200 }),
        fetchFaqList({ page: 1, limit: 200 }),
        fetchReviewList({ page: 1, limit: 200 })
      ])
      entryCards.value = entryCards.value.map((card) => {
        if (card.id === 'banner') {
          return { ...card, count: banners.list.filter((i) => Number(i.is_show) === 1).length }
        }
        if (card.id === 'notice') {
          return { ...card, count: notices.list.filter((i) => Number(i.is_show) === 1).length }
        }
        if (card.id === 'faq') {
          return { ...card, count: faqs.list.filter((i) => Number(i.is_show) === 1).length }
        }
        if (card.id === 'reviews') {
          return { ...card, count: reviews.list.filter((i) => Number(i.status) !== 2).length }
        }
        return card
      })
    } catch {
      // 入口数量失败不影响进入子页
    }
  }

  onMounted(() => {
    loadEntryCounts()
  })
</script>

<style lang="scss">
  @use './miniprogram';
</style>
