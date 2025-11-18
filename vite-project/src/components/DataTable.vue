<template>
    <div class="table-container">
        <div class="table-header">
            <div class="search-filter-box">
                <div class="search-box">
                    <input type="text" v-model="searchQuery" placeholder="搜索..." @input="handleSearch"
                        class="search-input" />
                </div>
                <div class="filter-actions">
                    <button class="filter-btn" @click="showFilterDialog = true">
                        <i class="icon-filter"></i>
                        筛选
                    </button>
                    <button v-if="hasActiveFilters" class="clear-filter-btn" @click="clearFilters">
                        清除筛选
                    </button>
                </div>
            </div>
            <!-- 只有在showAddButton为true时才显示添加按钮 -->
            <button v-if="props.showAddButton" class="add-btn" @click="showAddModal = true">
                添加数据
            </button>
        </div>

        <!-- 表格主体 -->
        <table class="data-table">
            <thead>
                <tr>
                    <th v-for="column in columns" :key="column.key">
                        {{ column.title }}
                    </th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredData" :key="item.id">
                    <td v-for="column in columns" :key="column.key">
                        <div class="cell-content">
                            <template v-if="column.key === 'Note' && item[column.key]">
                                <div 
                                    v-if="isRichContent(item[column.key])" 
                                    v-html="item[column.key]"
                                    class="rich-content-display">
                                </div>
                                <div v-else>{{ item[column.key] }}</div>
                            </template>
                            <div v-else>{{ item[column.key] }}</div>
                        </div>
                    </td>
                    <td class="actions">
                        <button class="edit-btn" @click="handleEdit(item)">编辑</button>
                        <button v-if="showProcessButton" class="process-btn"
                            @click="$emit('row-action', 'process', item)">处理</button>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- 分页 -->
        <div class="pagination">
            <button :disabled="currentPage === 1" @click="currentPage--">
                上一页
            </button>
            <span>第 {{ currentPage }} 页</span>
            <button :disabled="currentPage === totalPages" @click="currentPage++">
                下一页
            </button>
        </div>

        <!-- 添加/编辑弹窗 -->
        <div v-if="showAddModal || showEditModal" class="modal" @click.self="closeModal">
            <div class="modal-content" @click.stop>
                <h3>{{ showEditModal ? '编辑数据' : '添加数据' }}</h3>
                <form @submit.prevent="handleSubmit">
                    <!-- 在编辑模式下，只显示备注字段 -->
                    <div v-if="showEditModal">
                        <div class="form-group">
                            <label>备注:</label>
                            <div class="rich-editor-wrapper">
                                <RichEditor 
                                    :content="formData['Note'] || ''" 
                                    @save="(content) => { formData['Note'] = content }"
                                    @cancel="() => {}"
                                    @fileSelectStart="isSelectingFile = true"
                                    @fileSelectEnd="isSelectingFile = false" />
                            </div>
                        </div>
                    </div>

                    <!-- 在添加模式下，显示所有字段 -->
                    <div v-else>
                        <!-- 将表单字段分组，每两个字段一组 -->
                        <div class="form-row" v-for="i in Math.ceil(columns.length / 2)" :key="i">
                            <!-- 第一个字段 -->
                            <div class="form-group" v-if="columns[2 * (i - 1)]">
                                <label>{{ columns[2 * (i - 1)].title }}:</label>
                                <template v-if="columns[2 * (i - 1)].key === 'Note'">
                                    <div class="rich-editor-wrapper">
                                        <RichEditor :content="formData[columns[2 * (i - 1)].key] || ''"
                                            @save="(content) => { formData[columns[2 * (i - 1)].key] = content }"
                                            @cancel="() => { }" @fileSelectStart="isSelectingFile = true"
                                            @fileSelectEnd="isSelectingFile = false" />
                                    </div>
                                </template>
                                <input v-else type="text" v-model="formData[columns[2 * (i - 1)].key]" required />
                            </div>
                            <!-- 第二个字段 -->
                            <div class="form-group" v-if="columns[2 * (i - 1) + 1]">
                                <label>{{ columns[2 * (i - 1) + 1].title }}:</label>
                                <template v-if="columns[2 * (i - 1) + 1].key === 'Note'">
                                    <div class="rich-editor-wrapper">
                                        <RichEditor :content="formData[columns[2 * (i - 1) + 1].key] || ''"
                                            @save="(content) => { formData[columns[2 * (i - 1) + 1].key] = content }"
                                            @cancel="() => { }" @fileSelectStart="isSelectingFile = true"
                                            @fileSelectEnd="isSelectingFile = false" />
                                    </div>
                                </template>
                                <input v-else type="text" v-model="formData[columns[2 * (i - 1) + 1].key]" required />
                            </div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="submit">保存</button>
                        <button type="button" @click="closeModal">取消</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- 筛选弹窗 -->
        <FilterDialog v-model:visible="showFilterDialog" :filters="availableFilters" @apply="handleFilterApply"
            @reset="handleFilterReset" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import FilterDialog from './FilterDialog.vue'
import RichEditor from './RichEditor.vue'

// 引入新的数据服务方法
import { fetchData, addData, updateData, deleteData } from '../services/dataService'
const emit = defineEmits(['save', 'cancel', 'fileSelectStart', 'fileSelectEnd', 'row-action'])

// 接收外部传入的columns和data
const props = defineProps({
    columns: {
        type: Array,
        default: () => []
    },
    data: {
        type: Array,
        default: () => []
    },
    filterableColumns: {
        type: Array,
        default: () => []
    },
    showAddButton: {
        type: Boolean,
        default: true//默认显示添加按钮
    },
    showProcessButton: {
        type: Boolean,
        default: false // 默认不显示处理按钮
    }
})

// 响应式数据
const tableData = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)//每页显示的数据量
const showAddModal = ref(false)
const showEditModal = ref(false)
const showEditNoteModal = ref(false)  // 添加编辑备注弹窗状态
const formData = ref({})
const noteData = ref({})  // 添加备注数据存储


// 筛选相关状态
const showFilterDialog = ref(false)
const activeFilters = ref({})

// 单元格编辑相关状态
const editingCell = ref({
    item: null,
    column: null,
    value: ''
})

const editInputs = ref([])

// 计算可用的筛选选项
const availableFilters = computed(() => {
    const filters = {}
    props.columns.forEach(column => {
        if (props.filterableColumns && props.filterableColumns.includes(column.title)) {
            const values = [...new Set(tableData.value.map(item => item[column.key]))]
            filters[column.key] = {
                title: column.title,
                values: values.filter(value => value)
            }
        }
    })
    return filters
})

// 更新筛选处理方法
const handleFilterApply = (filters) => {
    activeFilters.value = { ...filters }
    currentPage.value = 1
}

const handleFilterReset = () => {
    activeFilters.value = {}
    currentPage.value = 1
}

const clearFilters = () => {
    activeFilters.value = {}
    currentPage.value = 1
}

// 是否有激活的筛选条件
const hasActiveFilters = computed(() => {
    return Object.values(activeFilters.value).some(value => value !== '')
})

// 更新 filteredData 计算属性
const filteredData = computed(() => {
    let result = [...tableData.value]

    // 应用搜索条件
    if (searchQuery.value) {
        result = result.filter(item => {
            return Object.values(item).some(value =>
                value.toString().toLowerCase().includes(searchQuery.value.toLowerCase())
            )
        })
    }

    // 应用筛选条件
    Object.entries(activeFilters.value).forEach(([key, value]) => {
        if (value) {
            result = result.filter(item => item[key] === value)
        }
    })

    // 应用分页
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return result.slice(start, end)
})


const totalPages = computed(() => {
    return Math.ceil(tableData.value.length / pageSize.value)
})

// 方法
const handleSearch = () => {
    currentPage.value = 1
}

const handleEdit = (item) => {
    formData.value = { ...item }
    showEditModal.value = true
}

//后端测试用的删除方法
const handleDelete = async (id) => {
    if (confirm('确定要删除这条数据吗？')) {
        try {
            await deleteData(id)
            // 重新加载数据
            await loadData()
        } catch (error) {
            console.error('删除数据失败:', error)
            alert('删除数据失败: ' + error.message)
        }
    }
}

//后测试加载数据
const loadData = async () => {
    try {
        const data = await fetchData()
        tableData.value = data
    } catch (error) {
        console.error('加载数据失败:', error)
    }
}

//前端测试用的删除方法
// const handleDelete = (id) => {
//     if (confirm('确定要删除这条数据吗？')) {
//         tableData.value = tableData.value.filter(item => item.id !== id)
//     }
// }

//后端测试用的提交方法

//后端测试用的提交方法
const handleSubmit = async () => {
    try {
        if (showEditModal.value) {
            // 更新数据
            await updateData(formData.value.id, formData.value)
        } else {
            // 添加数据
            await addData(formData.value)
        }

        // 重新加载数据
        await loadData()
        closeModal()
    } catch (error) {
        console.error('保存数据失败:', error)
        alert('保存数据失败: ' + error.message)
    }
}

//前端测试用的提交方法
// const handleSubmit = () => {
//     if (showEditModal.value) {
//         const index = tableData.value.findIndex(item => item.id === formData.value.id)
//         if (index !== -1) {
//             tableData.value[index] = { ...formData.value }
//         }
//     } else {
//         const newId = tableData.value.length > 0
//             ? Math.max(...tableData.value.map(item => item.id)) + 1
//             : 1
//         tableData.value.push({ ...formData.value, id: newId })
//     }
//     closeModal()
// }

// 添加一个新的响应式变量来跟踪模态框是否应该关闭

const shouldCloseModal = ref(false)

// 处理模态框获得焦点
const onModalFocusIn = () => {
    //shouldCloseModal.value = false
}

// 处理模态框失去焦点
const onModalFocusOut = () => {
    // 设置一个标志，表示模态框应该关闭
    shouldCloseModal.value = true
    // 延迟执行关闭操作，给文件选择对话框一些时间
    setTimeout(() => {
        if (shouldCloseModal.value) {
            // 只有在标志仍然为true时才关闭模态框
            // 这允许我们在文件选择对话框打开时重置标志
        }
    }, 100)
}

// 响应式变量来跟踪是否正在选择文件
const isSelectingFile = ref(false)

/**
 * 监听isSelectingFile状态变化，防止在文件选择过程中模态框意外关闭
 * 当开始选择文件时，阻止模态框关闭；选择完成后恢复正常的关闭行为
 */
watch(isSelectingFile, (newValue) => {
    if (!newValue) {
        // 文件选择结束后，延时重置状态，确保对话框完全关闭
        setTimeout(() => {
            isSelectingFile.value = false;
        }, 500);
    }
});

// closeModal 方法
const closeModal = (event) => {
    // 如果事件存在且是点击事件，阻止事件冒泡
    if (event && event.stopPropagation) {
        event.stopPropagation();
    }

    // 如果正在选择文件，则不关闭模态框
    if (isSelectingFile.value) {
        // 重置文件选择状态，确保下次可以正常关闭
        return;
    }

    showAddModal.value = false;
    showEditModal.value = false;
    formData.value = {};
};

// 添加一个方法来防止模态框在文件选择期间关闭
const preventModalClose = () => {
    shouldCloseModal.value = false
}

// 单元格编辑方法
const isEditingCell = (item, column) => {
    return editingCell.value.item === item && editingCell.value.column === column
}

const handleCellClick = (item, column, event) => {
    // 只有备注列可以编辑
    if (column.key === 'Note') {
        // 清空之前的引用
        editInputs.value = []

        editingCell.value = {
            item: item,
            column: column,
            value: item[column.key] || ''
        }

        nextTick(() => {
            // 确保编辑器正确聚焦
            setTimeout(() => {
                if (editInputs.value && editInputs.value.length > 0) {
                    const editor = editInputs.value[0];
                    if (editor && typeof editor.focus === 'function') {
                        editor.focus();
                    }
                }
            }, 50);
        })
    }
}


const saveCellEdit = () => {
    if (editingCell.value.item && editingCell.value.column) {
        const itemIndex = tableData.value.findIndex(item => item.id === editingCell.value.item.id)
        if (itemIndex !== -1) {
            tableData.value[itemIndex][editingCell.value.column.key] = editingCell.value.value
        }
    }
    editingCell.value = {
        item: null,
        column: null,
        value: ''
    }
}

const saveRichContent = (content) => {
    if (editingCell.value.item && editingCell.value.column) {
        const itemIndex = tableData.value.findIndex(item => item.id === editingCell.value.item.id)
        if (itemIndex !== -1) {
            tableData.value[itemIndex][editingCell.value.column.key] = content
        }
    }
    editingCell.value = {
        item: null,
        column: null,
        value: ''
    }
}

const cancelRichEdit = () => {
    editingCell.value = {
        item: null,
        column: null,
        value: ''
    }
}
// 检查内容是否为富文本、照片（包含HTML标签）
const isRichContent = (content) => {
    const isRich = /<[a-z][\s\S]*>/i.test(content);
    console.log('检查内容是否为富文本:', { content, isRich });
    return isRich;
}

// 后端测试用的初始化数据部分
onMounted(async () => {
    await loadData()
})

// 前端测试初始化数据
// onMounted(() => {
//     // 数据通过props传入，通过watch监听处理
// })

// 监听传入数据的变化
watch(() => props.data, (newData) => {
    if (newData && newData.length > 0) {
        tableData.value = newData
    }
}, { immediate: true })
</script>

<style scoped>
/* 表格容器样式 */
.table-container {
    width: 100%;
    /* 确保容器占满父元素宽度 */
    max-width: none;
    margin: 0;
    padding: 24px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 0 8px;
    width: 100%;
}

.search-filter-box {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.search-box {
    flex: 1;
    max-width: 400px;
}

.filter-actions {
    display: flex;
    gap: 12px;
    align-items: center;
}

.search-box input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
}

.add-btn {
    padding: 12px 24px;
    background-color: #409EFF;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
    margin-left: 20px;
}

.filter-btn,
.clear-filter-btn {
    padding: 12px 24px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s;
}

.add-btn:hover {
    background-color: #66b1ff;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
}

.data-table th,
.data-table td {
    padding: 16px;
    text-align: left;
    border-bottom: 1px solid #ebeef5;
}

.data-table th {
    background-color: #f5f5f5;
    color: #606266;
    font-weight: 600;
}

.data-table tr:hover {
    background-color: #f5f7fa;
}

.actions {
    display: flex;
    gap: 12px;
}

.edit-btn,
.delete-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: opacity 0.3s;
}

.edit-btn {
    background-color: #409EFF;
    color: white;
}

.delete-btn {
    background-color: #f56c6c;
    color: white;
}

.edit-btn:hover,
.delete-btn:hover {
    opacity: 0.8;
}

.pagination {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    padding: 16px;
}

.pagination button {
    padding: 12px 24px;
    border: 1px solid #dcdfe6;
    background-color: #fff;
    color: #606266;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.3s;
}

.pagination button:hover:not(:disabled) {
    color: #409EFF;
    border-color: #409EFF;
}

.pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    /* 禁止点击背景关闭 */
    pointer-events: none;
}

.modal-content {
    background-color: #fff;
    padding: 30px;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    /* 允许点击内容区域 */
    pointer-events: auto;
}

/* 表单行样式 */
.form-row {
    display: flex;
    gap: 20px;
    margin-bottom: 16px;
}

/* 表单组样式 */
.form-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-size: 14px;
    color: #606266;
    margin-bottom: 4px;
}

/* 编辑弹窗中的输入框设置 */
.form-group input {
    width: 90%;
    padding: 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
}

/* 弹窗内容样式调整 */
.modal-content {
    max-width: 1000px;
    /* 增加宽度以适应两列布局 */
    width: 90%;
    padding: 24px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.rich-editor-wrapper {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 5px;
}

/* 按钮组样式 */
.modal-actions button {
    padding: 12px 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.modal-actions button[type="submit"] {
    background-color: #409EFF;
    color: white;
}

.modal-actions button[type="button"] {
    background-color: #f5f5f5;
    color: #606266;
}

/* 筛选框样式 */
.action-buttons {
    display: flex;
    gap: 12px;
    align-items: center;
}

.filter-btn,
.clear-filter-btn {
    padding: 12px 24px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s;
}

.filter-btn:hover {
    color: #409EFF;
    border-color: #409EFF;
}

.clear-filter-btn {
    color: #f56c6c;
    border-color: #f56c6c;
}

.clear-filter-btn:hover {
    background: #fef0f0;
}

.icon-filter {
    display: inline-block;
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 6px solid currentColor;
}

.process-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: opacity 0.3s;
    background-color: #67c23a;
    color: white;
    margin-left: 5px;
}

.process-btn:hover {
    opacity: 0.8;
}

/* 备注富文本显示的样式 */
.rich-content-display img {
    max-width: 100px;
    max-height: 100px;
    width: auto;
    height: auto;
    display: block;
    margin: 2px 0;
}

.rich-content-display {
    white-space: pre-wrap;
    word-break: break-word;
}

</style>
