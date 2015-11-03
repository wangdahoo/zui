$(function() {

    /**
     * Guide v1.0.0
     *
     * 1. Core
     *
     * zui.Engine()
     *  - Use this method to create global app instance, who is responsible for routes in a Single Page Application.
     *
     *  eg.
     *      var app = zui.Engine();
     *
     *      app.init({                          // init engine with a routes map
     *          routes: {                       // { [String routeName]:  [zui.Page page], ... }
     *              master: masterPage,
     *              detail: detailPage,
     *          },
     *
     *          defaultRoute: 'master'
     *      });
     *
     *      app.navigate('master');             // navigate to a page by route 'master'.
     *
     *      app.navigate('master', {            // navigate to a page with routeName & routeParams
     *          id: 123,
     *          message: 'Come back!'
     *      });
     *
     *      // todo: Deprecated for translate3d issue on some versions of ios Safari.
     *      // app
     *          .navigate('master', 'forward')  // navigate to a page with routeName & transition.
     *
     *
     *      // app.navigate('master', {         // navigate to a page with routeName, routeParams & transition.
     *      //     id: 123,
     *      //     msg: 'May I have a cigarette?'
     *      // }, 'back');
     *
     *      app.start();                        // call navigate() with the defaultRoute.
     *
     *      app.back();                         // navigate to the last page by history.
     *
     *      app.getCurrentRoute();              // return current route.
     *
     *      var params = app.GET;               // get all parameters from URL.
     *
     *      var count = 0;
     *      var tid = setInterval(function() {
     *          console.log(count++);
     *      }, 1000);
     *      app.addTimer(tid);                  // mark down a timer id, and the timer will be eliminated automatically
     *                                          // when you call navigate() to next page.
     *
     *      app.deleteTimer(tid);               // eliminate a timer you marked down.
     *
     *      app.clearTimers();                  // eliminate all timers you marked down.
     *
     * zui.Page([Object options])
     *  - Use this method to create a Page View.
     *
     *  eg.
     *      var myPage = zui.Page({
     *          title: 'Hey Jude',              // title on page's navigation bar
     *
     *          backButton: function() {        // click callback for a back button, optional. leave the option undefined if you don't need a back button on the navigation bar.
     *              // do your magic here.
     *          },
     *
     *          template: $('#tpl-homepage'),   // a underscore template for page content rendering.
     *
     *          model: {                        // data model for template.
     *              author: 'The Beatles',
     *              year: '1968',
     *              style: 'Rock, Pop'
     *          },
     *
     *          ready: function () {            // a callback who execute immediately after page rendering.
     *              // do your magic here.
     *          }
     *      })
     *
     * zui.View()
     *  - TBD
     *
     * 2. Components
     *
     * zui.showLoading([Object options])
     *
     *  eg.
     *      zui.showLoading({
     *          message: 'Loading...',
     *          duration: 2000
     *      })
     *
     * zui.hideLoading();
     *
     *  eg.
     *      zui.hideLoading();
     *
     * zui.alert([String message])
     *  - todo
     *
     * zui.confirm([Object options])
     *  - todo
     *
     * zui.swipe([Object options])
     *  - TBD
     *
     */

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
        theme: 'positive',
        backButton: function(e) {
            app.navigate('home', 'back');
        },
        template: $('#tpl-icon').html()
    });

    pages.button = zui.Page({
        title: 'Button',
        theme: 'assertive',
        backButton: function(e) {
            app.navigate('home', 'back');
        },
        template: $('#tpl-button').html()
    });

    pages.list = zui.Page({
        title: 'List',
        theme: 'balanced',
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
