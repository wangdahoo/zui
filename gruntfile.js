module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        sass: {
            scss: {
                files: [{
                    expand: true,
                    cwd: 'src/scss',
                    src: ['*.scss'],
                    dest: 'src/css',
                    ext: '.css'
                }]
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
            sass: {
                files: 'src/scss/*.scss',
                tasks: ['sass']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-sass-format');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['watch']);
};
