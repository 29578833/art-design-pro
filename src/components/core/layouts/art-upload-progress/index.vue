<!-- 全局上传进度提示 -->
<template>
  <Transition
    enter-active-class="tad-300 ease-out"
    leave-active-class="tad-200 ease-in"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="tasks.length"
      class="upload-progress-panel fixed right-5 top-16 z-[9999] w-72 rounded-lg border border-g-200 bg-box p-4 shadow-lg"
    >
      <div class="mb-3 flex-cb">
        <span class="flex-c gap-1.5 text-sm font-semibold text-g-800">
          <ArtSvgIcon icon="ri:upload-cloud-2-line" class="text-base text-primary" />
          文件上传中
        </span>
        <span class="text-xs text-g-500">{{ doneCount }} / {{ tasks.length }} 完成</span>
      </div>

      <div class="space-y-3">
        <div v-for="task in tasks" :key="task.id" class="up-item">
          <div class="mb-1.5 flex-cb gap-2">
            <span
              class="up-item-name min-w-0 flex-1 truncate text-xs text-g-600"
              :title="task.name"
            >
              {{ task.name }}
            </span>
            <span class="shrink-0 text-xs font-medium" :class="statusTextClass(task)">
              {{ statusText(task) }}
            </span>
          </div>
          <ElProgress
            :percentage="task.progress"
            :stroke-width="6"
            :show-text="false"
            :status="progressStatus(task)"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useUploadProgress } from '@/utils/upload-progress'
  import type { UploadProgressTask } from '@/utils/upload-progress'

  defineOptions({ name: 'ArtUploadProgress' })

  const { tasks } = useUploadProgress()
  const doneCount = computed(() => tasks.value.filter((item) => item.status !== 'uploading').length)

  function statusText(task: UploadProgressTask): string {
    if (task.status === 'uploading') return `${task.progress}%`
    return task.status === 'done' ? '完成' : '失败'
  }

  function statusTextClass(task: UploadProgressTask): string {
    if (task.status === 'error') return 'text-danger'
    if (task.status === 'done') return 'text-success'
    return 'text-g-500'
  }

  function progressStatus(task: UploadProgressTask) {
    if (task.progress < 100) return undefined
    return task.status === 'error' ? ('exception' as const) : ('success' as const)
  }
</script>
