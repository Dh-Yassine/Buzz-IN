(function () {
  var KEY = "buzzin_points_v1";

  window.BuzzStorage = {
    getPoints: function () {
      var n = parseInt(localStorage.getItem(KEY), 10);
      return isNaN(n) ? 0 : n;
    },
    addPoints: function (delta) {
      var next = this.getPoints() + (delta | 0);
      localStorage.setItem(KEY, String(next));
      return next;
    },
    setPoints: function (n) {
      localStorage.setItem(KEY, String(Math.max(0, n | 0)));
    },
  };
})();
