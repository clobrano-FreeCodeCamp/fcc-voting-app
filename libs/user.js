var on_connect = require('./database').on_connect;
var databaseId = require('./database').databaseId;
var assert = require('assert');
var bcrypt = require('bcryptjs');

function getUser(database, username, callback) {
  var users = database.collection('users');
  users.findOne({'username': username}, (err, user) => {
       if (user) {
         callback(err, user);
       } else {
         callback(null);
       }
     }
   );
};

function saveUser(database, data, callback) {
  const iterations = 10;
  bcrypt.hash(data.password, iterations, (err, hash) => {
    assert.equal(err, null);
    var user = {
      'username': data.username,
      'hash': hash
    };

    var collection = database.collection('users');
    collection.insertOne(user, (err, result) => {
      console.log(err);
      assert.equal(err, null);
      getUser(database, user.username, callback);
    });
  });
}



var User = function () {
  this.save = function(newuser, cbk) {
    on_connect(saveUser, newuser, cbk);
  },
  this.get = function (username, cbk) {
    on_connect(getUser, username, cbk);
  },
  this.getById = function (id, cbk) {
    var objId =  new databaseId(id);
    on_connect(getUser, objId, cbk);
  },
  this.isPasswordValid = function (plain, user, callback) {
    bcrypt.compare(plain, user.hash, (err, res) => {
      if (err) return callback(false);
      return callback(res);
    });
  }
};

module.exports = new User;
