var mongodb = require('mongodb');
var assert = require('assert');

var user = process.env.MONGO_USER;
var pass = process.env.MONGO_PASSWORD;

if (user && pass) {
    var url = 'mongodb://' + user + ':' + pass + '@ds111262.mlab.com:11262/voting-app';
} else {
    var url = 'mongodb://localhost:27017/test';
}

module.exports.on_connect = function on_connect(action, userdata, cbk) {
    mongodb.connect(url, (err, db) => {
        if (err)
            console.error("Could not connect to database");
        assert.equal(null, err);
        if (action)
            action(db, userdata, cbk);

        db.close();
    });
};

module.exports.databaseId = mongodb.ObjectID;
