// PageSettings.js
console.log('Loading PageSettings component...');

const PageSettings = {
    template: `
        <q-page padding>
            <div class="row q-col-gutter-md">
                <div class="col-12">
                    <q-card class="shadow-2">
                        <q-card-section>
                            <div class="text-h6">Settings</div>
                            <div class="text-subtitle2">Configure your application</div>
                        </q-card-section>
                        <q-card-section>
                            <q-list>
                                <q-item>
                                    <q-item-section>
                                        <q-item-label>Theme</q-item-label>
                                        <q-item-label caption>Change the application theme</q-item-label>
                                    </q-item-section>
                                    <q-item-section side>
                                        <q-toggle v-model="darkMode" @update:model-value="toggleDarkMode" />
                                    </q-item-section>
                                </q-item>
                                <q-separator />
                                <q-item>
                                    <q-item-section>
                                        <q-item-label>Currency</q-item-label>
                                        <q-item-label caption>Set your preferred currency</q-item-label>
                                    </q-item-section>
                                    <q-item-section side>
                                        <q-select 
                                            v-model="currency" 
                                            :options="['USD', 'EUR', 'GBP', 'JPY']" 
                                            dense 
                                            borderless 
                                        />
                                    </q-item-section>
                                </q-item>
                            </q-list>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </q-page>
    `,
    setup() {
        console.log('PageSettings setup called');
        
        const darkMode = Vue.ref(false);
        const currency = Vue.ref('USD');

        const toggleDarkMode = (value) => {
            console.log('Dark mode:', value);
            document.body.classList.toggle('body--dark', value);
        };

        return {
            darkMode,
            currency,
            toggleDarkMode
        };
    }
};

// Export to window for global access
console.log('Registering PageSettings component');
window.PageSettings = PageSettings;