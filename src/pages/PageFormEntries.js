console.log('Registering PageFormEntries component');

// PageFormEntries component with QStepper https://codepen.io/Css_B/pen/MWmrggZ
const PageFormEntries = {
  template: `
    <q-page padding>
      <q-stepper
        v-model="step"
        ref="stepper"
        color="primary"
        animated
        header-nav
        done-color="positive"
        active-color="primary"
      >
        <!-- Step 1: Personal Information -->
        <q-step
          :name="1"
          title="Personal Information"
          icon="person"
          :done="step > 1"
        >
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6" v-for="field in personalFields" :key="field.model">
              <q-input
                v-model="formData[field.model]"
                :label="field.label"
                :type="field.type || 'text'"
                outlined
                dense
                class="q-mb-sm"
              />
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
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6" v-for="field in contactFields" :key="field.model">
              <q-input
                v-model="formData[field.model]"
                :label="field.label"
                :type="field.type || 'text'"
                outlined
                dense
                class="q-mb-sm"
              />
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
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12" v-for="field in additionalFields" :key="field.model">
              <q-input
                v-model="formData[field.model]"
                :label="field.label"
                :type="field.type || 'text'"
                outlined
                dense
                class="q-mb-sm"
              />
            </div>
          </div>
        </q-step>

        <!-- Step 4: Review & Submit -->
        <q-step
          :name="4"
          title="Review & Submit"
          icon="check_circle"
        >
          <div class="q-pa-md">
            <div v-for="(value, key) in formData" :key="key" class="q-mb-sm">
              <strong>{{ formatLabel(key) }}:</strong> {{ value || 'Not provided' }}
            </div>
          </div>
        </q-step>

        <!-- Navigation buttons -->
        <template v-slot:navigation>
          <q-stepper-navigation class="row justify-between">
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
    </q-page>
  `,
  setup() {
    const step = Vue.ref(1);
    const formData = Vue.reactive({});

    // Define form fields for each step
    const personalFields = [
      { model: 'firstName', label: 'First Name', type: 'text' },
      { model: 'lastName', label: 'Last Name', type: 'text' },
      { model: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
      // Add more personal fields as needed
    ];

    const contactFields = [
      { model: 'email', label: 'Email', type: 'email' },
      { model: 'phone', label: 'Phone Number', type: 'tel' },
      { model: 'address', label: 'Address', type: 'text' },
      // Add more contact fields as needed
    ];

    const additionalFields = [
      { model: 'notes', label: 'Additional Notes', type: 'textarea' },
      // Add more additional fields as needed
    ];

    // Initialize form data with empty values
    const initializeFormData = () => {
      [...personalFields, ...contactFields, ...additionalFields].forEach(field => {
        formData[field.model] = '';
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
      submitForm
    };
  }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.PageFormEntries = PageFormEntries;
  console.log('PageFormEntries registered to window.PageFormEntries');
}
