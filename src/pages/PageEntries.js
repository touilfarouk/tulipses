console.log('Registering PageEntries component');

// PageEntries component
const PageEntries = {
  template: `
    <q-page>
      <div class="q-pa-md">
        <!-- Mobile-friendly card layout with slide actions -->
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-card flat bordered class="shadow-2">
            <q-card-section>
                <div class="text-h6 q-mb-md">{{ t('title') }}</div>
                <q-list separator>
                  <q-slide-item
                    v-for="entry in entries"
                    :key="entry.id"
                    @left="({ reset }) => { onSwipeLeft(entry, reset) }"
                    @right="({ reset }) => { onSwipeRight(entry, reset) }"
                    left-color="negative"
                    right-color="positive"
                    :touchable="true"
                    :mouseable="true"
                    :threshold="0.2"
                    :immediate-check="false"
                  >
                    <q-item
                      clickable
                      @click="showEntryActions(entry)"
                      :class="{ 'bg-green-1': entry.paid }"
                      class="q-py-md"
                      style="touch-action: pan-y;"
                    >
                      <q-item-section>
                        <q-item-label class="text-weight-bold" :class="getAmountColorClass(entry.amount)">
                          {{ entry.name }}
                        </q-item-label>
                        <q-item-label caption>
                          {{ currencify(entry.amount) }}
                          <q-chip v-if="entry.paid" color="positive" text-color="white" size="sm" class="q-ml-sm">
                            {{ t('paid') }}
                          </q-chip>
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <div class="text-h6" :class="getAmountColorClass(entry.amount)">
                          {{ currencify(entry.amount) }}
                        </div>
                        <q-item-label caption class="text-right">
                          <q-icon name="more_vert" />
                          <span class="q-ml-xs text-grey-6">{{ t('swipeOrTap') }}</span>
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                    <template v-slot:left>
                      <div class="row items-center no-wrap">
                        <q-icon name="delete" class="q-mr-sm" size="24px" />
                        <div class="text-center">
                          <div class="text-weight-medium">{{ t('delete') }}</div>
                          <div class="text-caption">{{ t('swipeLeft') }}</div>
                        </div>
                      </div>
                    </template>
                    <template v-slot:right>
                      <div class="row items-center no-wrap">
                        <div class="text-center">
                          <div class="text-weight-medium">{{ t('markPaid') }}</div>
                          <div class="text-caption">{{ t('swipeRight') }}</div>
                        </div>
                        <q-icon name="check" class="q-ml-sm" size="24px" />
                      </div>
                    </template>
                  </q-slide-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Form Container -->
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12">
            <q-card flat bordered class="shadow-2">
              <q-card-section>
                <div class="text-h6 q-mb-md">{{ t('addNewEntry') }}</div>
                <div class="row q-col-gutter-sm">
                  <div class="col-12 col-sm-5">
                    <q-input
                      v-model="newEntry.name"
                      :placeholder="t('entryName')"
                      bg-color="grey-2"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-input
                      v-model="newEntry.amount"
                      input-class="text-right"
                      :placeholder="t('amount')"
                      bg-color="grey-2"
                      type="number"
                      step="0.01"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col-12 col-sm-3">
                    <q-btn
                      color="primary"
                      icon="add"
                      :label="t('add')"
                      class="full-width"
                      @click="addEntry"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Action Dialog -->
      <q-dialog v-model="actionDialog" position="bottom">
        <q-card style="width: 350px">
          <q-card-section>
            <div class="text-h6">{{ selectedEntry?.name }}</div>
            <div class="text-subtitle2" :class="getAmountColorClass(selectedEntry?.amount || 0)">
              {{ currencify(selectedEntry?.amount || 0) }}
            </div>
          </q-card-section>
          <q-card-actions align="around">
            <q-btn
              flat
              :color="selectedEntry?.paid ? 'orange' : 'positive'"
              :icon="selectedEntry?.paid ? 'undo' : 'check'"
              :label="selectedEntry?.paid ? t('unmarkPaid') : t('markPaid')"
              @click="togglePaid(selectedEntry?.id)"
            />
            <q-btn
              flat
              color="negative"
              icon="delete"
              :label="t('delete')"
              @click="deleteEntry(selectedEntry?.id)"
            />
            <q-btn
              flat
              color="primary"
              icon="close"
              :label="t('cancel')"
              @click="actionDialog = false"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
  `,
  setup() {
    const i18nLang = Vue.ref(window.i18n?.lang || 'en')
    const labels = Vue.ref({})
    const entries = Vue.ref([])
    if (window.i18n?.onChange) {
      window.i18n.onChange((lang) => {
        i18nLang.value = lang
        loadScreenData()
      })
    }

    const newEntry = Vue.ref({
      name: '',
      amount: '',
    })

    const actionDialog = Vue.ref(false)
    const selectedEntry = Vue.ref(null)

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

    const getAmountColorClass = (amount) => {
      if (amount > 0) return 'text-positive'
      if (amount < 0) return 'text-negative'
      return 'text-grey-7'
    }

    const t = (key) => {
      void i18nLang.value
      return labels.value?.[key] || key
    }

    const format = (template, vars) => {
      let text = template || ''
      Object.entries(vars || {}).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, value)
      })
      return text
    }

    const loadScreenData = async () => {
      try {
        const lang = window.i18n?.lang || 'en'
        const data = await window.screenData.load('entries', lang)
        if (!data) throw new Error('No screen data returned')
        labels.value = data.labels || {}
        entries.value = data.entries || []
      } catch (error) {
        console.error('Entries load failed', error)
        labels.value = {}
        entries.value = []
      }
    }

    const showEntryActions = (entry) => {
      selectedEntry.value = entry
      actionDialog.value = true
    }

    const onSwipeLeft = (entry, reset) => {
      // Swipe left = Delete with confirmation
      Quasar.Dialog.create({
        title: t('confirmDeleteTitle'),
        message: format(t('confirmDeleteMessage'), { name: entry.name }),
        cancel: true,
        persistent: true,
        ok: {
          label: t('okDelete'),
          color: 'negative'
        },
        cancel: {
          label: t('cancel'),
          color: 'primary'
        }
      }).onOk(() => {
        const index = entries.value.findIndex(e => e.id === entry.id)
        if (index > -1) {
          entries.value.splice(index, 1)
        }
        reset() // Reset the slide item after action
      }).onCancel(() => {
        reset() // Reset the slide item if cancelled
      })
    }

    const onSwipeRight = (entry, reset) => {
      // Swipe right = Mark Paid with confirmation
      const action = entry.paid ? t('actionUnmarkPaid') : t('actionMarkPaid')
      Quasar.Dialog.create({
        title: t('confirmStatusTitle'),
        message: format(t('confirmStatusMessage'), { action, name: entry.name }),
        cancel: true,
        persistent: true,
        ok: {
          label: entry.paid ? t('okUnmarkPaid') : t('okMarkPaid'),
          color: 'positive'
        },
        cancel: {
          label: t('cancel'),
          color: 'primary'
        }
      }).onOk(() => {
        entry.paid = !entry.paid
        reset() // Reset the slide item after action
      }).onCancel(() => {
        reset() // Reset the slide item if cancelled
      })
    }

    const addEntry = () => {
      if (newEntry.value.name && newEntry.value.amount) {
        entries.value.push({
          id: 'id' + Date.now(),
          name: newEntry.value.name,
          amount: parseFloat(newEntry.value.amount),
          paid: false
        })
        newEntry.value.name = ''
        newEntry.value.amount = ''
      }
    }

    const togglePaid = (id) => {
      const entry = entries.value.find(entry => entry.id === id)
      if (entry) {
        entry.paid = !entry.paid
        actionDialog.value = false
      }
    }

    const deleteEntry = (id) => {
      const entry = entries.value.find(entry => entry.id === id)
      if (entry) {
        Quasar.Dialog.create({
          title: t('confirmDeleteTitle'),
          message: format(t('confirmDeleteMessage'), { name: entry.name }),
          cancel: true,
          persistent: true,
          ok: {
            label: t('okDelete'),
            color: 'negative'
          },
          cancel: {
            label: t('cancel'),
            color: 'primary'
          }
        }).onOk(() => {
          const index = entries.value.findIndex(entry => entry.id === id)
          if (index > -1) {
            entries.value.splice(index, 1)
          }
          actionDialog.value = false
        })
      }
    }

    Vue.onMounted(() => {
      loadScreenData()
    })

    return {
      entries,
      newEntry,
      balance,
      currencify,
      getAmountColorClass,
      actionDialog,
      selectedEntry,
      t,
      showEntryActions,
      onSwipeLeft,
      onSwipeRight,
      addEntry,
      togglePaid,
      deleteEntry
    }
  }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.PageEntries = PageEntries;
  console.log('PageEntries registered to window.PageEntries');
}
