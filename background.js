function changeMonacoTheme(theme_json) {
  const cur_theme = document.documentElement.getAttribute('theme');
  let mode = '';
  if (cur_theme === 'dark') {
    mode = '-dark';
  }

  const scriptContent =
    'monaco.editor.defineTheme(\'colab' + mode + '\', ' +
    'JSON.parse(\'' + JSON.stringify(theme_json) + '\')); ' +
    'monaco.editor.setTheme(\'colab' + mode + '\');';

  const script = document.createElement('script');
  script.id = 'tmpScript';
  script.type = 'text/javascript';
  script.appendChild(document.createTextNode(scriptContent));
  (document.body || document.head || document.documentElement).appendChild(script);
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    browser.storage.sync.get(['extension_active', 'filename', 'user_added']).then((result) => {
      if (result.extension_active) {
        if (result.user_added) {
          const filename = result.filename;
          browser.storage.sync.get([filename + '1', filename + '2', filename + '3']).then((result2) => {
            let theme_json =
              (result2[filename + '1'] || '') +
              (result2[filename + '2'] || '') +
              (result2[filename + '3'] || '');
            theme_json = JSON.parse(theme_json);

            // Inject script to change Monaco theme
            browser.tabs.executeScript(tabId, {
              code: `(${changeMonacoTheme})(${JSON.stringify(theme_json)})`,
            });
          });
        } else {
          fetch('themes/' + result.filename + '.json')
            .then((response) => response.json())
            .then((theme_json) => {
              // Inject script to change Monaco theme
              browser.tabs.executeScript(tabId, {
                code: `(${changeMonacoTheme})(${JSON.stringify(theme_json)})`,
              });
            });
        }
      }
    });
  }
});
