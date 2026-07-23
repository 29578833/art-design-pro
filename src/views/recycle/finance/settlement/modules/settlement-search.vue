<template>
  <div class="fs-settlement-search">
    <ElSelect
      v-if="showStatusQuick"
      v-model="localForm.status_quick"
      class="fs-search-item"
      placeholder="全部结算单"
      style="width: 130px"
    >
      <ElOption label="全部结算单" value="all" />
      <ElOption label="待审核" value="待审核" />
      <ElOption label="审核通过" value="审核通过" />
      <ElOption label="审核不通过" value="审核不通过" />
      <ElOption label="待付款" value="待付款" />
    </ElSelect>
    <ElInput
      v-model="localForm.salesman"
      class="fs-search-item"
      placeholder="业务员/签约人"
      clearable
      style="width: 140px"
    />
    <ElInput
      v-model="localForm.order_keyword"
      class="fs-search-item"
      placeholder="订单/合同编号"
      clearable
      style="width: 140px"
    />
    <ElInput
      v-model="localForm.applicant"
      class="fs-search-item"
      placeholder="申请人"
      clearable
      style="width: 120px"
    />
    <ElDatePicker
      v-model="dateRange"
      type="daterange"
      value-format="YYYY-MM-DD"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      :unlink-panels="true"
      style="width: 240px"
    />
    <ElSelect
      v-model="localForm.settlement_type"
      class="fs-search-item"
      placeholder="结算单类型"
      clearable
      style="width: 140px"
    >
      <ElOption label="服务费结算单" value="服务费结算单" />
      <ElOption label="残值结算单" value="残值结算单" />
    </ElSelect>
    <ElButton type="primary" @click="emitSearch">查询</ElButton>
    <ElButton @click="emitReset">重置</ElButton>
    <div class="fs-search-actions">
      <ElButton :loading="exporting" @click="$emit('export')">
        <ArtSvgIcon icon="ri:download-line" class="mr-1" />
        导出Excel
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { SettlementBillSearchParams } from '@/types/recycle/finance-settlement'
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

  const localForm = reactive({ ...props.searchForm })
  const dateRange = ref<[string, string] | null>(
    props.searchForm.apply_start && props.searchForm.apply_end
      ? [props.searchForm.apply_start, props.searchForm.apply_end]
      : null
  )

  watch(
    () => props.searchForm,
    (val) => {
      Object.assign(localForm, val)
      dateRange.value = val.apply_start && val.apply_end ? [val.apply_start, val.apply_end] : null
    },
    { deep: true }
  )

  function buildPayload(): SettlementBillSearchParams {
    return {
      ...localForm,
      apply_start: dateRange.value?.[0] || '',
      apply_end: dateRange.value?.[1] || ''
    }
  }

  function emitSearch() {
    emit('search', buildPayload())
  }

  function emitReset() {
    dateRange.value = null
    Object.assign(localForm, {
      status_quick: 'all',
      salesman: '',
      order_keyword: '',
      applicant: '',
      settlement_type: '',
      apply_start: '',
      apply_end: ''
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
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .fs-search-actions {
    margin-left: auto;
  }
</style>
