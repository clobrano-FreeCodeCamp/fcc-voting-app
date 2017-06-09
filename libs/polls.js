var on_connect = require('./database').on_connect;

function getPolls(database, filter, callback) {
  var polls = database.collection('polls');
  polls.find(filter).toArray(function(err, results) {
                             database.close();
                             callback(err, results);
  });
}

function savePoll(database, data, callback) {
  var polls = database.collection('polls');
  console.log('About to save: ' + data.title + ' ' + data.owner);
  if (data.owner)
    polls.insertOne(data,
                    function(err, result) {
                      database.close();
                      callback(err, result);
                    });
  else
    callback('Owner is not defined', null);
}

var polls = function() {
  this.get = function(filter, callback) {
    on_connect(getPolls, filter, callback);
  }
  this.save = function(poll, callback) {
    on_connect(savePoll, poll, callback);
  }
}

module.exports = new polls;
