$(function() {

    /* Step 1
     * Create an app engine */

    var app = zui.Engine();

    /*
     * Step 2
     * Create Pages */

    var pages = {};
    pages.home = zui.Page({
        title: 'UI Demo',
        template: $('#tpl-home').html(),
        model: {
            version: '1.0.0',
            items: [
                { title: 'Icon', route: 'icon' },
                { title: 'Button', route: 'button' },
                { title: 'List', route: 'list' },
                { title: 'Grid', route: 'grid' },
                { title: 'Loading', route: 'loading' }
            ]
        },
        ready: function() {

            /* Insert Your Code in Page's Ready Function */

            $('.ui-list>li').on('click', function(e) {
                var route = $(e.target).data('route');
                if (route == 'loading') {
                    zui.showLoading('加载中');
                } else {
                    app.navigate(route, 'slide');
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
            app.navigate('home', 'back');
        },
        template: $('#tpl-grid').html()
    });

    /* Step 3
     * Setup app engine's routes with pages, and then call engine's start() method.
     *
     * Have Fun ;) */

    app.init({
        routes: {
            home: pages.home,
            icon: pages.icon,
            button: pages.button,
            list: pages.list,
            grid: pages.grid
        },

        defaultRoute: 'home'
    })
        .start(); // Start App

    window.app = app;
});
