/*
 * grunt-configure-biblionarrator
 * https://github.com/biblionarrator/grunt-configure-biblionarrator
 *
 * Copyright (c) 2013 Jared Camins-Esakov
 * Licensed under the AGPLv3 license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      config: [ 'config/*.json' ]
    },

    // Configuration to be run (and then tested).
    config: {
      options: {
        domain: 'test.biblionarrator.com',
        port: 3000,
        namespace: 'biblionarrator',
        'cacheconf/backend': 'mongo',
        'dataconf/backend': 'mongo',
        'mediaconf/backend': 'mongo',
        'graphconf/engine': 'titan',
        'graphconf/titan/storage.backend': 'cassandra',
        'graphconf/titan/storage.hostname': '127.0.0.1',
        'graphconf/titan/storage.index.search.backend': 'elasticsearch',
        'graphconf/titan/storage.index.search.hostname': '127.0.0.1',
        'schemas': [ 'isbd' ],
        'languages': [ 'en' ]
      },
    },
    passwd: {
      options: {
        'password': 'imapasswordshortandstout'
      }
    },
    user: {
      options: {
        'email': 'tester@biblionarrator.com',
        'name': 'Jonathan Test',
        'password': 'iamnotapassword',
        'permissions': [ '*' ]
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.registerTask('test', ['clean', 'config:foo', 'passwd:foo', 'user:foo', 'nodeunit', 'clean']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
