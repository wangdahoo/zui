$(function() {
    console.log('ZUI Example');

    /* 首页 */
    var HomeModel = Backbone.Model.extend({
        defaults: {
            categories: [
                { name: '按钮', link: '#button' }
            ]
        }
    });

    var HomeView = Backbone.View.extend({
        el: '#app-view',

        template: _.template($('#tpl-home').html()),

        initialize: function() {
            this.listenTo(this.model, "change", this.render);
        },

        render: function() {
            console.log('home render()');
            this.$el.html(this.template(this.model.attributes));
            this.ready();
            return this;
        },

        ready: function() {
            console.log('home ready()');
        }

    });

    /* 按钮 */
    var ButtonView = Backbone.View.extend({
        el: '#app-view',

        template: _.template($('#tpl-button').html()),

        initialize: function() {
            this.listenTo(this.model, "change", this.render);
        },

        render: function() {
            console.log('button render()');
            this.$el.html(this.template({}));
            return this;
        }
    });


    var AppRouter = Backbone.Router.extend({

        routes: {
            'home':         'home',

            /* base */
            'button':       'button',
            'list':         'list',
            'grid':         'grid',

            /* widget */
            'swipe':        'swipe',
            'toast':        'toast',
            'dialog':       'dialog'
        },

        home: function() {
            new HomeView({
                model: new HomeModel()
            }).render();
        },

        button: function() {
            new ButtonView().render();
        }

    });

    console.log('Start!');
    window.app = new AppRouter();
    Backbone.history.start();

});
