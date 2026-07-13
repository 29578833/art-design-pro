<template>
  <div class="dict-page art-full-height">
    <div class="dict-header">
      <div class="dict-title">数据字典</div>
      <div class="dict-desc">车辆类型 / 结算类型等字典项管理</div>
    </div>

    <div class="dict-layout">
      <!-- 左侧分类 -->
      <div v-loading="catLoading" class="dict-sidebar">
        <div class="dict-sidebar-head">
          <span class="dict-sidebar-title">字典分类</span>
          <ElButton type="primary" link @click="openCatCreate">
            <ArtSvgIcon icon="ri:add-line" />
            新增
          </ElButton>
        </div>
        <div class="dict-sidebar-list">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="dict-cat-item"
            :class="{ 'is-active': selectedId === cat.id }"
            @click="selectCategory(cat)"
          >
            <div class="dict-cat-name">{{ cat.name || '—' }}</div>
            <div class="dict-cat-code">{{ cat.mark || '—' }}</div>
          </div>
          <div v-if="!categories.length" class="dict-empty">暂无分类</div>
        </div>
      </div>

      <!-- 右侧字典项 -->
      <div class="dict-main">
        <div class="dict-main-head">
          <span class="dict-main-title">
            {{ selectedCat?.name || '请选择分类' }}
            <template v-if="selectedCat"> — 字典项</template>
          </span>
          <span v-if="selectedCat?.mark" class="dict-main-code">{{ selectedCat.mark }}</span>
        </div>

        <div v-if="!selectedCat" class="dict-empty">请选择左侧字典分类</div>

        <div v-else v-loading="itemLoading" class="dict-main-body">
          <div class="dict-table-wrap">
            <table class="dict-table">
              <thead>
                <tr>
                  <th>排序</th>
                  <th>显示名称</th>
                  <th>字典值</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in items" :key="row.id">
                  <td class="dict-sort">{{ row.sort ?? 0 }}</td>
                  <td>{{ row.dict_label || '—' }}</td>
                  <td class="dict-value">{{ row.dict_value || '—' }}</td>
                  <td>
                    <button type="button" class="dict-status-btn" @click="toggleStatus(row)">
                      <span
                        class="dict-status-dot"
                        :class="Number(row.status) === 1 ? 'is-on' : 'is-off'"
                      />
                      <span
                        class="dict-status-text"
                        :class="Number(row.status) === 1 ? 'is-on' : 'is-off'"
                      >
                        {{ Number(row.status) === 1 ? '启用' : '禁用' }}
                      </span>
                    </button>
                  </td>
                  <td>
                    <div class="dict-ops">
                      <button type="button" class="dict-op-edit" @click="openItemEdit(row)">
                        编辑
                      </button>
                      <button type="button" class="dict-op-del" @click="handleDelete(row)">
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!items.length">
                  <td colspan="5" class="dict-empty">暂无字典项</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="dict-quick-add">
            <ElInput v-model="quickLabel" placeholder="显示名称" clearable />
            <ElInput v-model="quickValue" placeholder="字典值" clearable />
            <ElButton
              type="primary"
              :loading="adding"
              :disabled="!canQuickAdd"
              @click="handleQuickAdd"
            >
              <ArtSvgIcon icon="ri:add-line" class="mr-1" />
              添加
            </ElButton>
          </div>
        </div>
      </div>
    </div>

    <DictCategoryDialog
      v-model:visible="catDialogVisible"
      :record="catEditing"
      @success="loadCategories"
    />
    <DictItemDialog
      v-model:visible="itemDialogVisible"
      :record="itemEditing"
      @success="loadItems"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElMessageBox } from 'element-plus'
  import {
    fetchDataDictCategoryList,
    fetchDataDictCreate,
    fetchDataDictDelete,
    fetchDataDictList,
    fetchDataDictStatus
  } from '@/api/recycle/data-dict'
  import type { DataDictCategory, DataDictItem } from '@/types/recycle/system'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import DictCategoryDialog from './modules/dict-category-dialog.vue'
  import DictItemDialog from './modules/dict-item-dialog.vue'

  defineOptions({ name: 'SystemDict' })

  const catLoading = ref(false)
  const itemLoading = ref(false)
  const adding = ref(false)
  const categories = ref<DataDictCategory[]>([])
  const selectedId = ref<number | null>(null)
  const selectedCat = ref<DataDictCategory | null>(null)
  const items = ref<DataDictItem[]>([])

  const catDialogVisible = ref(false)
  const catEditing = ref<DataDictCategory | null>(null)
  const itemDialogVisible = ref(false)
  const itemEditing = ref<DataDictItem | null>(null)

  const quickLabel = ref('')
  const quickValue = ref('')

  const canQuickAdd = computed(
    () => !!selectedCat.value?.mark && !!quickLabel.value.trim() && !!quickValue.value.trim()
  )

  function openCatCreate() {
    catEditing.value = null
    catDialogVisible.value = true
  }

  function selectCategory(cat: DataDictCategory) {
    selectedId.value = cat.id
    selectedCat.value = cat
    loadItems()
  }

  function openItemEdit(row: DataDictItem) {
    itemEditing.value = row
    itemDialogVisible.value = true
  }

  async function toggleStatus(row: DataDictItem) {
    const next = Number(row.status) === 1 ? 0 : 1
    await fetchDataDictStatus(row.id, next as 0 | 1)
    await loadItems()
  }

  async function handleDelete(row: DataDictItem) {
    try {
      await ElMessageBox.confirm(`确认删除「${row.dict_label || row.id}」？`, '删除确认', {
        type: 'warning',
        confirmButtonText: '确认删除'
      })
    } catch {
      return
    }
    await fetchDataDictDelete(row.id)
    await loadItems()
  }

  async function handleQuickAdd() {
    if (!selectedCat.value?.mark || !canQuickAdd.value) return
    adding.value = true
    try {
      await fetchDataDictCreate({
        dict_type: selectedCat.value.mark,
        dict_label: quickLabel.value.trim(),
        dict_value: quickValue.value.trim(),
        sort: items.value.length + 1,
        status: 1
      })
      quickLabel.value = ''
      quickValue.value = ''
      await loadItems()
    } finally {
      adding.value = false
    }
  }

  async function loadItems() {
    if (!selectedCat.value?.mark) {
      items.value = []
      return
    }
    itemLoading.value = true
    try {
      const res = await fetchDataDictList({
        dict_type: selectedCat.value.mark,
        page: 1,
        limit: 500
      })
      items.value = [...res.list].sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
    } finally {
      itemLoading.value = false
    }
  }

  async function loadCategories(preferId?: number) {
    catLoading.value = true
    try {
      const res = await fetchDataDictCategoryList()
      categories.value = res.list
      const target =
        (preferId && res.list.find((c) => c.id === preferId)) ||
        (selectedId.value && res.list.find((c) => c.id === selectedId.value)) ||
        res.list[0]
      if (target) {
        selectCategory(target)
      } else {
        selectedId.value = null
        selectedCat.value = null
        items.value = []
      }
    } finally {
      catLoading.value = false
    }
  }

  onMounted(() => {
    loadCategories()
  })
</script>

<style lang="scss">
  @use './dict';

  .mr-1 {
    margin-right: 4px;
  }
</style>
