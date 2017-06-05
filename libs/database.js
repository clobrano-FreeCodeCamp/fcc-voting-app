var mongodb = require('mongodb');
var assert = require('assert');

module.exports.auth = function(username, password) {
    console.log('username: ' + username);
    console.log('password: ' + password);
    return true;
};

var url = 'mongodb://localhost:27017/test';


module.exports = function on_connect(action, userdata, cbk) {
    mongodb.connect(url, (err, db) => {
        if (err)
            console.err("Could not connect to database");
        assert.equal(null, err);
        console.log('Connected');
        if (action)
            action(db, userdata, cbk);
    });
};
