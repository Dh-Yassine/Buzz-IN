(function () {
  var BINS = [
    "metal",
    "paper",
    "glass",
    "plastic",
    "mixed",
    "compost",
    "cardboard",
    "batteries",
    "food",
    "cigarettes",
  ];

  function inferBin(itemText) {
    var t = (itemText || "").toLowerCase();
    if (t.indexOf("battery") !== -1) return "batteries";
    if (t.indexOf("pet") !== -1 || t.indexOf("plastic") !== -1) return "plastic";
    if (t.indexOf("paper") !== -1 || t.indexOf("trace") !== -1) return "paper";
    if (t.indexOf("can") !== -1 || t.indexOf("aluminum") !== -1) return "metal";
    if (t.indexOf("glass") !== -1) return "glass";
    return "mixed";
  }

  var video = document.getElementById("preview");
  var stream = null;

  function setStream(s) {
    stream = s;
    if (video) {
      if (s) {
        video.srcObject = s;
        video.classList.remove("hidden");
      } else {
        video.srcObject = null;
        video.classList.add("hidden");
      }
    }
  }

  document.getElementById("btnCamera").addEventListener("click", function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera not supported in this browser/context.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then(function (s) {
        setStream(s);
      })
      .catch(function () {
        alert("Could not open camera (permission or HTTPS required).");
      });
  });

  document.getElementById("btnStopCamera").addEventListener("click", function () {
    if (stream) {
      stream.getTracks().forEach(function (t) {
        t.stop();
      });
    }
    setStream(null);
  });

  function showResult(itemLabel, bin) {
    var safeBin = BINS.indexOf(bin) !== -1 ? bin : "mixed";
    document.getElementById("itemLabel").textContent = itemLabel;
    document.getElementById("binName").textContent = safeBin;
    document.getElementById("result").classList.remove("hidden");
  }

  document.querySelectorAll("[data-mock]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var label = btn.getAttribute("data-mock");
      showResult(label, inferBin(label));
    });
  });
})();
