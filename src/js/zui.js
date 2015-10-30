;(function() {

    var _global = this;

    /* UUID */

    var _rng;

    if (!_rng) {
        // Math.random()-based (RNG)
        var  _rnds = new Array(16);
        _rng = function() {
            for (var i = 0, r; i < 16; i++) {
                if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
                _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
            }
            return _rnds;
        };
    }

    // Buffer class to use
    var BufferClass = Array;

    // Maps for number <-> hex string conversion
    var _byteToHex = [];
    var _hexToByte = {};
    for (var i = 0; i < 256; i++) {
        _byteToHex[i] = (i + 0x100).toString(16).substr(1);
        _hexToByte[_byteToHex[i]] = i;
    }

    // **`parse()` - Parse a UUID into it's component bytes**
    function parse(s, buf, offset) {
        var i = (buf && offset) || 0, ii = 0;

        buf = buf || [];
        s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
            if (ii < 16) { // Don't overflow!
                buf[i + ii++] = _hexToByte[oct];
            }
        });

        // Zero out remaining bytes if string was short
        while (ii < 16) {
            buf[i + ii++] = 0;
        }

        return buf;
    }

    // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
    function unparse(buf, offset) {
        var i = offset || 0, bth = _byteToHex;
        return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
    }

    // **`v1()` - Generate time-based UUID**
    //
    // Inspired by https://github.com/LiosK/UUID.js
    // and http://docs.python.org/library/uuid.html

    // random #'s we need to init node and clockseq
    var _seedBytes = _rng();

    // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
    var _nodeId = [
        _seedBytes[0] | 0x01,
        _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
    ];

    // Per 4.2.2, randomize (14 bit) clockseq
    var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

    // Previous uuid creation time
    var _lastMSecs = 0, _lastNSecs = 0;

    // See https://github.com/broofa/node-uuid for API details
    function v1(options, buf, offset) {
        var i = buf && offset || 0;
        var b = buf || [];

        options = options || {};

        var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

        // UUID timestamps are 100 nano-second units since the Gregorian epoch,
        // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
        // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
        // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
        var msecs = options.msecs != null ? options.msecs : new Date().getTime();

        // Per 4.2.1.2, use count of uuid's generated during the current clock
        // cycle to simulate higher resolution clock
        var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

        // Time since last uuid creation (in msecs)
        var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

        // Per 4.2.1.2, Bump clockseq on clock regression
        if (dt < 0 && options.clockseq == null) {
            clockseq = clockseq + 1 & 0x3fff;
        }

        // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
        // time interval
        if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
            nsecs = 0;
        }

        // Per 4.2.1.2 Throw error if too many uuids are requested
        if (nsecs >= 10000) {
            throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
        }

        _lastMSecs = msecs;
        _lastNSecs = nsecs;
        _clockseq = clockseq;

        // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
        msecs += 12219292800000;

        // `time_low`
        var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
        b[i++] = tl >>> 24 & 0xff;
        b[i++] = tl >>> 16 & 0xff;
        b[i++] = tl >>> 8 & 0xff;
        b[i++] = tl & 0xff;

        // `time_mid`
        var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
        b[i++] = tmh >>> 8 & 0xff;
        b[i++] = tmh & 0xff;

        // `time_high_and_version`
        b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
        b[i++] = tmh >>> 16 & 0xff;

        // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
        b[i++] = clockseq >>> 8 | 0x80;

        // `clock_seq_low`
        b[i++] = clockseq & 0xff;

        // `node`
        var node = options.node || _nodeId;
        for (var n = 0; n < 6; n++) {
            b[i + n] = node[n];
        }

        return buf ? buf : unparse(b);
    }

    // **`v4()` - Generate random UUID**

    // See https://github.com/broofa/node-uuid for API details
    function v4(options, buf, offset) {
        // Deprecated - 'format' argument, as supported in v1.2
        var i = buf && offset || 0;

        if (typeof(options) == 'string') {
            buf = options == 'binary' ? new BufferClass(16) : null;
            options = null;
        }
        options = options || {};

        var rnds = options.random || (options.rng || _rng)();

        // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
        rnds[6] = (rnds[6] & 0x0f) | 0x40;
        rnds[8] = (rnds[8] & 0x3f) | 0x80;

        // Copy bytes to buffer, if provided
        if (buf) {
            for (var ii = 0; ii < 16; ii++) {
                buf[i + ii] = rnds[ii];
            }
        }

        return buf || unparse(rnds);
    }

    // Export public API
    var uuid = v4;
    uuid.v1 = v1;
    uuid.v4 = v4;
    uuid.parse = parse;
    uuid.unparse = unparse;
    uuid.BufferClass = BufferClass;

    /* Base */
    var Base = function() {
        // dummy
    };

    Base.extend = function(_instance, _static) { // subclass
        var extend = Base.prototype.extend;

        // build the prototype
        Base._prototyping = true;
        var proto = new this;
        extend.call(proto, _instance);
        proto.base = function() {
            // call this method from any other method to invoke that method's ancestor
        };
        delete Base._prototyping;

        // create the wrapper for the constructor function
        //var constructor = proto.constructor.valueOf(); //-dean
        var constructor = proto.constructor;
        var klass = proto.constructor = function() {
            if (!Base._prototyping) {
                if (this._constructing || this.constructor == klass) { // instantiation
                    this._constructing = true;
                    constructor.apply(this, arguments);
                    delete this._constructing;
                } else if (arguments[0] != null) { // casting
                    return (arguments[0].extend || extend).call(arguments[0], proto);
                }
            }
        };

        // build the class interface
        klass.ancestor = this;
        klass.extend = this.extend;
        klass.forEach = this.forEach;
        klass.implement = this.implement;
        klass.prototype = proto;
        klass.toString = this.toString;
        klass.valueOf = function(type) {
            //return (type == "object") ? klass : constructor; //-dean
            return (type == "object") ? klass : constructor.valueOf();
        };
        extend.call(klass, _static);
        // class initialisation
        if (typeof klass.init == "function") klass.init();
        return klass;
    };

    Base.prototype = {
        extend: function(source, value) {
            if (arguments.length > 1) { // extending with a name/value pair
                var ancestor = this[source];
                if (ancestor && (typeof value == "function") && // overriding a method?
                        // the valueOf() comparison is to avoid circular references
                    (!ancestor.valueOf || ancestor.valueOf() != value.valueOf()) &&
                    /\bbase\b/.test(value)) {
                    // get the underlying method
                    var method = value.valueOf();
                    // override
                    value = function() {
                        var previous = this.base || Base.prototype.base;
                        this.base = ancestor;
                        var returnValue = method.apply(this, arguments);
                        this.base = previous;
                        return returnValue;
                    };
                    // point to the underlying method
                    value.valueOf = function(type) {
                        return (type == "object") ? value : method;
                    };
                    value.toString = Base.toString;
                }
                this[source] = value;
            } else if (source) { // extending with an object literal
                var extend = Base.prototype.extend;
                // if this object has a customised extend method then use it
                if (!Base._prototyping && typeof this != "function") {
                    extend = this.extend || extend;
                }
                var proto = {toSource: null};
                // do the "toString" and other methods manually
                var hidden = ["constructor", "toString", "valueOf"];
                // if we are prototyping then include the constructor
                var i = Base._prototyping ? 0 : 1;
                while (key = hidden[i++]) {
                    if (source[key] != proto[key]) {
                        extend.call(this, key, source[key]);

                    }
                }
                // copy each of the source object's properties to this object
                for (var key in source) {
                    if (!proto[key]) extend.call(this, key, source[key]);
                }
            }
            return this;
        }
    };

    // initialise
    Base = Base.extend({
        constructor: function() {
            this.extend(arguments[0]);
        }
    }, {
        ancestor: Object,
        version: "1.1",

        forEach: function(object, block, context) {
            for (var key in object) {
                if (this.prototype[key] === undefined) {
                    block.call(context, object[key], key, object);
                }
            }
        },

        implement: function() {
            for (var i = 0; i < arguments.length; i++) {
                if (typeof arguments[i] == "function") {
                    // if it's a function, call it
                    arguments[i](this.prototype);
                } else {
                    // add the interface using the extend method
                    this.prototype.extend(arguments[i]);
                }
            }
            return this;
        },

        toString: function() {
            return String(this.valueOf());
        }
    });

    /* Page */
    var Page = Base.extend({
        constructor: function(options) {

            this.title = options.title || '';
            if (options.backButton != undefined && typeof options.backButton != 'function') {
                throw new Error('backButton should be a function!');
            }
            this.backButton = options.backButton;

            this.pageId = 'page-' + uuid.v4().substr(0, 8);
            this.$el = $('#' + this.pageId);

            this.template = options.template; // underscore template
            this.model = options.model || {};

            this.transition = options.transition || 'slide';

            this.ready = options.ready;
        },

        _renderNavBar: function() {
            var self = this;

            var effectIn = 'fade-in-quick',
                effectOut = 'fade-out-quick',
                effectInterval = 200,

                barEffectIn = 'slide-in-up';

            var isStartPage = $('.ui-nav').size() == 0;
            // fade out title & btn
            // $('.ui-nav>.title, .ui-nav>.ui-btn').addClass(effectOut);

            // the new one
            _.delay(function() {
                $('.ui-nav>.ui-btn').empty().remove();

                // keep nav unique
                $('.ui-nav:lt(0)').empty().remove();

                if (isStartPage) {
                    $('body').prepend('<div class="ui-nav"><div class="title"></div></div>');
                }

                // got the nav
                var _nav = $('.ui-nav:eq(0)');

                // back button
                var backButtonId;
                if (typeof self.backButton == 'function') {
                    backButtonId = 'btn-back-' + uuid.v4().substr(0, 8);
                    _nav.prepend('<button id="' + backButtonId +'" class="ui-btn"><i class="ui-icon ui-icon-angle-left"></i> </button>');
                    _nav.find('.ui-btn').css('opacity', 0);
                }

                _nav.find('.title').html(self.title).css('opacity', 0);

                // render
                var defer = $.Deferred();

                if (isStartPage) {
                    console.log('Start Page!');
                    _nav.addClass(barEffectIn);
                    _.delay(function() {
                        defer.resolve();
                    }, effectInterval);
                } else {
                    defer.resolve();
                }

                defer.done(function() {
                    _nav
                        .find('.title, .ui-btn')
                        .addClass(effectIn)
                        .css('opacity', 1);

                    // back button click event handler
                    if (typeof self.backButton != 'function') return false;

                    $('#' + backButtonId).on('click', function(e) {
                        self.backButton(e);
                    });
                })

            }, effectInterval);
        },

        render: function(transition) {
            this._renderNavBar();
            this._renderPage(transition);
            return this;
        },

        _renderPage: function(transition) {

            /* todo: issue
            Replace slide effect with fade due to ios bug on css3 translate3d attr */

            //var effectIn = 'slide-in-right',
            //    effectOut = 'slide-out-left',
            //    effectInterval = 100;
            //if (transition == 'back') {
            //    effectIn = 'slide-in-left';
            //    effectOut = 'slide-out-right';
            //    effectInterval = 100;
            //}

            var effectIn = 'fade-in-quick',
                effectOut = 'fade-out-quick',
                effectInterval = 100;
            
            $('body>.ui-page').addClass(effectOut);

            var self = this;
            _.delay(function() {
                $('body>.ui-page').empty().remove();
                $('body').append('<div class="ui-page ' + effectIn + '" id="' + self.pageId + '">' +
                    _.template(self.template)(self.model) + '</div>');
                if (typeof self.ready == 'function') self.ready();
            }, effectInterval);
        },

        refresh: function() {
            $('#' + this.pageId).empty();
            this._renderPage();
            return this;
        }
    });

    /* Loading */
    function Loading() {
        this.id = '';
        this.duration = 1500;
        this.max = 3*60*1000;
    }

    Loading.prototype.cleanup = function() {
        $('body .ui-modal-loading, body .ui-modal-overlay')
            .empty().remove();
    };

    Loading.prototype.show = function(options) {
        var message, duration;

        if (typeof arguments[0] == 'string') {
            message = arguments[0];
            duration = arguments[1] == -1 ? this.max : this.duration;
        } else if (typeof arguments[0] == 'object') {
            message = options.message;
            if (options.duration == -1) {
                duration = this.max;
            } else {
                duration = options.duration || this.duration;
            }
        } else {
            throw new Error('Illegal Parameters');
        }

        var id = 'loading-' + uuid.v4().substr(0,8);

        var content = '<div id="' + id + '" class="ui-modal ui-modal-loading">' +
            '<div class="ui-modal-content">' +
            '<div class="preload-wrapper">' +
            '<div class="preload"></div>' +
            '</div><p>' + message + '</p></div>' +
            '</div>' +
            '<div class="ui-modal-overlay"></div>';

        // do clean up
        var self = this;
        self.cleanup();
        $('body').append(content);

        // do show
        var o = $('#' + id);
        o.addClass('ui-modal-show');
        _.delay(function() {
            o.removeClass('ui-modal-show');
            _.delay(function() {
                self.cleanup();
            }, 300);
        }, duration + 300);

        return this.id = id;
    };

    Loading.prototype.hide = function() {
        var self = this;
        $('#' + self.id).removeClass('ui-modal-show');
        _.delay(function() {
            self.cleanup();
        }, 300);

        return this.id = '';
    };

    var zuiLoading = new Loading();

    /* Engine */
    var HISTORY_SIZE = 10;

    var Engine = Base.extend({
        constructor: function(settings) {

        },

        _isReady: false,

        history: [],

        timers: [],

        init: function(options) {
            this.routes = options.routes;                   // Route Map => { routeName: routeFunction, ... }
            this.defaultRoute = options.defaultRoute;       // Default Route
            this._isReady = true;
            return this;
        },

        GET: (function() {
            var params = {};
            var query = location.href.split("?");
            if(query.length > 1) {
                var buf = query[1].split("&");
                for (var i = 0; i < buf.length; i++) {
                    var tmp = buf[i].split("=");
                    params[tmp[0]] = tmp[1];
                }
            }
            return params;
        })(),

        navigate: function() {
            if (!this._isReady) {
                throw new Error('Uninitialized Engine');
            }

            var routeName, routeParams, transition;
            /* 解析参数 */
            if (arguments.length >= 1 && typeof arguments[0] == 'string') {
                routeName = arguments[0];
                if (!this.routes[routeName]) {
                    throw new Error('Undefined Route');
                }

                if (arguments.length == 1) {
                    console.info('navigate(), 1 个参数, routeName only');
                    transition = 'forward';
                } else if (arguments.length == 2 && typeof arguments[1] == 'object') {
                    console.info('navigate(), 2 个参数, routeName & routeParams');
                    routeParams = arguments[1];
                } else if (arguments.length == 2 && typeof arguments[1] == 'string') {
                    console.info('navigate(), 2 个参数, routeName & transition');
                    transition = arguments[1];
                } else if (arguments.length == 2 && typeof arguments[1] == 'object' && typeof arguments[2] == 'string') {
                    console.info('navigate(), 3 个参数, routeName, routeParams & transition');
                    routeParams = arguments[1];
                    transition = arguments[2];
                } else {
                    console.info('Arguments =>', arguments);
                    throw new Error('Illegal Arguments');
                }
            } else {
                console.info('Arguments =>', arguments);
                throw new Error('Illegal Arguments');
            }

            this.clearTimers();
            if (transition != 'back') transition = 'forward'; // 修正transition的值
            this.routes[routeName].render(transition);

            /* 更新state history */
            var history = this.history;
            if (history.length > HISTORY_SIZE) {
                history.splice(0, 1);
            }
            history.push({
                route: routeName,
                params: routeParams || {}
            });
            console.info('Push State Ok');
            console.info('HISTORY =>', history);
            console.info('CURRENT STATE => ' + _.last(history).route, JSON.stringify(_.last(history).params));
        },

        start: function() {
            if (!this._isReady) {
                throw new Error('Uninitialized Engine');
            }
            this.navigate(this.defaultRoute, arguments[0] || {});
        },

        back: function() {
            if (!this._isReady) {
                throw new Error('Uninitialized Engine');
            }
            if (this.history.length >= 2) {
                this.clearTimers();
                this.history.pop();
                var state = _.last(this.history);
                this.navigate(state.route, state.params);
            }
        },

        getCurrentRoute: function() {
            if (!this._isReady) {
                throw new Error('Uninitialized Engine');
            }
            return _.last(this.history);
        },

        /* Timers */

        addTimer: function (key, tid) {
            var timers = this.timers;
            timers.push({
                key: key,
                tid: tid
            });
            console.info('Add Timer [' + key + '] Ok');
            console.info('TIMERS =>', timers);
        },

        deleteTimers: function (key) {
            var timers = this.timers;
            _.each(timers, function(timer, index) {
                if (timer.key == key) {
                    clearInterval(timer.tid);
                }
            });

            timers = _.filter(timers, function(timer) {
                return timer.key != key;
            });

            console.info('Delete Timer [' + key + '] Ok');
            console.info('TIMERS =>', timers);
        },

        clearTimers: function () {
            if (this.timers.length == 0) return false;
            _.each(this.timers, function(timer) {
                clearInterval(timer.tid);
            });
            this.timers = [];
            console.info('Clear Timers Ok');
            console.info('TIMERS =>', this.timers);
        },

        hasTimer: function (key) {
            return _.find(timers, function(timer) {
                return timer.key == key;
            });
        }
    });

    var zui = {
        Engine: function (options) {
            return new Engine(options);
        },
        Page: function(options) {
            return new Page(options);
        },

        showLoading: function(options) {
            return zuiLoading.show(options);
        },
        hideLoading: function() {
            zuiLoading.hide();
        },
        LOADING_ID: function() {
            return zuiLoading.id;
        }
    };

    _global.zui = zui;

})();
