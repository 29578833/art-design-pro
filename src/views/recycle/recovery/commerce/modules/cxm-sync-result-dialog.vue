<template>
  <ElDialog
    :model-value="visible"
    title="同步完成"
    width="480px"
    append-to-body
    align-center
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="cxm-sync-result">
      <div class="cxm-sync-result__msg">{{ message || '同步完成' }}</div>
      <div class="cxm-sync-result__stats">
        <span>共 {{ result?.total || 0 }} 张</span>
        <span class="is-ok">成功 {{ result?.success || 0 }}</span>
        <span class="is-fail">失败 {{ result?.failed || 0 }}</span>
      </div>
      <div v-if="result?.results?.length" class="cxm-sync-result__list">
        <div v-for="(item, index) in result.results" :key="index" class="cxm-sync-result__item">
          <div class="cxm-sync-result__item-head">
            <span class="cxm-sync-result__label">{{ item.label || '照片' }}</span>
            <span :class="item.status === 'ok' ? 'is-ok' : 'is-fail'">
              {{ item.status === 'ok' ? '成功' : '失败' }}
            </span>
          </div>
          <div v-if="item.reason" class="cxm-sync-result__reason">{{ item.reason }}</div>
        </div>
      </div>
    </div>
    <template #footer>
      <ElButton type="primary" @click="emit('update:visible', false)">知道了</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { SyncEntryPhotosResult } from '@/api/recycle/accept'

  defineOptions({ name: 'CxmSyncResultDialog' })

  defineProps<{
    visible: boolean
    message?: string
    result?: SyncEntryPhotosResult | null
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]
  }>()
</script>

<style scoped lang="scss">
  .cxm-sync-result {
    &__msg {
      font-size: 14px;
      line-height: 22px;
      color: #101828;
    }

    &__stats {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      font-size: 13px;
      line-height: 20px;
      color: #6a7282;

      .is-ok {
        color: #52c41a;
      }

      .is-fail {
        color: #ff4d4f;
      }
    }

    &__list {
      max-height: 320px;
      margin-top: 16px;
      overflow: auto;
    }

    &__item {
      padding: 10px 0;
      border-top: 1px solid #f2f4f7;
    }

    &__item-head {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      line-height: 22px;

      .is-ok {
        color: #52c41a;
      }

      .is-fail {
        flex-shrink: 0;
        color: #ff4d4f;
      }
    }

    &__label {
      color: #364153;
    }

    &__reason {
      margin-top: 4px;
      font-size: 12px;
      line-height: 18px;
      color: #ff4d4f;
    }
  }
</style>
