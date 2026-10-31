// The free converter on /<from>-to-<to>/ pages: one real conversion through the NativeToEnglish
// API, sharing the apps' free allowance (3 a day). Sends only the text typed here, when the button
// is pressed; nothing is stored. Analytics carry the page and the outcome, never the text.
(function () {
  var form = document.getElementById("converter");
  if (!form) return;
  var API = form.dataset.api;
  var input = form.querySelector("textarea");
  var button = form.querySelector("button[type=submit]");
  var out = document.getElementById("converter-result");
  var outText = document.getElementById("converter-output");
  var note = document.getElementById("converter-note");
  var copyButton = document.getElementById("converter-copy");
  var count = document.getElementById("converter-count");
  var MAX = 1500;

  function installId() {
    try {
      var id = localStorage.getItem("nte-web-id");
      if (!/^[a-f0-9]{32}$/.test(id || "")) {
        var bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        id = Array.from(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
        localStorage.setItem("nte-web-id", id);
      }
      return id;
    } catch (e) { return ""; }
  }
  function track(name, props) { if (window.track) window.track(name, props); }
  function show(message, kind) { note.textContent = message; note.dataset.kind = kind || ""; note.hidden = !message; }
  function updateCount() { count.textContent = input.value.length.toLocaleString("en-US") + " / 1,500"; }
  input.addEventListener("input", updateCount);
  updateCount();

  document.querySelectorAll("[data-sample]").forEach(function (chip) {
    chip.addEventListener("click", function () { input.value = chip.dataset.sample; updateCount(); input.focus(); });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var draft = input.value.trim();
    if (!draft) { show("Type something first.", "error"); return; }
    if (draft.length > MAX) { show("That's too long. Up to 1,500 characters at a time.", "error"); return; }
    button.disabled = true; button.dataset.busy = "1"; show("", "");
    track("converter_submit", { page: form.dataset.page });
    fetch(API + "/v1/improve", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-EkLish-Installation-ID": installId() },
      body: JSON.stringify({ draft: draft, goal: form.dataset.goal, language: form.dataset.lang, surface: "web" })
    }).then(function (response) {
      return response.json().then(function (body) { return { status: response.status, body: body }; });
    }).then(function (r) {
      if (r.status === 200 && r.body.improvedText) {
        outText.textContent = r.body.improvedText;
        out.hidden = false;
        var left = r.body.remaining;
        show(typeof left === "number" ? (left === 1 ? "1 free conversion left today." : left + " free conversions left today.") + " Get the app to convert right inside any chat." : "", "info");
        track("converter_result", { page: form.dataset.page, outcome: "ok" });
      } else if (r.status === 429) {
        show("You've used today's 3 free conversions. They come back tomorrow, or keep going in the app.", "limit");
        track("converter_result", { page: form.dataset.page, outcome: "limit" });
      } else {
        show((r.body && r.body.error) || "Something went wrong. Please try again.", "error");
        track("converter_result", { page: form.dataset.page, outcome: "error" });
      }
    }).catch(function () {
      show("Couldn't reach the converter. Check your connection and try again.", "error");
      track("converter_result", { page: form.dataset.page, outcome: "offline" });
    }).then(function () { button.disabled = false; delete button.dataset.busy; });
  });

  copyButton.addEventListener("click", function () {
    navigator.clipboard.writeText(outText.textContent).then(function () {
      copyButton.textContent = "Copied"; setTimeout(function () { copyButton.textContent = "Copy"; }, 1500);
      track("converter_copy", { page: form.dataset.page });
    });
  });
})();
