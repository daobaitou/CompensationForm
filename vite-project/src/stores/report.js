import { defineStore } from 'pinia'

export const useReportStore = defineStore('report', {
  state: () => ({
    basicData: []
  }),
  actions: {
    updateBasicData(data) {
      this.basicData = data
    }
  }
})