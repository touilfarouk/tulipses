console.log('Loading TablesDemo component...');

const TablesDemo = {
  template: `
    <q-page class="q-pa-md">
      <div class="text-h4 q-mb-md">Employee Data Management</div>

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
        if (window.location.pathname.includes('/vite/')) {
          dataUrl = '/vite/data/list.json';
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
      loadData
    };
  }
};

// Register the component
window.TablesDemo = TablesDemo;
console.log('TablesDemo registered to window.TablesDemo');
