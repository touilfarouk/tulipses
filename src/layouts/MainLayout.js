// MainLayout.js
console.log('Loading MainLayout component...');

const MainLayout = {
    template: `
        <q-layout view="lHh Lpr lFf">
            <q-header elevated class="bg-primary text-white">
                <q-toolbar>
                    <q-toolbar-title>Moneyballs</q-toolbar-title>
                    <q-btn 
                        flat 
                        round 
                        dense 
                        icon="settings" 
                        :to="{ name: 'settings' }"
                        aria-label="Settings"
                    />
                </q-toolbar>
            </q-header>

            <q-page-container>
                <router-view v-slot="{ Component }">
                    <transition
                        enter-active-class="animated fadeIn"
                        leave-active-class="animated fadeOut"
                        mode="out-in"
                    >
                        <component :is="Component" />
                    </transition>
                </router-view>
            </q-page-container>
        </q-layout>
    `,
    setup() {
        console.log('MainLayout setup called');
        return {};
    }
};

// Export to window for global access
console.log('Registering MainLayout component');
window.MainLayout = MainLayout;