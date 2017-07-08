'use strict';

const CDP = require('chrome-remote-interface');

class Renderer {
  constructor(url) {
    this._url = url;
  }

  extractDOM(htmlElement) {
    return new Promise((resolve, reject) => {
      CDP.New().then((tab) => {
        return CDP({tab: tab});
      }).then((client) => {
        try {
          // Extract DevTools domains.
          const {Page, Runtime, Network} = client;

          // Enable events on domains we are interested in.
          Promise.all([
            Page.enable(),
            Runtime.enable(),
            Network.enable(),
          ]).then(() => {
            return Promise.all([
              Network.clearBrowserCache(),
              Network.setCacheDisabled({cacheDisabled: true}),
              Network.setBypassServiceWorker({bypass: true}),
            ]);
          }).then(() => {
            Page.navigate({url: this._url});
          });

          // Load and dump DOM of {head(default)|body|document} element.
          Page.loadEventFired(() => {
            setTimeout(async() => {
              let expression = htmlElement == 'document'? 'document.documentElement.outerHTML' : (htmlElement == 'body' ? 'document.body.outerHTML' : 'document.head.outerHTML');
              let result = await Runtime.evaluate({expression: expression});
              CDP.Close({id: client.tab.id});
              resolve(result.result.value);
            }, 1500);
          });
        } catch (err) {
          console.error(err);
          CDP.Close({id: client.tab.id});
          reject(err);
        }
      }).catch((e) => {
        reject(e);
      });
    });
  }
}

module.exports = Renderer;
