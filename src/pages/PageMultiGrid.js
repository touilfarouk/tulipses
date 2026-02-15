console.log('Loading PageMultiGrid component...');

const PageMultiGrid = {
  template: `
    <q-page class="q-pa-md">

      <div class="text-h6 q-mb-md">
        Data Tables Demo (Multi Grid)
      </div>

      <!-- ACTION BAR -->
      <div class="row q-gutter-md q-mb-md">
        <q-btn color="primary" icon="refresh" label="Refresh"
               @click="reloadActiveGrid" />
      </div>

      <!-- TABS -->
      <q-tabs
        v-model="activeTab"
        dense
        class="text-primary"
        align="left"
      >
        <q-tab name="employees" icon="people" label="Employees"/>
        <q-tab name="departments" icon="apartment" label="Departments"/>
        <q-tab name="projects" icon="work" label="Projects"/>
      </q-tabs>

      <q-separator />

      <!-- TABLE CONTAINERS -->
      <div class="q-mt-md">

        <div v-show="activeTab==='employees'"
             id="grid-employees"
             style="height:500px;border:1px solid #ddd;border-radius:6px">
        </div>

        <div v-show="activeTab==='departments'"
             id="grid-departments"
             style="height:500px;border:1px solid #ddd;border-radius:6px">
        </div>

        <div v-show="activeTab==='projects'"
             id="grid-projects"
             style="height:500px;border:1px solid #ddd;border-radius:6px">
        </div>

      </div>

    </q-page>
  `,

  setup() {

    console.log('TablesDemo setup started');

    const activeTab = Vue.ref('employees');

    /* --------------------------------------------------
       EMPLOYEES DATA LOAD
    -------------------------------------------------- */
    const loadEmployees = async () => {
      try {
        let url =
          window.location.pathname.includes('/vite/')
            ? '/vite/data/list.json'
            : 'data/list.json';

        const res = await fetch(url);
        const json = await res.json();
        return json.records || [];
      } catch (e) {
        console.error('Employee load failed', e);
        return [];
      }
    };

    /* --------------------------------------------------
       EMPLOYEES GRID
    -------------------------------------------------- */
    const initEmployeesGrid = async () => {

      const data = await loadEmployees();

      if (w2ui.employeesGrid) {
        w2ui.employeesGrid.destroy();
      }

      new w2grid({
        name: 'employeesGrid',
        box: '#grid-employees',
        header: 'Employee Management',
        show: {
          toolbar: true,
          footer: true,
          lineNumbers: true,
          toolbarSearch: true
        },
        columns: [
          { field:'recid', caption:'ID', size:'80px', sortable:true },
          { field:'fname', caption:'First Name', size:'30%' },
          { field:'lname', caption:'Last Name', size:'30%' },
          { field:'email', caption:'Email', size:'40%' },
          { field:'sdate', caption:'Start Date', size:'120px' }
        ],
        records: data
      });
    };

    /* --------------------------------------------------
       DEPARTMENTS GRID
    -------------------------------------------------- */
    const initDepartmentsGrid = () => {

      if (w2ui.departmentsGrid) {
        w2ui.departmentsGrid.destroy();
      }

      new w2grid({
        name: 'departmentsGrid',
        box: '#grid-departments',
        header: 'Departments',
        show: { toolbar:true, footer:true, lineNumbers:true },
        columns: [
          { field:'recid', caption:'ID', size:'80px' },
          { field:'name', caption:'Department', size:'50%' },
          { field:'manager', caption:'Manager', size:'50%' }
        ],
        records: [
          { recid:1, name:'IT', manager:'John Smith' },
          { recid:2, name:'HR', manager:'Sara Lee' },
          { recid:3, name:'Finance', manager:'Ahmed Benali' },
          { recid:4, name:'Marketing', manager:'Nadia Karim' }
        ]
      });
    };

    /* --------------------------------------------------
       PROJECTS GRID
    -------------------------------------------------- */
    const initProjectsGrid = () => {

      if (w2ui.projectsGrid) {
        w2ui.projectsGrid.destroy();
      }

      new w2grid({
        name: 'projectsGrid',
        box: '#grid-projects',
        header: 'Projects',
        show: { toolbar:true, footer:true, lineNumbers:true },
        columns: [
          { field:'recid', caption:'ID', size:'80px' },
          { field:'title', caption:'Project', size:'40%' },
          { field:'status', caption:'Status', size:'30%' },
          { field:'budget', caption:'Budget', size:'30%', render:'money' }
        ],
        records: [
          { recid:1, title:'ERP System', status:'Active', budget:50000 },
          { recid:2, title:'Mobile App', status:'Planning', budget:20000 },
          { recid:3, title:'Website Redesign', status:'Completed', budget:12000 }
        ]
      });
    };

    /* --------------------------------------------------
       REFRESH CURRENT TAB GRID
    -------------------------------------------------- */
    const reloadActiveGrid = () => {
      if (activeTab.value === 'employees') initEmployeesGrid();
      if (activeTab.value === 'departments') initDepartmentsGrid();
      if (activeTab.value === 'projects') initProjectsGrid();
    };

    /* --------------------------------------------------
       WAIT FOR W2UI
    -------------------------------------------------- */
    Vue.onMounted(() => {

      const waitForW2ui = () => {
        if (typeof w2grid !== 'undefined') {

          console.log('w2ui ready — creating grids');

          initEmployeesGrid();
          initDepartmentsGrid();
          initProjectsGrid();

        } else {
          setTimeout(waitForW2ui, 400);
        }
      };

      waitForW2ui();
    });

    /* --------------------------------------------------
       CLEANUP
    -------------------------------------------------- */
    Vue.onUnmounted(() => {
      ['employeesGrid','departmentsGrid','projectsGrid']
        .forEach(name => {
          if (w2ui[name]) w2ui[name].destroy();
        });
    });

    return {
      activeTab,
      reloadActiveGrid
    };
  }
};

window.PageMultiGrid = PageMultiGrid;
console.log('PageMultiGrid registered');