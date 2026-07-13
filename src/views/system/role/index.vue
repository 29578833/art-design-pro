<template>
  <div class="role-page art-full-height">
    <div class="role-page-header">
      <div>
        <div class="role-page-title">角色权限</div>
        <div class="role-page-desc">角色定义与功能权限配置</div>
      </div>
    </div>

    <div v-loading="listLoading" class="role-layout">
      <!-- 左侧角色列表 -->
      <div class="role-sidebar">
        <div class="role-sidebar-head">
          <span class="role-sidebar-title">角色列表</span>
          <ElButton type="primary" link @click="addVisible = true">
            <ArtSvgIcon icon="ri:add-line" />
            新增角色
          </ElButton>
        </div>
        <div class="role-sidebar-list">
          <div
            v-for="role in roleList"
            :key="role.id"
            class="role-sidebar-item"
            :class="{ 'is-active': selectedId === role.id }"
            @click="selectRole(role.id)"
          >
            <div class="role-item-name">{{ role.role_name || '—' }}</div>
            <div class="role-item-meta">
              {{ role.user_count ?? 0 }}人 ·
              {{ truncateDesc(role.role_desc) }}
            </div>
          </div>
          <div v-if="!roleList.length" class="role-empty">暂无角色</div>
        </div>
      </div>

      <!-- 右侧权限配置 -->
      <div class="role-main">
        <div class="role-main-head">
          <div>
            <span class="role-main-title">
              权限配置 — {{ selectedRole?.role_name || '请选择角色' }}
            </span>
            <span v-if="selectedRole?.role_desc" class="role-main-desc">
              {{ selectedRole.role_desc }}
            </span>
          </div>
          <ElButton
            type="primary"
            :disabled="!selectedId || isSuperAdmin"
            :loading="saving"
            @click="handleSave"
          >
            {{ savedHint ? '已保存' : '保存权限配置' }}
          </ElButton>
        </div>

        <div v-if="!selectedId" class="role-main-empty">请选择左侧角色进行权限配置</div>

        <div v-else-if="isSuperAdmin" class="role-super-tip">
          <ArtSvgIcon icon="ri:checkbox-circle-fill" class="role-super-tip-ico" />
          <span>超级管理员拥有所有功能权限，无需单独配置</span>
        </div>

        <div v-else v-loading="detailLoading" class="role-main-body">
          <div class="role-panel">
            <div class="role-panel-title">PC 管理后台权限</div>
            <div class="role-tree-wrap">
              <RolePermPanel v-model="checkedRuleIds" :menus="menuTree" />
            </div>
          </div>

          <div class="role-panel">
            <div class="role-panel-head">
              <span class="role-panel-title">小程序角色绑定</span>
              <span class="role-panel-hint">
                选择后，该 PC 角色的用户在小程序登录时可切换对应身份（可多选）
              </span>
            </div>
            <ElCheckboxGroup v-model="miniRoles" class="role-mini-group">
              <ElCheckbox
                v-for="opt in scrapRoleOptions"
                :key="opt.id"
                :value="String(opt.id)"
                class="role-mini-item"
                :class="{ 'is-checked': miniRoles.includes(String(opt.id)) }"
              >
                {{ opt.role_name || opt.role_key || `角色${opt.id}` }}
              </ElCheckbox>
            </ElCheckboxGroup>
            <div v-if="!scrapRoleOptions.length" class="role-mini-empty">暂无小程序角色</div>
          </div>
        </div>
      </div>
    </div>

    <RoleAddDialog v-model:visible="addVisible" @success="handleAddSuccess" />
  </div>
</template>

<script setup lang="ts">
  import {
    fetchScrapRoleOptions,
    fetchSystemRoleEdit,
    fetchSystemRoleList,
    fetchSystemRoleSave,
    type ScrapRoleOption
  } from '@/api/recycle/system-role'
  import type { SystemRoleItem, SystemRoleMenuNode } from '@/types/recycle/system'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import RoleAddDialog from './modules/role-add-dialog.vue'
  import RolePermPanel from './modules/role-perm-panel.vue'

  defineOptions({ name: 'Role' })

  const listLoading = ref(false)
  const detailLoading = ref(false)
  const saving = ref(false)
  const savedHint = ref(false)
  const addVisible = ref(false)

  const roleList = ref<SystemRoleItem[]>([])
  const selectedId = ref<number | null>(null)
  const selectedRole = ref<SystemRoleItem | null>(null)
  const menuTree = ref<SystemRoleMenuNode[]>([])
  /** rules 中的菜单 id + 按钮 action id（menuId*10+offset） */
  const checkedRuleIds = ref<number[]>([])
  const miniRoles = ref<string[]>([])
  const scrapRoleOptions = ref<ScrapRoleOption[]>([])

  /** 超管角色：level=0，或名称为超级管理员 */
  const isSuperAdmin = computed(() => {
    const role = selectedRole.value
    if (!role) return false
    if (Number(role.level) === 0) return true
    return (role.role_name || '').includes('超级管理员')
  })

  function truncateDesc(desc?: string) {
    if (!desc) return '无描述'
    return desc.length > 14 ? `${desc.slice(0, 14)}…` : desc
  }

  /** 解析 rules 为 id 列表 */
  function parseRuleIds(rules: SystemRoleItem['rules']): number[] {
    if (Array.isArray(rules)) {
      return rules.map(Number).filter((n) => !Number.isNaN(n) && n > 0)
    }
    if (typeof rules === 'string' && rules.trim()) {
      return rules
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((n) => !Number.isNaN(n) && n > 0)
    }
    return []
  }

  /**
   * 保存时补齐祖先菜单 id，保证侧栏菜单路径完整。
   * checked 中已含功能菜单 id 与按钮 action id（menuId*10+1~4）。
   */
  function collectSaveRuleIds(menus: SystemRoleMenuNode[], checked: number[]): number[] {
    const selected = new Set(checked.map(Number))
    const result = new Set(selected)

    const walk = (nodes: SystemRoleMenuNode[]): boolean => {
      let any = false
      for (const node of nodes) {
        const mid = Number(node.id)
        const childAny = node.children?.length ? walk(node.children) : false
        const selfOn = selected.has(mid)
        const actionOn = [1, 2, 3, 4].some((o) => selected.has(mid * 10 + o))
        if (selfOn || childAny || actionOn) {
          result.add(mid)
          any = true
        }
      }
      return any
    }
    walk(menus)
    return [...result]
  }

  async function loadRoleList(preferId?: number) {
    listLoading.value = true
    try {
      const res = await fetchSystemRoleList({ page: 1, limit: 200 })
      roleList.value = res.list
      const targetId =
        preferId && res.list.some((r) => r.id === preferId)
          ? preferId
          : selectedId.value && res.list.some((r) => r.id === selectedId.value)
            ? selectedId.value
            : res.list[0]?.id
      if (targetId) {
        await selectRole(targetId)
      } else {
        selectedId.value = null
        selectedRole.value = null
        menuTree.value = []
        checkedRuleIds.value = []
      }
    } finally {
      listLoading.value = false
    }
  }

  async function loadScrapRoles() {
    try {
      scrapRoleOptions.value = await fetchScrapRoleOptions()
    } catch {
      scrapRoleOptions.value = []
    }
  }

  async function selectRole(id: number) {
    selectedId.value = id
    detailLoading.value = true
    savedHint.value = false
    try {
      const detail = await fetchSystemRoleEdit(id)
      selectedRole.value = detail.role
      menuTree.value = detail.menus || []
      checkedRuleIds.value = parseRuleIds(detail.role.rules)
      // mini_program_roles 存的是小程序角色 id，如 "3,2,1"
      const mini = detail.role.mini_program_roles
      if (Array.isArray(mini)) {
        miniRoles.value = mini.map((v) => String(v).trim()).filter(Boolean)
      } else if (typeof mini === 'string' && mini.trim()) {
        miniRoles.value = mini
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      } else {
        miniRoles.value = []
      }
    } catch {
      menuTree.value = []
      checkedRuleIds.value = []
      miniRoles.value = []
    } finally {
      detailLoading.value = false
    }
  }

  async function handleSave() {
    if (!selectedId.value || !selectedRole.value || isSuperAdmin.value) return
    const checkedMenus = collectSaveRuleIds(menuTree.value, checkedRuleIds.value)

    saving.value = true
    try {
      await fetchSystemRoleSave(selectedId.value, {
        role_name: selectedRole.value.role_name || '',
        role_desc: selectedRole.value.role_desc || '',
        status: selectedRole.value.status ?? 1,
        checked_menus: checkedMenus,
        mini_program_roles: miniRoles.value
      })
      savedHint.value = true
      setTimeout(() => {
        savedHint.value = false
      }, 2000)
      await loadRoleList(selectedId.value)
    } finally {
      saving.value = false
    }
  }

  async function handleAddSuccess() {
    await loadRoleList()
  }

  onMounted(() => {
    loadScrapRoles()
    loadRoleList()
  })
</script>

<style lang="scss">
  @use './role';
</style>
