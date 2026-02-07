// PageEntries.js
console.log('Loading PageEntries component...');

const PageEntries = {
    template: `
        <q-page padding>
            <div class="row q-col-gutter-md">
                <div class="col-12">
                    <q-card class="shadow-2">
                        <q-card-section>
                            <div class="text-h6">Your Entries</div>
                            <div class="text-subtitle2">Manage your financial entries</div>
                        </q-card-section>
                        <q-card-section>
                            <div v-if="entries.length === 0" class="text-center q-pa-md">
                                <q-icon name="receipt" size="3rem" color="grey-5" />
                                <div class="text-grey-5 q-mt-sm">No entries yet</div>
                            </div>
                            <q-list v-else separator>
                                <q-item 
                                    v-for="entry in entries" 
                                    :key="entry.id"
                                    class="q-my-sm"
                                    clickable
                                    v-ripple
                                >
                                    <q-item-section>
                                        <q-item-label>{{ entry.name }}</q-item-label>
                                        <q-item-label caption>{{ formatDate(entry.date) }}</q-item-label>
                                    </q-item-section>
                                    <q-item-section side>
                                        <q-badge 
                                            :color="entry.amount >= 0 ? 'positive' : 'negative'"
                                            :label="formatCurrency(entry.amount)"
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
        console.log('PageEntries setup called');
        
        const entries = Vue.ref([
            { id: 1, name: 'Salary', amount: 3000, date: '2023-06-15' },
            { id: 2, name: 'Rent', amount: -1000, date: '2023-06-10' },
            { id: 3, name: 'Groceries', amount: -200, date: '2023-06-12' }
        ]);

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        };

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString();
        };

        return {
            entries,
            formatCurrency,
            formatDate
        };
    }
};

// Export to window for global access
console.log('Registering PageEntries component');
window.PageEntries = PageEntries;