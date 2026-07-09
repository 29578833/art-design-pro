<template>
  <ElDialog
    v-model="dialogVisible"
    width="480px"
    align-center
    destroy-on-close
    class="lead-assign-dialog"
    @open="handleOpen"
    @closed="handleClosed"
  >
    <template #header>
      <div class="lad-header">
        <div class="lad-header-left">
          <ArtSvgIcon icon="ri:user-shared-line" class="lad-header-icon" />
          <span class="lad-title">指派跟进人</span>
        </div>
      </div>
    </template>

    <!-- 搜索框 -->
    <div class="lad-search">
      <ElInput
        v-model="searchText"
        placeholder="搜索姓名 / 手机号"
        clearable
        @input="handleSearchInput"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" />
        </template>
      </ElInput>
    </div>

    <!-- 人员列表 -->
    <div v-loading="personsLoading" class="lad-list">
      <div v-if="!filteredPersons.length && !personsLoading" class="lad-empty">
        <ArtSvgIcon icon="ri:group-line" class="lad-empty-icon" />
        <p>未找到匹配员工</p>
      </div>
      <button
        v-for="person in filteredPersons"
        :key="person.uid"
        type="button"
        class="lad-person-item"
        :class="{ selected: selectedUid === person.uid }"
        @click="toggleSelect(person)"
      >
        <div class="lad-avatar">{{ getInitial(person) }}</div>
        <div class="lad-person-info">
          <div class="lad-person-name">{{ person.real_name || person.nickname || '—' }}</div>
          <div class="lad-person-phone">{{ person.phone || '—' }}</div>
        </div>
        <div class="lad-check-circle" :class="{ checked: selectedUid === person.uid }">
          <ArtSvgIcon
            v-if="selectedUid === person.uid"
            icon="ri:check-line"
            class="lad-check-icon"
          />
        </div>
      </button>
    </div>

    <template #footer>
      <div class="lad-footer">
        <ElButton :loading="submitting" @click="handleDirectMark"> 直接标记已跟进 </ElButton>
        <div class="lad-footer-right">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton
            type="primary"
            :disabled="!selectedUid"
            :loading="submitting"
            @click="handleConfirm"
          >
            {{
              selectedPerson
                ? `确认指派给 ${selectedPerson.real_name || selectedPerson.nickname}`
                : '请选择跟进人'
            }}
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import {
    fetchAssignLeadFollow,
    fetchLeadFollowPersons,
    fetchMarkLeadFollow
  } from '@/api/recycle/order'
  import type { LeadFollowPerson } from '@/types/recycle/order'

  interface Props {
    visible: boolean
    /** 要操作的线索订单 ID */
    orderId: number | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', v: boolean): void
    /** 指派/标记完成后通知父组件刷新 */
    (e: 'success'): void
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  // ========== 人员列表 ==========
  const searchText = ref('')
  const persons = ref<LeadFollowPerson[]>([])
  const personsLoading = ref(false)
  const selectedUid = ref<number | null>(null)

  const selectedPerson = computed(
    () => persons.value.find((p) => p.uid === selectedUid.value) ?? null
  )

  const filteredPersons = computed(() => {
    const kw = searchText.value.trim().toLowerCase()
    if (!kw) return persons.value
    return persons.value.filter(
      (p) =>
        (p.real_name || '').toLowerCase().includes(kw) ||
        (p.nickname || '').toLowerCase().includes(kw) ||
        (p.phone || '').includes(kw)
    )
  })

  function getInitial(p: LeadFollowPerson) {
    const name = p.real_name || p.nickname || '?'
    return name[0]
  }

  function toggleSelect(p: LeadFollowPerson) {
    selectedUid.value = selectedUid.value === p.uid ? null : p.uid
  }

  let searchTimer: ReturnType<typeof setTimeout> | null = null
  function handleSearchInput() {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(loadPersons, 300)
  }

  async function loadPersons() {
    personsLoading.value = true
    try {
      persons.value = await fetchLeadFollowPersons(searchText.value.trim())
    } finally {
      personsLoading.value = false
    }
  }

  // ========== 操作 ==========
  const submitting = ref(false)

  async function handleConfirm() {
    if (!selectedUid.value || !props.orderId) return
    submitting.value = true
    try {
      await fetchAssignLeadFollow({ id: props.orderId, followUid: selectedUid.value })
      dialogVisible.value = false
      emit('success')
    } finally {
      submitting.value = false
    }
  }

  async function handleDirectMark() {
    if (!props.orderId) return
    submitting.value = true
    try {
      await fetchMarkLeadFollow(props.orderId)
      dialogVisible.value = false
      emit('success')
    } finally {
      submitting.value = false
    }
  }

  // ========== 生命周期 ==========
  function handleOpen() {
    loadPersons()
  }

  function handleClosed() {
    searchText.value = ''
    selectedUid.value = null
    persons.value = []
  }
</script>

<style lang="scss">
  .lead-assign-dialog {
    .el-dialog__body {
      padding: 0;
    }
  }
</style>

<style scoped lang="scss">
  /* ===== Header ===== */
  .lad-header {
    display: flex;
    align-items: center;
  }

  .lad-header-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .lad-header-icon {
    font-size: 16px;
    color: #1677ff;
  }

  .lad-title {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
  }

  /* ===== 搜索 ===== */
  .lad-search {
    padding: 14px 20px 10px;
    border-bottom: 1px solid #f0f0f0;
  }

  /* ===== 列表 ===== */
  .lad-list {
    min-height: 200px;
    max-height: 360px;
    padding: 10px 12px;
    overflow-y: auto;
  }

  .lad-empty {
    padding: 40px 0;
    font-size: 13px;
    color: #bfbfbf;
    text-align: center;

    p {
      margin-top: 8px;
    }
  }

  .lad-empty-icon {
    font-size: 32px;
  }

  .lad-person-item {
    display: flex;
    gap: 12px;
    align-items: center;
    width: 100%;
    padding: 10px 12px;
    margin-bottom: 6px;
    text-align: left;
    cursor: pointer;
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    transition: all 0.15s;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background: #f5f5f5;
    }

    &.selected {
      background: #e6f4ff;
      border-color: #1677ff;
    }
  }

  .lad-avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #4096ff 0%, #1677ff 100%);
    border-radius: 50%;
  }

  .lad-person-info {
    flex: 1;
    min-width: 0;
  }

  .lad-person-name {
    font-size: 13px;
    font-weight: 600;
    color: #262626;
  }

  .lad-person-phone {
    margin-top: 2px;
    font-size: 12px;
    color: #8c8c8c;
  }

  .lad-check-circle {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: 2px solid #d9d9d9;
    border-radius: 50%;
    transition: all 0.15s;

    &.checked {
      background: #1677ff;
      border-color: #1677ff;
    }
  }

  .lad-check-icon {
    font-size: 12px;
    color: #fff;
  }

  /* ===== Footer ===== */
  .lad-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .lad-footer-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }
</style>
