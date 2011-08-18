const timer = require("timer");
const pageWorkers = require("page-worker");
const notifications = require("notifications");
const privateBrowsing = require("private-browsing");
const prompt = require("prompt");
const simpleStorage = require("simple-storage");
const tabs = require("tabs");

var checkConfiguration = function(){
  if(!simpleStorage.storage.diasporaUrl)
    simpleStorage.storage.diasporaUrl = prompt.prompt("Please enter the url of your Diaspora pod and make sure you checked 'Remember me' on the login page!", "https://joindiaspora.com");
};
checkConfiguration();

var checkNotifications = function(){
  if (privateBrowsing.active)
    return;

  var script = "try{" +
               "  console.log(document.querySelectorAll('div#notification_badge div.badge_count').length);" +
               "  var count = document.querySelectorAll('div#notification_badge div.badge_count')[0].textContent; " +
               "  var notifications = parseInt(count);" +
               "  count = document.querySelectorAll('div#message_inbox_badge div.badge_count')[0].textContent; " +
               "  var messages = parseInt(count);"+
               "  self.postMessage({notifications: notifications, messages: messages, error: false});" +
               "}" +
               "catch(e){" +
               "  self.postMessage({error: true, e: e});" +
               "}";

  var diasporaUrl = simpleStorage.storage.diasporaUrl;

  var onError = function() {
    notifications.notify({
      title: "Diaspora "+diasporaUrl,
      text: "An error occurred while checking your Diaspora account! Make sure you checked 'Remember me' at the login page or click here to reconfigure.",
      iconURL: 'https://joindiaspora.com/favicon.png',
      onClick: function () {
        simpleStorage.storage.diasporaUrl = undefined;
        checkConfiguration();
      }
    });
  };

  pageWorkers.Page({
    contentURL: diasporaUrl,
    contentScript: script,
    contentScriptWhen: "ready",
    onMessage: function(data) {
      var text = null;
      if(data.messages > 0)
        if(data.notifications > 0)
          text = "You have "+data.messages+" new messages and "+data.notifications+" new notifications!";
        else
          text = "You have "+data.messages+" new messages!";
      else
        if(data.notifications > 0)
          text = "You have "+data.notifications+" new notifications!";

      if(data.error)
        onError();

      if(text!=null)
        notifications.notify({
          title: "Diaspora "+diasporaUrl,
          text: text,
          iconURL: 'https://joindiaspora.com/favicon.png',
          onClick: function (data) {
            tabs.open(diasporaUrln);
          }
        });
    }
  }).on('error', onError);
};

checkNotifications();
timer.setInterval(checkNotifications, 3*60*1000);

console.log("The Diaspora add-on is running.");
