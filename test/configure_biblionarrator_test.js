'use strict';

var fs = require('fs'),
    grunt = require('grunt'),
    bcrypt = require('bcrypt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

var foo_config = {
    "operators": {
        "AND": "&&",
        "OR": "\\|\\|",
        "FLOAT_START": "\\{\\{",
        "FLOAT_END": "\\}\\}",
        "GS": "\\(",
        "GE": "\\)",
        "REQ": "\\+",
        "DIS": "-",
        "MOD": "#",
        "NOT": "!",
        "FACET_START": "\\[",
        "FACET_END": "\\]",
        "FILTER_START": "(range)<",
        "FILTER_END": ">"
    },
    "backendconf": {
        "mongo": {
            "namespace": "biblionarrator"
        },
        "redis": {
            "namespace": "biblionarrator"
        }
    },
    "cacheconf": {
        "backend": "mongo"
    },
    "dataconf": {
        "backend": "mongo"
    },
    "sessionconf": {
        "backend": "mongo",
        "namespace": "biblionarrator"
    },
    "i18nextconf": {
        "backend": "local"
    },
    "graphconf": {
        "engine": "titan",
        "titan": {
            "storage.backend": "cassandra",
            "storage.hostname": "127.0.0.1",
            "storage.keyspace": "biblionarrator",
            "storage.index.search.backend": "elasticsearch",
            "storage.index.search.client-only": true,
            "storage.index.search.hostname": "127.0.0.1",
            "storage.index.search.index-name": "biblionarrator"
        },
        "orient": {
            "path": "local:/var/lib/orient/biblionarrator",
            "username": "admin",
            "password": "admin"
        },
        "tinker": {},
        "neo4j": {}
    },
    "domain": "http://test.biblionarrator.com:3000/",
    "languages": [
        "en"
    ],
    "mediaconf": {
        "backend": "mongo"
    },
    "schemas": [
        "isbd"
    ]
};

exports.config = {
  setUp: function(done) {
    // setup here if necessary
    done();
  },
  foo_config: function(test) {
    test.expect(1);
    var data = JSON.parse(fs.readFileSync('config/foo.json'));
    delete data.users;

    test.deepEqual(data, foo_config);

    test.done();
  },
  foo_passwd: function (test) {
    var bcrypt = require('bcrypt');
    var password = JSON.parse(fs.readFileSync('config/foo.json')).users.systemuser._password;
    test.expect(1);

    bcrypt.compare('imapasswordshortandstout', password, function (err, res) {
        test.equal(res, true);
        test.done();
    });
  },
  foo_user: function (test) {
    var user = JSON.parse(fs.readFileSync('config/foo.json')).users['tester@biblionarrator.com'];
    test.expect(2);
    bcrypt.compare('iamnotapassword', user._password, function (err, res) {
        test.equal(res, true);
        delete user._password;
        test.deepEqual(user, { 'email': 'tester@biblionarrator.com', 'name': 'Jonathan Test', 'permissions': '*' });
        test.done();
    });
  }
};
