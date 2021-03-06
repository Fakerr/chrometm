/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabsUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var urls = [];
    for(var i=0; i < tabs.length; i++){
      urls[i] = tabs[i].url;
    }
    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    //console.assert(typeof urls[0] == 'string', 'tab.url should be a string');
    callback(urls);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

function refresh(){
  var myNode = document.getElementById("status");
     while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
    }
  chrome.storage.sync.get(null, function (result) {
    var userKeyIds = result.userKeyIds;
    userKeyIds.forEach(function(element, index, array){
      renderStatus(element.id, index);
    });
  });
}


function renderStatus(urls, index) {
    var del = document.createElement("BUTTON");
    var b = document.createTextNode("Delete");
    del.appendChild(b);
    del.id = index;
    var link = document.createElement('a');
    var t = document.createTextNode("\n(" + urls.length + ") tabs    ");
    link.appendChild(t);
    link.href = "#";
    link.id = index + 100;
    document.getElementById("status").appendChild(link);
    document.getElementById("status").appendChild(del);
    document.getElementById(index).addEventListener('click', function(){
      var r = confirm("Are you sure ?");
      if(r == true){
        chrome.storage.sync.get(null, function (result) {
        var userKeyIds = result.userKeyIds;
        userKeyIds.splice(index, 1);
        chrome.storage.sync.set({userKeyIds: userKeyIds}, function () {
            refresh();
       });
      });
      }
    });
    document.getElementById(index + 100).addEventListener('click', function(){
      chrome.storage.sync.get(null, function (result) {
        var userKeyIds = result.userKeyIds;
        var tabs = userKeyIds[index].id;
        chrome.windows.create({
            url: tabs
        });
      });
    });
}

function Add(){
  getCurrentTabsUrl(function(urls) {
    renderStatus(urls);
    chrome.storage.sync.get({userKeyIds: []}, function (result) {
    var userKeyIds = result.userKeyIds;
    userKeyIds.push({id: urls, HasBeenUploadedYet: false});
    chrome.storage.sync.set({userKeyIds: userKeyIds}, function () {
        refresh();
    });
  });
 });
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('add').addEventListener('click', Add);
  refresh();
});
