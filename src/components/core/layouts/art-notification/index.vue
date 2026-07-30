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
      <span class="text-xs text-g-800 px-1.5 py-1 c-p select-none rounded hover:bg-g-200">
        {{ $t('notice.btnRead') }}
      </span>
    </div>

    <div class="w-full h-[calc(100%-55px)] mt-3.5">
      <div class="h-[calc(100%-60px)] overflow-y-scroll scrollbar-thin">
        <ul v-if="noticeList.length">
          <li
            v-for="(item, index) in noticeList"
            :key="index"
            class="box-border flex-c px-3.5 py-3.5 c-p last:border-b-0 hover:bg-g-200/60"
          >
            <div
              class="size-9 leading-9 text-center rounded-lg flex-cc"
              :class="[getNoticeStyle(item.type).iconClass]"
            >
              <ArtSvgIcon class="text-lg !bg-transparent" :icon="getNoticeStyle(item.type).icon" />
            </div>
            <div class="w-[calc(100%-45px)] ml-3.5">
              <h4 class="text-sm font-normal leading-5.5 text-g-900">{{ item.title }}</h4>
              <p class="mt-1.5 text-xs text-g-500">{{ item.time }}</p>
            </div>
          </li>
        </ul>

        <div v-else class="relative top-25 h-full text-g-500 text-center !bg-transparent">
          <ArtSvgIcon icon="system-uicons:inbox" class="text-5xl" />
          <p class="mt-3.5 text-xs !bg-transparent">
            {{ $t('notice.text[0]') }}{{ $t('notice.title') }}
          </p>
        </div>
      </div>

      <div class="relative box-border w-full px-3.5">
        <ElButton class="w-full mt-3" @click="handleViewAll" v-ripple>
          {{ $t('notice.viewAll') }}
        </ElButton>
      </div>
    </div>

    <div class="h-25"></div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'

  defineOptions({ name: 'ArtNotification' })

  interface NoticeItem {
    /** 标题 */
    title: string
    /** 时间 */
    time: string
    /** 类型 */
    type: NoticeType
  }

  interface NoticeStyle {
    /** 图标 */
    icon: string
    /** icon 样式 */
    iconClass: string
  }

  type NoticeType = 'email' | 'message' | 'collection' | 'user' | 'notice'

  const props = defineProps<{
    value: boolean
  }>()

  const emit = defineEmits<{
    'update:value': [value: boolean]
  }>()

  const show = ref(false)
  const visible = ref(false)

  const noticeList = ref<NoticeItem[]>([
    {
      title: '订单已通过审核',
      time: '2024-6-13 0:10',
      type: 'notice'
    },
    {
      title: '订单已通过质检',
      time: '2024-4-21 8:05',
      type: 'message'
    },
    {
      title: '订单已被驳回',
      time: '2020-3-17 21:12',
      type: 'collection'
    },
    {
      title: '订单已通过审核',
      time: '2024-02-14 0:20',
      type: 'notice'
    },
    {
      title: '订单已通过质检',
      time: '2024-1-20 0:15',
      type: 'email'
    },
    {
      title: '订单已通过审核',
      time: '2024-1-17 22:06',
      type: 'notice'
    }
  ])

  const noticeStyleMap: Record<NoticeType, NoticeStyle> = {
    email: {
      icon: 'ri:mail-line',
      iconClass: 'bg-warning/12 text-warning'
    },
    message: {
      icon: 'ri:volume-down-line',
      iconClass: 'bg-success/12 text-success'
    },
    collection: {
      icon: 'ri:heart-3-line',
      iconClass: 'bg-danger/12 text-danger'
    },
    user: {
      icon: 'ri:volume-down-line',
      iconClass: 'bg-info/12 text-info'
    },
    notice: {
      icon: 'ri:notification-3-line',
      iconClass: 'bg-theme/12 text-theme'
    }
  }

  function getNoticeStyle(type: NoticeType): NoticeStyle {
    return (
      noticeStyleMap[type] || {
        icon: 'ri:arrow-right-circle-line',
        iconClass: 'bg-theme/12 text-theme'
      }
    )
  }

  function showNotice(open: boolean) {
    if (open) {
      visible.value = true
      setTimeout(() => {
        show.value = true
      }, 5)
    } else {
      show.value = false
      setTimeout(() => {
        visible.value = false
      }, 350)
    }
  }

  function handleViewAll() {
    console.log('查看全部通知')
    emit('update:value', false)
  }

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
