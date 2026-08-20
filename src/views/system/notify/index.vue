<template>
  <div class="sys-notify-page art-full-height">
    <!-- 可滚动主内容 -->
    <div v-loading="loading" class="sys-notify-scroll">
      <div class="sys-notify-header">
        <div class="sys-notify-title">系统通知</div>
        <div class="sys-notify-desc">配置小程序端与 PC 管理后台各角色的消息通知渠道与模板</div>
      </div>

      <div class="sys-notify-tip">
        <ArtSvgIcon icon="ri:information-line" class="sys-notify-tip-ico" />
        <div>
          系统内消息默认全开启；微信公众号需绑定服务号，对高优先级节点开启；短信（计费）当前仅 C-10
          结算打款固定开启，不在此处配置。点击「查看模板」可查看和编辑各通知类型的默认消息内容。
        </div>
      </div>

      <div class="sys-notify-card">
        <div class="sys-notify-search">
          <ElInput
            v-model="keyword"
            placeholder="搜索通知名称或说明..."
            clearable
            class="sys-notify-search-input"
            :prefix-icon="Search"
            @input="handleSearch"
          />
          <div class="sys-notify-search-right">
            <ElSelect
              v-model="filterRole"
              placeholder="全部角色"
              clearable
              class="sys-notify-search-select"
              @change="handleSearch"
            >
              <ElOption
                v-for="opt in roleOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
            <ElSelect
              v-model="filterPlatform"
              placeholder="全部平台"
              clearable
              class="sys-notify-search-select"
              @change="handleSearch"
            >
              <ElOption label="小程序端" value="mini_program" />
              <ElOption label="PC管理后台" value="pc_admin" />
            </ElSelect>
            <ElButton @click="handleResetSearch">重置</ElButton>
          </div>
        </div>

        <div class="sys-notify-msg-type">
          <span class="sys-notify-msg-type-label">消息类型：</span>
          <ElButton
            v-for="item in MSG_TYPE_CONFIG"
            :key="item.value"
            :type="filterMsgType === item.value ? 'primary' : 'default'"
            size="small"
            round
            @click="handleMsgTypeFilter(item.value)"
          >
            {{ item.label }}
          </ElButton>
        </div>

        <div class="sys-notify-list-wrap">
          <div class="sys-notify-cols">
            <div class="col-code">编号</div>
            <div class="col-name">消息通知类型</div>
            <div class="col-desc">触发说明</div>
            <div class="col-switch">系统消息</div>
            <div class="col-switch">微信公众号</div>
            <div class="col-action">消息模板</div>
          </div>

          <div v-if="!platformSections.length" class="sys-notify-empty">未找到匹配的通知配置项</div>

          <div
            v-for="section in platformSections"
            :key="section.platform"
            class="sys-notify-platform"
          >
            <div class="platform-header" :class="section.platform">
              <ArtSvgIcon :icon="section.icon" class="platform-ico" />
              <span class="platform-label">{{ section.label }}</span>
              <span class="platform-count">共 {{ section.total }} 条</span>
            </div>

            <div v-for="group in section.groups" :key="group.category" class="sys-notify-group">
              <button type="button" class="group-header" @click="toggleSubGroup(group.category)">
                <ArtSvgIcon
                  icon="ri:arrow-right-s-line"
                  class="group-chevron"
                  :class="{ 'is-expanded': !isCollapsed(group.category) }"
                />
                <span
                  class="group-tag"
                  :style="{ color: group.tagColor, background: group.tagBg }"
                >
                  {{ group.typeName }}
                </span>
                <span class="group-desc">{{ group.desc }}</span>
                <span class="group-count">{{ group.items.length }} 条</span>
              </button>

              <div v-show="!isCollapsed(group.category)" class="group-items">
                <div
                  v-for="(item, idx) in group.items"
                  :key="item.id"
                  class="notify-row"
                >
                  <div class="col-code">
                    <span class="row-code">{{ group.codePrefix }}-{{ padIndex(idx) }}</span>
                  </div>
                  <div class="col-name">
                    <span class="type-dot" :style="{ background: group.tagColor }" />
                    <span class="type-name">{{ item.name }}</span>
                  </div>
                  <div class="col-desc">
                    <span class="trigger-desc">{{ item.title }}</span>
                  </div>
                  <div class="col-switch">
                    <ElSwitch
                      :model-value="Number(item.is_system) === 1"
                      style="--el-switch-on-color: #52c41a; --el-switch-off-color: #d9d9d9"
                      @change="(val) => handleToggle(item, 'is_system', val)"
                    />
                    <span
                      class="switch-label"
                      :class="{ on: Number(item.is_system) === 1 }"
                    >
                      {{ Number(item.is_system) === 1 ? '开启' : '关闭' }}
                    </span>
                  </div>
                  <div class="col-switch">
                    <ElSwitch
                      :model-value="Number(item.is_wechat) === 1"
                      style="--el-switch-on-color: #52c41a; --el-switch-off-color: #d9d9d9"
                      @change="(val) => handleToggle(item, 'is_wechat', val)"
                    />
                    <span
                      class="switch-label"
                      :class="{ on: Number(item.is_wechat) === 1 }"
                    >
                      {{ Number(item.is_wechat) === 1 ? '开启' : '关闭' }}
                    </span>
                  </div>
                  <div class="col-action">
                    <ElButton type="primary" link @click="openTemplate(item, group, idx)">
                      <ArtSvgIcon icon="ri:eye-line" class="mr-1" />
                      查看模板
                    </ElButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部固定 -->
    <div class="sys-notify-footer">
      <div class="sys-notify-stats">
        共 <strong>{{ totalCount }}</strong> 条
        <span class="dot">·</span>
        微信公众号已开启 <strong>{{ wechatEnabledCount }}</strong> 条
        <span class="dot">·</span>
        短信（计费）固定开启 1 条（C-10 结算打款）
      </div>
      <div class="sys-notify-actions">
        <ElButton :loading="resetting" @click="handleReset">重置默认</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSave">保存配置</ElButton>
      </div>
    </div>

    <NotifyTemplateDialog
      v-model:visible="templateVisible"
      :row="templateRow"
      @success="loadData"
    />
  </div>
</template>

<script setup lang="ts">
  import {
    fetchNotificationBatchSave,
    fetchNotificationCategoryList,
    fetchNotificationResetDefault
  } from '@/api/recycle/system-notification'
  import type {
    SystemNotificationGroup,
    SystemNotificationItem
  } from '@/types/recycle/system/system-notification'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { Search } from '@element-plus/icons-vue'
  import { ElMessageBox } from 'element-plus'
  import NotifyTemplateDialog from './modules/notify-template-dialog.vue'

  defineOptions({ name: 'SystemNotify' })

  // ==================== 常量 ====================

  interface RoleConfig {
    typeName: string
    tagColor: string
    tagBg: string
    codePrefix: string
    platform: 'mini_program' | 'pc_admin'
    desc: string
  }

  /** 角色展示配置（与原型配色对齐） */
  const ROLE_CONFIG: Record<string, RoleConfig> = {
    C: {
      typeName: '回收用户',
      tagColor: '#1890FF',
      tagBg: '#E6F7FF',
      codePrefix: 'C',
      platform: 'mini_program',
      desc: '面向报废车主，覆盖从提交申请到打款到账的完整流程节点'
    },
    S: {
      typeName: '普通员工',
      tagColor: '#722ED1',
      tagBg: '#F9F0FF',
      codePrefix: 'S',
      platform: 'mini_program',
      desc: '面向业务员，覆盖线索跟进、订单处理、拖车进度等工作提醒'
    },
    R: {
      typeName: '审核员工',
      tagColor: '#EB2F96',
      tagBg: '#FFF0F6',
      codePrefix: 'R',
      platform: 'mini_program',
      desc: '面向审核员，覆盖订单审核与签名操作的核心提醒'
    },
    A: {
      typeName: '拖车管理员',
      tagColor: '#FA8C16',
      tagBg: '#FFF7E6',
      codePrefix: 'A',
      platform: 'mini_program',
      desc: '面向派单管理员，覆盖拖车任务的指派与状态监控'
    },
    D: {
      typeName: '拖车司机',
      tagColor: '#13C2C2',
      tagBg: '#E6FFFB',
      codePrefix: 'D',
      platform: 'mini_program',
      desc: '面向执行拖车任务的司机，覆盖接单、执行、完成全过程'
    },
    PS: {
      typeName: '普通员工',
      tagColor: '#722ED1',
      tagBg: '#F9F0FF',
      codePrefix: 'PS',
      platform: 'pc_admin',
      desc: 'PC端业务员，覆盖线索分配、订单跟进、拖车进度等工作台提醒'
    },
    PR: {
      typeName: '审核员工',
      tagColor: '#EB2F96',
      tagBg: '#FFF0F6',
      codePrefix: 'PR',
      platform: 'pc_admin',
      desc: 'PC端审核员，重点覆盖审核任务管理和批量签名操作'
    },
    PF: {
      typeName: '财务人员',
      tagColor: '#52C41A',
      tagBg: '#F6FFED',
      codePrefix: 'PF',
      platform: 'pc_admin',
      desc: '面向财务，覆盖结算单处理、审批、打款等财务操作提醒'
    },
    PA: {
      typeName: '拖车管理员',
      tagColor: '#FA8C16',
      tagBg: '#FFF7E6',
      codePrefix: 'PA',
      platform: 'pc_admin',
      desc: 'PC端派单管理员，覆盖任务指派、进度监控、异常预警'
    },
    PM: {
      typeName: '超级管理员',
      tagColor: '#FF4D4F',
      tagBg: '#FFF1F0',
      codePrefix: 'PM',
      platform: 'pc_admin',
      desc: '面向系统管理员，覆盖系统预警、业务异常等全局监控通知'
    }
  }

  const ROLE_ORDER = ['C', 'S', 'R', 'A', 'D', 'PS', 'PR', 'PF', 'PA', 'PM']

  /** 消息类型（对应后端 msg_type 字段，用于分类筛选） */
  const MSG_TYPE_CONFIG = [
    { label: '线索消息', value: 'lead' },
    { label: '订单消息', value: 'order' },
    { label: '拖车消息', value: 'tow' },
    { label: '质检消息', value: 'qc' },
    { label: '结算消息', value: 'settlement' },
    { label: '证明文件', value: 'certificate' },
    { label: '系统通知', value: 'system' }
  ]

  const PLATFORM_META = {
    mini_program: {
      label: '小程序端',
      icon: 'ri:smartphone-line',
      order: 0
    },
    pc_admin: {
      label: 'PC 管理后台',
      icon: 'ri:computer-line',
      order: 1
    }
  } as const

  interface ViewGroup {
    category: string
    typeName: string
    tagColor: string
    tagBg: string
    codePrefix: string
    desc: string
    items: SystemNotificationItem[]
  }

  interface PlatformSection {
    platform: 'mini_program' | 'pc_admin'
    label: string
    icon: string
    total: number
    groups: ViewGroup[]
  }

  // ==================== 列表数据与搜索 ====================

  const loading = ref(false)
  const keyword = ref('')
  const filterRole = ref('')
  const filterPlatform = ref('')
  const filterMsgType = ref('')
  const groups = ref<SystemNotificationGroup[]>([])

  /** 角色下拉（带平台前缀，避免同名角色冲突） */
  const roleOptions = computed(() =>
    ROLE_ORDER.map((code) => {
      const cfg = ROLE_CONFIG[code]
      const plat = cfg.platform === 'mini_program' ? '小程序' : 'PC'
      return { value: code, label: `${plat} · ${cfg.typeName}` }
    })
  )

  async function loadData() {
    loading.value = true
    try {
      groups.value = await fetchNotificationCategoryList({
        keyword: keyword.value,
        role: filterRole.value,
        platform: filterPlatform.value,
        msg_type: filterMsgType.value
      })
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    loadData()
  }

  /** 消息类型筛选（再点一次取消选中） */
  function handleMsgTypeFilter(value: string) {
    filterMsgType.value = filterMsgType.value === value ? '' : value
    loadData()
  }

  function handleResetSearch() {
    keyword.value = ''
    filterRole.value = ''
    filterPlatform.value = ''
    filterMsgType.value = ''
    loadData()
  }

  // ==================== 平台 / 角色视图 ====================

  /** 默认折叠全部角色，打开页更清爽 */
  const collapsedGroups = ref<string[]>([...ROLE_ORDER])

  function isCollapsed(category: string) {
    return collapsedGroups.value.includes(category)
  }

  function toggleSubGroup(category: string) {
    const idx = collapsedGroups.value.indexOf(category)
    if (idx > -1) {
      collapsedGroups.value.splice(idx, 1)
    } else {
      collapsedGroups.value.push(category)
    }
  }

  function padIndex(idx: number) {
    return String(idx + 1).padStart(2, '0')
  }

  /** 按平台聚合角色分组 */
  const platformSections = computed<PlatformSection[]>(() => {
    const map = new Map<string, ViewGroup[]>()

    const sorted = [...groups.value].sort((a, b) => {
      const ia = ROLE_ORDER.indexOf(a.category)
      const ib = ROLE_ORDER.indexOf(b.category)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })

    for (const group of sorted) {
      const config = ROLE_CONFIG[group.category]
      const platform = (group.platform || config?.platform || 'mini_program') as
        | 'mini_program'
        | 'pc_admin'
      const viewGroup: ViewGroup = {
        category: group.category,
        typeName: config?.typeName || group.label || group.category,
        tagColor: config?.tagColor || group.color || '#4169FF',
        tagBg: config?.tagBg || '#EEF2FF',
        codePrefix: config?.codePrefix || group.category,
        desc: config?.desc || '',
        items: group.items
      }
      if (!map.has(platform)) map.set(platform, [])
      map.get(platform)!.push(viewGroup)
    }

    return (['mini_program', 'pc_admin'] as const)
      .filter((p) => map.has(p))
      .map((platform) => {
        const list = map.get(platform)!
        return {
          platform,
          label: PLATFORM_META[platform].label,
          icon: PLATFORM_META[platform].icon,
          total: list.reduce((sum, g) => sum + g.items.length, 0),
          groups: list
        }
      })
  })

  // ==================== 统计 ====================

  const totalCount = computed(() => groups.value.reduce((sum, g) => sum + g.items.length, 0))

  const wechatEnabledCount = computed(() =>
    groups.value.reduce(
      (sum, g) => sum + g.items.filter((i) => Number(i.is_wechat) === 1).length,
      0
    )
  )

  // ==================== 渠道开关与批量保存 ====================

  const saving = ref(false)

  /** 切换渠道开关（直接改 groups 原数据，保存时统一提交） */
  function handleToggle(
    item: SystemNotificationItem,
    channelKey: 'is_system' | 'is_wechat',
    val: string | number | boolean
  ) {
    item[channelKey] = val ? 1 : 2
  }

  async function handleSave() {
    const items = []
    for (const group of groups.value) {
      for (const item of group.items) {
        items.push({
          id: item.id,
          is_sms: item.is_sms,
          is_wechat: item.is_wechat,
          is_system: item.is_system,
          is_routine: item.is_routine,
          is_ent_wechat: item.is_ent_wechat
        })
      }
    }
    saving.value = true
    try {
      await fetchNotificationBatchSave(items)
    } finally {
      saving.value = false
    }
  }

  // ==================== 重置默认 ====================

  const resetting = ref(false)

  async function handleReset() {
    try {
      await ElMessageBox.confirm('确定要重置所有通知为默认状态吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    resetting.value = true
    try {
      await fetchNotificationResetDefault()
      await loadData()
    } finally {
      resetting.value = false
    }
  }

  // ==================== 模板弹窗 ====================

  const templateVisible = ref(false)
  const templateRow = ref<(SystemNotificationItem & {
    _code?: string
    _tagColor?: string
    _tagBg?: string
    _typeName?: string
  }) | null>(null)

  function openTemplate(item: SystemNotificationItem, group: ViewGroup, idx: number) {
    templateRow.value = {
      ...item,
      _code: `${group.codePrefix}-${padIndex(idx)}`,
      _tagColor: group.tagColor,
      _tagBg: group.tagBg,
      _typeName: group.typeName
    }
    templateVisible.value = true
  }

  onMounted(loadData)
</script>

<style lang="scss">
  @use './notify';
</style>
