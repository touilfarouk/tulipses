console.log('Registering PageFormEntries component');

// PageFormEntries component with QStepper
const PageFormEntries = {
  components: {
    'ed-input': window.AquaInput
  },
  template: `
    <q-page class="bg-grey-1" padding>
      <div class="wrapper-stepper">
        <q-stepper
          v-model="step"
          ref="stepper"
          color="primary"
          animated
          header-nav
          done-color="positive"
          active-color="primary"
          class="custom-stepper"
          flat
          square
        >
        <!-- Step 1: Personal Information -->
        <q-step
          :name="1"
          title="Personal Information"
          icon="person"
          :done="step > 1"
        >
          <div class="stepper-pane q-pa-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6" v-for="field in personalFields" :key="field.name">
                <ed-input
                  :input_data="field"
                  @update_input_data="(val) => onFieldUpdate(field, val)"
                />
              </div>
            </div>
          </div>
        </q-step>

        <!-- Step 2: Contact Information -->
        <q-step
          :name="2"
          title="Contact Information"
          icon="contact_mail"
          :done="step > 2"
        >
          <div class="stepper-pane q-pa-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6" v-for="field in contactFields" :key="field.name">
                <ed-input
                  :input_data="field"
                  @update_input_data="(val) => onFieldUpdate(field, val)"
                />
              </div>
            </div>
          </div>
        </q-step>

        <!-- Step 3: Additional Information -->
        <q-step
          :name="3"
          title="Additional Information"
          icon="info"
          :done="step > 3"
        >
          <div class="stepper-pane q-pa-md">
            <div class="row q-col-gutter-md">
              <div class="col-12" v-for="field in additionalFields" :key="field.name">
                <ed-input
                  :input_data="field"
                  @update_input_data="(val) => onFieldUpdate(field, val)"
                />
              </div>
            </div>
          </div>
        </q-step>

        <!-- Step 4: Review & Submit -->
        <q-step
          :name="4"
          title="Review & Submit"
          icon="check_circle"
        >
          <div class="stepper-pane">
            <div v-for="(value, key) in formData" :key="key" class="q-mb-sm">
              <strong>{{ formatLabel(key) }}:</strong> {{ value || 'Not provided' }}
            </div>
          </div>
        </q-step>

        <!-- Navigation buttons -->
        <template v-slot:navigation>
          <q-stepper-navigation class="row justify-between controls">
            <q-btn
              v-if="step > 1"
              flat
              color="primary"
              @click="$refs.stepper.previous()"
              label="Back"
              class="q-ml-sm"
            />
            <q-space />
            <q-btn
              v-if="step < 4"
              @click="$refs.stepper.next()"
              color="primary"
              :label="step === 4 ? 'Submit' : 'Continue'"
            />
            <q-btn
              v-else
              @click="submitForm"
              color="positive"
              label="Submit Form"
              icon="send"
            />
          </q-stepper-navigation>
        </template>
        </q-stepper>
      </div>
    </q-page>
  `,
  setup() {
    const step = Vue.ref(1);
    const formData = Vue.reactive({});

    // Define form fields for each step
    const personalFields = [
      { name: 'firstName', label: 'First Name', type: 'text', value: '' },
      { name: 'lastName', label: 'Last Name', type: 'text', value: '' },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', value: '' },
      // Add more personal fields as needed
    ];

    const contactFields = [
      { name: 'email', label: 'Email', type: 'email', value: '' },
      { name: 'phone', label: 'Phone Number', type: 'tel', value: '' },
      { name: 'address', label: 'Address', type: 'text', value: '' },
      // Add more contact fields as needed
    ];

    const additionalFields = [
      { name: 'notes', label: 'Additional Notes', type: 'textarea', value: '' },
      {
        name: 'preferredContact',
        label: 'Preferred Contact',
        type: 'radio',
        value: 'email',
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' }
        ]
      },
      {
        name: 'interests',
        label: 'Interests',
        type: 'multiselect',
        value: [],
        options: [
          { label: 'Reports', value: 'reports' },
          { label: 'Alerts', value: 'alerts' },
          { label: 'Invoices', value: 'invoices' }
        ],
        multiple: true
      }
      // Add more additional fields as needed
    ];

    // Initialize form data with empty values
    const initializeFormData = () => {
      [...personalFields, ...contactFields, ...additionalFields].forEach(field => {
        formData[field.name] = field.value !== undefined ? field.value : '';
      });
    };

    const formatLabel = (key) => {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
    };

    const submitForm = () => {
      console.log('Form submitted:', formData);
      // Add your form submission logic here
      // For example: API call to submit the form data
    };

    const onFieldUpdate = (field, value) => {
      formData[field.name] = value;
      field.value = value;
    };

    // Initialize form data when component is mounted
    Vue.onMounted(() => {
      initializeFormData();
    });

    return {
      step,
      formData,
      personalFields,
      contactFields,
      additionalFields,
      formatLabel,
      submitForm,
      onFieldUpdate
    };
  }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.PageFormEntries = PageFormEntries;
  console.log('PageFormEntries registered to window.PageFormEntries');
}
