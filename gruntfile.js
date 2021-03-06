module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        sass: {
            scss: {
                files: [{
                    expand: true,
                    cwd: 'src/scss',
                    src: ['zui.scss'],
                    dest: 'dist/css',
                    ext: '.css'
                }]
            }
        },

        cssmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'dist/css',
                    src: ['*.css', '!*.min.css'],
                    dest: 'dist/css',
                    ext: '.min.css'
                }]
            }
        },

        copy: {
            fonts: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['fonts/**'],
                        dest: 'dist/'
                    }
                ]
            }
        },

        concat: {
            bundle: {
                src: [
                    'bower_components/underscore/underscore.js',
                    'bower_components/jquery/dist/jquery.js',
                    'src/js/zui.js',
                    'bower_components/fastclick/lib/fastclick.js'
                ],
                dest: 'src/js/zui.bundle.js'
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                        ' *<%= grunt.template.today("yyyy-mm-dd") %> by Wangdahoo */',
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                    dead_code: true
                }
            },
            dist: {
                files: {
                    'dist/js/zui.min.js': ['src/js/zui.js'],
                    'dist/js/zui.bundle.min.js': ['src/js/zui.bundle.js']
                }
            }
        },

        sassFormat: {
            options: {
                //indentChar: '\t',
                //indentStep: 1,

                indentChar: ' ',
                indentStep: 4,
                indent: true,
                blankLine: {
                    property: true,
                    close: true
                },
                whiteSpace: {
                    selector: true,
                    property: true
                },
                order: true,
                lang: 'en',
                debug: false
            },
            files: {
                src: ['src/scss/*.scss']
            }
        },

        watch: {
            css: {
                files: 'src/scss/*.scss',
                tasks: ['sass', 'cssmin']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-sass-format');


    // grunt.registerTask('PUBLISH', ['copy:fonts', 'sass', 'cssmin', 'concat:bundle', 'uglify:dist']);

};
