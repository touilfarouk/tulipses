console.log('Loading AdvancedDataGrid component...');

const AdvancedDataGrid = {
  template: `
    <q-page class="q-pa-md">

      <div class="text-h5 q-mb-md">Advanced Data Grid</div>

      <div
        id="advanced-data-grid"
        style="height:600px;border:1px solid #ddd;border-radius:6px"
      ></div>

    </q-page>
  `,

  setup() {
    const { ref, onMounted, onUnmounted } = Vue;

    const records = ref([]);
    const i18nLang = ref(window.i18n?.lang || 'en');
    if (window.i18n?.onChange) {
      window.i18n.onChange((lang) => {
        i18nLang.value = lang;
        rebuildGrid();
      });
    }

    const t = (key) => {
      void i18nLang.value;
      return window.i18n?.t ? window.i18n.t(key) : key;
    };

    const categoryKeys = ['electronics', 'furniture', 'office', 'other'];
    const statusKeys = ['active', 'inactive', 'pending'];

    const buildCategoryOptions = () =>
      categoryKeys.map((key) => ({ id: key, text: t(`category.${key}`) }));

    const buildStatusOptions = (includeAll = false) => {
      const items = statusKeys.map((key) => ({ id: key, text: t(`status.${key}`) }));
      if (includeAll) {
        items.unshift({ id: 'all', text: t('status.all') });
      }
      return items;
    };

    function generateSampleData() {
      return Array.from({ length: 50 }, (_, i) => ({
        recid: i + 1,
        id: i + 1,
        name: `Item ${i + 1}`,
        categoryKey: categoryKeys[Math.floor(Math.random() * categoryKeys.length)],
        value: Math.floor(Math.random() * 1000),
        statusKey: statusKeys[Math.floor(Math.random() * statusKeys.length)]
      }));
    }

    function localizeRecords(rawRecords) {
      return rawRecords.map((record) => ({
        ...record,
        category: t(`category.${record.categoryKey}`),
        status: t(`status.${record.statusKey}`)
      }));
    }

    function buildGrid() {
      if (w2ui.advancedDataGrid) {
        w2ui.advancedDataGrid.destroy();
      }

      const categoryOptions = buildCategoryOptions();
      const statusOptions = buildStatusOptions(true);
      const localizedRecords = localizeRecords(records.value);

      new w2grid({
        name: 'advancedDataGrid',
        box: '#advanced-data-grid',
        header: t('grid.advancedTitle'),
        show: {
          toolbar: true,
          footer: true,
          lineNumbers: true,
          toolbarSearch: true,
          toolbarColumns: true,
          toolbarReload: true
        },
        page: 0,
        limit: 10,
        multiSearch: true,
        searches: [
          { field: 'name', text: t('grid.name'), type: 'text' },
          { field: 'category', text: t('grid.category'), type: 'list', items: categoryOptions },
          { field: 'status', text: t('grid.status'), type: 'list', items: statusOptions }
        ],
        columns: [
          { field: 'id', text: t('grid.id'), size: '80px', sortable: true },
          { field: 'name', text: t('grid.name'), size: '30%', sortable: true },
          { field: 'category', text: t('grid.category'), size: '30%', sortable: true },
          { field: 'value', text: t('grid.value'), size: '120px', sortable: true, render: 'money' },
          { field: 'status', text: t('grid.status'), size: '120px', sortable: true }
        ],
        records: localizedRecords,
        toolbar: {
          items: [
            { type: 'button', id: 'add', text: t('grid.addNew'), icon: 'w2ui-icon-plus' },
            { type: 'button', id: 'edit', text: t('grid.edit'), icon: 'w2ui-icon-pencil' },
            { type: 'button', id: 'delete', text: t('grid.delete'), icon: 'w2ui-icon-cross' },
            { type: 'spacer' },
            { type: 'button', id: 'view', text: t('grid.view'), icon: 'w2ui-icon-search' }
          ],
          onClick(event) {
            if (event.target === 'add') {
              openForm();
            }
            if (event.target === 'edit') {
              const selection = w2ui.advancedDataGrid.getSelection();
              if (!selection.length) return;
              const record = w2ui.advancedDataGrid.get(selection[0]);
              openForm(record);
            }
            if (event.target === 'delete') {
              const selection = w2ui.advancedDataGrid.getSelection();
              if (!selection.length) return;
              const record = w2ui.advancedDataGrid.get(selection[0]);
              confirmDelete(record);
            }
            if (event.target === 'view') {
              const selection = w2ui.advancedDataGrid.getSelection();
              if (!selection.length) return;
              const record = w2ui.advancedDataGrid.get(selection[0]);
              viewItem(record);
            }
          }
        }
      });
    }

    function openForm(record = null) {
      const isEdit = !!record;
      const formName = 'advancedDataGridForm';

      if (w2ui[formName]) {
        w2ui[formName].destroy();
      }

      const formRecord = record
        ? {
            name: record.name,
            category: { id: record.categoryKey, text: t(`category.${record.categoryKey}`) },
            value: record.value,
            status: { id: record.statusKey, text: t(`status.${record.statusKey}`) }
          }
        : { name: '', category: null, value: 0, status: { id: 'active', text: t('status.active') } };

      const form = new w2form({
        name: formName,
        fields: [
          { field: 'name', type: 'text', required: true },
          { field: 'category', type: 'list', required: true, options: { items: buildCategoryOptions() } },
          { field: 'value', type: 'int' },
          { field: 'status', type: 'list', options: { items: buildStatusOptions(false) } }
        ],
        record: formRecord,
        actions: {
          Save() {
            if (this.validate().length) return;
            const value = this.record.value || 0;
            const categoryKey = this.record.category?.id || this.record.category;
            const statusKey = this.record.status?.id || this.record.status;
            const name = this.record.name;

            if (isEdit) {
              const updated = {
                ...record,
                name,
                categoryKey,
                category: t(`category.${categoryKey}`),
                value,
                statusKey,
                status: t(`status.${statusKey}`)
              };
              w2ui.advancedDataGrid.set(record.recid, updated);
              const idx = records.value.findIndex((r) => r.recid === record.recid);
              if (idx > -1) records.value[idx] = updated;
            } else {
              const newId = Math.max(0, ...w2ui.advancedDataGrid.records.map(r => r.id)) + 1;
              const created = {
                recid: newId,
                id: newId,
                name,
                categoryKey,
                category: t(`category.${categoryKey}`),
                value,
                statusKey,
                status: t(`status.${statusKey}`)
              };
              w2ui.advancedDataGrid.add(created);
              records.value.unshift(created);
            }

            w2popup.close();
          },
          Cancel() {
            w2popup.close();
          }
        }
      });

      w2popup.open({
        title: isEdit ? t('grid.edit') : t('grid.addNew'),
        width: 520,
        height: 360,
        modal: true,
        body: '<div id="advanced-data-grid-form" style="width: 100%; height: 100%;"></div>',
        onOpen(event) {
          event.onComplete = function() {
            form.render('#advanced-data-grid-form');
          };
        },
        onClose() {
          form.destroy();
        }
      });
    }

    function confirmDelete(record) {
      w2confirm(`${t('grid.delete')} ${record.name}?`)
        .yes(() => {
          w2ui.advancedDataGrid.remove(record.recid);
          records.value = records.value.filter((r) => r.recid !== record.recid);
        });
    }

    function viewItem(record) {
      const html = `
        <div style="padding: 12px;">
          <div><strong>${t('grid.id')}:</strong> ${record.id}</div>
          <div><strong>${t('grid.name')}:</strong> ${record.name}</div>
          <div><strong>${t('grid.category')}:</strong> ${record.category}</div>
          <div><strong>${t('grid.value')}:</strong> ${record.value}</div>
          <div><strong>${t('grid.status')}:</strong> ${record.status}</div>
        </div>
      `;

      w2popup.open({
        title: t('grid.itemDetails'),
        width: 420,
        height: 260,
        modal: true,
        body: html,
        buttons: `<button class="w2ui-btn" onclick="w2popup.close()">${t('grid.close')}</button>`
      });
    }

    function rebuildGrid() {
      if (!w2ui?.advancedDataGrid) return;
      buildGrid();
    }

    onMounted(() => {
      records.value = generateSampleData();

      const waitForW2ui = () => {
        if (typeof w2grid !== 'undefined' && typeof w2form !== 'undefined') {
          buildGrid();
        } else {
          setTimeout(waitForW2ui, 300);
        }
      };

      waitForW2ui();
    });

    onUnmounted(() => {
      if (w2ui.advancedDataGrid) {
        w2ui.advancedDataGrid.destroy();
      }
      if (w2ui.advancedDataGridForm) {
        w2ui.advancedDataGridForm.destroy();
      }
    });

    return {};
  }
};

if (typeof window !== 'undefined') {
  window.AdvancedDataGrid = AdvancedDataGrid;
}

console.log('AdvancedDataGrid registered');
