window.onload = function () {
  document.getElementById("state").innerHTML = "Data se aktualizují...";
  chrome.runtime.sendMessage(
    { name: "GET_DATA_FOR_POPUP" },
    function (response) {
      if (response && response.name == "GET_DATA_FOR_POPUP") {
        writeDataToPopup(response.data);
      }
    }
  );
};

function writeDataToPopup(data) {
  document.getElementById("text").innerHTML = data.text;
  document.getElementById("date").innerHTML = new Date().toLocaleString();
  document.getElementById("state").innerHTML = data.active
    ? "Dobíječka je aktivní!"
    : "Dobíječka je neaktivní!";
  document.getElementById("state").className = data.active
    ? "textMid stateTrue"
    : "textMid stateFalse";
}
