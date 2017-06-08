var assert = require('assert');
var on_connect = require('./database').on_connect;

function getUser(database, data, callback) {
    database.collection('users').findOne(
        // TODO encrypt password
        {'username': data.username, 'password': data.password},
        (err, item) => {
            database.close();
            if (err) {
                console.log('Could not find username ' + data.username);
                callback(null);
            } else {
                callback(item);
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
    this.save = function(username, password, cbk) {
        var user = {
            'username': username,
            'password': password,
        };
        on_connect(saveUser, user, cbk);
    },
    this.get = function (username, cbk) {
        var data = {
            'username': username,
        };
        on_connect(getUser, data, cbk);
    }
};

module.exports = new User;
