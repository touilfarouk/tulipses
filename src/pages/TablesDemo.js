console.log('Loading TablesDemo component...');

const TablesDemo = {
  template: `
    <q-page class="q-pa-md">
      <div class="text-h6 q-mb-md">{{ t('tablesDemo.title') }}</div>

      <div class="row q-mb-md q-gutter-md">
        <div class="col-auto">
          <q-btn
            color="primary"
            icon="refresh"
            :label="t('tablesDemo.refresh')"
            @click="loadData"
            :loading="loading"
          />
        </div>
        <div class="col-auto">
          <q-btn
            color="secondary"
            icon="add"
            :label="t('tablesDemo.addEmployee')"
            @click="showAddDialog = true"
          />
        </div>
        <div class="col-auto">
          <q-btn
            color="info"
            icon="download"
            :label="t('tablesDemo.exportCsv')"
            @click="exportToCSV"
          />
        </div>
        <div class="col-auto">
          <q-btn
            color="warning"
            icon="upload"
            :label="t('tablesDemo.importCsv')"
            @click="triggerFileImport"
          />
        </div>
        <div class="col-auto">
          <q-btn
            color="negative"
            icon="delete"
            :label="t('tablesDemo.clearAll')"
            @click="confirmClearAll"
          />
        </div>
        <input
          type="file"
          ref="fileInput"
          accept=".csv"
          style="display: none"
          @change="handleFileImport"
        />
      </div>

      <div v-if="loading" class="text-center q-mt-md">
        <q-spinner-dots size="40px" color="primary" />
        <div class="q-mt-sm">{{ t('tablesDemo.loading') }}</div>
      </div>

      <div id="grid" style="width: 100%; height: 500px; border: 1px solid #ddd; border-radius: 4px;"></div>

      <!-- Add/Edit Dialog -->
      <q-dialog v-model="showAddDialog" persistent>
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">{{ editingEmployee ? t('tablesDemo.editEmployee') : t('tablesDemo.addNewEmployee') }}</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-form ref="employeeForm" @submit="saveEmployee">
              <q-input
                filled
                v-model="employeeForm.fname"
                :label="t('tablesDemo.firstName')"
                class="q-mb-md"
                :rules="[val => !!val || t('tablesDemo.firstNameRequired')]"
              />
              <q-input
                filled
                v-model="employeeForm.lname"
                :label="t('tablesDemo.lastName')"
                class="q-mb-md"
                :rules="[val => !!val || t('tablesDemo.lastNameRequired')]"
              />
              <q-input
                filled
                v-model="employeeForm.email"
                :label="t('tablesDemo.email')"
                type="email"
                class="q-mb-md"
                :rules="[val => !!val || t('tablesDemo.emailRequired'), val => val.includes('@') || t('tablesDemo.emailInvalid')]"
              />
              <q-input
                filled
                v-model="employeeForm.sdate"
                :label="t('tablesDemo.startDate')"
                type="date"
                class="q-mb-md"
                :rules="[val => !!val || t('tablesDemo.startDateRequired')]"
              />
            </q-form>
          </q-card-section>

          <q-card-actions align="right" class="text-primary">
            <q-btn flat :label="t('tablesDemo.cancel')" @click="closeDialog" />
            <q-btn flat :label="t('tablesDemo.save')" @click="saveEmployee" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- View Dialog -->
      <q-dialog v-model="showViewDialog">
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">{{ t('tablesDemo.employeeDetails') }}</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div v-if="selectedEmployee">
              <p><strong>{{ t('grid.id') }}:</strong> {{ selectedEmployee.recid }}</p>
              <p><strong>{{ t('tablesDemo.firstName') }}:</strong> {{ selectedEmployee.fname }}</p>
              <p><strong>{{ t('tablesDemo.lastName') }}:</strong> {{ selectedEmployee.lname }}</p>
              <p><strong>{{ t('tablesDemo.email') }}:</strong> {{ selectedEmployee.email }}</p>
              <p><strong>{{ t('tablesDemo.startDate') }}:</strong> {{ selectedEmployee.sdate }}</p>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat :label="t('tablesDemo.close')" color="primary" @click="showViewDialog = false" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
  `,
  setup() {
    console.log('TablesDemo setup() called');
    const loading = Vue.ref(false);
    const i18nLang = Vue.ref(window.i18n?.lang || 'en');
    if (window.i18n?.onChange) {
      window.i18n.onChange((lang) => {
        i18nLang.value = lang;
        loadData();
      });
    }
    const showAddDialog = Vue.ref(false);
    const showViewDialog = Vue.ref(false);
    const editingEmployee = Vue.ref(false);
    const selectedEmployee = Vue.ref(null);
    const gridData = Vue.ref([]);
    const employeeForm = Vue.ref({
      fname: '',
      lname: '',
      email: '',
      sdate: ''
    });

    const t = (key) => {
      void i18nLang.value;
      return window.i18n?.t ? window.i18n.t(key) : key;
    };

    const getDataUrl = (lang) => {
      const version = window.APP_VERSION || Date.now();
      const suffix = lang ? `.${lang}` : '';
      if (window.location.pathname.includes('/tulipses/')) {
        return `/tulipses/data/list${suffix}.json?v=${version}`;
      }
      return `data/list${suffix}.json?v=${version}`;
    };

    const loadData = async () => {
      console.log('=== loadData started ===');
      loading.value = true;
      try {
        const lang = window.i18n?.lang || 'en';
        const dataUrl = getDataUrl(lang);
        console.log('Fetching data from:', dataUrl);
        const response = await fetch(dataUrl, { cache: 'no-store' });
        console.log('Fetch response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw JSON data:', data);
        console.log('Data records:', data.records);

        // Initialize grid with loaded data
        gridData.value = data.records || [];
        initGrid(gridData.value);
      } catch (error) {
        console.error('Error loading data:', error);
        // Initialize grid with empty data on error
        gridData.value = [];
        initGrid(gridData.value);
      } finally {
        loading.value = false;
      }
    };

    const initGrid = (data) => {
      console.log('=== initGrid started ===');
      console.log('Data received:', data);
      console.log('Data type:', typeof data);
      console.log('Data length:', data ? data.length : 'null/undefined');
      console.log('w2ui available:', typeof w2ui !== 'undefined');
      console.log('w2grid available:', typeof w2grid !== 'undefined');

      // Check if w2ui is available
      if (typeof w2ui === 'undefined') {
        console.error('w2ui is not loaded! Cannot create grid.');
        const container = document.getElementById('grid');
        if (container) {
          container.innerHTML = '<div style="padding: 20px; color: red;">Error: w2ui library is not loaded.</div>';
        }
        return;
      }

      // Destroy existing grid if it exists
      if (w2ui && w2ui.grid) {
        console.log('Destroying existing grid');
        w2ui.grid.destroy();
      }

      // Make sure the container exists
      const container = document.getElementById('grid');
      console.log('Grid container element:', container);
      if (!container) {
        console.error('Grid container not found');
        return;
      }

      // Clear the container
      container.innerHTML = '';
      console.log('Container cleared');

      // Show loading message
      container.innerHTML = '<div style="padding: 20px;">Creating grid...</div>';

      try {
        console.log('Creating w2grid with native JavaScript...');

        // Use native w2ui 2.x approach (no jQuery required)
        const grid = new w2grid({
          name: 'grid',
          box: document.getElementById('grid'),
          header: t('tablesDemo.gridHeader'),
          show: {
            toolbar: true,
            footer: true,
            lineNumbers: true,
            selectColumn: true,
            toolbarSearch: true,
            toolbarColumns: true
          },
          columns: [
            { field: 'recid', caption: t('grid.id'), size: '80px', sortable: true, resizable: true },
            { field: 'fname', caption: t('tablesDemo.firstName'), size: '30%', sortable: true, resizable: true },
            { field: 'lname', caption: t('tablesDemo.lastName'), size: '30%', sortable: true, resizable: true },
            { field: 'email', caption: t('tablesDemo.email'), size: '40%', sortable: true, resizable: true },
            { field: 'sdate', caption: t('tablesDemo.startDate'), size: '120px', sortable: true, resizable: true }
          ],
          toolbar: {
            items: [
              { type: 'break', id: 'break1' },
              { type: 'button', id: 'add', text: t('tablesDemo.add'), icon: 'fa fa-plus', style: 'border-radius: 0px;' }, // Square button
              { type: 'button', id: 'edit', text: t('tablesDemo.edit'), icon: 'fa fa-edit', style: 'border-radius: 0px;' }, // Square button
              { type: 'button', id: 'delete', text: t('tablesDemo.delete'), icon: 'fa fa-trash', style: 'border-radius: 0px;' }, // Square button
              { type: 'break', id: 'break2' },
              { type: 'button', id: 'view', text: t('tablesDemo.view'), icon: 'fa fa-eye', style: 'border-radius: 4px;' }, // Rounded button
              { type: 'button', id: 'export', text: t('tablesDemo.export'), icon: 'fa fa-download', style: 'border-radius: 12px;' }, // More rounded
              { type: 'button', id: 'import', text: t('tablesDemo.import'), icon: 'fa fa-upload', style: 'border-radius: 20px;' }, // Very rounded
              { type: 'break', id: 'break3' },
              { type: 'button', id: 'refresh', text: t('tablesDemo.refreshAction'), icon: 'fa fa-refresh', style: 'border-radius: 50%; width: 35px; height: 35px;' }, // Circular
              { type: 'spacer' },
              { type: 'html', id: 'info', html: `<span style="color: #666; padding: 8px;">${t('tablesDemo.refreshAction')}</span>` }
            ],
            onClick: function (event) {
              console.log('Toolbar clicked:', event.target);
              handleToolbarAction(event.target);
            }
          },
          records: data
        });

        console.log('w2grid created successfully:', grid);
        console.log('w2ui.grid after creation:', w2ui.grid);

        window.currentGrid = grid;

        // Verify grid was created
        setTimeout(() => {
          console.log('Checking grid after 100ms...');
          console.log('Grid exists:', !!w2ui.grid);
          console.log('Grid records:', w2ui.grid ? w2ui.grid.records.length : 'N/A');
          console.log('Container children:', container.children.length);

          if (!w2ui.grid) {
            container.innerHTML = '<div style="padding: 20px; color: red;">Failed to create grid. Check console for errors.</div>';
          } else {
            console.log('Grid successfully created with', w2ui.grid.records.length, 'records');
          }
        }, 100);

      } catch (error) {
        console.error('Error creating grid:', error);
        console.error('Error stack:', error.stack);
        container.innerHTML = `<div style="padding: 20px; color: red;">Error creating grid: ${error.message}</div>`;
      }
    };

    // Handle toolbar actions
    const handleToolbarAction = (target) => {
      switch(target) {
        case 'add':
          showAddDialog.value = true;
          editingEmployee.value = false;
          resetForm();
          break;
        case 'edit':
          editSelectedEmployee();
          break;
        case 'delete':
          deleteSelectedEmployee();
          break;
        case 'view':
          viewSelectedEmployee();
          break;
        case 'export':
          exportToCSV();
          break;
        case 'import':
          triggerFileImport();
          break;
        case 'refresh':
          loadData();
          break;
        default:
          console.log('Unknown action:', target);
      }
    };

    // CRUD Operations
    const resetForm = () => {
      employeeForm.value = {
        fname: '',
        lname: '',
        email: '',
        sdate: ''
      };
    };

    const closeDialog = () => {
      showAddDialog.value = false;
      editingEmployee.value = false;
      resetForm();
    };

    const saveEmployee = () => {
      if (!employeeForm.value.fname || !employeeForm.value.lname || !employeeForm.value.email) {
        showNotification(t('tablesDemo.notifyFillRequired'), 'negative');
        return;
      }

      if (editingEmployee.value) {
        // Update existing employee
        const index = window.currentGrid.records.findIndex(emp => emp.recid === editingEmployee.value.recid);
        if (index !== -1) {
          window.currentGrid.records[index] = { ...editingEmployee.value, ...employeeForm.value };
          window.currentGrid.refresh();
          showNotification(t('tablesDemo.notifyUpdated'), 'positive');
        }
      } else {
        // Add new employee
        const newId = Math.max(...window.currentGrid.records.map(emp => emp.recid)) + 1;
        const newEmployee = { recid: newId, ...employeeForm.value };
        window.currentGrid.records.push(newEmployee);
        window.currentGrid.refresh();
        showNotification(t('tablesDemo.notifyAdded'), 'positive');
      }

      closeDialog();
    };

    const editSelectedEmployee = () => {
      const selected = window.currentGrid.getSelection();
      if (selected.length === 0) {
        showNotification(t('tablesDemo.notifySelectEdit'), 'warning');
        return;
      }

      const employee = window.currentGrid.records.find(emp => emp.recid === selected[0]);
      if (employee) {
        editingEmployee.value = employee;
        employeeForm.value = { ...employee };
        showAddDialog.value = true;
      }
    };

    const deleteSelectedEmployee = () => {
      const selected = window.currentGrid.getSelection();
      if (selected.length === 0) {
        showNotification(t('tablesDemo.notifySelectDelete'), 'warning');
        return;
      }

      if (confirm(t('tablesDemo.confirmDelete'))) {
        window.currentGrid.records = window.currentGrid.records.filter(emp => emp.recid !== selected[0]);
        window.currentGrid.refresh();
        showNotification(t('tablesDemo.notifyDeleted'), 'positive');
      }
    };

    const viewSelectedEmployee = () => {
      const selected = window.currentGrid.getSelection();
      if (selected.length === 0) {
        showNotification(t('tablesDemo.notifySelectView'), 'warning');
        return;
      }

      const employee = window.currentGrid.records.find(emp => emp.recid === selected[0]);
      if (employee) {
        selectedEmployee.value = employee;
        showViewDialog.value = true;
      }
    };

    const exportToCSV = () => {
      const records = window.currentGrid.records;
      const headers = [t('grid.id'), t('tablesDemo.firstName'), t('tablesDemo.lastName'), t('tablesDemo.email'), t('tablesDemo.startDate')];
      const csvContent = [
        headers.join(','),
        ...records.map(emp =>
          [emp.recid, emp.fname, emp.lname, emp.email, emp.sdate].join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employees.csv';
      a.click();
      window.URL.revokeObjectURL(url);

      showNotification(t('tablesDemo.exportSuccess'), 'positive');
    };

    const triggerFileImport = () => {
      document.querySelector('input[type="file"]').click();
    };

    const handleFileImport = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');

        const newRecords = lines.slice(1).filter(line => line.trim()).map((line, index) => {
          const values = line.split(',');
          return {
            recid: window.currentGrid.records.length + index + 1,
            fname: values[1]?.trim() || '',
            lname: values[2]?.trim() || '',
            email: values[3]?.trim() || '',
            sdate: values[4]?.trim() || ''
          };
        });

        window.currentGrid.records.push(...newRecords);
        window.currentGrid.refresh();
        showNotification(`${newRecords.length} ${t('tablesDemo.importSuccess')}`, 'positive');
      };

      reader.readAsText(file);
      event.target.value = '';
    };

    const confirmClearAll = () => {
      if (confirm(t('tablesDemo.confirmClear'))) {
        window.currentGrid.records = [];
        window.currentGrid.refresh();
        showNotification(t('tablesDemo.clearSuccess'), 'positive');
      }
    };

    const showNotification = (message, type = 'info') => {
      if (window.Quasar && window.Quasar.Notify) {
        window.Quasar.Notify.create({
          message,
          type,
          position: 'top',
          timeout: 2500
        });
      } else {
        alert(message);
      }
    };

    Vue.onMounted(() => {
      console.log('TablesDemo component mounted successfully!');

      // Wait for w2ui to be available (no jQuery needed in 2.x)
      const waitForW2ui = () => {
        if (typeof w2ui !== 'undefined' && typeof w2grid !== 'undefined') {
          console.log('w2ui is available, loading data...');
          loadData();
        } else {
          console.log('Waiting for w2ui to load...');
          console.log('w2ui available:', typeof w2ui !== 'undefined');
          console.log('w2grid available:', typeof w2grid !== 'undefined');
          setTimeout(waitForW2ui, 500);
        }
      };

      Vue.nextTick(() => {
        waitForW2ui();
      });
    });

    Vue.onUnmounted(() => {
      if (window.currentGrid) {
        window.currentGrid.destroy();
        window.currentGrid = null;
      }
    });

    return {
      loading,
      showAddDialog,
      showViewDialog,
      editingEmployee,
      selectedEmployee,
      employeeForm,
      t,
      loadData,
      handleToolbarAction,
      resetForm,
      closeDialog,
      saveEmployee,
      editSelectedEmployee,
      deleteSelectedEmployee,
      viewSelectedEmployee,
      exportToCSV,
      triggerFileImport,
      handleFileImport,
      confirmClearAll,
      showNotification
    };
  }
};

// Register the component
window.TablesDemo = TablesDemo;
console.log('TablesDemo registered to window.TablesDemo');
