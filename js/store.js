// Simple State Management for Entries (without Pinia)
const EntriesStore = {
  state: {
    entries: [
      { id: 'id1', name: 'Salary', amount: 4999.99, paid: false },
      { id: 'id2', name: 'Rent', amount: -999, paid: false },
      { id: 'id3', name: 'Phone', amount: -14.99, paid: true },
      { id: 'id4', name: 'Unknown', amount: 0, paid: false }
    ],
    loading: false,
    error: null,
    apiUrl: 'https://jsonplaceholder.typicode.com/posts'
  },

  get balance() {
    return this.state.entries.reduce((accumulator, { amount }) => {
      return accumulator + amount
    }, 0)
  },

  get totalEntries() {
    return this.state.entries.length
  },

  get paidEntries() {
    return this.state.entries.filter(entry => entry.paid)
  },

  get unpaidEntries() {
    return this.state.entries.filter(entry => !entry.paid)
  },

  get paidCount() {
    return this.paidEntries.length
  },

  get unpaidCount() {
    return this.unpaidEntries.length
  },

  get totalIncome() {
    return this.state.entries
      .filter(entry => entry.amount > 0)
      .reduce((sum, entry) => sum + entry.amount, 0)
  },

  get totalExpenses() {
    return this.state.entries
      .filter(entry => entry.amount < 0)
      .reduce((sum, entry) => sum + Math.abs(entry.amount), 0)
  },

  get averageEntryAmount() {
    return this.state.entries.length > 0
      ? this.balance / this.state.entries.length
      : 0
  },

  get largestExpense() {
    const expenses = this.state.entries.filter(entry => entry.amount < 0)
    return expenses.length > 0
      ? Math.min(...expenses.map(e => e.amount))
      : 0
  },

  get largestIncome() {
    const income = this.state.entries.filter(entry => entry.amount > 0)
    return income.length > 0
      ? Math.max(...income.map(e => e.amount))
      : 0
  },

  get entriesByMonth() {
    const monthlyData = {}
    this.state.entries.forEach(entry => {
      const month = new Date().toISOString().slice(0, 7) // Current month
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0, count: 0 }
      }
      if (entry.amount > 0) {
        monthlyData[month].income += entry.amount
      } else {
        monthlyData[month].expenses += Math.abs(entry.amount)
      }
      monthlyData[month].count++
    })
    return monthlyData
  },

  async fetchEntries() {
    this.state.loading = true
    this.state.error = null

    try {
      const response = await axios.get(this.state.apiUrl)
      console.log('Fetched entries from server:', response.data)
    } catch (error) {
      this.state.error = error.message
      console.error('Error fetching entries:', error)
    } finally {
      this.state.loading = false
    }
  },

  async addEntry(entryData) {
    this.state.loading = true
    this.state.error = null

    try {
      const newEntry = {
        id: 'id' + Date.now(),
        name: entryData.name,
        amount: parseFloat(entryData.amount),
        paid: false
      }

      const response = await axios.post(this.state.apiUrl, newEntry)
      console.log('Entry added to server:', response.data)

      this.state.entries.push(newEntry)

      return newEntry
    } catch (error) {
      this.state.error = error.message
      console.error('Error adding entry:', error)
      throw error
    } finally {
      this.state.loading = false
    }
  },

  async updateEntry(id, updates) {
    this.state.loading = true
    this.state.error = null

    try {
      const entryIndex = this.state.entries.findIndex(entry => entry.id === id)
      if (entryIndex === -1) throw new Error('Entry not found')

      const updatedEntry = { ...this.state.entries[entryIndex], ...updates }

      const response = await axios.put(`${this.state.apiUrl}/${id}`, updatedEntry)
      console.log('Entry updated on server:', response.data)

      this.state.entries[entryIndex] = updatedEntry

      return updatedEntry
    } catch (error) {
      this.state.error = error.message
      console.error('Error updating entry:', error)
      throw error
    } finally {
      this.state.loading = false
    }
  },

  async deleteEntry(id) {
    this.state.loading = true
    this.state.error = null

    try {
      const response = await axios.delete(`${this.state.apiUrl}/${id}`)
      console.log('Entry deleted from server:', response.data)

      const index = this.state.entries.findIndex(entry => entry.id === id)
      if (index > -1) {
        this.state.entries.splice(index, 1)
      }

      return true
    } catch (error) {
      this.state.error = error.message
      console.error('Error deleting entry:', error)
      throw error
    } finally {
      this.state.loading = false
    }
  },

  async togglePaid(id) {
    const entry = this.state.entries.find(entry => entry.id === id)
    if (entry) {
      return await this.updateEntry(id, { paid: !entry.paid })
    }
  },

  clearEntries() {
    this.state.entries = []
  },

  setEntries(entries) {
    this.state.entries = entries
  },

  // UI State Management - Make it reactive
  get uiState() {
    if (!this._uiState) {
      this._uiState = Vue.reactive({
        leftDrawer: false,
        drawerState: 'closed', // 'opening', 'open', 'closing', 'closed'
        activeMenuItem: '/'
      })
    }
    return this._uiState
  },

  // Storage functions
  getFromStorage(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key)
      console.log(`Retrieved ${key} from storage:`, stored)
      return stored !== null ? JSON.parse(stored) : defaultValue
    } catch (error) {
      console.warn(`Could not read ${key} from localStorage:`, error)
      return defaultValue
    }
  },

  saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      console.log(`Saved ${key} to storage:`, value)
    } catch (error) {
      console.warn(`Could not save ${key} to localStorage:`, error)
    }
  },

  // Initialize UI state from storage
  initializeUIState() {
    const savedDrawerState = this.getFromStorage('moneyballs-drawer-state', false)
    const savedActiveMenu = this.getFromStorage('moneyballs-active-menu', '/')

    this.uiState.leftDrawer = savedDrawerState
    this.uiState.drawerState = savedDrawerState ? 'open' : 'closed'
    this.uiState.activeMenuItem = savedActiveMenu

    console.log('UI State initialized:', this.uiState)
  },

  // Drawer functions
  toggleLeftDrawer() {
    this.uiState.leftDrawer = !this.uiState.leftDrawer
    this.uiState.drawerState = this.uiState.leftDrawer ? 'opening' : 'closing'
    this.saveToStorage('moneyballs-drawer-state', this.uiState.leftDrawer)
  },

  onDrawerShow() {
    this.uiState.drawerState = 'open'
    console.log('Drawer opened')
    this.saveToStorage('moneyballs-drawer-state', true)
  },

  onDrawerHide() {
    this.uiState.drawerState = 'closed'
    console.log('Drawer closed')
    this.saveToStorage('moneyballs-drawer-state', false)
  },

  // Navigation functions
  navigateTo(path) {
    window.location.hash = path
  },

  navigateToAndClose(path) {
    this.navigateTo(path)
    // Close drawer on mobile after navigation
    if (window.innerWidth <= 700) {
      this.uiState.leftDrawer = false
      this.uiState.drawerState = 'closing'
      this.saveToStorage('moneyballs-drawer-state', false)
    }
  },

  setActiveMenuAndNavigate(path) {
    console.log('setActiveMenuAndNavigate called with path:', path)
    console.log('Current activeMenuItem before:', this.uiState.activeMenuItem)

    this.uiState.activeMenuItem = path
    this.saveToStorage('moneyballs-active-menu', path)

    console.log('Current activeMenuItem after:', this.uiState.activeMenuItem)

    // Force reactivity update
    Vue.nextTick(() => {
      console.log('After nextTick, activeMenuItem:', this.uiState.activeMenuItem)
    })

    this.navigateToAndClose(path)
  },

  getCurrentPath() {
    return window.location.hash.replace('#', '') || '/'
  }
}

// Create a simple hook to use the store
function useEntriesStore() {
  return EntriesStore
}
