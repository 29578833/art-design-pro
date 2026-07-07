<template>
  <div class="partner-toolbar">
    <ElInput
      v-model="keyword"
      class="partner-toolbar-search"
      placeholder="搜索客户姓名 / 手机号 / 企业名称 / 客户编号"
      clearable
      @keyup.enter="emitSearch"
      @clear="emitSearch"
    >
      <template #prefix>
        <ArtSvgIcon icon="ri:search-line" class="partner-toolbar-search-icon" />
      </template>
    </ElInput>

    <ElSelect
      v-model="localGroupId"
      class="partner-toolbar-select"
      placeholder="全部类型"
      @change="handleFilterChange"
    >
      <ElOption label="全部类型" value="all" />
      <ElOption
        v-for="group in groupOptions"
        :key="group.id"
        :label="group.groupName"
        :value="group.id"
      />
    </ElSelect>

    <ElSelect
      v-model="localLevelId"
      class="partner-toolbar-select"
      placeholder="全部分级"
      @change="handleLevelChange"
    >
      <ElOption label="全部分级" value="all" />
      <ElOption
        v-for="level in levelOptions"
        :key="level.id"
        :label="level.name"
        :value="level.id"
      />
    </ElSelect>

    <ElButton class="partner-toolbar-reset" text @click="handleReset">重置</ElButton>
  </div>
</template>

<script setup lang="ts">
  import type {
    PartnerSearchParams,
    UserGroupOption,
    UserLevelOption
  } from '@/types/recycle/customer'

  interface Props {
    modelValue: PartnerSearchParams
    activeLevelId?: number | 'all'
    levelOptions?: UserLevelOption[]
    groupOptions?: UserGroupOption[]
  }

  interface Emits {
    (e: 'update:modelValue', value: PartnerSearchParams): void
    (e: 'update:activeLevelId', value: number | 'all'): void
    (e: 'search'): void
    (e: 'reset'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    activeLevelId: 'all',
    levelOptions: () => [],
    groupOptions: () => []
  })

  const emit = defineEmits<Emits>()

  const keyword = ref(props.modelValue.keyword || '')
  const localGroupId = ref<number | 'all'>(props.modelValue.groupId || 'all')
  const localLevelId = ref<number | 'all'>(props.activeLevelId)

  watch(
    () => props.activeLevelId,
    (val) => {
      localLevelId.value = val
    }
  )

  function syncForm() {
    emit('update:modelValue', {
      ...props.modelValue,
      keyword: keyword.value || undefined,
      groupId: localGroupId.value,
      levelId: localLevelId.value
    })
  }

  function emitSearch() {
    syncForm()
    emit('search')
  }

  function handleFilterChange() {
    syncForm()
    emit('search')
  }

  function handleLevelChange(val: number | 'all') {
    emit('update:activeLevelId', val)
    syncForm()
    emit('search')
  }

  function handleReset() {
    keyword.value = ''
    localGroupId.value = 'all'
    localLevelId.value = 'all'
    emit('update:activeLevelId', 'all')
    emit('reset')
  }
</script>

<style scoped lang="scss">
  .partner-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 16px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .partner-toolbar-search {
    flex: 1;
    min-width: 240px;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--art-card-border) inset;
    }
  }

  .partner-toolbar-search-icon {
    font-size: 16px;
    color: var(--art-gray-400);
  }

  .partner-toolbar-select {
    width: 140px;
  }

  .partner-toolbar-reset {
    flex-shrink: 0;
    color: var(--art-gray-500);

    &:hover {
      color: var(--art-gray-700);
    }
  }
</style>
