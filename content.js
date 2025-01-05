function changeCssTheme(page_css) {
  const cur_theme = document.documentElement.getAttribute('theme');
  let css_rules;

  if (cur_theme === 'dark') {
    css_rules = 'html[theme=dark] {' + page_css + '}';
    browser.storage.sync.set({ 'mode': '-dark' });
  } else {
    css_rules = 'html {' + page_css + '}';
  }

  const style = document.createElement('style');
  style.appendChild(document.createTextNode(css_rules));
  document.documentElement.appendChild(style);

  // Notify background script about the theme change
  browser.runtime.sendMessage('changeMonaco' + cur_theme);
}

function loadContent() {
  const jsInitChecktimer = setInterval(checkForPage, 150);

  function checkForPage() {
    if (document.getElementsByTagName('html').length >= 1) {
      clearInterval(jsInitChecktimer);

      browser.storage.sync.get('page_css').then((result) => {
        changeCssTheme(result.page_css || '');
      });
    }
  }
}

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.update) {
    loadContent();
  }
  sendResponse(sender);
});

browser.storage.sync.get('extension_active').then((result) => {
  if (result.extension_active) {
    loadContent();
  }
});
