
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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

    /* src/components/Button/Button.svelte generated by Svelte v3.18.2 */

    const file = "src/components/Button/Button.svelte";

    function create_fragment(ctx) {
    	let button;
    	let slot;

    	const block = {
    		c: function create() {
    			button = element("button");
    			slot = element("slot");
    			this.c = noop;
    			add_location(slot, file, 39, 2, 979);
    			set_style(button, "--color", /*color*/ ctx[0]);
    			set_style(button, "--fontcolor", /*fontcolor*/ ctx[1]);
    			add_location(button, file, 38, 0, 917);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, slot);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 1) {
    				set_style(button, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*fontcolor*/ 2) {
    				set_style(button, "--fontcolor", /*fontcolor*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
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
    	let { big = false } = $$props;
    	let { ghost = false } = $$props;
    	let { type = "filled" } = $$props;
    	let { color = "success" } = $$props;
    	let { size = "medium" } = $$props;
    	let { fontcolor = "white" } = $$props;
    	const writable_props = ["big", "ghost", "type", "color", "size", "fontcolor"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<my-button> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("big" in $$props) $$invalidate(2, big = $$props.big);
    		if ("ghost" in $$props) $$invalidate(3, ghost = $$props.ghost);
    		if ("type" in $$props) $$invalidate(4, type = $$props.type);
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("size" in $$props) $$invalidate(5, size = $$props.size);
    		if ("fontcolor" in $$props) $$invalidate(1, fontcolor = $$props.fontcolor);
    	};

    	$$self.$capture_state = () => {
    		return { big, ghost, type, color, size, fontcolor };
    	};

    	$$self.$inject_state = $$props => {
    		if ("big" in $$props) $$invalidate(2, big = $$props.big);
    		if ("ghost" in $$props) $$invalidate(3, ghost = $$props.ghost);
    		if ("type" in $$props) $$invalidate(4, type = $$props.type);
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("size" in $$props) $$invalidate(5, size = $$props.size);
    		if ("fontcolor" in $$props) $$invalidate(1, fontcolor = $$props.fontcolor);
    	};

    	return [color, fontcolor, big, ghost, type, size];
    }

    class Button extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>@use "sass:meta";button{padding:0.5rem;background:#ff8879;color:var(--fontcolor)}</style>`;

    		init(this, { target: this.shadowRoot }, instance, create_fragment, safe_not_equal, {
    			big: 2,
    			ghost: 3,
    			type: 4,
    			color: 0,
    			size: 5,
    			fontcolor: 1
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
    		return ["big", "ghost", "type", "color", "size", "fontcolor"];
    	}

    	get big() {
    		return this.$$.ctx[2];
    	}

    	set big(big) {
    		this.$set({ big });
    		flush();
    	}

    	get ghost() {
    		return this.$$.ctx[3];
    	}

    	set ghost(ghost) {
    		this.$set({ ghost });
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
    		return this.$$.ctx[0];
    	}

    	set color(color) {
    		this.$set({ color });
    		flush();
    	}

    	get size() {
    		return this.$$.ctx[5];
    	}

    	set size(size) {
    		this.$set({ size });
    		flush();
    	}

    	get fontcolor() {
    		return this.$$.ctx[1];
    	}

    	set fontcolor(fontcolor) {
    		this.$set({ fontcolor });
    		flush();
    	}
    }

    customElements.define("my-button", Button);

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

    /* src/components/Palette/palette.svelte generated by Svelte v3.18.2 */
    const file$2 = "src/components/Palette/palette.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let cssVars_action;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			this.c = noop;
    			toggle_class(div, "primary-lightest", /*color*/ ctx[0] === "primaryLightest");
    			toggle_class(div, "primary-lighter", /*color*/ ctx[0] === "primaryLighter");
    			toggle_class(div, "primary-light", /*color*/ ctx[0] === "primaryLight");
    			toggle_class(div, "primary", /*color*/ ctx[0] === "primary");
    			toggle_class(div, "primary-dark", /*color*/ ctx[0] === "primaryDark");
    			toggle_class(div, "primary-darker", /*color*/ ctx[0] === "primaryDarker");
    			toggle_class(div, "secondary-lightest", /*color*/ ctx[0] === "secondaryLightest");
    			toggle_class(div, "secondary-lighter", /*color*/ ctx[0] === "secondaryLighter");
    			toggle_class(div, "secondary-light", /*color*/ ctx[0] === "secondaryLight");
    			toggle_class(div, "secondary", /*color*/ ctx[0] === "secondary");
    			toggle_class(div, "secondary-dark", /*color*/ ctx[0] === "secondaryDark");
    			toggle_class(div, "secondary-darker", /*color*/ ctx[0] === "secondaryDarker");
    			toggle_class(div, "success-lightest", /*color*/ ctx[0] === "successLightest");
    			toggle_class(div, "success-lighter", /*color*/ ctx[0] === "successLighter");
    			toggle_class(div, "success-light", /*color*/ ctx[0] === "successLight");
    			toggle_class(div, "success", /*color*/ ctx[0] === "success");
    			toggle_class(div, "success-dark", /*color*/ ctx[0] === "successDark");
    			toggle_class(div, "success-darker", /*color*/ ctx[0] === "successDarker");
    			toggle_class(div, "info-lightest", /*color*/ ctx[0] === "infoLightest");
    			toggle_class(div, "info-lighter", /*color*/ ctx[0] === "infoLighter");
    			toggle_class(div, "info-light", /*color*/ ctx[0] === "infoLight");
    			toggle_class(div, "info", /*color*/ ctx[0] === "info");
    			toggle_class(div, "info-dark", /*color*/ ctx[0] === "infoDark");
    			toggle_class(div, "info-darker", /*color*/ ctx[0] === "infoDarker");
    			toggle_class(div, "warning-lightest", /*color*/ ctx[0] === "warningLightest");
    			toggle_class(div, "warning-lighter", /*color*/ ctx[0] === "warningLighter");
    			toggle_class(div, "warning-light", /*color*/ ctx[0] === "warningLight");
    			toggle_class(div, "warning", /*color*/ ctx[0] === "warning");
    			toggle_class(div, "warning-dark", /*color*/ ctx[0] === "warningDark");
    			toggle_class(div, "warning-darker", /*color*/ ctx[0] === "warningDarker");
    			toggle_class(div, "danger-lightest", /*color*/ ctx[0] === "dangerLightest");
    			toggle_class(div, "danger-lighter", /*color*/ ctx[0] === "dangerLighter");
    			toggle_class(div, "danger-light", /*color*/ ctx[0] === "dangerLight");
    			toggle_class(div, "danger", /*color*/ ctx[0] === "danger");
    			toggle_class(div, "danger-dark", /*color*/ ctx[0] === "dangerDark");
    			toggle_class(div, "danger-darker", /*color*/ ctx[0] === "dangerDarker");
    			toggle_class(div, "white", /*color*/ ctx[0] === "white");
    			toggle_class(div, "gray-lightest", /*color*/ ctx[0] === "grayLightest");
    			toggle_class(div, "gray-lighter", /*color*/ ctx[0] === "grayLighter");
    			toggle_class(div, "gray-light", /*color*/ ctx[0] === "grayLight");
    			toggle_class(div, "gray", /*color*/ ctx[0] === "gray");
    			toggle_class(div, "gray-dark", /*color*/ ctx[0] === "grayDark");
    			toggle_class(div, "gray-darker", /*color*/ ctx[0] === "grayDarker");
    			toggle_class(div, "black", /*color*/ ctx[0] === "black");
    			toggle_class(div, "custom", /*color*/ ctx[0] === "custom");
    			add_location(div, file$2, 172, 0, 3397);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			dispose = action_destroyer(cssVars_action = cssVars.call(null, div, /*styleVars*/ ctx[1]));
    		},
    		p: function update(ctx, [dirty]) {
    			if (cssVars_action && is_function(cssVars_action.update) && dirty & /*styleVars*/ 2) cssVars_action.update.call(null, /*styleVars*/ ctx[1]);

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "primary-lightest", /*color*/ ctx[0] === "primaryLightest");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "primary-lighter", /*color*/ ctx[0] === "primaryLighter");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "primary-light", /*color*/ ctx[0] === "primaryLight");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "primary", /*color*/ ctx[0] === "primary");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "primary-dark", /*color*/ ctx[0] === "primaryDark");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "primary-darker", /*color*/ ctx[0] === "primaryDarker");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "secondary-lightest", /*color*/ ctx[0] === "secondaryLightest");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "secondary-lighter", /*color*/ ctx[0] === "secondaryLighter");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "secondary-light", /*color*/ ctx[0] === "secondaryLight");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "secondary", /*color*/ ctx[0] === "secondary");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "secondary-dark", /*color*/ ctx[0] === "secondaryDark");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "secondary-darker", /*color*/ ctx[0] === "secondaryDarker");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "success-lightest", /*color*/ ctx[0] === "successLightest");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "success-lighter", /*color*/ ctx[0] === "successLighter");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "success-light", /*color*/ ctx[0] === "successLight");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "success", /*color*/ ctx[0] === "success");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "success-dark", /*color*/ ctx[0] === "successDark");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "success-darker", /*color*/ ctx[0] === "successDarker");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "info-lightest", /*color*/ ctx[0] === "infoLightest");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "info-lighter", /*color*/ ctx[0] === "infoLighter");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "info-light", /*color*/ ctx[0] === "infoLight");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "info", /*color*/ ctx[0] === "info");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "info-dark", /*color*/ ctx[0] === "infoDark");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "info-darker", /*color*/ ctx[0] === "infoDarker");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "warning-lightest", /*color*/ ctx[0] === "warningLightest");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "warning-lighter", /*color*/ ctx[0] === "warningLighter");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "warning-light", /*color*/ ctx[0] === "warningLight");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "warning", /*color*/ ctx[0] === "warning");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "warning-dark", /*color*/ ctx[0] === "warningDark");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "warning-darker", /*color*/ ctx[0] === "warningDarker");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "danger-lightest", /*color*/ ctx[0] === "dangerLightest");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "danger-lighter", /*color*/ ctx[0] === "dangerLighter");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "danger-light", /*color*/ ctx[0] === "dangerLight");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "danger", /*color*/ ctx[0] === "danger");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "danger-dark", /*color*/ ctx[0] === "dangerDark");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "danger-darker", /*color*/ ctx[0] === "dangerDarker");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "white", /*color*/ ctx[0] === "white");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "gray-lightest", /*color*/ ctx[0] === "grayLightest");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "gray-lighter", /*color*/ ctx[0] === "grayLighter");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "gray-light", /*color*/ ctx[0] === "grayLight");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "gray", /*color*/ ctx[0] === "gray");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "gray-dark", /*color*/ ctx[0] === "grayDark");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "gray-darker", /*color*/ ctx[0] === "grayDarker");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "black", /*color*/ ctx[0] === "black");
    			}

    			if (dirty & /*color*/ 1) {
    				toggle_class(div, "custom", /*color*/ ctx[0] === "custom");
    			}
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
    	let { colorcode = "#5c80ff" } = $$props;
    	let { shade = "light" } = $$props;
    	let { opacity = "30%" } = $$props;
    	const writable_props = ["width", "height", "radius", "color", "colorcode", "shade", "opacity"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<kt-palette> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    		if ("height" in $$props) $$invalidate(3, height = $$props.height);
    		if ("radius" in $$props) $$invalidate(4, radius = $$props.radius);
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("colorcode" in $$props) $$invalidate(5, colorcode = $$props.colorcode);
    		if ("shade" in $$props) $$invalidate(6, shade = $$props.shade);
    		if ("opacity" in $$props) $$invalidate(7, opacity = $$props.opacity);
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
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    		if ("height" in $$props) $$invalidate(3, height = $$props.height);
    		if ("radius" in $$props) $$invalidate(4, radius = $$props.radius);
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("colorcode" in $$props) $$invalidate(5, colorcode = $$props.colorcode);
    		if ("shade" in $$props) $$invalidate(6, shade = $$props.shade);
    		if ("opacity" in $$props) $$invalidate(7, opacity = $$props.opacity);
    		if ("styleVars" in $$props) $$invalidate(1, styleVars = $$props.styleVars);
    	};

    	let styleVars;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*width, height, radius, color, colorcode, shade, opacity*/ 253) {
    			 $$invalidate(1, styleVars = {
    				width: `${width}px`,
    				height: `${height}px`,
    				radius: `${radius}px`,
    				color,
    				colorcode,
    				shade,
    				opacity
    			});
    		}
    	};

    	return [color, styleVars, width, height, radius, colorcode, shade, opacity];
    }

    class Palette extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>div{width:var(--width);height:var(--height);border-radius:var(--radius);margin:4px}.primary-lightest{background-color:#ffedeb}.primary-lighter{background-color:#ffd5d0}.primary-light{background-color:#ffb8af}.primary{background-color:#ff8879}.primary-dark{background-color:#b35f55}.primary-darker{background-color:#80443d}.secondary-lightest{background-color:#d9f0f2}.secondary-lighter{background-color:#a6dce0}.secondary-light{background-color:#66c3ca}.secondary{background-color:#009ba6}.secondary-dark{background-color:#006d74}.secondary-darker{background-color:#004e53}.success-lightest{background-color:#d9faf7}.success-lighter{background-color:#a6f3eb}.success-light{background-color:#66eadd}.success{background-color:#00dcc7}.success-dark{background-color:#009a8b}.success-darker{background-color:#006e64}.info-lightest{background-color:#e7ecff}.info-lighter{background-color:#c6d3ff}.info-light{background-color:#9db3ff}.info{background-color:#5c80ff}.info-dark{background-color:#405ab3}.info-darker{background-color:#2e4080}.warning-lightest{background-color:#fff8e7}.warning-lighter{background-color:#ffeec6}.warning-light{background-color:#ffe29d}.warning{background-color:#ffcf5c}.warning-dark{background-color:#b39140}.warning-darker{background-color:#80682e}.danger-lightest{background-color:#ffe8eb}.danger-lighter{background-color:#ffc9d1}.danger-light{background-color:#ffa2b0}.danger{background-color:#ff647c}.danger-dark{background-color:#b34657}.danger-darker{background-color:#80323e}.white{background-color:#ffffff}.gray-lightest{background-color:#ececec}.gray-lighter{background-color:lightgray}.gray-light{background-color:#b3b3b3}.gray{background-color:#818181}.gray-dark{background-color:#5a5a5a}.gray-darker{background-color:#414141}.black{background-color:#232323}.custom{background-color:#8da6ff}</style>`;

    		init(this, { target: this.shadowRoot }, instance$2, create_fragment$2, safe_not_equal, {
    			width: 2,
    			height: 3,
    			radius: 4,
    			color: 0,
    			colorcode: 5,
    			shade: 6,
    			opacity: 7
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
    		return this.$$.ctx[2];
    	}

    	set width(width) {
    		this.$set({ width });
    		flush();
    	}

    	get height() {
    		return this.$$.ctx[3];
    	}

    	set height(height) {
    		this.$set({ height });
    		flush();
    	}

    	get radius() {
    		return this.$$.ctx[4];
    	}

    	set radius(radius) {
    		this.$set({ radius });
    		flush();
    	}

    	get color() {
    		return this.$$.ctx[0];
    	}

    	set color(color) {
    		this.$set({ color });
    		flush();
    	}

    	get colorcode() {
    		return this.$$.ctx[5];
    	}

    	set colorcode(colorcode) {
    		this.$set({ colorcode });
    		flush();
    	}

    	get shade() {
    		return this.$$.ctx[6];
    	}

    	set shade(shade) {
    		this.$set({ shade });
    		flush();
    	}

    	get opacity() {
    		return this.$$.ctx[7];
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
    	let div0;
    	let kt_palette0;
    	let t2;
    	let kt_palette1;
    	let t3;
    	let kt_palette2;
    	let t4;
    	let kt_palette3;
    	let t5;
    	let kt_palette4;
    	let t6;
    	let kt_palette5;
    	let t7;
    	let div1;
    	let kt_palette6;
    	let t8;
    	let kt_palette7;
    	let t9;
    	let kt_palette8;
    	let t10;
    	let kt_palette9;
    	let t11;
    	let kt_palette10;
    	let t12;
    	let kt_palette11;
    	let t13;
    	let div2;
    	let kt_palette12;
    	let t14;
    	let kt_palette13;
    	let t15;
    	let kt_palette14;
    	let t16;
    	let kt_palette15;
    	let t17;
    	let kt_palette16;
    	let t18;
    	let kt_palette17;
    	let t19;
    	let div3;
    	let kt_palette18;
    	let t20;
    	let kt_palette19;
    	let t21;
    	let kt_palette20;
    	let t22;
    	let kt_palette21;
    	let t23;
    	let kt_palette22;
    	let t24;
    	let kt_palette23;
    	let t25;
    	let div4;
    	let kt_palette24;
    	let t26;
    	let kt_palette25;
    	let t27;
    	let kt_palette26;
    	let t28;
    	let kt_palette27;
    	let t29;
    	let kt_palette28;
    	let t30;
    	let kt_palette29;
    	let t31;
    	let div5;
    	let kt_palette30;
    	let t32;
    	let kt_palette31;
    	let t33;
    	let kt_palette32;
    	let t34;
    	let kt_palette33;
    	let t35;
    	let kt_palette34;
    	let t36;
    	let kt_palette35;
    	let t37;
    	let div6;
    	let kt_palette36;
    	let t38;
    	let kt_palette37;
    	let t39;
    	let kt_palette38;
    	let t40;
    	let kt_palette39;
    	let t41;
    	let kt_palette40;
    	let t42;
    	let kt_palette41;
    	let t43;
    	let h2;
    	let t45;
    	let div7;
    	let kt_palette42;
    	let t46;
    	let kt_palette43;
    	let t47;
    	let kt_palette44;
    	let t48;
    	let kt_palette45;
    	let t49;
    	let kt_palette46;
    	let t50;
    	let kt_palette47;
    	let t51;
    	let div8;
    	let kt_palette48;
    	let t52;
    	let kt_palette49;
    	let t53;
    	let kt_palette50;
    	let t54;
    	let kt_palette51;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "kt-component";
    			t1 = space();
    			div0 = element("div");
    			kt_palette0 = element("kt-palette");
    			t2 = space();
    			kt_palette1 = element("kt-palette");
    			t3 = space();
    			kt_palette2 = element("kt-palette");
    			t4 = space();
    			kt_palette3 = element("kt-palette");
    			t5 = space();
    			kt_palette4 = element("kt-palette");
    			t6 = space();
    			kt_palette5 = element("kt-palette");
    			t7 = space();
    			div1 = element("div");
    			kt_palette6 = element("kt-palette");
    			t8 = space();
    			kt_palette7 = element("kt-palette");
    			t9 = space();
    			kt_palette8 = element("kt-palette");
    			t10 = space();
    			kt_palette9 = element("kt-palette");
    			t11 = space();
    			kt_palette10 = element("kt-palette");
    			t12 = space();
    			kt_palette11 = element("kt-palette");
    			t13 = space();
    			div2 = element("div");
    			kt_palette12 = element("kt-palette");
    			t14 = space();
    			kt_palette13 = element("kt-palette");
    			t15 = space();
    			kt_palette14 = element("kt-palette");
    			t16 = space();
    			kt_palette15 = element("kt-palette");
    			t17 = space();
    			kt_palette16 = element("kt-palette");
    			t18 = space();
    			kt_palette17 = element("kt-palette");
    			t19 = space();
    			div3 = element("div");
    			kt_palette18 = element("kt-palette");
    			t20 = space();
    			kt_palette19 = element("kt-palette");
    			t21 = space();
    			kt_palette20 = element("kt-palette");
    			t22 = space();
    			kt_palette21 = element("kt-palette");
    			t23 = space();
    			kt_palette22 = element("kt-palette");
    			t24 = space();
    			kt_palette23 = element("kt-palette");
    			t25 = space();
    			div4 = element("div");
    			kt_palette24 = element("kt-palette");
    			t26 = space();
    			kt_palette25 = element("kt-palette");
    			t27 = space();
    			kt_palette26 = element("kt-palette");
    			t28 = space();
    			kt_palette27 = element("kt-palette");
    			t29 = space();
    			kt_palette28 = element("kt-palette");
    			t30 = space();
    			kt_palette29 = element("kt-palette");
    			t31 = space();
    			div5 = element("div");
    			kt_palette30 = element("kt-palette");
    			t32 = space();
    			kt_palette31 = element("kt-palette");
    			t33 = space();
    			kt_palette32 = element("kt-palette");
    			t34 = space();
    			kt_palette33 = element("kt-palette");
    			t35 = space();
    			kt_palette34 = element("kt-palette");
    			t36 = space();
    			kt_palette35 = element("kt-palette");
    			t37 = space();
    			div6 = element("div");
    			kt_palette36 = element("kt-palette");
    			t38 = space();
    			kt_palette37 = element("kt-palette");
    			t39 = space();
    			kt_palette38 = element("kt-palette");
    			t40 = space();
    			kt_palette39 = element("kt-palette");
    			t41 = space();
    			kt_palette40 = element("kt-palette");
    			t42 = space();
    			kt_palette41 = element("kt-palette");
    			t43 = space();
    			h2 = element("h2");
    			h2.textContent = "Color";
    			t45 = space();
    			div7 = element("div");
    			kt_palette42 = element("kt-palette");
    			t46 = space();
    			kt_palette43 = element("kt-palette");
    			t47 = space();
    			kt_palette44 = element("kt-palette");
    			t48 = space();
    			kt_palette45 = element("kt-palette");
    			t49 = space();
    			kt_palette46 = element("kt-palette");
    			t50 = space();
    			kt_palette47 = element("kt-palette");
    			t51 = space();
    			div8 = element("div");
    			kt_palette48 = element("kt-palette");
    			t52 = space();
    			kt_palette49 = element("kt-palette");
    			t53 = space();
    			kt_palette50 = element("kt-palette");
    			t54 = space();
    			kt_palette51 = element("kt-palette");
    			this.c = noop;
    			add_location(h1, file$3, 17, 0, 416);
    			set_custom_element_data(kt_palette0, "color", "primaryLightest");
    			add_location(kt_palette0, file$3, 26, 2, 786);
    			set_custom_element_data(kt_palette1, "color", "primaryLighter");
    			add_location(kt_palette1, file$3, 27, 2, 827);
    			set_custom_element_data(kt_palette2, "color", "primaryLight");
    			add_location(kt_palette2, file$3, 28, 2, 867);
    			set_custom_element_data(kt_palette3, "color", "primary");
    			add_location(kt_palette3, file$3, 29, 2, 905);
    			set_custom_element_data(kt_palette4, "color", "primaryDark");
    			add_location(kt_palette4, file$3, 30, 2, 938);
    			set_custom_element_data(kt_palette5, "color", "primaryDarker");
    			add_location(kt_palette5, file$3, 31, 2, 975);
    			attr_dev(div0, "class", "palette");
    			add_location(div0, file$3, 25, 0, 762);
    			set_custom_element_data(kt_palette6, "color", "secondaryLightest");
    			add_location(kt_palette6, file$3, 35, 2, 1044);
    			set_custom_element_data(kt_palette7, "color", "secondaryLighter");
    			add_location(kt_palette7, file$3, 36, 2, 1087);
    			set_custom_element_data(kt_palette8, "color", "secondaryLight");
    			add_location(kt_palette8, file$3, 37, 2, 1129);
    			set_custom_element_data(kt_palette9, "color", "secondary");
    			add_location(kt_palette9, file$3, 38, 2, 1169);
    			set_custom_element_data(kt_palette10, "color", "secondaryDark");
    			add_location(kt_palette10, file$3, 39, 2, 1204);
    			set_custom_element_data(kt_palette11, "color", "secondaryDarker");
    			add_location(kt_palette11, file$3, 40, 2, 1243);
    			attr_dev(div1, "class", "palette");
    			add_location(div1, file$3, 34, 0, 1020);
    			set_custom_element_data(kt_palette12, "color", "successLightest");
    			add_location(kt_palette12, file$3, 44, 2, 1314);
    			set_custom_element_data(kt_palette13, "color", "successLighter");
    			add_location(kt_palette13, file$3, 45, 2, 1355);
    			set_custom_element_data(kt_palette14, "color", "successLight");
    			add_location(kt_palette14, file$3, 46, 2, 1395);
    			set_custom_element_data(kt_palette15, "color", "success");
    			add_location(kt_palette15, file$3, 47, 2, 1433);
    			set_custom_element_data(kt_palette16, "color", "successDark");
    			add_location(kt_palette16, file$3, 48, 2, 1466);
    			set_custom_element_data(kt_palette17, "color", "successDarker");
    			add_location(kt_palette17, file$3, 49, 2, 1503);
    			attr_dev(div2, "class", "palette");
    			add_location(div2, file$3, 43, 0, 1290);
    			set_custom_element_data(kt_palette18, "color", "infoLightest");
    			add_location(kt_palette18, file$3, 53, 2, 1572);
    			set_custom_element_data(kt_palette19, "color", "infoLighter");
    			add_location(kt_palette19, file$3, 54, 2, 1610);
    			set_custom_element_data(kt_palette20, "color", "infoLight");
    			add_location(kt_palette20, file$3, 55, 2, 1647);
    			set_custom_element_data(kt_palette21, "color", "info");
    			add_location(kt_palette21, file$3, 56, 2, 1682);
    			set_custom_element_data(kt_palette22, "color", "infoDark");
    			add_location(kt_palette22, file$3, 57, 2, 1712);
    			set_custom_element_data(kt_palette23, "color", "infoDarker");
    			add_location(kt_palette23, file$3, 58, 2, 1746);
    			attr_dev(div3, "class", "palette");
    			add_location(div3, file$3, 52, 0, 1548);
    			set_custom_element_data(kt_palette24, "color", "warningLightest");
    			add_location(kt_palette24, file$3, 62, 2, 1812);
    			set_custom_element_data(kt_palette25, "color", "warningLighter");
    			add_location(kt_palette25, file$3, 63, 2, 1853);
    			set_custom_element_data(kt_palette26, "color", "warningLight");
    			add_location(kt_palette26, file$3, 64, 2, 1893);
    			set_custom_element_data(kt_palette27, "color", "warning");
    			add_location(kt_palette27, file$3, 65, 2, 1931);
    			set_custom_element_data(kt_palette28, "color", "warningDark");
    			add_location(kt_palette28, file$3, 66, 2, 1964);
    			set_custom_element_data(kt_palette29, "color", "warningDarker");
    			add_location(kt_palette29, file$3, 67, 2, 2001);
    			attr_dev(div4, "class", "palette");
    			add_location(div4, file$3, 61, 0, 1788);
    			set_custom_element_data(kt_palette30, "color", "dangerLightest");
    			add_location(kt_palette30, file$3, 71, 2, 2070);
    			set_custom_element_data(kt_palette31, "color", "dangerLighter");
    			add_location(kt_palette31, file$3, 72, 2, 2110);
    			set_custom_element_data(kt_palette32, "color", "dangerLight");
    			add_location(kt_palette32, file$3, 73, 2, 2149);
    			set_custom_element_data(kt_palette33, "color", "danger");
    			add_location(kt_palette33, file$3, 74, 2, 2186);
    			set_custom_element_data(kt_palette34, "color", "dangerDark");
    			add_location(kt_palette34, file$3, 75, 2, 2218);
    			set_custom_element_data(kt_palette35, "color", "dangerDarker");
    			add_location(kt_palette35, file$3, 76, 2, 2254);
    			attr_dev(div5, "class", "palette");
    			add_location(div5, file$3, 70, 0, 2046);
    			set_custom_element_data(kt_palette36, "color", "grayLightest");
    			add_location(kt_palette36, file$3, 81, 2, 2323);
    			set_custom_element_data(kt_palette37, "color", "grayLighter");
    			add_location(kt_palette37, file$3, 82, 2, 2361);
    			set_custom_element_data(kt_palette38, "color", "grayLight");
    			add_location(kt_palette38, file$3, 83, 2, 2398);
    			set_custom_element_data(kt_palette39, "color", "gray");
    			add_location(kt_palette39, file$3, 84, 2, 2433);
    			set_custom_element_data(kt_palette40, "color", "grayDark");
    			add_location(kt_palette40, file$3, 85, 2, 2463);
    			set_custom_element_data(kt_palette41, "color", "grayDarker");
    			add_location(kt_palette41, file$3, 86, 2, 2497);
    			attr_dev(div6, "class", "palette");
    			add_location(div6, file$3, 79, 0, 2298);
    			add_location(h2, file$3, 90, 0, 2540);
    			set_custom_element_data(kt_palette42, "color", "primary");
    			add_location(kt_palette42, file$3, 92, 2, 2579);
    			set_custom_element_data(kt_palette43, "color", "secondary");
    			add_location(kt_palette43, file$3, 93, 2, 2612);
    			set_custom_element_data(kt_palette44, "color", "success");
    			add_location(kt_palette44, file$3, 94, 2, 2647);
    			set_custom_element_data(kt_palette45, "color", "info");
    			add_location(kt_palette45, file$3, 95, 2, 2680);
    			set_custom_element_data(kt_palette46, "color", "warning");
    			add_location(kt_palette46, file$3, 96, 2, 2710);
    			set_custom_element_data(kt_palette47, "color", "danger");
    			add_location(kt_palette47, file$3, 97, 2, 2743);
    			attr_dev(div7, "class", "palette");
    			add_location(div7, file$3, 91, 0, 2555);
    			set_custom_element_data(kt_palette48, "color", "white");
    			add_location(kt_palette48, file$3, 101, 2, 2805);
    			set_custom_element_data(kt_palette49, "color", "gray");
    			add_location(kt_palette49, file$3, 102, 2, 2836);
    			set_custom_element_data(kt_palette50, "color", "black");
    			add_location(kt_palette50, file$3, 103, 2, 2866);
    			attr_dev(div8, "class", "palette");
    			add_location(div8, file$3, 100, 0, 2781);
    			set_custom_element_data(kt_palette51, "color", "custom");
    			set_custom_element_data(kt_palette51, "colorcode", "red");
    			set_custom_element_data(kt_palette51, "shade", "dark");
    			set_custom_element_data(kt_palette51, "opacity", "30%");
    			add_location(kt_palette51, file$3, 106, 0, 2903);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, kt_palette0);
    			append_dev(div0, t2);
    			append_dev(div0, kt_palette1);
    			append_dev(div0, t3);
    			append_dev(div0, kt_palette2);
    			append_dev(div0, t4);
    			append_dev(div0, kt_palette3);
    			append_dev(div0, t5);
    			append_dev(div0, kt_palette4);
    			append_dev(div0, t6);
    			append_dev(div0, kt_palette5);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, kt_palette6);
    			append_dev(div1, t8);
    			append_dev(div1, kt_palette7);
    			append_dev(div1, t9);
    			append_dev(div1, kt_palette8);
    			append_dev(div1, t10);
    			append_dev(div1, kt_palette9);
    			append_dev(div1, t11);
    			append_dev(div1, kt_palette10);
    			append_dev(div1, t12);
    			append_dev(div1, kt_palette11);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, kt_palette12);
    			append_dev(div2, t14);
    			append_dev(div2, kt_palette13);
    			append_dev(div2, t15);
    			append_dev(div2, kt_palette14);
    			append_dev(div2, t16);
    			append_dev(div2, kt_palette15);
    			append_dev(div2, t17);
    			append_dev(div2, kt_palette16);
    			append_dev(div2, t18);
    			append_dev(div2, kt_palette17);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, kt_palette18);
    			append_dev(div3, t20);
    			append_dev(div3, kt_palette19);
    			append_dev(div3, t21);
    			append_dev(div3, kt_palette20);
    			append_dev(div3, t22);
    			append_dev(div3, kt_palette21);
    			append_dev(div3, t23);
    			append_dev(div3, kt_palette22);
    			append_dev(div3, t24);
    			append_dev(div3, kt_palette23);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, kt_palette24);
    			append_dev(div4, t26);
    			append_dev(div4, kt_palette25);
    			append_dev(div4, t27);
    			append_dev(div4, kt_palette26);
    			append_dev(div4, t28);
    			append_dev(div4, kt_palette27);
    			append_dev(div4, t29);
    			append_dev(div4, kt_palette28);
    			append_dev(div4, t30);
    			append_dev(div4, kt_palette29);
    			insert_dev(target, t31, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, kt_palette30);
    			append_dev(div5, t32);
    			append_dev(div5, kt_palette31);
    			append_dev(div5, t33);
    			append_dev(div5, kt_palette32);
    			append_dev(div5, t34);
    			append_dev(div5, kt_palette33);
    			append_dev(div5, t35);
    			append_dev(div5, kt_palette34);
    			append_dev(div5, t36);
    			append_dev(div5, kt_palette35);
    			insert_dev(target, t37, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, kt_palette36);
    			append_dev(div6, t38);
    			append_dev(div6, kt_palette37);
    			append_dev(div6, t39);
    			append_dev(div6, kt_palette38);
    			append_dev(div6, t40);
    			append_dev(div6, kt_palette39);
    			append_dev(div6, t41);
    			append_dev(div6, kt_palette40);
    			append_dev(div6, t42);
    			append_dev(div6, kt_palette41);
    			insert_dev(target, t43, anchor);
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t45, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, kt_palette42);
    			append_dev(div7, t46);
    			append_dev(div7, kt_palette43);
    			append_dev(div7, t47);
    			append_dev(div7, kt_palette44);
    			append_dev(div7, t48);
    			append_dev(div7, kt_palette45);
    			append_dev(div7, t49);
    			append_dev(div7, kt_palette46);
    			append_dev(div7, t50);
    			append_dev(div7, kt_palette47);
    			insert_dev(target, t51, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, kt_palette48);
    			append_dev(div8, t52);
    			append_dev(div8, kt_palette49);
    			append_dev(div8, t53);
    			append_dev(div8, kt_palette50);
    			insert_dev(target, t54, anchor);
    			insert_dev(target, kt_palette51, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t37);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t43);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t45);
    			if (detaching) detach_dev(div7);
    			if (detaching) detach_dev(t51);
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t54);
    			if (detaching) detach_dev(kt_palette51);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { name = "ktpunnisa" } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<kt-component> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => {
    		return { name };
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	return [name];
    }

    class App extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>h1{color:black}.palette{display:flex;flex-direction:row}</style>`;
    		init(this, { target: this.shadowRoot }, instance$3, create_fragment$3, safe_not_equal, { name: 0 });

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
    		return ["name"];
    	}

    	get name() {
    		return this.$$.ctx[0];
    	}

    	set name(name) {
    		this.$set({ name });
    		flush();
    	}
    }

    customElements.define("kt-component", App);

    exports.App = App;

    return exports;

}({}));
//# sourceMappingURL=bundle.js.map
