<template>
  <div class="sys-notify-page art-full-height">
    <div class="sys-notify-header">
      <div class="sys-notify-title">系统通知</div>
      <div class="sys-notify-desc">通知模板开关与站内信内容配置</div>
    </div>

    <div class="sys-notify-tip">
      <ArtSvgIcon icon="ri:information-line" class="sys-notify-tip-ico" />
      <div>
        配置各类系统通知的开关和发送渠道。短信/公众号等渠道可能产生额外费用，建议只对关键节点开启。
      </div>
    </div>

    <div v-loading="loading" class="sys-notify-list">
      <div v-for="item in list" :key="item.id" class="sys-notify-card">
        <div class="sys-notify-main">
          <div class="sys-notify-name-row">
            <span class="sys-notify-name">{{ item.name || item.title || '—' }}</span>
            <span v-if="item.mark" class="sys-notify-mark">{{ item.mark }}</span>
          </div>
          <div class="sys-notify-channels">
            <span
              v-for="ch in getVisibleChannels(item)"
              :key="ch.key"
              class="sys-notify-channel"
              :class="Number(item[ch.key]) === 1 ? 'is-on' : 'is-off'"
            >
              {{ ch.label }}
            </span>
          </div>
          <div class="sys-notify-desc-text">{{ item.title || '—' }}</div>
        </div>
        <div class="sys-notify-actions">
          <div class="sys-notify-switches">
            <div v-for="ch in getToggleChannels(item)" :key="ch.key" class="sys-notify-switch-row">
              <span class="sys-notify-switch-label">{{ ch.label }}</span>
              <ElSwitch
                :model-value="Number(item[ch.key]) === 1"
                :loading="togglingKey === `${item.id}-${ch.key}`"
                @change="(val: string | number | boolean) => handleToggle(item, ch.key, !!val)"
              />
            </div>
          </div>
          <ElButton v-if="Number(item.is_system) !== 2" plain @click="openEdit(item)">
            配置
          </ElButton>
        </div>
      </div>
      <div v-if="!loading && !list.length" class="sys-notify-empty">暂无通知模板</div>
    </div>

    <NotifyEditDialog v-model:visible="editVisible" :notify-id="editId" @success="loadList" />
  </div>
</template>

<script setup lang="ts">
  import {
    fetchNotificationList,
    fetchNotificationSetStatus
  } from '@/api/recycle/system-notification'
  import type {
    NotificationChannelType,
    SystemNotificationItem
  } from '@/types/recycle/system-notification'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import NotifyEditDialog from './modules/notify-edit-dialog.vue'

  defineOptions({ name: 'SystemNotify' })

  const CHANNELS: { key: NotificationChannelType; label: string }[] = [
    { key: 'is_system', label: '站内' },
    { key: 'is_sms', label: '短信' },
    { key: 'is_wechat', label: '公众号' },
    { key: 'is_routine', label: '小程序' }
  ]

  const loading = ref(false)
  const list = ref<SystemNotificationItem[]>([])
  const togglingKey = ref('')
  const editVisible = ref(false)
  const editId = ref<number | null>(null)

  function getVisibleChannels(item: SystemNotificationItem) {
    return CHANNELS.filter((ch) => Number(item[ch.key]) !== 2)
  }

  function getToggleChannels(item: SystemNotificationItem) {
    return getVisibleChannels(item)
  }

  function openEdit(item: SystemNotificationItem) {
    editId.value = item.id
    editVisible.value = true
  }

  async function handleToggle(
    item: SystemNotificationItem,
    type: NotificationChannelType,
    enabled: boolean
  ) {
    const status = enabled ? 1 : 0
    const key = `${item.id}-${type}`
    togglingKey.value = key
    try {
      await fetchNotificationSetStatus(type, status, item.id)
      item[type] = status
    } finally {
      togglingKey.value = ''
    }
  }

  async function loadList() {
    loading.value = true
    try {
      list.value = await fetchNotificationList()
    } finally {
      loading.value = false
    }
  }

  onMounted(loadList)
</script>

<style lang="scss">
  @use './notify';
</style>
