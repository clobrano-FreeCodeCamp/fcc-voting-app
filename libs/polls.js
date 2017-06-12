var on_connect = require('./database').on_connect;
var databaseId = require('./database').databaseId;

function getPoll(database, id, callback) {
  var polls = database.collection('polls');
  polls.findOne({'_id': id},
    function (err, poll) {
      console.log('Poll by id: ' +  JSON.stringify(poll));
      console.log(err);
      callback(err, poll);
    });
}

function getPolls(database, filter, callback) {
  var polls = database.collection('polls');
  console.log('Polls: get ' + JSON.stringify(filter));
  polls.find(filter).sort({'votes': -1}).toArray(function(err, results) {
                             console.log(results);
                             callback(err, results);
  });
}

function savePoll(database, data, callback) {
  var polls = database.collection('polls');
  console.log('About to save: ' + data.title + ' ' + data.owner);
  if (data.owner)
    polls.insertOne(data,
                    function(err, result) {
                      callback(err, result);
                    });
  else
    callback('Owner is not defined', null);
}

function updatePoll(database, data, callback) {
  var polls = database.collection('polls');
  console.log('Updating : ' + JSON.stringify(data));
  var id = data.objId;
  delete data.objId;
  polls.update({'_id': id}, data);
  database.close();
  callback(null);
}

function removePoll(database, id, callback) {
  var polls = database.collection('polls');
  polls.remove({'_id': id}, {justOne: true});
  callback();
}

var polls = function() {
  this.update = function(id, data, callback) {
    var objId = new databaseId(id);
    data.objId = objId;
    on_connect(updatePoll, data, callback);
  },
  this.getById = function(id, callback) {
    var objId = new databaseId(id);
    on_connect(getPoll, objId, callback);
  },
  this.get = function(filter, callback) {
    on_connect(getPolls, filter, callback);
  },
  this.save = function(poll, callback) {
    on_connect(savePoll, poll, callback);
  },
  this.remove = function(id, callback) {
    var objId = new databaseId(id);
    on_connect(removePoll, objId, callback);
  }
}

module.exports = new polls;
