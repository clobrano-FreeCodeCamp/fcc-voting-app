var assert = require('assert');
var on_connect = require('./database').on_connect;

function getUser(database, data, callback) {
  var users = database.collection('users');

  users.findOne(
     data,
     (err, item) => {
       database.close();
       if (item) {
         callback(err, item);
       } else {
         callback(null);
       }
     }
   );
};

function saveUser(database, data, callback) {
  database.collection('users').insertOne(
    data,
    (err, result) => {
      assert.equal(err, null);
      getUser(database, data, callback);
    }
  );
};


var User = function () {
  this.save = function(newuser, cbk) {
    on_connect(saveUser, newuser, cbk);
  },
  this.get = function (user, cbk) {
    on_connect(getUser, user, cbk);
  }
};

module.exports = new User;
