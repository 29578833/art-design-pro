<template>
  <ElDialog
    v-model="dialogVisible"
    :width="phase === 'scene' ? '500px' : '1100px'"
    align-center
    destroy-on-close
    class="vehicle-archive-edit-dialog"
    :close-on-click-modal="false"
    :show-close="true"
    @closed="handleClosed"
  >
    <template #header>
      <div v-if="phase === 'scene'" class="ae-title">车辆受理新增</div>
      <div v-else class="ae-header">
        <div class="ae-title">编辑车辆档案</div>
        <div class="ae-tags">
          <span class="ae-tag blue">{{ hplxLabel }}</span>
          <span class="ae-tag" :class="isPersonal ? 'orange' : 'purple'">{{ syqLabel }}</span>
        </div>
      </div>
    </template>

    <SceneSelector
      v-if="phase === 'scene'"
      v-model:hplx="hplx"
      v-model:syq="syq"
      :hplx-options="hplxOptions"
      :syq-options="syqOptions"
      :hplx-label="hplxLabel"
      :syq-label="syqLabel"
    />

    <div v-else class="ae-form-wrap">
      <ProgressHeader
        :steps="visibleSteps"
        :current-step="step"
        :step-complete="stepComplete"
        :hplx-label="hplxLabel"
        :syq-label="syqLabel"
        :accept-time="acceptTime"
        :link-info="linkInfo"
        @change-step="goToStep"
      />

      <div v-loading="loading" class="ae-body">
        <div v-show="step === 1" class="ae-step-pane">
          <OwnerStep
            ref="ownerStepRef"
            v-model:form="ownerForm"
            v-model:images="ownerImages"
            :vehicle-id="vehicleId"
            :hplx="hplx"
            :syq="syq"
            :vehicle-form="vehicleForm"
            :vehicle-images="vehicleImages"
            :readonly="isSubmitted"
          />
        </div>

        <div v-show="step === 2" class="ae-step-pane">
          <VehicleStep
            ref="vehicleStepRef"
            v-model:form="vehicleForm"
            v-model:images="vehicleImages"
            v-model:cllx-path="cllxPath"
            :vehicle-id="vehicleId"
            :hplx="hplx"
            :owner-form="ownerForm"
            :readonly="isSubmitted"
          />
        </div>

        <div v-show="step === 3" class="ae-step-pane">
          <AgentStep
            ref="agentStepRef"
            v-model:has-agent="hasAgent"
            v-model:form="agentForm"
            v-model:images="agentImages"
            :vehicle-id="vehicleId"
            :readonly="isSubmitted"
          />
        </div>

        <div v-show="step === 4" class="ae-step-pane">
          <AuthenticationStep
            :cjid="cjid"
            :is-submitted="isSubmitted"
            :owner-form="ownerForm"
            :agent-form="agentForm"
            :is-personal="isPersonal"
            :readonly="isSubmitted"
            @refreshed="loadAcceptDataByVehicleId"
          />
        </div>

        <div v-show="step === 5" class="ae-step-pane">
          <MaterialsStep
            ref="materialsStepRef"
            v-model:owner-images="ownerImages"
            v-model:vehicle-images="vehicleImages"
            v-model:agent-images="agentImages"
            v-model:material-images="materialImages"
            :vehicle-id="vehicleId"
            :is-company="isCompany"
            :readonly="isSubmitted"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <template v-if="phase === 'scene'">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="initLoading" @click="confirmScene">确定</ElButton>
      </template>
      <div
        v-else-if="isSubmitted"
        style="display: flex; justify-content: space-between; width: 100%"
      >
        <span style="font-size: 13px; color: #52c41a">已提交至商务部</span>
        <div style="display: flex; gap: 12px">
          <ElButton @click="dialogVisible = false">关闭</ElButton>
          <ElButton type="primary" plain @click="viewSubmitResult">查看提交结果</ElButton>
        </div>
      </div>
      <div v-else style="display: flex; justify-content: space-between; width: 100%">
        <div class="ae-footer-left">
          <span>步骤 {{ step }} / 5</span>
          <span v-if="draftSaved" style="color: #52c41a">已暂存</span>
        </div>
        <div style="display: flex; gap: 12px">
          <ElButton @click="dialogVisible = false">关闭</ElButton>
          <ElButton v-if="step > 1" @click="goPrev">上一步</ElButton>
          <ElButton :loading="saving" @click="handleSaveDraft">暂存本步</ElButton>
          <ElButton v-if="step < 5" type="primary" :loading="saving" @click="goNext"
            >下一步</ElButton
          >
          <ElButton
            v-else
            type="primary"
            :loading="submitting"
            :disabled="!authCompleted"
            @click="handleSubmit"
          >
            {{ authCompleted ? '提交至商务部' : '请先完成实名认证' }}
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>

  <SubmitResultDialog
    v-model:visible="submitResultVisible"
    :result="submitResult"
    @fetch-archive="handleFetchArchive"
  />
</template>

<script setup lang="ts">
  import type { ScrapVehicle } from '@/types/recycle/vehicle'
  import AgentStep from './vehicle-archive/agent-step.vue'
  import AuthenticationStep from './vehicle-archive/authentication-step.vue'
  import MaterialsStep from './vehicle-archive/materials-step.vue'
  import OwnerStep from './vehicle-archive/owner-step.vue'
  import ProgressHeader from './vehicle-archive/progress-header.vue'
  import SceneSelector from './vehicle-archive/scene-selector.vue'
  import SubmitResultDialog from './vehicle-archive/submit-result-dialog.vue'
  import VehicleStep from './vehicle-archive/vehicle-step.vue'
  import { useVehicleArchiveEdit } from './vehicle-archive/use-vehicle-archive-edit'
  import './vehicle-archive-edit-dialog.scss'

  defineOptions({ name: 'VehicleArchiveEditDialog' })

  const props = defineProps<{
    /** 是否显示档案编辑弹窗。 */
    visible: boolean
    /** 当前车辆主键。 */
    vehicleId: number
    /** 列表行数据，对齐 admin archiveEdit.open(id, row) */
    vehicleRow?: ScrapVehicle | null
  }>()

  const emit = defineEmits<{
    /** 更新弹窗显示状态。 */
    'update:visible': [boolean]
    /** 档案提交成功。 */
    success: []
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  const ownerStepRef = ref<InstanceType<typeof OwnerStep> | null>(null)
  const vehicleStepRef = ref<InstanceType<typeof VehicleStep> | null>(null)
  const agentStepRef = ref<InstanceType<typeof AgentStep> | null>(null)
  const materialsStepRef = ref<InstanceType<typeof MaterialsStep> | null>(null)

  const {
    phase,
    initLoading,
    loading,
    saving,
    submitting,
    draftSaved,
    isSubmitted,
    hplx,
    syq,
    cjid,
    step,
    acceptTime,
    submitResult,
    submitResultVisible,
    hasAgent,
    cllxPath,
    hplxLabel,
    syqLabel,
    isCompany,
    isPersonal,
    linkInfo,
    ownerForm,
    ownerImages,
    vehicleForm,
    vehicleImages,
    materialImages,
    agentForm,
    agentImages,
    authCompleted,
    stepComplete,
    hplxOptions,
    syqOptions,
    visibleSteps,
    openEditor,
    confirmScene,
    handleSaveDraft,
    goToStep,
    goNext,
    goPrev,
    handleFetchArchive,
    viewSubmitResult,
    handleSubmit,
    handleClosed,
    loadAcceptDataByVehicleId
  } = useVehicleArchiveEdit({
    vehicleId: computed(() => props.vehicleId),
    vehicleRow: computed(() => props.vehicleRow),
    stepRefs: {
      owner: ownerStepRef,
      vehicle: vehicleStepRef,
      agent: agentStepRef,
      materials: materialsStepRef
    },
    onSuccess: () => emit('success')
  })

  watch(
    () => props.visible,
    (v) => {
      if (v) {
        handleClosed()
        acceptTime.value = new Date().toLocaleString('zh-CN').replace(/\//g, '-').slice(0, 16)
        openEditor()
      }
    }
  )
</script>
