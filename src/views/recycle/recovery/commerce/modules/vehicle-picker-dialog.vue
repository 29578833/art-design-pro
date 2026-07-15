<template>
  <ElDialog
    v-model="dialogVisible"
    title="选择关联车辆档案"
    width="760px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <div class="commerce-picker-toolbar">
      <ElInput
        v-model="keyword"
        clearable
        placeholder="搜索订单号、档案号、车牌号、VIN 或车主"
        @keyup.enter="loadVehicles(1)"
        @clear="loadVehicles(1)"
      >
        <template #prefix><ArtSvgIcon icon="ri:search-line" /></template>
      </ElInput>
      <ElButton type="primary" @click="loadVehicles(1)">搜索</ElButton>
    </div>

    <ElTable
      v-loading="loading"
      :data="vehicles"
      height="390"
      highlight-current-row
      empty-text="暂无可关联车辆档案"
      @current-change="selected = $event"
      @row-dblclick="handleRowConfirm"
    >
      <ElTableColumn width="48" align="center">
        <template #default="{ row }">
          <ElRadio :model-value="selected?.id" :value="row.id" @change="selected = row">
            <span />
          </ElRadio>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="order_no" label="回收订单" min-width="145">
        <template #default="{ row }">{{ row.order_no || '—' }}</template>
      </ElTableColumn>
      <ElTableColumn label="车辆档案" min-width="135">
        <template #default="{ row }">{{
          row.vehicle_no || row.archive_no || `#${row.id}`
        }}</template>
      </ElTableColumn>
      <ElTableColumn prop="plate_no" label="车牌号" min-width="105">
        <template #default="{ row }">{{ row.plate_no || '—' }}</template>
      </ElTableColumn>
      <ElTableColumn prop="vin" label="VIN" min-width="175">
        <template #default="{ row }">
          <span class="commerce-picker-vin">{{ row.vin || '—' }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="owner_name" label="车主" min-width="110">
        <template #default="{ row }">{{ row.owner_name || row.owner_display || '—' }}</template>
      </ElTableColumn>
    </ElTable>

    <div class="commerce-picker-pagination">
      <ElPagination
        v-model:current-page="page"
        :page-size="pageSize"
        layout="total, prev, pager, next"
        :total="total"
        @current-change="loadVehicles"
      />
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :disabled="!selected" @click="confirmSelection">
        关联并登记
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchVehicleList } from '@/api/recycle/vehicle'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { ScrapVehicle } from '@/types/recycle/vehicle'

  const props = defineProps<{ visible: boolean }>()
  const emit = defineEmits<{
    'update:visible': [boolean]
    confirm: [ScrapVehicle]
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const keyword = ref('')
  const loading = ref(false)
  const vehicles = ref<ScrapVehicle[]>([])
  const selected = ref<ScrapVehicle | null>(null)
  const page = ref(1)
  const pageSize = 10
  const total = ref(0)

  async function loadVehicles(nextPage = page.value) {
    page.value = nextPage
    loading.value = true
    try {
      const res = await fetchVehicleList({
        keyword: keyword.value,
        tab: 'all',
        current: page.value,
        size: pageSize
      })
      vehicles.value = res.records
      total.value = res.total
      selected.value = null
    } finally {
      loading.value = false
    }
  }

  function handleOpen() {
    keyword.value = ''
    page.value = 1
    selected.value = null
    loadVehicles(1)
  }

  function confirmSelection() {
    if (!selected.value) return
    emit('confirm', selected.value)
    dialogVisible.value = false
  }

  function handleRowConfirm(row: ScrapVehicle) {
    selected.value = row
    confirmSelection()
  }
</script>

<style scoped lang="scss">
  .commerce-picker-toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    margin-bottom: 14px;
  }

  .commerce-picker-vin {
    font-family: Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
  }

  .commerce-picker-pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
  }
</style>
