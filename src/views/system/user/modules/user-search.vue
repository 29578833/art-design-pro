<template>
  <div class="user-search-panel">
    <div class="user-toolbar">
      <ElInput
        v-model="keyword"
        class="user-toolbar-search"
        placeholder="搜索用户名 / 真实姓名 / 手机号"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="user-toolbar-search-icon" />
        </template>
      </ElInput>
      <ElButton text @click="handleReset">重置</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { SystemAdminSearchParams } from '@/types/recycle/system'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: SystemAdminSearchParams
  }

  interface Emits {
    (e: 'update:searchForm', value: SystemAdminSearchParams): void
    (e: 'search', form: SystemAdminSearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const keyword = ref('')

  watch(
    () => props.searchForm,
    (form) => {
      keyword.value = form.name || ''
    },
    { deep: true, immediate: true }
  )

  function emitSearch() {
    const form: SystemAdminSearchParams = {
      name: keyword.value.trim() || undefined
    }
    emit('update:searchForm', form)
    emit('search', form)
  }

  function handleReset() {
    emit('reset')
  }
</script>

<style scoped lang="scss">
  .user-search-panel {
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .user-toolbar {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
  }

  .user-toolbar-search {
    flex: 1;
    max-width: 360px;
  }

  .user-toolbar-search-icon {
    font-size: 14px;
    color: #9ca3af;
  }
</style>
