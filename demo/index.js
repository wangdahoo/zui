$(function() {

    console.log('ZUI Example');

    var LOADING_TEMPLATE = $('#tpl-loading').html();

    /* 首页 */
    var HomeModel = Backbone.Model.extend({
        defaults: {
            pages: [
                { title: 'Button', route: '#button' },
                { title: 'Icon', route: '#icon' },
                { title: 'Grid', route: '#grid' }
            ]
        }
    });

    var HomeView = Backbone.View.extend({
        el: 'body',

        template: _.template($('#tpl-home').html()),

        events: {
            'click .ui-btn': 'open'
        },

        render: function() {
            this.$el.html(this.template(this.model.attributes));
            return this;
        },

        open: function(e) {
            var route = $(e.target).data('route');
            var isEffect = _.indexOf(['loading', 'alert', 'confirm'], route);
            if (isEffect == 0) {
                var tpl = _.template(LOADING_TEMPLATE)({ msg: 'Loading...' });
                $('body').append(tpl);
                var loading = $('#loading');
                loading.addClass('ui-modal-show');
                var preventDefault = function(e) {
                    e.preventDefault();
                };
                window.addEventListener('touchstart', preventDefault);
                _.delay(function() {
                    loading.removeClass('ui-modal-show');
                    window.removeEventListener('touchstart', preventDefault);
                }, 3000);
            } else if (isEffect == 1) {
                // todo
            } else if (isEffect == 2) {
                // todo
            } else {
                app.navigate(route, {trigger: true});
            }
        }
    });

    /* Button */
    var ButtonView = Backbone.View.extend({
        el: 'body',

        template: _.template($('#tpl-button').html()),

        events: {
            'click .btn-back':  'back'
        },

        render: function() {
            this.$el.html(this.template({}));
            return this;
        },

        back: function() {
            app.navigate('back_to_home', {trigger: true});
        }
    });

    /* Icon */
    var IconView = Backbone.View.extend({
        el: 'body',

        template: _.template($('#tpl-icon').html()),

        events: {
            'click .btn-back':  'back'
        },

        render: function() {
            this.$el.html(this.template({}));
            return this;
        },

        back: function() {
            app.navigate('back_to_home', {trigger: true});
        }
    });

    /* Grid */
    var GridView = Backbone.View.extend({
        el: 'body',

        template: _.template($('#tpl-grid').html()),

        events: {
            'click .btn-back':  'back'
        },

        render: function() {
            this.$el.html(this.template({}));
            return this;
        },

        back: function() {
            app.navigate('back_to_home', {trigger: true});
        }
    });

    var _models = {};
    _models['home'] = new HomeModel();

    var _views = {};
    _views['home'] = new HomeView({ model: _models['home'] });
    _views['button'] = new ButtonView();
    _views['icon'] = new IconView();
    _views['grid'] = new GridView();


    var AppRouter = Backbone.Router.extend({

        routes: {
            'home':         'home',
            'back_to_home': 'back_to_home',

            'button':       'button',
            'icon':         'icon',
            'grid':         'grid'

        },

        home: function() {
            _views['home'].render();
            $('.ui-page').addClass('animated fade-in-right');
        },

        back_to_home: function() {
            console.log('back to home!');
            _views['home'].render();
            $('.ui-page').addClass('animated fade-in-left');
        },

        button: function() {
            _views['button'].render();
            $('.ui-page').addClass('animated fade-in-right');
        },

        icon: function() {
            _views['icon'].render();
            $('.ui-page').addClass('animated fade-in-right');
        },

        grid: function() {
            _views['grid'].render();
            $('.ui-page').addClass('animated fade-in-right');
        }

    });

    console.log('Start!');

    window.app = new AppRouter();

    Backbone.history.start();

});
