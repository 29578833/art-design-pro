<!-- WangEditor 富文本编辑器 插件地址：https://www.wangeditor.com/ -->
<template>
  <div class="editor-wrapper" :class="{ 'editor-fill': fill }">
    <Toolbar
      class="editor-toolbar"
      :editor="editorRef"
      :mode="mode"
      :defaultConfig="toolbarConfig"
    />
    <Editor
      class="editor-body"
      :style="{ height: fill ? '100%' : height, overflowY: 'hidden' }"
      v-model="modelValue"
      :mode="mode"
      :defaultConfig="editorConfig"
      @onCreated="onCreateEditor"
    />
  </div>
</template>

<script setup lang="ts">
  import '@wangeditor/editor/dist/css/style.css'
  import { onBeforeUnmount, onMounted, shallowRef, computed } from 'vue'
  import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
  import EmojiText from '@/utils/ui/emojo'
  import { IDomEditor, IToolbarConfig, IEditorConfig } from '@wangeditor/editor'
  import { uploadFileGetUrl } from '@/api/upload'

  defineOptions({ name: 'ArtWangEditor' })

  type InsertFnType = (url: string, alt: string, href: string) => void

  /** 默认排除：字体 + 视频相关 */
  const DEFAULT_EXCLUDE_KEYS = ['fontFamily', 'group-video', 'insertVideo', 'uploadVideo']

  // Props 定义
  interface Props {
    /** 编辑器高度 */
    height?: string
    /** 自定义工具栏配置 */
    toolbarKeys?: string[]
    /** 插入新工具到指定位置 */
    insertKeys?: { index: number; keys: string[] }
    /** 排除的工具栏项（会与默认排除项合并） */
    excludeKeys?: string[]
    /** 编辑器模式 */
    mode?: 'default' | 'simple'
    /** 占位符文本 */
    placeholder?: string
    /** 是否自动撑满父容器剩余高度 */
    fill?: boolean
    /** 上传配置 */
    uploadConfig?: {
      maxFileSize?: number
      maxNumberOfFiles?: number
      fieldName?: string
      /** 附件分类 ID */
      pid?: number
    }
  }

  const props = withDefaults(defineProps<Props>(), {
    height: '500px',
    mode: 'default',
    placeholder: '请输入内容...',
    excludeKeys: () => [],
    fill: false
  })

  const modelValue = defineModel<string>({ required: true })

  // 编辑器实例
  const editorRef = shallowRef<IDomEditor>()

  // 常量配置
  const DEFAULT_UPLOAD_CONFIG = {
    maxFileSize: 3 * 1024 * 1024, // 3MB
    maxNumberOfFiles: 10,
    fieldName: 'file',
    allowedFileTypes: ['image/*'],
    pid: 0
  } as const

  // 合并上传配置
  const mergedUploadConfig = computed(() => ({
    ...DEFAULT_UPLOAD_CONFIG,
    ...props.uploadConfig
  }))

  // 工具栏配置
  const toolbarConfig = computed((): Partial<IToolbarConfig> => {
    const config: Partial<IToolbarConfig> = {}

    if (props.toolbarKeys && props.toolbarKeys.length > 0) {
      config.toolbarKeys = props.toolbarKeys
    }

    if (props.insertKeys) {
      config.insertKeys = props.insertKeys
    }

    // 默认去掉视频工具，并合并外部 excludeKeys
    config.excludeKeys = [...new Set([...DEFAULT_EXCLUDE_KEYS, ...(props.excludeKeys || [])])]

    return config
  })

  // 编辑器配置：图片上传走项目统一 /file/upload
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: props.placeholder,
    MENU_CONF: {
      uploadImage: {
        fieldName: mergedUploadConfig.value.fieldName,
        maxFileSize: mergedUploadConfig.value.maxFileSize,
        maxNumberOfFiles: mergedUploadConfig.value.maxNumberOfFiles,
        allowedFileTypes: mergedUploadConfig.value.allowedFileTypes,
        async customUpload(file: File, insertFn: InsertFnType) {
          try {
            const url = await uploadFileGetUrl(file, {
              fieldName: mergedUploadConfig.value.fieldName,
              pid: mergedUploadConfig.value.pid,
              showSuccessMessage: false
            })
            insertFn(url, file.name, url)
            ElMessage.success(`图片上传成功 ${EmojiText[200]}`)
          } catch (error) {
            console.error('图片上传失败:', error)
            ElMessage.error(`图片上传失败 ${EmojiText[500]}`)
          }
        }
      }
    }
  }

  // 编辑器创建回调
  const onCreateEditor = (editor: IDomEditor) => {
    editorRef.value = editor
    applyCustomIcons()
  }

  // 应用自定义图标（带重试机制）
  const applyCustomIcons = () => {
    let retryCount = 0
    const maxRetries = 10
    const retryDelay = 100

    const tryApplyIcons = () => {
      const editor = editorRef.value
      if (!editor) {
        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(tryApplyIcons, retryDelay)
        }
        return
      }

      const editorContainer = editor.getEditableContainer().closest('.editor-wrapper')
      if (!editorContainer) {
        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(tryApplyIcons, retryDelay)
        }
        return
      }

      const toolbar = editorContainer.querySelector('.w-e-toolbar')
      const toolbarButtons = editorContainer.querySelectorAll('.w-e-bar-item button[data-menu-key]')

      if (toolbar && toolbarButtons.length > 0) {
        return
      }

      if (retryCount < maxRetries) {
        retryCount++
        setTimeout(tryApplyIcons, retryDelay)
      } else {
        console.warn('工具栏渲染超时，无法应用自定义图标 - 编辑器实例:', editor.id)
      }
    }

    requestAnimationFrame(tryApplyIcons)
  }

  defineExpose({
    getEditor: () => editorRef.value,
    setHtml: (html: string) => editorRef.value?.setHtml(html),
    getHtml: () => editorRef.value?.getHtml(),
    clear: () => editorRef.value?.clear(),
    focus: () => editorRef.value?.focus()
  })

  onMounted(() => {
    // 图标替换已在 onCreateEditor 中处理
  })

  onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor) {
      editor.destroy()
    }
  })
</script>

<style lang="scss">
  @use './style';
</style>
