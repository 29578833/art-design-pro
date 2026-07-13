<template>
  <div class="log-search-panel">
    <div class="log-toolbar">
      <ElInput
        v-model="keyword"
        class="log-toolbar-search"
        placeholder="搜索操作内容"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="log-toolbar-search-icon" />
        </template>
      </ElInput>
      <ElSelect
        v-model="adminId"
        class="log-toolbar-admin"
        clearable
        filterable
        placeholder="全部操作人"
        @change="emitSearch"
      >
        <ElOption
          v-for="item in adminOptions"
          :key="item.id"
          :label="item.real_name || String(item.id)"
          :value="item.id"
        />
      </ElSelect>
      <ElDatePicker
        v-model="dateRange"
        class="log-toolbar-date"
        type="daterange"
        value-format="YYYY/MM/DD"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :unlink-panels="true"
      />
      <ElButton type="primary" @click="emitSearch">查询</ElButton>
      <ElButton text @click="handleReset">重置</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { fetchSystemLogAdmins } from '@/api/recycle/system-log'
  import type { SystemLogAdminOption, SystemLogSearchParams } from '@/types/recycle/system-log'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: SystemLogSearchParams
  }

  interface Emits {
    (e: 'update:searchForm', value: SystemLogSearchParams): void
    (e: 'search', form: SystemLogSearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const adminOptions = ref<SystemLogAdminOption[]>([])
  const keyword = ref('')
  const adminId = ref<number | undefined>()
  const dateRange = ref<[string, string] | null>(null)

  watch(
    () => props.searchForm,
    (form) => {
      keyword.value = form.keyword || form.pages || form.path || ''
      adminId.value = form.admin_id ? Number(form.admin_id) : undefined
      if (form.data && form.data.includes(' - ')) {
        const [start, end] = form.data.split(' - ')
        dateRange.value = [start.trim(), end.trim()]
      } else {
        dateRange.value = null
      }
    },
    { deep: true, immediate: true }
  )

  function buildForm(): SystemLogSearchParams {
    const kw = keyword.value.trim()
    const data =
      dateRange.value && dateRange.value.length === 2
        ? `${dateRange.value[0]} - ${dateRange.value[1]}`
        : undefined

    return {
      keyword: kw || undefined,
      admin_id: adminId.value,
      pages: kw || undefined,
      path: undefined,
      data
    }
  }

  function emitSearch() {
    const form = buildForm()
    emit('update:searchForm', form)
    emit('search', form)
  }

  function handleReset() {
    keyword.value = ''
    adminId.value = undefined
    dateRange.value = null
    emit('reset')
  }

  onMounted(async () => {
    adminOptions.value = await fetchSystemLogAdmins()
  })
</script>

<style scoped lang="scss">
  .log-search-panel {
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .log-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
  }

  .log-toolbar-search {
    flex: 1;
    min-width: 200px;
  }

  .log-toolbar-search-icon {
    font-size: 14px;
    color: #9ca3af;
  }

  .log-toolbar-admin {
    width: 160px;
  }

  .log-toolbar-date {
    width: 260px;
  }
</style>
