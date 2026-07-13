<template>
  <div class="role-perm-panel">
    <div v-for="top in menus" :key="top.id" class="perm-group">
      <!-- 无子级：顶级本身就是功能菜单 -->
      <div v-if="!top.children?.length" class="perm-row perm-row--root">
        <ElCheckbox
          :model-value="isMenuChecked(top)"
          :indeterminate="isMenuIndeterminate(top)"
          @change="(v: CheckboxValueType) => toggleMenu(top, !!v)"
        />
        <span class="perm-row-label">{{ top.title || top.menu_name || `菜单${top.id}` }}</span>
        <div class="perm-btns">
          <label v-for="btn in getEnabledBtns(top)" :key="btn.offset" class="perm-btn-item">
            <ElCheckbox
              :model-value="checked.has(actionId(top.id, btn.offset))"
              @change="(v: CheckboxValueType) => toggleAction(top, btn.offset, !!v)"
            />
            <span>{{ btn.label }}</span>
          </label>
        </div>
      </div>

      <template v-else>
        <!-- 一级：主菜单全选 -->
        <div class="perm-group-head">
          <ElCheckbox
            :model-value="isTopChecked(top)"
            :indeterminate="isTopIndeterminate(top)"
            @change="(v: CheckboxValueType) => toggleTop(top, !!v)"
          />
          <span class="perm-group-title">{{ top.title || top.menu_name || `菜单${top.id}` }}</span>
        </div>

        <!-- 二级：功能菜单 + 按钮权限 -->
        <div v-for="row in getPermRows(top)" :key="row.id" class="perm-row">
          <ElCheckbox
            :model-value="isMenuChecked(row)"
            :indeterminate="isMenuIndeterminate(row)"
            @change="(v: CheckboxValueType) => toggleMenu(row, !!v)"
          />
          <span class="perm-row-label">{{ row.title || row.menu_name || `菜单${row.id}` }}</span>
          <div class="perm-btns">
            <label v-for="btn in getEnabledBtns(row)" :key="btn.offset" class="perm-btn-item">
              <ElCheckbox
                :model-value="checked.has(actionId(row.id, btn.offset))"
                @change="(v: CheckboxValueType) => toggleAction(row, btn.offset, !!v)"
              />
              <span>{{ btn.label }}</span>
            </label>
          </div>
        </div>
      </template>
    </div>
    <div v-if="!menus.length" class="perm-empty">暂无权限菜单</div>
  </div>
</template>

<script setup lang="ts">
  import type { CheckboxValueType } from 'element-plus'
  import type { SystemRoleMenuNode } from '@/types/recycle/system'

  const props = defineProps<{
    menus: SystemRoleMenuNode[]
    modelValue: number[]
  }>()

  const emit = defineEmits<{
    'update:modelValue': [number[]]
  }>()

  const BTN_OPTIONS = [
    { key: 'btn_view', label: '查看', offset: 1 },
    { key: 'btn_add', label: '新增', offset: 2 },
    { key: 'btn_edit', label: '编辑', offset: 3 },
    { key: 'btn_delete', label: '删除', offset: 4 }
  ] as const

  const checked = computed(() => new Set(props.modelValue.map(Number)))

  function actionId(menuId: number, offset: number) {
    return Number(menuId) * 10 + offset
  }

  function getEnabledBtns(node: SystemRoleMenuNode) {
    return BTN_OPTIONS.filter((b) => Number(node[b.key]) === 1)
  }

  /** 收集某顶级下用于配置的功能菜单行（叶子，或自身无子级） */
  function getPermRows(top: SystemRoleMenuNode): SystemRoleMenuNode[] {
    if (!top.children?.length) return [top]
    const rows: SystemRoleMenuNode[] = []
    const walk = (nodes: SystemRoleMenuNode[]) => {
      for (const node of nodes) {
        if (node.children?.length) walk(node.children)
        else rows.push(node)
      }
    }
    walk(top.children)
    return rows
  }

  function menuRelatedIds(node: SystemRoleMenuNode): number[] {
    const mid = Number(node.id)
    const ids = [mid]
    for (const btn of getEnabledBtns(node)) {
      ids.push(actionId(mid, btn.offset))
    }
    return ids
  }

  function setChecked(next: Set<number>) {
    emit('update:modelValue', [...next])
  }

  function isMenuFullyChecked(node: SystemRoleMenuNode) {
    const mid = Number(node.id)
    if (!checked.value.has(mid)) return false
    return getEnabledBtns(node).every((b) => checked.value.has(actionId(mid, b.offset)))
  }

  function isMenuChecked(node: SystemRoleMenuNode) {
    return isMenuFullyChecked(node)
  }

  function isMenuIndeterminate(node: SystemRoleMenuNode) {
    const mid = Number(node.id)
    const btns = getEnabledBtns(node)
    const menuOn = checked.value.has(mid)
    const actionOn = btns.filter((b) => checked.value.has(actionId(mid, b.offset))).length
    if (isMenuFullyChecked(node)) return false
    return menuOn || actionOn > 0
  }

  function isTopChecked(top: SystemRoleMenuNode) {
    const rows = getPermRows(top)
    return rows.length > 0 && rows.every((r) => isMenuFullyChecked(r))
  }

  function isTopIndeterminate(top: SystemRoleMenuNode) {
    if (isTopChecked(top)) return false
    const rows = getPermRows(top)
    return rows.some((r) => {
      const mid = Number(r.id)
      return (
        checked.value.has(mid) ||
        getEnabledBtns(r).some((b) => checked.value.has(actionId(mid, b.offset)))
      )
    })
  }

  function toggleMenu(node: SystemRoleMenuNode, on: boolean) {
    const next = new Set(checked.value)
    const ids = menuRelatedIds(node)
    if (on) ids.forEach((id) => next.add(id))
    else ids.forEach((id) => next.delete(id))
    setChecked(next)
  }

  function toggleAction(node: SystemRoleMenuNode, offset: number, on: boolean) {
    const next = new Set(checked.value)
    const mid = Number(node.id)
    const aid = actionId(mid, offset)
    if (on) {
      next.add(aid)
      next.add(mid)
    } else {
      next.delete(aid)
      // 若所有按钮都未勾选且菜单本身也不再需要，保留菜单勾选由左侧菜单框控制
      // 取消最后一个按钮时：若菜单仍在集合中且无任何按钮，保持菜单 id（仅菜单访问）
    }
    setChecked(next)
  }

  function toggleTop(top: SystemRoleMenuNode, on: boolean) {
    const next = new Set(checked.value)
    for (const row of getPermRows(top)) {
      const ids = menuRelatedIds(row)
      if (on) ids.forEach((id) => next.add(id))
      else ids.forEach((id) => next.delete(id))
    }
    // 顶级目录 id 也纳入，便于保存后菜单路径可见
    const topId = Number(top.id)
    if (on) next.add(topId)
    else next.delete(topId)
    setChecked(next)
  }
</script>
