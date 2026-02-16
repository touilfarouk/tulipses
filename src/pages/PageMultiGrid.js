console.log('Loading PageMultiGrid component...');

const PageMultiGrid = {
  template: `
    <q-page class="q-pa-md">

      <div class="text-h6 q-mb-md">
        {{ t('multiGrid.title') }}
      </div>

      <!-- ACTION BAR -->
      <div class="row q-gutter-md q-mb-md">
        <q-btn color="primary" icon="refresh" :label="t('multiGrid.refresh')"
               @click="reloadActiveGrid" />
      </div>

      <!-- TABS -->
      <q-tabs
        v-model="activeTab"
        dense
        class="text-primary"
        align="left"
      >
        <q-tab name="employees" icon="people" :label="t('multiGrid.employees')"/>
        <q-tab name="departments" icon="apartment" :label="t('multiGrid.departments')"/>
        <q-tab name="projects" icon="work" :label="t('multiGrid.projects')"/>
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
    const i18nLang = Vue.ref(window.i18n?.lang || 'en');
    if (window.i18n?.onChange) {
      window.i18n.onChange((lang) => {
        i18nLang.value = lang;
        rebuildAllGrids();
      });
    }

    const t = (key) => {
      void i18nLang.value;
      return window.i18n?.t ? window.i18n.t(key) : key;
    };

    /* --------------------------------------------------
       EMPLOYEES DATA LOAD
    -------------------------------------------------- */
    const getDataUrl = (lang) => {
      const version = window.APP_VERSION || Date.now();
      const suffix = lang ? `.${lang}` : '';
      if (window.location.pathname.includes('/tulipses/')) {
        return `/tulipses/data/list${suffix}.json?v=${version}`;
      }
      return `data/list${suffix}.json?v=${version}`;
    };

    const loadEmployees = async () => {
      try {
        const lang = window.i18n?.lang || 'en';
        const url = getDataUrl(lang);

        const res = await fetch(url, { cache: 'no-store' });
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
        header: t('multiGrid.employeeHeader'),
        show: {
          toolbar: true,
          footer: true,
          lineNumbers: true,
          toolbarSearch: true
        },
        columns: [
          { field:'recid', caption:t('grid.id'), size:'80px', sortable:true },
          { field:'fname', caption:t('tablesDemo.firstName'), size:'30%' },
          { field:'lname', caption:t('tablesDemo.lastName'), size:'30%' },
          { field:'email', caption:t('tablesDemo.email'), size:'40%' },
          { field:'sdate', caption:t('tablesDemo.startDate'), size:'120px' }
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
        header: t('multiGrid.deptHeader'),
        show: { toolbar:true, footer:true, lineNumbers:true },
        columns: [
          { field:'recid', caption:t('grid.id'), size:'80px' },
          { field:'name', caption:t('multiGrid.departments'), size:'50%' },
          { field:'manager', caption:t('multiGrid.manager'), size:'50%' }
        ],
        records: [
          { recid:1, name:t('multiGrid.deptIT'), manager:'John Smith' },
          { recid:2, name:t('multiGrid.deptHR'), manager:'Sara Lee' },
          { recid:3, name:t('multiGrid.deptFinance'), manager:'Ahmed Benali' },
          { recid:4, name:t('multiGrid.deptMarketing'), manager:'Nadia Karim' }
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
        header: t('multiGrid.projHeader'),
        show: { toolbar:true, footer:true, lineNumbers:true },
        columns: [
          { field:'recid', caption:t('grid.id'), size:'80px' },
          { field:'title', caption:t('multiGrid.project'), size:'40%' },
          { field:'status', caption:t('multiGrid.status'), size:'30%' },
          { field:'budget', caption:t('multiGrid.budget'), size:'30%', render:'money' }
        ],
        records: [
          { recid:1, title:'ERP System', status:t('multiGrid.active'), budget:50000 },
          { recid:2, title:'Mobile App', status:t('multiGrid.planning'), budget:20000 },
          { recid:3, title:'Website Redesign', status:t('multiGrid.completed'), budget:12000 }
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

    const rebuildAllGrids = () => {
      initEmployeesGrid();
      initDepartmentsGrid();
      initProjectsGrid();
    };

    /* --------------------------------------------------
       WAIT FOR W2UI
    -------------------------------------------------- */
    Vue.onMounted(() => {

      const waitForW2ui = () => {
        if (typeof w2grid !== 'undefined') {

          console.log('w2ui ready — creating grids');

          rebuildAllGrids();

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
      reloadActiveGrid,
      rebuildAllGrids,
      t
    };
  }
};

window.PageMultiGrid = PageMultiGrid;
console.log('PageMultiGrid registered');
