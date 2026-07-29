<template>
  <div class="erp-card">
    <div class="erp-card-header">
      <span class="erp-card-title">最近操作记录</span>
      <span class="erp-card-extra">今日</span>
    </div>
    <div class="erp-activity-list">
      <div v-if="!activities.length" class="erp-empty-inline">暂无操作记录</div>
      <div v-for="(item, i) in activities" :key="i" class="erp-activity-item">
        <div class="erp-activity-time-col">
          <span class="erp-activity-time">{{ item.time }}</span>
        </div>
        <div class="erp-activity-line">
          <div
            class="erp-activity-dot"
            :style="{ background: item.color, boxShadow: `0 0 0 3px ${item.color}20` }"
          />
          <div v-if="i < activities.length - 1" class="erp-activity-connector" />
        </div>
        <div class="erp-activity-content">
          <div class="erp-activity-main">
            <span class="erp-activity-user">{{ item.user }}</span>
            <span class="erp-activity-action">{{ item.action }}</span>
          </div>
          <div class="erp-activity-detail">{{ item.detail }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { DashboardActivityItem } from '../use-dashboard-data'

  defineProps<{
    activities: DashboardActivityItem[]
  }>()
</script>

<style lang="scss" scoped>
  @use '../dashboard';

  .erp-activity-list {
    display: flex;
    flex-direction: column;
  }

  .erp-activity-item {
    display: flex;
    gap: 12px;
    min-height: 56px;
  }

  .erp-activity-time-col {
    flex-shrink: 0;
    width: 44px;
    padding-top: 2px;
  }

  .erp-activity-time {
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--art-gray-500);
  }

  .erp-activity-line {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    align-items: center;
    width: 12px;
  }

  .erp-activity-dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    margin-top: 4px;
    border-radius: 50%;
  }

  .erp-activity-connector {
    flex: 1;
    width: 1px;
    margin: 4px 0;
    background: var(--art-gray-200);
  }

  .erp-activity-content {
    flex: 1;
    min-width: 0;
    padding-bottom: 16px;
  }

  .erp-activity-main {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 4px;
  }

  .erp-activity-user {
    font-size: 13px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .erp-activity-action {
    font-size: 13px;
    color: var(--art-gray-600);
  }

  .erp-activity-detail {
    font-size: 12px;
    line-height: 1.5;
    color: var(--art-gray-500);
  }

  .erp-empty-inline {
    padding: 24px 0;
    font-size: 13px;
    color: var(--art-gray-500);
    text-align: center;
  }
</style>
