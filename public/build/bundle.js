
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function (exports) {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    let SvelteElement;
    if (typeof HTMLElement === 'function') {
        SvelteElement = class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
            }
            connectedCallback() {
                // @ts-ignore todo: improve typings
                for (const key in this.$$.slotted) {
                    // @ts-ignore todo: improve typings
                    this.appendChild(this.$$.slotted[key]);
                }
            }
            attributeChangedCallback(attr, _oldValue, newValue) {
                this[attr] = newValue;
            }
            $destroy() {
                destroy_component(this, 1);
                this.$destroy = noop;
            }
            $on(type, callback) {
                // TODO should this delegate to addEventListener?
                const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
                callbacks.push(callback);
                return () => {
                    const index = callbacks.indexOf(callback);
                    if (index !== -1)
                        callbacks.splice(index, 1);
                };
            }
            $set() {
                // overridden by instance, if it has props
            }
        };
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var chroma = createCommonjsModule(function (module, exports) {
    /**
     * chroma.js - JavaScript library for color conversions
     *
     * Copyright (c) 2011-2019, Gregor Aisch
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     * 1. Redistributions of source code must retain the above copyright notice, this
     * list of conditions and the following disclaimer.
     *
     * 2. Redistributions in binary form must reproduce the above copyright notice,
     * this list of conditions and the following disclaimer in the documentation
     * and/or other materials provided with the distribution.
     *
     * 3. The name Gregor Aisch may not be used to endorse or promote products
     * derived from this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     * DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
     * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
     * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
     * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
     * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
     * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
     * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     *
     * -------------------------------------------------------
     *
     * chroma.js includes colors from colorbrewer2.org, which are released under
     * the following license:
     *
     * Copyright (c) 2002 Cynthia Brewer, Mark Harrower,
     * and The Pennsylvania State University.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing,
     * software distributed under the License is distributed on an
     * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
     * either express or implied. See the License for the specific
     * language governing permissions and limitations under the License.
     *
     * ------------------------------------------------------
     *
     * Named colors are taken from X11 Color Names.
     * http://www.w3.org/TR/css3-color/#svg-color
     *
     * @preserve
     */

    (function (global, factory) {
         module.exports = factory() ;
    }(commonjsGlobal, (function () {
        var limit = function (x, min, max) {
            if ( min === void 0 ) min=0;
            if ( max === void 0 ) max=1;

            return x < min ? min : x > max ? max : x;
        };

        var clip_rgb = function (rgb) {
            rgb._clipped = false;
            rgb._unclipped = rgb.slice(0);
            for (var i=0; i<=3; i++) {
                if (i < 3) {
                    if (rgb[i] < 0 || rgb[i] > 255) { rgb._clipped = true; }
                    rgb[i] = limit(rgb[i], 0, 255);
                } else if (i === 3) {
                    rgb[i] = limit(rgb[i], 0, 1);
                }
            }
            return rgb;
        };

        // ported from jQuery's $.type
        var classToType = {};
        for (var i = 0, list = ['Boolean', 'Number', 'String', 'Function', 'Array', 'Date', 'RegExp', 'Undefined', 'Null']; i < list.length; i += 1) {
            var name = list[i];

            classToType[("[object " + name + "]")] = name.toLowerCase();
        }
        var type = function(obj) {
            return classToType[Object.prototype.toString.call(obj)] || "object";
        };

        var unpack = function (args, keyOrder) {
            if ( keyOrder === void 0 ) keyOrder=null;

        	// if called with more than 3 arguments, we return the arguments
            if (args.length >= 3) { return Array.prototype.slice.call(args); }
            // with less than 3 args we check if first arg is object
            // and use the keyOrder string to extract and sort properties
        	if (type(args[0]) == 'object' && keyOrder) {
        		return keyOrder.split('')
        			.filter(function (k) { return args[0][k] !== undefined; })
        			.map(function (k) { return args[0][k]; });
        	}
        	// otherwise we just return the first argument
        	// (which we suppose is an array of args)
            return args[0];
        };

        var last = function (args) {
            if (args.length < 2) { return null; }
            var l = args.length-1;
            if (type(args[l]) == 'string') { return args[l].toLowerCase(); }
            return null;
        };

        var PI = Math.PI;

        var utils = {
        	clip_rgb: clip_rgb,
        	limit: limit,
        	type: type,
        	unpack: unpack,
        	last: last,
        	PI: PI,
        	TWOPI: PI*2,
        	PITHIRD: PI/3,
        	DEG2RAD: PI / 180,
        	RAD2DEG: 180 / PI
        };

        var input = {
        	format: {},
        	autodetect: []
        };

        var last$1 = utils.last;
        var clip_rgb$1 = utils.clip_rgb;
        var type$1 = utils.type;


        var Color = function Color() {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var me = this;
            if (type$1(args[0]) === 'object' &&
                args[0].constructor &&
                args[0].constructor === this.constructor) {
                // the argument is already a Color instance
                return args[0];
            }

            // last argument could be the mode
            var mode = last$1(args);
            var autodetect = false;

            if (!mode) {
                autodetect = true;
                if (!input.sorted) {
                    input.autodetect = input.autodetect.sort(function (a,b) { return b.p - a.p; });
                    input.sorted = true;
                }
                // auto-detect format
                for (var i = 0, list = input.autodetect; i < list.length; i += 1) {
                    var chk = list[i];

                    mode = chk.test.apply(chk, args);
                    if (mode) { break; }
                }
            }

            if (input.format[mode]) {
                var rgb = input.format[mode].apply(null, autodetect ? args : args.slice(0,-1));
                me._rgb = clip_rgb$1(rgb);
            } else {
                throw new Error('unknown format: '+args);
            }

            // add alpha channel
            if (me._rgb.length === 3) { me._rgb.push(1); }
        };

        Color.prototype.toString = function toString () {
            if (type$1(this.hex) == 'function') { return this.hex(); }
            return ("[" + (this._rgb.join(',')) + "]");
        };

        var Color_1 = Color;

        var chroma = function () {
        	var args = [], len = arguments.length;
        	while ( len-- ) args[ len ] = arguments[ len ];

        	return new (Function.prototype.bind.apply( chroma.Color, [ null ].concat( args) ));
        };

        chroma.Color = Color_1;
        chroma.version = '2.1.0';

        var chroma_1 = chroma;

        var unpack$1 = utils.unpack;
        var max = Math.max;

        var rgb2cmyk = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var ref = unpack$1(args, 'rgb');
            var r = ref[0];
            var g = ref[1];
            var b = ref[2];
            r = r / 255;
            g = g / 255;
            b = b / 255;
            var k = 1 - max(r,max(g,b));
            var f = k < 1 ? 1 / (1-k) : 0;
            var c = (1-r-k) * f;
            var m = (1-g-k) * f;
            var y = (1-b-k) * f;
            return [c,m,y,k];
        };

        var rgb2cmyk_1 = rgb2cmyk;

        var unpack$2 = utils.unpack;

        var cmyk2rgb = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            args = unpack$2(args, 'cmyk');
            var c = args[0];
            var m = args[1];
            var y = args[2];
            var k = args[3];
            var alpha = args.length > 4 ? args[4] : 1;
            if (k === 1) { return [0,0,0,alpha]; }
            return [
                c >= 1 ? 0 : 255 * (1-c) * (1-k), // r
                m >= 1 ? 0 : 255 * (1-m) * (1-k), // g
                y >= 1 ? 0 : 255 * (1-y) * (1-k), // b
                alpha
            ];
        };

        var cmyk2rgb_1 = cmyk2rgb;

        var unpack$3 = utils.unpack;
        var type$2 = utils.type;



        Color_1.prototype.cmyk = function() {
            return rgb2cmyk_1(this._rgb);
        };

        chroma_1.cmyk = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['cmyk']) ));
        };

        input.format.cmyk = cmyk2rgb_1;

        input.autodetect.push({
            p: 2,
            test: function () {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                args = unpack$3(args, 'cmyk');
                if (type$2(args) === 'array' && args.length === 4) {
                    return 'cmyk';
                }
            }
        });

        var unpack$4 = utils.unpack;
        var last$2 = utils.last;
        var rnd = function (a) { return Math.round(a*100)/100; };

        /*
         * supported arguments:
         * - hsl2css(h,s,l)
         * - hsl2css(h,s,l,a)
         * - hsl2css([h,s,l], mode)
         * - hsl2css([h,s,l,a], mode)
         * - hsl2css({h,s,l,a}, mode)
         */
        var hsl2css = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var hsla = unpack$4(args, 'hsla');
            var mode = last$2(args) || 'lsa';
            hsla[0] = rnd(hsla[0] || 0);
            hsla[1] = rnd(hsla[1]*100) + '%';
            hsla[2] = rnd(hsla[2]*100) + '%';
            if (mode === 'hsla' || (hsla.length > 3 && hsla[3]<1)) {
                hsla[3] = hsla.length > 3 ? hsla[3] : 1;
                mode = 'hsla';
            } else {
                hsla.length = 3;
            }
            return (mode + "(" + (hsla.join(',')) + ")");
        };

        var hsl2css_1 = hsl2css;

        var unpack$5 = utils.unpack;

        /*
         * supported arguments:
         * - rgb2hsl(r,g,b)
         * - rgb2hsl(r,g,b,a)
         * - rgb2hsl([r,g,b])
         * - rgb2hsl([r,g,b,a])
         * - rgb2hsl({r,g,b,a})
         */
        var rgb2hsl = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            args = unpack$5(args, 'rgba');
            var r = args[0];
            var g = args[1];
            var b = args[2];

            r /= 255;
            g /= 255;
            b /= 255;

            var min = Math.min(r, g, b);
            var max = Math.max(r, g, b);

            var l = (max + min) / 2;
            var s, h;

            if (max === min){
                s = 0;
                h = Number.NaN;
            } else {
                s = l < 0.5 ? (max - min) / (max + min) : (max - min) / (2 - max - min);
            }

            if (r == max) { h = (g - b) / (max - min); }
            else if (g == max) { h = 2 + (b - r) / (max - min); }
            else if (b == max) { h = 4 + (r - g) / (max - min); }

            h *= 60;
            if (h < 0) { h += 360; }
            if (args.length>3 && args[3]!==undefined) { return [h,s,l,args[3]]; }
            return [h,s,l];
        };

        var rgb2hsl_1 = rgb2hsl;

        var unpack$6 = utils.unpack;
        var last$3 = utils.last;


        var round = Math.round;

        /*
         * supported arguments:
         * - rgb2css(r,g,b)
         * - rgb2css(r,g,b,a)
         * - rgb2css([r,g,b], mode)
         * - rgb2css([r,g,b,a], mode)
         * - rgb2css({r,g,b,a}, mode)
         */
        var rgb2css = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var rgba = unpack$6(args, 'rgba');
            var mode = last$3(args) || 'rgb';
            if (mode.substr(0,3) == 'hsl') {
                return hsl2css_1(rgb2hsl_1(rgba), mode);
            }
            rgba[0] = round(rgba[0]);
            rgba[1] = round(rgba[1]);
            rgba[2] = round(rgba[2]);
            if (mode === 'rgba' || (rgba.length > 3 && rgba[3]<1)) {
                rgba[3] = rgba.length > 3 ? rgba[3] : 1;
                mode = 'rgba';
            }
            return (mode + "(" + (rgba.slice(0,mode==='rgb'?3:4).join(',')) + ")");
        };

        var rgb2css_1 = rgb2css;

        var unpack$7 = utils.unpack;
        var round$1 = Math.round;

        var hsl2rgb = function () {
            var assign;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            args = unpack$7(args, 'hsl');
            var h = args[0];
            var s = args[1];
            var l = args[2];
            var r,g,b;
            if (s === 0) {
                r = g = b = l*255;
            } else {
                var t3 = [0,0,0];
                var c = [0,0,0];
                var t2 = l < 0.5 ? l * (1+s) : l+s-l*s;
                var t1 = 2 * l - t2;
                var h_ = h / 360;
                t3[0] = h_ + 1/3;
                t3[1] = h_;
                t3[2] = h_ - 1/3;
                for (var i=0; i<3; i++) {
                    if (t3[i] < 0) { t3[i] += 1; }
                    if (t3[i] > 1) { t3[i] -= 1; }
                    if (6 * t3[i] < 1)
                        { c[i] = t1 + (t2 - t1) * 6 * t3[i]; }
                    else if (2 * t3[i] < 1)
                        { c[i] = t2; }
                    else if (3 * t3[i] < 2)
                        { c[i] = t1 + (t2 - t1) * ((2 / 3) - t3[i]) * 6; }
                    else
                        { c[i] = t1; }
                }
                (assign = [round$1(c[0]*255),round$1(c[1]*255),round$1(c[2]*255)], r = assign[0], g = assign[1], b = assign[2]);
            }
            if (args.length > 3) {
                // keep alpha channel
                return [r,g,b,args[3]];
            }
            return [r,g,b,1];
        };

        var hsl2rgb_1 = hsl2rgb;

        var RE_RGB = /^rgb\(\s*(-?\d+),\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/;
        var RE_RGBA = /^rgba\(\s*(-?\d+),\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*([01]|[01]?\.\d+)\)$/;
        var RE_RGB_PCT = /^rgb\(\s*(-?\d+(?:\.\d+)?)%,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*\)$/;
        var RE_RGBA_PCT = /^rgba\(\s*(-?\d+(?:\.\d+)?)%,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/;
        var RE_HSL = /^hsl\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*\)$/;
        var RE_HSLA = /^hsla\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/;

        var round$2 = Math.round;

        var css2rgb = function (css) {
            css = css.toLowerCase().trim();
            var m;

            if (input.format.named) {
                try {
                    return input.format.named(css);
                } catch (e) {
                    // eslint-disable-next-line
                }
            }

            // rgb(250,20,0)
            if ((m = css.match(RE_RGB))) {
                var rgb = m.slice(1,4);
                for (var i=0; i<3; i++) {
                    rgb[i] = +rgb[i];
                }
                rgb[3] = 1;  // default alpha
                return rgb;
            }

            // rgba(250,20,0,0.4)
            if ((m = css.match(RE_RGBA))) {
                var rgb$1 = m.slice(1,5);
                for (var i$1=0; i$1<4; i$1++) {
                    rgb$1[i$1] = +rgb$1[i$1];
                }
                return rgb$1;
            }

            // rgb(100%,0%,0%)
            if ((m = css.match(RE_RGB_PCT))) {
                var rgb$2 = m.slice(1,4);
                for (var i$2=0; i$2<3; i$2++) {
                    rgb$2[i$2] = round$2(rgb$2[i$2] * 2.55);
                }
                rgb$2[3] = 1;  // default alpha
                return rgb$2;
            }

            // rgba(100%,0%,0%,0.4)
            if ((m = css.match(RE_RGBA_PCT))) {
                var rgb$3 = m.slice(1,5);
                for (var i$3=0; i$3<3; i$3++) {
                    rgb$3[i$3] = round$2(rgb$3[i$3] * 2.55);
                }
                rgb$3[3] = +rgb$3[3];
                return rgb$3;
            }

            // hsl(0,100%,50%)
            if ((m = css.match(RE_HSL))) {
                var hsl = m.slice(1,4);
                hsl[1] *= 0.01;
                hsl[2] *= 0.01;
                var rgb$4 = hsl2rgb_1(hsl);
                rgb$4[3] = 1;
                return rgb$4;
            }

            // hsla(0,100%,50%,0.5)
            if ((m = css.match(RE_HSLA))) {
                var hsl$1 = m.slice(1,4);
                hsl$1[1] *= 0.01;
                hsl$1[2] *= 0.01;
                var rgb$5 = hsl2rgb_1(hsl$1);
                rgb$5[3] = +m[4];  // default alpha = 1
                return rgb$5;
            }
        };

        css2rgb.test = function (s) {
            return RE_RGB.test(s) ||
                RE_RGBA.test(s) ||
                RE_RGB_PCT.test(s) ||
                RE_RGBA_PCT.test(s) ||
                RE_HSL.test(s) ||
                RE_HSLA.test(s);
        };

        var css2rgb_1 = css2rgb;

        var type$3 = utils.type;




        Color_1.prototype.css = function(mode) {
            return rgb2css_1(this._rgb, mode);
        };

        chroma_1.css = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['css']) ));
        };

        input.format.css = css2rgb_1;

        input.autodetect.push({
            p: 5,
            test: function (h) {
                var rest = [], len = arguments.length - 1;
                while ( len-- > 0 ) rest[ len ] = arguments[ len + 1 ];

                if (!rest.length && type$3(h) === 'string' && css2rgb_1.test(h)) {
                    return 'css';
                }
            }
        });

        var unpack$8 = utils.unpack;

        input.format.gl = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var rgb = unpack$8(args, 'rgba');
            rgb[0] *= 255;
            rgb[1] *= 255;
            rgb[2] *= 255;
            return rgb;
        };

        chroma_1.gl = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['gl']) ));
        };

        Color_1.prototype.gl = function() {
            var rgb = this._rgb;
            return [rgb[0]/255, rgb[1]/255, rgb[2]/255, rgb[3]];
        };

        var unpack$9 = utils.unpack;

        var rgb2hcg = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var ref = unpack$9(args, 'rgb');
            var r = ref[0];
            var g = ref[1];
            var b = ref[2];
            var min = Math.min(r, g, b);
            var max = Math.max(r, g, b);
            var delta = max - min;
            var c = delta * 100 / 255;
            var _g = min / (255 - delta) * 100;
            var h;
            if (delta === 0) {
                h = Number.NaN;
            } else {
                if (r === max) { h = (g - b) / delta; }
                if (g === max) { h = 2+(b - r) / delta; }
                if (b === max) { h = 4+(r - g) / delta; }
                h *= 60;
                if (h < 0) { h += 360; }
            }
            return [h, c, _g];
        };

        var rgb2hcg_1 = rgb2hcg;

        var unpack$a = utils.unpack;
        var floor = Math.floor;

        /*
         * this is basically just HSV with some minor tweaks
         *
         * hue.. [0..360]
         * chroma .. [0..1]
         * grayness .. [0..1]
         */

        var hcg2rgb = function () {
            var assign, assign$1, assign$2, assign$3, assign$4, assign$5;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            args = unpack$a(args, 'hcg');
            var h = args[0];
            var c = args[1];
            var _g = args[2];
            var r,g,b;
            _g = _g * 255;
            var _c = c * 255;
            if (c === 0) {
                r = g = b = _g;
            } else {
                if (h === 360) { h = 0; }
                if (h > 360) { h -= 360; }
                if (h < 0) { h += 360; }
                h /= 60;
                var i = floor(h);
                var f = h - i;
                var p = _g * (1 - c);
                var q = p + _c * (1 - f);
                var t = p + _c * f;
                var v = p + _c;
                switch (i) {
                    case 0: (assign = [v, t, p], r = assign[0], g = assign[1], b = assign[2]); break
                    case 1: (assign$1 = [q, v, p], r = assign$1[0], g = assign$1[1], b = assign$1[2]); break
                    case 2: (assign$2 = [p, v, t], r = assign$2[0], g = assign$2[1], b = assign$2[2]); break
                    case 3: (assign$3 = [p, q, v], r = assign$3[0], g = assign$3[1], b = assign$3[2]); break
                    case 4: (assign$4 = [t, p, v], r = assign$4[0], g = assign$4[1], b = assign$4[2]); break
                    case 5: (assign$5 = [v, p, q], r = assign$5[0], g = assign$5[1], b = assign$5[2]); break
                }
            }
            return [r, g, b, args.length > 3 ? args[3] : 1];
        };

        var hcg2rgb_1 = hcg2rgb;

        var unpack$b = utils.unpack;
        var type$4 = utils.type;






        Color_1.prototype.hcg = function() {
            return rgb2hcg_1(this._rgb);
        };

        chroma_1.hcg = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['hcg']) ));
        };

        input.format.hcg = hcg2rgb_1;

        input.autodetect.push({
            p: 1,
            test: function () {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                args = unpack$b(args, 'hcg');
                if (type$4(args) === 'array' && args.length === 3) {
                    return 'hcg';
                }
            }
        });

        var unpack$c = utils.unpack;
        var last$4 = utils.last;
        var round$3 = Math.round;

        var rgb2hex = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var ref = unpack$c(args, 'rgba');
            var r = ref[0];
            var g = ref[1];
            var b = ref[2];
            var a = ref[3];
            var mode = last$4(args) || 'auto';
            if (a === undefined) { a = 1; }
            if (mode === 'auto') {
                mode = a < 1 ? 'rgba' : 'rgb';
            }
            r = round$3(r);
            g = round$3(g);
            b = round$3(b);
            var u = r << 16 | g << 8 | b;
            var str = "000000" + u.toString(16); //#.toUpperCase();
            str = str.substr(str.length - 6);
            var hxa = '0' + round$3(a * 255).toString(16);
            hxa = hxa.substr(hxa.length - 2);
            switch (mode.toLowerCase()) {
                case 'rgba': return ("#" + str + hxa);
                case 'argb': return ("#" + hxa + str);
                default: return ("#" + str);
            }
        };

        var rgb2hex_1 = rgb2hex;

        var RE_HEX = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        var RE_HEXA = /^#?([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/;

        var hex2rgb = function (hex) {
            if (hex.match(RE_HEX)) {
                // remove optional leading #
                if (hex.length === 4 || hex.length === 7) {
                    hex = hex.substr(1);
                }
                // expand short-notation to full six-digit
                if (hex.length === 3) {
                    hex = hex.split('');
                    hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
                }
                var u = parseInt(hex, 16);
                var r = u >> 16;
                var g = u >> 8 & 0xFF;
                var b = u & 0xFF;
                return [r,g,b,1];
            }

            // match rgba hex format, eg #FF000077
            if (hex.match(RE_HEXA)) {
                if (hex.length === 5 || hex.length === 9) {
                    // remove optional leading #
                    hex = hex.substr(1);
                }
                // expand short-notation to full eight-digit
                if (hex.length === 4) {
                    hex = hex.split('');
                    hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
                }
                var u$1 = parseInt(hex, 16);
                var r$1 = u$1 >> 24 & 0xFF;
                var g$1 = u$1 >> 16 & 0xFF;
                var b$1 = u$1 >> 8 & 0xFF;
                var a = Math.round((u$1 & 0xFF) / 0xFF * 100) / 100;
                return [r$1,g$1,b$1,a];
            }

            // we used to check for css colors here
            // if _input.css? and rgb = _input.css hex
            //     return rgb

            throw new Error(("unknown hex color: " + hex));
        };

        var hex2rgb_1 = hex2rgb;

        var type$5 = utils.type;




        Color_1.prototype.hex = function(mode) {
            return rgb2hex_1(this._rgb, mode);
        };

        chroma_1.hex = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['hex']) ));
        };

        input.format.hex = hex2rgb_1;
        input.autodetect.push({
            p: 4,
            test: function (h) {
                var rest = [], len = arguments.length - 1;
                while ( len-- > 0 ) rest[ len ] = arguments[ len + 1 ];

                if (!rest.length && type$5(h) === 'string' && [3,4,5,6,7,8,9].indexOf(h.length) >= 0) {
                    return 'hex';
                }
            }
        });

        var unpack$d = utils.unpack;
        var TWOPI = utils.TWOPI;
        var min = Math.min;
        var sqrt = Math.sqrt;
        var acos = Math.acos;

        var rgb2hsi = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            /*
            borrowed from here:
            http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/rgb2hsi.cpp
            */
            var ref = unpack$d(args, 'rgb');
            var r = ref[0];
            var g = ref[1];
            var b = ref[2];
            r /= 255;
            g /= 255;
            b /= 255;
            var h;
            var min_ = min(r,g,b);
            var i = (r+g+b) / 3;
            var s = i > 0 ? 1 - min_/i : 0;
            if (s === 0) {
                h = NaN;
            } else {
                h = ((r-g)+(r-b)) / 2;
                h /= sqrt((r-g)*(r-g) + (r-b)*(g-b));
                h = acos(h);
                if (b > g) {
                    h = TWOPI - h;
                }
                h /= TWOPI;
            }
            return [h*360,s,i];
        };

        var rgb2hsi_1 = rgb2hsi;

        var unpack$e = utils.unpack;
        var limit$1 = utils.limit;
        var TWOPI$1 = utils.TWOPI;
        var PITHIRD = utils.PITHIRD;
        var cos = Math.cos;

        /*
         * hue [0..360]
         * saturation [0..1]
         * intensity [0..1]
         */
        var hsi2rgb = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            /*
            borrowed from here:
            http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/hsi2rgb.cpp
            */
            args = unpack$e(args, 'hsi');
            var h = args[0];
            var s = args[1];
            var i = args[2];
            var r,g,b;

            if (isNaN(h)) { h = 0; }
            if (isNaN(s)) { s = 0; }
            // normalize hue
            if (h > 360) { h -= 360; }
            if (h < 0) { h += 360; }
            h /= 360;
            if (h < 1/3) {
                b = (1-s)/3;
                r = (1+s*cos(TWOPI$1*h)/cos(PITHIRD-TWOPI$1*h))/3;
                g = 1 - (b+r);
            } else if (h < 2/3) {
                h -= 1/3;
                r = (1-s)/3;
                g = (1+s*cos(TWOPI$1*h)/cos(PITHIRD-TWOPI$1*h))/3;
                b = 1 - (r+g);
            } else {
                h -= 2/3;
                g = (1-s)/3;
                b = (1+s*cos(TWOPI$1*h)/cos(PITHIRD-TWOPI$1*h))/3;
                r = 1 - (g+b);
            }
            r = limit$1(i*r*3);
            g = limit$1(i*g*3);
            b = limit$1(i*b*3);
            return [r*255, g*255, b*255, args.length > 3 ? args[3] : 1];
        };

        var hsi2rgb_1 = hsi2rgb;

        var unpack$f = utils.unpack;
        var type$6 = utils.type;






        Color_1.prototype.hsi = function() {
            return rgb2hsi_1(this._rgb);
        };

        chroma_1.hsi = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['hsi']) ));
        };

        input.format.hsi = hsi2rgb_1;

        input.autodetect.push({
            p: 2,
            test: function () {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                args = unpack$f(args, 'hsi');
                if (type$6(args) === 'array' && args.length === 3) {
                    return 'hsi';
                }
            }
        });

        var unpack$g = utils.unpack;
        var type$7 = utils.type;






        Color_1.prototype.hsl = function() {
            return rgb2hsl_1(this._rgb);
        };

        chroma_1.hsl = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['hsl']) ));
        };

        input.format.hsl = hsl2rgb_1;

        input.autodetect.push({
            p: 2,
            test: function () {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                args = unpack$g(args, 'hsl');
                if (type$7(args) === 'array' && args.length === 3) {
                    return 'hsl';
                }
            }
        });

        var unpack$h = utils.unpack;
        var min$1 = Math.min;
        var max$1 = Math.max;

        /*
         * supported arguments:
         * - rgb2hsv(r,g,b)
         * - rgb2hsv([r,g,b])
         * - rgb2hsv({r,g,b})
         */
        var rgb2hsl$1 = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            args = unpack$h(args, 'rgb');
            var r = args[0];
            var g = args[1];
            var b = args[2];
            var min_ = min$1(r, g, b);
            var max_ = max$1(r, g, b);
            var delta = max_ - min_;
            var h,s,v;
            v = max_ / 255.0;
            if (max_ === 0) {
                h = Number.NaN;
                s = 0;
            } else {
                s = delta / max_;
                if (r === max_) { h = (g - b) / delta; }
                if (g === max_) { h = 2+(b - r) / delta; }
                if (b === max_) { h = 4+(r - g) / delta; }
                h *= 60;
                if (h < 0) { h += 360; }
            }
            return [h, s, v]
        };

        var rgb2hsv = rgb2hsl$1;

        var unpack$i = utils.unpack;
        var floor$1 = Math.floor;

        var hsv2rgb = function () {
            var assign, assign$1, assign$2, assign$3, assign$4, assign$5;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            args = unpack$i(args, 'hsv');
            var h = args[0];
            var s = args[1];
            var v = args[2];
            var r,g,b;
            v *= 255;
            if (s === 0) {
                r = g = b = v;
            } else {
                if (h === 360) { h = 0; }
                if (h > 360) { h -= 360; }
                if (h < 0) { h += 360; }
                h /= 60;

                var i = floor$1(h);
                var f = h - i;
                var p = v * (1 - s);
                var q = v * (1 - s * f);
                var t = v * (1 - s * (1 - f));

                switch (i) {
                    case 0: (assign = [v, t, p], r = assign[0], g = assign[1], b = assign[2]); break
                    case 1: (assign$1 = [q, v, p], r = assign$1[0], g = assign$1[1], b = assign$1[2]); break
                    case 2: (assign$2 = [p, v, t], r = assign$2[0], g = assign$2[1], b = assign$2[2]); break
                    case 3: (assign$3 = [p, q, v], r = assign$3[0], g = assign$3[1], b = assign$3[2]); break
                    case 4: (assign$4 = [t, p, v], r = assign$4[0], g = assign$4[1], b = assign$4[2]); break
                    case 5: (assign$5 = [v, p, q], r = assign$5[0], g = assign$5[1], b = assign$5[2]); break
                }
            }
            return [r,g,b,args.length > 3?args[3]:1];
        };

        var hsv2rgb_1 = hsv2rgb;

        var unpack$j = utils.unpack;
        var type$8 = utils.type;






        Color_1.prototype.hsv = function() {
            return rgb2hsv(this._rgb);
        };

        chroma_1.hsv = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['hsv']) ));
        };

        input.format.hsv = hsv2rgb_1;

        input.autodetect.push({
            p: 2,
            test: function () {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                args = unpack$j(args, 'hsv');
                if (type$8(args) === 'array' && args.length === 3) {
                    return 'hsv';
                }
            }
        });

        var labConstants = {
            // Corresponds roughly to RGB brighter/darker
            Kn: 18,

            // D65 standard referent
            Xn: 0.950470,
            Yn: 1,
            Zn: 1.088830,

            t0: 0.137931034,  // 4 / 29
            t1: 0.206896552,  // 6 / 29
            t2: 0.12841855,   // 3 * t1 * t1
            t3: 0.008856452,  // t1 * t1 * t1
        };

        var unpack$k = utils.unpack;
        var pow = Math.pow;

        var rgb2lab = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var ref = unpack$k(args, 'rgb');
            var r = ref[0];
            var g = ref[1];
            var b = ref[2];
            var ref$1 = rgb2xyz(r,g,b);
            var x = ref$1[0];
            var y = ref$1[1];
            var z = ref$1[2];
            var l = 116 * y - 16;
            return [l < 0 ? 0 : l, 500 * (x - y), 200 * (y - z)];
        };

        var rgb_xyz = function (r) {
            if ((r /= 255) <= 0.04045) { return r / 12.92; }
            return pow((r + 0.055) / 1.055, 2.4);
        };

        var xyz_lab = function (t) {
            if (t > labConstants.t3) { return pow(t, 1 / 3); }
            return t / labConstants.t2 + labConstants.t0;
        };

        var rgb2xyz = function (r,g,b) {
            r = rgb_xyz(r);
            g = rgb_xyz(g);
            b = rgb_xyz(b);
            var x = xyz_lab((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / labConstants.Xn);
            var y = xyz_lab((0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / labConstants.Yn);
            var z = xyz_lab((0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / labConstants.Zn);
            return [x,y,z];
        };

        var rgb2lab_1 = rgb2lab;

        var unpack$l = utils.unpack;
        var pow$1 = Math.pow;

        /*
         * L* [0..100]
         * a [-100..100]
         * b [-100..100]
         */
        var lab2rgb = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            args = unpack$l(args, 'lab');
            var l = args[0];
            var a = args[1];
            var b = args[2];
            var x,y,z, r,g,b_;

            y = (l + 16) / 116;
            x = isNaN(a) ? y : y + a / 500;
            z = isNaN(b) ? y : y - b / 200;

            y = labConstants.Yn * lab_xyz(y);
            x = labConstants.Xn * lab_xyz(x);
            z = labConstants.Zn * lab_xyz(z);

            r = xyz_rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z);  // D65 -> sRGB
            g = xyz_rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z);
            b_ = xyz_rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);

            return [r,g,b_,args.length > 3 ? args[3] : 1];
        };

        var xyz_rgb = function (r) {
            return 255 * (r <= 0.00304 ? 12.92 * r : 1.055 * pow$1(r, 1 / 2.4) - 0.055)
        };

        var lab_xyz = function (t) {
            return t > labConstants.t1 ? t * t * t : labConstants.t2 * (t - labConstants.t0)
        };

        var lab2rgb_1 = lab2rgb;

        var unpack$m = utils.unpack;
        var type$9 = utils.type;






        Color_1.prototype.lab = function() {
            return rgb2lab_1(this._rgb);
        };

        chroma_1.lab = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['lab']) ));
        };

        input.format.lab = lab2rgb_1;

        input.autodetect.push({
            p: 2,
            test: function () {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                args = unpack$m(args, 'lab');
                if (type$9(args) === 'array' && args.length === 3) {
                    return 'lab';
                }
            }
        });

        var unpack$n = utils.unpack;
        var RAD2DEG = utils.RAD2DEG;
        var sqrt$1 = Math.sqrt;
        var atan2 = Math.atan2;
        var round$4 = Math.round;

        var lab2lch = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var ref = unpack$n(args, 'lab');
            var l = ref[0];
            var a = ref[1];
            var b = ref[2];
            var c = sqrt$1(a * a + b * b);
            var h = (atan2(b, a) * RAD2DEG + 360) % 360;
            if (round$4(c*10000) === 0) { h = Number.NaN; }
            return [l, c, h];
        };

        var lab2lch_1 = lab2lch;

        var unpack$o = utils.unpack;



        var rgb2lch = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var ref = unpack$o(args, 'rgb');
            var r = ref[0];
            var g = ref[1];
            var b = ref[2];
            var ref$1 = rgb2lab_1(r,g,b);
            var l = ref$1[0];
            var a = ref$1[1];
            var b_ = ref$1[2];
            return lab2lch_1(l,a,b_);
        };

        var rgb2lch_1 = rgb2lch;

        var unpack$p = utils.unpack;
        var DEG2RAD = utils.DEG2RAD;
        var sin = Math.sin;
        var cos$1 = Math.cos;

        var lch2lab = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            /*
            Convert from a qualitative parameter h and a quantitative parameter l to a 24-bit pixel.
            These formulas were invented by David Dalrymple to obtain maximum contrast without going
            out of gamut if the parameters are in the range 0-1.

            A saturation multiplier was added by Gregor Aisch
            */
            var ref = unpack$p(args, 'lch');
            var l = ref[0];
            var c = ref[1];
            var h = ref[2];
            if (isNaN(h)) { h = 0; }
            h = h * DEG2RAD;
            return [l, cos$1(h) * c, sin(h) * c]
        };

        var lch2lab_1 = lch2lab;

        var unpack$q = utils.unpack;



        var lch2rgb = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            args = unpack$q(args, 'lch');
            var l = args[0];
            var c = args[1];
            var h = args[2];
            var ref = lch2lab_1 (l,c,h);
            var L = ref[0];
            var a = ref[1];
            var b_ = ref[2];
            var ref$1 = lab2rgb_1 (L,a,b_);
            var r = ref$1[0];
            var g = ref$1[1];
            var b = ref$1[2];
            return [r, g, b, args.length > 3 ? args[3] : 1];
        };

        var lch2rgb_1 = lch2rgb;

        var unpack$r = utils.unpack;


        var hcl2rgb = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var hcl = unpack$r(args, 'hcl').reverse();
            return lch2rgb_1.apply(void 0, hcl);
        };

        var hcl2rgb_1 = hcl2rgb;

        var unpack$s = utils.unpack;
        var type$a = utils.type;






        Color_1.prototype.lch = function() { return rgb2lch_1(this._rgb); };
        Color_1.prototype.hcl = function() { return rgb2lch_1(this._rgb).reverse(); };

        chroma_1.lch = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['lch']) ));
        };
        chroma_1.hcl = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['hcl']) ));
        };

        input.format.lch = lch2rgb_1;
        input.format.hcl = hcl2rgb_1;

        ['lch','hcl'].forEach(function (m) { return input.autodetect.push({
            p: 2,
            test: function () {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                args = unpack$s(args, m);
                if (type$a(args) === 'array' && args.length === 3) {
                    return m;
                }
            }
        }); });

        /**
        	X11 color names

        	http://www.w3.org/TR/css3-color/#svg-color
        */

        var w3cx11 = {
            aliceblue: '#f0f8ff',
            antiquewhite: '#faebd7',
            aqua: '#00ffff',
            aquamarine: '#7fffd4',
            azure: '#f0ffff',
            beige: '#f5f5dc',
            bisque: '#ffe4c4',
            black: '#000000',
            blanchedalmond: '#ffebcd',
            blue: '#0000ff',
            blueviolet: '#8a2be2',
            brown: '#a52a2a',
            burlywood: '#deb887',
            cadetblue: '#5f9ea0',
            chartreuse: '#7fff00',
            chocolate: '#d2691e',
            coral: '#ff7f50',
            cornflower: '#6495ed',
            cornflowerblue: '#6495ed',
            cornsilk: '#fff8dc',
            crimson: '#dc143c',
            cyan: '#00ffff',
            darkblue: '#00008b',
            darkcyan: '#008b8b',
            darkgoldenrod: '#b8860b',
            darkgray: '#a9a9a9',
            darkgreen: '#006400',
            darkgrey: '#a9a9a9',
            darkkhaki: '#bdb76b',
            darkmagenta: '#8b008b',
            darkolivegreen: '#556b2f',
            darkorange: '#ff8c00',
            darkorchid: '#9932cc',
            darkred: '#8b0000',
            darksalmon: '#e9967a',
            darkseagreen: '#8fbc8f',
            darkslateblue: '#483d8b',
            darkslategray: '#2f4f4f',
            darkslategrey: '#2f4f4f',
            darkturquoise: '#00ced1',
            darkviolet: '#9400d3',
            deeppink: '#ff1493',
            deepskyblue: '#00bfff',
            dimgray: '#696969',
            dimgrey: '#696969',
            dodgerblue: '#1e90ff',
            firebrick: '#b22222',
            floralwhite: '#fffaf0',
            forestgreen: '#228b22',
            fuchsia: '#ff00ff',
            gainsboro: '#dcdcdc',
            ghostwhite: '#f8f8ff',
            gold: '#ffd700',
            goldenrod: '#daa520',
            gray: '#808080',
            green: '#008000',
            greenyellow: '#adff2f',
            grey: '#808080',
            honeydew: '#f0fff0',
            hotpink: '#ff69b4',
            indianred: '#cd5c5c',
            indigo: '#4b0082',
            ivory: '#fffff0',
            khaki: '#f0e68c',
            laserlemon: '#ffff54',
            lavender: '#e6e6fa',
            lavenderblush: '#fff0f5',
            lawngreen: '#7cfc00',
            lemonchiffon: '#fffacd',
            lightblue: '#add8e6',
            lightcoral: '#f08080',
            lightcyan: '#e0ffff',
            lightgoldenrod: '#fafad2',
            lightgoldenrodyellow: '#fafad2',
            lightgray: '#d3d3d3',
            lightgreen: '#90ee90',
            lightgrey: '#d3d3d3',
            lightpink: '#ffb6c1',
            lightsalmon: '#ffa07a',
            lightseagreen: '#20b2aa',
            lightskyblue: '#87cefa',
            lightslategray: '#778899',
            lightslategrey: '#778899',
            lightsteelblue: '#b0c4de',
            lightyellow: '#ffffe0',
            lime: '#00ff00',
            limegreen: '#32cd32',
            linen: '#faf0e6',
            magenta: '#ff00ff',
            maroon: '#800000',
            maroon2: '#7f0000',
            maroon3: '#b03060',
            mediumaquamarine: '#66cdaa',
            mediumblue: '#0000cd',
            mediumorchid: '#ba55d3',
            mediumpurple: '#9370db',
            mediumseagreen: '#3cb371',
            mediumslateblue: '#7b68ee',
            mediumspringgreen: '#00fa9a',
            mediumturquoise: '#48d1cc',
            mediumvioletred: '#c71585',
            midnightblue: '#191970',
            mintcream: '#f5fffa',
            mistyrose: '#ffe4e1',
            moccasin: '#ffe4b5',
            navajowhite: '#ffdead',
            navy: '#000080',
            oldlace: '#fdf5e6',
            olive: '#808000',
            olivedrab: '#6b8e23',
            orange: '#ffa500',
            orangered: '#ff4500',
            orchid: '#da70d6',
            palegoldenrod: '#eee8aa',
            palegreen: '#98fb98',
            paleturquoise: '#afeeee',
            palevioletred: '#db7093',
            papayawhip: '#ffefd5',
            peachpuff: '#ffdab9',
            peru: '#cd853f',
            pink: '#ffc0cb',
            plum: '#dda0dd',
            powderblue: '#b0e0e6',
            purple: '#800080',
            purple2: '#7f007f',
            purple3: '#a020f0',
            rebeccapurple: '#663399',
            red: '#ff0000',
            rosybrown: '#bc8f8f',
            royalblue: '#4169e1',
            saddlebrown: '#8b4513',
            salmon: '#fa8072',
            sandybrown: '#f4a460',
            seagreen: '#2e8b57',
            seashell: '#fff5ee',
            sienna: '#a0522d',
            silver: '#c0c0c0',
            skyblue: '#87ceeb',
            slateblue: '#6a5acd',
            slategray: '#708090',
            slategrey: '#708090',
            snow: '#fffafa',
            springgreen: '#00ff7f',
            steelblue: '#4682b4',
            tan: '#d2b48c',
            teal: '#008080',
            thistle: '#d8bfd8',
            tomato: '#ff6347',
            turquoise: '#40e0d0',
            violet: '#ee82ee',
            wheat: '#f5deb3',
            white: '#ffffff',
            whitesmoke: '#f5f5f5',
            yellow: '#ffff00',
            yellowgreen: '#9acd32'
        };

        var w3cx11_1 = w3cx11;

        var type$b = utils.type;





        Color_1.prototype.name = function() {
            var hex = rgb2hex_1(this._rgb, 'rgb');
            for (var i = 0, list = Object.keys(w3cx11_1); i < list.length; i += 1) {
                var n = list[i];

                if (w3cx11_1[n] === hex) { return n.toLowerCase(); }
            }
            return hex;
        };

        input.format.named = function (name) {
            name = name.toLowerCase();
            if (w3cx11_1[name]) { return hex2rgb_1(w3cx11_1[name]); }
            throw new Error('unknown color name: '+name);
        };

        input.autodetect.push({
            p: 5,
            test: function (h) {
                var rest = [], len = arguments.length - 1;
                while ( len-- > 0 ) rest[ len ] = arguments[ len + 1 ];

                if (!rest.length && type$b(h) === 'string' && w3cx11_1[h.toLowerCase()]) {
                    return 'named';
                }
            }
        });

        var unpack$t = utils.unpack;

        var rgb2num = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var ref = unpack$t(args, 'rgb');
            var r = ref[0];
            var g = ref[1];
            var b = ref[2];
            return (r << 16) + (g << 8) + b;
        };

        var rgb2num_1 = rgb2num;

        var type$c = utils.type;

        var num2rgb = function (num) {
            if (type$c(num) == "number" && num >= 0 && num <= 0xFFFFFF) {
                var r = num >> 16;
                var g = (num >> 8) & 0xFF;
                var b = num & 0xFF;
                return [r,g,b,1];
            }
            throw new Error("unknown num color: "+num);
        };

        var num2rgb_1 = num2rgb;

        var type$d = utils.type;



        Color_1.prototype.num = function() {
            return rgb2num_1(this._rgb);
        };

        chroma_1.num = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['num']) ));
        };

        input.format.num = num2rgb_1;

        input.autodetect.push({
            p: 5,
            test: function () {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                if (args.length === 1 && type$d(args[0]) === 'number' && args[0] >= 0 && args[0] <= 0xFFFFFF) {
                    return 'num';
                }
            }
        });

        var unpack$u = utils.unpack;
        var type$e = utils.type;
        var round$5 = Math.round;

        Color_1.prototype.rgb = function(rnd) {
            if ( rnd === void 0 ) rnd=true;

            if (rnd === false) { return this._rgb.slice(0,3); }
            return this._rgb.slice(0,3).map(round$5);
        };

        Color_1.prototype.rgba = function(rnd) {
            if ( rnd === void 0 ) rnd=true;

            return this._rgb.slice(0,4).map(function (v,i) {
                return i<3 ? (rnd === false ? v : round$5(v)) : v;
            });
        };

        chroma_1.rgb = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['rgb']) ));
        };

        input.format.rgb = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var rgba = unpack$u(args, 'rgba');
            if (rgba[3] === undefined) { rgba[3] = 1; }
            return rgba;
        };

        input.autodetect.push({
            p: 3,
            test: function () {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                args = unpack$u(args, 'rgba');
                if (type$e(args) === 'array' && (args.length === 3 ||
                    args.length === 4 && type$e(args[3]) == 'number' && args[3] >= 0 && args[3] <= 1)) {
                    return 'rgb';
                }
            }
        });

        /*
         * Based on implementation by Neil Bartlett
         * https://github.com/neilbartlett/color-temperature
         */

        var log = Math.log;

        var temperature2rgb = function (kelvin) {
            var temp = kelvin / 100;
            var r,g,b;
            if (temp < 66) {
                r = 255;
                g = -155.25485562709179 - 0.44596950469579133 * (g = temp-2) + 104.49216199393888 * log(g);
                b = temp < 20 ? 0 : -254.76935184120902 + 0.8274096064007395 * (b = temp-10) + 115.67994401066147 * log(b);
            } else {
                r = 351.97690566805693 + 0.114206453784165 * (r = temp-55) - 40.25366309332127 * log(r);
                g = 325.4494125711974 + 0.07943456536662342 * (g = temp-50) - 28.0852963507957 * log(g);
                b = 255;
            }
            return [r,g,b,1];
        };

        var temperature2rgb_1 = temperature2rgb;

        /*
         * Based on implementation by Neil Bartlett
         * https://github.com/neilbartlett/color-temperature
         **/


        var unpack$v = utils.unpack;
        var round$6 = Math.round;

        var rgb2temperature = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var rgb = unpack$v(args, 'rgb');
            var r = rgb[0], b = rgb[2];
            var minTemp = 1000;
            var maxTemp = 40000;
            var eps = 0.4;
            var temp;
            while (maxTemp - minTemp > eps) {
                temp = (maxTemp + minTemp) * 0.5;
                var rgb$1 = temperature2rgb_1(temp);
                if ((rgb$1[2] / rgb$1[0]) >= (b / r)) {
                    maxTemp = temp;
                } else {
                    minTemp = temp;
                }
            }
            return round$6(temp);
        };

        var rgb2temperature_1 = rgb2temperature;

        Color_1.prototype.temp =
        Color_1.prototype.kelvin =
        Color_1.prototype.temperature = function() {
            return rgb2temperature_1(this._rgb);
        };

        chroma_1.temp =
        chroma_1.kelvin =
        chroma_1.temperature = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            return new (Function.prototype.bind.apply( Color_1, [ null ].concat( args, ['temp']) ));
        };

        input.format.temp =
        input.format.kelvin =
        input.format.temperature = temperature2rgb_1;

        var type$f = utils.type;

        Color_1.prototype.alpha = function(a, mutate) {
            if ( mutate === void 0 ) mutate=false;

            if (a !== undefined && type$f(a) === 'number') {
                if (mutate) {
                    this._rgb[3] = a;
                    return this;
                }
                return new Color_1([this._rgb[0], this._rgb[1], this._rgb[2], a], 'rgb');
            }
            return this._rgb[3];
        };

        Color_1.prototype.clipped = function() {
            return this._rgb._clipped || false;
        };

        Color_1.prototype.darken = function(amount) {
        	if ( amount === void 0 ) amount=1;

        	var me = this;
        	var lab = me.lab();
        	lab[0] -= labConstants.Kn * amount;
        	return new Color_1(lab, 'lab').alpha(me.alpha(), true);
        };

        Color_1.prototype.brighten = function(amount) {
        	if ( amount === void 0 ) amount=1;

        	return this.darken(-amount);
        };

        Color_1.prototype.darker = Color_1.prototype.darken;
        Color_1.prototype.brighter = Color_1.prototype.brighten;

        Color_1.prototype.get = function(mc) {
            var ref = mc.split('.');
            var mode = ref[0];
            var channel = ref[1];
            var src = this[mode]();
            if (channel) {
                var i = mode.indexOf(channel);
                if (i > -1) { return src[i]; }
                throw new Error(("unknown channel " + channel + " in mode " + mode));
            } else {
                return src;
            }
        };

        var type$g = utils.type;
        var pow$2 = Math.pow;

        var EPS = 1e-7;
        var MAX_ITER = 20;

        Color_1.prototype.luminance = function(lum) {
            if (lum !== undefined && type$g(lum) === 'number') {
                if (lum === 0) {
                    // return pure black
                    return new Color_1([0,0,0,this._rgb[3]], 'rgb');
                }
                if (lum === 1) {
                    // return pure white
                    return new Color_1([255,255,255,this._rgb[3]], 'rgb');
                }
                // compute new color using...
                var cur_lum = this.luminance();
                var mode = 'rgb';
                var max_iter = MAX_ITER;

                var test = function (low, high) {
                    var mid = low.interpolate(high, 0.5, mode);
                    var lm = mid.luminance();
                    if (Math.abs(lum - lm) < EPS || !max_iter--) {
                        // close enough
                        return mid;
                    }
                    return lm > lum ? test(low, mid) : test(mid, high);
                };

                var rgb = (cur_lum > lum ? test(new Color_1([0,0,0]), this) : test(this, new Color_1([255,255,255]))).rgb();
                return new Color_1(rgb.concat( [this._rgb[3]]));
            }
            return rgb2luminance.apply(void 0, (this._rgb).slice(0,3));
        };


        var rgb2luminance = function (r,g,b) {
            // relative luminance
            // see http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
            r = luminance_x(r);
            g = luminance_x(g);
            b = luminance_x(b);
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        var luminance_x = function (x) {
            x /= 255;
            return x <= 0.03928 ? x/12.92 : pow$2((x+0.055)/1.055, 2.4);
        };

        var interpolator = {};

        var type$h = utils.type;


        var mix = function (col1, col2, f) {
            if ( f === void 0 ) f=0.5;
            var rest = [], len = arguments.length - 3;
            while ( len-- > 0 ) rest[ len ] = arguments[ len + 3 ];

            var mode = rest[0] || 'lrgb';
            if (!interpolator[mode] && !rest.length) {
                // fall back to the first supported mode
                mode = Object.keys(interpolator)[0];
            }
            if (!interpolator[mode]) {
                throw new Error(("interpolation mode " + mode + " is not defined"));
            }
            if (type$h(col1) !== 'object') { col1 = new Color_1(col1); }
            if (type$h(col2) !== 'object') { col2 = new Color_1(col2); }
            return interpolator[mode](col1, col2, f)
                .alpha(col1.alpha() + f * (col2.alpha() - col1.alpha()));
        };

        Color_1.prototype.mix =
        Color_1.prototype.interpolate = function(col2, f) {
        	if ( f === void 0 ) f=0.5;
        	var rest = [], len = arguments.length - 2;
        	while ( len-- > 0 ) rest[ len ] = arguments[ len + 2 ];

        	return mix.apply(void 0, [ this, col2, f ].concat( rest ));
        };

        Color_1.prototype.premultiply = function(mutate) {
        	if ( mutate === void 0 ) mutate=false;

        	var rgb = this._rgb;
        	var a = rgb[3];
        	if (mutate) {
        		this._rgb = [rgb[0]*a, rgb[1]*a, rgb[2]*a, a];
        		return this;
        	} else {
        		return new Color_1([rgb[0]*a, rgb[1]*a, rgb[2]*a, a], 'rgb');
        	}
        };

        Color_1.prototype.saturate = function(amount) {
        	if ( amount === void 0 ) amount=1;

        	var me = this;
        	var lch = me.lch();
        	lch[1] += labConstants.Kn * amount;
        	if (lch[1] < 0) { lch[1] = 0; }
        	return new Color_1(lch, 'lch').alpha(me.alpha(), true);
        };

        Color_1.prototype.desaturate = function(amount) {
        	if ( amount === void 0 ) amount=1;

        	return this.saturate(-amount);
        };

        var type$i = utils.type;

        Color_1.prototype.set = function(mc, value, mutate) {
            if ( mutate === void 0 ) mutate=false;

            var ref = mc.split('.');
            var mode = ref[0];
            var channel = ref[1];
            var src = this[mode]();
            if (channel) {
                var i = mode.indexOf(channel);
                if (i > -1) {
                    if (type$i(value) == 'string') {
                        switch(value.charAt(0)) {
                            case '+': src[i] += +value; break;
                            case '-': src[i] += +value; break;
                            case '*': src[i] *= +(value.substr(1)); break;
                            case '/': src[i] /= +(value.substr(1)); break;
                            default: src[i] = +value;
                        }
                    } else if (type$i(value) === 'number') {
                        src[i] = value;
                    } else {
                        throw new Error("unsupported value for Color.set");
                    }
                    var out = new Color_1(src, mode);
                    if (mutate) {
                        this._rgb = out._rgb;
                        return this;
                    }
                    return out;
                }
                throw new Error(("unknown channel " + channel + " in mode " + mode));
            } else {
                return src;
            }
        };

        var rgb$1 = function (col1, col2, f) {
            var xyz0 = col1._rgb;
            var xyz1 = col2._rgb;
            return new Color_1(
                xyz0[0] + f * (xyz1[0]-xyz0[0]),
                xyz0[1] + f * (xyz1[1]-xyz0[1]),
                xyz0[2] + f * (xyz1[2]-xyz0[2]),
                'rgb'
            )
        };

        // register interpolator
        interpolator.rgb = rgb$1;

        var sqrt$2 = Math.sqrt;
        var pow$3 = Math.pow;

        var lrgb = function (col1, col2, f) {
            var ref = col1._rgb;
            var x1 = ref[0];
            var y1 = ref[1];
            var z1 = ref[2];
            var ref$1 = col2._rgb;
            var x2 = ref$1[0];
            var y2 = ref$1[1];
            var z2 = ref$1[2];
            return new Color_1(
                sqrt$2(pow$3(x1,2) * (1-f) + pow$3(x2,2) * f),
                sqrt$2(pow$3(y1,2) * (1-f) + pow$3(y2,2) * f),
                sqrt$2(pow$3(z1,2) * (1-f) + pow$3(z2,2) * f),
                'rgb'
            )
        };

        // register interpolator
        interpolator.lrgb = lrgb;

        var lab$1 = function (col1, col2, f) {
            var xyz0 = col1.lab();
            var xyz1 = col2.lab();
            return new Color_1(
                xyz0[0] + f * (xyz1[0]-xyz0[0]),
                xyz0[1] + f * (xyz1[1]-xyz0[1]),
                xyz0[2] + f * (xyz1[2]-xyz0[2]),
                'lab'
            )
        };

        // register interpolator
        interpolator.lab = lab$1;

        var _hsx = function (col1, col2, f, m) {
            var assign, assign$1;

            var xyz0, xyz1;
            if (m === 'hsl') {
                xyz0 = col1.hsl();
                xyz1 = col2.hsl();
            } else if (m === 'hsv') {
                xyz0 = col1.hsv();
                xyz1 = col2.hsv();
            } else if (m === 'hcg') {
                xyz0 = col1.hcg();
                xyz1 = col2.hcg();
            } else if (m === 'hsi') {
                xyz0 = col1.hsi();
                xyz1 = col2.hsi();
            } else if (m === 'lch' || m === 'hcl') {
                m = 'hcl';
                xyz0 = col1.hcl();
                xyz1 = col2.hcl();
            }

            var hue0, hue1, sat0, sat1, lbv0, lbv1;
            if (m.substr(0, 1) === 'h') {
                (assign = xyz0, hue0 = assign[0], sat0 = assign[1], lbv0 = assign[2]);
                (assign$1 = xyz1, hue1 = assign$1[0], sat1 = assign$1[1], lbv1 = assign$1[2]);
            }

            var sat, hue, lbv, dh;

            if (!isNaN(hue0) && !isNaN(hue1)) {
                // both colors have hue
                if (hue1 > hue0 && hue1 - hue0 > 180) {
                    dh = hue1-(hue0+360);
                } else if (hue1 < hue0 && hue0 - hue1 > 180) {
                    dh = hue1+360-hue0;
                } else{
                    dh = hue1 - hue0;
                }
                hue = hue0 + f * dh;
            } else if (!isNaN(hue0)) {
                hue = hue0;
                if ((lbv1 == 1 || lbv1 == 0) && m != 'hsv') { sat = sat0; }
            } else if (!isNaN(hue1)) {
                hue = hue1;
                if ((lbv0 == 1 || lbv0 == 0) && m != 'hsv') { sat = sat1; }
            } else {
                hue = Number.NaN;
            }

            if (sat === undefined) { sat = sat0 + f * (sat1 - sat0); }
            lbv = lbv0 + f * (lbv1-lbv0);
            return new Color_1([hue, sat, lbv], m);
        };

        var lch$1 = function (col1, col2, f) {
        	return _hsx(col1, col2, f, 'lch');
        };

        // register interpolator
        interpolator.lch = lch$1;
        interpolator.hcl = lch$1;

        var num$1 = function (col1, col2, f) {
            var c1 = col1.num();
            var c2 = col2.num();
            return new Color_1(c1 + f * (c2-c1), 'num')
        };

        // register interpolator
        interpolator.num = num$1;

        var hcg$1 = function (col1, col2, f) {
        	return _hsx(col1, col2, f, 'hcg');
        };

        // register interpolator
        interpolator.hcg = hcg$1;

        var hsi$1 = function (col1, col2, f) {
        	return _hsx(col1, col2, f, 'hsi');
        };

        // register interpolator
        interpolator.hsi = hsi$1;

        var hsl$1 = function (col1, col2, f) {
        	return _hsx(col1, col2, f, 'hsl');
        };

        // register interpolator
        interpolator.hsl = hsl$1;

        var hsv$1 = function (col1, col2, f) {
        	return _hsx(col1, col2, f, 'hsv');
        };

        // register interpolator
        interpolator.hsv = hsv$1;

        var clip_rgb$2 = utils.clip_rgb;
        var pow$4 = Math.pow;
        var sqrt$3 = Math.sqrt;
        var PI$1 = Math.PI;
        var cos$2 = Math.cos;
        var sin$1 = Math.sin;
        var atan2$1 = Math.atan2;

        var average = function (colors, mode, weights) {
            if ( mode === void 0 ) mode='lrgb';
            if ( weights === void 0 ) weights=null;

            var l = colors.length;
            if (!weights) { weights = Array.from(new Array(l)).map(function () { return 1; }); }
            // normalize weights
            var k = l / weights.reduce(function(a, b) { return a + b; });
            weights.forEach(function (w,i) { weights[i] *= k; });
            // convert colors to Color objects
            colors = colors.map(function (c) { return new Color_1(c); });
            if (mode === 'lrgb') {
                return _average_lrgb(colors, weights)
            }
            var first = colors.shift();
            var xyz = first.get(mode);
            var cnt = [];
            var dx = 0;
            var dy = 0;
            // initial color
            for (var i=0; i<xyz.length; i++) {
                xyz[i] = (xyz[i] || 0) * weights[0];
                cnt.push(isNaN(xyz[i]) ? 0 : weights[0]);
                if (mode.charAt(i) === 'h' && !isNaN(xyz[i])) {
                    var A = xyz[i] / 180 * PI$1;
                    dx += cos$2(A) * weights[0];
                    dy += sin$1(A) * weights[0];
                }
            }

            var alpha = first.alpha() * weights[0];
            colors.forEach(function (c,ci) {
                var xyz2 = c.get(mode);
                alpha += c.alpha() * weights[ci+1];
                for (var i=0; i<xyz.length; i++) {
                    if (!isNaN(xyz2[i])) {
                        cnt[i] += weights[ci+1];
                        if (mode.charAt(i) === 'h') {
                            var A = xyz2[i] / 180 * PI$1;
                            dx += cos$2(A) * weights[ci+1];
                            dy += sin$1(A) * weights[ci+1];
                        } else {
                            xyz[i] += xyz2[i] * weights[ci+1];
                        }
                    }
                }
            });

            for (var i$1=0; i$1<xyz.length; i$1++) {
                if (mode.charAt(i$1) === 'h') {
                    var A$1 = atan2$1(dy / cnt[i$1], dx / cnt[i$1]) / PI$1 * 180;
                    while (A$1 < 0) { A$1 += 360; }
                    while (A$1 >= 360) { A$1 -= 360; }
                    xyz[i$1] = A$1;
                } else {
                    xyz[i$1] = xyz[i$1]/cnt[i$1];
                }
            }
            alpha /= l;
            return (new Color_1(xyz, mode)).alpha(alpha > 0.99999 ? 1 : alpha, true);
        };


        var _average_lrgb = function (colors, weights) {
            var l = colors.length;
            var xyz = [0,0,0,0];
            for (var i=0; i < colors.length; i++) {
                var col = colors[i];
                var f = weights[i] / l;
                var rgb = col._rgb;
                xyz[0] += pow$4(rgb[0],2) * f;
                xyz[1] += pow$4(rgb[1],2) * f;
                xyz[2] += pow$4(rgb[2],2) * f;
                xyz[3] += rgb[3] * f;
            }
            xyz[0] = sqrt$3(xyz[0]);
            xyz[1] = sqrt$3(xyz[1]);
            xyz[2] = sqrt$3(xyz[2]);
            if (xyz[3] > 0.9999999) { xyz[3] = 1; }
            return new Color_1(clip_rgb$2(xyz));
        };

        // minimal multi-purpose interface

        // @requires utils color analyze


        var type$j = utils.type;

        var pow$5 = Math.pow;

        var scale = function(colors) {

            // constructor
            var _mode = 'rgb';
            var _nacol = chroma_1('#ccc');
            var _spread = 0;
            // const _fixed = false;
            var _domain = [0, 1];
            var _pos = [];
            var _padding = [0,0];
            var _classes = false;
            var _colors = [];
            var _out = false;
            var _min = 0;
            var _max = 1;
            var _correctLightness = false;
            var _colorCache = {};
            var _useCache = true;
            var _gamma = 1;

            // private methods

            var setColors = function(colors) {
                colors = colors || ['#fff', '#000'];
                if (colors && type$j(colors) === 'string' && chroma_1.brewer &&
                    chroma_1.brewer[colors.toLowerCase()]) {
                    colors = chroma_1.brewer[colors.toLowerCase()];
                }
                if (type$j(colors) === 'array') {
                    // handle single color
                    if (colors.length === 1) {
                        colors = [colors[0], colors[0]];
                    }
                    // make a copy of the colors
                    colors = colors.slice(0);
                    // convert to chroma classes
                    for (var c=0; c<colors.length; c++) {
                        colors[c] = chroma_1(colors[c]);
                    }
                    // auto-fill color position
                    _pos.length = 0;
                    for (var c$1=0; c$1<colors.length; c$1++) {
                        _pos.push(c$1/(colors.length-1));
                    }
                }
                resetCache();
                return _colors = colors;
            };

            var getClass = function(value) {
                if (_classes != null) {
                    var n = _classes.length-1;
                    var i = 0;
                    while (i < n && value >= _classes[i]) {
                        i++;
                    }
                    return i-1;
                }
                return 0;
            };

            var tMapLightness = function (t) { return t; };
            var tMapDomain = function (t) { return t; };

            // const classifyValue = function(value) {
            //     let val = value;
            //     if (_classes.length > 2) {
            //         const n = _classes.length-1;
            //         const i = getClass(value);
            //         const minc = _classes[0] + ((_classes[1]-_classes[0]) * (0 + (_spread * 0.5)));  // center of 1st class
            //         const maxc = _classes[n-1] + ((_classes[n]-_classes[n-1]) * (1 - (_spread * 0.5)));  // center of last class
            //         val = _min + ((((_classes[i] + ((_classes[i+1] - _classes[i]) * 0.5)) - minc) / (maxc-minc)) * (_max - _min));
            //     }
            //     return val;
            // };

            var getColor = function(val, bypassMap) {
                var col, t;
                if (bypassMap == null) { bypassMap = false; }
                if (isNaN(val) || (val === null)) { return _nacol; }
                if (!bypassMap) {
                    if (_classes && (_classes.length > 2)) {
                        // find the class
                        var c = getClass(val);
                        t = c / (_classes.length-2);
                    } else if (_max !== _min) {
                        // just interpolate between min/max
                        t = (val - _min) / (_max - _min);
                    } else {
                        t = 1;
                    }
                } else {
                    t = val;
                }

                // domain map
                t = tMapDomain(t);

                if (!bypassMap) {
                    t = tMapLightness(t);  // lightness correction
                }

                if (_gamma !== 1) { t = pow$5(t, _gamma); }

                t = _padding[0] + (t * (1 - _padding[0] - _padding[1]));

                t = Math.min(1, Math.max(0, t));

                var k = Math.floor(t * 10000);

                if (_useCache && _colorCache[k]) {
                    col = _colorCache[k];
                } else {
                    if (type$j(_colors) === 'array') {
                        //for i in [0.._pos.length-1]
                        for (var i=0; i<_pos.length; i++) {
                            var p = _pos[i];
                            if (t <= p) {
                                col = _colors[i];
                                break;
                            }
                            if ((t >= p) && (i === (_pos.length-1))) {
                                col = _colors[i];
                                break;
                            }
                            if (t > p && t < _pos[i+1]) {
                                t = (t-p)/(_pos[i+1]-p);
                                col = chroma_1.interpolate(_colors[i], _colors[i+1], t, _mode);
                                break;
                            }
                        }
                    } else if (type$j(_colors) === 'function') {
                        col = _colors(t);
                    }
                    if (_useCache) { _colorCache[k] = col; }
                }
                return col;
            };

            var resetCache = function () { return _colorCache = {}; };

            setColors(colors);

            // public interface

            var f = function(v) {
                var c = chroma_1(getColor(v));
                if (_out && c[_out]) { return c[_out](); } else { return c; }
            };

            f.classes = function(classes) {
                if (classes != null) {
                    if (type$j(classes) === 'array') {
                        _classes = classes;
                        _domain = [classes[0], classes[classes.length-1]];
                    } else {
                        var d = chroma_1.analyze(_domain);
                        if (classes === 0) {
                            _classes = [d.min, d.max];
                        } else {
                            _classes = chroma_1.limits(d, 'e', classes);
                        }
                    }
                    return f;
                }
                return _classes;
            };


            f.domain = function(domain) {
                if (!arguments.length) {
                    return _domain;
                }
                _min = domain[0];
                _max = domain[domain.length-1];
                _pos = [];
                var k = _colors.length;
                if ((domain.length === k) && (_min !== _max)) {
                    // update positions
                    for (var i = 0, list = Array.from(domain); i < list.length; i += 1) {
                        var d = list[i];

                      _pos.push((d-_min) / (_max-_min));
                    }
                } else {
                    for (var c=0; c<k; c++) {
                        _pos.push(c/(k-1));
                    }
                    if (domain.length > 2) {
                        // set domain map
                        var tOut = domain.map(function (d,i) { return i/(domain.length-1); });
                        var tBreaks = domain.map(function (d) { return (d - _min) / (_max - _min); });
                        if (!tBreaks.every(function (val, i) { return tOut[i] === val; })) {
                            tMapDomain = function (t) {
                                if (t <= 0 || t >= 1) { return t; }
                                var i = 0;
                                while (t >= tBreaks[i+1]) { i++; }
                                var f = (t - tBreaks[i]) / (tBreaks[i+1] - tBreaks[i]);
                                var out = tOut[i] + f * (tOut[i+1] - tOut[i]);
                                return out;
                            };
                        }

                    }
                }
                _domain = [_min, _max];
                return f;
            };

            f.mode = function(_m) {
                if (!arguments.length) {
                    return _mode;
                }
                _mode = _m;
                resetCache();
                return f;
            };

            f.range = function(colors, _pos) {
                setColors(colors);
                return f;
            };

            f.out = function(_o) {
                _out = _o;
                return f;
            };

            f.spread = function(val) {
                if (!arguments.length) {
                    return _spread;
                }
                _spread = val;
                return f;
            };

            f.correctLightness = function(v) {
                if (v == null) { v = true; }
                _correctLightness = v;
                resetCache();
                if (_correctLightness) {
                    tMapLightness = function(t) {
                        var L0 = getColor(0, true).lab()[0];
                        var L1 = getColor(1, true).lab()[0];
                        var pol = L0 > L1;
                        var L_actual = getColor(t, true).lab()[0];
                        var L_ideal = L0 + ((L1 - L0) * t);
                        var L_diff = L_actual - L_ideal;
                        var t0 = 0;
                        var t1 = 1;
                        var max_iter = 20;
                        while ((Math.abs(L_diff) > 1e-2) && (max_iter-- > 0)) {
                            (function() {
                                if (pol) { L_diff *= -1; }
                                if (L_diff < 0) {
                                    t0 = t;
                                    t += (t1 - t) * 0.5;
                                } else {
                                    t1 = t;
                                    t += (t0 - t) * 0.5;
                                }
                                L_actual = getColor(t, true).lab()[0];
                                return L_diff = L_actual - L_ideal;
                            })();
                        }
                        return t;
                    };
                } else {
                    tMapLightness = function (t) { return t; };
                }
                return f;
            };

            f.padding = function(p) {
                if (p != null) {
                    if (type$j(p) === 'number') {
                        p = [p,p];
                    }
                    _padding = p;
                    return f;
                } else {
                    return _padding;
                }
            };

            f.colors = function(numColors, out) {
                // If no arguments are given, return the original colors that were provided
                if (arguments.length < 2) { out = 'hex'; }
                var result = [];

                if (arguments.length === 0) {
                    result = _colors.slice(0);

                } else if (numColors === 1) {
                    result = [f(0.5)];

                } else if (numColors > 1) {
                    var dm = _domain[0];
                    var dd = _domain[1] - dm;
                    result = __range__(0, numColors, false).map(function (i) { return f( dm + ((i/(numColors-1)) * dd) ); });

                } else { // returns all colors based on the defined classes
                    colors = [];
                    var samples = [];
                    if (_classes && (_classes.length > 2)) {
                        for (var i = 1, end = _classes.length, asc = 1 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
                            samples.push((_classes[i-1]+_classes[i])*0.5);
                        }
                    } else {
                        samples = _domain;
                    }
                    result = samples.map(function (v) { return f(v); });
                }

                if (chroma_1[out]) {
                    result = result.map(function (c) { return c[out](); });
                }
                return result;
            };

            f.cache = function(c) {
                if (c != null) {
                    _useCache = c;
                    return f;
                } else {
                    return _useCache;
                }
            };

            f.gamma = function(g) {
                if (g != null) {
                    _gamma = g;
                    return f;
                } else {
                    return _gamma;
                }
            };

            f.nodata = function(d) {
                if (d != null) {
                    _nacol = chroma_1(d);
                    return f;
                } else {
                    return _nacol;
                }
            };

            return f;
        };

        function __range__(left, right, inclusive) {
          var range = [];
          var ascending = left < right;
          var end = !inclusive ? right : ascending ? right + 1 : right - 1;
          for (var i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
            range.push(i);
          }
          return range;
        }

        //
        // interpolates between a set of colors uzing a bezier spline
        //

        // @requires utils lab




        var bezier = function(colors) {
            var assign, assign$1, assign$2;

            var I, lab0, lab1, lab2;
            colors = colors.map(function (c) { return new Color_1(c); });
            if (colors.length === 2) {
                // linear interpolation
                (assign = colors.map(function (c) { return c.lab(); }), lab0 = assign[0], lab1 = assign[1]);
                I = function(t) {
                    var lab = ([0, 1, 2].map(function (i) { return lab0[i] + (t * (lab1[i] - lab0[i])); }));
                    return new Color_1(lab, 'lab');
                };
            } else if (colors.length === 3) {
                // quadratic bezier interpolation
                (assign$1 = colors.map(function (c) { return c.lab(); }), lab0 = assign$1[0], lab1 = assign$1[1], lab2 = assign$1[2]);
                I = function(t) {
                    var lab = ([0, 1, 2].map(function (i) { return ((1-t)*(1-t) * lab0[i]) + (2 * (1-t) * t * lab1[i]) + (t * t * lab2[i]); }));
                    return new Color_1(lab, 'lab');
                };
            } else if (colors.length === 4) {
                // cubic bezier interpolation
                var lab3;
                (assign$2 = colors.map(function (c) { return c.lab(); }), lab0 = assign$2[0], lab1 = assign$2[1], lab2 = assign$2[2], lab3 = assign$2[3]);
                I = function(t) {
                    var lab = ([0, 1, 2].map(function (i) { return ((1-t)*(1-t)*(1-t) * lab0[i]) + (3 * (1-t) * (1-t) * t * lab1[i]) + (3 * (1-t) * t * t * lab2[i]) + (t*t*t * lab3[i]); }));
                    return new Color_1(lab, 'lab');
                };
            } else if (colors.length === 5) {
                var I0 = bezier(colors.slice(0, 3));
                var I1 = bezier(colors.slice(2, 5));
                I = function(t) {
                    if (t < 0.5) {
                        return I0(t*2);
                    } else {
                        return I1((t-0.5)*2);
                    }
                };
            }
            return I;
        };

        var bezier_1 = function (colors) {
            var f = bezier(colors);
            f.scale = function () { return scale(f); };
            return f;
        };

        /*
         * interpolates between a set of colors uzing a bezier spline
         * blend mode formulas taken from http://www.venture-ware.com/kevin/coding/lets-learn-math-photoshop-blend-modes/
         */




        var blend = function (bottom, top, mode) {
            if (!blend[mode]) {
                throw new Error('unknown blend mode ' + mode);
            }
            return blend[mode](bottom, top);
        };

        var blend_f = function (f) { return function (bottom,top) {
                var c0 = chroma_1(top).rgb();
                var c1 = chroma_1(bottom).rgb();
                return chroma_1.rgb(f(c0, c1));
            }; };

        var each = function (f) { return function (c0, c1) {
                var out = [];
                out[0] = f(c0[0], c1[0]);
                out[1] = f(c0[1], c1[1]);
                out[2] = f(c0[2], c1[2]);
                return out;
            }; };

        var normal = function (a) { return a; };
        var multiply = function (a,b) { return a * b / 255; };
        var darken$1 = function (a,b) { return a > b ? b : a; };
        var lighten = function (a,b) { return a > b ? a : b; };
        var screen = function (a,b) { return 255 * (1 - (1-a/255) * (1-b/255)); };
        var overlay = function (a,b) { return b < 128 ? 2 * a * b / 255 : 255 * (1 - 2 * (1 - a / 255 ) * ( 1 - b / 255 )); };
        var burn = function (a,b) { return 255 * (1 - (1 - b / 255) / (a/255)); };
        var dodge = function (a,b) {
            if (a === 255) { return 255; }
            a = 255 * (b / 255) / (1 - a / 255);
            return a > 255 ? 255 : a
        };

        // # add = (a,b) ->
        // #     if (a + b > 255) then 255 else a + b

        blend.normal = blend_f(each(normal));
        blend.multiply = blend_f(each(multiply));
        blend.screen = blend_f(each(screen));
        blend.overlay = blend_f(each(overlay));
        blend.darken = blend_f(each(darken$1));
        blend.lighten = blend_f(each(lighten));
        blend.dodge = blend_f(each(dodge));
        blend.burn = blend_f(each(burn));
        // blend.add = blend_f(each(add));

        var blend_1 = blend;

        // cubehelix interpolation
        // based on D.A. Green "A colour scheme for the display of astronomical intensity images"
        // http://astron-soc.in/bulletin/11June/289392011.pdf

        var type$k = utils.type;
        var clip_rgb$3 = utils.clip_rgb;
        var TWOPI$2 = utils.TWOPI;
        var pow$6 = Math.pow;
        var sin$2 = Math.sin;
        var cos$3 = Math.cos;


        var cubehelix = function(start, rotations, hue, gamma, lightness) {
            if ( start === void 0 ) start=300;
            if ( rotations === void 0 ) rotations=-1.5;
            if ( hue === void 0 ) hue=1;
            if ( gamma === void 0 ) gamma=1;
            if ( lightness === void 0 ) lightness=[0,1];

            var dh = 0, dl;
            if (type$k(lightness) === 'array') {
                dl = lightness[1] - lightness[0];
            } else {
                dl = 0;
                lightness = [lightness, lightness];
            }

            var f = function(fract) {
                var a = TWOPI$2 * (((start+120)/360) + (rotations * fract));
                var l = pow$6(lightness[0] + (dl * fract), gamma);
                var h = dh !== 0 ? hue[0] + (fract * dh) : hue;
                var amp = (h * l * (1-l)) / 2;
                var cos_a = cos$3(a);
                var sin_a = sin$2(a);
                var r = l + (amp * ((-0.14861 * cos_a) + (1.78277* sin_a)));
                var g = l + (amp * ((-0.29227 * cos_a) - (0.90649* sin_a)));
                var b = l + (amp * (+1.97294 * cos_a));
                return chroma_1(clip_rgb$3([r*255,g*255,b*255,1]));
            };

            f.start = function(s) {
                if ((s == null)) { return start; }
                start = s;
                return f;
            };

            f.rotations = function(r) {
                if ((r == null)) { return rotations; }
                rotations = r;
                return f;
            };

            f.gamma = function(g) {
                if ((g == null)) { return gamma; }
                gamma = g;
                return f;
            };

            f.hue = function(h) {
                if ((h == null)) { return hue; }
                hue = h;
                if (type$k(hue) === 'array') {
                    dh = hue[1] - hue[0];
                    if (dh === 0) { hue = hue[1]; }
                } else {
                    dh = 0;
                }
                return f;
            };

            f.lightness = function(h) {
                if ((h == null)) { return lightness; }
                if (type$k(h) === 'array') {
                    lightness = h;
                    dl = h[1] - h[0];
                } else {
                    lightness = [h,h];
                    dl = 0;
                }
                return f;
            };

            f.scale = function () { return chroma_1.scale(f); };

            f.hue(hue);

            return f;
        };

        var digits = '0123456789abcdef';

        var floor$2 = Math.floor;
        var random = Math.random;

        var random_1 = function () {
            var code = '#';
            for (var i=0; i<6; i++) {
                code += digits.charAt(floor$2(random() * 16));
            }
            return new Color_1(code, 'hex');
        };

        var log$1 = Math.log;
        var pow$7 = Math.pow;
        var floor$3 = Math.floor;
        var abs = Math.abs;


        var analyze = function (data, key) {
            if ( key === void 0 ) key=null;

            var r = {
                min: Number.MAX_VALUE,
                max: Number.MAX_VALUE*-1,
                sum: 0,
                values: [],
                count: 0
            };
            if (type(data) === 'object') {
                data = Object.values(data);
            }
            data.forEach(function (val) {
                if (key && type(val) === 'object') { val = val[key]; }
                if (val !== undefined && val !== null && !isNaN(val)) {
                    r.values.push(val);
                    r.sum += val;
                    if (val < r.min) { r.min = val; }
                    if (val > r.max) { r.max = val; }
                    r.count += 1;
                }
            });

            r.domain = [r.min, r.max];

            r.limits = function (mode, num) { return limits(r, mode, num); };

            return r;
        };


        var limits = function (data, mode, num) {
            if ( mode === void 0 ) mode='equal';
            if ( num === void 0 ) num=7;

            if (type(data) == 'array') {
                data = analyze(data);
            }
            var min = data.min;
            var max = data.max;
            var values = data.values.sort(function (a,b) { return a-b; });

            if (num === 1) { return [min,max]; }

            var limits = [];

            if (mode.substr(0,1) === 'c') { // continuous
                limits.push(min);
                limits.push(max);
            }

            if (mode.substr(0,1) === 'e') { // equal interval
                limits.push(min);
                for (var i=1; i<num; i++) {
                    limits.push(min+((i/num)*(max-min)));
                }
                limits.push(max);
            }

            else if (mode.substr(0,1) === 'l') { // log scale
                if (min <= 0) {
                    throw new Error('Logarithmic scales are only possible for values > 0');
                }
                var min_log = Math.LOG10E * log$1(min);
                var max_log = Math.LOG10E * log$1(max);
                limits.push(min);
                for (var i$1=1; i$1<num; i$1++) {
                    limits.push(pow$7(10, min_log + ((i$1/num) * (max_log - min_log))));
                }
                limits.push(max);
            }

            else if (mode.substr(0,1) === 'q') { // quantile scale
                limits.push(min);
                for (var i$2=1; i$2<num; i$2++) {
                    var p = ((values.length-1) * i$2)/num;
                    var pb = floor$3(p);
                    if (pb === p) {
                        limits.push(values[pb]);
                    } else { // p > pb
                        var pr = p - pb;
                        limits.push((values[pb]*(1-pr)) + (values[pb+1]*pr));
                    }
                }
                limits.push(max);

            }

            else if (mode.substr(0,1) === 'k') { // k-means clustering
                /*
                implementation based on
                http://code.google.com/p/figue/source/browse/trunk/figue.js#336
                simplified for 1-d input values
                */
                var cluster;
                var n = values.length;
                var assignments = new Array(n);
                var clusterSizes = new Array(num);
                var repeat = true;
                var nb_iters = 0;
                var centroids = null;

                // get seed values
                centroids = [];
                centroids.push(min);
                for (var i$3=1; i$3<num; i$3++) {
                    centroids.push(min + ((i$3/num) * (max-min)));
                }
                centroids.push(max);

                while (repeat) {
                    // assignment step
                    for (var j=0; j<num; j++) {
                        clusterSizes[j] = 0;
                    }
                    for (var i$4=0; i$4<n; i$4++) {
                        var value = values[i$4];
                        var mindist = Number.MAX_VALUE;
                        var best = (void 0);
                        for (var j$1=0; j$1<num; j$1++) {
                            var dist = abs(centroids[j$1]-value);
                            if (dist < mindist) {
                                mindist = dist;
                                best = j$1;
                            }
                            clusterSizes[best]++;
                            assignments[i$4] = best;
                        }
                    }

                    // update centroids step
                    var newCentroids = new Array(num);
                    for (var j$2=0; j$2<num; j$2++) {
                        newCentroids[j$2] = null;
                    }
                    for (var i$5=0; i$5<n; i$5++) {
                        cluster = assignments[i$5];
                        if (newCentroids[cluster] === null) {
                            newCentroids[cluster] = values[i$5];
                        } else {
                            newCentroids[cluster] += values[i$5];
                        }
                    }
                    for (var j$3=0; j$3<num; j$3++) {
                        newCentroids[j$3] *= 1/clusterSizes[j$3];
                    }

                    // check convergence
                    repeat = false;
                    for (var j$4=0; j$4<num; j$4++) {
                        if (newCentroids[j$4] !== centroids[j$4]) {
                            repeat = true;
                            break;
                        }
                    }

                    centroids = newCentroids;
                    nb_iters++;

                    if (nb_iters > 200) {
                        repeat = false;
                    }
                }

                // finished k-means clustering
                // the next part is borrowed from gabrielflor.it
                var kClusters = {};
                for (var j$5=0; j$5<num; j$5++) {
                    kClusters[j$5] = [];
                }
                for (var i$6=0; i$6<n; i$6++) {
                    cluster = assignments[i$6];
                    kClusters[cluster].push(values[i$6]);
                }
                var tmpKMeansBreaks = [];
                for (var j$6=0; j$6<num; j$6++) {
                    tmpKMeansBreaks.push(kClusters[j$6][0]);
                    tmpKMeansBreaks.push(kClusters[j$6][kClusters[j$6].length-1]);
                }
                tmpKMeansBreaks = tmpKMeansBreaks.sort(function (a,b){ return a-b; });
                limits.push(tmpKMeansBreaks[0]);
                for (var i$7=1; i$7 < tmpKMeansBreaks.length; i$7+= 2) {
                    var v = tmpKMeansBreaks[i$7];
                    if (!isNaN(v) && (limits.indexOf(v) === -1)) {
                        limits.push(v);
                    }
                }
            }
            return limits;
        };

        var analyze_1 = {analyze: analyze, limits: limits};

        var contrast = function (a, b) {
            // WCAG contrast ratio
            // see http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
            a = new Color_1(a);
            b = new Color_1(b);
            var l1 = a.luminance();
            var l2 = b.luminance();
            return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
        };

        var sqrt$4 = Math.sqrt;
        var atan2$2 = Math.atan2;
        var abs$1 = Math.abs;
        var cos$4 = Math.cos;
        var PI$2 = Math.PI;

        var deltaE = function(a, b, L, C) {
            if ( L === void 0 ) L=1;
            if ( C === void 0 ) C=1;

            // Delta E (CMC)
            // see http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CMC.html
            a = new Color_1(a);
            b = new Color_1(b);
            var ref = Array.from(a.lab());
            var L1 = ref[0];
            var a1 = ref[1];
            var b1 = ref[2];
            var ref$1 = Array.from(b.lab());
            var L2 = ref$1[0];
            var a2 = ref$1[1];
            var b2 = ref$1[2];
            var c1 = sqrt$4((a1 * a1) + (b1 * b1));
            var c2 = sqrt$4((a2 * a2) + (b2 * b2));
            var sl = L1 < 16.0 ? 0.511 : (0.040975 * L1) / (1.0 + (0.01765 * L1));
            var sc = ((0.0638 * c1) / (1.0 + (0.0131 * c1))) + 0.638;
            var h1 = c1 < 0.000001 ? 0.0 : (atan2$2(b1, a1) * 180.0) / PI$2;
            while (h1 < 0) { h1 += 360; }
            while (h1 >= 360) { h1 -= 360; }
            var t = (h1 >= 164.0) && (h1 <= 345.0) ? (0.56 + abs$1(0.2 * cos$4((PI$2 * (h1 + 168.0)) / 180.0))) : (0.36 + abs$1(0.4 * cos$4((PI$2 * (h1 + 35.0)) / 180.0)));
            var c4 = c1 * c1 * c1 * c1;
            var f = sqrt$4(c4 / (c4 + 1900.0));
            var sh = sc * (((f * t) + 1.0) - f);
            var delL = L1 - L2;
            var delC = c1 - c2;
            var delA = a1 - a2;
            var delB = b1 - b2;
            var dH2 = ((delA * delA) + (delB * delB)) - (delC * delC);
            var v1 = delL / (L * sl);
            var v2 = delC / (C * sc);
            var v3 = sh;
            return sqrt$4((v1 * v1) + (v2 * v2) + (dH2 / (v3 * v3)));
        };

        // simple Euclidean distance
        var distance = function(a, b, mode) {
            if ( mode === void 0 ) mode='lab';

            // Delta E (CIE 1976)
            // see http://www.brucelindbloom.com/index.html?Equations.html
            a = new Color_1(a);
            b = new Color_1(b);
            var l1 = a.get(mode);
            var l2 = b.get(mode);
            var sum_sq = 0;
            for (var i in l1) {
                var d = (l1[i] || 0) - (l2[i] || 0);
                sum_sq += d*d;
            }
            return Math.sqrt(sum_sq);
        };

        var valid = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            try {
                new (Function.prototype.bind.apply( Color_1, [ null ].concat( args) ));
                return true;
            } catch (e) {
                return false;
            }
        };

        // some pre-defined color scales:




        var scales = {
        	cool: function cool() { return scale([chroma_1.hsl(180,1,.9), chroma_1.hsl(250,.7,.4)]) },
        	hot: function hot() { return scale(['#000','#f00','#ff0','#fff']).mode('rgb') }
        };

        /**
            ColorBrewer colors for chroma.js

            Copyright (c) 2002 Cynthia Brewer, Mark Harrower, and The
            Pennsylvania State University.

            Licensed under the Apache License, Version 2.0 (the "License");
            you may not use this file except in compliance with the License.
            You may obtain a copy of the License at
            http://www.apache.org/licenses/LICENSE-2.0

            Unless required by applicable law or agreed to in writing, software distributed
            under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
            CONDITIONS OF ANY KIND, either express or implied. See the License for the
            specific language governing permissions and limitations under the License.
        */

        var colorbrewer = {
            // sequential
            OrRd: ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000'],
            PuBu: ['#fff7fb', '#ece7f2', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#045a8d', '#023858'],
            BuPu: ['#f7fcfd', '#e0ecf4', '#bfd3e6', '#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b'],
            Oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
            BuGn: ['#f7fcfd', '#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'],
            YlOrBr: ['#ffffe5', '#fff7bc', '#fee391', '#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#993404', '#662506'],
            YlGn: ['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#006837', '#004529'],
            Reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
            RdPu: ['#fff7f3', '#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#dd3497', '#ae017e', '#7a0177', '#49006a'],
            Greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
            YlGnBu: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
            Purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
            GnBu: ['#f7fcf0', '#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081'],
            Greys: ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000'],
            YlOrRd: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'],
            PuRd: ['#f7f4f9', '#e7e1ef', '#d4b9da', '#c994c7', '#df65b0', '#e7298a', '#ce1256', '#980043', '#67001f'],
            Blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
            PuBuGn: ['#fff7fb', '#ece2f0', '#d0d1e6', '#a6bddb', '#67a9cf', '#3690c0', '#02818a', '#016c59', '#014636'],
            Viridis: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'],

            // diverging

            Spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
            RdYlGn: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
            RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
            PiYG: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
            PRGn: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
            RdYlBu: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
            BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
            RdGy: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#ffffff', '#e0e0e0', '#bababa', '#878787', '#4d4d4d', '#1a1a1a'],
            PuOr: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],

            // qualitative

            Set2: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
            Accent: ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666'],
            Set1: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
            Set3: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
            Dark2: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
            Paired: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'],
            Pastel2: ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc'],
            Pastel1: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2'],
        };

        // add lowercase aliases for case-insensitive matches
        for (var i$1 = 0, list$1 = Object.keys(colorbrewer); i$1 < list$1.length; i$1 += 1) {
            var key = list$1[i$1];

            colorbrewer[key.toLowerCase()] = colorbrewer[key];
        }

        var colorbrewer_1 = colorbrewer;

        // feel free to comment out anything to rollup
        // a smaller chroma.js built

        // io --> convert colors















        // operators --> modify existing Colors










        // interpolators










        // generators -- > create new colors
        chroma_1.average = average;
        chroma_1.bezier = bezier_1;
        chroma_1.blend = blend_1;
        chroma_1.cubehelix = cubehelix;
        chroma_1.mix = chroma_1.interpolate = mix;
        chroma_1.random = random_1;
        chroma_1.scale = scale;

        // other utility methods
        chroma_1.analyze = analyze_1.analyze;
        chroma_1.contrast = contrast;
        chroma_1.deltaE = deltaE;
        chroma_1.distance = distance;
        chroma_1.limits = analyze_1.limits;
        chroma_1.valid = valid;

        // scale
        chroma_1.scales = scales;

        // colors
        chroma_1.colors = w3cx11_1;
        chroma_1.brewer = colorbrewer_1;

        var chroma_js = chroma_1;

        return chroma_js;

    })));
    });

    var cssVars = (node, props) => {
      Object.entries(props).forEach(([key, value]) => {
        node.style.setProperty(`--${key}`, value);
      });

      return {
        update(new_props) {
          Object.entries(new_props).forEach(([key, value]) => {
            node.style.setProperty(`--${key}`, value);
            delete props[key];
          });

          Object.keys(props).forEach(name =>
            node.style.removeProperty(`--${name}`)
          );
          props = new_props;
        }
      };
    };

    var colorToken = {
      themes: {
        primary: '#ff8879',
        secondary: '#009ba6',
        success: '#00dcc7',
        info: '#5c80ff',
        warning: '#ffcf5c',
        danger: '#ff647c',
        white: '#ffffff',
        gray: '#818181',
        black: '#232323',
      },
      shades: {
        lightest: 0.65,
        lighter: 0.3,
        light: 0.1,
        default: 0,
        dark: 0.3,
        darker: 0.5,
      },
    };

    var buttonToken = {
      shape: {
        borderRadius: 4,
        borderStyle: 'solid',
        borderWidth: 1,
      },
      sizes: {
        small: {
          fontSize: 14,
          padding: {
            top: 8,
            right: 12,
            bottom: 8,
            left: 12,
          },
        },
        medium: {
          fontSize: 16,
          padding: {
            top: 12,
            right: 20,
            bottom: 12,
            left: 20,
          },
        },
        large: {
          fontSize: 18,
          padding: {
            top: 16,
            right: 24,
            bottom: 16,
            left: 24,
          },
        },
      },
      types: {
        default: {
          normal: {
            font: {
              type: 'fixed',
              color: 'white',
              shade: 'default',
            },
            background: {
              type: 'custom',
              color: '',
              shade: 'default',
            },
            border: {
              type: 'custom',
              color: '',
              shade: 'default',
            },
            boxShadows: [
              {
                x: 0,
                y: 4,
                blur: 10,
                spread: 0,
                type: 'fixed',
                color: 'black',
                opacity: 0.1,
              },
            ],
          },
          hover: {
            font: {
              type: 'fixed',
              color: 'white',
              shade: 'default',
            },
            background: {
              type: 'custom',
              color: '',
              shade: 'light',
            },
            border: {
              type: 'custom',
              color: '',
              shade: 'light',
            },
            boxShadows: [
              {
                x: 0,
                y: 4,
                blur: 10,
                spread: 0,
                type: 'fixed',
                color: 'black',
                opacity: 0.2,
              },
            ],
          },
          pressed: {
            font: {
              type: 'fixed',
              color: 'white',
              shade: 'default',
            },
            background: {
              type: 'custom',
              color: '',
              shade: 'lighter',
            },
            border: {
              type: 'custom',
              color: '',
              shade: 'lighter',
            },
            boxShadows: [
              {
                x: 0,
                y: 4,
                blur: 10,
                spread: 0,
                type: 'fixed',
                color: 'black',
                opacity: 0.2,
              },
            ],
          },
          disabled: {
            font: {
              type: 'fixed',
              color: 'gray',
              shade: 'lighter',
            },
            background: {
              type: 'fixed',
              color: 'gray',
              shade: 'lightest',
            },
            border: {
              type: 'fixed',
              color: 'gray',
              shade: 'lightest',
            },
            boxShadows: [
              {
                x: 0,
                y: 4,
                blur: 10,
                spread: 0,
                type: 'fixed',
                color: 'black',
                opacity: 0.1,
              },
            ],
          },
        },
        outline: {
          normal: {
            font: {
              type: 'custom',
              color: '',
              shade: 'default',
            },
            background: {
              type: 'fixed',
              color: 'white',
              shade: 'default',
            },
            border: {
              type: 'custom',
              color: '',
              shade: 'default',
            },
            boxShadows: [
              {
                x: 0,
                y: 0,
                blur: 0,
                spread: 0,
                type: 'transparent',
                color: '',
                opacity: 0,
              },
            ],
          },
          hover: {
            font: {
              type: 'fixed',
              color: 'white',
              shade: 'default',
            },
            background: {
              type: 'custom',
              color: '',
              shade: 'default',
            },
            border: {
              type: 'custom',
              color: '',
              shade: 'default',
            },
            boxShadows: [
              {
                x: 0,
                y: 0,
                blur: 0,
                spread: 0,
                type: 'transparent',
                color: '',
                opacity: 0,
              },
            ],
          },
          pressed: {
            font: {
              type: 'fixed',
              color: 'white',
              shade: 'default',
            },
            background: {
              type: 'custom',
              color: '',
              shade: 'lighter',
            },
            border: {
              type: 'custom',
              color: '',
              shade: 'lighter',
            },
            boxShadows: [
              {
                x: 0,
                y: 0,
                blur: 0,
                spread: 0,
                type: 'transparent',
                color: '',
                opacity: 0,
              },
            ],
          },
          disabled: {
            font: {
              type: 'fixed',
              color: 'gray',
              shade: 'lighter',
            },
            background: {
              type: 'fixed',
              color: 'white',
              shade: 'default',
            },
            border: {
              type: 'fixed',
              color: 'gray',
              shade: 'lighter',
            },
            boxShadows: [
              {
                x: 0,
                y: 0,
                blur: 0,
                spread: 0,
                type: 'transparent',
                color: '',
                opacity: 0,
              },
            ],
          },
        },
        ghost: {
          normal: {
            font: {
              type: 'custom',
              color: '',
              shade: 'default',
            },
            background: {
              type: 'transparent',
              color: '',
              shade: '',
            },
            border: {
              type: 'transparent',
              color: '',
              shade: '',
            },
            boxShadows: [
              {
                x: 0,
                y: 0,
                blur: 0,
                spread: 0,
                type: 'transparent',
                color: '',
                opacity: 0,
              },
            ],
          },
          hover: {
            font: {
              type: 'custom',
              color: '',
              shade: 'default',
            },
            background: {
              type: 'fixed',
              color: 'gray',
              shade: 'lightest',
            },
            border: {
              type: 'fixed',
              color: 'gray',
              shade: 'lightest',
            },
            boxShadows: [
              {
                x: 0,
                y: 0,
                blur: 0,
                spread: 0,
                type: 'transparent',
                color: '',
                opacity: 0,
              },
            ],
          },
          pressed: {
            font: {
              type: 'custom',
              color: '',
              shade: 'default',
            },
            background: {
              type: 'fixed',
              color: 'gray',
              shade: 'lighter',
            },
            border: {
              type: 'fixed',
              color: 'gray',
              shade: 'lighter',
            },
            boxShadows: [
              {
                x: 0,
                y: 0,
                blur: 0,
                spread: 0,
                type: 'transparent',
                color: '',
                opacity: 0,
              },
            ],
          },
          disabled: {
            font: {
              type: 'fixed',
              color: 'gray',
              shade: 'lighter',
            },
            background: {
              type: 'fixed',
              color: 'gray',
              shade: 'lightest',
            },
            border: {
              type: 'fixed',
              color: 'gray',
              shade: 'lightest',
            },
            boxShadows: [
              {
                x: 0,
                y: 0,
                blur: 0,
                spread: 0,
                type: 'transparent',
                color: '',
                opacity: 0,
              },
            ],
          },
        },
      },
    };

    function mixColorShade(color, shade, opacity) {
      if (shade === 'light' || shade === 'lighter' || shade === 'lightest') {
        return chroma.mix(color, 'white', opacity);
      } else if (shade === 'dark' || shade === 'darker') {
        return chroma.mix(color, 'black', opacity);
      }
      return color;
    }

    function getColorOpacity(color, opacity) {
      return chroma(color).alpha(opacity);
    }

    function getBorderCSS(width, style, color) {
      return `${width}px ${style} ${color}`;
    }

    function getBoxShadowCSS(x, y, blur, spread, color) {
      return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
    }

    /* src/components/Button/button.svelte generated by Svelte v3.18.2 */

    const { Object: Object_1 } = globals;

    const file = "src/components/Button/button.svelte";

    function create_fragment(ctx) {
    	let button;
    	let slot;
    	let cssVars_action;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			slot = element("slot");
    			this.c = noop;
    			add_location(slot, file, 160, 2, 4959);
    			button.disabled = /*disabled*/ ctx[0];
    			add_location(button, file, 159, 0, 4913);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, slot);
    			dispose = action_destroyer(cssVars_action = cssVars.call(null, button, /*styleVars*/ ctx[1]));
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*disabled*/ 1) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[0]);
    			}

    			if (cssVars_action && is_function(cssVars_action.update) && dirty & /*styleVars*/ 2) cssVars_action.update.call(null, /*styleVars*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { size = "medium" } = $$props;
    	let { type = "default" } = $$props;
    	let { color = "primary" } = $$props;
    	let { colorcode = "#ff8879" } = $$props;
    	let { disabled = false } = $$props;
    	let { radius = 4 } = $$props;
    	let { fontsize = 16 } = $$props;
    	let { pt = 12 } = $$props;
    	let { pr = 20 } = $$props;
    	let { pb = 12 } = $$props;
    	let { pl = 20 } = $$props;
    	const colorTheme = Object.keys(colorToken.themes);

    	function getBaseColor(state, style, colorcode) {
    		return btnType[state][style].type === "fixed"
    		? colorToken.themes[btnType[state][style].color]
    		: colorcode;
    	}

    	function getColorShade(state, style, colorcode) {
    		if (btnType[state][style].type === "transparent") {
    			return "transparent";
    		}

    		const color = getBaseColor(state, style, colorcode);
    		const shade = btnType[state][style].shade;
    		const opacity = colorToken.shades[btnType[state][style].shade];
    		return mixColorShade(color, shade, opacity);
    	}

    	function getColorBoxShadow(boxShadow, colorcode) {
    		if (boxShadow.type === "transparent") {
    			return "transparent";
    		}

    		const color = boxShadow.type === "fixed"
    		? colorToken.themes[boxShadow.color]
    		: colorcode;

    		const opacity = boxShadow.opacity;
    		return getColorOpacity(color, opacity);
    	}

    	function getBoxShadow(state) {
    		let boxShadowCSS = "";

    		btnType[state]["boxShadows"].forEach(boxShadow => {
    			const color = getColorBoxShadow(boxShadow, colorcode);
    			const style = getBoxShadowCSS(boxShadow.x, boxShadow.y, boxShadow.blur, boxShadow.spread, color);

    			boxShadowCSS = boxShadowCSS === ""
    			? `${style}`
    			: `${style}, ${boxShadowCSS}`;
    		});

    		return boxShadowCSS;
    	}

    	const writable_props = [
    		"size",
    		"type",
    		"color",
    		"colorcode",
    		"disabled",
    		"radius",
    		"fontsize",
    		"pt",
    		"pr",
    		"pb",
    		"pl"
    	];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<kt-button> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(3, size = $$props.size);
    		if ("type" in $$props) $$invalidate(4, type = $$props.type);
    		if ("color" in $$props) $$invalidate(5, color = $$props.color);
    		if ("colorcode" in $$props) $$invalidate(2, colorcode = $$props.colorcode);
    		if ("disabled" in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ("radius" in $$props) $$invalidate(6, radius = $$props.radius);
    		if ("fontsize" in $$props) $$invalidate(7, fontsize = $$props.fontsize);
    		if ("pt" in $$props) $$invalidate(8, pt = $$props.pt);
    		if ("pr" in $$props) $$invalidate(9, pr = $$props.pr);
    		if ("pb" in $$props) $$invalidate(10, pb = $$props.pb);
    		if ("pl" in $$props) $$invalidate(11, pl = $$props.pl);
    	};

    	$$self.$capture_state = () => {
    		return {
    			size,
    			type,
    			color,
    			colorcode,
    			disabled,
    			radius,
    			fontsize,
    			pt,
    			pr,
    			pb,
    			pl,
    			btnShape,
    			btnSize,
    			btnType,
    			styleVars
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(3, size = $$props.size);
    		if ("type" in $$props) $$invalidate(4, type = $$props.type);
    		if ("color" in $$props) $$invalidate(5, color = $$props.color);
    		if ("colorcode" in $$props) $$invalidate(2, colorcode = $$props.colorcode);
    		if ("disabled" in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ("radius" in $$props) $$invalidate(6, radius = $$props.radius);
    		if ("fontsize" in $$props) $$invalidate(7, fontsize = $$props.fontsize);
    		if ("pt" in $$props) $$invalidate(8, pt = $$props.pt);
    		if ("pr" in $$props) $$invalidate(9, pr = $$props.pr);
    		if ("pb" in $$props) $$invalidate(10, pb = $$props.pb);
    		if ("pl" in $$props) $$invalidate(11, pl = $$props.pl);
    		if ("btnShape" in $$props) $$invalidate(12, btnShape = $$props.btnShape);
    		if ("btnSize" in $$props) $$invalidate(13, btnSize = $$props.btnSize);
    		if ("btnType" in $$props) btnType = $$props.btnType;
    		if ("styleVars" in $$props) $$invalidate(1, styleVars = $$props.styleVars);
    	};

    	let btnShape;
    	let btnSize;
    	let btnType;
    	let styleVars;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*color*/ 32) {
    			 $$invalidate(2, colorcode = colorTheme.includes(color)
    			? colorToken.themes[color]
    			: color);
    		}

    		if ($$self.$$.dirty & /*size*/ 8) {
    			 $$invalidate(13, btnSize = buttonToken.sizes[size]);
    		}

    		if ($$self.$$.dirty & /*type*/ 16) {
    			 btnType = buttonToken.types[type];
    		}

    		if ($$self.$$.dirty & /*size, btnShape, radius, btnSize, fontsize, pt, pr, pb, pl, colorcode*/ 16332) {
    			 $$invalidate(1, styleVars = {
    				// shape
    				radius: size != "custom"
    				? `${btnShape.borderRadius}px`
    				: `${radius}px`,
    				// size
    				fontsize: size != "custom"
    				? `${btnSize.fontSize}px`
    				: `${fontsize}px`,
    				padding: size != "custom"
    				? `${btnSize.padding.top}px ${btnSize.padding.right}px ${btnSize.padding.bottom}px ${btnSize.padding.left}px`
    				: `${pt}px ${pr}px ${pb}px ${pl}px`,
    				colorcode,
    				// type
    				fontcolor: getColorShade("normal", "font", colorcode),
    				bgcolor: getColorShade("normal", "background", colorcode),
    				border: getBorderCSS(btnShape.borderWidth, btnShape.borderStyle, getColorShade("normal", "border", colorcode)),
    				boxshadow: getBoxShadow("normal"),
    				// type:hover
    				fontcolorhover: getColorShade("hover", "font", colorcode),
    				bgcolorhover: getColorShade("hover", "background", colorcode),
    				borderhover: getBorderCSS(btnShape.borderWidth, btnShape.borderStyle, getColorShade("hover", "border", colorcode)),
    				boxshadowhover: getBoxShadow("hover"),
    				// type:pressed
    				fontcolorpressed: getColorShade("pressed", "font", colorcode),
    				bgcolorpressed: getColorShade("pressed", "background", colorcode),
    				borderpressed: getBorderCSS(btnShape.borderWidth, btnShape.borderStyle, getColorShade("pressed", "border", colorcode)),
    				boxshadowpressed: getBoxShadow("pressed"),
    				// type:disabled
    				fontcolordisabled: getColorShade("disabled", "font", colorcode),
    				bgcolordisabled: getColorShade("disabled", "background", colorcode),
    				borderdisabled: getBorderCSS(btnShape.borderWidth, btnShape.borderStyle, getColorShade("disabled", "border", colorcode)),
    				boxshadowdisabled: getBoxShadow("disabled")
    			});
    		}
    	};

    	 $$invalidate(12, btnShape = buttonToken.shape);

    	return [
    		disabled,
    		styleVars,
    		colorcode,
    		size,
    		type,
    		color,
    		radius,
    		fontsize,
    		pt,
    		pr,
    		pb,
    		pl
    	];
    }

    class Button extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>button{border-radius:var(--radius);font-size:var(--fontsize);padding:var(--padding);color:var(--fontcolor);background:var(--bgcolor);border:var(--border);box-shadow:var(--boxshadow)}button:hover{color:var(--fontcolorhover);background:var(--bgcolorhover);border:var(--borderhover);box-shadow:var(--boxshadowhover)}button:active{color:var(--fontcolorpressed);background:var(--bgcolorpressed);border:var(--borderpressed);box-shadow:var(--boxshadowpressed)}button:disabled{color:var(--fontcolordisabled);background:var(--bgcolordisabled);border:var(--borderdisabled);box-shadow:var(--boxshadowdisabled)}button:focus{outline:0}</style>`;

    		init(this, { target: this.shadowRoot }, instance, create_fragment, safe_not_equal, {
    			size: 3,
    			type: 4,
    			color: 5,
    			colorcode: 2,
    			disabled: 0,
    			radius: 6,
    			fontsize: 7,
    			pt: 8,
    			pr: 9,
    			pb: 10,
    			pl: 11
    		});

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return [
    			"size",
    			"type",
    			"color",
    			"colorcode",
    			"disabled",
    			"radius",
    			"fontsize",
    			"pt",
    			"pr",
    			"pb",
    			"pl"
    		];
    	}

    	get size() {
    		return this.$$.ctx[3];
    	}

    	set size(size) {
    		this.$set({ size });
    		flush();
    	}

    	get type() {
    		return this.$$.ctx[4];
    	}

    	set type(type) {
    		this.$set({ type });
    		flush();
    	}

    	get color() {
    		return this.$$.ctx[5];
    	}

    	set color(color) {
    		this.$set({ color });
    		flush();
    	}

    	get colorcode() {
    		return this.$$.ctx[2];
    	}

    	set colorcode(colorcode) {
    		this.$set({ colorcode });
    		flush();
    	}

    	get disabled() {
    		return this.$$.ctx[0];
    	}

    	set disabled(disabled) {
    		this.$set({ disabled });
    		flush();
    	}

    	get radius() {
    		return this.$$.ctx[6];
    	}

    	set radius(radius) {
    		this.$set({ radius });
    		flush();
    	}

    	get fontsize() {
    		return this.$$.ctx[7];
    	}

    	set fontsize(fontsize) {
    		this.$set({ fontsize });
    		flush();
    	}

    	get pt() {
    		return this.$$.ctx[8];
    	}

    	set pt(pt) {
    		this.$set({ pt });
    		flush();
    	}

    	get pr() {
    		return this.$$.ctx[9];
    	}

    	set pr(pr) {
    		this.$set({ pr });
    		flush();
    	}

    	get pb() {
    		return this.$$.ctx[10];
    	}

    	set pb(pb) {
    		this.$set({ pb });
    		flush();
    	}

    	get pl() {
    		return this.$$.ctx[11];
    	}

    	set pl(pl) {
    		this.$set({ pl });
    		flush();
    	}
    }

    customElements.define("kt-button", Button);

    /* src/components/Link/Link.svelte generated by Svelte v3.18.2 */

    const file$1 = "src/components/Link/Link.svelte";

    function create_fragment$1(ctx) {
    	let a;
    	let slot;

    	const block = {
    		c: function create() {
    			a = element("a");
    			slot = element("slot");
    			this.c = noop;
    			add_location(slot, file$1, 12, 2, 332);
    			attr_dev(a, "href", /*url*/ ctx[1]);
    			set_style(a, "--fontColor", /*fontcolor*/ ctx[0]);
    			add_location(a, file$1, 11, 0, 282);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, slot);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*url*/ 2) {
    				attr_dev(a, "href", /*url*/ ctx[1]);
    			}

    			if (dirty & /*fontcolor*/ 1) {
    				set_style(a, "--fontColor", /*fontcolor*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { fontcolor = "blue" } = $$props;
    	let { url = "https://www.facebook.com/ktpunnisa" } = $$props;
    	const writable_props = ["fontcolor", "url"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<my-link> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("fontcolor" in $$props) $$invalidate(0, fontcolor = $$props.fontcolor);
    		if ("url" in $$props) $$invalidate(1, url = $$props.url);
    	};

    	$$self.$capture_state = () => {
    		return { fontcolor, url };
    	};

    	$$self.$inject_state = $$props => {
    		if ("fontcolor" in $$props) $$invalidate(0, fontcolor = $$props.fontcolor);
    		if ("url" in $$props) $$invalidate(1, url = $$props.url);
    	};

    	return [fontcolor, url];
    }

    class Link extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>a{color:var(--fontColor)}</style>`;
    		init(this, { target: this.shadowRoot }, instance$1, create_fragment$1, safe_not_equal, { fontcolor: 0, url: 1 });

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["fontcolor", "url"];
    	}

    	get fontcolor() {
    		return this.$$.ctx[0];
    	}

    	set fontcolor(fontcolor) {
    		this.$set({ fontcolor });
    		flush();
    	}

    	get url() {
    		return this.$$.ctx[1];
    	}

    	set url(url) {
    		this.$set({ url });
    		flush();
    	}
    }

    customElements.define("my-link", Link);

    /* src/components/Palette/palette.svelte generated by Svelte v3.18.2 */

    const { Object: Object_1$1 } = globals;
    const file$2 = "src/components/Palette/palette.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let cssVars_action;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			this.c = noop;
    			add_location(div, file$2, 33, 0, 1037);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			dispose = action_destroyer(cssVars_action = cssVars.call(null, div, /*styleVars*/ ctx[0]));
    		},
    		p: function update(ctx, [dirty]) {
    			if (cssVars_action && is_function(cssVars_action.update) && dirty & /*styleVars*/ 1) cssVars_action.update.call(null, /*styleVars*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { width = "100" } = $$props;
    	let { height = "40" } = $$props;
    	let { radius = "8" } = $$props;
    	let { color = "primary" } = $$props;
    	let { colorcode = "#ff8879" } = $$props;
    	let { shade = "default" } = $$props;
    	let { opacity = 0 } = $$props;
    	const colorTheme = Object.keys(colorToken.themes);
    	const writable_props = ["width", "height", "radius", "color", "colorcode", "shade", "opacity"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<kt-palette> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    		if ("height" in $$props) $$invalidate(4, height = $$props.height);
    		if ("radius" in $$props) $$invalidate(5, radius = $$props.radius);
    		if ("color" in $$props) $$invalidate(6, color = $$props.color);
    		if ("colorcode" in $$props) $$invalidate(1, colorcode = $$props.colorcode);
    		if ("shade" in $$props) $$invalidate(7, shade = $$props.shade);
    		if ("opacity" in $$props) $$invalidate(2, opacity = $$props.opacity);
    	};

    	$$self.$capture_state = () => {
    		return {
    			width,
    			height,
    			radius,
    			color,
    			colorcode,
    			shade,
    			opacity,
    			styleVars
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    		if ("height" in $$props) $$invalidate(4, height = $$props.height);
    		if ("radius" in $$props) $$invalidate(5, radius = $$props.radius);
    		if ("color" in $$props) $$invalidate(6, color = $$props.color);
    		if ("colorcode" in $$props) $$invalidate(1, colorcode = $$props.colorcode);
    		if ("shade" in $$props) $$invalidate(7, shade = $$props.shade);
    		if ("opacity" in $$props) $$invalidate(2, opacity = $$props.opacity);
    		if ("styleVars" in $$props) $$invalidate(0, styleVars = $$props.styleVars);
    	};

    	let styleVars;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*color*/ 64) {
    			 $$invalidate(1, colorcode = colorTheme.includes(color)
    			? colorToken.themes[color]
    			: color);
    		}

    		if ($$self.$$.dirty & /*color, shade, opacity*/ 196) {
    			 $$invalidate(2, opacity = colorTheme.includes(color)
    			? colorToken.shades[shade]
    			: opacity);
    		}

    		if ($$self.$$.dirty & /*width, height, radius, colorcode, shade, opacity*/ 190) {
    			 $$invalidate(0, styleVars = {
    				width: `${width}px`,
    				height: `${height}px`,
    				radius: `${radius}px`,
    				color: mixColorShade(colorcode, shade, opacity)
    			});
    		}
    	};

    	return [styleVars, colorcode, opacity, width, height, radius, color, shade];
    }

    class Palette extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>div{width:var(--width);height:var(--height);border-radius:var(--radius);margin:4px;background:var(--color)}</style>`;

    		init(this, { target: this.shadowRoot }, instance$2, create_fragment$2, safe_not_equal, {
    			width: 3,
    			height: 4,
    			radius: 5,
    			color: 6,
    			colorcode: 1,
    			shade: 7,
    			opacity: 2
    		});

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["width", "height", "radius", "color", "colorcode", "shade", "opacity"];
    	}

    	get width() {
    		return this.$$.ctx[3];
    	}

    	set width(width) {
    		this.$set({ width });
    		flush();
    	}

    	get height() {
    		return this.$$.ctx[4];
    	}

    	set height(height) {
    		this.$set({ height });
    		flush();
    	}

    	get radius() {
    		return this.$$.ctx[5];
    	}

    	set radius(radius) {
    		this.$set({ radius });
    		flush();
    	}

    	get color() {
    		return this.$$.ctx[6];
    	}

    	set color(color) {
    		this.$set({ color });
    		flush();
    	}

    	get colorcode() {
    		return this.$$.ctx[1];
    	}

    	set colorcode(colorcode) {
    		this.$set({ colorcode });
    		flush();
    	}

    	get shade() {
    		return this.$$.ctx[7];
    	}

    	set shade(shade) {
    		this.$set({ shade });
    		flush();
    	}

    	get opacity() {
    		return this.$$.ctx[2];
    	}

    	set opacity(opacity) {
    		this.$set({ opacity });
    		flush();
    	}
    }

    customElements.define("kt-palette", Palette);

    /* src/App.svelte generated by Svelte v3.18.2 */
    const file$3 = "src/App.svelte";

    function create_fragment$3(ctx) {
    	let h1;
    	let t1;
    	let h20;
    	let t3;
    	let div0;
    	let kt_palette0;
    	let t4;
    	let kt_palette1;
    	let t5;
    	let kt_palette2;
    	let t6;
    	let kt_palette3;
    	let t7;
    	let kt_palette4;
    	let t8;
    	let kt_palette5;
    	let t9;
    	let div1;
    	let kt_palette6;
    	let t10;
    	let kt_palette7;
    	let t11;
    	let kt_palette8;
    	let t12;
    	let kt_palette9;
    	let t13;
    	let h21;
    	let t15;
    	let div2;
    	let kt_palette10;
    	let t16;
    	let kt_palette11;
    	let t17;
    	let kt_palette12;
    	let t18;
    	let kt_palette13;
    	let t19;
    	let kt_palette14;
    	let t20;
    	let kt_palette15;
    	let t21;
    	let div3;
    	let kt_palette16;
    	let t22;
    	let kt_palette17;
    	let t23;
    	let kt_palette18;
    	let t24;
    	let kt_palette19;
    	let t25;
    	let kt_palette20;
    	let t26;
    	let kt_palette21;
    	let t27;
    	let div4;
    	let kt_palette22;
    	let t28;
    	let kt_palette23;
    	let t29;
    	let kt_palette24;
    	let t30;
    	let kt_palette25;
    	let t31;
    	let kt_palette26;
    	let t32;
    	let kt_palette27;
    	let t33;
    	let div5;
    	let kt_palette28;
    	let t34;
    	let kt_palette29;
    	let t35;
    	let kt_palette30;
    	let t36;
    	let kt_palette31;
    	let t37;
    	let kt_palette32;
    	let t38;
    	let kt_palette33;
    	let t39;
    	let div6;
    	let kt_palette34;
    	let t40;
    	let kt_palette35;
    	let t41;
    	let kt_palette36;
    	let t42;
    	let kt_palette37;
    	let t43;
    	let kt_palette38;
    	let t44;
    	let kt_palette39;
    	let t45;
    	let div7;
    	let kt_palette40;
    	let t46;
    	let kt_palette41;
    	let t47;
    	let kt_palette42;
    	let t48;
    	let kt_palette43;
    	let t49;
    	let kt_palette44;
    	let t50;
    	let kt_palette45;
    	let t51;
    	let div8;
    	let kt_palette46;
    	let t52;
    	let kt_palette47;
    	let t53;
    	let kt_palette48;
    	let t54;
    	let kt_palette49;
    	let t55;
    	let kt_palette50;
    	let t56;
    	let kt_palette51;
    	let t57;
    	let h22;
    	let t59;
    	let div9;
    	let kt_button0;
    	let t61;
    	let kt_button1;
    	let t63;
    	let kt_button2;
    	let t65;
    	let div10;
    	let kt_button3;
    	let t67;
    	let kt_button4;
    	let t69;
    	let kt_button5;
    	let t71;
    	let div11;
    	let kt_button6;
    	let t73;
    	let kt_button7;
    	let t75;
    	let kt_button8;
    	let t77;
    	let div12;
    	let kt_button9;
    	let t79;
    	let kt_button10;
    	let t81;
    	let kt_button11;
    	let t83;
    	let h23;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "kt-component";
    			t1 = space();
    			h20 = element("h2");
    			h20.textContent = "Color";
    			t3 = space();
    			div0 = element("div");
    			kt_palette0 = element("kt-palette");
    			t4 = space();
    			kt_palette1 = element("kt-palette");
    			t5 = space();
    			kt_palette2 = element("kt-palette");
    			t6 = space();
    			kt_palette3 = element("kt-palette");
    			t7 = space();
    			kt_palette4 = element("kt-palette");
    			t8 = space();
    			kt_palette5 = element("kt-palette");
    			t9 = space();
    			div1 = element("div");
    			kt_palette6 = element("kt-palette");
    			t10 = space();
    			kt_palette7 = element("kt-palette");
    			t11 = space();
    			kt_palette8 = element("kt-palette");
    			t12 = space();
    			kt_palette9 = element("kt-palette");
    			t13 = space();
    			h21 = element("h2");
    			h21.textContent = "Color shade";
    			t15 = space();
    			div2 = element("div");
    			kt_palette10 = element("kt-palette");
    			t16 = space();
    			kt_palette11 = element("kt-palette");
    			t17 = space();
    			kt_palette12 = element("kt-palette");
    			t18 = space();
    			kt_palette13 = element("kt-palette");
    			t19 = space();
    			kt_palette14 = element("kt-palette");
    			t20 = space();
    			kt_palette15 = element("kt-palette");
    			t21 = space();
    			div3 = element("div");
    			kt_palette16 = element("kt-palette");
    			t22 = space();
    			kt_palette17 = element("kt-palette");
    			t23 = space();
    			kt_palette18 = element("kt-palette");
    			t24 = space();
    			kt_palette19 = element("kt-palette");
    			t25 = space();
    			kt_palette20 = element("kt-palette");
    			t26 = space();
    			kt_palette21 = element("kt-palette");
    			t27 = space();
    			div4 = element("div");
    			kt_palette22 = element("kt-palette");
    			t28 = space();
    			kt_palette23 = element("kt-palette");
    			t29 = space();
    			kt_palette24 = element("kt-palette");
    			t30 = space();
    			kt_palette25 = element("kt-palette");
    			t31 = space();
    			kt_palette26 = element("kt-palette");
    			t32 = space();
    			kt_palette27 = element("kt-palette");
    			t33 = space();
    			div5 = element("div");
    			kt_palette28 = element("kt-palette");
    			t34 = space();
    			kt_palette29 = element("kt-palette");
    			t35 = space();
    			kt_palette30 = element("kt-palette");
    			t36 = space();
    			kt_palette31 = element("kt-palette");
    			t37 = space();
    			kt_palette32 = element("kt-palette");
    			t38 = space();
    			kt_palette33 = element("kt-palette");
    			t39 = space();
    			div6 = element("div");
    			kt_palette34 = element("kt-palette");
    			t40 = space();
    			kt_palette35 = element("kt-palette");
    			t41 = space();
    			kt_palette36 = element("kt-palette");
    			t42 = space();
    			kt_palette37 = element("kt-palette");
    			t43 = space();
    			kt_palette38 = element("kt-palette");
    			t44 = space();
    			kt_palette39 = element("kt-palette");
    			t45 = space();
    			div7 = element("div");
    			kt_palette40 = element("kt-palette");
    			t46 = space();
    			kt_palette41 = element("kt-palette");
    			t47 = space();
    			kt_palette42 = element("kt-palette");
    			t48 = space();
    			kt_palette43 = element("kt-palette");
    			t49 = space();
    			kt_palette44 = element("kt-palette");
    			t50 = space();
    			kt_palette45 = element("kt-palette");
    			t51 = space();
    			div8 = element("div");
    			kt_palette46 = element("kt-palette");
    			t52 = space();
    			kt_palette47 = element("kt-palette");
    			t53 = space();
    			kt_palette48 = element("kt-palette");
    			t54 = space();
    			kt_palette49 = element("kt-palette");
    			t55 = space();
    			kt_palette50 = element("kt-palette");
    			t56 = space();
    			kt_palette51 = element("kt-palette");
    			t57 = space();
    			h22 = element("h2");
    			h22.textContent = "button shape";
    			t59 = space();
    			div9 = element("div");
    			kt_button0 = element("kt-button");
    			kt_button0.textContent = "default button";
    			t61 = space();
    			kt_button1 = element("kt-button");
    			kt_button1.textContent = "disabled button";
    			t63 = space();
    			kt_button2 = element("kt-button");
    			kt_button2.textContent = "custom button";
    			t65 = space();
    			div10 = element("div");
    			kt_button3 = element("kt-button");
    			kt_button3.textContent = "small button";
    			t67 = space();
    			kt_button4 = element("kt-button");
    			kt_button4.textContent = "medium button";
    			t69 = space();
    			kt_button5 = element("kt-button");
    			kt_button5.textContent = "large button";
    			t71 = space();
    			div11 = element("div");
    			kt_button6 = element("kt-button");
    			kt_button6.textContent = "default button";
    			t73 = space();
    			kt_button7 = element("kt-button");
    			kt_button7.textContent = "outline button";
    			t75 = space();
    			kt_button8 = element("kt-button");
    			kt_button8.textContent = "ghost button";
    			t77 = space();
    			div12 = element("div");
    			kt_button9 = element("kt-button");
    			kt_button9.textContent = "default button";
    			t79 = space();
    			kt_button10 = element("kt-button");
    			kt_button10.textContent = "outline button";
    			t81 = space();
    			kt_button11 = element("kt-button");
    			kt_button11.textContent = "ghost button";
    			t83 = space();
    			h23 = element("h2");
    			h23.textContent = "----------";
    			this.c = noop;
    			add_location(h1, file$3, 20, 0, 432);
    			add_location(h20, file$3, 23, 0, 532);
    			set_custom_element_data(kt_palette0, "color", "primary");
    			add_location(kt_palette0, file$3, 25, 2, 567);
    			set_custom_element_data(kt_palette1, "color", "secondary");
    			add_location(kt_palette1, file$3, 26, 2, 600);
    			set_custom_element_data(kt_palette2, "color", "success");
    			add_location(kt_palette2, file$3, 27, 2, 635);
    			set_custom_element_data(kt_palette3, "color", "info");
    			add_location(kt_palette3, file$3, 28, 2, 668);
    			set_custom_element_data(kt_palette4, "color", "warning");
    			add_location(kt_palette4, file$3, 29, 2, 698);
    			set_custom_element_data(kt_palette5, "color", "danger");
    			add_location(kt_palette5, file$3, 30, 2, 731);
    			attr_dev(div0, "class", "row");
    			add_location(div0, file$3, 24, 0, 547);
    			set_custom_element_data(kt_palette6, "color", "white");
    			add_location(kt_palette6, file$3, 34, 2, 789);
    			set_custom_element_data(kt_palette7, "color", "gray");
    			add_location(kt_palette7, file$3, 35, 2, 820);
    			set_custom_element_data(kt_palette8, "color", "black");
    			add_location(kt_palette8, file$3, 36, 2, 850);
    			set_custom_element_data(kt_palette9, "color", "#8E44AD");
    			set_custom_element_data(kt_palette9, "shade", "dark");
    			set_custom_element_data(kt_palette9, "opacity", "0.2");
    			add_location(kt_palette9, file$3, 37, 2, 881);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$3, 33, 0, 769);
    			add_location(h21, file$3, 40, 0, 947);
    			set_custom_element_data(kt_palette10, "color", "primary");
    			set_custom_element_data(kt_palette10, "shade", "lightest");
    			add_location(kt_palette10, file$3, 43, 2, 989);
    			set_custom_element_data(kt_palette11, "color", "primary");
    			set_custom_element_data(kt_palette11, "shade", "lighter");
    			add_location(kt_palette11, file$3, 44, 2, 1039);
    			set_custom_element_data(kt_palette12, "color", "primary");
    			set_custom_element_data(kt_palette12, "shade", "light");
    			add_location(kt_palette12, file$3, 45, 2, 1088);
    			set_custom_element_data(kt_palette13, "color", "primary");
    			add_location(kt_palette13, file$3, 46, 2, 1135);
    			set_custom_element_data(kt_palette14, "color", "primary");
    			set_custom_element_data(kt_palette14, "shade", "dark");
    			add_location(kt_palette14, file$3, 47, 2, 1168);
    			set_custom_element_data(kt_palette15, "color", "primary");
    			set_custom_element_data(kt_palette15, "shade", "darker");
    			add_location(kt_palette15, file$3, 48, 2, 1214);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$3, 42, 0, 969);
    			set_custom_element_data(kt_palette16, "color", "secondary");
    			set_custom_element_data(kt_palette16, "shade", "lightest");
    			add_location(kt_palette16, file$3, 52, 2, 1288);
    			set_custom_element_data(kt_palette17, "color", "secondary");
    			set_custom_element_data(kt_palette17, "shade", "lighter");
    			add_location(kt_palette17, file$3, 53, 2, 1340);
    			set_custom_element_data(kt_palette18, "color", "secondary");
    			set_custom_element_data(kt_palette18, "shade", "light");
    			add_location(kt_palette18, file$3, 54, 2, 1391);
    			set_custom_element_data(kt_palette19, "color", "secondary");
    			add_location(kt_palette19, file$3, 55, 2, 1440);
    			set_custom_element_data(kt_palette20, "color", "secondary");
    			set_custom_element_data(kt_palette20, "shade", "dark");
    			add_location(kt_palette20, file$3, 56, 2, 1475);
    			set_custom_element_data(kt_palette21, "color", "secondary");
    			set_custom_element_data(kt_palette21, "shade", "darker");
    			add_location(kt_palette21, file$3, 57, 2, 1523);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$3, 51, 0, 1268);
    			set_custom_element_data(kt_palette22, "color", "success");
    			set_custom_element_data(kt_palette22, "shade", "lightest");
    			add_location(kt_palette22, file$3, 61, 2, 1599);
    			set_custom_element_data(kt_palette23, "color", "success");
    			set_custom_element_data(kt_palette23, "shade", "lighter");
    			add_location(kt_palette23, file$3, 62, 2, 1649);
    			set_custom_element_data(kt_palette24, "color", "success");
    			set_custom_element_data(kt_palette24, "shade", "light");
    			add_location(kt_palette24, file$3, 63, 2, 1698);
    			set_custom_element_data(kt_palette25, "color", "success");
    			add_location(kt_palette25, file$3, 64, 2, 1745);
    			set_custom_element_data(kt_palette26, "color", "success");
    			set_custom_element_data(kt_palette26, "shade", "dark");
    			add_location(kt_palette26, file$3, 65, 2, 1778);
    			set_custom_element_data(kt_palette27, "color", "success");
    			set_custom_element_data(kt_palette27, "shade", "darker");
    			add_location(kt_palette27, file$3, 66, 2, 1824);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$3, 60, 0, 1579);
    			set_custom_element_data(kt_palette28, "color", "info");
    			set_custom_element_data(kt_palette28, "shade", "lightest");
    			add_location(kt_palette28, file$3, 70, 2, 1898);
    			set_custom_element_data(kt_palette29, "color", "info");
    			set_custom_element_data(kt_palette29, "shade", "lighter");
    			add_location(kt_palette29, file$3, 71, 2, 1945);
    			set_custom_element_data(kt_palette30, "color", "info");
    			set_custom_element_data(kt_palette30, "shade", "light");
    			add_location(kt_palette30, file$3, 72, 2, 1991);
    			set_custom_element_data(kt_palette31, "color", "info");
    			add_location(kt_palette31, file$3, 73, 2, 2035);
    			set_custom_element_data(kt_palette32, "color", "info");
    			set_custom_element_data(kt_palette32, "shade", "dark");
    			add_location(kt_palette32, file$3, 74, 2, 2065);
    			set_custom_element_data(kt_palette33, "color", "info");
    			set_custom_element_data(kt_palette33, "shade", "darker");
    			add_location(kt_palette33, file$3, 75, 2, 2108);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$3, 69, 0, 1878);
    			set_custom_element_data(kt_palette34, "color", "warning");
    			set_custom_element_data(kt_palette34, "shade", "lightest");
    			add_location(kt_palette34, file$3, 79, 2, 2179);
    			set_custom_element_data(kt_palette35, "color", "warning");
    			set_custom_element_data(kt_palette35, "shade", "lighter");
    			add_location(kt_palette35, file$3, 80, 2, 2229);
    			set_custom_element_data(kt_palette36, "color", "warning");
    			set_custom_element_data(kt_palette36, "shade", "light");
    			add_location(kt_palette36, file$3, 81, 2, 2278);
    			set_custom_element_data(kt_palette37, "color", "warning");
    			add_location(kt_palette37, file$3, 82, 2, 2325);
    			set_custom_element_data(kt_palette38, "color", "warning");
    			set_custom_element_data(kt_palette38, "shade", "dark");
    			add_location(kt_palette38, file$3, 83, 2, 2358);
    			set_custom_element_data(kt_palette39, "color", "warning");
    			set_custom_element_data(kt_palette39, "shade", "darker");
    			add_location(kt_palette39, file$3, 84, 2, 2404);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$3, 78, 0, 2159);
    			set_custom_element_data(kt_palette40, "color", "danger");
    			set_custom_element_data(kt_palette40, "shade", "lightest");
    			add_location(kt_palette40, file$3, 88, 2, 2478);
    			set_custom_element_data(kt_palette41, "color", "danger");
    			set_custom_element_data(kt_palette41, "shade", "lighter");
    			add_location(kt_palette41, file$3, 89, 2, 2527);
    			set_custom_element_data(kt_palette42, "color", "danger");
    			set_custom_element_data(kt_palette42, "shade", "light");
    			add_location(kt_palette42, file$3, 90, 2, 2575);
    			set_custom_element_data(kt_palette43, "color", "danger");
    			add_location(kt_palette43, file$3, 91, 2, 2621);
    			set_custom_element_data(kt_palette44, "color", "danger");
    			set_custom_element_data(kt_palette44, "shade", "dark");
    			add_location(kt_palette44, file$3, 92, 2, 2653);
    			set_custom_element_data(kt_palette45, "color", "danger");
    			set_custom_element_data(kt_palette45, "shade", "darker");
    			add_location(kt_palette45, file$3, 93, 2, 2698);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$3, 87, 0, 2458);
    			set_custom_element_data(kt_palette46, "color", "gray");
    			set_custom_element_data(kt_palette46, "shade", "lightest");
    			add_location(kt_palette46, file$3, 97, 2, 2771);
    			set_custom_element_data(kt_palette47, "color", "gray");
    			set_custom_element_data(kt_palette47, "shade", "lighter");
    			add_location(kt_palette47, file$3, 98, 2, 2818);
    			set_custom_element_data(kt_palette48, "color", "gray");
    			set_custom_element_data(kt_palette48, "shade", "light");
    			add_location(kt_palette48, file$3, 99, 2, 2864);
    			set_custom_element_data(kt_palette49, "color", "gray");
    			add_location(kt_palette49, file$3, 100, 2, 2908);
    			set_custom_element_data(kt_palette50, "color", "gray");
    			set_custom_element_data(kt_palette50, "shade", "dark");
    			add_location(kt_palette50, file$3, 101, 2, 2938);
    			set_custom_element_data(kt_palette51, "color", "gray");
    			set_custom_element_data(kt_palette51, "shade", "darker");
    			add_location(kt_palette51, file$3, 102, 2, 2981);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file$3, 96, 0, 2751);
    			add_location(h22, file$3, 105, 0, 3032);
    			add_location(kt_button0, file$3, 107, 2, 3074);
    			set_custom_element_data(kt_button1, "disabled", "true");
    			add_location(kt_button1, file$3, 108, 2, 3114);
    			set_custom_element_data(kt_button2, "size", "custom");
    			set_custom_element_data(kt_button2, "fontsize", "20");
    			set_custom_element_data(kt_button2, "radius", "20");
    			set_custom_element_data(kt_button2, "pt", "16");
    			set_custom_element_data(kt_button2, "pr", "24");
    			set_custom_element_data(kt_button2, "pb", "16");
    			set_custom_element_data(kt_button2, "pl", "24");
    			set_custom_element_data(kt_button2, "color", "#8E44AD");
    			add_location(kt_button2, file$3, 109, 2, 3171);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file$3, 106, 0, 3054);
    			set_custom_element_data(kt_button3, "size", "small");
    			add_location(kt_button3, file$3, 123, 2, 3364);
    			set_custom_element_data(kt_button4, "size", "medium");
    			add_location(kt_button4, file$3, 124, 2, 3415);
    			set_custom_element_data(kt_button5, "size", "large");
    			add_location(kt_button5, file$3, 125, 2, 3468);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$3, 122, 0, 3344);
    			set_custom_element_data(kt_button6, "type", "default");
    			set_custom_element_data(kt_button6, "color", "info");
    			add_location(kt_button6, file$3, 129, 2, 3545);
    			set_custom_element_data(kt_button7, "type", "outline");
    			set_custom_element_data(kt_button7, "color", "info");
    			add_location(kt_button7, file$3, 130, 2, 3613);
    			set_custom_element_data(kt_button8, "type", "ghost");
    			set_custom_element_data(kt_button8, "color", "info");
    			add_location(kt_button8, file$3, 131, 2, 3681);
    			attr_dev(div11, "class", "row");
    			add_location(div11, file$3, 128, 0, 3525);
    			set_custom_element_data(kt_button9, "type", "default");
    			set_custom_element_data(kt_button9, "color", "info");
    			set_custom_element_data(kt_button9, "size", "small");
    			set_custom_element_data(kt_button9, "disabled", "true");
    			add_location(kt_button9, file$3, 135, 2, 3771);
    			set_custom_element_data(kt_button10, "type", "outline");
    			set_custom_element_data(kt_button10, "color", "info");
    			set_custom_element_data(kt_button10, "size", "small");
    			set_custom_element_data(kt_button10, "disabled", "true");
    			add_location(kt_button10, file$3, 138, 2, 3876);
    			set_custom_element_data(kt_button11, "type", "ghost");
    			set_custom_element_data(kt_button11, "color", "info");
    			set_custom_element_data(kt_button11, "size", "small");
    			set_custom_element_data(kt_button11, "disabled", "true");
    			add_location(kt_button11, file$3, 141, 2, 3981);
    			attr_dev(div12, "class", "row");
    			add_location(div12, file$3, 134, 0, 3751);
    			add_location(h23, file$3, 146, 0, 4088);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, kt_palette0);
    			append_dev(div0, t4);
    			append_dev(div0, kt_palette1);
    			append_dev(div0, t5);
    			append_dev(div0, kt_palette2);
    			append_dev(div0, t6);
    			append_dev(div0, kt_palette3);
    			append_dev(div0, t7);
    			append_dev(div0, kt_palette4);
    			append_dev(div0, t8);
    			append_dev(div0, kt_palette5);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, kt_palette6);
    			append_dev(div1, t10);
    			append_dev(div1, kt_palette7);
    			append_dev(div1, t11);
    			append_dev(div1, kt_palette8);
    			append_dev(div1, t12);
    			append_dev(div1, kt_palette9);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, kt_palette10);
    			append_dev(div2, t16);
    			append_dev(div2, kt_palette11);
    			append_dev(div2, t17);
    			append_dev(div2, kt_palette12);
    			append_dev(div2, t18);
    			append_dev(div2, kt_palette13);
    			append_dev(div2, t19);
    			append_dev(div2, kt_palette14);
    			append_dev(div2, t20);
    			append_dev(div2, kt_palette15);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, kt_palette16);
    			append_dev(div3, t22);
    			append_dev(div3, kt_palette17);
    			append_dev(div3, t23);
    			append_dev(div3, kt_palette18);
    			append_dev(div3, t24);
    			append_dev(div3, kt_palette19);
    			append_dev(div3, t25);
    			append_dev(div3, kt_palette20);
    			append_dev(div3, t26);
    			append_dev(div3, kt_palette21);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, kt_palette22);
    			append_dev(div4, t28);
    			append_dev(div4, kt_palette23);
    			append_dev(div4, t29);
    			append_dev(div4, kt_palette24);
    			append_dev(div4, t30);
    			append_dev(div4, kt_palette25);
    			append_dev(div4, t31);
    			append_dev(div4, kt_palette26);
    			append_dev(div4, t32);
    			append_dev(div4, kt_palette27);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, kt_palette28);
    			append_dev(div5, t34);
    			append_dev(div5, kt_palette29);
    			append_dev(div5, t35);
    			append_dev(div5, kt_palette30);
    			append_dev(div5, t36);
    			append_dev(div5, kt_palette31);
    			append_dev(div5, t37);
    			append_dev(div5, kt_palette32);
    			append_dev(div5, t38);
    			append_dev(div5, kt_palette33);
    			insert_dev(target, t39, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, kt_palette34);
    			append_dev(div6, t40);
    			append_dev(div6, kt_palette35);
    			append_dev(div6, t41);
    			append_dev(div6, kt_palette36);
    			append_dev(div6, t42);
    			append_dev(div6, kt_palette37);
    			append_dev(div6, t43);
    			append_dev(div6, kt_palette38);
    			append_dev(div6, t44);
    			append_dev(div6, kt_palette39);
    			insert_dev(target, t45, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, kt_palette40);
    			append_dev(div7, t46);
    			append_dev(div7, kt_palette41);
    			append_dev(div7, t47);
    			append_dev(div7, kt_palette42);
    			append_dev(div7, t48);
    			append_dev(div7, kt_palette43);
    			append_dev(div7, t49);
    			append_dev(div7, kt_palette44);
    			append_dev(div7, t50);
    			append_dev(div7, kt_palette45);
    			insert_dev(target, t51, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, kt_palette46);
    			append_dev(div8, t52);
    			append_dev(div8, kt_palette47);
    			append_dev(div8, t53);
    			append_dev(div8, kt_palette48);
    			append_dev(div8, t54);
    			append_dev(div8, kt_palette49);
    			append_dev(div8, t55);
    			append_dev(div8, kt_palette50);
    			append_dev(div8, t56);
    			append_dev(div8, kt_palette51);
    			insert_dev(target, t57, anchor);
    			insert_dev(target, h22, anchor);
    			insert_dev(target, t59, anchor);
    			insert_dev(target, div9, anchor);
    			append_dev(div9, kt_button0);
    			append_dev(div9, t61);
    			append_dev(div9, kt_button1);
    			append_dev(div9, t63);
    			append_dev(div9, kt_button2);
    			insert_dev(target, t65, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, kt_button3);
    			append_dev(div10, t67);
    			append_dev(div10, kt_button4);
    			append_dev(div10, t69);
    			append_dev(div10, kt_button5);
    			insert_dev(target, t71, anchor);
    			insert_dev(target, div11, anchor);
    			append_dev(div11, kt_button6);
    			append_dev(div11, t73);
    			append_dev(div11, kt_button7);
    			append_dev(div11, t75);
    			append_dev(div11, kt_button8);
    			insert_dev(target, t77, anchor);
    			insert_dev(target, div12, anchor);
    			append_dev(div12, kt_button9);
    			append_dev(div12, t79);
    			append_dev(div12, kt_button10);
    			append_dev(div12, t81);
    			append_dev(div12, kt_button11);
    			insert_dev(target, t83, anchor);
    			insert_dev(target, h23, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t39);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t45);
    			if (detaching) detach_dev(div7);
    			if (detaching) detach_dev(t51);
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t57);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t59);
    			if (detaching) detach_dev(div9);
    			if (detaching) detach_dev(t65);
    			if (detaching) detach_dev(div10);
    			if (detaching) detach_dev(t71);
    			if (detaching) detach_dev(div11);
    			if (detaching) detach_dev(t77);
    			if (detaching) detach_dev(div12);
    			if (detaching) detach_dev(t83);
    			if (detaching) detach_dev(h23);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>h1{color:black}.row{display:flex;flex-direction:row;align-items:center}kt-button{margin:4px}</style>`;
    		init(this, { target: this.shadowRoot }, null, create_fragment$3, safe_not_equal, {});

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("kt-component", App);

    exports.App = App;

    return exports;

}({}));
//# sourceMappingURL=bundle.js.map
