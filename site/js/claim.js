(function () {
  var html5QrCode = null;
  var scanning = false;

  function $(id) {
    return document.getElementById(id);
  }

  function renderBalance() {
    $("balance").textContent = String(window.BuzzStorage.getPoints());
  }

  function showMsg(text, isError) {
    var el = $("claimMsg");
    el.textContent = text;
    el.classList.remove("hidden", "error");
    if (isError) el.classList.add("error");
  }

  /**
   * Expected machine QR payload (JSON string):
   * { "v": 1, "pts": 1, "item": "...", "bin": "plastic" }
   * pts: 1 standard, 5 high-impact — machine decides after sensors.
   */
  function applyPayload(raw) {
    var text = (raw || "").trim();
    if (!text) {
      showMsg("Empty payload.", true);
      return;
    }
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      showMsg("Invalid JSON. Machine should encode a JSON string in the QR.", true);
      return;
    }
    var pts = parseInt(data.pts, 10);
    if (isNaN(pts) || pts < 0) {
      showMsg("Missing or invalid pts.", true);
      return;
    }
    var total = window.BuzzStorage.addPoints(pts);
    showMsg("Point gained! +" + pts + " (balance: " + total + ").", false);
    renderBalance();
  }

  $("btnPaste").addEventListener("click", function () {
    applyPayload($("pastePayload").value);
  });

  $("btnFillDemo").addEventListener("click", function () {
    $("pastePayload").value = JSON.stringify({
      v: 1,
      pts: 1,
      item: "PET plastic bottle",
      bin: "plastic",
    });
  });

  $("btnStartQr").addEventListener("click", function () {
    if (typeof Html5Qrcode === "undefined") {
      showMsg("QR library failed to load. Check network / CDN.", true);
      return;
    }
    if (scanning) return;
    scanning = true;
    html5QrCode = new Html5Qrcode("qr-reader");
    var config = { fps: 8, qrbox: { width: 200, height: 200 } };
    html5QrCode
      .start(
        { facingMode: "environment" },
        config,
        function (decodedText) {
          applyPayload(decodedText);
          html5QrCode
            .stop()
            .then(function () {
              scanning = false;
              html5QrCode.clear();
            })
            .catch(function () {
              scanning = false;
            });
        },
        function () {}
      )
      .catch(function (err) {
        scanning = false;
        showMsg("Camera error: " + (err && err.message ? err.message : String(err)), true);
      });
  });

  $("btnStopQr").addEventListener("click", function () {
    if (!html5QrCode || !scanning) return;
    html5QrCode
      .stop()
      .then(function () {
        scanning = false;
        html5QrCode.clear();
      })
      .catch(function () {
        scanning = false;
      });
  });

  renderBalance();
})();
