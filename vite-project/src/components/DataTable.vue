<template>
    <div class="table-container">
        <div class="table-header">
            <div class="search-filter-box">
                <div class="search-box">
                    <input type="text" v-model="searchQuery" placeholder="搜索支付编码、电话、赔付人..." @input="handleSearch"
                        @keydown.stop @click.stop class="search-input" />
                </div>

                <!-- 平铺筛选器 -->
                <div class="inline-filters">
                    <div class="filter-group">
                        <label>时间:</label>
                        <div class="time-range-filter">
                            <input type="date" v-model="inlineFilters.timeStart" class="filter-select time-input"
                                placeholder="年/月/日" />
                            <span class="time-separator">至</span>
                            <input type="date" v-model="inlineFilters.timeEnd" class="filter-select time-input"
                                placeholder="年/月/日" />
                        </div>
                    </div>

                    <div class="filter-group">
                        <label>投诉情况:</label>
                        <select v-model="inlineFilters.situation" class="filter-select" @change="applyFilters">
                            <option value="">全部投诉情况</option>
                            <option v-for="situation in getSituationOptions()" :key="situation" :value="situation">
                                {{ situation }}
                            </option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label>赔付人:</label>
                        <select v-model="inlineFilters.name" class="filter-select" @change="applyFilters">
                            <option value="">全部赔付人</option>
                            <option v-for="name in getNameOptions()" :key="name" :value="name">
                                {{ name }}
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
                    <td v-for="column in columns" :key="column.key" @click="handleCellClick(item, column, $event)">
                        <!-- 特殊处理时间列，只显示年月日 -->
                        <div v-if="column.key === 'time'">
                            {{ formatDateForDisplay(item[column.key]) }}
                        </div>
                        <!-- 特殊处理备注列，支持富文本显示 -->
                        <div v-else-if="column.key === 'Note' && item[column.key]" class="rich-content-display"
                            v-html="item[column.key]">
                        </div>
                        <!-- 普通列 -->
                        <div v-else>
                            {{ item[column.key] }}
                        </div>
                    </td>
                    <td>
                        <div class="actions">
                            <button v-if="props.showProcessButton" class="process-btn" @click="$emit('row-action', 'process', item)">处理
                            </button>
                            <button v-if="props.showEditButton" class="edit-btn" @click="handleEdit(item)">编辑</button>
                        </div>
                    </td>
                </tr>
                <tr v-if="filteredData.length === 0">
                    <td :colspan="columns.length + 1" class="no-data">
                        处理完成！
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
                <form @submit.prevent="validateForm() && handleSubmit()">
                    <!-- 在编辑模式下，根据enableFullEdit属性决定显示所有字段还是仅备注字段 -->
                    <div v-if="showEditModal && !props.enableFullEdit">
                        <div class="form-group">
                            <label>备注:</label>
                            <div class="rich-editor-wrapper">
                                <RichEditor :content="formData['Note'] || ''"
                                    @save="content => formData['Note'] = content" @cancel="() => {}"
                                    @fileSelectStart="isSelectingFile = true"
                                    @fileSelectEnd="isSelectingFile = false" />
                            </div>
                        </div>
                    </div>

                    <!-- 在添加模式下，或者在启用了全字段编辑的编辑模式下，显示所有字段 -->
                    <div v-else>
                        <!-- 自定义添加表单字段，每行两个字段 -->
                        <div class="form-row">
                            <div class="form-group">
                                <label><span class="required">*</span>支付编码:</label>
                                <input type="text" v-model="formData.pay_id" required />
                                <div v-if="formData.pay_id && formData.pay_id.length !== 28" class="field-hint error">
                                    支付编码必须为28位
                                </div>
                            </div>
                            <div class="form-group">
                                <label><span class="required">*</span>投诉渠道:</label>
                                <select v-model="formData['Complaint channel']" required>
                                    <option value="商户号">商户号</option>
                                    <option value="小程序">小程序</option>
                                    <option value="微信公众号">微信公众号</option>
                                    <option value="电话">电话</option>
                                    <option value="企微">企微</option>
                                    <option value="客服微信">客服微信</option>
                                    <option value="学校">学校</option> 
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label><span class="required">*</span>投诉人电话:</label>
                                <input type="text" v-model="formData.phone" required />
                                <div v-if="formData.phone && formData.phone.length !== 11" class="field-hint error">
                                    电话号码必须为11位
                                </div>
                            </div>
                            <div class="form-group">
                                <label><span class="required">*</span>订单金额:</label>
                                <input type="text" v-model="formData['Order Amount']" required />
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label><span class="required">*</span>情况说明:</label>
                                <div class="situation-selector">
                                    <!-- 第一级选择 -->
                                    <select v-model="selectedSituation.level1" @change="clearLowerLevels(1)"
                                        class="situation-select">
                                        <option value="" disabled selected style="color: #aaa;">请选择问题类型</option>
                                        <option v-for="(children, key) in situationOptions" :key="key" :value="key">
                                            {{ key }}
                                        </option>
                                    </select>

                                    <!-- 第二级选择 -->
                                    <select v-if="selectedSituation.level1 && getLevel2Options()"
                                        v-model="selectedSituation.level2" @change="clearLowerLevels(2)"
                                        class="situation-select">
                                        <option value="" disabled selected style="color: #aaa;">请选择具体问题</option>
                                        <option v-for="(children, key) in getLevel2Options()" :key="key" :value="key">
                                            {{ key }}
                                        </option>
                                    </select>

                                    <!-- 第三级选择 -->
                                    <select v-if="selectedSituation.level2 && getLevel3Options()"
                                        v-model="selectedSituation.level3" class="situation-select">
                                        <option value="" disabled selected style="color: #aaa;">请选择详细问题</option>
                                        <option v-for="(children, key) in getLevel3Options()" :key="key" :value="key">
                                            {{ key }}
                                        </option>
                                    </select>
                                </div>
                                <!-- 将选择的结果组合成字符串保存到formData -->
                                <input type="hidden" v-model="formData['Situation Explanation']" />
                            </div>
                            <div class="form-group">
                                <label><span class="required">*</span>日期:</label>
                                <input 
                                    type="date" 
                                    :value="formatDateForDisplay(formData.time)" 
                                    @input="e => formData.time = e.target.value" 
                                    required 
                                    :max="todayDate"
                                    @blur="validateDate"
                                    class="date-input"
                                    placeholder="年/月/日"
                                />
                                <div v-if="dateError" class="field-hint error">{{ dateError }}</div>
                                <div v-else class="field-hint">请选择正确的日期</div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group full-width">
                                <label>备注:</label>
                                <div class="rich-editor-wrapper">
                                    <RichEditor :content="formData['Note'] || ''"
                                        @save="content => formData['Note'] = content" 
                                        @input="content => formData['Note'] = content"
                                        @cancel="() => {}"
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
import { ref, computed, onMounted, nextTick, watch, onUnmounted} from 'vue'
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
    },
    showEditButton: {
        type: Boolean,
        default: false // 默认不显示编辑按钮
    },
    enableFullEdit: {
        type: Boolean,
        default: false // 默认不启用全字段编辑
    }
})

// 响应式数据
const tableData = ref([])
const searchQuery = ref('')
const todayDate = ref(new Date().toISOString().split('T')[0])
const dateError = ref('')
const searchTimer = ref(null) // 添加这一行
const currentPage = ref(1)
const pageSize = ref(20)//每页显示的数据量
const showAddModal = ref(false)
const showEditModal = ref(false)
const showEditNoteModal = ref(false)  // 添加编辑备注弹窗状态
const formData = ref({})
const noteData = ref({})  // 添加备注数据存储
const showFilterPanel = ref(false)
const shouldCloseModal = ref(false) //添加一个新的响应式变量来跟踪模态框是否应该关闭

const situationOptions = ref({
    '餐品问题': {
        '吃出异物': null,
        '商家做错餐': null,
        '餐品损坏': {
            '餐品送到站点溢出或损坏': null,
            '在分餐站点造成餐品损坏': null,
            '在配送过程中造成餐品损坏': null
        }
    },
    '配送问题': {
        '商家出餐超时': null,
        '站点滞留': {
            '滞留10分钟': null,
            '滞留20分钟': null,
            '滞留30分钟以上': null
        },
        '骑手配送超时': {
            '配送超过15分钟': null,
            '配送超过25分钟': null,
            '配送超过35分钟及以上': null
        },
        '餐品丢失': null
    },
    '其他': null
})

const selectedSituation = ref({
    level1: '',
    level2: '',
    level3: ''
})

// 获取情况说明选项
const getSituationOptions = () => {
    const situations = [...new Set(tableData.value.map(item => {
        const situation = item['Situation Explanation'];
        // 检查值是否为null或undefined
        if (situation === null || situation === undefined) {
            return '';
        }
        return situation;
    }))]
    return situations.filter(situation => situation !== '')
}

//情况选择方法
// 获取第二级选项
const getLevel2Options = () => {
    if (selectedSituation.value.level1 && situationOptions.value[selectedSituation.value.level1]) {
        return situationOptions.value[selectedSituation.value.level1];
    }
    return null;
}

// 获取第三级选项
const getLevel3Options = () => {
    if (selectedSituation.value.level2 &&
        selectedSituation.value.level1 &&
        situationOptions.value[selectedSituation.value.level1] &&
        situationOptions.value[selectedSituation.value.level1][selectedSituation.value.level2]) {
        return situationOptions.value[selectedSituation.value.level1][selectedSituation.value.level2];
    }
    return null;
}

// 清除较低级别的选择
const clearLowerLevels = (level) => {
    if (level === 1) {
        selectedSituation.value.level2 = '';
        selectedSituation.value.level3 = '';
    } else if (level === 2) {
        selectedSituation.value.level3 = '';
    }

    // 更新formData中的情况说明
    updateSituationExplanation();
}

// 更新情况说明字段
const updateSituationExplanation = () => {
    let explanation = '';
    if (selectedSituation.value.level1) {
        explanation += selectedSituation.value.level1;
        if (selectedSituation.value.level2) {
            explanation += ' - ' + selectedSituation.value.level2;
            if (selectedSituation.value.level3) {
                explanation += ' - ' + selectedSituation.value.level3;
            }
        }
    }
    formData.value['Situation Explanation'] = explanation;
}

// 平铺筛选器状态
const inlineFilters = ref({
    timeStart: '',
    timeEnd: '',
    situation: '',
    name: ''
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
            const values = [...new Set(tableData.value.map(item => {
                const value = item[column.key];
                // 检查值是否为null或undefined
                if (value === null || value === undefined) {
                    return '';
                }
                // 处理对象类型
                if (typeof value === 'object') {
                    try {
                        return JSON.stringify(value);
                    } catch (e) {
                        return '';
                    }
                }
                return value;
            }))]
            filters[column.key] = {
                title: column.title,
                values: values.filter(value => value !== '')
            }
        }
    })
    return filters
})


// 获取时间选项
const getTimeOptions = () => {
    const times = [...new Set(tableData.value.map(item => {
        const time = item.time;
        // 检查值是否为null或undefined
        if (time === null || time === undefined) {
            return '';
        }
        return time;
    }))]
    return times.filter(time => time !== '')
}

// 获取订单ID选项
const getPayIdOptions = () => {
    const payIds = [...new Set(tableData.value.map(item => {
        const payId = item.pay_id;
        // 检查值是否为null或undefined
        if (payId === null || payId === undefined) {
            return '';
        }
        return payId;
    }))]
    return payIds.filter(id => id !== '')
}

// 获取姓名选项（这里假设姓名在Indemnitor字段）
const getNameOptions = () => {
    const names = [...new Set(tableData.value.map(item => {
        const name = item.Indemnitor;
        // 检查值是否为null或undefined
        if (name === null || name === undefined) {
            return '';
        }
        return name;
    }))]
    return names.filter(name => name !== '')
}

// 获取电话选项
const getPhoneOptions = () => {
    const phones = [...new Set(tableData.value.map(item => {
        const phone = item.phone;
        // 检查值是否为null或undefined
        if (phone === null || phone === undefined) {
            return '';
        }
        return phone;
    }))]
    return phones.filter(phone => phone !== '')
}

// 是否有激活的平铺筛选条件
const hasActiveInlineFilters = computed(() => {
    return inlineFilters.value.timeStart ||
        inlineFilters.value.timeEnd ||
        inlineFilters.value.situation ||
        inlineFilters.value.name
})

// 更新筛选处理方法
const handleFilterApply = (filters) => {
    activeFilters.value = { ...filters }
    currentPage.value = 1
}

// 清除平铺筛选器
const clearInlineFilters = () => {
    inlineFilters.value = {
        timeStart: '',
        timeEnd: '',
        situation: '',
        name: ''
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

// filteredData 计算属性
const filteredData = computed(() => {
    // 如果原始数据为空，直接返回空数组
    if (!tableData.value || tableData.value.length === 0) {
        return []
    }
    
    let result = [...tableData.value]

    // 应用搜索条件
    if (searchQuery.value) {
        result = result.filter(item => {
            return Object.values(item).some(value => {
                // 检查值是否为null或undefined
                if (value === null || value === undefined) {
                    return false;
                }
                // 处理不同类型的值
                if (typeof value === 'object') {
                    // 对于对象类型，尝试转换为字符串
                    try {
                        return JSON.stringify(value).toLowerCase().includes(searchQuery.value.toLowerCase());
                    } catch (e) {
                        return false;
                    }
                }
                // 对于基本类型，直接转换为字符串进行比较
                return value.toString().toLowerCase().includes(searchQuery.value.toLowerCase());
            });
        });
    }

    // 应用时间范围筛选条件
    if (inlineFilters.value.timeStart || inlineFilters.value.timeEnd) {
        result = result.filter(item => {
            if (!item.time) return false

            const itemDate = new Date(item.time)
            const startDate = inlineFilters.value.timeStart ? new Date(inlineFilters.value.timeStart) : null
            let endDate = inlineFilters.value.timeEnd ? new Date(inlineFilters.value.timeEnd) : null
            
            // 将结束日期设置为当天的最后一刻 (23:59:59)
            if (endDate) {
                endDate.setHours(23, 59, 59, 999)
            }

            if (startDate && itemDate < startDate) return false
            if (endDate && itemDate > endDate) return false

            return true
        })
    }

    // 应用情况说明筛选条件
    if (inlineFilters.value.situation) {
        result = result.filter(item => item['Situation Explanation'] === inlineFilters.value.situation)
    }

    // 应用姓名筛选条件
    if (inlineFilters.value.name) {
        result = result.filter(item => item.Indemnitor === inlineFilters.value.name)
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
    const formattedItem = { ...item };
    
    // 特别处理日期字段，确保它是一个 YYYY-MM-DD 格式的字符串
    if (formattedItem.time) {
        formattedItem.time = formatDateForDisplay(formattedItem.time);
    }
    
    formData.value = formattedItem;
    showEditModal.value = true;
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

// 格式化日期为北京时间格式
const formatDateToBeijingTime = (dateInput) => {
    // 如果已经是 YYYY-MM-DD 格式的字符串，直接使用并在后面加上时间
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput + ' 00:00:00';
    }
    
    // 如果是带时间的完整日期字符串，直接返回
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateInput)) {
        return dateInput;
    }
    
    // 处理日期对象
    const date = new Date(dateInput);
    
    // 使用本地时区而非UTC时间来避免日期偏移问题
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // 返回格式化的日期字符串 YYYY-MM-DD 00:00:00
    return `${year}-${month}-${day} 00:00:00`;
}

// 格式化日期用于显示（只显示年月日）
const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    // 处理ISO格式日期 (2025-11-25T16:00:00.000Z)
    if (dateString.includes('T')) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // 如果是完整的时间格式，只取前面的日期部分
    if (dateString.includes(' ')) {
        return dateString.split(' ')[0];
    }
    
    // 如果已经是日期格式，直接返回
    // 确保返回的格式是 yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        return dateString.substring(0, 10);
    }
    
    return dateString;
}

//后端测试用的提交方法
const handleSubmit = async () => {
    try {
        if (showEditModal.value) {
            // 更新数据时清理掉Vue的内部属性
            const cleanData = {};
            Object.keys(formData.value).forEach(key => {
                // 过滤掉Vue的内部属性（以_或$开头的属性）
                if (!key.startsWith('_') && !key.startsWith('$')) {
                    cleanData[key] = formData.value[key];
                }
            });
            
            // 特别处理时间字段格式
            if (cleanData.time) {
                cleanData.time = formatDateToBeijingTime(cleanData.time);
            }
            
            await updateData(formData.value.id, cleanData)
        } else {
            // 验证支付编码长度
            if (formData.value.pay_id && formData.value.pay_id.length !== 28) {
                alert('支付编码必须为28位');
                return;
            }
            
            // 验证手机号长度
            if (formData.value.phone && formData.value.phone.length !== 11) {
                alert('手机号必须为11位');
                return;
            }
            
            // 添加数据
            // 为新数据设置默认值
            const newData = {
                ...formData.value,
                status: formData.value.status || '未处理订单/投诉', // 正确的默认状态值
                Indemnitor: formData.value.Indemnitor || '',
                'Compensation Amount': formData.value['Compensation Amount'] || '0.00',
                // 确保时间字段正确传递，使用北京时间
                time: formData.value.time ? formatDateToBeijingTime(formData.value.time) : formatDateToBeijingTime(new Date())
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


// 处理模态框获得焦点
const onModalFocusIn = () => {
    //shouldCloseModal.value = false
}

// 验证日期
const validateDate = () => {
    if (!formData.value.time) {
        dateError.value = '';
        return;
    }
    
    // 检查日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.value.time)) {
        dateError.value = '日期格式不正确';
        return;
    }
    
    // 检查日期是否大于今天
    const selectedDate = new Date(formData.value.time);
    const today = new Date();
    
    // 只比较日期部分，忽略时间部分
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
        dateError.value = '日期不能大于今天';
        return;
    }
    
    dateError.value = '';
}

// 在提交前验证日期
const validateForm = () => {
    validateDate();
    return !dateError.value;
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
    if (newData) {
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
    gap: 100px;
    /* 搜索框和筛选器之间的间距 */
    flex: 1;
    min-height: 34px;
    /* 确保最小高度 */
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
    padding: 10px 14px;
    /* 统一内边距 */
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    height: 36px;
    /* 固定高度 */
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

.form-group .date-input {
    cursor: pointer;
}

.form-group .date-input:focus {
    border-color: #409EFF;
    outline: none;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 字段提示文字样式 */
.field-hint {
    font-size: 12px;
    margin-top: 4px;
    color: #909399;
}

.field-hint.error {
    color: #f56c6c;
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
    padding: 2px 0;
    /* 调整上下内边距 */
}

/* 筛选组样式 */
.filter-group {
    display: flex;
    align-items: center;
    /* 垂直居中对齐 */
    gap: 5px;
    /* label和select之间的间距 */
    white-space: nowrap;
    /* 防止换行 */
}

.filter-group label {
    font-size: 13px;
    color: #606266;
    font-weight: 500;
    margin-right: 5px;
    /* 与选择框的间距 */
    white-space: nowrap;
    /* 防止换行 */
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
    height: 36px;
    /* 固定高度与搜索框一致 */
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
    height: 36px;
    /* 固定高度与搜索框一致 */
    box-sizing: border-box;
    align-self: flex-start;
    /* 与其它元素对齐 */
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

/* 情况说明选择器样式 */
.situation-selector {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.situation-select {
    padding: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    background-color: white;
    width: 100%;
    box-sizing: border-box;
}

.situation-select:focus {
    border-color: #409EFF;
    outline: none;
}

/* 时间范围筛选器样式 */
.time-range-filter {
    display: flex;
    align-items: center;
    gap: 5px;
}

.time-input {
    width: 120px;
    padding: 8px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 13px;
    background-color: white;
    box-sizing: border-box;
}

.time-separator {
    font-size: 13px;
    color: #606266;
}

/* 必填字段标记样式 */
.required {
    color: #f56c6c;
    margin-left: 4px;
}

/* 字段提示文字样式 */
.field-hint {
    font-size: 12px;
    margin-top: 4px;
}

.field-hint.error {
    color: #f56c6c;
}

.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #909393;
  font-size: 16px;
}
</style>
