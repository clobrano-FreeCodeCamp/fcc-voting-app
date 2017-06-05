var on_connect = require('./database').on_connect;

function getUser(database, data, callback) {
    database.collection('users').findOne(
        data.username,
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
    databse.collection('users').insertOne(
        data,
        (err, r) => {
            assert.equal(err, null);
            database.close();
        }
    );
};


var User = function () {
    save = function(username, password, cbk) {
        var user = {
            'username': username,
            'password': password,
        };
        on_connect(saveUser, user, cbk);
    },
    get = function (username, cbk) {
        var data = {
            'username': username,
        };
        on_connect(getUser, data, cbk);
    }
};
