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
                <div class="text-h6 q-mb-md">Entries</div>
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
                            Paid
                          </q-chip>
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <div class="text-h6" :class="getAmountColorClass(entry.amount)">
                          {{ currencify(entry.amount) }}
                        </div>
                        <q-item-label caption class="text-right">
                          <q-icon name="more_vert" />
                          <span class="q-ml-xs text-grey-6">Swipe or tap</span>
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                    <template v-slot:left>
                      <div class="row items-center no-wrap">
                        <q-icon name="delete" class="q-mr-sm" size="24px" />
                        <div class="text-center">
                          <div class="text-weight-medium">Delete</div>
                          <div class="text-caption">Swipe left</div>
                        </div>
                      </div>
                    </template>
                    <template v-slot:right>
                      <div class="row items-center no-wrap">
                        <div class="text-center">
                          <div class="text-weight-medium">Mark Paid</div>
                          <div class="text-caption">Swipe right</div>
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
                <div class="text-h6 q-mb-md">Add New Entry</div>
                <div class="row q-col-gutter-sm">
                  <div class="col-12 col-sm-5">
                    <q-input
                      v-model="newEntry.name"
                      placeholder="Entry name"
                      bg-color="grey-2"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-input
                      v-model="newEntry.amount"
                      input-class="text-right"
                      placeholder="Amount"
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
                      label="Add"
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
              :label="selectedEntry?.paid ? 'Unmark Paid' : 'Mark Paid'"
              @click="togglePaid(selectedEntry?.id)"
            />
            <q-btn
              flat
              color="negative"
              icon="delete"
              label="Delete"
              @click="deleteEntry(selectedEntry?.id)"
            />
            <q-btn
              flat
              color="primary"
              icon="close"
              label="Cancel"
              @click="actionDialog = false"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
  `,
  setup() {
    const entries = Vue.ref([
      { id: 'id1', name: 'Salary', amount: 4999.99, paid: false },
      { id: 'id2', name: 'Rent', amount: -999, paid: false },
      { id: 'id3', name: 'Phone', amount: -14.99, paid: true },
      { id: 'id4', name: 'Unknown', amount: 0, paid: false }
    ])

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

    const showEntryActions = (entry) => {
      selectedEntry.value = entry
      actionDialog.value = true
    }

    const onSwipeLeft = (entry, reset) => {
      // Swipe left = Delete with confirmation
      Quasar.Dialog.create({
        title: 'Confirm Delete',
        message: `Are you sure you want to delete "${entry.name}"?`,
        cancel: true,
        persistent: true,
        ok: {
          label: 'Delete',
          color: 'negative'
        },
        cancel: {
          label: 'Cancel',
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
      const action = entry.paid ? 'unmark as unpaid' : 'mark as paid'
      Quasar.Dialog.create({
        title: 'Confirm Status Change',
        message: `Are you sure you want to ${action} "${entry.name}"?`,
        cancel: true,
        persistent: true,
        ok: {
          label: entry.paid ? 'Unmark as Unpaid' : 'Mark as Paid',
          color: 'positive'
        },
        cancel: {
          label: 'Cancel',
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
          title: 'Confirm Delete',
          message: `Are you sure you want to delete "${entry.name}"?`,
          cancel: true,
          persistent: true,
          ok: {
            label: 'Delete',
            color: 'negative'
          },
          cancel: {
            label: 'Cancel',
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

    return {
      entries,
      newEntry,
      balance,
      currencify,
      getAmountColorClass,
      actionDialog,
      selectedEntry,
      showEntryActions,
      onSwipeLeft,
      onSwipeRight,
      addEntry,
      togglePaid,
      deleteEntry
    }
  }
}
