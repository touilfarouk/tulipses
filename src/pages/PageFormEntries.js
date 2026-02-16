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
          :title="t('step1')"
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
          :title="t('step2')"
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
          :title="t('step3')"
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
          :title="t('step4')"
          icon="check_circle"
        >
          <div class="stepper-pane">
            <div v-for="(value, key) in formData" :key="key" class="q-mb-sm">
              <strong>{{ formatLabel(key) }}:</strong> {{ value || t('notProvided') }}
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
              :label="t('back')"
              class="q-ml-sm"
            />
            <q-space />
            <q-btn
              v-if="step < 4"
              @click="$refs.stepper.next()"
              color="primary"
              :label="step === 4 ? t('submit') : t('continue')"
            />
            <q-btn
              v-else
              @click="submitForm"
              color="positive"
              :label="t('submitForm')"
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
    const labels = Vue.ref({});
    const personalFields = Vue.ref([]);
    const contactFields = Vue.ref([]);
    const additionalFields = Vue.ref([]);
    const labelMap = Vue.ref({});
    const i18nLang = Vue.ref(window.i18n?.lang || 'en');
    if (window.i18n?.onChange) {
      window.i18n.onChange((lang) => {
        i18nLang.value = lang;
        loadScreenData();
      });
    }

    // Initialize form data with empty values
    const initializeFormData = () => {
      [...personalFields.value, ...contactFields.value, ...additionalFields.value].forEach(field => {
        formData[field.name] = field.value !== undefined ? field.value : '';
      });
    };

    const formatLabel = (key) => {
      return labelMap.value[key] || key
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

    const t = (key) => {
      void i18nLang.value;
      return labels.value?.[key] || key;
    };

    const rebuildLabelMap = () => {
      const map = {};
      [...personalFields.value, ...contactFields.value, ...additionalFields.value].forEach(field => {
        if (field?.name && field?.label) {
          map[field.name] = field.label;
        }
      });
      labelMap.value = map;
    };

    const loadScreenData = async () => {
      try {
        const lang = window.i18n?.lang || 'en';
        const data = await window.screenData.load('form-entries', lang);
        if (!data) throw new Error('No screen data returned');
        labels.value = data.labels || {};
        personalFields.value = data.personalFields || [];
        contactFields.value = data.contactFields || [];
        additionalFields.value = data.additionalFields || [];
        rebuildLabelMap();
        initializeFormData();
      } catch (error) {
        console.error('Form entries load failed', error);
        labels.value = {};
        personalFields.value = [];
        contactFields.value = [];
        additionalFields.value = [];
        labelMap.value = {};
        initializeFormData();
      }
    };

    // Initialize form data when component is mounted
    Vue.onMounted(() => {
      loadScreenData();
    });

    return {
      step,
      formData,
      personalFields,
      contactFields,
      additionalFields,
      formatLabel,
      t,
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
