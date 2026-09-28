<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="520px"
    align-center
    destroy-on-close
    append-to-body
    @open="handleOpen"
    @closed="handleClosed"
  >
    <div class="picker-body">
      <ElInput
        v-model="keyword"
        clearable
        placeholder="搜索员工姓名、手机号或账号"
        @input="handleSearchInput"
      />

      <div class="picker-toolbar">
        <ElCheckbox
          :model-value="isPageAllChecked"
          :indeterminate="isPageIndeterminate"
          @change="(value: CheckboxValueType) => togglePageAll(!!value)"
        >
          全选本页（{{ total }} 人）
        </ElCheckbox>
        <span>已选 {{ pickedIds.length }} 人</span>
      </div>

      <div v-loading="loading" class="picker-list">
        <div
          v-for="employee in list"
          :key="employee.id"
          class="picker-item"
          @click="toggleOne(employee.id)"
        >
          <ElCheckbox
            :model-value="pickedIds.includes(employee.id)"
            @click.stop
            @change="toggleOne(employee.id)"
          />
          <div class="picker-avatar">{{ employee.initial || getInitial(employee.real_name) }}</div>
          <div class="picker-info">
            <div class="picker-name">
              {{ employee.real_name || employee.account || `员工${employee.id}` }}
            </div>
            <div class="picker-meta">
              {{ employee.role_names || '未分配角色' }}
              <span v-if="employee.phone"> · {{ employee.phone }}</span>
            </div>
          </div>
        </div>

        <div v-if="!loading && !list.length" class="picker-empty">未找到匹配的员工</div>
      </div>
    </div>

    <template #footer>
      <div class="picker-footer">
        <span>共 {{ total }} 名员工，已选 {{ pickedIds.length }} 人</span>
        <div>
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="handleConfirm">
            确认（{{ pickedIds.length }} 人）
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { CheckboxValueType } from 'element-plus'
  import { fetchSelectableEmployees } from '@/api/recycle/system-role'
  import type { SystemEmployeeOption } from '@/types/recycle/system/system'

  const props = defineProps<{
    visible: boolean
    modelValue: number[]
    title?: string
  }>()

  const emit = defineEmits<{
    'update:visible': [value: boolean]
    'update:modelValue': [value: number[]]
    confirm: [value: number[]]
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const keyword = ref('')
  const list = ref<SystemEmployeeOption[]>([])
  const total = ref(0)
  const loading = ref(false)
  const pickedIds = ref<number[]>([])
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  const pageIds = computed(() => list.value.map((employee) => employee.id))
  const isPageAllChecked = computed(
    () => pageIds.value.length > 0 && pageIds.value.every((id) => pickedIds.value.includes(id))
  )
  const isPageIndeterminate = computed(() => {
    if (isPageAllChecked.value) return false
    return pageIds.value.some((id) => pickedIds.value.includes(id))
  })

  watch(
    () => props.modelValue,
    (value) => {
      if (!props.visible) return
      pickedIds.value = Array.isArray(value) ? [...value] : []
    },
    { deep: true }
  )

  function handleOpen() {
    pickedIds.value = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    keyword.value = ''
    loadList()
  }

  function handleClosed() {
    if (searchTimer) {
      clearTimeout(searchTimer)
      searchTimer = null
    }
  }

  function handleSearchInput() {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => loadList(), 300)
  }

  async function loadList() {
    loading.value = true
    try {
      const res = await fetchSelectableEmployees({
        keyword: keyword.value.trim(),
        page: 1,
        limit: 200
      })
      list.value = res.list
      total.value = res.count
    } catch {
      list.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  function toggleOne(id: number) {
    const index = pickedIds.value.indexOf(id)
    if (index >= 0) {
      pickedIds.value.splice(index, 1)
    } else {
      pickedIds.value.push(id)
    }
  }

  function togglePageAll(checked: boolean) {
    if (checked) {
      const selected = new Set(pickedIds.value)
      pageIds.value.forEach((id) => selected.add(id))
      pickedIds.value = [...selected]
      return
    }

    const pageIdSet = new Set(pageIds.value)
    pickedIds.value = pickedIds.value.filter((id) => !pageIdSet.has(id))
  }

  function handleConfirm() {
    const ids = [...new Set(pickedIds.value)]
    emit('update:modelValue', ids)
    emit('confirm', ids)
    dialogVisible.value = false
  }

  function getInitial(name?: string) {
    return (name || '?').slice(0, 1)
  }
</script>

<style scoped lang="scss">
  .picker-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .picker-toolbar {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    font-size: 12px;
    color: #7a8ca6;
    border-bottom: 1px solid #edf2f7;
  }

  .picker-list {
    min-height: 220px;
    max-height: 46vh;
    overflow-y: auto;
    border: 1px solid #edf2f7;
    border-radius: 8px;
  }

  .picker-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 14px;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
    transition: background 0.15s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: #f8fbff;
    }
  }

  .picker-avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    font-size: 13px;
    color: #fff;
    background: #1d84ff;
    border-radius: 50%;
  }

  .picker-info {
    min-width: 0;
  }

  .picker-name {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
  }

  .picker-meta {
    margin-top: 2px;
    overflow: hidden;
    font-size: 12px;
    color: #7a8ca6;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .picker-empty {
    padding: 60px 0;
    font-size: 13px;
    color: #9ca3af;
    text-align: center;
  }

  .picker-footer {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: #7a8ca6;
  }
</style>
