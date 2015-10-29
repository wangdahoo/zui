$(function() {

    /* Pages */

    var pages = {};

    pages['home'] = zui.Page({
        title: 'UI Demo',
        template: $('#tpl-home').html(),
        model: {
            items: [
                { title: 'Icon', route: 'icon' },
                { title: 'Button', route: 'button' },
                { title: 'List', route: 'list' },
                { title: 'Grid', route: 'grid' },
                { title: 'Loading', route: 'loading' },
                { title: 'Alert', route: 'alert' }
            ]
        }
    });

    pages['icon'] = zui.Page({
        title: 'Icon',
        backButton: function(e) {

        },
        template: $('#tpl-icon').html(),
        model: {
            items: [
                { title: 'Icon', route: 'icon' },
                { title: 'Button', route: 'button' },
                { title: 'List', route: 'list' },
                { title: 'Grid', route: 'grid' },
                { title: 'Loading', route: 'loading' },
                { title: 'Alert', route: 'alert' }
            ]
        }
    });

    /* The app engine, who is responsible for routes & other stuff. */

    var app = zui.Engine({
        routes: {
            home: function() {
                pages['home'].render();
            },

            icon: function() {

            }
        },

        defaultRoute: 'home'
    });

    app.start();

    window.app = app;
});
