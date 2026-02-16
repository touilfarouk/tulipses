console.log('Registering PageDocumentation component');

const PageDocumentation = {
  template: `
    <q-page class="q-pa-md">
      <div class="text-h5 q-mb-md">Developer Guide</div>

      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">1) Add A New Page</div>
          <ol class="q-pl-md">
            <li>Create a file in <code>src/pages/</code> (example: <code>src/pages/PageReports.js</code>).</li>
            <li>Register the component on <code>window</code>:
              <pre><code class="language-js">window.PageReports = PageReports;</code></pre>
            </li>
            <li>Add it to <code>index.html</code> component loader array.</li>
            <li>Add a route in <code>src/router/routes.js</code>.</li>
            <li>Add a drawer item in <code>src/layouts/MainLayout.js</code>.</li>
          </ol>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">2) Multilingual Data Per Screen</div>
          <p>Each screen has its own language folder:</p>
          <pre><code>data/&lt;screen&gt;/en.json
data/&lt;screen&gt;/fr.json
data/&lt;screen&gt;/ar.json</code></pre>
          <p>Load it in your page:</p>
          <pre><code class="language-js">const data = await window.screenData.load('your-screen', lang);
const labels = data.labels || {};</code></pre>
          <p>Use labels in template:</p>
          <pre><code class="language-html">{{ t('someLabelKey') }}</code></pre>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">3) API Calls</div>
          <p>Use <code>fetch</code> or <code>axios</code>. For cache busting:</p>
          <pre><code class="language-js">const version = window.APP_VERSION || Date.now();
const url = \`/tulipses/api/endpoint?v=\${version}\`;
const res = await fetch(url);
const json = await res.json();</code></pre>
          <p>Use <code>try/catch</code> and show errors in console or Quasar Notify.</p>
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6 q-mb-sm">4) Add New Language</div>
          <ol class="q-pl-md">
            <li>Add new files per screen: <code>data/&lt;screen&gt;/&lt;lang&gt;.json</code>.</li>
            <li>Update language dropdown in <code>src/layouts/MainLayout.js</code>.</li>
            <li>Set RTL if needed: <code>Quasar.rtl.set(true)</code> and <code>dir="rtl"</code>.</li>
          </ol>
        </q-card-section>
      </q-card>
    </q-page>
  `
};

if (typeof window !== 'undefined') {
  window.PageDocumentation = PageDocumentation;
  console.log('PageDocumentation registered to window.PageDocumentation');
}

