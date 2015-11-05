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

    /* Global Settings */
    var SETTINGS = {};

    // pageTransition
    // pageTheme

    /* Page */
    var Page = Base.extend({
        constructor: function(options) {

            this.title = options.title || '';
            if (options.backButton != undefined && typeof options.backButton != 'function') {
                throw new Error('backButton should be a function!');
            }
            this.backButton = options.backButton;
            this.theme = options.theme || SETTINGS.pageTheme;

            this.pageId = 'page-' + uuid.v4().substr(0, 8);
            this.$el = $('#' + this.pageId);

            this.template = options.template; // underscore template or plain string.
            this.model = options.model || {};

            this.transition = options.transition || 'forward';

            if (options.init && typeof options.init == 'function') {
                this.init = options.init;
            }

            if (options.prepare && typeof options.prepare == 'function') {
                this.prepare = options.prepare;
            }

            if (options.ready && typeof options.ready == 'function')
                this.ready = options.ready;

            /* hide navbar */
            this.hideNavBar = !(options.hideNavBar == undefined);

            this.init();
        },

        init: function() {
            console.info('dummy function for page init');
        },

        prepare: false, // prepare model

        ready: function() {
            console.info('dummy function for page ready');
        },

        render: function(transition) {
            var self = this;
            var body = $('body');

            var effectIn = 'page-fade-in',
                effectOut = 'page-fade-out',
                effectInterval = 400;

            if (SETTINGS.pageTransition == 'default') {
                effectIn = 'page-fade-in';
                effectOut = 'page-fade-out';
            } else if (SETTINGS.pageTransition == 'ios') {
                if (transition == 'forward') {
                    effectIn = 'page-from-right-to-center';
                    effectOut = 'page-from-center-to-left';
                }

                if (transition == 'back') {
                    effectIn = 'page-from-left-to-center';
                    effectOut = 'page-from-center-to-right';
                }
            }

            // clear current page's effect class
            body.find('.ui-page')
                .removeClass('page-from-right-to-center')
                .removeClass('page-from-left-to-center');

            // setup navbar
            var navbar = '';
            if (!this.hideNavBar) { // 是否渲染navbar
                navbar = '<div class="ui-nav ' + (typeof this.theme == 'string' ? ('ui-nav-' + this.theme) : '') + '">';
                var backButtonId;
                if (typeof this.backButton == 'function') {
                    backButtonId = 'btn-back-' + uuid.v4().substr(0, 8);
                    navbar += '<button id="' + backButtonId +'" class="ui-btn"><i class="ui-icon ui-icon-angle-left"></i> </button>';
                }
                navbar += '<div class="title">' + this.title + '</div></div>';
            }

            // create dom
            if (this.prepare) {
                body.append(navbar + '<div class="ui-page" id="' + self.pageId + '"></div>');
            } else {
                var pageContent = typeof this.template == 'string' ? this.template : this.template(this.model);
                body.append(navbar + '<div class="ui-page" id="' + self.pageId + '">' +
                    pageContent + '</div>');
            }

            // backButton Click Event Handler
            if (typeof this.backButton == 'function') {
                $('#' + backButtonId).on('click', function(e) {
                    self.backButton(e);
                });
            }

            // Transition
            if ($('body>.ui-page').size() < 2) { // Dummy Page
                body.prepend('<div class="ui-page"></div>');
            }

            if (!this.hideNavBar && $('body>.ui-nav').size() < 2) { // Dummy Nav
                body.prepend('<div class="ui-nav ' + (typeof this.theme == 'string' ? ('ui-nav-' + this.theme) : '') + '"><div class="title"></div></div>');
            }

            var lastPage = $('body>.ui-page:eq(0)');
            var currentPage = $('body>.ui-page:eq(1)');
            var lastNav;
            var currentNav;

            if (!this.hideNavBar) {
                lastNav = $('body>.ui-nav:eq(0)');
                currentNav = $('body>.ui-nav:eq(1)');
            }


            lastPage.addClass(effectOut);
            currentPage.addClass(effectIn);

            if (!this.hideNavBar) {
                lastNav.find('.title, .ui-btn').addClass('page-fade-out');
                currentNav.find('.title, .ui-btn').addClass('page-fade-in');
            }

            _.delay(function() {
                lastPage.empty().remove();
                if (lastNav) {
                    lastNav.empty().remove();
                }

                if (self.prepare) {
                    self.prepare();
                } else {
                    // default, call ready()
                    self.ready();
                }

            }, effectInterval);

            return this;
        },

        // refresh page with new model
        refresh: function() {
            // cleanup
            var page = $('#' + this.pageId);

            // create dom
            var pageContent = typeof this.template == 'string' ? this.template : this.template(this.model);

            page
                .empty()
                .append(pageContent);

            // ready()
            this.ready();

            return this;
        }
    });

    /* View */
    var View = Base.extend({
        constructor: function(options) {
            this.el = options.el;
            this.$el = $(options.el);
            this.template = option.template; // underscore template
            this.model = options.model || {};

            if (options.ready && typeof options.ready == 'function')
                this.ready = options.ready;

            if (options.init && typeof options.init == 'function') {
                this.init = options.init;
            }

            this.init();
        },

        init: function() {
            console.info('dummy function for view init');
        },

        render: function() {
            this.$el.html(this.template(this.model));
            if (this.ready) this.ready();
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
        _.delay(function() {
            var o = $('#' + id);
            o.addClass('ui-modal-show');
            _.delay(function() {
                o.removeClass('ui-modal-show');
                _.delay(function() {
                    self.cleanup();
                }, 300);
            }, duration + 300);
        }, 50);

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

    /* Toast */

    function Toast() {
        this.id = '';
    }

    Toast.prototype.cleanup = function() {
        $('body .ui-modal-loading, body .ui-modal-overlay')
            .empty().remove();
    };

    Toast.prototype.show = function(message, duration) {
        message = message || '';
        duration = duration || 1500;

        var id = 'toast-' + uuid.v4().substr(0,8);

        var content = '<div id="' + id + '" class="ui-modal ui-modal-loading">' +
            '<div class="ui-modal-content">' +
            '<p>' + message + '</p>' +
            '</div></div>' +
            '<div class="ui-modal-overlay"></div>';

        // do clean up
        var self = this;
        self.cleanup();
        $('body').append(content);

        // do show
        _.delay(function() {
            var o = $('#' + id);
            o.addClass('ui-modal-show');

            _.delay(function() {
                o.removeClass('ui-modal-show');
                _.delay(function() {
                    self.cleanup();
                }, 300);
            }, duration + 300);

        }, 50);

    };

    var zuiToast = new Toast();

    /* Dialog */

    function Dialog() {
        this.id = '';
    }

    Dialog.prototype.cleanup = function() {
        $('body .ui-modal-dialog, body .ui-modal-overlay')
            .empty().remove();
    };

    Dialog.prototype.alert = function(options) {
        var message, title = '提示', btnOkTheme = 'assertive', btnOkText = '确定';

        var id = 'alert-' + uuid.v4().substr(0,8);
        var btnOkId = 'btn-ok-' + uuid.v4().substr(0, 8);

        var callback = function(e) {
            $('#' + id).removeClass('ui-modal-show');
            _.delay(function() {
                self.cleanup();
            }, 300);
        };

        if (typeof arguments[0] == 'string') {
            message = arguments[0] || '';
        } else if (typeof arguments[0] == 'object') {
            message = options.message || '';
            if (options.title) title = options.title;
            if (options.btnOkTheme != 'assertive') btnOkTheme = 'positive';
            if (options.btnOkText) btnOkText = options.btnOkText;
        } else {
            throw new Error('Illegal Parameters');
        }

        var content = '<div id="' + id + '" class="ui-modal ui-modal-dialog">' +
            '<div class="ui-modal-content">' +
            '<h2>' + title + '</h2>' +
            '<p>' + message +'</p>' +
            '<button id="' + btnOkId + '" class="ui-btn ui-btn-block ui-btn-' + btnOkTheme + '">' + btnOkText + '</button>' +
            '</div></div>' +
            '<div class="ui-modal-overlay"></div>';

        // do clean up
        var self = this;
        self.cleanup();

        // append to document body
        $('body').append(content);

        // do show
        _.delay(function() {
            var o = $('#' + id);
            o.addClass('ui-modal-show');
        }, 50);

        // btnOk click event
        $('#' + btnOkId).on('click', callback);

        return this.id = id;
    };

    Dialog.prototype.confirm = function(options) {
        var message, title = '提示',
            btnOkTheme = 'assertive',
            btnOkText = '确定',
            btnCancelText = '取消';

        var id = 'alert-' + uuid.v4().substr(0,8);
        var btnOkId = 'btn-ok-' + uuid.v4().substr(0, 8);
        var btnCancelId = 'btn-cancel-' + uuid.v4().substr(0, 8);

        var defer = $.Deferred();

        if (typeof arguments[0] == 'string') {
            message = arguments[0] || '';
        } else if (typeof arguments[0] == 'object') {
            message = options.message || '';
            if (options.title) title = options.title;
            if (options.btnOkTheme != 'assertive') btnOkTheme = 'positive';
            if (options.btnOkText) btnOkText = options.btnOkText;
            if (options.btnCancelText) btnCancelText = options.btnCancelText;
        } else {
            throw new Error('Illegal Parameters');
        }

        var content = '<div id="' + id + '" class="ui-modal ui-modal-dialog">' +
            '<div class="ui-modal-content">' +
            '<h2>' + title + '</h2>' +
            '<p>' + message +'</p>' +
            '<div class="ui-flex">' +
            '<div class="ui-width-1-2" style="padding-right: 5px;">' +
                '<button id="' + btnOkId + '" class="ui-btn ui-btn-block ui-btn-' + btnOkTheme + '">' + btnOkText + '</button>' +
            '</div>' +
            '<div class="ui-width-1-2" style="padding-left: 5px;">' +
                '<button id="' + btnCancelId + '" class="ui-btn ui-btn-block">' + btnCancelText + '</button>' +
            '</div>' +
            '</div></div></div>' +
            '<div class="ui-modal-overlay"></div>';

        // do clean up
        var self = this;
        self.cleanup();

        // append to document body
        $('body').append(content);

        // do show
        _.delay(function() {
            var o = $('#' + id);
            o.addClass('ui-modal-show');
        }, 50);

        // btnOk & btnCancel click event

        function callback(result) {
            $('#' + id).removeClass('ui-modal-show');
            _.delay(function() {
                self.cleanup();
                defer.resolve(result);
            }, 300);
        }

        $('#' + btnOkId).on('click', function() {
            callback(true);
        });

        $('#' + btnCancelId).on('click', function() {
            callback(false);
        });

        return defer.promise();
    };

    var zuiDialog = new Dialog();
    
    
    /* Storage */
    
    function Stub() {
        var ms = {};

        function getItem (key) {
            return key in ms ? ms[key] : null;
        }

        function setItem (key, value) {
            ms[key] = value;
            return true;
        }

        function removeItem (key) {
            var found = key in ms;
            if (found) {
                return delete ms[key];
            }
            return false;
        }

        function clear () {
            ms = {};
            return true;
        }

        return {
            getItem: getItem,
            setItem: setItem,
            removeItem: removeItem,
            clear: clear
        };
    }
    
    function Tracking() {
        var listeners = {};
        var listening = false;

        function listen () {
            if (window.addEventListener) {
                window.addEventListener('storage', change, false);
            } else if (window.attachEvent) {
                window.attachEvent('onstorage', change);
            } else {
                window.onstorage = change;
            }
        }

        function change (e) {
            if (!e) {
                e = window.event;
            }
            var all = listeners[e.key];
            if (all) {
                all.forEach(fire);
            }

            function fire (listener) {
                listener(JSON.parse(e.newValue), JSON.parse(e.oldValue), e.url || e.uri);
            }
        }

        function on (key, fn) {
            if (listeners[key]) {
                listeners[key].push(fn);
            } else {
                listeners[key] = [fn];
            }
            if (listening === false) {
                listen();
            }
        }

        function off (key, fn) {
            var ns = listeners[key];
            if (ns.length > 1) {
                ns.splice(ns.indexOf(fn), 1);
            } else {
                listeners[key] = [];
            }
        }

        return {
            on: on,
            off: off
        };
    }

    function Storage() {

        var stub = Stub();
        var tracking = Tracking();

        var ls = 'localStorage' in window && window.localStorage ? window.localStorage : stub;

        function Accessor (key, value) {
            if (arguments.length === 1) {
                return get(key);
            }
            return set(key, value);
        }

        function get (key) {
            return JSON.parse(ls.getItem(key));
        }

        function set (key, value) {
            try {
                ls.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                return false;
            }
        }

        function remove (key) {
            return ls.removeItem(key);
        }

        function clear () {
            return ls.clear();
        }

        Accessor.set = set;
        Accessor.get = get;
        Accessor.remove = remove;
        Accessor.clear = clear;
        Accessor.on = tracking.on;
        Accessor.off = tracking.off;

        return Accessor;
    }

    var zuiStorage = Storage();

    /* Engine */
    var ROUTE_HISTORY_SIZE = 10;

    // State 状态服务
    var STATE = {};

    var Engine = Base.extend({
        constructor: function(settings) {
            var DEFAULT_SETTINGS = {
                pageTransition: 'default',
                pageTheme: 'light'
            };
            if (arguments[0] && typeof arguments[0] == 'object') {
                SETTINGS = _.extend(DEFAULT_SETTINGS, settings);
            }
        },

        _isReady: false,

        history: [],

        timers: [],

        init: function(options) {

            /* todo: Not a good enough solution!!! */
            ///* ios9 mobile safari bug with scale3d & translate3d */
            if (SETTINGS.pageTransition == 'ios') {
                if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
                    document.querySelector('meta[name=viewport]').setAttribute(
                        'content',
                        'initial-scale=1.0001, minimum-scale=1.0001, maximum-scale=1.0001, user-scalable=no'
                    );
                }
            }

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
                } else if (arguments.length == 3 && typeof arguments[1] == 'object' && typeof arguments[2] == 'string') {
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

            // 更新 State
            STATE.route = routeName;
            STATE.params = routeParams || {};

            // render page
            this.routes[routeName].render(transition);

            /* 更新route history */
            var history = this.history;
            if (history.length > ROUTE_HISTORY_SIZE) {
                history.splice(0, 1);
            }
            history.push({
                route: routeName,
                params: routeParams || {}
            });
            console.info('Push Route Ok');
            console.info('HISTORY =>', history);
            console.info('CURRENT STATE => ' + _.last(history).route, JSON.stringify(_.last(history).params));

            return this.routes[routeName];
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
                this.navigate(state.route, state.params, 'back');
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

        Settings: function() {
            return SETTINGS;
        },

        // State APIs

        state: function() {
            return STATE.route;
        },

        stateParams: function() {
            return STATE.params;
        },

        getStateParam: function(key) {
            return STATE.params[key];
        },

        Engine: function (options) {
            return new Engine(options);
        },
        Page: function(options) {
            return new Page(options);
        },

        View: function(options) {
            return new View(options);
        },

        /* Local Storage */
        storage: zuiStorage,

        /* Loading */
        showLoading: function(options) {
            return zuiLoading.show(options);
        },
        hideLoading: function() {
            zuiLoading.hide();
        },
        LOADING_ID: function() {
            return zuiLoading.id;
        },

        /* Toast */
        toast: function(message, duration) {
            zuiToast.show(message, duration);
        },

        /* Dialog: alert & confirm */
        alert: function(options) {
            zuiDialog.alert(options);
        },

        confirm: function(options) {
            return zuiDialog.confirm(options);
        },

        DIALOG_ID: function() {
            return zuiDialog.id;
        }
    };

    _global.zui = zui;

})();
