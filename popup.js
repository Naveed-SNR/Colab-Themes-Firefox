function changeMonacoTheme(theme_json) {
  let cur_theme = document.documentElement.attributes['theme'].value;
  let mode = '';
  if (cur_theme == 'dark') {
    mode = '-dark';
  }
  let scriptContent = 'monaco.editor.defineTheme(\'colab'+ mode +'\', ' +
  'JSON.parse(\'' + JSON.stringify(theme_json) + '\') ); ' +
  'monaco.editor.setTheme(\'colab'+ mode +'\'); '
    let script = document.createElement('script');
    script.id = 'tmpScript';
    script.type = "text/javascript";
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);
}

function scale(hex_str, c) {
  if (hex_str.length > 6) {
    hex_str = hex_str.substring(1,7);
  }
  let rgb = parseInt(hex_str, 16);
  let r = Math.min(0xff0000,(rgb & 0xff0000) * c) & 0xff0000;
  let g = Math.min(0xff00, (rgb & 0xff00) * c) & 0xff00;
  let b = Math.min(0xff, (rgb & 0xff) * c) & 0xff;
  return '#' + (0xf000000 + r + g + b).toString(16).substring(1);
}

function hex_is_light(hex_str) {
  if (hex_str.length > 6) {
    hex_str = hex_str.substring(1,7);
  }
  let rgb = parseInt(hex_str, 16);
  let r = (rgb & 0xff0000) >> 16;
  let g = (rgb & 0xff00) >> 8;
  let b = (rgb & 0xff);
  return ((r*0.299 + g*0.587 + b*0.114) / 255) > 0.50;
}

function getCssTheme(theme_json) {
  // heuristic that makes the page CSS look appropriate
  let fg = theme_json.colors['editor.foreground'];
  let bg = theme_json.colors['editor.background'];
  let bg_extra_1 = scale(bg, 0.952);
  let bg_extra_2 = scale(bg, 0.833);
  let bg_less_1 = scale(bg, 1.05);
  let fg_less_1 = scale(fg, 0.952);
  let fg_extra_1 = scale(fg, 1.05);
  let bg_light = scale(bg, 1.15);
  if (hex_is_light(bg)) {
    bg_light = scale(bg,1.03);
    bg_extra_1 = scale(bg, 1.05);
    bg_extra_2 = scale(bg, 1.1);
    bg_less_1 = scale(bg, 0.952);
    fg_less_1 = scale(fg, 1.05);
    fg_extra_1 = scale(fg, 0.952);
  }

  let m = []
  for (let i = 0; i < theme_json.rules.length; i++) {
    if (theme_json.rules[i].token.match('string')) {
      if (theme_json.rules[i].hasOwnProperty('foreground')) {
        let color = scale(theme_json.rules[i].foreground, 1);
        m.push[color];
      }
    }
    if (theme_json.rules[i].token.match('keyword')) {
      if (theme_json.rules[i].hasOwnProperty('foreground')) {
        let color = scale(theme_json.rules[i].foreground, 1)
        m.push[color];
      }
    }
    if (m.length >= 2) { break; }
  }
  if (m.length < 2) { m = [fg, fg]; }

  let markdown = fg;

  let error_color = null;
  for (let i = 0; i < theme_json.rules.length; i++) {
    if (theme_json.rules[i].token.match('error')) {
      if (theme_json.rules[i].hasOwnProperty('foreground')) {
        error_color = scale(theme_json.rules[i].foreground, 1);
      }
    }
    if (error_color != null) { break; }
  }
  if (error_color == null) { error_color = fg; }

  let css = `--colab-anchor-color: 
  --colab-callout-color: 
  --code-cell-background: 
  --colab-border-color:
  --colab-divider-color:
  --colab-highlighted-surface-color: 
  --colab-icon-color: 
  --colab-input-placeholder-color: 
  --colab-primary-surface-color: 
  --colab-primary-text-color: 
  --colab-secondary-text-color: 
  --colab-tertiary-text-color: 
  --colab-secondary-surface-color: 
  --colab-error_color-icon-color: 
  --colab-title-color: 
  --colab-toolbar-button-color: 
  --colab-form-field-underline-color: 
  --colab-local-diff-background: 
  --colab-merged-diff-background: `;

  let fillers = [
    m[0],
    m[1],
    bg,
    bg_extra_2,
    bg_extra_1,
    bg_less_1,
    fg,
    fg_less_1,
    bg_light,
    markdown,
    fg_extra_1,
    fg_extra_1,
    bg_extra_1,
    error_color,
    fg,
    fg,
    fg_less_1,
    bg_extra_2,
    bg_extra_1
  ]
  css = css.split('\n');
  for (let i = 0; i < css.length; i++ ) {
    css[i] += fillers[i] + ' !important;';
  }
  let css_constant = `\n--colab-active-execution-icon-color: var(--colab-icon-color) !important;
  --primary-color: var(--colab-anchor-color) !important;
  --hairline-button-primary: var(--primary-color) !important;
  --hairline-button-secondary:var(--primary-color) !important;
  --light-theme-secondary-color: var(--colab-input-placeholder-color) !important;`;
  return css.join('\n') + css_constant;
}

function changeCssTheme(page_css) {
  let cur_theme = document.documentElement.attributes['theme'].value;
  let css_rules = '';
  if (cur_theme == 'dark') {
    css_rules = 'html[theme=dark] {' + page_css + '}';
  }
  else {
    css_rules = 'html {' + page_css + '}';
  }
  let style = document.createElement('style');
  style.appendChild(document.createTextNode(css_rules));
  document.documentElement.appendChild(style);
}

function select_theme(filename) {
  browser.storage.sync.set({'filename': filename});
  browser.storage.sync.set({'user_added': false});
  browser.storage.sync.get('extension_active').then(result => {
    if (result.extension_active) {
      browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
        let tabId = tabs[0].id;
        fetch('themes/'+ filename +'.json')
        .then(data => data.json())
        .then(theme_json => {
          // create css
          let page_css = getCssTheme(theme_json);
          browser.storage.sync.set({'page_css': page_css});
          // set monaco
          browser.tabs.executeScript({
            code: `(${changeMonacoTheme.toString()})(${JSON.stringify(theme_json)});`
          });
        });
        // send css to service workers
        browser.tabs.sendMessage(tabId, {update: true});
      });
    }
  });
}

function select_added_theme(filename) {
  browser.storage.sync.set({'filename': filename});
  browser.storage.sync.set({'user_added': true});
  browser.storage.sync.get('extension_active').then(result => {
    if (result.extension_active) {
      browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
        let tabId = tabs[0].id;
        browser.storage.sync.get([filename + '1', filename + '2', filename + '3']).then(result => {
          let theme_json = result[filename + '1'] + result[filename + '2'] + result[filename + '3'];
          theme_json = JSON.parse(theme_json);
          let page_css = getCssTheme(theme_json);
          browser.storage.sync.set({'page_css': page_css});
          // set monaco
          browser.tabs.executeScript(tabId, {
            target: {tabId: tabId},
            func: changeMonacoTheme,
            args: [theme_json]
          });
        });
        // send css to service workers
        browser.tabs.sendMessage(tabId, {update: true});
      });
    }
  });
}

// modify popup html page
let xhr = new XMLHttpRequest();
xhr.onreadystatechange = function () {
  if (this.readyState == 4 && this.status == 200) {
    let theme_list = JSON.parse(xhr.responseText);
    let selectList = document.getElementById('colab_themes_choice')

    // append default themes to drop down
    Object.keys(theme_list).forEach(function(key) {
      let opt = document.createElement("option");
      opt.value = theme_list[key];
      opt.textContent = theme_list[key];
      selectList.appendChild(opt);
    });
    
    // append user imported themes to drop down
    browser.storage.sync.get('user_files').then(result => {
      if (result.user_files) {
        for (let i = 0; i < result.user_files.length; i++) {
          let opt = document.createElement("option");
          opt.setAttribute('user_added', true);
          opt.value = result.user_files[i];
          opt.textContent = result.user_files[i];
          selectList.appendChild(opt);
        }
      }
    });
    
    // user selection process
    selectList.onchange = function() {
      if (this.options[this.selectedIndex].hasAttribute('user_added')) {
        select_added_theme(this.value);
      }
      else {
        select_theme(this.value);
      }
    };
    
    // set selected theme as chosen
    browser.storage.sync.get('filename').then(result => {
      if (result.filename) {
        selectList.value = result.filename;
      }
    });
  }
};
// execute above function
xhr.open("GET", 'themes/themelist.json', true);
xhr.send();

// create on/off switch
document.getElementById('on_off').onchange = function() {
  browser.storage.sync.set({"extension_active": this.checked});
  if (this.checked) {
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
      browser.storage.sync.get('filename').then(result => {
        if (result.filename) {
          select_theme(result.filename);
        }
      });
    });
  }
};

// set on/off value
browser.storage.sync.get('extension_active').then(result => {
  document.getElementById('on_off').checked = result.extension_active;
});

// matplotlib python code generation
document.getElementById('matplotlib').addEventListener('click', handleMatplot);

function handleMatplot() {
  browser.storage.sync.get(['extension_active', 'filename', 'user_added']).then(result => {
    if (result.extension_active) {
      if (result.user_added) {
        let filename = result.filename;
        browser.storage.sync.get([filename + '1', filename + '2', filename + '3']).then(result2 => {
          let theme_json = result2[filename + '1'] + result2[filename + '2'] + result2[filename + '3'];
          theme_json = JSON.parse(theme_json);
          // set monaco
          copyMatplot(theme_json, result.filename);
        });
      }
      else {
        fetch('themes/'+ result.filename +'.json')
        .then(data => data.json())
        .then(theme_json => {
          // set monaco
          copyMatplot(theme_json, result.filename);
        });
      }  
    }
  });
}

function copyMatplot(theme_json, filename) {
  /* ... existing copyMatplot function ... */
}

// import theme button logic
let errorMsg = document.getElementById('errorMsg');
document.getElementById('upload').addEventListener('change', readFile);

function readFile() {
  errorMsg.textContent = ''
  let files = this.files;
  if (files.length != 1) {
    errorMsg.textContent = "Please select a file.";
    return;
  }
  if (files[0].type != 'application/json') {
    errorMsg.textContent = 'The file must be a JSON file.<br/>';
    return;
  }
  let reader = new FileReader();
  reader.onload = function(event) {
    let theme_json = JSON.stringify(JSON.parse(event.target.result))
    if (theme_json.length > 21000) {
      errorMsg.textContent = 'The file is too large.<br/>';
      return;
    }
    // get rid of .json in the theme name
    let filename = files[0].name.slice(0,-5);
    goodMsg.textContent += filename + ' has been added to the list!<br/>';
    
    browser.storage.sync.set({[filename + '1']: theme_json.slice(0,7000)});
    browser.storage.sync.set({[filename + '2']: theme_json.slice(7000,14000)});
    browser.storage.sync.set({[filename + '3']: theme_json.slice(14000,21000)});

    browser.storage.sync.get('user_files').then(result => {
      if (result.user_files) {
        result.user_files.push(filename);
        browser.storage.sync.set({'user_files': result.user_files});
      }
      else {
        browser.storage.sync.set({'user_files': [filename]});
      }
    });
  }
  reader.readAsText(files[0]);
}