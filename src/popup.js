// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


const storageName = "listSpace";
/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, (tabs) => {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

// /**
//  * Change the background color of the current page.
//  *
//  * @param {string} color The new background color.
//  */
// function changeBackgroundColor(color) {
//   var script = 'document.body.style.backgroundColor="' + color + '";';
//   // See https://developer.chrome.com/extensions/tabs#method-executeScript.
//   // chrome.tabs.executeScript allows us to programmatically inject JavaScript
//   // into a page. Since we omit the optional first argument "tabId", the script
//   // is inserted into the active tab of the current window, which serves as the
//   // default.
//   chrome.tabs.executeScript({
//     code: script
//   });
// }

/**
 * Gets the saved background color for url.
 *
 * @param {string} url URL whose background color is to be retrieved.
 * @param {function(string)} callback called with the saved background color for
 *     the given url on success, or a falsy value if no color is retrieved.
 */
function getSavedBackgroundColor(url, callback) {
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
  // for chrome.runtime.lastError to ensure correctness even when the API call
  // fails.
  chrome.storage.sync.get(url, (items) => {
    callback(chrome.runtime.lastError ? null : items[url]);
  });
}

/**
 * Sets the given background color for url.
 *
 * @param {string} url URL for which background color is to be saved.
 * @param {string} color The background color to be saved.
 */
function saveBackgroundColor(url, color) {
  var items = {};
  items[url] = color;
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We omit the
  // optional callback since we don't need to perform any action once the
  // background color is saved.
  chrome.storage.sync.set(items);
}


function stashTabsFromBrowser() {
  var listItem = {};
  listItem.date = new Date();
  listItem.tabs = [];
  chrome.windows.getCurrent((wnd)=>{
    chrome.tabs.getAllInWindow(wnd.id, (tabs)=>{
      //数组拷贝

      for (var i = 0; i < tabs.length ; i++){
        tab = tabs[i];
        listItem.tabs.push({
          "title": tab.title,
          "url": tab.url
        });
        // alert(tabItem.title + tabItem.url);
        if(i != tabs.length-1 )chrome.tabs.remove(tab.id);
        else chrome.tabs.update({"url": "chrome://newtab"});
        // tabItem.screenshot = null//保存截图
        console.log("in browser"+ i +JSON.stringify(listItem) + "\n");
      }
      console.log(JSON.stringify(listItem));
      saveTabs(listItem);
    });
  });
}

function getTabsFromStorage() {
  var savedList = null;
  // chrome.storage.sync.get(storageName, (data)=>savedList = data);//获取已保存的数组
  // console.log(JSON.stringify(savedList) + "in getTabsFromStorage1");
  var stringList = window.localStorage[storageName];
  // console.log(stringList);
  if( stringList != undefined )savedList = JSON.parse(window.localStorage[storageName]);
  if (savedList === null || savedList === "" || savedList === undefined ) savedList = [];
  console.log(JSON.stringify(savedList) + "in getTabsFromStorage2");
  return savedList;
}


function saveTabs(tabs) {
  var savedList = getTabsFromStorage();
  savedList.push(tabs);
  var storedData={};

  storedData[storageName] = savedList;

  // chrome.storage.sync.set(storedData, ()=>console.log("tabs saved"));
  console.log(JSON.stringify(savedList));
  window.localStorage.setItem(storageName, JSON.stringify(savedList));
  var test = window.localStorage.getItem(storageName);
  var test = chrome.storage.sync.get(storageName, (data)=>savedList = data);
  console.log(test);
}

function restoreTabs(tabs) {
  chrome.windows.create((wnd)=>{
    tabs.forEach((tab)=>{
      chrome.tabs.create({
        "windowId": wnd.id,
        "url": tab.url},(t)=>null);
    });
  });
}

// This extension loads the saved background color for the current tab if one
// exists. The user can select a new background color from the dropdown for the
// current page, and it will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.
document.addEventListener('DOMContentLoaded', () => {
    var stashButton = document.getElementById('slash');
    // Load the saved background color for this page and modify the dropdown
    // value, if needed.
    // Ensure the background color is changed and saved when the dropdown
    // selection changes.
    stashButton.addEventListener('click', () => {
      stashTabsFromBrowser();
    });

    var cancelButton = document.getElementById('cancel');
    cancelButton.addEventListener('click', ()=>{
      alert("先点别的地方凑合一下吧。。。");
    });
    var restoreButton = document.getElementById('restore');
    restoreButton.addEventListener('click', ()=>{
      var listSpace = getTabsFromStorage();
      listSpace.forEach((list)=>{
        restoreTabs(list.tabs);
      });
      window.localStorage.removeItem(storageName);
    });
});

