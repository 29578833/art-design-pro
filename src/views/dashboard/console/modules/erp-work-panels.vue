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
  const barReady = ref(false)

  onMounted(() => {
    requestAnimationFrame(() => {
      barReady.value = true
    })
  })

  const todos = [
    { label: '待审核订单', count: 7, color: '#1890FF', bg: '#E6F7FF' },
    { label: '待派单拖车', count: 4, color: '#FA8C16', bg: '#FFF7E6' },
    { label: '待质检车辆', count: 9, color: '#722ED1', bg: '#F9F0FF' },
    { label: '待结算', count: 18, color: '#52C41A', bg: '#F6FFED' },
    { label: '商务部待受理', count: 5, color: '#13C2C2', bg: '#E6FFFB' }
  ]

  const totalTodos = todos.reduce((sum, t) => sum + t.count, 0)

  const salesmen = [
    { name: '张伟', vehicles: 32, amount: 96000, avatar: '张' },
    { name: '李明', vehicles: 28, amount: 84000, avatar: '李' },
    { name: '王芳', vehicles: 24, amount: 72000, avatar: '王' },
    { name: '陈刚', vehicles: 19, amount: 57000, avatar: '陈' },
    { name: '赵丽', vehicles: 15, amount: 45000, avatar: '赵' }
  ]

  const maxVehicles = salesmen[0].vehicles
  const rankBg = ['#FAAD14', '#BFBFBF', '#CD7F32']
  const rankColor = ['#fff', '#fff', '#fff']
</script>

<style scoped>
  @import '../dashboard';

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
</style>
