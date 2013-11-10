/*
 * grunt-configure-biblionarrator
 * https://github.com/biblionarrator/grunt-configure-biblionarrator
 *
 * Copyright (c) 2013 Jared Camins-Esakov
 * Licensed under the AGPLv3 license.
 */

'use strict';

module.exports = function(grunt) {

    grunt.registerTask('configure_biblionarrator', 'Write a Biblionarrator configuration.', function(target) {
        var inquirer = require('inquirer'),
            extend = require('extend'),
            fs = require('fs'),
            options = this.options(),
            _ = grunt.util._,
            npm = require('npm'),
            done = this.async(),
            dist = JSON.parse(fs.readFileSync(process.cwd() + '/config/config.json.dist')),
            languages = fs.readdirSync(process.cwd() + '/locales');

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
                        default: 'localhost'
                    },
                    {
                        name: 'port',
                        type: 'input',
                        message: 'What port should Biblionarrator listen on?',
                        default: '3000'
                    },
                    {
                        name: 'namespace',
                        type: 'input',
                        message: 'What namespace do you want to use for this instance?',
                        default: 'biblionarrator'
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
                        ]
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
                            return answers['graphconf/engine'] === 'titan';
                        }
                    },
                    {
                        name: 'graphconf/titan/storage.hostname',
                        type: 'input',
                        message: 'What is the host for the backend used by Titan?',
                        default: '127.0.0.1',
                        when: function (answers) {
                            return answers['graphconf/engine'] === 'titan';
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
                            return answers['graphconf/engine'] === 'titan';
                        }
                    },
                    {
                        name: 'graphconf/titan/storage.index.search.hostname',
                        type: 'input',
                        message: 'What is the ElasticSearch host?',
                        default: '127.0.0.1',
                        when: function (answers) {
                            return answers['graphconf/engine'] === 'titan' && answers['graphconf/titan/storage.index.search.backend'] === 'elasticsearch';
                        }
                    },
                    /* Orient-specific configuration */
                    {
                        name: 'graphconf/orient/path',
                        type: 'input',
                        message: 'Where do you want to put the database?',
                        default: '/var/lib/biblionarrator',
                        when: function (answers) {
                            return answers['graphconf/engine'] === 'orient';
                        }
                    },
                    /* Orient-specific configuration */
                    {
                        name: 'graphconf/orient/username',
                        type: 'input',
                        message: 'What is the username for your Orient database?',
                        default: 'admin',
                        when: function (answers) {
                            return answers['graphconf/engine'] === 'orient';
                        }
                    },
                    {
                        name: 'graphconf/orient/password',
                        type: 'input',
                        message: 'What is the password for your Orient database?',
                        default: 'admin',
                        when: function (answers) {
                            return answers['graphconf/engine'] === 'orient';
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
                        ]
                    },
                    {
                        name: 'languages',
                        type: 'checkbox',
                        message: 'Which languages would you like to use?',
                        default: [ 'en' ],
                        choices: languages
                    },
                ];

                inquirer.prompt( questions, function( answers ) {
                    dist['backendconf']['mongo']['namespace'] = dist['backendconf']['redis']['namespace'] = answers['namespace'];
                    delete answers['namespace'];
                    dist['domain'] = 'http://' + answers['domain'] + ':' + answers['port'] + '/';
                    delete answers['domain'];
                    delete answers['port'];
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
};
