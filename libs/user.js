var on_connect = require('./database').on_connect;
var databaseId = require('./database').databaseId;
var assert = require('assert');
var bcrypt = require('bcrypt');

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
  },
  this.getById = function (id, cbk) {
    var objId =  new databaseId(id);
    on_connect(getUser, objId, cbk);
  },
  this.isPasswordValid (plain, user) {
    // TODO
  }
};

module.exports = new User;
