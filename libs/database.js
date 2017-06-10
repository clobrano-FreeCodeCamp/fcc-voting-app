var mongodb = require('mongodb');
var assert = require('assert');

var url = 'mongodb://localhost:27017/test';


module.exports.on_connect = function on_connect(action, userdata, cbk) {
    mongodb.connect(url, (err, db) => {
        if (err)
            console.error("Could not connect to database");
        assert.equal(null, err);
        if (action)
            action(db, userdata, cbk);
    });
};
