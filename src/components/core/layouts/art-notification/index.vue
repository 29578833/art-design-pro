<!-- 通知组件 -->
<template>
  <div
    class="art-notification-panel art-card-sm !shadow-xl"
    :style="{
      transform: show ? 'scaleY(1)' : 'scaleY(0.9)',
      opacity: show ? 1 : 0
    }"
    v-show="visible"
    @click.stop
  >
    <div class="flex-cb px-3.5 mt-3.5">
      <span class="text-base font-medium text-g-800">{{ $t('notice.title') }}</span>
      <span
        v-if="unreadCount > 0"
        class="text-xs text-g-800 px-1.5 py-1 c-p select-none rounded hover:bg-g-200"
        @click="handleAllRead"
      >
        {{ $t('notice.btnRead') }}
      </span>
    </div>

    <div class="w-full h-[calc(100%-55px)] mt-3.5">
      <div class="h-full overflow-y-scroll scrollbar-thin">
        <ul v-if="noticeList.length">
          <li
            v-for="(item, index) in noticeList"
            :key="item.id ?? index"
            class="box-border flex px-3.5 py-3.5 c-p last:border-b-0 hover:bg-g-200/60"
            @click="handleItemClick(item)"
          >
            <div class="relative size-9 shrink-0">
              <div
                class="size-9 leading-9 text-center rounded-lg flex-cc"
                :class="getNoticeStyle(item.type).iconClass"
              >
                <ArtSvgIcon
                  class="text-lg !bg-transparent"
                  :icon="getNoticeStyle(item.type).icon"
                />
              </div>
              <span
                v-if="!item.read"
                class="absolute -top-0.5 -right-0.5 size-2 rounded-full !bg-danger ring-[var(--art-card-bg)]"
              ></span>
            </div>
            <div class="w-[calc(100%-45px)] ml-3.5">
              <h4
                class="text-sm leading-5.5 text-g-900 truncate"
                :class="item.read ? 'font-normal' : 'font-medium'"
              >
                {{ item.title }}
              </h4>
              <!-- truncate -->
              <p v-if="item.content" class="mt-1.5 text-xs text-g-700">
                {{ item.content }}
              </p>
              <p class="mt-1.5 text-xs text-g-600">{{ formatRelativeTime(item.time) }}</p>
            </div>
          </li>
        </ul>

        <div v-else class="relative flex-cc h-full text-g-500 text-center !bg-transparent">
          <ArtSvgIcon icon="system-uicons:inbox" class="text-5xl" />
          <p class="mt-3.5 text-xs !bg-transparent">
            {{ $t('notice.text[0]') }}{{ $t('notice.title') }}
          </p>
        </div>
      </div>
    </div>

    <div class="h-25"></div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { fetchSystemNoticeList } from '@/api/system-notice'

  defineOptions({ name: 'ArtNotification' })

  interface NoticeStyle {
    /** 图标 */
    icon: string
    /** icon 样式 */
    iconClass: string
  }

  const props = defineProps<{
    value: boolean
  }>()

  const emit = defineEmits<{
    'update:value': [value: boolean]
    'unread-change': [count: number]
  }>()

  const router = useRouter()

  const show = ref(false)
  const visible = ref(false)

  const noticeList = ref<Api.SystemNotice.SystemNoticeItem[]>([])

  /** 本地已读通知 id（重新打开面板后保持已读状态） */
  const locallyReadIds = ref<Set<number | string>>(new Set())

  /** 未读数量 */
  const unreadCount = computed(() => noticeList.value.filter((item) => !item.read).length)

  /** 通知图标映射：1=订单通知 2=拖车通知 */
  const noticeStyleMap: Record<string, NoticeStyle> = {
    '1': {
      icon: 'ri:file-list-3-line',
      iconClass: 'bg-theme/12 text-theme'
    },
    '2': {
      icon: 'ri:truck-line',
      iconClass: 'bg-info/12 text-info'
    }
  }

  const defaultNoticeStyle: NoticeStyle = {
    icon: 'ri:notification-3-line',
    iconClass: 'bg-warning/12 text-warning'
  }

  function getNoticeStyle(type?: Api.SystemNotice.NoticeType): NoticeStyle {
    return noticeStyleMap[String(type ?? '')] || defaultNoticeStyle
  }

  /**
   * 获取通知列表
   */
  async function fetchNoticeList() {
    try {
      const list = await fetchSystemNoticeList()
      noticeList.value = (Array.isArray(list) ? list : []).map((item) => {
        // 合并本地已读状态，避免重新打开面板后已读消息回退
        if (locallyReadIds.value.has(item.id)) {
          return { ...item, read: 1 }
        }
        return item
      })
      emit('unread-change', unreadCount.value)
    } catch {
      // 请求失败时保留现有列表
    }
  }

  /**
   * 相对时间格式化
   * @param timestamp 时间戳（Unix 秒）
   */
  function formatRelativeTime(timestamp?: number | string): string {
    if (timestamp === undefined || timestamp === null || timestamp === '') return ''
    const ts = Number(timestamp)
    if (Number.isNaN(ts) || ts <= 0) return ''
    const now = Math.floor(Date.now() / 1000)
    const diff = now - ts
    if (diff < 60) return '刚刚'
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
    if (diff < 2592000) return Math.floor(diff / 86400) + '天前'
    const date = new Date(ts * 1000)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return date.getFullYear() + '-' + month + '-' + day
  }

  /**
   * 点击通知项：标记已读并跳转
   */
  function handleItemClick(item: Api.SystemNotice.SystemNoticeItem) {
    if (!item.read) {
      item.read = 1
      if (item.id !== undefined && item.id !== null) locallyReadIds.value.add(item.id)
      emit('unread-change', unreadCount.value)
    }
    jumpUrl(item.url)
  }

  /**
   * 全部已读
   */
  function handleAllRead() {
    if (!unreadCount.value) return
    noticeList.value.forEach((item) => {
      item.read = 1
      if (item.id !== undefined && item.id !== null) locallyReadIds.value.add(item.id)
    })
    emit('unread-change', 0)
  }

  /**
   * 跳转链接：外链新窗口打开，内链使用路由跳转
   */
  function jumpUrl(path?: string) {
    if (!path) return
    // 外链直接新窗口打开
    if (/^https?:\/\//.test(path)) {
      window.open(path, '_blank')
      return
    }
    // 仅在新系统中存在对应路由时跳转，避免跳转到 404
    if (router && typeof router.push === 'function') {
      const resolved = router.resolve(path)
      const isCatchAll = resolved.matched.some((record) => record.name === 'Exception404')
      if (resolved.matched.length && !isCatchAll) {
        router.push(path)
      }
    } else {
      // 兜底：直接跳转
      window.location.href = path
    }
  }

  function showNotice(open: boolean) {
    if (open) {
      visible.value = true
      setTimeout(() => {
        show.value = true
      }, 5)
      fetchNoticeList()
    } else {
      show.value = false
      setTimeout(() => {
        visible.value = false
      }, 350)
    }
  }

  onMounted(() => {
    fetchNoticeList()
  })

  watch(
    () => props.value,
    (newValue) => {
      showNotice(newValue)
    }
  )
</script>

<style scoped>
  @reference '@styles/core/tailwind.css';

  .art-notification-panel {
    @apply absolute
    top-14.5
    right-5
    w-90
    h-125
    overflow-hidden
    transition-all
    duration-300
    origin-top
    will-change-[top,left]
    max-[640px]:top-[65px]
    max-[640px]:right-0
    max-[640px]:w-full
    max-[640px]:h-[80vh];
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 5px !important;
  }

  .dark .scrollbar-thin::-webkit-scrollbar-track {
    background-color: var(--default-box-color);
  }

  .dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: #222 !important;
  }
</style>
