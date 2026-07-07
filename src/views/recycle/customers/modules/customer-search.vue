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
      v-model="localCategory"
      class="partner-toolbar-select"
      placeholder="全部分类"
      @change="handleFilterChange"
    >
      <ElOption label="全部分类" value="all" />
      <ElOption label="客户" value="customer" />
      <ElOption label="供应商" value="supplier" />
    </ElSelect>

    <ElSelect
      v-model="localType"
      class="partner-toolbar-select"
      placeholder="全部类型"
      @change="handleFilterChange"
    >
      <ElOption label="全部类型" value="all" />
      <ElOption label="个人客户" value="individual" />
      <ElOption label="企业客户" value="enterprise" />
    </ElSelect>

    <ElSelect
      v-model="localGrade"
      class="partner-toolbar-select"
      placeholder="全部分级"
      @change="handleGradeChange"
    >
      <ElOption label="全部分级" value="all" />
      <ElOption v-for="(cfg, key) in GRADE_CONFIG" :key="key" :label="cfg.label" :value="key" />
    </ElSelect>

    <ElButton class="partner-toolbar-reset" text @click="handleReset">重置</ElButton>
  </div>
</template>

<script setup lang="ts">
  import type { CustomerGrade, PartnerSearchParams } from '@/types/recycle/customer'
  import { GRADE_CONFIG } from '@/types/recycle/customer'

  interface Props {
    modelValue: PartnerSearchParams
    activeGrade?: CustomerGrade | 'all'
  }

  interface Emits {
    (e: 'update:modelValue', value: PartnerSearchParams): void
    (e: 'update:activeGrade', value: CustomerGrade | 'all'): void
    (e: 'search'): void
    (e: 'reset'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    activeGrade: 'all'
  })

  const emit = defineEmits<Emits>()

  const keyword = ref(props.modelValue.keyword || '')
  const localCategory = ref(props.modelValue.category || 'all')
  const localType = ref(props.modelValue.type || 'all')
  const localGrade = ref<CustomerGrade | 'all'>(props.activeGrade)

  watch(
    () => props.activeGrade,
    (val) => {
      localGrade.value = val
    }
  )

  function syncForm() {
    emit('update:modelValue', {
      ...props.modelValue,
      keyword: keyword.value || undefined,
      category: localCategory.value,
      type: localType.value,
      grade: localGrade.value
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

  function handleGradeChange(val: CustomerGrade | 'all') {
    emit('update:activeGrade', val)
    syncForm()
    emit('search')
  }

  function handleReset() {
    keyword.value = ''
    localCategory.value = 'all'
    localType.value = 'all'
    localGrade.value = 'all'
    emit('update:activeGrade', 'all')
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
