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
        <q-toolbar>
          <q-btn
            flat
            dense
            round
            icon="menu"
            @click="toggleLeftDrawer"
            :color="drawerState === 'open' ? 'white' : 'white'"
          />
          <q-toolbar-title>
            Moneyballs
            <q-badge
              v-if="drawerState !== 'closed'"
              color="white"
              text-color="primary"
              class="q-ml-sm"
              :label="drawerState"
            />
          </q-toolbar-title>
          <q-btn flat round dense icon="settings" @click="navigateTo('/settings')" />
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
          <q-item-label header class="text-white">Navigation</q-item-label>

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
              <q-item-label>Entries</q-item-label>
              <q-item-label caption class="text-white" style="font-size: 8px !important;">Manage entries</q-item-label>
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
              <q-item-label>Settings</q-item-label>
              <q-item-label caption class="text-white" style="font-size: 8px !important;">App configuration</q-item-label>
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

          <q-separator />

          <q-item-label header class="text-white">Quick Stats</q-item-label>

          <q-item>
            <q-item-section>
              <q-item-label>Total Entries</q-item-label>
              <q-item-label caption class="text-white-80">{{ entries.length }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="list" color="white" />
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>Balance</q-item-label>
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

    // Initialize UI state from store
    store.initializeUIState()

    // Create local reactive drawer state with localStorage persistence
    const savedDrawerState = localStorage.getItem('moneyballs-drawer-state') === 'true'
    const localDrawerOpen = Vue.ref(savedDrawerState)

    // Simple drawer toggle function with persistence
    const toggleLeftDrawer = () => {
      localDrawerOpen.value = !localDrawerOpen.value
      localStorage.setItem('moneyballs-drawer-state', localDrawerOpen.value.toString())
      console.log('Drawer toggled:', localDrawerOpen.value)
    }

    // Sync with store when needed
    const onDrawerShow = () => {
      localDrawerOpen.value = true
      localStorage.setItem('moneyballs-drawer-state', 'true')
      store.onDrawerShow()
    }

    const onDrawerHide = () => {
      localDrawerOpen.value = false
      localStorage.setItem('moneyballs-drawer-state', 'false')
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
    Vue.watch(() => router.currentRoute, (to, from) => {
      console.log('Route changed from', from?.path, 'to', to?.path)
      if (from && to) {
        // Determine transition based on route hierarchy
        if (to.path === '/' && from.path !== '/') {
          transitionName.value = 'slide-right' // Going to home
        } else if (from.path === '/' && to.path !== '/') {
          transitionName.value = 'slide-left' // Going from home
        } else {
          transitionName.value = 'fade' // Default fade
        }
      }
    }, { immediate: true })

    const getAmountColorClass = (amount) => {
      if (amount > 0) return 'text-positive'
      if (amount < 0) return 'text-negative'
      return 'text-grey-7'
    }

    // Set initial states after component is mounted
    Vue.onMounted(() => {
      console.log('Component mounted, UI State:', store.uiState)

      // Set active menu based on current path
      const currentPath = store.getCurrentPath()
      store.uiState.activeMenuItem = currentPath
      store.saveToStorage('moneyballs-active-menu', currentPath)
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
      navigateTo: store.navigateTo.bind(store)
    }
  }
}
