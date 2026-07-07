<template>
  <ElRow :gutter="12" class="grade-summary-row">
    <ElCol v-for="item in gradeStats" :key="item.levelId" :xs="12" :sm="12" :md="6" :xl="6">
      <div
        class="grade-card"
        :class="{ active: activeLevelId === item.levelId }"
        @click="handleClick(item.levelId)"
      >
        <div class="grade-card-top">
          <div class="grade-icon" :style="{ background: item.bgColor, color: item.color }">
            <ArtSvgIcon :icon="item.icon" />
          </div>
          <span class="grade-label" :style="{ color: item.color }">{{ item.label }}</span>
        </div>
        <div class="grade-count">{{ item.count }}</div>
      </div>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  import type { GradeStatItem } from '@/types/recycle/customer'
  import { resolveLevelStyle } from '@/types/recycle/customer'

  interface Props {
    stats: GradeStatItem[]
    activeLevelId?: number | 'all'
  }

  interface Emits {
    (e: 'select', levelId: number | 'all'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    activeLevelId: 'all'
  })

  const emit = defineEmits<Emits>()

  const gradeStats = computed(() =>
    props.stats.map((item, index) => {
      const style = resolveLevelStyle(item.levelName, index)
      return {
        ...item,
        label: style.label,
        color: style.color,
        bgColor: style.bgColor,
        icon: style.icon
      }
    })
  )

  function handleClick(levelId: number) {
    emit('select', props.activeLevelId === levelId ? 'all' : levelId)
  }
</script>

<style scoped lang="scss">
  .grade-summary-row {
    margin-bottom: 0;
  }

  .grade-card {
    padding: 16px;
    margin-bottom: 12px;
    text-align: left;
    cursor: pointer;
    background: var(--default-box-color);
    border: 2px solid transparent;
    border-radius: 8px;
    transition:
      box-shadow 0.2s,
      border-color 0.2s;

    &:hover {
      box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
    }

    &.active {
      border-color: var(--el-color-primary);
    }
  }

  .grade-card-top {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 4px;
  }

  .grade-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 16px;
    border-radius: 8px;
  }

  .grade-label {
    font-size: 12px;
    font-weight: 500;
  }

  .grade-count {
    margin-top: 4px;
    font-size: 22px;
    font-weight: 700;
    color: var(--art-gray-900);
  }
</style>
