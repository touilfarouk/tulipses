console.log('Registering MainLayout component');

// MainLayout component
const MainLayout = {
  template: `
    <style>
      .menu-item-transition {
        transition: all 0.3s ease;
      }
      .menu-item-transition:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
      }
      .q-item .q-item-label.caption {
        font-size: 10px !important;
      }
    </style>
    <q-layout view="hHh lpR lFf">
      <q-header class="bg-primary text-white shadow-2">
        <q-toolbar class="bg-primary">
          <q-btn
            flat
            dense
            round
            icon="menu"
            @click="toggleLeftDrawer"
            :color="drawerState === 'open' ? 'white' : 'white'"
          />
          <q-toolbar-title>
            {{ t('app.title') }}
            <q-badge
              v-if="drawerState !== 'closed'"
              color="white"
              text-color="primary"
              class="q-ml-sm"
              :label="drawerState"
            />
          </q-toolbar-title>
          <q-btn-dropdown
            flat
            round
            dense
            icon="settings"
            dropdown-icon="translate"
          >
            <q-list style="min-width:160px">
              <q-item clickable v-close-popup @click="setLanguage('en')">
                <q-item-section>English</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setLanguage('fr')">
                <q-item-section>Français</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setLanguage('ar')">
                <q-item-section>العربية</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="navigateTo('/settings')">
                <q-item-section>Settings</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </q-toolbar>
      </q-header>

      <q-drawer
        v-model="localDrawerOpen"
        bordered
        style="background-color: #00695c; color: white;"
        :width="250"
        :breakpoint="700"
        elevated
        @show="onDrawerShow"
        @hide="onDrawerHide"
      >
        <q-list>
          <q-item-label header class="text-white">{{ t('app.navigation') }}</q-item-label>
          <q-item
            clickable
            @click="setActiveMenuAndNavigate('/tables-demo')"
            :style="activeMenuItem === '/tables-demo' ? 'background-color: #004d40; border-left: 4px solid #26A69A;' : ''"
            class="menu-item-transition"
          >
            <q-item-section avatar>
              <q-icon name="table_view" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('menu.dataTables') }}</q-item-label>
              <q-item-label caption class="text-white" style="font-size: 8px !important;">{{ t('menu.dataTablesCaption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-chip
                v-if="activeMenuItem === '/tables-demo'"
                color="white"
                text-color="primary"
                size="sm"
              >
                New
              </q-chip>
            </q-item-section>
          </q-item>
          <q-item
            clickable
            @click="setActiveMenuAndNavigate('/advanced-data-grid')"
            :style="activeMenuItem === '/advanced-data-grid' ? 'background-color: #004d40; border-left: 4px solid #26A69A;' : ''"
            class="menu-item-transition"
          >
            <q-item-section avatar>
              <q-icon name="grid_view" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('menu.advancedGrid') }}</q-item-label>
              <q-item-label caption class="text-white" style="font-size: 8px !important;">{{ t('menu.advancedGridCaption') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            clickable
            @click="setActiveMenuAndNavigate('/page-multi-grid')"
            :style="activeMenuItem === '/page-multi-grid' ? 'background-color: #004d40; border-left: 4px solid #26A69A;' : ''"
            class="menu-item-transition"
          >
            <q-item-section avatar>
              <q-icon name="grid_on" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('menu.multiGrid') }}</q-item-label>
              <q-item-label caption class="text-white" style="font-size: 8px !important;">{{ t('menu.multiGridCaption') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item
            clickable
            @click="setActiveMenuAndNavigate('/')"
            :style="activeMenuItem === '/' ? 'background-color: #004d40; border-left: 4px solid #26A69A;' : ''"
            class="menu-item-transition"
          >
            <q-item-section avatar>
              <q-icon name="home" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('app.entries') }}</q-item-label>
              <q-item-label caption class="text-white" style="font-size: 8px !important;">{{ t('menu.entriesCaption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-chip
                v-if="activeMenuItem === '/'"
                color="white"
                text-color="primary"
                size="sm"
              >
                Active
              </q-chip>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            @click="setActiveMenuAndNavigate('/settings')"
            :style="activeMenuItem === '/settings' ? 'background-color: #004d40; border-left: 4px solid #26A69A;' : ''"
            class="menu-item-transition"
          >
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('app.settings') }}</q-item-label>
              <q-item-label caption class="text-white" style="font-size: 8px !important;">{{ t('menu.settingsCaption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-chip
                v-if="activeMenuItem === '/settings'"
                color="white"
                text-color="primary"
                size="sm"
              >
                Active
              </q-chip>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            @click="setActiveMenuAndNavigate('/form-entries')"
            :style="activeMenuItem === '/form-entries' ? 'background-color: #004d40; border-left: 4px solid #26A69A;' : ''"
            class="menu-item-transition"
          >
            <q-item-section avatar>
              <q-icon name="description" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('menu.formEntries') }}</q-item-label>
              <q-item-label caption class="text-white" style="font-size: 8px !important;">{{ t('menu.formEntriesCaption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-chip
                v-if="activeMenuItem === '/form-entries'"
                color="white"
                text-color="primary"
                size="sm"
              >
                Active
              </q-chip>
            </q-item-section>
          </q-item>

          <q-separator />

          <q-item-label header class="text-white">{{ t('app.quickStats') }}</q-item-label>

          <q-item>
            <q-item-section>
              <q-item-label>{{ t('app.totalEntries') }}</q-item-label>
              <q-item-label caption class="text-white-80">{{ entries.length }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="list" color="white" />
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>{{ t('app.balance') }}</q-item-label>
              <q-item-label caption class="text-white-80" :class="getAmountColorClass(balance)">{{ currencify(balance) }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="account_balance_wallet" color="white" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-drawer>

      <q-page-container>
        <transition
          name="slide-left"
          appear
          mode="out-in"
        >
          <router-view />
        </transition>
      </q-page-container>

      <!-- Global Footer -->
      <q-footer :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark'">
        <div class="q-py-sm q-px-md">
          <div class="row items-center justify-between">
            <div :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'" class="text-caption">Balance:</div>
            <div class="text-h6" :class="getAmountColorClass(balance)">
              {{ currencify(balance) }}
            </div>
          </div>
        </div>
      </q-footer>
    </q-layout>
  `,
  setup() {
    const store = useEntriesStore()
    const router = VueRouter.useRouter()
    const i18nLang = Vue.ref(window.i18n?.lang || 'en')
    if (window.i18n?.onChange) {
      window.i18n.onChange((lang) => {
        i18nLang.value = lang
      })
    }

    // Initialize UI state from store
    store.initializeUIState()

    // Create local reactive drawer state with localStorage persistence
    const savedDrawerState = localStorage.getItem('Tulipes-drawer-state') === 'true'
    const localDrawerOpen = Vue.ref(savedDrawerState)

    // Simple drawer toggle function with persistence
    const toggleLeftDrawer = () => {
      localDrawerOpen.value = !localDrawerOpen.value
      localStorage.setItem('Tulipes-drawer-state', localDrawerOpen.value.toString())
      console.log('Drawer toggled:', localDrawerOpen.value)
    }

    // Sync with store when needed
    const onDrawerShow = () => {
      localDrawerOpen.value = true
      localStorage.setItem('Tulipes-drawer-state', 'true')
      store.onDrawerShow()
    }

    const onDrawerHide = () => {
      localDrawerOpen.value = false
      localStorage.setItem('Tulipes-drawer-state', 'false')
      store.onDrawerHide()
    }

    const entries = Vue.ref([
      { id: 'id1', name: 'Salary', amount: 4999.99 },
      { id: 'id2', name: 'Rent', amount: -999 },
      { id: 'id3', name: 'Phone', amount: -14.99 },
      { id: 'id4', name: 'Unknown', amount: 0 }
    ])

    const balance = Vue.computed(() => {
      return entries.value.reduce((accumulator, { amount }) => {
        return accumulator + amount
      }, 0)
    })

    const currencify = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount)
    }

    // Transition management
    const transitionName = Vue.ref('fade')
    const previousRoute = Vue.ref('')

    // Watch route changes to determine transition
    const currentPath = Vue.ref(router.currentRoute.value?.path || '/')

    Vue.watch(() => router.currentRoute.value?.path, (newPath, oldPath) => {
      console.log('Route changed from', oldPath || currentPath.value, 'to', newPath)
      if (oldPath && newPath) {
        // Determine transition based on route hierarchy
        if (newPath === '/' && oldPath !== '/') {
          transitionName.value = 'slide-right' // Going to home
        } else if (oldPath === '/' && newPath !== '/') {
          transitionName.value = 'slide-left' // Going from home
        } else {
          transitionName.value = 'fade' // Default fade
        }
      }
      currentPath.value = newPath
    }, { immediate: true })

    const getAmountColorClass = (amount) => {
      if (amount > 0) return 'text-positive'
      if (amount < 0) return 'text-negative'
      return 'text-grey-7'
    }

    const applyDir = (lang) => {
      const isRtl = lang === 'ar'
      document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr')
      document.body.classList.toggle('rtl', isRtl)
      if (Quasar?.rtl?.set) {
        Quasar.rtl.set(isRtl)
      }
    }

    const setLanguage = (lang) => {
      if (window.i18n?.setLang) {
        window.i18n.setLang(lang)
      } else {
        localStorage.setItem('Tulipes-language', lang)
      }
      applyDir(lang)
      if (Quasar?.lang?.set) {
        if (lang === 'fr' && Quasar.lang.fr) Quasar.lang.set(Quasar.lang.fr)
        if (lang === 'ar' && Quasar.lang.ar) Quasar.lang.set(Quasar.lang.ar)
        if (lang === 'en' && Quasar.lang.enUS) Quasar.lang.set(Quasar.lang.enUS)
      }
    }
    const t = (key) => {
      void i18nLang.value
      return window.i18n?.t ? window.i18n.t(key) : key
    }

    // Set initial states after component is mounted
    Vue.onMounted(() => {
      console.log('Component mounted, UI State:', store.uiState)

      // Set active menu based on current path
      const currentPath = store.getCurrentPath()
      store.uiState.activeMenuItem = currentPath
      store.saveToStorage('Tulipes-active-menu', currentPath)

      const savedLang = localStorage.getItem('Tulipes-language') || 'en'
      setLanguage(savedLang)
    })

    // Watch for active menu changes and force reactivity
    Vue.watch(() => store.uiState.activeMenuItem, (newVal, oldVal) => {
      console.log('Active menu changed from', oldVal, 'to', newVal)
    })

    return {
      entries,
      balance,
      currencify,
      getAmountColorClass,
      localDrawerOpen,
      transitionName,
      previousRoute,
      // UI state from store - using computed properties for better reactivity
      drawerState: Vue.computed(() => localDrawerOpen.value ? 'open' : 'closed'),
      activeMenuItem: Vue.computed(() => store.uiState.activeMenuItem),
      // Local functions
      toggleLeftDrawer,
      onDrawerShow,
      onDrawerHide,
      // Store functions
      navigateToAndClose: store.navigateToAndClose.bind(store),
      setActiveMenuAndNavigate: store.setActiveMenuAndNavigate.bind(store),
      currentPath: Vue.computed(() => store.getCurrentPath()),
      navigateTo: store.navigateTo.bind(store),
      setLanguage,
      t
    }
  }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.MainLayout = MainLayout;
  console.log('MainLayout registered to window.MainLayout');
}
