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

    const categoryOptions = [
      'Electronics',
      'Furniture',
      'Office Supplies',
      'Other'
    ];

    const statusOptions = [
      { id: 'all', text: 'All' },
      { id: 'active', text: 'Active' },
      { id: 'inactive', text: 'Inactive' },
      { id: 'pending', text: 'Pending' }
    ];

    function generateSampleData() {
      const cats = categoryOptions;
      const stats = ['active', 'inactive', 'pending'];

      return Array.from({ length: 50 }, (_, i) => ({
        recid: i + 1,
        id: i + 1,
        name: `Item ${i + 1}`,
        category: cats[Math.floor(Math.random() * cats.length)],
        value: Math.floor(Math.random() * 1000),
        status: stats[Math.floor(Math.random() * stats.length)]
      }));
    }

    function buildGrid() {
      if (w2ui.advancedDataGrid) {
        w2ui.advancedDataGrid.destroy();
      }

      new w2grid({
        name: 'advancedDataGrid',
        box: '#advanced-data-grid',
        header: 'Advanced Data Grid',
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
          { field: 'name', text: 'Name', type: 'text' },
          { field: 'category', text: 'Category', type: 'list', items: categoryOptions },
          { field: 'status', text: 'Status', type: 'list', items: statusOptions }
        ],
        columns: [
          { field: 'id', text: 'ID', size: '80px', sortable: true },
          { field: 'name', text: 'Name', size: '30%', sortable: true },
          { field: 'category', text: 'Category', size: '30%', sortable: true },
          { field: 'value', text: 'Value', size: '120px', sortable: true, render: 'money' },
          { field: 'status', text: 'Status', size: '120px', sortable: true }
        ],
        records: records.value,
        toolbar: {
          items: [
            { type: 'button', id: 'add', text: 'Add New', icon: 'w2ui-icon-plus' },
            { type: 'button', id: 'edit', text: 'Edit', icon: 'w2ui-icon-pencil' },
            { type: 'button', id: 'delete', text: 'Delete', icon: 'w2ui-icon-cross' },
            { type: 'spacer' },
            { type: 'button', id: 'view', text: 'View', icon: 'w2ui-icon-search' }
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
            category: record.category,
            value: record.value,
            status: record.status
          }
        : { name: '', category: '', value: 0, status: 'active' };

      const form = new w2form({
        name: formName,
        fields: [
          { field: 'name', type: 'text', required: true },
          { field: 'category', type: 'list', required: true, options: { items: categoryOptions } },
          { field: 'value', type: 'int' },
          { field: 'status', type: 'list', options: { items: statusOptions } }
        ],
        record: formRecord,
        actions: {
          Save() {
            if (this.validate().length) return;
            const value = this.record.value || 0;
            const category = this.record.category?.text || this.record.category;
            const status = this.record.status?.id || this.record.status;
            const name = this.record.name;

            if (isEdit) {
              const updated = {
                ...record,
                name,
                category,
                value,
                status
              };
              w2ui.advancedDataGrid.set(record.recid, updated);
            } else {
              const newId = Math.max(0, ...w2ui.advancedDataGrid.records.map(r => r.id)) + 1;
              w2ui.advancedDataGrid.add({
                recid: newId,
                id: newId,
                name,
                category,
                value,
                status
              });
            }

            w2popup.close();
          },
          Cancel() {
            w2popup.close();
          }
        }
      });

      w2popup.open({
        title: isEdit ? 'Edit Item' : 'Add New Item',
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
      w2confirm(`Delete ${record.name}?`)
        .yes(() => {
          w2ui.advancedDataGrid.remove(record.recid);
        });
    }

    function viewItem(record) {
      const html = `
        <div style="padding: 12px;">
          <div><strong>ID:</strong> ${record.id}</div>
          <div><strong>Name:</strong> ${record.name}</div>
          <div><strong>Category:</strong> ${record.category}</div>
          <div><strong>Value:</strong> ${record.value}</div>
          <div><strong>Status:</strong> ${record.status}</div>
        </div>
      `;

      w2popup.open({
        title: 'Item Details',
        width: 420,
        height: 260,
        modal: true,
        body: html,
        buttons: '<button class="w2ui-btn" onclick="w2popup.close()">Close</button>'
      });
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
