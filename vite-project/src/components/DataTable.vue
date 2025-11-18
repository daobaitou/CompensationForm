<template>
    <div class="table-container">
        <div class="table-header">
            <div class="search-filter-box">
                <div class="search-box">
                    <input type="text" v-model="searchQuery" placeholder="搜索..." @input="handleSearch"
                        class="search-input" />
                </div>

                <!-- 平铺筛选器 -->
                <div class="inline-filters">
                    <div class="filter-group">
                        <label>时间:</label>
                        <select v-model="inlineFilters.time" class="filter-select" @change="applyFilters">
                            <option value="">全部时间</option>
                            <option v-for="time in getTimeOptions()" :key="time" :value="time">
                                {{ time }}
                            </option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label>订单ID:</label>
                        <select v-model="inlineFilters.payId" class="filter-select" @change="applyFilters">
                            <option value="">全部订单</option>
                            <option v-for="id in getPayIdOptions()" :key="id" :value="id">
                                {{ id }}
                            </option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label>姓名:</label>
                        <select v-model="inlineFilters.name" class="filter-select" @change="applyFilters">
                            <option value="">全部姓名</option>
                            <option v-for="name in getNameOptions()" :key="name" :value="name">
                                {{ name }}
                            </option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label>电话:</label>
                        <select v-model="inlineFilters.phone" class="filter-select" @change="applyFilters">
                            <option value="">全部电话</option>
                            <option v-for="phone in getPhoneOptions()" :key="phone" :value="phone">
                                {{ phone }}
                            </option>
                        </select>
                    </div>

                    <button v-if="hasActiveInlineFilters" class="clear-filter-btn" @click="clearInlineFilters">
                        清除筛选
                    </button>
                </div>
                <!-- 隐藏原来的筛选按钮 -->
                <!-- <div class="filter-actions">
                    <button class="filter-btn" @click="showFilterDialog = true">
                        <i class="icon-filter"></i>
                        筛选
                    </button>
                    <button v-if="hasActiveFilters" class="clear-filter-btn" @click="clearFilters">
                        清除筛选
                    </button>
                </div> -->

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
                                <div v-if="isRichContent(item[column.key])" v-html="item[column.key]"
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
                                <RichEditor :content="formData['Note'] || ''"
                                    @save="(content) => { formData['Note'] = content }" @cancel="() => { }"
                                    @fileSelectStart="isSelectingFile = true"
                                    @fileSelectEnd="isSelectingFile = false" />
                            </div>
                        </div>
                    </div>

                    <!-- 在添加模式下，显示所有字段 -->
                    <div v-else>
                        <!-- 自定义添加表单字段，每行两个字段 -->
                        <div class="form-row">
                            <div class="form-group">
                                <label>支付编码:</label>
                                <input type="text" v-model="formData.pay_id" required />
                            </div>
                            <div class="form-group">
                                <label>投诉渠道:</label>
                                <select v-model="formData['Complaint channel']" required>
                                    <option value="">请选择投诉渠道</option>
                                    <option value="学校">学校</option>
                                    <option value="监管部门">监管部门</option>
                                    <option value="微信公众号">微信公众号</option>
                                    <option value="电话">电话</option>
                                    <option value="小程序">小程序</option>
                                    <option value="商户号">商户号</option>
                                    <option value="企微">企微</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>电话:</label>
                                <input type="text" v-model="formData.phone" required />
                            </div>
                            <div class="form-group">
                                <label>订单金额:</label>
                                <input type="text" v-model="formData['Order Amount']" required />
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>情况说明:</label>
                                <input type="text" v-model="formData['Situation Explanation']" required />
                            </div>
                            <div class="form-group">
                                <label>日期:</label>
                                <input type="date" v-model="formData.time" required />
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group full-width">
                                <label>备注:</label>
                                <div class="rich-editor-wrapper">
                                    <RichEditor :content="formData['Note'] || ''"
                                        @save="(content) => { formData['Note'] = content }" @cancel="() => { }"
                                        @fileSelectStart="isSelectingFile = true"
                                        @fileSelectEnd="isSelectingFile = false" />
                                </div>
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
        <!-- <FilterDialog v-model:visible="showFilterDialog" :filters="availableFilters" @apply="handleFilterApply"
            @reset="handleFilterReset" /> -->
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
const showFilterPanel = ref(false)

// 平铺筛选器状态
const inlineFilters = ref({
    time: '',
    payId: '',
    name: '',
    phone: ''
})

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


// 获取时间选项
const getTimeOptions = () => {
    const times = [...new Set(tableData.value.map(item => item.time || ''))]
    return times.filter(time => time)
}

// 获取订单ID选项
const getPayIdOptions = () => {
    const payIds = [...new Set(tableData.value.map(item => item.pay_id || ''))]
    return payIds.filter(id => id)
}

// 获取姓名选项（这里假设姓名在Indemnitor字段）
const getNameOptions = () => {
    const names = [...new Set(tableData.value.map(item => item.Indemnitor || ''))]
    return names.filter(name => name)
}

// 获取电话选项
const getPhoneOptions = () => {
    const phones = [...new Set(tableData.value.map(item => item.phone || ''))]
    return phones.filter(phone => phone)
}

// 是否有激活的平铺筛选条件
const hasActiveInlineFilters = computed(() => {
    return Object.values(inlineFilters.value).some(value => value !== '')
})

// 更新筛选处理方法
const handleFilterApply = (filters) => {
    activeFilters.value = { ...filters }
    currentPage.value = 1
}

// 清除平铺筛选器
const clearInlineFilters = () => {
    inlineFilters.value = {
        time: '',
        payId: '',
        name: '',
        phone: ''
    }
    // 需要添加这行来触发数据刷新
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

    // 应用平铺筛选条件
    if (inlineFilters.value.time) {
        result = result.filter(item => item.time === inlineFilters.value.time)
    }

    if (inlineFilters.value.payId) {
        result = result.filter(item => item.pay_id === inlineFilters.value.payId)
    }

    if (inlineFilters.value.name) {
        result = result.filter(item => item.Indemnitor === inlineFilters.value.name)
    }

    if (inlineFilters.value.phone) {
        result = result.filter(item => item.phone === inlineFilters.value.phone)
    }

    // 应用分页
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return result.slice(start, end)
})

const applyFilters = () => {
    currentPage.value = 1
}

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



//后端测试用的提交方法
const handleSubmit = async () => {
    try {
        if (showEditModal.value) {
            // 更新数据
            await updateData(formData.value.id, formData.value)
        } else {
            // 添加数据
            // 为新数据设置默认值
            const newData = {
                ...formData.value,
                status: formData.value.status || '未处理订单/投诉', // 正确的默认状态值
                Indemnitor: formData.value.Indemnitor || '',
                'Compensation Amount': formData.value['Compensation Amount'] || '0.00'
            };
            await addData(newData)
        }

        // 重新加载数据
        await loadData()
        closeModal()
    } catch (error) {
        console.error('保存数据失败:', error)
        alert('保存数据失败: ' + error.message)
    }
}


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

/* .search-filter-box 样式 */
.search-filter-box {
    display: flex;
    align-items: flex-start;
    gap: 100px;/* 搜索框和筛选器之间的间距 */
    flex: 1;
    min-height: 34px; /* 确保最小高度 */
}

/* 搜索框样式 */
.search-box {
    flex: 1;
    max-width: 300px;
}

.filter-actions {
    display: flex;
    gap: 12px;
    align-items: center;
}

.search-box input {
    width: 100%;
    padding: 10px 14px; /* 统一内边距 */
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    height: 36px; /* 固定高度 */
    box-sizing: border-box;
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

.form-group select {
    width: 100%;
    padding: 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    background-color: white;
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

/* 筛选器容器样式 */
.inline-filters {
    display: flex;
    gap: 15px;
    align-items: center;
    flex-wrap: wrap;
    padding: 2px 0; /* 调整上下内边距 */
}

.filter-group {
    display: flex;
    align-items: center; /* 垂直居中对齐 */
    gap: 5px; /* label和select之间的间距 */
    white-space: nowrap; /* 防止换行 */
}

.filter-group label {
    font-size: 13px;
    color: #606266;
    font-weight: 500;
    margin-right: 5px; /* 与选择框的间距 */
    white-space: nowrap; /* 防止换行 */
}

.filter-select {
    padding: 8px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 13px;
    min-width: 110px;
    background-color: white;
    cursor: pointer;
    transition: border-color 0.3s;
    height: 36px; /* 固定高度与搜索框一致 */
    box-sizing: border-box;
}


.filter-select:focus {
    border-color: #409EFF;
    outline: none;
}

.clear-filter-btn {
    padding: 8px 12px;
    border: 1px solid #f56c6c;
    border-radius: 4px;
    background: white;
    color: #f56c6c;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.3s;
    height: 36px; /* 固定高度与搜索框一致 */
    box-sizing: border-box;
    align-self: flex-start; /* 与其它元素对齐 */
}


/* 筛选按钮样式 */
.filter-dropdown {
    position: relative;
    margin-left: 20px;
}

.filter-btn {
    padding: 10px 15px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s;
    font-size: 14px;
}

.filter-btn:hover {
    color: #409EFF;
    border-color: #409EFF;
}

.filter-panel {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 5px;
    padding: 15px;
    background: white;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    width: 300px;
    z-index: 100;
}

.filter-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.apply-btn,
.clear-btn {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
}

.apply-btn {
    background-color: #409EFF;
    color: white;
}

.clear-btn {
    background-color: #f5f5f5;
    color: #606266;
}
</style>
