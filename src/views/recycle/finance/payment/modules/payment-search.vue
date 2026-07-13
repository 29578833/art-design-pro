<template>
  <div class="pay-search-panel">
    <div class="pay-toolbar">
      <ElInput
        v-model="keyword"
        class="pay-toolbar-search"
        placeholder="搜索付款单号 / 结算单号 / 订单号 / 车牌"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="pay-toolbar-search-icon" />
        </template>
      </ElInput>

      <ElButton class="pay-toolbar-reset" text @click="handleReset">重置</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { PaymentLogSearchParams } from '@/types/recycle/payment-log'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: PaymentLogSearchParams
  }

  interface Emits {
    (e: 'update:searchForm', value: PaymentLogSearchParams): void
    (e: 'search', form: PaymentLogSearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const keyword = ref('')

  function syncFromProps() {
    keyword.value = props.searchForm.keyword || ''
  }

  watch(() => props.searchForm, syncFromProps, { deep: true, immediate: true })

  function buildForm(): PaymentLogSearchParams {
    return {
      keyword: keyword.value.trim() || undefined
    }
  }

  function emitSearch() {
    const form = buildForm()
    emit('update:searchForm', form)
    emit('search', form)
  }

  function handleReset() {
    emit('reset')
  }
</script>

<style scoped lang="scss">
  .pay-search-panel {
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .pay-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
  }

  .pay-toolbar-search {
    flex: 1;
    min-width: 220px;
    max-width: 360px;
  }

  .pay-toolbar-search-icon {
    font-size: 14px;
    color: #9ca3af;
  }
</style>
