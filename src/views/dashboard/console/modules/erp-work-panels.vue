<template>
  <ElRow :gutter="16">
    <!-- 待办事项 -->
    <ElCol :xs="24" :lg="12">
      <div class="erp-card" style="margin-bottom: 16px">
        <div class="erp-card-header">
          <span class="erp-card-title">待办事项</span>
          <span class="erp-card-extra">
            <ArtCountTo :target="totalTodos" :duration="1500" class="erp-inline-count" /> 项待处理
          </span>
        </div>
        <div class="erp-todos">
          <div v-for="todo in todos" :key="todo.label" class="erp-todo-item">
            <div class="erp-todo-icon" :style="{ background: todo.bg, color: todo.color }">
              <ArtSvgIcon icon="ri:notification-3-line" class="text-sm" />
            </div>
            <span class="erp-todo-label">{{ todo.label }}</span>
            <span class="erp-todo-count" :style="{ color: todo.color }">
              <ArtCountTo :target="todo.count" :duration="1200" />
            </span>
          </div>
        </div>
      </div>
    </ElCol>

    <!-- 业务员排行 -->
    <ElCol :xs="24" :lg="12">
      <div class="erp-card" style="margin-bottom: 16px">
        <div class="erp-card-header">
          <span class="erp-card-title">业务员排行</span>
          <span class="erp-card-extra">本月 TOP5</span>
        </div>
        <div class="erp-rank-list">
          <div v-if="!salesmen.length" class="erp-empty-inline">暂无业务员数据</div>
          <div v-for="(s, i) in salesmen" :key="s.name" class="erp-rank-item">
            <span
              class="erp-rank-badge"
              :class="{ top: i < 3 }"
              :style="i < 3 ? { background: rankBg[i], color: rankColor[i] } : {}"
            >
              {{ i + 1 }}
            </span>
            <span class="erp-rank-avatar">{{ s.avatar }}</span>
            <div class="erp-rank-info">
              <div class="erp-rank-name">{{ s.name }}</div>
              <div class="erp-rank-bar-track">
                <div
                  class="erp-rank-bar erp-bar-fill"
                  :class="{ 'is-active': barReady }"
                  :style="{
                    width: `${(s.vehicles / maxVehicles) * 100}%`,
                    animationDelay: `${0.2 + i * 0.1}s`
                  }"
                />
              </div>
            </div>
            <div class="erp-rank-amount">
              <div class="erp-rank-amount-value">
                <ArtCountTo
                  :target="s.amount / 10000"
                  :duration="1500"
                  :decimals="1"
                  prefix="¥"
                  suffix="万"
                />
              </div>
              <div class="erp-rank-vehicles">
                <ArtCountTo
                  :target="s.vehicles"
                  :duration="1500"
                  suffix="辆"
                  class="erp-inline-count"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  import type { DashboardSalesmanItem, DashboardTodoItem } from '../use-dashboard-data'

  const props = defineProps<{
    todos: DashboardTodoItem[]
    totalTodos: number
    salesmen: DashboardSalesmanItem[]
  }>()

  const barReady = ref(false)

  onMounted(() => {
    requestAnimationFrame(() => {
      barReady.value = true
    })
  })

  const maxVehicles = computed(() => props.salesmen[0]?.vehicles || 1)
  const rankBg = ['#FAAD14', '#BFBFBF', '#CD7F32']
  const rankColor = ['#fff', '#fff', '#fff']
</script>

<style lang="scss" scoped>
  @use '../dashboard';

  .erp-todos {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .erp-todo-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    cursor: pointer;
    border: 1px solid var(--art-card-border);
    border-radius: 10px;
    transition:
      background 0.2s,
      border-color 0.2s;
  }

  .erp-todo-item:hover {
    background: var(--art-gray-50);
    border-color: var(--el-color-primary-light-7);
  }

  .erp-todo-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }

  .erp-todo-label {
    flex: 1;
    font-size: 13px;
    color: var(--art-gray-800);
  }

  .erp-todo-count {
    min-width: 28px;
    font-size: 18px;
    font-weight: 700;
    text-align: right;
  }

  .erp-rank-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .erp-rank-item {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .erp-rank-badge {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    font-size: 12px;
    font-weight: 700;
    color: var(--art-gray-600);
    background: var(--art-gray-100);
    border-radius: 6px;
  }

  .erp-rank-badge.top {
    border-radius: 50%;
  }

  .erp-rank-avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    background: linear-gradient(135deg, #1890ff, #4e8cff);
    border-radius: 50%;
  }

  .erp-rank-info {
    flex: 1;
    min-width: 0;
  }

  .erp-rank-name {
    margin-bottom: 4px;
    font-size: 13px;
    font-weight: 500;
    color: var(--art-gray-900);
  }

  .erp-rank-bar-track {
    height: 4px;
    overflow: hidden;
    background: var(--art-gray-100);
    border-radius: 2px;
  }

  .erp-rank-bar {
    height: 100%;
    background: linear-gradient(90deg, #1890ff, #69b1ff);
    border-radius: 2px;
  }

  .erp-rank-amount {
    flex-shrink: 0;
    text-align: right;
  }

  .erp-rank-amount-value {
    font-size: 13px;
    font-weight: 600;
    color: #52c41a;
  }

  .erp-rank-vehicles {
    margin-top: 2px;
    font-size: 11px;
    color: var(--art-gray-500);
  }

  :deep(.erp-inline-count) {
    font-size: inherit;
    color: inherit;
  }

  .erp-empty-inline {
    padding: 24px 0;
    font-size: 13px;
    color: var(--art-gray-500);
    text-align: center;
  }
</style>
