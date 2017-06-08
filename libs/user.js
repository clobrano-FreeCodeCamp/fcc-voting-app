var assert = require('assert');
var on_connect = require('./database').on_connect;

function getUser(database, data, callback) {
  console.log('Looking for ' + data);
	database.collection('users').findOne(
		// TODO encrypt password
    data,
		(err, item) => {
			database.close();
			if (item) {
				callback(item);
			} else {
				console.log('Could not find username ' + data.username);
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
      console.log('Saved user: ' + data);
			getUser(database, data, callback);
		}
	);
};


var User = function () {
	this.save = function(username, password, cbk) {
		var user = {
			'username': username,
			'password': password,
		};
		on_connect(saveUser, user, cbk);
	},
	this.get = function (user, cbk) {
		on_connect(getUser, user, cbk);
	}
};

module.exports = new User;
