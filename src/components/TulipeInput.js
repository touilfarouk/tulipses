console.log('Registering TulipeInput component');

// Reusable input component for Quasar forms
const TulipeInput = {
  props: ['input_data'],
  emits: ['update_input_data'],
  template: `
    <div class="q-mb-sm" :class="content.wrapper_class">
      <div class="text-subtitle2 q-mb-xs">
        {{ content.label }}
        <span v-if="content.required" class="text-negative text-weight-bold">*</span>
      </div>

      <q-input
        v-if="isTextInput"
        v-model="content.value"
        :type="content.type || 'text'"
        :label="content.placeholder || ''"
        :maxlength="content.maxlength"
        :minlength="content.minlength"
        :disable="content.disabled"
        :readonly="content.readonly"
        :required="content.required"
        :autocomplete="content.autocomplete"
        :autofocus="content.autofocus"
        :step="content.step"
        :min="content.min"
        :max="content.max"
        :error="!!content.error"
        :error-message="content.error_message"
        dense
        outlined
      />

      <q-input
        v-else-if="isTextarea"
        v-model="content.value"
        type="textarea"
        :label="content.placeholder || ''"
        :maxlength="content.maxlength"
        :minlength="content.minlength"
        :disable="content.disabled"
        :readonly="content.readonly"
        :required="content.required"
        :autocomplete="content.autocomplete"
        :autofocus="content.autofocus"
        :error="!!content.error"
        :error-message="content.error_message"
        autogrow
        dense
        outlined
      />

      <q-select
        v-else-if="isSelect"
        v-model="content.value"
        :options="content.options || []"
        :label="content.placeholder || ''"
        :disable="content.disabled"
        :readonly="content.readonly"
        :required="content.required"
        :multiple="!!content.multiple"
        :use-chips="!!content.multiple"
        :emit-value="content.emitValue !== false"
        :map-options="content.mapOptions !== false"
        :error="!!content.error"
        :error-message="content.error_message"
        dense
        outlined
      />

      <q-option-group
        v-else-if="isRadioGroup"
        v-model="content.value"
        :options="content.options || []"
        type="radio"
        :disable="content.disabled"
        :readonly="content.readonly"
        color="primary"
      />

      <q-option-group
        v-else-if="isCheckboxGroup"
        v-model="content.value"
        :options="content.options || []"
        type="checkbox"
        :disable="content.disabled"
        :readonly="content.readonly"
        color="primary"
      />

      <q-checkbox
        v-else-if="isCheckbox"
        v-model="content.value"
        :label="content.placeholder || ''"
        :disable="content.disabled"
        :readonly="content.readonly"
        color="primary"
      />
    </div>
  `,
  setup(props, ctx) {
    const content = Vue.reactive(Object.assign({}, props.input_data));

    Vue.watch(
      () => props.input_data,
      (next) => {
        Object.assign(content, next || {});
      },
      { deep: true }
    );

    Vue.watch(
      () => content.value,
      (newValue, oldValue) => {
        if (newValue !== oldValue) {
          delete content.error;
          delete content.error_message;
          ctx.emit('update_input_data', newValue);
        }
      }
    );

    const isTextarea = Vue.computed(() => content.type === 'textarea');
    const isSelect = Vue.computed(() => content.type === 'select' || content.type === 'multiselect');
    const isRadioGroup = Vue.computed(() => content.type === 'radio');
    const isCheckboxGroup = Vue.computed(() => content.type === 'checkbox-group');
    const isCheckbox = Vue.computed(() => content.type === 'checkbox');
    const isTextInput = Vue.computed(() => {
      return !isTextarea.value && !isSelect.value && !isRadioGroup.value && !isCheckboxGroup.value && !isCheckbox.value;
    });

    return {
      content,
      isTextarea,
      isSelect,
      isRadioGroup,
      isCheckboxGroup,
      isCheckbox,
      isTextInput
    };
  }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.TulipeInput = TulipeInput;
  console.log('TulipeInput registered to window.TulipeInput');
}
