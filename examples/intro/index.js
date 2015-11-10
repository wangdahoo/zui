$(function() {

    /* Step 1
     * Create an app engine */

    var app = zui.Engine({
        pageTransition: 'ios',
        pageTheme: 'light'
    });

    /*
     * Step 2
     * Create Pages */

    var pages = {};
    pages.home = zui.Page({
        title: 'UI Demo',
        template: _.template($('#tpl-home').html()),
        model: {
            version: '1.0.0',
            items: [
                { title: 'Icon', route: 'icon' },
                { title: 'Button', route: 'button' },
                { title: 'List', route: 'list' },
                { title: 'Grid', route: 'grid' },
                { title: 'Loading', route: 'loading' },
                { title: 'Toast', route: 'toast' },
                { title: 'Dialog', route: 'dialog' }
            ]
        },
        ready: function() {

            /* Insert Your Code in Page's Ready Function */

            $('.ui-list>li').on('click', function(e) {
                var route = $(e.target).data('route');
                if (route == 'loading') {
                    zui.showLoading('加载中');
                } else if (route == 'toast') {
                    zui.toast('Hi, there ~ ;)');
                } else {
                    app.navigate(route);
                }
            })

        }
    });

    pages.icon = zui.Page({
        title: 'Icon',
        backButton: function(e) {
            app.navigate('home', 'back');
        },
        template: $('#tpl-icon').html()
    });

    pages.button = zui.Page({
        title: 'Button',
        backButton: function(e) {
            app.navigate('home', 'back');
        },
        template: $('#tpl-button').html()
    });

    pages.list = zui.Page({
        title: 'List',
        backButton: function(e) {
            app.navigate('home', 'back');
        },
        template: $('#tpl-list').html()
    });

    pages.grid = zui.Page({
        title: 'Grid',
        backButton: function(e) {
            app.back();
        },
        template: $('#tpl-grid').html()
    });

    pages.dialog = zui.Page({
        title: 'Dialog',
        backButton: function(e) {
            app.back();
        },
        template: $('#tpl-dialog').html(),

        ready: function() {

            $('#btn-show-alert').on('click', function() {
                zui.alert('This is a alert dialog.');
            });

            $('#btn-show-confirm').on('click', function() {
                zui
                    .confirm('This is an confirm dialog with promise object.')
                    .done(function(result) {
                        if (result) {
                            //console.log('Ok clicked.');

                            zui.toast('Ok clicked.');
                        } else {
                            //console.log('Cancel clicked.');

                            zui.toast('Cancel clicked.');
                        }
                    });
            });

        }
    });

    /* Step 3
     * Setup app engine's routes with pages, and then call engine's start() method. */

    app.init({
        routes: {
            home: pages.home,
            icon: pages.icon,
            button: pages.button,
            list: pages.list,
            grid: pages.grid,
            dialog: pages.dialog
        },

        defaultRoute: 'home'
    })
        .start(); // Start App

    window.app = app; // Expose the app instance to window. Have Fun ;)
});
