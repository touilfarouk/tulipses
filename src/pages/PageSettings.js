console.log('Registering PageSettings component');

// PageSettings component
const PageSettings = {
  template: `
    <q-page>
      <div class="q-pa-md">
        <h4>Settings</h4>

        <!-- Settings Cards in Row -->
        <div class="row q-col-gutter-md q-mb-md">
          <!-- Appearance Card -->
          <div class="col-12 col-md-3">
            <q-card flat bordered class="full-height shadow-2">
              <q-card-section>
                <div class="text-h6">Appearance</div>
              </q-card-section>

              <q-card-section>
                <q-toggle
                  v-model="darkMode"
                  label="Dark Mode"
                  color="primary"
                  @update:model-value="toggleDarkMode"
                />

                <div class="q-mt-md">
                  <q-btn-toggle
                    v-model="themeColor"
                    toggle-color="primary"
                    :options="[
                      { label: 'Teal', value: 'teal' },
                      { label: 'Blue', value: 'blue' },
                      { label: 'Purple', value: 'purple' },
                      { label: 'Red', value: 'red' }
                    ]"
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
                <div class="text-h6">Currency</div>
              </q-card-section>

              <q-card-section>
                <q-select
                  v-model="currency"
                  :options="currencyOptions"
                  label="Currency"
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
                <div class="text-h6">Data Management</div>
              </q-card-section>

              <q-card-section>
                <q-btn
                  color="negative"
                  label="Clear All Data"
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
                <div class="text-h6">About</div>
              </q-card-section>

              <q-card-section>
                <p class="q-mb-sm">Tulipes v1.0.0</p>
                <p class="q-mb-none">A simple money tracking application</p>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div class="q-mt-md">
          <q-btn flat color="primary" @click="$router.push('/')">Back to Home</q-btn>
        </div>
      </div>
    </q-page>
  `,
  setup() {
    const darkMode = Vue.ref(Quasar.Dark.isActive)
    const themeColor = Vue.ref('teal')
    const currency = Vue.ref('USD')

    const currencyOptions = [
      { label: 'US Dollar ($)', value: 'USD' },
      { label: 'Euro (€)', value: 'EUR' },
      { label: 'British Pound (£)', value: 'GBP' },
      { label: 'Japanese Yen (¥)', value: 'JPY' }
    ]

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
      Quasar.Dialog.create({
        title: 'Confirm',
        message: 'Are you sure you want to clear all data? This action cannot be undone.',
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

    return {
      darkMode,
      themeColor,
      currency,
      currencyOptions,
      toggleDarkMode,
      changeThemeColor,
      changeCurrency,
      confirmClearData
    }
  }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.PageSettings = PageSettings;
  console.log('PageSettings registered to window.PageSettings');
}
