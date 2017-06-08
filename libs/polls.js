var on_connect = require('./database').on_connect;

function getPolls(database, filter, callback) {
  console.log('getPolls: ');
  console.log(filter);
  var polls = database.collection('polls');
  polls.find(filter).toArray(function(err, results) {
    database.close();
    callback(err, results);
  });
}


var polls = function() {
  this.get = function(filter, cbk) {
    on_connect(getPolls, filter, cbk);
  };
}

module.exports = new polls;
