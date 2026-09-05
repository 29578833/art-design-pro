<template>
  <div class="fs-settlement-search">
    <ElSelect
      v-if="showStatusQuick"
      v-model="localForm.settlement_status"
      class="fs-search-item"
      placeholder="全部结算单"
      style="width: 130px"
      @change="emitSearch"
    >
      <ElOption label="全部结算单" value="" />
      <ElOption label="待审核" :value="1" />
      <ElOption label="审核通过" :value="2" />
      <ElOption label="待付款" :value="3" />
      <ElOption label="已付款" :value="4" />
      <ElOption label="审核不通过" :value="5" />
    </ElSelect>
    <ElInput
      v-model="localForm.keyword"
      class="fs-search-item"
      placeholder="订单/合同编号"
      clearable
      style="width: 140px"
      @input="debouncedEmitSearch"
    />
    <ElInput
      v-model="localForm.applicant"
      class="fs-search-item"
      placeholder="申请人"
      clearable
      style="width: 140px"
      @input="debouncedEmitSearch"
    />
    <ElDatePicker
      v-model="dateRange"
      type="daterange"
      value-format="YYYY-MM-DD"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      :unlink-panels="true"
      style="width: 180px; max-width: 400px"
      @change="emitSearch"
    />
    <ElSelect
      v-model="localForm.settlement_type"
      class="fs-search-item"
      placeholder="结算单类型"
      clearable
      style="width: 140px"
      @change="emitSearch"
    >
      <ElOption label="服务费结算单" value="service_fee" />
      <ElOption label="残值结算单" value="residual" />
    </ElSelect>
    <ElButton class="fs-search-reset" text @click="emitReset">重置</ElButton>
    <div class="fs-search-actions">
      <ElButton :loading="exporting" @click="$emit('export')">
        <ArtSvgIcon icon="ri:download-line" class="mr-1" />
        导出Excel
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { SettlementBillSearchParams } from '@/types/recycle/finance/settlement/finance-settlement'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  const props = defineProps<{
    searchForm: SettlementBillSearchParams
    showStatusQuick?: boolean
    exporting?: boolean
  }>()

  const emit = defineEmits<{
    search: [SettlementBillSearchParams]
    reset: []
    export: []
  }>()

  /** 本地筛选表单（与父级 searchForm 双向同步） */
  const localForm = reactive({ ...props.searchForm })
  const dateRange = ref<[string, string] | null>(
    props.searchForm.start_time && props.searchForm.end_time
      ? [props.searchForm.start_time, props.searchForm.end_time]
      : null
  )
  watch(
    () => props.searchForm,
    (val) => {
      Object.assign(localForm, val)
      dateRange.value = val.start_time && val.end_time ? [val.start_time, val.end_time] : null
    },
    { deep: true }
  )

  /** 组装查询参数 */
  function buildPayload(): SettlementBillSearchParams {
    return {
      ...localForm,
      start_time: dateRange.value?.[0] || '',
      end_time: dateRange.value?.[1] || ''
    }
  }
  function emitSearch() {
    emit('search', buildPayload())
  }
  const debouncedEmitSearch = useDebounceFn(emitSearch, 300)
  function emitReset() {
    dateRange.value = null
    Object.assign(localForm, {
      settlement_status: '',
      keyword: '',
      applicant: '',
      settlement_type: '',
      start_time: '',
      end_time: ''
    })
    emit('reset')
  }
</script>

<style scoped lang="scss">
  .fs-settlement-search {
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 12px 16px;
    border-top: 1px solid #f3f4f6;
  }

  .fs-search-actions {
    margin-left: auto;
  }

  .fs-search-reset {
    flex-shrink: 0;
    color: var(--art-gray-500);

    &:hover {
      color: var(--art-gray-700);
    }
  }
</style>
