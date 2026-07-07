<template>
  <div class="erp-card">
    <div class="erp-card-header">
      <span class="erp-card-title">最近操作记录</span>
      <span class="erp-card-extra">今日</span>
    </div>
    <div class="erp-activity-list">
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
  const activities = [
    {
      time: '10:32',
      user: '张伟',
      action: '创建收车订单',
      detail: '沪A·12345 大众帕萨特2020款',
      color: '#1890FF'
    },
    {
      time: '10:15',
      user: '质检员王',
      action: '完成质检报告',
      detail: '沪B·67890 缺件2项 扣款¥800',
      color: '#FA8C16'
    },
    {
      time: '09:58',
      user: '李明',
      action: '审核通过订单',
      detail: 'XG20260622003 ¥12,000',
      color: '#52C41A'
    },
    {
      time: '09:45',
      user: '拖车管理员',
      action: '派单给司机刘师傅',
      detail: '苏C·11111 取车地址：浦东新区',
      color: '#13C2C2'
    },
    {
      time: '09:20',
      user: '财务王',
      action: '完成结算付款',
      detail: 'XG20260618001 ¥8,500 微信转账',
      color: '#722ED1'
    }
  ]
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
</style>
