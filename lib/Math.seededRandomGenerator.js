Math.seededRandomGenerator = function(seed) {
  this.seed = seed;
  this.original_seed = seed;
  this.random = function () {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  this.between = function (begin, end) {
    return begin + (end - begin) * this.random();
  }
  this.betweenRound = function (begin, end) {
    return Math.round(begin + (end - begin) * this.random());
  }
}