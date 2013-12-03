/*
 * grunt-configure-biblionarrator
 * https://github.com/biblionarrator/grunt-configure-biblionarrator
 *
 * Copyright (c) 2013 Jared Camins-Esakov
 * Licensed under the AGPLv3 license.
 */

'use strict';

var inquirer = require('inquirer'),
    extend = require('extend'),
    fs = require('fs');

module.exports = function(grunt) {

    grunt.registerTask('config', 'Write a Biblionarrator configuration.', function(target) {
        target = target || 'config';
        var npm = require('npm'),
            _ = grunt.util._,
            done = this.async(),
            dist = JSON.parse(fs.readFileSync('config/config.json.dist')),
            languages = fs.readdirSync('locales'),
            options = this.options(),
            checkopt = function (option, answers) {
                return (typeof answers !== 'undefined' ? answers[option] : undefined) || grunt.option(option) || options[option];
            };

        npm.load(function () {
            npm.commands.ls([], true, function (err, deps, depslite) {
                var backends = { };
                for (var mod in depslite.dependencies) {
                    if (mod.substring(0, 11) === 'bn-backend-') {
                        backends[mod.substring(11)] = require(mod);
                    }
                }
                var questions = [
                    {
                        name: 'domain',
                        type: 'input',
                        message: 'What is the domain of your Biblionarrator installation?',
                        default: 'localhost',
                        when: function(answers) {
                            return typeof checkopt('domain', answers) === 'undefined';
                        }
                    },
                    {
                        name: 'port',
                        type: 'input',
                        message: 'What port should Biblionarrator listen on?',
                        default: '3000',
                        when: function(answers) {
                            return typeof checkopt('port', answers) === 'undefined';
                        }
                    },
                    {
                        name: 'namespace',
                        type: 'input',
                        message: 'What namespace do you want to use for this instance?',
                        default: 'biblionarrator',
                        when: function(answers) {
                            return typeof checkopt('namespace', answers) === 'undefined';
                        }
                    },
                    {
                        name: 'cacheconf/backend',
                        type: 'list',
                        message: 'What backend do you want to use for the cache?',
                        default: 'redis',
                        choices: function (answers) {
                            var choices = [ ];
                            for (var backend in backends) {
                                if (backends[backend].features.cache) {
                                    choices.push({ name: backends[backend].description || backend, value: backend });
                                }
                            }
                            return choices;
                        },
                        when: function(answers) {
                            return typeof checkopt('cacheconf/backend', answers) === 'undefined';
                        }
                    },
                    {
                        name: 'dataconf/backend',
                        type: 'list',
                        message: 'What backend do you want to use for the datastore?',
                        default: 'redis',
                        choices: function (answers) {
                            var choices = [ ];
                            for (var backend in backends) {
                                if (backends[backend].features.datastore) {
                                    choices.push({ name: backends[backend].description || backend, value: backend });
                                }
                            }
                            return choices;
                        },
                        when: function(answers) {
                            return typeof checkopt('dataconf/backend', answers) === 'undefined';
                        }
                    },
                    {
                        name: 'mediaconf/backend',
                        type: 'list',
                        message: 'What backend do you want to use for media?',
                        default: 'redis',
                        choices: function (answers) {
                            var choices = [{ name: 'File system (works only on a single server)', value: 'file' }];
                            for (var backend in backends) {
                                if (backends[backend].features.mediastore) {
                                    choices.push({ name: backends[backend].description || backend, value: backend });
                                }
                            }
                            return choices;
                        },
                        when: function(answers) {
                            return typeof checkopt('mediaconf/backend', answers) === 'undefined';
                        }
                    },
                    {
                        name: 'graphconf/engine',
                        type: 'list',
                        message: 'Which database do you want to use?',
                        default: 'titan',
                        choices: [
                            { name: 'Titan (recommended, best results)', value: 'titan' },
                            { name: 'OrientDB (no full-text)', value: 'orient' },
                            { name: 'TinkerGraph (in-memory only)', value: 'tinker' }
                        ],
                        when: function(answers) {
                            return typeof checkopt('graphconf/engine', answers) === 'undefined';
                        }
                    },
                    /* Titan-specific configuration */
                    {
                        name: 'graphconf/titan/storage.backend',
                        type: 'list',
                        message: 'What backend do you want to use with Titan?',
                        default: 'cassandra',
                        choices: [ 
                            { name: 'Cassandra', value: 'cassandra' },
                            { name: 'Cassandra (thrift)', value: 'cassandrathrift' }
                        ],
                        when: function (answers) {
                            return checkopt('graphconf/engine', answers) === 'titan' && typeof checkopt('graphconf/titan/storage.backend', answers) === 'undefined';
                        }
                    },
                    {
                        name: 'graphconf/titan/storage.hostname',
                        type: 'input',
                        message: 'What is the host for the backend used by Titan?',
                        default: '127.0.0.1',
                        when: function (answers) {
                            return checkopt('graphconf/engine', answers) === 'titan' && typeof checkopt('graphconf/titan/storage.hostname', answers) === 'undefined';
                        }
                    },
                    {
                        name: 'graphconf/titan/storage.index.search.backend',
                        type: 'list',
                        message: 'What search backend do you want to use with Titan?',
                        default: 'elasticsearch',
                        choices: [ 
                            { name: 'ElasticSearch (better results, requires external setup)', value: 'elasticsearch' },
                            { name: 'Lucene (easier to configure)', value: 'lucene' }
                        ],
                        when: function (answers) {
                            return checkopt('graphconf/engine', answers) === 'titan' && typeof checkopt('graphconf/titan/storage.index.search.backend', answers) === 'undefined';
                        }
                    },
                    {
                        name: 'graphconf/titan/storage.index.search.hostname',
                        type: 'input',
                        message: 'What is the ElasticSearch host?',
                        default: '127.0.0.1',
                        when: function (answers) {
                            return checkopt('graphconf/engine', answers) === 'titan' && checkopt('graphconf/titan/storage.index.search.backend', answers) === 'elasticsearch' && typeof checkopt('graphconf/titan/storage.index.search.hostname', answers) === 'undefined';
                        }
                    },
                    /* Orient-specific configuration */
                    {
                        name: 'graphconf/orient/path',
                        type: 'input',
                        message: 'Where do you want to put the database?',
                        default: '/var/lib/biblionarrator',
                        when: function (answers) {
                            return checkopt('graphconf/engine', answers) === 'orient' && typeof checkopt('graphconf/orient/path', answers) === 'undefined';
                        }
                    },
                    /* Orient-specific configuration */
                    {
                        name: 'graphconf/orient/username',
                        type: 'input',
                        message: 'What is the username for your Orient database?',
                        default: 'admin',
                        when: function (answers) {
                            return checkopt('graphconf/engine', answers) === 'orient' && typeof checkopt('graphconf/orient/username', answers) === 'undefined';
                        }
                    },
                    {
                        name: 'graphconf/orient/password',
                        type: 'input',
                        message: 'What is the password for your Orient database?',
                        default: 'admin',
                        when: function (answers) {
                            return checkopt('graphconf/engine', answers) === 'orient' && typeof checkopt('graphconf/orient/password', answers) === 'undefined';
                        }
                    },
                    {
                        name: 'schemas',
                        type: 'checkbox',
                        message: 'Which schemas would you like to pre-configure?',
                        default: [ ],
                        choices: [
                            'eric',
                            'ericthesaurus',
                            'isbd'
                        ],
                        when: function (answers) {
                            return checkopt('schemas', answers) === 'undefined';
                        }
                    },
                    {
                        name: 'languages',
                        type: 'checkbox',
                        message: 'Which languages would you like to use?',
                        default: [ 'en' ],
                        choices: languages,
                        when: function (answers) {
                            return checkopt('languages', answers) === 'undefined';
                        }
                    },
                ];

                inquirer.prompt( questions, function( answers ) {
                    questions.forEach(function (question) {
                        answers[question.name] = checkopt(question.name, answers);
                    });
                    dist['backendconf']['mongo']['namespace'] = dist['backendconf']['redis']['namespace'] = answers['namespace'];
                    delete answers['namespace'];
                    dist['domain'] = 'http://' + answers['domain'] + ':' + answers['port'] + '/';
                    delete answers['domain'];
                    for (var key in answers) {
                        var parts = key.split('/');
                        var section = answers[key];
                        var subkey;
                        while ( (subkey = parts.pop()) ) {
                            var subsection = { };
                            subsection[subkey] = section;
                            section = subsection;
                        }
                        extend(true, dist, section);
                    }
                    fs.writeFileSync('config/' + target + '.json', JSON.stringify(dist, null, 4));
                    done();
                });
            });
        });
    });

    grunt.registerTask('user', 'Create Biblionarrator user', function (target) {
        target = target || 'config';
        var bcrypt = require('bcrypt'),
            pwgen = require('password-generator'),
            _ = grunt.util._,
            done = this.async(),
            options = this.options(),
            checkopt = function (option, answers) {
                return (typeof answers !== 'undefined' ? answers[option] : undefined) || grunt.option(option) || options[option];
            };

        var questions = [
            {
                name: 'email',
                type: 'input',
                message: 'Username (e-mail address)?',
                default: 'user@biblionarrator.com',
                when: function(answers) {
                    return typeof checkopt('email') === 'undefined';
                }
            },
            {
                name: 'name',
                type: 'input',
                message: 'Real name?',
                default: 'John Smith',
                when: function(answers) {
                    return typeof checkopt('name') === 'undefined';
                }
            },
            {
                name: 'password',
                type: 'password',
                message: 'Password (leave blank to autogenerate)?',
                default: '',
                when: function(answers) {
                    return typeof checkopt('password') === 'undefined';
                }
            },
            {
                name: 'permissions',
                type: 'checkbox',
                message: 'Permissions?',
                default: [ '*' ],
                choices: function(answers) {
                    var permissions = JSON.parse(fs.readFileSync('src/lib/permissions.json'));
                    var choices = [ { name: 'all (super user)', value: '*' } ];
                    for (var perm in permissions) {
                        choices.push({ name: permissions[perm], value: perm });
                    }
                    return choices;
                },
                when: function(answers) {
                    return typeof checkopt('permissions') === 'undefined';
                }
            }
        ];
        inquirer.prompt( questions, function( answers ) {
            var data = JSON.parse(fs.readFileSync('config/' + target + '.json'));
            var email = checkopt('email', answers);
            var name = checkopt('name', answers);
            var password = checkopt('password', answers);
            var permissions = checkopt('permissions', answers);
            var generated;
            if (typeof password === 'undefined' || password.length === 0) {
                generated = true;
                password = pwgen(16);
            }
            data.users = data.users || { };
            data.users[email] = { '_password': bcrypt.hashSync(password, 10), 'email': email, 'name': name };
            if (permissions[0] === '*') {
                data.users[email].permissions = '*';
            } else {
                data.users[email].permission = { };
                permissions.forEach(function (perm) {
                    data.users[email].permission[perm] = true;
                });
            }
            fs.writeFileSync('config/' + target + '.json', JSON.stringify(data, null, 4));
            if (generated) {
                console.log("The user " + email + " has been created with the following automatically-generated password: " + password);
            }
            done();
        });
    });

    grunt.registerTask('passwd', 'Generate Biblionarrator system user password', function(target) {
        target = target || 'config';
        var bcrypt = require('bcrypt'),
            pwgen = require('password-generator'),
            done = this.async(),
            options = this.options(),
            checkopt = function (option, answers) {
                return (typeof answers !== 'undefined' ? answers[option] : undefined) || grunt.option(option) || options[option];
            };
        var questions = [ {
                name: 'password',
                type: 'password',
                message: 'Password (leave blank to autogenerate)?',
                default: '',
                when: function(answers) {
                    return typeof checkopt('password') === 'undefined';
                }
            } ];
        inquirer.prompt( questions, function( answers ) {
            var data = JSON.parse(fs.readFileSync('config/' + target + '.json'));
            var password = checkopt('password', answers);
            var generated;
            if (typeof password === 'undefined' || password.length === 0) {
                generated = true;
                password = pwgen(16);
            }
            data.users = data.users || { };
            data.users.systemuser = { '_password': bcrypt.hashSync(password, 10), 'email': 'systemuser', 'permissions': '*' };
            fs.writeFileSync('config/' + target + '.json', JSON.stringify(data, null, 4));
            if (generated) {
                console.log("Your systemuser has been created with the following password: " + password);
                console.log("  If you forget this password you can generate a new password");
                console.log("  for the systemuser by rerunning `grunt passwd" + (target !== 'config' ? ':' + target : '') + "`");
            }
            done();
        });
    });
};
