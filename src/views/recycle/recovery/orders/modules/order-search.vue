<template>
  <div class="order-toolbar">
    <ElInput
      v-model="keyword"
      class="order-toolbar-search"
      :placeholder="searchPlaceholder"
      clearable
      @keyup.enter="emitSearch"
      @clear="emitSearch"
    >
      <template #prefix>
        <ArtSvgIcon icon="ri:search-line" class="order-toolbar-search-icon" />
      </template>
    </ElInput>

    <!-- 全部订单：订单进度 -->
    <template v-if="activeTab === 'all'">
      <div class="order-filter-item">
        <span class="order-filter-label">订单进度</span>
        <ElSelect v-model="localProgress" class="order-toolbar-select" @change="handleFilterChange">
          <ElOption label="全部进度" value="all" />
          <ElOption label="进行中" value="ongoing" />
          <ElOption label="已完成" value="finished" />
        </ElSelect>
      </div>
    </template>

    <!-- 正式回收订单筛选 -->
    <template v-if="activeTab === 'formal_order'">
      <div class="order-filter-item">
        <span class="order-filter-label">订单来源</span>
        <ElSelect
          v-model="localOrderSource"
          class="order-toolbar-select"
          @change="handleFilterChange"
        >
          <ElOption label="全部来源" value="all" />
          <ElOption label="客户申请" value="customer" />
          <ElOption label="员工创建" value="staff" />
        </ElSelect>
      </div>
      <div class="order-filter-item">
        <span class="order-filter-label">订单状态</span>
        <ElSelect
          v-model="localOrderStatus"
          class="order-toolbar-select"
          @change="handleFilterChange"
        >
          <ElOption label="全部状态" value="all" />
          <ElOption label="待审核" value="pending_review" />
          <ElOption label="审核通过" value="approved" />
          <ElOption label="已驳回" value="rejected" />
          <ElOption label="已完成" value="completed" />
        </ElSelect>
      </div>
      <div class="order-filter-item">
        <span class="order-filter-label">回收类型</span>
        <ElSelect
          v-model="localBatchType"
          class="order-toolbar-select"
          @change="handleFilterChange"
        >
          <ElOption label="全部类型" value="all" />
          <ElOption label="单台车回收" value="single" />
          <ElOption label="批量回收" value="batch" />
        </ElSelect>
      </div>
      <div class="order-filter-item">
        <span class="order-filter-label">签名状态</span>
        <ElSelect
          v-model="localSignStatus"
          class="order-toolbar-select"
          @change="handleFilterChange"
        >
          <ElOption label="全部" value="all" />
          <ElOption label="待签名" value="pending_sign" />
          <ElOption label="已签名" value="signed" />
        </ElSelect>
      </div>
    </template>

    <!-- 线索订单筛选 -->
    <template v-if="activeTab === 'lead'">
      <div class="order-filter-item">
        <span class="order-filter-label">跟进状态</span>
        <ElSelect
          v-model="localLeadFollowStatus"
          class="order-toolbar-select"
          @change="handleFilterChange"
        >
          <ElOption label="全部" value="all" />
          <ElOption label="待跟进" value="pending" />
          <ElOption label="线索指派" value="assigned" />
          <ElOption label="已跟进" value="viewed" />
        </ElSelect>
      </div>
      <div class="order-filter-item">
        <span class="order-filter-label">线索类型</span>
        <ElSelect v-model="localLeadType" class="order-toolbar-select" @change="handleFilterChange">
          <ElOption label="全部" value="all" />
          <ElOption label="车辆线索" value="vehicle" />
          <ElOption label="客户线索" value="customer" />
        </ElSelect>
      </div>
    </template>

    <!-- 拖车订单筛选 -->
    <template v-if="activeTab === 'towing'">
      <div class="order-filter-item">
        <span class="order-filter-label">拖车状态</span>
        <ElSelect
          v-model="localTowingStatus"
          class="order-toolbar-select"
          @change="handleFilterChange"
        >
          <ElOption label="全部" value="all" />
          <ElOption label="待派单" value="pending_dispatch" />
          <ElOption label="待拖车" value="pending_towing" />
          <ElOption label="拖车中" value="towing" />
          <ElOption label="已完成" value="completed" />
        </ElSelect>
      </div>
    </template>

    <!-- 待审核订单筛选 -->
    <template v-if="activeTab === 'pending_review'">
      <div class="order-filter-item">
        <span class="order-filter-label">订单来源</span>
        <ElSelect
          v-model="localOrderSource"
          class="order-toolbar-select"
          @change="handleFilterChange"
        >
          <ElOption label="全部来源" value="all" />
          <ElOption label="客户申请" value="customer" />
          <ElOption label="员工创建" value="staff" />
        </ElSelect>
      </div>
      <div class="order-filter-item">
        <span class="order-filter-label">订单状态</span>
        <span class="order-status-locked">待审核</span>
      </div>
      <div class="order-filter-item">
        <span class="order-filter-label">回收类型</span>
        <ElSelect
          v-model="localBatchType"
          class="order-toolbar-select"
          @change="handleFilterChange"
        >
          <ElOption label="全部类型" value="all" />
          <ElOption label="单台车回收" value="single" />
          <ElOption label="批量回收" value="batch" />
        </ElSelect>
      </div>
      <div class="order-filter-item">
        <span class="order-filter-label">签名状态</span>
        <ElSelect
          v-model="localSignStatus"
          class="order-toolbar-select"
          @change="handleFilterChange"
        >
          <ElOption label="全部" value="all" />
          <ElOption label="待签名" value="pending_sign" />
          <ElOption label="已签名" value="signed" />
        </ElSelect>
      </div>
    </template>

    <ElButton class="order-toolbar-reset" text @click="handleReset">重置</ElButton>
  </div>
</template>

<script setup lang="ts">
  import type { OrderSearchParams, OrderTab } from '@/types/recycle/order'

  interface Props {
    modelValue: OrderSearchParams
    activeTab: OrderTab
  }

  interface Emits {
    (e: 'update:modelValue', value: OrderSearchParams): void
    (e: 'search'): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const keyword = ref(props.modelValue.keyword || '')
  const localProgress = ref(props.modelValue.progress || 'all')
  const localOrderSource = ref(props.modelValue.orderSource || 'all')
  const localOrderStatus = ref(props.modelValue.orderStatus || 'all')
  const localBatchType = ref(props.modelValue.batchType || 'all')
  const localSignStatus = ref(props.modelValue.signStatus || 'all')
  const localLeadFollowStatus = ref(props.modelValue.leadFollowStatus || 'all')
  const localLeadType = ref(props.modelValue.leadType || 'all')
  const localTowingStatus = ref(props.modelValue.towingStatus || 'all')

  // 父级重置/切换 tab 时同步本地筛选项
  watch(
    () => props.modelValue,
    (val) => {
      keyword.value = val.keyword || ''
      localProgress.value = val.progress || 'all'
      localOrderSource.value = val.orderSource || 'all'
      localOrderStatus.value = val.orderStatus || 'all'
      localBatchType.value = val.batchType || 'all'
      localSignStatus.value = val.signStatus || 'all'
      localLeadFollowStatus.value = val.leadFollowStatus || 'all'
      localLeadType.value = val.leadType || 'all'
      localTowingStatus.value = val.towingStatus || 'all'
    },
    { deep: true }
  )

  const searchPlaceholder = computed(() =>
    props.activeTab === 'lead' ? '搜索线索编号 / 客户手机号' : '搜索订单编号 / 车牌号 / 客户手机号'
  )

  function syncForm() {
    emit('update:modelValue', {
      ...props.modelValue,
      keyword: keyword.value || undefined,
      progress: localProgress.value,
      orderSource: localOrderSource.value,
      orderStatus: localOrderStatus.value,
      batchType: localBatchType.value,
      signStatus: localSignStatus.value,
      leadFollowStatus: localLeadFollowStatus.value,
      leadType: localLeadType.value,
      towingStatus: localTowingStatus.value
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

  function handleReset() {
    emit('reset')
  }
</script>

<style scoped lang="scss">
  .order-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 16px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .order-toolbar-search {
    flex: 1;
    min-width: 260px;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--art-card-border) inset;
    }
  }

  .order-toolbar-search-icon {
    font-size: 16px;
    color: var(--art-gray-400);
  }

  .order-filter-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .order-filter-label {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--art-gray-600);
    white-space: nowrap;
  }

  .order-toolbar-select {
    width: 130px;
  }

  .order-status-locked {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding: 0 12px;
    font-size: 12px;
    font-weight: 500;
    line-height: 30px;
    color: #1677ff;
    background: #e6f4ff;
    border: 1px solid #91caff;
    border-radius: 6px;
  }

  .order-toolbar-reset {
    flex-shrink: 0;
    margin-left: auto;
    color: var(--art-gray-500);

    &:hover {
      color: var(--art-gray-700);
    }
  }
</style>
