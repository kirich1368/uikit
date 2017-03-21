import { $, doc, docElement, isWithin, promise, requestAnimationFrame, toMs, transitionend } from '../util/index';
import Class from './class';
import Toggable from './toggable';

var active;

export default {

    mixins: [Class, Toggable],

    props: {
        clsPanel: String,
        selClose: String,
        escClose: Boolean,
        bgClose: Boolean,
        stack: Boolean
    },

    defaults: {
        cls: 'uk-open',
        escClose: true,
        bgClose: true,
        overlay: true,
        stack: false
    },

    computed: {

        body() {
            return $(document.body);
        },

        panel() {
            return this.$el.find(`.${this.clsPanel}`);
        },

        transitionDuration() {
            return toMs(this.panel.css('transition-duration'));
        },

        scrollbarWidth() {
            var width = docElement[0].style.width;

            docElement.css('width', '');

            var scrollbarWidth = window.innerWidth - docElement.outerWidth(true);

            if (width) {
                docElement.width(width);
            }

            return scrollbarWidth;
        },

    },

    events: [

        {

            name: 'click',

            delegate() {
                return this.selClose;
            },

            handler(e) {
                e.preventDefault();
                this.hide();
            }

        },

        {

            name: 'toggle',

            handler(e) {
                e.preventDefault();
                this.toggleNow(this.$el);
            }

        },

        {

            name: 'beforeshow',

            self: true,

            handler() {

                if (this.isActive()) {
                    return false;
                }

                var prev = active && active !== this && active;

                if (!active) {
                    this.body.css('overflow-y', this.scrollbarWidth && this.overlay ? 'scroll' : '');
                }

                active = this;

                if (prev) {
                    if (this.stack) {
                        this.prev = prev;
                    } else {
                        prev.hide();
                    }
                } else {
                    requestAnimationFrame(() => register(this.$options.name));
                }

                docElement.addClass(this.clsPage);

            }

        },

        {

            name: 'beforehide',

            self: true,

            handler() {

                if (!this.isActive()) {
                    return false;
                }

                active = active && active !== this && active || this.prev;

                if (!active) {
                    deregister(this.$options.name);
                }

            }

        },

        {

            name: 'hidden',

            self: true,

            handler() {
                if (!active) {
                    docElement.removeClass(this.clsPage);
                    this.body.css('overflow-y', '');
                }
            }

        }

    ],

    methods: {

        isActive() {
            return this.$el.hasClass(this.cls);
        },

        toggle() {
            return this.isActive() ? this.hide() : this.show();
        },

        show() {
            return this.toggleNow(this.$el, true);
        },

        hide() {
            return this.toggleNow(this.$el, false);
        },

        getActive() {
            return active;
        },

        _toggleImmediate(el, show) {
            this._toggle(el, show);

            return this.transitionDuration ? promise(resolve => {
                this.panel.one(transitionend, resolve);
                setTimeout(() => {
                    resolve();
                    this.panel.off(transitionend, resolve);
                }, this.transitionDuration);
            }) : promise.resolve();
        },
    }

}

function register(name) {
    doc.on({

        [`click.${name}`](e) {
            if (active && active.bgClose && !e.isDefaultPrevented() && !isWithin(e.target, active.panel)) {
                active.hide();
            }
        },

        [`keydown.${name}`](e) {
            if (e.keyCode === 27 && active && active.escClose) {
                e.preventDefault();
                active.hide();
            }
        }

    });
}

function deregister(name) {
    doc.off(`click.${name}`).off(`keydown.${name}`);
}
