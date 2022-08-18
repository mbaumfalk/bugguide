const geobuf = require('geobuf');
const Pbf = require('pbf');

module.exports = function (source) {
  return Buffer.from(geobuf.encode(JSON.parse(source), new Pbf()));
};
