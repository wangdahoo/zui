module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jst: {
            tpl: {
                options: {
                    amd: true,
                    processName: function(name) {
                        return name.replace('src/tpl/', '').replace('.html', '');
                    },
                    processContent: function(src) {
                        return src.replace(/(^\s+|\s+$|\n)/gm, '');
                    }
                },
                files: {
                    'src/js/render/templates.js': ['src/tpl/*.html']
                }
            }
        },

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

        watch: {
            jst: {
                files: 'src/tpl/*.html',
                tasks: ['jst']
            },
            sass: {
                files: 'src/scss/*.scss',
                tasks: ['sass']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['watch']);
};
