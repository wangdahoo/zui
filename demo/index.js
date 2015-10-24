$(function() {

    console.log('ZUI Example');

    /* 首页 */
    var HomeModel = Backbone.Model.extend({
        defaults: {
            pages: [
                { title: 'Button', route: '#button' },
                { title: 'Icon', route: '#icon' }
            ]
        }
    });

    var HomeView = Backbone.View.extend({
        el: 'body',

        template: _.template($('#tpl-home').html()),

        events: {
            'click .ui-btn': 'open'
        },

        initialize: function() {
            this.listenTo(this.model, "change", this.render);
        },

        render: function() {
            this.$el.html(this.template(this.model.attributes));
            return this;
        },

        open: function(e) {
            var route = $(e.target).data('route');
            app.navigate(route, {trigger: true});
        }
    });

    /* 按钮 */
    var ButtonView = Backbone.View.extend({
        el: 'body',

        template: _.template($('#tpl-button').html()),

        events: {
            'click .btn-back':  'back'
        },

        initialize: function() {
            this.listenTo(this.model, "change", this.render);
        },

        render: function() {
            this.$el.html(this.template({}));
            return this;
        },

        back: function() {
            app.navigate('back_to_home', {trigger: true});
        }
    });

    /* 图标 */
    var IconView = Backbone.View.extend({
        el: 'body',

        template: _.template($('#tpl-icon').html()),

        events: {
            'click .btn-back':  'back'
        },

        initialize: function() {
            this.listenTo(this.model, "change", this.render);
        },

        render: function() {
            this.$el.html(this.template({}));
            return this;
        },

        back: function() {
            app.navigate('back_to_home', {trigger: true});
        }
    });

    var AppRouter = Backbone.Router.extend({

        routes: {
            'home':         'home',
            'back_to_home': 'back_to_home',

            'button':       'button',
            'icon':         'icon'
        },

        home: function() {
            new HomeView({ model: new HomeModel() }).render();
            $('.ui-page').addClass('animated fade-in-right');
        },

        back_to_home: function() {
            new HomeView({ model: new HomeModel() }).render();
            $('.ui-page').addClass('animated fade-in-left');
        },

        button: function() {
            new ButtonView().render();
            $('.ui-page').addClass('animated fade-in-right');
        },

        icon: function() {
            new IconView().render();
            $('.ui-page').addClass('animated fade-in-right');
        }

    });

    console.log('Start!');

    window.app = new AppRouter();

    Backbone.history.start();

});
