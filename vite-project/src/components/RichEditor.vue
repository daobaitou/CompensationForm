<template>
  <div class="rich-editor">
    <div class="editor-toolbar">
      <button @click="addText" title="添加文本">T</button>
      <button @click="addImage" title="添加图片">🖼️</button>
      <button @click="saveContent" title="保存">💾</button>
      <button @click="cancelEdit" title="取消">❌</button>
    </div>
    <div       
      class="editor-content" 
      ref="editorContent" 
      contenteditable 
      @input="onContentChange"
      @focus="onFocus"
      @blur="onBlur">
    </div>
    <input 
      type="file" 
      ref="fileInput" 
      accept="image/*" 
      style="display: none" 
      @change="handleImageUpload"
      @click.stop
    >
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['save', 'cancel', 'fileSelectStart', 'fileSelectEnd'])

const editorContent = ref(null)
const fileInput = ref(null)
const currentContent = ref('')
const isFocused = ref(false)

// 定义focus方法，供父组件调用
defineExpose({
  focus: () => {
    if (editorContent.value) {
      editorContent.value.focus();
      // 将光标移到内容末尾
      const range = document.createRange();
      range.selectNodeContents(editorContent.value);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
})

onMounted(() => {
  if (props.content) {
    editorContent.value.innerHTML = props.content
  }
  currentContent.value = props.content || ''
})


const onFocus = () => {
  isFocused.value = true
}

const onBlur = () => {
  //延迟处理blur事件，避免文件选择对话框导致的焦点丢失
  setTimeout(() => {
    isFocused.value = false
  }, 300);
}

const onContentChange = () => {
  currentContent.value = editorContent.value.innerHTML
}

const addText = () => {
  const selection = window.getSelection()
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const textNode = document.createTextNode('请输入文本')
    range.insertNode(textNode)
    
    // 将光标移到新插入的文本后面
    range.setStartAfter(textNode)
    range.setEndAfter(textNode)
    selection.removeAllRanges()
    selection.addRange(range)
  }
  
  // 保持编辑器焦点
  if (editorContent.value) {
    editorContent.value.focus()
  }
}

const addImage = () => {
  // 通知父组件我们正在选择文件
  emit('fileSelectStart')
  // 打开文件选择对话框
  fileInput.value.click()
}

const handleImageUpload = (event) => {
  console.log('开始处理图片上传:', event);
  // 通知父组件文件选择已完成
  emit('fileSelectEnd')
  
  const file = event.target.files[0]
  console.log('选中的文件:', file);
  
  if (file && file.type.startsWith('image/')) {
    console.log('文件是图片，开始读取');
    const reader = new FileReader()
    reader.onload = (e) => {
      console.log('文件读取完成，开始创建图片元素');
      const img = document.createElement('img')
      img.src = e.target.result
      img.style.maxWidth = '200px'
      img.style.maxHeight = '200px'
      img.style.width = 'auto'
      img.style.height = 'auto'
      img.style.display = 'block'
      img.style.margin = '5px 0'
      img.setAttribute('contenteditable', 'false')
      
      console.log('图片元素创建完成:', img);
      
      const selection = window.getSelection()
      console.log('当前选区信息:', selection);
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        console.log('当前范围信息:', range);
        
        // 如果选区在编辑器内
        if (editorContent.value.contains(range.commonAncestorContainer)) {
          console.log('选区在编辑器内，插入图片');
          // 删除选区内容（如果有）
          range.deleteContents()
          
          // 插入图片
          range.insertNode(img)
          
          // 创建一个新的文本节点并插入到图片后面
          const spacer = document.createTextNode('\u200B') // 零宽空格
          range.setStartAfter(img)
          range.collapse(false)
          range.insertNode(spacer)
          
          // 将光标移到图片后面
          range.setStartAfter(spacer)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
          console.log('图片插入完成，光标已定位');
        } else {
          console.log('选区不在编辑器内，将图片添加到编辑器末尾');
          // 如果没有有效选区，将图片添加到编辑器末尾
          editorContent.value.appendChild(img)
          // 添加零宽空格节点
          const spacer = document.createTextNode('\u200B')
          editorContent.value.appendChild(spacer)
          
          // 将光标移到末尾
          const range = document.createRange()
          range.selectNodeContents(editorContent.value)
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
          console.log('图片已添加到末尾');
        }
      } else {
        console.log('没有选区，将图片添加到编辑器末尾');
        // 如果没有选区，将图片添加到编辑器末尾
        editorContent.value.appendChild(img)
        // 添加零宽空格节点
        const spacer = document.createTextNode('\u200B')
        editorContent.value.appendChild(spacer)
        
        // 将光标移到末尾
        const range = document.createRange()
        range.selectNodeContents(editorContent.value)
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
        console.log('图片已添加到末尾');
      }
      
      // 更新内容
      onContentChange()
      console.log('内容已更新');
      
      // 确保编辑器保持焦点
      nextTick(() => {
        if (editorContent.value) {
          editorContent.value.focus()
          console.log('编辑器已获得焦点');
        }
      })
    }
    reader.readAsDataURL(file)
  }
  // 重置文件输入，但稍后执行以确保上传完成
  setTimeout(() => {
    if (event.target) {
      event.target.value = ''
      console.log('文件输入已重置');
    }
  }, 100)
}

const saveContent = () => {
  emit('save', editorContent.value.innerHTML)
}

const cancelEdit = () => {
  emit('cancel')
}
</script>

<style scoped>
.rich-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 100px;
  width: 100%;
}

.editor-toolbar {
  display: flex;
  border-bottom: 1px solid #dcdfe6;
  padding: 5px;
  background-color: #f5f7fa;
}

.editor-toolbar button {
  background: white;
  border: 1px solid #dcdfe6;
  margin-right: 5px;
  cursor: pointer;
  border-radius: 3px;
  padding: 3px 8px;
}

.editor-toolbar button:hover {
  background-color: #ecf5ff;
}

.editor-content {
  min-height: 80px;
  padding: 10px;
  outline: none;
}

.editor-content img {
  max-width: 200px;
  max-height: 200px;
  width: auto;
  height: auto;
  display: block;
  margin: 5px 0;
}

.editor-content:empty::before {
  content: "请输入内容...";
  color: #c0c4cc;
}
</style>