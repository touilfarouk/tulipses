console.log('Loading TablesDemo component...');

const TablesDemo = {
  template: `
    <q-page class="q-pa-md">
      <div class="text-h6 q-mb-md">Employee Data Management</div>

      <div class="row q-mb-md q-gutter-md">
        <div class="col-auto">
          <q-btn
            color="primary"
            icon="refresh"
            label="Refresh"
            @click="loadData"
            :loading="loading"
          />
        </div>
        <div class="col-auto">
          <q-btn
            color="secondary"
            icon="add"
            label="Add Employee"
            @click="showAddDialog = true"
          />
        </div>
        <div class="col-auto">
          <q-btn
            color="info"
            icon="download"
            label="Export CSV"
            @click="exportToCSV"
          />
        </div>
        <div class="col-auto">
          <q-btn
            color="warning"
            icon="upload"
            label="Import CSV"
            @click="triggerFileImport"
          />
        </div>
        <div class="col-auto">
          <q-btn
            color="negative"
            icon="delete"
            label="Clear All"
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
        <div class="q-mt-sm">Loading data...</div>
      </div>

      <div id="grid" style="width: 100%; height: 500px; border: 1px solid #ddd; border-radius: 4px;"></div>

      <!-- Add/Edit Dialog -->
      <q-dialog v-model="showAddDialog" persistent>
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">{{ editingEmployee ? 'Edit Employee' : 'Add New Employee' }}</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-form ref="employeeForm" @submit="saveEmployee">
              <q-input
                filled
                v-model="employeeForm.fname"
                label="First Name"
                class="q-mb-md"
                :rules="[val => !!val || 'First name is required']"
              />
              <q-input
                filled
                v-model="employeeForm.lname"
                label="Last Name"
                class="q-mb-md"
                :rules="[val => !!val || 'Last name is required']"
              />
              <q-input
                filled
                v-model="employeeForm.email"
                label="Email"
                type="email"
                class="q-mb-md"
                :rules="[val => !!val || 'Email is required', val => val.includes('@') || 'Invalid email']"
              />
              <q-input
                filled
                v-model="employeeForm.sdate"
                label="Start Date"
                type="date"
                class="q-mb-md"
                :rules="[val => !!val || 'Start date is required']"
              />
            </q-form>
          </q-card-section>

          <q-card-actions align="right" class="text-primary">
            <q-btn flat label="Cancel" @click="closeDialog" />
            <q-btn flat label="Save" @click="saveEmployee" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- View Dialog -->
      <q-dialog v-model="showViewDialog">
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">Employee Details</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div v-if="selectedEmployee">
              <p><strong>ID:</strong> {{ selectedEmployee.recid }}</p>
              <p><strong>First Name:</strong> {{ selectedEmployee.fname }}</p>
              <p><strong>Last Name:</strong> {{ selectedEmployee.lname }}</p>
              <p><strong>Email:</strong> {{ selectedEmployee.email }}</p>
              <p><strong>Start Date:</strong> {{ selectedEmployee.sdate }}</p>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Close" color="primary" @click="showViewDialog = false" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
  `,
  setup() {
    console.log('TablesDemo setup() called');
    const loading = Vue.ref(false);
    const showAddDialog = Vue.ref(false);
    const showViewDialog = Vue.ref(false);
    const editingEmployee = Vue.ref(false);
    const selectedEmployee = Vue.ref(null);
    const employeeForm = Vue.ref({
      fname: '',
      lname: '',
      email: '',
      sdate: ''
    });

    const loadData = async () => {
      console.log('=== loadData started ===');
      loading.value = true;
      try {
        // Try multiple possible URLs
        let dataUrl;
        if (window.location.pathname.includes('/tulipses/')) {
          dataUrl = '/tulipses/data/list.json';
        } else {
          dataUrl = 'data/list.json';
        }

        console.log('Fetching data from:', dataUrl);
        const response = await fetch(dataUrl);
        console.log('Fetch response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw JSON data:', data);
        console.log('Data records:', data.records);

        // Initialize grid with loaded data
        initGrid(data.records || []);
      } catch (error) {
        console.error('Error loading data:', error);
        // Initialize grid with empty data on error
        initGrid([]);
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
          header: 'Employee Management System',
          show: {
            toolbar: true,
            footer: true,
            lineNumbers: true,
            selectColumn: true,
            toolbarSearch: true,
            toolbarColumns: true
          },
          columns: [
            { field: 'recid', caption: 'ID', size: '80px', sortable: true, resizable: true },
            { field: 'fname', caption: 'First Name', size: '30%', sortable: true, resizable: true },
            { field: 'lname', caption: 'Last Name', size: '30%', sortable: true, resizable: true },
            { field: 'email', caption: 'Email', size: '40%', sortable: true, resizable: true },
            { field: 'sdate', caption: 'Start Date', size: '120px', sortable: true, resizable: true }
          ],
          toolbar: {
            items: [
              { type: 'break', id: 'break1' },
              { type: 'button', id: 'add', text: 'Add', icon: 'fa fa-plus', style: 'border-radius: 0px;' }, // Square button
              { type: 'button', id: 'edit', text: 'Edit', icon: 'fa fa-edit', style: 'border-radius: 0px;' }, // Square button
              { type: 'button', id: 'delete', text: 'Delete', icon: 'fa fa-trash', style: 'border-radius: 0px;' }, // Square button
              { type: 'break', id: 'break2' },
              { type: 'button', id: 'view', text: 'View', icon: 'fa fa-eye', style: 'border-radius: 4px;' }, // Rounded button
              { type: 'button', id: 'export', text: 'Export', icon: 'fa fa-download', style: 'border-radius: 12px;' }, // More rounded
              { type: 'button', id: 'import', text: 'Import', icon: 'fa fa-upload', style: 'border-radius: 20px;' }, // Very rounded
              { type: 'break', id: 'break3' },
              { type: 'button', id: 'refresh', text: 'Refresh', icon: 'fa fa-refresh', style: 'border-radius: 50%; width: 35px; height: 35px;' }, // Circular
              { type: 'spacer' },
              { type: 'html', id: 'info', html: '<span style="color: #666; padding: 8px;">Square buttons available!</span>' }
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
        showNotification('Please fill all required fields', 'negative');
        return;
      }

      if (editingEmployee.value) {
        // Update existing employee
        const index = window.currentGrid.records.findIndex(emp => emp.recid === editingEmployee.value.recid);
        if (index !== -1) {
          window.currentGrid.records[index] = { ...editingEmployee.value, ...employeeForm.value };
          window.currentGrid.refresh();
          showNotification('Employee updated successfully', 'positive');
        }
      } else {
        // Add new employee
        const newId = Math.max(...window.currentGrid.records.map(emp => emp.recid)) + 1;
        const newEmployee = { recid: newId, ...employeeForm.value };
        window.currentGrid.records.push(newEmployee);
        window.currentGrid.refresh();
        showNotification('Employee added successfully', 'positive');
      }

      closeDialog();
    };

    const editSelectedEmployee = () => {
      const selected = window.currentGrid.getSelection();
      if (selected.length === 0) {
        showNotification('Please select an employee to edit', 'warning');
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
        showNotification('Please select an employee to delete', 'warning');
        return;
      }

      if (confirm('Are you sure you want to delete this employee?')) {
        window.currentGrid.records = window.currentGrid.records.filter(emp => emp.recid !== selected[0]);
        window.currentGrid.refresh();
        showNotification('Employee deleted successfully', 'positive');
      }
    };

    const viewSelectedEmployee = () => {
      const selected = window.currentGrid.getSelection();
      if (selected.length === 0) {
        showNotification('Please select an employee to view', 'warning');
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
      const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Start Date'];
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

      showNotification('Data exported successfully', 'positive');
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
        showNotification(`${newRecords.length} records imported successfully`, 'positive');
      };

      reader.readAsText(file);
      event.target.value = '';
    };

    const confirmClearAll = () => {
      if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        window.currentGrid.records = [];
        window.currentGrid.refresh();
        showNotification('All data cleared', 'positive');
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
