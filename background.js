chrome.runtime.onInstalled.addListener(() => {
  sendNotification();
  chrome.alarms.get("kaktus", (a) => {
    if (!a) chrome.alarms.create("kaktus", { periodInMinutes: 30 });
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name == "kaktus") {
    sendNotification();
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request && request.name === "GET_DATA_FOR_POPUP") {
    getData.then((cleanText) => {
      getDate(cleanText).then((cleanDate) => {
        sendResponse({
          name: "GET_DATA_FOR_POPUP",
          data: { text: cleanText, ...cleanDate },
        });
      });
    });
  }

  return true;
});

const getDate = (text) => {
  return new Promise((resolve, reject) => {
    const dateParse = /\d{1,2}\D\d{1,2}\D(\d{4}|\d{2})/g;
    const textWithoutSpaces = text.replace(/\s/g, "");
    const foundString = textWithoutSpaces.match(dateParse);
    if (!foundString) {
      reject("Data Error");
    }
    const rawDate = foundString[0];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    var parts = rawDate.match(/(\d+)/g);
    const dobijeckaDate = new Date(parts[2], parts[1] - 1, parts[0]);
    resolve({
      date: dobijeckaDate,
      active: todayDate.getTime() == dobijeckaDate.getTime(),
    });
  });
};

const getData = new Promise((resolve, reject) => {
  let myRequest = new Request("https://www.mujkaktus.cz/chces-pridat");
  let parserRegEx = /<h3 class="uppercase text-drawn">Pokud(.*?)<\/h3>/gs;

  return fetch(myRequest)
    .then(function (response) {
      if (!response.ok) {
        reject(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(function (response) {
      const foundString = response.match(parserRegEx);
      const rawText = foundString[0];
      const cleanText = rawText.replace(/<[^>]*>?/gm, "");
      resolve(cleanText);
    });
});

function sendNotification() {
  chrome.storage.sync.get(["latestDobijecka"], function (result) {
    getData.then((cleanText) => {
      const cleanTextJSON = JSON.stringify(cleanText);

      getDate(cleanText).then((cleanDate) => {
        if (cleanDate.active) {
          if (!result || (result && result.latestDobijecka != cleanTextJSON)) {
            browser.notifications.create("kaktus", {
              type: "basic",
              iconUrl: "assets/images/icon128.png",
              title: "Kaktus Dobíječka!",
              /* requireInteraction: true, */ //for chrome only
              message: cleanText,
              priority: 2,
            });
          }
          chrome.storage.sync.set({ latestDobijecka: cleanTextJSON });

          chrome.browserAction.setBadgeText({ text: "✅" });
          chrome.browserAction.setBadgeBackgroundColor({ color: "transparent" });
        } else {
          chrome.browserAction.setBadgeText({ text: "❌" });
          chrome.browserAction.setBadgeBackgroundColor({ color: "transparent" });
        }
      });
    });
  });
}
