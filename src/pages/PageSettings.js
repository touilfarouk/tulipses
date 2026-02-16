console.log('Registering PageSettings component');

// PageSettings component
const PageSettings = {
  template: `
    <q-page>
      <div class="q-pa-md">
        <h4>{{ t('title') }}</h4>

        <!-- Settings Cards in Row -->
        <div class="row q-col-gutter-md q-mb-md">
          <!-- Appearance Card -->
          <div class="col-12 col-md-3">
            <q-card flat bordered class="full-height shadow-2">
              <q-card-section>
                <div class="text-h6">{{ t('appearance') }}</div>
              </q-card-section>

              <q-card-section>
                <q-toggle
                  v-model="darkMode"
                  :label="t('darkMode')"
                  color="primary"
                  @update:model-value="toggleDarkMode"
                />

                <div class="q-mt-md">
                  <q-btn-toggle
                    v-model="themeColor"
                    toggle-color="primary"
                    :options="themeOptions"
                    @update:model-value="changeThemeColor"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Currency Card -->
          <div class="col-12 col-md-3">
            <q-card flat bordered class="full-height shadow-2">
              <q-card-section>
                <div class="text-h6">{{ t('currency') }}</div>
              </q-card-section>

              <q-card-section>
                <q-select
                  v-model="currency"
                  :options="currencyOptions"
                  :label="t('currency')"
                  emit-value
                  map-options
                  @update:model-value="changeCurrency"
                />
              </q-card-section>
            </q-card>
          </div>

          <!-- Data Management Card -->
          <div class="col-12 col-md-3">
            <q-card flat bordered class="full-height shadow-2">
              <q-card-section>
                <div class="text-h6">{{ t('dataManagement') }}</div>
              </q-card-section>

              <q-card-section>
                <q-btn
                  color="negative"
                  :label="t('clearAllData')"
                  @click="confirmClearData"
                  class="full-width"
                />
              </q-card-section>
            </q-card>
          </div>

          <!-- About Card -->
          <div class="col-12 col-md-3">
            <q-card flat bordered class="full-height shadow-2">
              <q-card-section>
                <div class="text-h6">{{ t('about') }}</div>
              </q-card-section>

              <q-card-section>
                <p class="q-mb-sm">{{ t('version') }}</p>
                <p class="q-mb-none">{{ t('description') }}</p>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div class="q-mt-md">
          <q-btn flat color="primary" @click="$router.push('/')">{{ t('backHome') }}</q-btn>
        </div>
      </div>
    </q-page>
  `,
  setup() {
    const darkMode = Vue.ref(Quasar.Dark.isActive)
    const themeColor = Vue.ref('teal')
    const currency = Vue.ref('USD')
    const labels = Vue.ref({})
    const themeOptions = Vue.ref([])
    const currencyOptions = Vue.ref([])
    const i18nLang = Vue.ref(window.i18n?.lang || 'en')
    if (window.i18n?.onChange) {
      window.i18n.onChange((lang) => {
        i18nLang.value = lang
        loadScreenData()
      })
    }

    const t = (key) => {
      void i18nLang.value
      return labels.value?.[key] || key
    }

    const loadScreenData = async () => {
      try {
        const lang = window.i18n?.lang || 'en'
        const data = await window.screenData.load('settings', lang)
        if (!data) throw new Error('No screen data returned')
        labels.value = data.labels || {}
        themeOptions.value = data.themeOptions || []
        currencyOptions.value = data.currencyOptions || []
      } catch (error) {
        console.error('Settings load failed', error)
        labels.value = {}
        themeOptions.value = []
        currencyOptions.value = []
      }
    }

    const toggleDarkMode = (value) => {
      Quasar.Dark.set(value)
      localStorage.setItem('darkMode', value)
    }

    const applyThemeColor = (color) => {
      const colors = {
        teal: '#00695c',
        blue: '#1976d2',
        purple: '#7B1FA2',
        red: '#D32F2F'
      }
      const primary = colors[color] || colors.teal

      // Update Quasar brand colors
      if (Quasar.colors && typeof Quasar.colors.setBrand === 'function') {
        Quasar.colors.setBrand('primary', primary)
      } else {
        document.body.style.setProperty('--q-primary', primary)
      }
    }

    const changeThemeColor = (color) => {
      applyThemeColor(color)
      Quasar.Dark.set(darkMode.value)
      localStorage.setItem('themeColor', color)
    }

    const changeCurrency = (newCurrency) => {
      localStorage.setItem('currency', newCurrency)
    }

    const confirmClearData = () => {
      const confirmTitle = labels.value?.confirmClear?.title || 'Confirm'
      const confirmMessage = labels.value?.confirmClear?.message || 'Are you sure you want to clear all data?'
      Quasar.Dialog.create({
        title: confirmTitle,
        message: confirmMessage,
        cancel: true,
        persistent: true
      }).onOk(() => {
        localStorage.clear()
        location.reload()
      })
    }

    // Load saved settings
    const loadSettings = () => {
      const savedDarkMode = localStorage.getItem('darkMode')
      const savedThemeColor = localStorage.getItem('themeColor')
      const savedCurrency = localStorage.getItem('currency')

      if (savedDarkMode !== null) {
        darkMode.value = savedDarkMode === 'true'
        Quasar.Dark.set(darkMode.value)
      }

      if (savedThemeColor) {
        themeColor.value = savedThemeColor
        applyThemeColor(savedThemeColor)
      } else {
        applyThemeColor(themeColor.value)
      }

      if (savedCurrency) {
        currency.value = savedCurrency
      }
    }

    loadSettings()
    loadScreenData()

    return {
      darkMode,
      themeColor,
      currency,
      currencyOptions,
      themeOptions,
      toggleDarkMode,
      changeThemeColor,
      changeCurrency,
      confirmClearData,
      t
    }
  }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.PageSettings = PageSettings;
  console.log('PageSettings registered to window.PageSettings');
}

