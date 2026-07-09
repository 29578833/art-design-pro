<template>
  <div class="fop-root">
    <!-- ① 流程总览（横向步骤条） -->
    <div class="fop-overview-card">
      <div class="fop-overview-header">
        <h3 class="fop-section-title">流程总览</h3>
        <span v-if="isRejected" class="fop-rejected-badge">已驳回</span>
      </div>

      <!-- 步骤轨道 -->
      <div class="fop-steps-track">
        <!-- 底层灰色背景线 -->
        <div class="fop-track-bg" />
        <!-- 蓝色进度线 -->
        <div v-if="!isRejected" class="fop-track-fill" :style="trackFillStyle" />

        <!-- 每个步骤 -->
        <div v-for="(step, i) in STEPS" :key="step.key" class="fop-step-col">
          <!-- 圆圈 -->
          <div
            class="fop-step-circle"
            :class="{
              'fop-step-circle--done': getStepState(i) === 'done',
              'fop-step-circle--current': getStepState(i) === 'current' && !isRejected,
              'fop-step-circle--reject': getStepState(i) === 'current' && isRejected,
              'fop-step-circle--pending': getStepState(i) === 'pending'
            }"
          >
            <ArtSvgIcon
              v-if="getStepState(i) === 'done'"
              icon="ri:checkbox-circle-line"
              class="fop-step-check"
            />
            <span v-else class="fop-step-num">{{ i + 1 }}</span>
          </div>

          <!-- 标签 + 时间 -->
          <span
            class="fop-step-label"
            :class="{ 'fop-step-label--active': getStepState(i) !== 'pending' }"
          >
            {{ step.label }}
          </span>
          <span v-if="step.timeText && getStepState(i) !== 'pending'" class="fop-step-time">
            {{ step.timeText }}
          </span>
        </div>
      </div>
    </div>

    <!-- ② 流程详情与操作记录（纵向时间线） -->
    <div class="fop-timeline-card">
      <div class="fop-timeline-header">
        <h3 class="fop-section-title">流程详情与操作记录</h3>
        <span class="fop-timeline-count">共 {{ STEPS.length }} 个阶段节点</span>
      </div>

      <div class="fop-timeline-body">
        <div v-for="(step, i) in STEPS" :key="step.key" class="fop-tl-row">
          <!-- 节点轴 -->
          <div class="fop-tl-axis">
            <div
              class="fop-tl-node"
              :class="{
                'fop-tl-node--done': getStepState(i) === 'done',
                'fop-tl-node--current': getStepState(i) === 'current' && !isRejected,
                'fop-tl-node--reject': getStepState(i) === 'current' && isRejected,
                'fop-tl-node--pending': getStepState(i) === 'pending'
              }"
            >
              <ArtSvgIcon
                v-if="getStepState(i) === 'done'"
                icon="ri:checkbox-circle-line"
                class="fop-tl-icon"
              />
              <ArtSvgIcon
                v-else-if="getStepState(i) === 'current'"
                icon="ri:time-line"
                class="fop-tl-icon"
              />
              <span v-else class="fop-tl-num">{{ i + 1 }}</span>
            </div>
            <div
              v-if="i < STEPS.length - 1"
              class="fop-tl-line"
              :class="{
                'fop-tl-line--done': getStepState(i) === 'done',
                'fop-tl-line--current': getStepState(i) === 'current'
              }"
            />
          </div>

          <!-- 内容 -->
          <div class="fop-tl-content" :class="{ 'fop-tl-content--last': i === STEPS.length - 1 }">
            <!-- 标题行 -->
            <div class="fop-tl-title-row">
              <div class="fop-tl-title-left">
                <span
                  class="fop-tl-label"
                  :class="{ 'fop-tl-label--active': getStepState(i) !== 'pending' }"
                  >{{ step.label }}</span
                >
                <span
                  v-if="getStepState(i) === 'current' && !isRejected"
                  class="fop-tl-badge fop-tl-badge--ing"
                  >进行中</span
                >
                <span
                  v-if="getStepState(i) === 'current' && isRejected && i === 0"
                  class="fop-tl-badge fop-tl-badge--reject"
                  >已驳回</span
                >
              </div>
              <span v-if="step.timeText && getStepState(i) !== 'pending'" class="fop-tl-time">
                {{ step.fullTimeText }}
              </span>
            </div>

            <!-- 阶段描述 -->
            <p
              class="fop-tl-desc"
              :class="
                getStepState(i) !== 'pending' ? 'fop-tl-desc--active' : 'fop-tl-desc--pending'
              "
              >{{ step.desc }}</p
            >

            <!-- 操作日志条目 -->
            <div v-if="getStepState(i) !== 'pending' && step.logs.length" class="fop-log-list">
              <div v-for="(log, li) in step.logs" :key="li" class="fop-log-row">
                <span class="fop-log-dot" />
                <span class="fop-log-text">{{ log.change_message || '状态变更' }}</span>
                <span class="fop-log-operator">{{ log.operator_name || '系统' }}</span>
                <span class="fop-log-time">{{ formatShortTime(log.change_time) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { OrderDetail, OrderStatusLog } from '@/types/recycle/order'

  const props = defineProps<{
    detail: Partial<OrderDetail>
    selectedVehicleIdx: number
  }>()

  // ========== 当前选中车辆 ==========
  const currentVehicle = computed(
    () => props.detail.vehicles?.[props.selectedVehicleIdx] ?? props.detail.vehicle
  )

  // ========== 状态判断 ==========
  const isRejected = computed(() => Number(props.detail.status) === -1)

  /**
   * 将订单/车辆状态映射为步骤索引（0-based）
   * 步骤序列：订单提交 → 审核通过 → 待入厂 → 入厂查验 → 拆解处理 → 注销办理 → 注销完成 → 结算完成
   */
  const currentIdx = computed<number>(() => {
    const orderStatus = Number(props.detail.status)
    const vehicleStatus = Number(currentVehicle.value?.status ?? 0)

    if (orderStatus === 1 || orderStatus === -1) return 0 // 待审核 / 驳回
    if (orderStatus === 2) {
      // 审核通过后，看车辆物流状态
      if (vehicleStatus <= 2 || !vehicleStatus) return 1 // 审核通过（待出发）
      if (vehicleStatus === 3) return 2 // 待入厂
      if (vehicleStatus === 4) return 3 // 入厂查验
      if (vehicleStatus === 5) return 4 // 拆解中
      if (vehicleStatus === 6) return 5 // 注销中
      if (vehicleStatus === 7) return 6 // 已注销
      if (vehicleStatus >= 8) return 7 // 已完成
    }
    if (orderStatus === 3) return 7 // 订单已完成
    return 0
  })

  // ========== 从 status_logs 中提取各步骤日志 ==========
  // 按 to_status 匹配到对应步骤
  const STATUS_TO_STEP: Record<number, number> = {
    1: 0, // 订单提交/待审核
    2: 1, // 审核通过
    3: 2, // 待入厂
    4: 3, // 入厂查验
    5: 4, // 拆解中
    6: 5, // 注销中
    7: 6, // 已注销
    8: 7, // 结算完成
    [-1]: 0 // 驳回（归到步骤0）
  }

  const logsPerStep = computed<OrderStatusLog[][]>(() => {
    const result: OrderStatusLog[][] = Array.from({ length: 8 }, () => [])
    const logs = props.detail.status_logs ?? []
    const sorted = [...logs].sort((a, b) => Number(a.change_time ?? 0) - Number(b.change_time ?? 0))
    for (const log of sorted) {
      const stepIdx = STATUS_TO_STEP[Number(log.to_status)]
      if (stepIdx !== undefined) {
        result[stepIdx].push(log)
      } else {
        // 无法匹配的日志挂到最后一个已进行的步骤
        result[Math.min(currentIdx.value, 7)].push(log)
      }
    }
    return result
  })

  // ========== 步骤时间文本（从对应日志取） ==========
  function getStepTime(stepIdx: number): number | undefined {
    const logs = logsPerStep.value[stepIdx]
    return logs[0]?.change_time
  }

  function formatTimestamp(ts?: number, short = false): string {
    if (!ts) return ''
    const d = new Date(Number(ts) * 1000)
    if (short) {
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${mm}-${dd}`
    }
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  function formatShortTime(ts?: number): string {
    if (!ts) return ''
    const d = new Date(Number(ts) * 1000)
    const MM = String(d.getMonth() + 1).padStart(2, '0')
    const DD = String(d.getDate()).padStart(2, '0')
    const HH = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${MM}-${DD} ${HH}:${mm}`
  }

  // ========== 步骤定义 ==========
  interface StepDef {
    key: string
    label: string
    desc: string
    timeText: string
    fullTimeText: string
    logs: OrderStatusLog[]
  }

  const STEP_META = [
    { key: 'pending_review', label: '订单提交', desc: '客户提交报废回收申请' },
    { key: 'approved', label: '审核通过', desc: '管理员完成资质审核，订单进入回收流程' },
    { key: 'pending_entry', label: '待入厂', desc: '等待车辆到达回收厂' },
    { key: 'inspecting', label: '入厂查验', desc: '专业人员对车辆进行现场查验与定价' },
    { key: 'dismantling', label: '拆解处理', desc: '按规范对车辆进行拆解' },
    { key: 'canceling', label: '注销办理', desc: '向交管部门提交注销申请材料' },
    { key: 'canceled', label: '注销完成', desc: '车辆登记信息已注销' },
    { key: 'completed', label: '结算完成', desc: '完成打款，全部回收流程结束' }
  ]

  const STEPS = computed<StepDef[]>(() =>
    STEP_META.map((meta, idx) => {
      const ts = getStepTime(idx)
      return {
        ...meta,
        timeText: formatTimestamp(ts, true),
        fullTimeText: formatTimestamp(ts),
        logs: logsPerStep.value[idx] ?? []
      }
    })
  )

  // ========== 步骤状态 ==========
  function getStepState(i: number): 'done' | 'current' | 'pending' {
    if (isRejected.value && i === 0) return 'current'
    if (isRejected.value) return 'pending'
    if (i < currentIdx.value) return 'done'
    if (i === currentIdx.value) return 'current'
    return 'pending'
  }

  // ========== 蓝色进度线宽度 ==========
  const trackFillStyle = computed(() => {
    const total = STEPS.value.length - 1
    const pct = currentIdx.value > 0 ? (currentIdx.value / total) * 92 : 0
    return { width: `${pct}%` }
  })
</script>

<style scoped lang="scss">
  .fop-root {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ===== 通用标题 ===== */
  .fop-section-title {
    font-size: 13px;
    font-weight: 600;
    color: #262626;
  }

  /* ===== ① 横向进度总览 ===== */
  .fop-overview-card {
    padding: 18px 20px;
    background: #f5f5f5;
    border-radius: 8px;
  }

  .fop-overview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .fop-rejected-badge {
    padding: 1px 8px;
    font-size: 11px;
    font-weight: 600;
    color: #ff4d4f;
    background: #fff1f0;
    border-radius: 4px;
  }

  /* 步骤轨道 */
  .fop-steps-track {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  /* 底层灰色线：left=4%  right=4% 覆盖首尾圆圈中心 */
  .fop-track-bg {
    position: absolute;
    top: 16px;
    right: 4%;
    left: 4%;
    height: 2px;
    background: #e0e0e0;
  }

  /* 蓝色填充线（通过 JS 动态宽度） */
  .fop-track-fill {
    position: absolute;
    top: 16px;
    left: 4%;
    height: 2px;
    background: #1677ff;
    transition: width 0.4s ease;
  }

  /* 每一列步骤 */
  .fop-step-col {
    position: relative;
    z-index: 1;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 6px;
    align-items: center;
  }

  /* 圆圈 */
  .fop-step-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 50%;
    transition: all 0.2s;

    &--done {
      color: #fff;
      background: #52c41a;
    }

    &--current {
      color: #fff;
      background: #1677ff;
      box-shadow: 0 0 0 4px #e0eeff;
    }

    &--reject {
      color: #fff;
      background: #ff4d4f;
      box-shadow: 0 0 0 4px #fff1f0;
    }

    &--pending {
      color: #bfbfbf;
      background: #fff;
      border: 2px solid #e0e0e0;
    }
  }

  .fop-step-check {
    font-size: 16px;
  }

  .fop-step-num {
    font-size: 12px;
    font-weight: 700;
  }

  .fop-step-label {
    font-size: 11px;
    line-height: 1.3;
    color: #bfbfbf;
    text-align: center;

    &--active {
      font-weight: 500;
      color: #262626;
    }
  }

  .fop-step-time {
    margin-top: -2px;
    font-size: 10px;
    color: #8c8c8c;
    text-align: center;
  }

  /* ===== ② 纵向时间线 ===== */
  .fop-timeline-card {
    overflow: hidden;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
  }

  .fop-timeline-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid #f0f0f0;
  }

  .fop-timeline-count {
    font-size: 12px;
    color: #bfbfbf;
  }

  .fop-timeline-body {
    padding: 16px 20px 8px;
  }

  .fop-tl-row {
    display: flex;
    gap: 16px;
  }

  /* 节点轴 */
  .fop-tl-axis {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    align-items: center;
    width: 28px;
  }

  .fop-tl-node {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin-top: 2px;
    border-radius: 50%;

    &--done {
      color: #fff;
      background: #52c41a;
    }

    &--current {
      color: #fff;
      background: #1677ff;
    }

    &--reject {
      color: #fff;
      background: #ff4d4f;
    }

    &--pending {
      color: #bfbfbf;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
    }
  }

  .fop-tl-icon {
    font-size: 14px;
  }

  .fop-tl-num {
    font-size: 11px;
    font-weight: 600;
  }

  .fop-tl-line {
    flex: 1;
    width: 2px;
    min-height: 32px;
    margin: 4px 0;
    background: #f0f0f0;

    &--done {
      background: rgb(82 196 26 / 30%);
    }

    &--current {
      background: rgb(22 119 255 / 20%);
    }
  }

  /* 右侧内容 */
  .fop-tl-content {
    flex: 1;
    padding-bottom: 20px;

    &--last {
      padding-bottom: 8px;
    }
  }

  .fop-tl-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
  }

  .fop-tl-title-left {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .fop-tl-label {
    font-size: 13px;
    font-weight: 500;
    color: #bfbfbf;

    &--active {
      color: #262626;
    }
  }

  .fop-tl-badge {
    padding: 1px 6px;
    font-size: 10px;
    font-weight: 600;
    border-radius: 4px;

    &--ing {
      color: #1677ff;
      background: #e6f4ff;
    }

    &--reject {
      color: #ff4d4f;
      background: #fff1f0;
    }
  }

  .fop-tl-time {
    font-size: 12px;
    color: #bfbfbf;
    white-space: nowrap;
  }

  .fop-tl-desc {
    font-size: 12px;
    line-height: 1.5;

    &--active {
      color: #8c8c8c;
    }

    &--pending {
      color: #d9d9d9;
    }
  }

  /* ===== 操作日志条目 ===== */
  .fop-log-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
  }

  .fop-log-row {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 6px 10px;
    background: #f8f9fb;
    border-radius: 6px;
  }

  .fop-log-dot {
    flex-shrink: 0;
    width: 6px;
    height: 6px;
    background: #1677ff;
    border-radius: 50%;
  }

  .fop-log-text {
    flex: 1;
    font-size: 12px;
    color: #434343;
  }

  .fop-log-operator {
    font-size: 12px;
    color: #8c8c8c;
    white-space: nowrap;
  }

  .fop-log-time {
    font-size: 11px;
    color: #bfbfbf;
    white-space: nowrap;
  }
</style>
