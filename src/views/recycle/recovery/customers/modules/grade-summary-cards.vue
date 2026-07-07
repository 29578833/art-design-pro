<template>
  <div class="grade-summary-cards">
    <div
      v-for="item in gradeStats"
      :key="item.grade"
      class="grade-card"
      :class="{ active: activeGrade === item.grade }"
      @click="handleClick(item.grade)"
    >
      <div class="grade-card-top">
        <div class="grade-icon" :style="{ background: item.bgColor, color: item.color }">
          <ArtSvgIcon :icon="item.icon" />
        </div>
        <span class="grade-label" :style="{ color: item.color }">{{ item.label }}</span>
      </div>
      <div class="grade-count">{{ item.count }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { CustomerGrade, GradeStatItem } from '@/types/recycle/customer'
  import { GRADE_CONFIG } from '@/types/recycle/customer'

  interface Props {
    stats: GradeStatItem[]
    activeGrade?: CustomerGrade | 'all'
  }

  interface Emits {
    (e: 'select', grade: CustomerGrade | 'all'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    activeGrade: 'all'
  })

  const emit = defineEmits<Emits>()

  const gradeStats = computed(() =>
    props.stats.map((item) => ({
      ...item,
      ...GRADE_CONFIG[item.grade]
    }))
  )

  function handleClick(grade: CustomerGrade) {
    emit('select', props.activeGrade === grade ? 'all' : grade)
  }
</script>

<style scoped lang="scss">
  .grade-summary-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 12px;
  }

  .grade-card {
    padding: 16px;
    cursor: pointer;
    background: var(--el-bg-color);
    border: 2px solid transparent;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      box-shadow: var(--el-box-shadow-light);
    }

    &.active {
      border-color: var(--el-color-primary);
    }
  }

  .grade-card-top {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .grade-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
  }

  .grade-label {
    font-size: 12px;
    font-weight: 500;
  }

  .grade-count {
    font-size: 22px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  @media (width <= 1200px) {
    .grade-summary-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
