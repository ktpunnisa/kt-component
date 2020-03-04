
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }

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

    /* src/components/Button/button.svelte generated by Svelte v3.18.2 */
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
    			add_location(slot, file, 99, 2, 2192);
    			button.disabled = /*disabled*/ ctx[2];
    			toggle_class(button, "small", /*size*/ ctx[0] === "small");
    			toggle_class(button, "medium", /*size*/ ctx[0] === "medium");
    			toggle_class(button, "large", /*size*/ ctx[0] === "large");
    			toggle_class(button, "custom", /*type*/ ctx[1] === "custom");
    			toggle_class(button, "default", /*type*/ ctx[1] === "default");
    			add_location(button, file, 91, 0, 1969);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, slot);
    			dispose = action_destroyer(cssVars_action = cssVars.call(null, button, /*styleVars*/ ctx[3]));
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*disabled*/ 4) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[2]);
    			}

    			if (cssVars_action && is_function(cssVars_action.update) && dirty & /*styleVars*/ 8) cssVars_action.update.call(null, /*styleVars*/ ctx[3]);

    			if (dirty & /*size*/ 1) {
    				toggle_class(button, "small", /*size*/ ctx[0] === "small");
    			}

    			if (dirty & /*size*/ 1) {
    				toggle_class(button, "medium", /*size*/ ctx[0] === "medium");
    			}

    			if (dirty & /*size*/ 1) {
    				toggle_class(button, "large", /*size*/ ctx[0] === "large");
    			}

    			if (dirty & /*type*/ 2) {
    				toggle_class(button, "custom", /*type*/ ctx[1] === "custom");
    			}

    			if (dirty & /*type*/ 2) {
    				toggle_class(button, "default", /*type*/ ctx[1] === "default");
    			}
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
    	let { disabled = false } = $$props;
    	let { radius = "12" } = $$props;
    	let { fontsize = "16" } = $$props;
    	let { pt = "12" } = $$props;
    	let { pr = "20" } = $$props;
    	let { pb = "12" } = $$props;
    	let { pl = "20" } = $$props;
    	const writable_props = ["size", "type", "disabled", "radius", "fontsize", "pt", "pr", "pb", "pl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<kt-button> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ("radius" in $$props) $$invalidate(4, radius = $$props.radius);
    		if ("fontsize" in $$props) $$invalidate(5, fontsize = $$props.fontsize);
    		if ("pt" in $$props) $$invalidate(6, pt = $$props.pt);
    		if ("pr" in $$props) $$invalidate(7, pr = $$props.pr);
    		if ("pb" in $$props) $$invalidate(8, pb = $$props.pb);
    		if ("pl" in $$props) $$invalidate(9, pl = $$props.pl);
    	};

    	$$self.$capture_state = () => {
    		return {
    			size,
    			type,
    			disabled,
    			radius,
    			fontsize,
    			pt,
    			pr,
    			pb,
    			pl,
    			styleVars
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ("radius" in $$props) $$invalidate(4, radius = $$props.radius);
    		if ("fontsize" in $$props) $$invalidate(5, fontsize = $$props.fontsize);
    		if ("pt" in $$props) $$invalidate(6, pt = $$props.pt);
    		if ("pr" in $$props) $$invalidate(7, pr = $$props.pr);
    		if ("pb" in $$props) $$invalidate(8, pb = $$props.pb);
    		if ("pl" in $$props) $$invalidate(9, pl = $$props.pl);
    		if ("styleVars" in $$props) $$invalidate(3, styleVars = $$props.styleVars);
    	};

    	let styleVars;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*radius, fontsize, pt, pr, pb, pl*/ 1008) {
    			 $$invalidate(3, styleVars = {
    				radius: `${radius}px`,
    				fontsize: `${fontsize}px`,
    				pt: `${pt}px`,
    				pr: `${pr}px`,
    				pb: `${pb}px`,
    				pl: `${pl}px`
    			});
    		}
    	};

    	return [size, type, disabled, styleVars, radius, fontsize, pt, pr, pb, pl];
    }

    class Button extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>@use "sass:meta";button{border-radius:4px}button:focus{outline:0}.small{font-size:14px;padding-top:8px;padding-right:12px;padding-bottom:8px;padding-left:12px}.medium{font-size:16px;padding-top:12px;padding-right:20px;padding-bottom:12px;padding-left:20px}.large{font-size:18px;padding-top:16px;padding-right:24px;padding-bottom:16px;padding-left:24px}.default{color:#ffffff;background-color:#ff8879;border:none;box-shadow:0px 4px 8px rgba(0, 0, 0, 0.1)}.default:hover{color:#ffffff;background-color:#ff9486;border:none;box-shadow:0px 4px 10px rgba(0, 0, 0, 0.25)}.default:active{color:#ffffff;background-color:#ffaca1;border:none;box-shadow:0px 4px 8px rgba(0, 0, 0, 0.25)}.default:disabled{color:#8e8e8e;background-color:#cdcdcd;border:none;box-shadow:0px 4px 8px rgba(0, 0, 0, 0.1)}.custom{border-radius:var(--radius);font-size:var(--fontsize);padding-top:var(--pt);padding-right:var(--pr);padding-bottom:var(--pb);padding-left:var(--pl)}</style>`;

    		init(this, { target: this.shadowRoot }, instance, create_fragment, safe_not_equal, {
    			size: 0,
    			type: 1,
    			disabled: 2,
    			radius: 4,
    			fontsize: 5,
    			pt: 6,
    			pr: 7,
    			pb: 8,
    			pl: 9
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
    		return ["size", "type", "disabled", "radius", "fontsize", "pt", "pr", "pb", "pl"];
    	}

    	get size() {
    		return this.$$.ctx[0];
    	}

    	set size(size) {
    		this.$set({ size });
    		flush();
    	}

    	get type() {
    		return this.$$.ctx[1];
    	}

    	set type(type) {
    		this.$set({ type });
    		flush();
    	}

    	get disabled() {
    		return this.$$.ctx[2];
    	}

    	set disabled(disabled) {
    		this.$set({ disabled });
    		flush();
    	}

    	get radius() {
    		return this.$$.ctx[4];
    	}

    	set radius(radius) {
    		this.$set({ radius });
    		flush();
    	}

    	get fontsize() {
    		return this.$$.ctx[5];
    	}

    	set fontsize(fontsize) {
    		this.$set({ fontsize });
    		flush();
    	}

    	get pt() {
    		return this.$$.ctx[6];
    	}

    	set pt(pt) {
    		this.$set({ pt });
    		flush();
    	}

    	get pr() {
    		return this.$$.ctx[7];
    	}

    	set pr(pr) {
    		this.$set({ pr });
    		flush();
    	}

    	get pb() {
    		return this.$$.ctx[8];
    	}

    	set pb(pb) {
    		this.$set({ pb });
    		flush();
    	}

    	get pl() {
    		return this.$$.ctx[9];
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
    			add_location(div, file$2, 172, 0, 3403);
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
    	let { shadeamount = "30%" } = $$props;
    	const writable_props = ["width", "height", "radius", "color", "colorcode", "shade", "shadeamount"];

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
    		if ("shadeamount" in $$props) $$invalidate(7, shadeamount = $$props.shadeamount);
    	};

    	$$self.$capture_state = () => {
    		return {
    			width,
    			height,
    			radius,
    			color,
    			colorcode,
    			shade,
    			shadeamount,
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
    		if ("shadeamount" in $$props) $$invalidate(7, shadeamount = $$props.shadeamount);
    		if ("styleVars" in $$props) $$invalidate(1, styleVars = $$props.styleVars);
    	};

    	let styleVars;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*width, height, radius, color, colorcode, shade, shadeamount*/ 253) {
    			 $$invalidate(1, styleVars = {
    				width: `${width}px`,
    				height: `${height}px`,
    				radius: `${radius}px`,
    				color,
    				colorcode,
    				shade,
    				shadeamount
    			});
    		}
    	};

    	return [color, styleVars, width, height, radius, colorcode, shade, shadeamount];
    }

    class Palette extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>div{width:var(--width);height:var(--height);border-radius:var(--radius);margin:4px}.primary-lightest{background-color:#ffcfc9}.primary-lighter{background-color:#ffaca1}.primary-light{background-color:#ff9486}.primary{background-color:#ff8879}.primary-dark{background-color:#cc6d61}.primary-darker{background-color:#b35f55}.secondary-lightest{background-color:#99d7db}.secondary-lighter{background-color:#4db9c1}.secondary-light{background-color:#1aa5af}.secondary{background-color:#009ba6}.secondary-dark{background-color:#007c85}.secondary-darker{background-color:#006d74}.success-lightest{background-color:#99f1e9}.success-lighter{background-color:#4de7d8}.success-light{background-color:#1ae0cd}.success{background-color:#00dcc7}.success-dark{background-color:#00b09f}.success-darker{background-color:#009a8b}.info-lightest{background-color:#beccff}.info-lighter{background-color:#8da6ff}.info-light{background-color:#6c8dff}.info{background-color:#5c80ff}.info-dark{background-color:#4a66cc}.info-darker{background-color:#405ab3}.warning-lightest{background-color:#ffecbe}.warning-lighter{background-color:#ffdd8d}.warning-light{background-color:#ffd46c}.warning{background-color:#ffcf5c}.warning-dark{background-color:#cca64a}.warning-darker{background-color:#b39140}.danger-lightest{background-color:#ffc1cb}.danger-lighter{background-color:#ff93a3}.danger-light{background-color:#ff7489}.danger{background-color:#ff647c}.danger-dark{background-color:#cc5063}.danger-darker{background-color:#b34657}.white{background-color:#ffffff}.gray-lightest{background-color:#cdcdcd}.gray-lighter{background-color:#a7a7a7}.gray-light{background-color:#8e8e8e}.gray{background-color:#818181}.gray-dark{background-color:#676767}.gray-darker{background-color:#5a5a5a}.black{background-color:#232323}.custom{background-color:#8da6ff}</style>`;

    		init(this, { target: this.shadowRoot }, instance$2, create_fragment$2, safe_not_equal, {
    			width: 2,
    			height: 3,
    			radius: 4,
    			color: 0,
    			colorcode: 5,
    			shade: 6,
    			shadeamount: 7
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
    		return ["width", "height", "radius", "color", "colorcode", "shade", "shadeamount"];
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

    	get shadeamount() {
    		return this.$$.ctx[7];
    	}

    	set shadeamount(shadeamount) {
    		this.$set({ shadeamount });
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
    	let kt_button0;
    	let t61;
    	let kt_button1;
    	let t63;
    	let kt_button2;
    	let t65;
    	let kt_button3;
    	let t67;
    	let kt_button4;
    	let t69;
    	let kt_button5;
    	let t71;
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
    			kt_button0 = element("kt-button");
    			kt_button0.textContent = "default button";
    			t61 = space();
    			kt_button1 = element("kt-button");
    			kt_button1.textContent = "disabled button";
    			t63 = space();
    			kt_button2 = element("kt-button");
    			kt_button2.textContent = "small button";
    			t65 = space();
    			kt_button3 = element("kt-button");
    			kt_button3.textContent = "medium button";
    			t67 = space();
    			kt_button4 = element("kt-button");
    			kt_button4.textContent = "large button";
    			t69 = space();
    			kt_button5 = element("kt-button");
    			kt_button5.textContent = "custom button";
    			t71 = space();
    			h23 = element("h2");
    			h23.textContent = "----------";
    			this.c = noop;
    			add_location(h1, file$3, 16, 0, 383);
    			add_location(h20, file$3, 24, 0, 729);
    			set_custom_element_data(kt_palette0, "color", "primary");
    			add_location(kt_palette0, file$3, 26, 2, 768);
    			set_custom_element_data(kt_palette1, "color", "secondary");
    			add_location(kt_palette1, file$3, 27, 2, 801);
    			set_custom_element_data(kt_palette2, "color", "success");
    			add_location(kt_palette2, file$3, 28, 2, 836);
    			set_custom_element_data(kt_palette3, "color", "info");
    			add_location(kt_palette3, file$3, 29, 2, 869);
    			set_custom_element_data(kt_palette4, "color", "warning");
    			add_location(kt_palette4, file$3, 30, 2, 899);
    			set_custom_element_data(kt_palette5, "color", "danger");
    			add_location(kt_palette5, file$3, 31, 2, 932);
    			attr_dev(div0, "class", "palette");
    			add_location(div0, file$3, 25, 0, 744);
    			set_custom_element_data(kt_palette6, "color", "white");
    			add_location(kt_palette6, file$3, 35, 2, 994);
    			set_custom_element_data(kt_palette7, "color", "gray");
    			add_location(kt_palette7, file$3, 36, 2, 1025);
    			set_custom_element_data(kt_palette8, "color", "black");
    			add_location(kt_palette8, file$3, 37, 2, 1055);
    			set_custom_element_data(kt_palette9, "color", "custom");
    			set_custom_element_data(kt_palette9, "colorcode", "red");
    			set_custom_element_data(kt_palette9, "shade", "dark");
    			set_custom_element_data(kt_palette9, "shadeamount", "30%");
    			add_location(kt_palette9, file$3, 38, 2, 1086);
    			attr_dev(div1, "class", "palette");
    			add_location(div1, file$3, 34, 0, 970);
    			add_location(h21, file$3, 41, 0, 1171);
    			set_custom_element_data(kt_palette10, "color", "primaryLightest");
    			add_location(kt_palette10, file$3, 43, 2, 1216);
    			set_custom_element_data(kt_palette11, "color", "primaryLighter");
    			add_location(kt_palette11, file$3, 44, 2, 1257);
    			set_custom_element_data(kt_palette12, "color", "primaryLight");
    			add_location(kt_palette12, file$3, 45, 2, 1297);
    			set_custom_element_data(kt_palette13, "color", "primary");
    			add_location(kt_palette13, file$3, 46, 2, 1335);
    			set_custom_element_data(kt_palette14, "color", "primaryDark");
    			add_location(kt_palette14, file$3, 47, 2, 1368);
    			set_custom_element_data(kt_palette15, "color", "primaryDarker");
    			add_location(kt_palette15, file$3, 48, 2, 1405);
    			attr_dev(div2, "class", "palette");
    			add_location(div2, file$3, 42, 0, 1192);
    			set_custom_element_data(kt_palette16, "color", "secondaryLightest");
    			add_location(kt_palette16, file$3, 52, 2, 1474);
    			set_custom_element_data(kt_palette17, "color", "secondaryLighter");
    			add_location(kt_palette17, file$3, 53, 2, 1517);
    			set_custom_element_data(kt_palette18, "color", "secondaryLight");
    			add_location(kt_palette18, file$3, 54, 2, 1559);
    			set_custom_element_data(kt_palette19, "color", "secondary");
    			add_location(kt_palette19, file$3, 55, 2, 1599);
    			set_custom_element_data(kt_palette20, "color", "secondaryDark");
    			add_location(kt_palette20, file$3, 56, 2, 1634);
    			set_custom_element_data(kt_palette21, "color", "secondaryDarker");
    			add_location(kt_palette21, file$3, 57, 2, 1673);
    			attr_dev(div3, "class", "palette");
    			add_location(div3, file$3, 51, 0, 1450);
    			set_custom_element_data(kt_palette22, "color", "successLightest");
    			add_location(kt_palette22, file$3, 61, 2, 1744);
    			set_custom_element_data(kt_palette23, "color", "successLighter");
    			add_location(kt_palette23, file$3, 62, 2, 1785);
    			set_custom_element_data(kt_palette24, "color", "successLight");
    			add_location(kt_palette24, file$3, 63, 2, 1825);
    			set_custom_element_data(kt_palette25, "color", "success");
    			add_location(kt_palette25, file$3, 64, 2, 1863);
    			set_custom_element_data(kt_palette26, "color", "successDark");
    			add_location(kt_palette26, file$3, 65, 2, 1896);
    			set_custom_element_data(kt_palette27, "color", "successDarker");
    			add_location(kt_palette27, file$3, 66, 2, 1933);
    			attr_dev(div4, "class", "palette");
    			add_location(div4, file$3, 60, 0, 1720);
    			set_custom_element_data(kt_palette28, "color", "infoLightest");
    			add_location(kt_palette28, file$3, 70, 2, 2002);
    			set_custom_element_data(kt_palette29, "color", "infoLighter");
    			add_location(kt_palette29, file$3, 71, 2, 2040);
    			set_custom_element_data(kt_palette30, "color", "infoLight");
    			add_location(kt_palette30, file$3, 72, 2, 2077);
    			set_custom_element_data(kt_palette31, "color", "info");
    			add_location(kt_palette31, file$3, 73, 2, 2112);
    			set_custom_element_data(kt_palette32, "color", "infoDark");
    			add_location(kt_palette32, file$3, 74, 2, 2142);
    			set_custom_element_data(kt_palette33, "color", "infoDarker");
    			add_location(kt_palette33, file$3, 75, 2, 2176);
    			attr_dev(div5, "class", "palette");
    			add_location(div5, file$3, 69, 0, 1978);
    			set_custom_element_data(kt_palette34, "color", "warningLightest");
    			add_location(kt_palette34, file$3, 79, 2, 2242);
    			set_custom_element_data(kt_palette35, "color", "warningLighter");
    			add_location(kt_palette35, file$3, 80, 2, 2283);
    			set_custom_element_data(kt_palette36, "color", "warningLight");
    			add_location(kt_palette36, file$3, 81, 2, 2323);
    			set_custom_element_data(kt_palette37, "color", "warning");
    			add_location(kt_palette37, file$3, 82, 2, 2361);
    			set_custom_element_data(kt_palette38, "color", "warningDark");
    			add_location(kt_palette38, file$3, 83, 2, 2394);
    			set_custom_element_data(kt_palette39, "color", "warningDarker");
    			add_location(kt_palette39, file$3, 84, 2, 2431);
    			attr_dev(div6, "class", "palette");
    			add_location(div6, file$3, 78, 0, 2218);
    			set_custom_element_data(kt_palette40, "color", "dangerLightest");
    			add_location(kt_palette40, file$3, 88, 2, 2500);
    			set_custom_element_data(kt_palette41, "color", "dangerLighter");
    			add_location(kt_palette41, file$3, 89, 2, 2540);
    			set_custom_element_data(kt_palette42, "color", "dangerLight");
    			add_location(kt_palette42, file$3, 90, 2, 2579);
    			set_custom_element_data(kt_palette43, "color", "danger");
    			add_location(kt_palette43, file$3, 91, 2, 2616);
    			set_custom_element_data(kt_palette44, "color", "dangerDark");
    			add_location(kt_palette44, file$3, 92, 2, 2648);
    			set_custom_element_data(kt_palette45, "color", "dangerDarker");
    			add_location(kt_palette45, file$3, 93, 2, 2684);
    			attr_dev(div7, "class", "palette");
    			add_location(div7, file$3, 87, 0, 2476);
    			set_custom_element_data(kt_palette46, "color", "grayLightest");
    			add_location(kt_palette46, file$3, 97, 2, 2752);
    			set_custom_element_data(kt_palette47, "color", "grayLighter");
    			add_location(kt_palette47, file$3, 98, 2, 2790);
    			set_custom_element_data(kt_palette48, "color", "grayLight");
    			add_location(kt_palette48, file$3, 99, 2, 2827);
    			set_custom_element_data(kt_palette49, "color", "gray");
    			add_location(kt_palette49, file$3, 100, 2, 2862);
    			set_custom_element_data(kt_palette50, "color", "grayDark");
    			add_location(kt_palette50, file$3, 101, 2, 2892);
    			set_custom_element_data(kt_palette51, "color", "grayDarker");
    			add_location(kt_palette51, file$3, 102, 2, 2926);
    			attr_dev(div8, "class", "palette");
    			add_location(div8, file$3, 96, 0, 2728);
    			add_location(h22, file$3, 105, 0, 2968);
    			add_location(kt_button0, file$3, 106, 0, 2990);
    			set_custom_element_data(kt_button1, "disabled", "true");
    			add_location(kt_button1, file$3, 107, 0, 3028);
    			set_custom_element_data(kt_button2, "size", "small");
    			add_location(kt_button2, file$3, 108, 0, 3083);
    			set_custom_element_data(kt_button3, "size", "medium");
    			add_location(kt_button3, file$3, 109, 0, 3132);
    			set_custom_element_data(kt_button4, "size", "large");
    			add_location(kt_button4, file$3, 110, 0, 3183);
    			set_custom_element_data(kt_button5, "type", "custom");
    			set_custom_element_data(kt_button5, "fontsize", "20");
    			set_custom_element_data(kt_button5, "radius", "20");
    			set_custom_element_data(kt_button5, "pt", "16");
    			set_custom_element_data(kt_button5, "pr", "28");
    			set_custom_element_data(kt_button5, "pb", "16");
    			set_custom_element_data(kt_button5, "pl", "28");
    			add_location(kt_button5, file$3, 111, 0, 3232);
    			add_location(h23, file$3, 122, 0, 3360);
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
    			insert_dev(target, kt_button0, anchor);
    			insert_dev(target, t61, anchor);
    			insert_dev(target, kt_button1, anchor);
    			insert_dev(target, t63, anchor);
    			insert_dev(target, kt_button2, anchor);
    			insert_dev(target, t65, anchor);
    			insert_dev(target, kt_button3, anchor);
    			insert_dev(target, t67, anchor);
    			insert_dev(target, kt_button4, anchor);
    			insert_dev(target, t69, anchor);
    			insert_dev(target, kt_button5, anchor);
    			insert_dev(target, t71, anchor);
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
    			if (detaching) detach_dev(kt_button0);
    			if (detaching) detach_dev(t61);
    			if (detaching) detach_dev(kt_button1);
    			if (detaching) detach_dev(t63);
    			if (detaching) detach_dev(kt_button2);
    			if (detaching) detach_dev(t65);
    			if (detaching) detach_dev(kt_button3);
    			if (detaching) detach_dev(t67);
    			if (detaching) detach_dev(kt_button4);
    			if (detaching) detach_dev(t69);
    			if (detaching) detach_dev(kt_button5);
    			if (detaching) detach_dev(t71);
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
    		this.shadowRoot.innerHTML = `<style>h1{color:black}.palette{display:flex;flex-direction:row}</style>`;
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
