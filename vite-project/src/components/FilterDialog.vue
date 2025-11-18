<template>
    <div v-if="visible" class="filter-dialog">
        <div class="filter-content">
            <h3>筛选条件</h3>
            <div class="filter-options">
                <div v-for="(filter, key) in filters" :key="key" class="filter-group">
                    <label>{{ filter.title }}:</label>
                    <select v-model="selectedFilters[key]">
                        <option value="">全部</option>
                        <option v-for="value in filter.values" :key="value" :value="value">
                            {{ value }}
                        </option>
                    </select>
                </div>
            </div>
            <div class="filter-actions">
                <button @click="handleApply">确定</button>
                <button @click="handleReset">重置</button>
                <button @click="handleClose">取消</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    visible: Boolean,
    filters: {
        type: Object,
        default: () => ({})
    }
})

const emit = defineEmits(['update:visible', 'apply', 'reset'])

const selectedFilters = ref({})

watch(() => props.visible, (newVal) => {
    if (newVal) {
        // 重置选中的筛选条件
        selectedFilters.value = {}
    }
})

const handleApply = () => {
    emit('apply', selectedFilters.value)
    emit('update:visible', false)
}

const handleReset = () => {
    selectedFilters.value = {}
    emit('reset')
    emit('update:visible', false)
}

const handleClose = () => {
    emit('update:visible', false)
}
</script>

<style scoped>
.filter-dialog {
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
}

.filter-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 80%;
    max-width: 600px;
}

.filter-options {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin: 20px 0;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.filter-group label {
    font-weight: 500;
    color: #606266;
}

.filter-group select {
    padding: 8px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
}

.filter-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
}

.filter-actions button {
    padding: 8px 16px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: white;
    cursor: pointer;
}

.filter-actions button:first-child {
    background: #409EFF;
    color: white;
    border-color: #409EFF;
}
</style>
