var defs = {};
var modules = {};
function define(name, fn) {
  defs[name] = fn;
}
function require(name) {
  //console.log("Loading " + name);
  if (modules.hasOwnProperty(name)) return modules[name];
  if (defs.hasOwnProperty(name)) {
    var fn = defs[name];
    defs[name] = function () { throw new Error("Circular Dependency"); }
    return modules[name] = fn();
  }
  throw new Error("Module not found: " + name);
}
/**
 * Nimble
 * Copyright (c) 2011 Caolan McMahon
 *
 * Nimble is freely distributable under the MIT license.
 *
 * This source code is optimized for minification and gzip compression, not
 * readability. If you want reassurance, see the test suite.
 */

(function (exports) {

    var keys = Object.keys || function (obj) {
        var results = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                results.push(k);
            }
        }
        return results;
    };

    var fallback = function (name, fallback) {
        var nativeFn = Array.prototype[name];
        return function (obj, iterator, memo) {
            var fn = obj ? obj[name]: 0;
            return fn && fn === nativeFn ?
                fn.call(obj, iterator, memo):
                fallback(obj, iterator, memo);
        };
    };

    var eachSync = fallback('forEach', function (obj, iterator) {
        var isObj = obj instanceof Object;
        var arr = isObj ? keys(obj): (obj || []);
        for (var i = 0, len = arr.length; i < len; i++) {
            var k = isObj ? arr[i]: i;
            iterator(obj[k], k, obj);
        }
    });

    var eachParallel = function (obj, iterator, callback) {
        var len = obj.length || keys(obj).length;
        if (!len) {
            return callback();
        }
        var completed = 0;
        eachSync(obj, function () {
            var cb = function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    if (++completed === len) {
                        callback();
                    }
                }
            };
            var args = Array.prototype.slice.call(arguments);
            if (iterator.length) {
                args = args.slice(0, iterator.length - 1);
                args[iterator.length - 1] = cb;
            }
            else {
                args.push(cb);
            }
            iterator.apply(this, args);
        });
    };

    var eachSeries = function (obj, iterator, callback) {
        var keys_list = keys(obj);
        if (!keys_list.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            var k = keys_list[completed];
            var args = [obj[k], k, obj].slice(0, iterator.length - 1);
            args[iterator.length - 1] = function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    if (++completed === keys_list.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            };
            iterator.apply(this, args);
        };
        iterate();
    };

    var mapSync = fallback('map', function (obj, iterator) {
        var results = [];
        eachSync(obj, function (v, k, obj) {
            results[results.length] = iterator(v, k, obj);
        });
        return results;
    });

    var mapAsync = function (eachfn) {
        return function (obj, iterator, callback) {
            var results = [];
            eachfn(obj, function (value, i, obj, callback) {
                var cb = function (err, v) {
                    results[results.length] = v;
                    callback(err);
                };
                var args = [value, i, obj];
                if (iterator.length) {
                    args = args.slice(0, iterator.length - 1);
                    args[iterator.length - 1] = cb;
                }
                else {
                    args.push(cb);
                }
                iterator.apply(this, args);
            }, function (err) {
                callback(err, results);
            });
        };
    };

    var filterSync = fallback('filter', function (obj, iterator, callback) {
        var results = [];
        eachSync(obj, function (v, k, obj) {
            if (iterator(v, k, obj)) {
                results[results.length] = v;
            }
        });
        return results;
    });

    var filterParallel = function (obj, iterator, callback) {
        var results = [];
        eachParallel(obj, function (value, k, obj, callback) {
            var cb = function (err, a) {
                if (a) {
                    results[results.length] = value;
                }
                callback(err);
            };
            var args = [value, k, obj];
            if (iterator.length) {
                args = args.slice(0, iterator.length - 1);
                args[iterator.length - 1] = cb;
            }
            else {
                args.push(cb);
            }
            iterator.apply(this, args);
        }, function (err) {
            callback(err, results);
        });
    };

    var reduceSync = fallback('reduce', function (obj, iterator, memo) {
        eachSync(obj, function (v, i, obj) {
            memo = iterator(memo, v, i, obj);
        });
        return memo;
    });

    var reduceSeries = function (obj, iterator, memo, callback) {
        eachSeries(obj, function (value, i, obj, callback) {
            var cb = function (err, v) {
                memo = v;
                callback(err);
            };
            var args = [memo, value, i, obj];
            if (iterator.length) {
                args = args.slice(0, iterator.length - 1);
                args[iterator.length - 1] = cb;
            }
            else {
                args.push(cb);
            }
            iterator.apply(this, args);
        }, function (err) {
            callback(err, memo);
        });
    };

    exports.each = function (obj, iterator, callback) {
        return (callback ? eachParallel: eachSync)(obj, iterator, callback);
    };
    exports.eachSeries = eachSeries;
    exports.map = function (obj, iterator, callback) {
        return (callback ? mapAsync(eachParallel): mapSync)(obj, iterator, callback);
    };
    exports.filter = function (obj, iterator, callback) {
        return (callback ? filterParallel: filterSync)(obj, iterator, callback);
    };
    exports.reduce = function (obj, iterator, memo, callback) {
        return (callback ? reduceSeries: reduceSync)(obj, iterator, memo, callback);
    };

    exports.parallel = function (fns, callback) {
        var results = new fns.constructor();
        eachParallel(fns, function (fn, k, cb) {
            fn(function (err) {
                var v = Array.prototype.slice.call(arguments, 1);
                results[k] = v.length <= 1 ? v[0]: v;
                cb(err);
            });
        }, function (err) {
            (callback || function () {})(err, results);
        });
    };

    exports.series = function (fns, callback) {
        var results = new fns.constructor();
        var lastResult;
        eachSeries(fns, function (fn, k, cb) {
            var args = [function (err, result) {
                var v = Array.prototype.slice.call(arguments, 1);
                lastResult = results[k] = v.length <= 1 ? v[0]: v;
                cb(err);
            }];
            if (fn.length === 3) {
                args.unshift(lastResult, results);
            } else if (fn.length === 2) {
                args.unshift(lastResult);
            }
            fn.apply(null, args);
        }, function (err) {
            (callback || function () {})(err, results);
        });
    };

}(typeof exports === 'undefined' ? this._ = this._ || {}: exports));
//     Zepto.js
//     (c) 2010, 2011 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.
(function(a){String.prototype.trim===a&&(String.prototype.trim=function(){return this.replace(/^\s+/,"").replace(/\s+$/,"")}),Array.prototype.reduce===a&&(Array.prototype.reduce=function(b){if(this===void 0||this===null)throw new TypeError;var c=Object(this),d=c.length>>>0,e=0,f;if(typeof b!="function")throw new TypeError;if(d==0&&arguments.length==1)throw new TypeError;if(arguments.length>=2)f=arguments[1];else do{if(e in c){f=c[e++];break}if(++e>=d)throw new TypeError}while(!0);while(e<d)e in c&&(f=b.call(a,f,c[e],e,c)),e++;return f})})();var Zepto=function(){function s(a){return{}.toString.call(a)=="[object Function]"}function t(a){return a instanceof Object}function u(a){return a instanceof Array}function v(a){return typeof a.length=="number"}function w(b){return b.filter(function(b){return b!==a&&b!==null})}function x(a){return a.length>0?[].concat.apply([],a):a}function y(a){return a.replace(/-+(.)?/g,function(a,b){return b?b.toUpperCase():""})}function z(a){return a.replace(/::/g,"/").replace(/([A-Z]+)([A-Z][a-z])/g,"$1_$2").replace(/([a-z\d])([A-Z])/g,"$1_$2").replace(/_/g,"-").toLowerCase()}function A(a){return a.filter(function(a,b,c){return c.indexOf(a)==b})}function B(a){return a in i?i[a]:i[a]=new RegExp("(^|\\s)"+a+"(\\s|$)")}function C(a,b){return typeof b=="number"&&!k[z(a)]?b+"px":b}function D(a){var b,c;return h[a]||(b=g.createElement(a),g.body.appendChild(b),c=j(b,"").getPropertyValue("display"),b.parentNode.removeChild(b),c=="none"&&(c="block"),h[a]=c),h[a]}function E(b,c){c===a&&l.test(b)&&RegExp.$1,c in r||(c="*");var d=r[c];return d.innerHTML=""+b,f.call(d.childNodes)}function F(a,b){return a=a||e,a.__proto__=F.prototype,a.selector=b||"",a}function G(b,d){if(!b)return F();if(d!==a)return G(d).find(b);if(s(b))return G(g).ready(b);if(b instanceof F)return b;var e;return u(b)?e=w(b):m.indexOf(b.nodeType)>=0||b===window?(e=[b],b=null):l.test(b)?(e=E(b.trim(),RegExp.$1),b=null):b.nodeType&&b.nodeType==3?e=[b]:e=c(g,b),F(e,b)}function H(b,c){return c===a?G(b):G(b).filter(c)}function I(a,b,c,d){return s(b)?b.call(a,c,d):b}function J(a,b,c){var d=!a||a==3?b:b.parentNode;d.insertBefore(c,a?a==1?b.nextSibling:a==2?b:null:d.firstChild)}function K(a,c){c(a);for(b in a.childNodes)K(a.childNodes[b],c)}var a,b,c,d,e=[],f=e.slice,g=window.document,h={},i={},j=g.defaultView.getComputedStyle,k={"column-count":1,columns:1,"font-weight":1,"line-height":1,opacity:1,"z-index":1,zoom:1},l=/^\s*<(\w+)[^>]*>/,m=[1,9,11],n=["prepend","after","before","append"],o=["append","prepend"],p=g.createElement("table"),q=g.createElement("tr"),r={tr:g.createElement("tbody"),tbody:p,thead:p,tfoot:p,td:q,th:q,"*":g.createElement("div")};return G.extend=function(a){return f.call(arguments,1).forEach(function(c){for(b in c)a[b]=c[b]}),a},G.qsa=c=function(a,b){return f.call(a.querySelectorAll(b))},G.isFunction=s,G.isObject=t,G.isArray=u,G.map=function(a,b){var c,d=[],e,f;if(v(a))for(e=0;e<a.length;e++)c=b(a[e],e),c!=null&&d.push(c);else for(f in a)c=b(a[f],f),c!=null&&d.push(c);return x(d)},G.each=function(a,b){var c,d;if(v(a)){for(c=0;c<a.length;c++)if(b(c,a[c])===!1)return a}else for(d in a)if(b(d,a[d])===!1)return a;return a},G.fn={forEach:e.forEach,reduce:e.reduce,push:e.push,indexOf:e.indexOf,concat:e.concat,map:function(a){return G.map(this,function(b,c){return a.call(b,c,b)})},slice:function(){return G(f.apply(this,arguments))},ready:function(a){return(g.readyState=="complete"||g.readyState=="loaded")&&a(),g.addEventListener("DOMContentLoaded",a,!1),this},get:function(b){return b===a?this:this[b]},size:function(){return this.length},remove:function(){return this.each(function(){this.parentNode!=null&&this.parentNode.removeChild(this)})},each:function(a){return this.forEach(function(b,c){a.call(b,c,b)}),this},filter:function(a){return G([].filter.call(this,function(b){return b.parentNode&&c(b.parentNode,a).indexOf(b)>=0}))},end:function(){return this.prevObject||G()},add:function(a,b){return G(A(this.concat(G(a,b))))},is:function(a){return this.length>0&&G(this[0]).filter(a).length>0},not:function(b){var c=[];if(s(b)&&b.call!==a)this.each(function(a){b.call(this,a)||c.push(this)});else{var d=typeof b=="string"?this.filter(b):v(b)&&s(b.item)?f.call(b):G(b);this.forEach(function(a){d.indexOf(a)<0&&c.push(a)})}return G(c)},eq:function(a){return a===-1?this.slice(a):this.slice(a,+a+1)},first:function(){return G(this[0])},last:function(){return G(this[this.length-1])},find:function(a){var b;return this.length==1?b=c(this[0],a):b=this.map(function(){return c(this,a)}),G(b)},closest:function(b,d){var e=this[0],f=c(d!==a?d:g,b);f.length===0&&(e=null);while(e&&e!==g&&f.indexOf(e)<0)e=e.parentNode;return G(e!==g&&e)},parents:function(a){var b=[],c=this;while(c.length>0)c=G.map(c,function(a){if((a=a.parentNode)&&a!==g&&b.indexOf(a)<0)return b.push(a),a});return H(b,a)},parent:function(a){return H(A(this.pluck("parentNode")),a)},children:function(a){return H(this.map(function(){return f.call(this.children)}),a)},siblings:function(a){return H(this.map(function(a,b){return f.call(b.parentNode.children).filter(function(a){return a!==b})}),a)},empty:function(){return this.each(function(){this.innerHTML=""})},pluck:function(a){return this.map(function(){return this[a]})},show:function(){return this.each(function(){this.style.display=="none"&&(this.style.display=null),j(this,"").getPropertyValue("display")=="none"&&(this.style.display=D(this.nodeName))})},replaceWith:function(a){return this.each(function(){var b=this.parentNode,c=this.nextSibling;G(this).remove(),c?G(c).before(a):G(b).append(a)})},wrap:function(a){return this.each(function(){G(this).wrapAll(G(a)[0].cloneNode(!1))})},wrapAll:function(a){return this[0]&&(G(this[0]).before(a=G(a)),a.append(this)),this},unwrap:function(){return this.parent().each(function(){G(this).replaceWith(G(this).children())}),this},hide:function(){return this.css("display","none")},toggle:function(b){return(b===a?this.css("display")=="none":b)?this.show():this.hide()},prev:function(){return G(this.pluck("previousElementSibling"))},next:function(){return G(this.pluck("nextElementSibling"))},html:function(b){return b===a?this.length>0?this[0].innerHTML:null:this.each(function(a){var c=this.innerHTML;G(this).empty().append(I(this,b,a,c))})},text:function(b){return b===a?this.length>0?this[0].textContent:null:this.each(function(){this.textContent=b})},attr:function(c,d){return typeof c=="string"&&d===a?this.length>0&&this[0].nodeName=="INPUT"&&this[0].type=="text"&&c=="value"?this.val():this.length>0?this[0].getAttribute(c)||(c in this[0]?this[0][c]:a):a:this.each(function(a){if(t(c))for(b in c)this.setAttribute(b,c[b]);else this.setAttribute(c,I(this,d,a,this.getAttribute(c)))})},removeAttr:function(a){return this.each(function(){this.removeAttribute(a)})},data:function(a,b){return this.attr("data-"+a,b)},val:function(b){return b===a?this.length>0?this[0].value:null:this.each(function(){this.value=b})},offset:function(){if(this.length==0)return null;var a=this[0].getBoundingClientRect();return{left:a.left+g.body.scrollLeft,top:a.top+g.body.scrollTop,width:a.width,height:a.height}},css:function(c,d){if(d===a&&typeof c=="string")return this.length==0?a:this[0].style[y(c)]||j(this[0],"").getPropertyValue(c);var e="";for(b in c)e+=z(b)+":"+C(b,c[b])+";";return typeof c=="string"&&(e=z(c)+":"+C(c,d)),this.each(function(){this.style.cssText+=";"+e})},index:function(a){return a?this.indexOf(G(a)[0]):this.parent().children().indexOf(this[0])},hasClass:function(a){return this.length<1?!1:B(a).test(this[0].className)},addClass:function(a){return this.each(function(b){d=[];var c=this.className,e=I(this,a,b,c);e.split(/\s+/g).forEach(function(a){G(this).hasClass(a)||d.push(a)},this),d.length&&(this.className+=(c?" ":"")+d.join(" "))})},removeClass:function(b){return this.each(function(c){if(b===a)return this.className="";d=this.className,I(this,b,c,d).split(/\s+/g).forEach(function(a){d=d.replace(B(a)," ")}),this.className=d.trim()})},toggleClass:function(b,c){return this.each(function(d){var e=this.className,f=I(this,b,d,e);c!==a&&!c||G(this).hasClass(f)?G(this).removeClass(f):G(this).addClass(f)})}},"filter,add,not,eq,first,last,find,closest,parents,parent,children,siblings".split(",").forEach(function(a){var b=G.fn[a];G.fn[a]=function(){var a=b.apply(this,arguments);return a.prevObject=this,a}}),["width","height"].forEach(function(b){G.fn[b]=function(c){var d;return c===a?(d=this.offset())&&d[b]:this.css(b,c)}}),n.forEach(function(a,b){G.fn[a]=function(a){var c=typeof a=="object"?a:E(a);"length"in c||(c=[c]);if(c.length<1)return this;var d=this.length,e=d>1,f=b<2;return this.each(function(a,g){for(var h=0;h<c.length;h++){var i=c[f?c.length-h-1:h];K(i,function(a){a.nodeName!=null&&a.nodeName.toUpperCase()==="SCRIPT"&&window.eval.call(window,a.innerHTML)}),e&&a<d-1&&(i=i.cloneNode(!0)),J(b,g,i)}})}}),o.forEach(function(a){G.fn[a+"To"]=function(b){return typeof b!="object"&&(b=G(b)),b[a](this),this}}),F.prototype=G.fn,G}();"$"in window||(window.$=Zepto),function(a){function f(a){return a._zid||(a._zid=d++)}function g(a,b,d,e){b=h(b);if(b.ns)var g=i(b.ns);return(c[f(a)]||[]).filter(function(a){return a&&(!b.e||a.e==b.e)&&(!b.ns||g.test(a.ns))&&(!d||a.fn==d)&&(!e||a.sel==e)})}function h(a){var b=(""+a).split(".");return{e:b[0],ns:b.slice(1).sort().join(" ")}}function i(a){return new RegExp("(?:^| )"+a.replace(" "," .* ?")+"(?: |$)")}function j(b,d,e,g,i){var j=f(b),k=c[j]||(c[j]=[]);d.split(/\s/).forEach(function(c){var d=i||e,f=function(a){var c=d.apply(b,[a].concat(a.data));return c===!1&&a.preventDefault(),c},j=a.extend(h(c),{fn:e,proxy:f,sel:g,del:i,i:k.length});k.push(j),b.addEventListener(j.e,f,!1)})}function k(a,b,d,e){var h=f(a);(b||"").split(/\s/).forEach(function(b){g(a,b,d,e).forEach(function(b){delete c[h][b.i],a.removeEventListener(b.e,b.proxy,!1)})})}function o(b){var c=a.extend({originalEvent:b},b);return a.each(n,function(a,d){c[a]=function(){return this[d]=l,b[a].apply(b,arguments)},c[d]=m}),c}var b=a.qsa,c={},d=1,e={};e.click=e.mousedown=e.mouseup=e.mousemove="MouseEvents",a.event={add:j,remove:k},a.fn.bind=function(a,b){return this.each(function(){j(this,a,b)})},a.fn.unbind=function(a,b){return this.each(function(){k(this,a,b)})},a.fn.one=function(a,b){return this.each(function(){var c=this;j(this,a,function d(d){b.call(c,d),k(c,a,arguments.callee)})})};var l=function(){return!0},m=function(){return!1},n={preventDefault:"isDefaultPrevented",stopImmediatePropagation:"isImmediatePropagationStopped",stopPropagation:"isPropagationStopped"};a.fn.delegate=function(c,d,e){return this.each(function(f,g){j(g,d,e,c,function(d,f){var h=d.target,i=b(g,c);while(h&&i.indexOf(h)<0)h=h.parentNode;h&&h!==g&&h!==document&&e.call(h,a.extend(o(d),{currentTarget:h,liveFired:g}),f)})})},a.fn.undelegate=function(a,b,c){return this.each(function(){k(this,b,c,a)})},a.fn.live=function(b,c){return a(document.body).delegate(this.selector,b,c),this},a.fn.die=function(b,c){return a(document.body).undelegate(this.selector,b,c),this},a.fn.trigger=function(b,c){return typeof b=="string"&&(b=a.Event(b)),b.data=c,this.each(function(){this.dispatchEvent(b)})},a.fn.triggerHandler=function(b,c){var d,e;return this.each(function(f,h){d=o(typeof b=="string"?a.Event(b):b),d.data=c,d.target=h,a.each(g(h,b.type||b),function(a,b){e=b.proxy(d);if(d.isImmediatePropagationStopped())return!1})}),e},"focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout change select keydown keypress keyup error".split(" ").forEach(function(b){a.fn[b]=function(a){return this.bind(b,a)}}),["focus","blur"].forEach(function(b){a.fn[b]=function(a){if(a)this.bind(b,a);else if(this.length)try{this.get(0)[b]()}catch(c){}return this}}),a.Event=function(b,c){var d=document.createEvent(e[b]||"Events");return c&&a.extend(d,c),d.initEvent(b,!c||c.bubbles!==!1,!0,null,null,null,null,null,null,null,null,null,null,null,null),d}}(Zepto),function(a){function b(a){var a=a,b={},c=a.match(/(Android)\s+([\d.]+)/),d=a.match(/(iPad).*OS\s([\d_]+)/),e=!d&&a.match(/(iPhone\sOS)\s([\d_]+)/),f=a.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),g=f&&a.match(/TouchPad/),h=a.match(/(BlackBerry).*Version\/([\d.]+)/);return c&&(b.android=!0,b.version=c[2]),e&&(b.ios=!0,b.version=e[2].replace(/_/g,"."),b.iphone=!0),d&&(b.ios=!0,b.version=d[2].replace(/_/g,"."),b.ipad=!0),f&&(b.webos=!0,b.version=f[2]),g&&(b.touchpad=!0),h&&(b.blackberry=!0,b.version=h[2]),b}a.os=b(navigator.userAgent),a.__detect=b;var c=navigator.userAgent.match(/WebKit\/([\d.]+)/);a.browser=c?{webkit:!0,version:c[1]}:{webkit:!1}}(Zepto),function(a,b){var c=["scale","scaleX","scaleY","translate","translateX","translateY","translate3d","skew","skewX","skewY","rotate","rotateX","rotateY","rotateZ","rotate3d","matrix"];a.fn.anim=function(d,e,f,g){var h=[],i={},j,k=this,l,m="webkitTransitionEnd";e===b&&(e=.5);if(typeof d=="string")i["-webkit-animation-name"]=d,i["-webkit-animation-duration"]=e+"s",m="webkitAnimationEnd";else{for(j in d)c.indexOf(j)>=0?h.push(j+"("+d[j]+")"):i[j]=d[j];h.length>0&&(i["-webkit-transform"]=h.join(" ")),i["-webkit-transition"]="all "+e+"s "+(f||"")}return l=function(){a(this).css({"-webkit-transition":"none","-webkit-animation-name":"none"}),g&&g.call(this)},e>0&&this.one(m,l),setTimeout(function(){k.css(i),e<=0&&setTimeout(function(){k.each(function(){l.call(this)})},0)},0),this}}(Zepto),function(a){function e(){}var b=0,c=a.isObject,d;a.ajaxJSONP=function(c){var d="jsonp"+ ++b,e=document.createElement("script");window[d]=function(a){c.success(a),delete window[d]},e.src=c.url.replace(/=\?/,"="+d),a("head").append(e)},a.ajaxSettings={type:"GET",beforeSend:e,success:e,error:e,complete:e,xhr:function(){return new window.XMLHttpRequest},accepts:{script:"text/javascript, application/javascript",json:"application/json",xml:"application/xml, text/xml",html:"text/html",text:"text/plain"},timeout:0},a.ajax=function(b){b=b||{};var e=a.extend({},b);for(d in a.ajaxSettings)e[d]||(e[d]=a.ajaxSettings[d]);if(/=\?/.test(e.url))return a.ajaxJSONP(e);e.url||(e.url=window.location.toString()),e.data&&!e.contentType&&(e.contentType="application/x-www-form-urlencoded"),c(e.data)&&(e.data=a.param(e.data));if(e.type.match(/get/i)&&e.data){var f=e.data;e.url.match(/\?.*=/)?f="&"+f:f[0]!="?"&&(f="?"+f),e.url+=f}var g=e.accepts[e.dataType],h=a.ajaxSettings.xhr();e.headers=a.extend({"X-Requested-With":"XMLHttpRequest"},e.headers||{}),g&&(e.headers.Accept=g),h.onreadystatechange=function(){if(h.readyState==4){var a,b=!1;if(h.status>=200&&h.status<300||h.status==0){if(g=="application/json"&&!/^\s*$/.test(h.responseText))try{a=JSON.parse(h.responseText)}catch(c){b=c}else a=h.responseText;b?e.error(h,"parsererror",b):e.success(a,"success",h)}else b=!0,e.error(h,"error");e.complete(h,b?"error":"success")}},h.open(e.type,e.url,!0),e.contentType&&(e.headers["Content-Type"]=e.contentType);for(name in e.headers)h.setRequestHeader(name,e.headers[name]);var i=function(){if(e.beforeSend(h,e)===!1)return h.abort(),!1;h.send(e.data)};if(e.timeout>0)setTimeout(i,e.timeout);else if(i()===!1)return!1;return h},a.get=function(b,c){a.ajax({url:b,success:c})},a.post=function(b,c,d,e){a.isFunction(c)&&(e=e||d,d=c,c=null),a.ajax({type:"POST",url:b,data:c,success:d,dataType:e})},a.getJSON=function(b,c){a.ajax({url:b,success:c,dataType:"json"})},a.fn.load=function(b,c){if(!this.length)return this;var d=this,e=b.split(/\s/),f;return e.length>1&&(b=e[0],f=e[1]),a.get(b,function(b){d.html(f?a(document.createElement("div")).html(b).find(f).html():b),c&&c()}),this},a.param=function(b,e){var f=[],g=function(a,b){f.push(encodeURIComponent(e?e+"["+a+"]":a)+"="+encodeURIComponent(b))},h=a.isArray(b);for(d in b)c(b[d])?f.push(a.param(b[d],e?e+"["+d+"]":d)):g(h?"":d,b[d]);return f.join("&").replace("%20","+")}}(Zepto),function(a){a.fn.serializeArray=function(){var b=[],c;return a(Array.prototype.slice.call(this.get(0).elements)).each(function(){c=a(this),(c.attr("type")!=="radio"||c.is(":checked"))&&(c.attr("type")!=="checkbox"||!!c.is(":checked"))&&b.push({name:c.attr("name"),value:c.val()})}),b},a.fn.serialize=function(){var a=[];return this.serializeArray().forEach(function(b){a.push(encodeURIComponent(b.name)+"="+encodeURIComponent(b.value))}),a.join("&")},a.fn.submit=function(b){if(b)this.bind("submit",b);else if(this.length){var c=a.Event("submit");this.eq(0).trigger(c),c.defaultPrevented||this.get(0).submit()}return this}}(Zepto),function(a){function d(a){return"tagName"in a?a:a.parentNode}function e(a,b,c,d){var e=Math.abs(a-b),f=Math.abs(c-d);return e>=f?a-b>0?"Left":"Right":c-d>0?"Up":"Down"}function g(){b.last&&Date.now()-b.last>=f&&(a(b.target).trigger("longTap"),b={})}var b={},c,f=750;a(document).ready(function(){a(document.body).bind("touchstart",function(a){var e=Date.now(),h=e-(b.last||e);b.target=d(a.touches[0].target),c&&clearTimeout(c),b.x1=a.touches[0].pageX,b.y1=a.touches[0].pageY,h>0&&h<=250&&(b.isDoubleTap=!0),b.last=e,setTimeout(g,f)}).bind("touchmove",function(a){b.x2=a.touches[0].pageX,b.y2=a.touches[0].pageY}).bind("touchend",function(d){b.isDoubleTap?(a(b.target).trigger("doubleTap"),b={}):b.x2>0||b.y2>0?((Math.abs(b.x1-b.x2)>30||Math.abs(b.y1-b.y2)>30)&&a(b.target).trigger("swipe")&&a(b.target).trigger("swipe"+e(b.x1,b.x2,b.y1,b.y2)),b.x1=b.x2=b.y1=b.y2=b.last=0):"last"in b&&(c=setTimeout(function(){c=null,a(b.target).trigger("tap"),b={}},250))}).bind("touchcancel",function(){b={}})}),["swipe","swipeLeft","swipeRight","swipeUp","swipeDown","doubleTap","tap","longTap"].forEach(function(b){a.fn[b]=function(a){return this.bind(b,a)}})}(Zepto)
//     Underscore.js 1.1.5
//     (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **CommonJS**, with backwards-compatibility
  // for the old `require()` API. If we're not in CommonJS, add `_` to the
  // global object.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _;
    _._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.1.5';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects implementing `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (_.isNumber(obj.length)) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = memo !== void 0;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial && index === 0) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError("Reduce of empty array with no initial value");
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return memo !== void 0 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = (_.isArray(obj) ? obj.slice() : _.toArray(obj)).reverse();
    return _.reduce(reversed, iterator, memo, context);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result = iterator.call(context, value, index, list)) return breaker;
    });
    return result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    any(obj, function(value) {
      if (found = value === target) return true;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (method.call ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return iterable;
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Get the last element of an array.
  _.last = function(array) {
    return array[array.length - 1];
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(_.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    var values = slice.call(arguments, 1);
    return _.filter(array, function(value){ return !_.include(values, value); });
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted) {
    return _.reduce(array, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) memo[memo.length] = el;
      return memo;
    }, []);
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
  };


  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function(func, obj) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(obj, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Internal function used to implement `_.throttle` and `_.debounce`.
  var limit = function(func, wait, debounce) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var throttler = function() {
        timeout = null;
        func.apply(context, args);
      };
      if (debounce) clearTimeout(timeout);
      if (debounce || !timeout) timeout = setTimeout(throttler, wait);
    };
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    return limit(func, wait, false);
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    return limit(func, wait, true);
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = slice.call(arguments);
    return function() {
      var args = slice.call(arguments);
      for (var i=funcs.length-1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };


  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    return _.filter(_.keys(obj), function(key){ return _.isFunction(obj[key]); }).sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (source[prop] !== void 0) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    // Check object identity.
    if (a === b) return true;
    // Different types?
    var atype = typeof(a), btype = typeof(b);
    if (atype != btype) return false;
    // Basic equality test (watch out for coercions).
    if (a == b) return true;
    // One is falsy and the other truthy.
    if ((!a && b) || (a && !b)) return false;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // One of them implements an isEqual()?
    if (a.isEqual) return a.isEqual(b);
    // Check dates' integer values.
    if (_.isDate(a) && _.isDate(b)) return a.getTime() === b.getTime();
    // Both are NaN?
    if (_.isNaN(a) && _.isNaN(b)) return false;
    // Compare regular expressions.
    if (_.isRegExp(a) && _.isRegExp(b))
      return a.source     === b.source &&
             a.global     === b.global &&
             a.ignoreCase === b.ignoreCase &&
             a.multiline  === b.multiline;
    // If a is not an object by this point, we can't handle it.
    if (atype !== 'object') return false;
    // Check for different array lengths before comparing contents.
    if (a.length && (a.length !== b.length)) return false;
    // Nothing else worked, deep compare the contents.
    var aKeys = _.keys(a), bKeys = _.keys(b);
    // Different object sizes?
    if (aKeys.length != bKeys.length) return false;
    // Recursive comparison of contents.
    for (var key in a) if (!(key in b) || !_.isEqual(a[key], b[key])) return false;
    return true;
  };

  // Is a given array or object empty?
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (hasOwnProperty.call(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
  };

  // Is a given value a function?
  _.isFunction = function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
  };

  // Is the given value `NaN`? `NaN` happens to be the only value in JavaScript
  // that does not equal itself.
  _.isNaN = function(obj) {
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false;
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.interpolate, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || null, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ') + "__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', tmpl);
    return data ? func(data) : func;
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      method.apply(this._wrapped, arguments);
      return result(this._wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

})();
(function() {
  var AssertionError, count, failCount, failedMessages, passCount;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __slice = Array.prototype.slice, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  failCount = 0;
  passCount = 0;
  count = 0;
  failedMessages = [];
  AssertionError = (function() {
    __extends(AssertionError, Error);
    function AssertionError(options) {
      this.toString = __bind(this.toString, this);      this.name = 'AssertionError';
      this.message = options.message;
      this.actual = options.actual;
      this.expected = options.expected;
      this.operator = options.operator;
    }
    AssertionError.prototype.toString = function() {
      "test";      return [this.name + ':', this.message].join(' ');
    };
    return AssertionError;
  })();
  if (typeof define === "undefined" || define === null) {
    define = function() {
      var args, name, ret, _i;
      args = 3 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 2) : (_i = 0, []), name = arguments[_i++], ret = arguments[_i++];
      return typeof module !== "undefined" && module !== null ? module.exports = ret() : void 0;
    };
  }
  define("drews-mixins", function() {
    var addToObject, addToObjectMaker, errorHandleMaker, exports, hosty, jsonGet, jsonHttpMaker, jsonObj, jsonPost, jsonRpcMaker, log, meta, metaMaker, metaObjects, p, polymorphic, postMessageHelper, set, setLocation, times, trigger, _;
    _ = require("underscore");
    exports = {};
    exports.asyncEx = function(len, cb) {
      return _.wait(len, function() {
        return cb(null, len);
      });
    };
    exports.asyncFail = function(len, cb) {
      return _.wait(len, function() {
        return cb(len);
      });
    };
    exports.doneMaker2 = function() {
      var allDone, allDoneCallback, done, doneLength, hold, id, length, live;
      allDoneCallback = function() {};
      allDone = function(cb) {
        return allDoneCallback = cb;
      };
      id = _.uniqueId();
      length = 0;
      doneLength = 0;
      live = true;
      done = function(err) {
        if (live === false) {
          return;
        }
        doneLength++;
        if (err) {
          allDoneCallback(err);
        }
        if (doneLength === length) {
          allDoneCallback(null);
          return live = false;
        }
      };
      hold = function() {
        return length++;
      };
      return [hold, done, allDone];
    };
    exports.doneMaker = function() {
      var allDone, allDoneCallback, done, doneLength, id, length, live, results;
      allDoneCallback = function() {};
      results = [];
      allDone = function(cb) {
        return allDoneCallback = cb;
      };
      id = _.uniqueId();
      length = 0;
      doneLength = 0;
      live = true;
      done = function() {
        var myLength;
        myLength = length;
        length++;
        return (function(myLength) {
          return function(err, result) {
            if (live === false) {
              return;
            }
            doneLength++;
            if (err) {
              allDoneCallback(err, results);
            }
            results[myLength] = result;
            if (doneLength === length) {
              allDoneCallback(null, results);
              return live = false;
            }
          };
        })(myLength);
      };
      return [done, allDone];
    };
    exports.on = function(obj, ev, callback) {
      var calls, list;
      calls = obj._callbacks || (obj._callbacks = {});
      list = calls[ev] || (calls[ev] = []);
      list.push(callback);
      obj._events = obj._callbacks;
      return obj;
    };
    exports.removeListener = function(obj, ev, callback) {
      var calls, i, item, list, _len;
      if (!ev) {
        obj._callbacks = {};
        obj._events = obj._callbacks;
      } else if (calls = obj._callbacks) {
        if (!callback) {
          calls[ev] = [];
        } else {
          list = calls[ev];
          if (!list) {
            return obj;
          }
          for (i = 0, _len = list.length; i < _len; i++) {
            item = list[i];
            if (callback === list[i]) {
              list.splice(i, 1);
              break;
            }
          }
        }
      }
      return obj;
    };
    trigger = function() {
      var args, callback, calls, ev, i, item, list, obj, _len;
      obj = arguments[0], ev = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (!(calls = obj._callbacks)) {
        return obj;
      }
      list = calls[ev];
      if (list = calls[ev]) {
        list = list.slice();
        for (i = 0, _len = list.length; i < _len; i++) {
          item = list[i];
          callback = list[i];
          if (callback) {
            callback.apply(obj, args);
          }
        }
      }
      return obj;
    };
    exports.trigger = trigger;
    exports.emit = exports.trigger;
    exports.addListener = exports.on;
    exports.unbind = exports.removeListener;
    exports.once = function(obj, ev, callback) {
      var g;
      g = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        exports.removeListener(obj, ev, g);
        return callback.apply(obj, args);
      };
      exports.addListener(obj, ev, g);
      return obj;
    };
    exports.graceful = function(errorFunc, callback) {
      var extraArgs, makeHandler;
      if (_.isArray(errorFunc)) {
        extraArgs = _.s(errorFunc, 1);
        errorFunc = errorFunc[0];
      } else {
        extraArgs = [];
      }
      makeHandler = function(func) {
        return function() {
          var err, results;
          err = arguments[0], results = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          if (err) {
            return errorFunc.apply(null, null, null);
          }
          return func.apply(null, results);
        };
      };
      if (callback) {
        return makeHandler(callback);
      } else {
        return makeHandler;
      }
    };
    exports.s = function(val, start, end) {
      var need_to_join, ret;
      need_to_join = false;
      ret = [];
      if (_.isString(val)) {
        val = val.split("");
        need_to_join = true;
      }
      if (start >= 0) {} else {
        start = val.length + start;
      }
      if (_.isUndefined(end)) {
        ret = val.slice(start);
      } else {
        if (end < 0) {
          end = val.length + end;
        } else {
          end = end + start;
        }
        ret = val.slice(start, end);
      }
      if (need_to_join) {
        return ret.join("");
      } else {
        return ret;
      }
    };
    exports.startsWith = function(str, with_what) {
      return _.s(str, 0, with_what.length) === with_what;
    };
    exports.rnd = function(low, high) {
      if (low == null) {
        low = 0;
      }
      if (high == null) {
        high = 100;
      }
      return Math.floor(Math.random() * (high - low + 1)) + low;
    };
    exports.time = function() {
      return (new Date()).getTime();
    };
    exports.replaceBetween = function(str, start, between, end) {
      var endpos, pos;
      pos = str.indexOf(start);
      if (pos === -1) {
        return str;
      }
      endpos = str.indexOf(end, pos + start.length);
      if (endpos === -1) {
        return str;
      }
      return _.s(str, 0, pos + start.length) + between + _.s(str, endpos);
    };
    exports.trimLeft = function(obj) {
      return obj.toString().replace(/^\s+/, "");
    };
    exports.trimRight = function(obj) {
      return obj.toString().replace(/\s+$/, "");
    };
    exports.isNumeric = function(str) {
      if (_.isNumber(str)) {
        return true;
      }
      if (_.s(str, 0, 1) === "-") {
        return true;
      }
      if (_.s(str, 0, 1).match(/\d/)) {
        return true;
      } else {
        return false;
      }
    };
    exports.capitalize = function(str) {
      return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
    };
    exports.wait = function(miliseconds, func) {
      return setTimeout(func, miliseconds);
    };
    times = function(numb, func) {
      var i, _results;
      _results = [];
      for (i = 1; 1 <= numb ? i <= numb : i >= numb; 1 <= numb ? i++ : i--) {
        _results.push(func(i));
      }
      return _results;
    };
    exports.interval = function(miliseconds, func) {
      return setInterval(func, miliseconds);
    };
    exports.compareArrays = function(left, right) {
      var dupLeft, dupRight, inBoth, inLeftNotRight, inRightNotLeft, item, key, _i, _j, _len, _len2, _len3, _len4;
      inLeftNotRight = [];
      inRightNotLeft = [];
      inBoth = [];
      for (_i = 0, _len = left.length; _i < _len; _i++) {
        item = left[_i];
        if (__indexOf.call(right, item) >= 0) {
          inBoth.push(item);
        } else {
          inLeftNotRight.push(item);
        }
      }
      for (_j = 0, _len2 = right.length; _j < _len2; _j++) {
        item = right[_j];
        if (__indexOf.call(left, item) < 0) {
          inRightNotLeft.push(item);
        }
      }
      dupLeft = [];
      dupRight = [];
      for (key = 0, _len3 = left.length; key < _len3; key++) {
        item = left[key];
        if ((__indexOf.call(_.s(left, 0, key - 1), item) >= 0) || (__indexOf.call(_.s(left, key + 1), item) >= 0)) {
          dupLeft[item] = "";
        }
      }
      for (key = 0, _len4 = right.length; key < _len4; key++) {
        item = right[key];
        if ((__indexOf.call(_.s(right, 0, key - 1), item) >= 0) || (__indexOf.call(_.s(right, key + 1), item) >= 0)) {
          dupRight[item] = "";
        }
      }
      dupLeft = _.keys(dupLeft);
      dupRight = _.keys(dupRight);
      return [inLeftNotRight, inRightNotLeft, inBoth, dupLeft, dupRight];
    };
    exports.pacManMapMaker = function(left, right, top, bottom) {
      return 1;
    };
    exports.populateArray = function(obj, key, value) {
      if (!_.isArray(obj[key])) {
        obj[key] = [];
      }
      return obj[key].push(value);
    };
    setLocation = function(stuff, cb) {};
    log = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return typeof console !== "undefined" && console !== null ? console.log.apply(console, args) : void 0;
    };
    exports.log = log;
    hosty = null;
    postMessageHelper = function(yourWin, origin, methods) {
      var callbacks, events, host, self;
      if (methods == null) {
        methods = {};
      }
      self = {};
      host = {};
      self.addMethods = function(fns) {
        return _.extend(methods, fns);
      };
      self.addMethods({
        bind: function(event, callback) {}
      });
      events = {};
      callbacks = {};
      self.trigger = function() {};
      self.write = function() {};
      self.trigger = function() {
        var event, params;
        event = arguments[0], params = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      };
      self.bind = function(event, callback) {
        var id, subscribe, subscribeString;
        id = _.uuid();
        subscribe = {
          channel: event,
          id: id
        };
        subscribeString = JSON.stringify(subscribe);
        events[event] || (events[event] = []);
        events[event].push(callback);
        return yourWin.postMessage(subscribeString, origin);
      };
      self.call = function() {
        var callback, id, method, params, request, requestString, _i;
        method = arguments[0], params = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
        id = _.uuid();
        request = {
          method: method,
          params: params,
          id: id
        };
        requestString = JSON.stringify(request);
        callbacks[id] = callback;
        return yourWin.postMessage(requestString, origin);
      };
      $(window).bind("message", function(e) {
        var error, id, message, method, params, result;
        e = e.originalEvent;
        if (e.origin !== origin && origin !== "*") {
          return;
        }
        message = JSON.parse(e.data);
        if ("result" in message) {
          id = message.id, error = message.error, result = message.result;
          return typeof callbacks[id] === "function" ? callbacks[id](error, result) : void 0;
        } else if ("method" in message) {
          method = message.method, params = message.params, id = message.id;
          return typeof methods[method] === "function" ? methods[method].apply(methods, __slice.call(params).concat([function(err, result) {
            var response, responseString;
            if (err == null) {
              err = null;
            }
            if (result == null) {
              result = null;
            }
            response = {
              error: err,
              result: result,
              id: id
            };
            responseString = JSON.stringify(response);
            return yourWin.postMessage(responseString, origin);
          }])) : void 0;
        }
      });
      return self;
    };
    exports.postMessageHelper = postMessageHelper;
    exports.uuid = function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});;
    };
    errorHandleMaker = function(fns, handler) {
      var fn, ret, wasArray;
      ret = [];
      wasArray = true;
      if (!_.isArray(fns)) {
        fn = [fns];
        wasArray = false;
      }
      _.each(fns, function(fn) {
        return ret.push(function() {
          var args, cb, _i;
          args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
          return fn.apply(null, __slice.call(args).concat([function(err, result) {
            if (err) {
              handler(err, result);
            }
            return cb(err, result);
          }]));
        });
      });
      if (wasArray) {
        return ret;
      } else {
        return ret[0];
      }
    };
    addToObject = function(obj, key, value) {
      return obj[key] = value;
    };
    addToObjectMaker = function(obj) {
      return function(key, value) {
        return addToObject(obj, key, value);
      };
    };
    exports.addToObjectMaker = addToObjectMaker;
    jsonHttpMaker = function(method) {
      var http;
      return http = function() {
        var args, callback, contentType, data, url, _i, _ref;
        args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
        _ref = args, url = _ref[0], args = _ref[1], contentType = _ref[2];
        data = JSON.stringify(args || {});
        return $.ajax({
          url: "" + url,
          type: method || "POST",
          contentType: 'application/json' || contentType,
          data: data,
          dataType: 'json',
          processData: false,
          success: function(data) {
            return callback(null, data);
          },
          error: function(data) {
            return callback(JSON.parse(data.responseText));
          }
        });
      };
    };
    jsonPost = jsonHttpMaker("POST");
    jsonGet = jsonHttpMaker("GET");
    jsonHttpMaker = jsonHttpMaker;
    /*
      # example node.js method for handling this rpc
      pg "/rpc", (req, res) ->
        body = req.body
        {method, params, id} = body
        log method, params, id
        log rpcMethods[method]
        rpcMethods[method] params..., (err, result) ->
          res.send
            result: result
            error: err
            id: id
      */
    jsonRpcMaker = function(url) {
      return function() {
        var args, callback, method, _i;
        method = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
        return jsonPost(url, {
          method: method,
          params: args,
          id: _.uuid()
        }, function(err, data) {
          var error, id, result;
          result = data.result, error = data.error, id = data.id;
          return typeof callback === "function" ? callback(error || err, result) : void 0;
        });
      };
    };
    metaObjects = {};
    meta = function(obj, defaulto) {
      var __mid;
      if (defaulto == null) {
        defaulto = {};
      }
      if (!(typeof obj === "object")) {
        return;
      }
      if ("__mid" in obj) {
        return metaObjects[obj.__mid];
      } else {
        __mid = _.uniqueId();
        obj.__mid = __mid;
        return metaObjects[__mid] = defaulto;
      }
    };
    set = function(obj, values) {
      _.each(values, function(value, key) {
        var changed, oldVal, oldVals;
        changed = {};
        oldVals = {};
        if (obj[key] !== value) {
          oldVal = obj[key];
          oldVals[key] = oldVal;
          obj[key] = value;
          changed[key] = value;
          return trigger(obj, "change:" + key, key, newVal, oldVal);
        }
      });
      if (changed.length > 0) {
        return trigger(obj, "change", changed, oldVals);
      }
    };
    metaMaker = function(val) {
      return function(obj, defaulto) {
        if (defaulto == null) {
          defaulto = {};
        }
        return (meta(obj))[val] || ((meta(obj))[val] = defaulto);
      };
    };
    polymorphic = function() {
      var args, member, obj, withMember;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      withMember = function(member, obj, chained) {
        var loopBack, ret, type;
        if (chained == null) {
          chained = false;
        }
        if (_.isFunction(member)) {
          ret = function() {
            var args;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            return member.apply(null, [obj].concat(__slice.call(args)));
          };
        } else if ((typeof obj === "object") && member in obj) {
          ret = obj[member];
          if (_.isFunction(ret)) {
            ret = _.bind(ret, obj);
          }
        } else if ((typeof obj === "object") && "_lookup" in obj) {
          ret = obj._lookup(obj, member);
        }
        if (ret === p.cont) {} else {
          type = obj._type;
          if (type) {
            ret = polymorphic(type, member);
          } else if (member in _) {
            ret = function() {
              var args, _ref;
              args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return (_ref = _(obj))[member].apply(_ref, args);
            };
          } else {
            ret = void 0;
          }
        }
        if (chained) {
          loopBack = function(member) {
            if (!member) {
              return ret;
            } else {
              return withMember(member, ret, true);
            }
          };
          if (_.isFunction(ret)) {
            return function() {
              var args;
              args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              ret = ret.apply(null, args);
              return loopBack;
            };
          } else {
            return loopBack;
          }
        } else {
          return ret;
        }
      };
      obj = args[0], member = args[1];
      if (args.length === 1) {
        return function(member) {
          return withMember(member, obj, true);
        };
      } else {
        return withMember(member, obj, false);
      }
    };
    polymorphic.cont = "continue looking up";
    p = polymorphic;
    jsonObj = function(obj) {
      var jsonExclusions, ret;
      ret = {};
      jsonExclusions = (p(obj, "jsonExclusions")) || [];
      _.each(obj(function(value, key) {
        if (__indexOf.call(jsonExclusions, key) < 0) {
          if (typeof value === "object") {
            value = jsonObj(value);
          }
          return ret[key] = value;
        }
      }));
      return ret;
    };
    _.extend(exports, {
      jsonPost: jsonPost,
      jsonGet: jsonGet,
      jsonHttpMaker: jsonHttpMaker,
      jsonRpcMaker: jsonRpcMaker,
      meta: meta,
      set: set,
      metaMaker: metaMaker,
      polymorphic: polymorphic,
      jsonObj: jsonObj
    });
    /*    
    do ->
      giveBackTheCard = takeACard()
      giveBackTheCard()
    */
    exports.getAssertCount = function() {
      return count;
    };
    exports.getFailCount = function() {
      return failCount;
    };
    exports.getPassCount = function() {
      return passCount;
    };
    exports.setAssertCount = function(newCount) {
      return count = newCount;
    };
    exports.setPassCount = function(newCount) {
      return passCount = newCount;
    };
    exports.setFailCount = function(newCount) {
      return failCount = newCount;
    };
    exports.getFailedMessages = function() {
      return failedMessages;
    };
    exports.assertFail = function(actual, expected, message, operator, stackStartFunction) {
      var e;
      failCount++;
      count++;
      failedMessages.push(message);
      return e = {
        message: message,
        actual: actual,
        expected: expected,
        operator: operator,
        stackStartFunction: stackStartFunction
      };
    };
    exports.assertPass = function(actual, expected, message, operator, stackStartFunction) {
      passCount++;
      return count++;
    };
    exports.assertOk = function(value, message) {
      if (!!!value) {
        return _.assertFail(value, true, message, '==', exports.assertOk);
      } else {
        return _.assertPass(value, true, message, "==", _.assertOk);
      }
    };
    exports.assertEqual = function(actual, expected, message) {
      if (actual != expected) {
        return _.assertFail(actual, expected, message, '==', exports.assertEqual);
      } else {
        return _.assertPass(actual, expected, message, "==", exports.assertEqual);
      }
    };
    exports.assertNotEqual = function(actual, expected, message) {
      if (actual == expected) {
        return _.assertFail(actual, expected, message, '!=', exports.assertNotEqual);
      } else {
        return _.assertPass(actual, expected, message, '!=', exports.assertNotEqual);
      }
    };
    exports.eachArray = function(arr, fn) {
      var k, v, _len;
      for (k = 0, _len = arr.length; k < _len; k++) {
        v = arr[k];
        fn(v, k);
      }
      return arr;
    };
    _.mixin(exports);
    return exports;
  });
}).call(this);
(function() {
  var __slice = Array.prototype.slice;
  define("drews-event", function() {
    var drews, drewsEventMaker;
    drews = require("drews-mixins");
    return drewsEventMaker = function(obj) {
      var triggeree;
      triggeree = obj;
      obj.setTriggeree = function(_trig) {
        return triggeree = _trig;
      };
      obj.setEmittee = obj.setTriggeree;
      obj.on = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return drews.on.apply(drews, [obj].concat(__slice.call(args)));
      };
      obj.emit = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return drews.trigger.apply(drews, [triggeree].concat(__slice.call(args)));
      };
      obj.trigger = obj.emit;
      return obj;
    };
  });
}).call(this);
/*
    http://www.JSON.org/json2.js
    2010-08-25

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    this.JSON = {};
}

(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                   this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
.replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());(function() {
  define("router", function() {
    var Router, _;
    _ = require("underscore");
    Router = {};
    Router.init = function(routes) {
      var addRoute, checkUrl, escapeRegExp, extractParameters, namedParam, oldHash, routeToRegExp, routesList, self, splatParam, testRoutes;
      self = {};
      routes || (routes = {
        test: function(frag) {
          return alert("that was a test " + frag);
        },
        "app/:what": function(what2, what) {
          return alert(what);
        }
      });
      namedParam = /:([\w\d]+)/g;
      splatParam = /\*([\w\d]+)/g;
      escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g;
      routeToRegExp = function(route) {
        route = route.replace(escapeRegExp, "\\$&").replace(namedParam, "([^\/]*)").replace(splatParam, "(.*?)");
        return new RegExp('^' + route + '$');
      };
      extractParameters = function(route, actualFragment) {
        return route.exec(actualFragment).slice();
      };
      routesList = [];
      addRoute = self.addRoute = function(route, callback) {
        var newCallback;
        if (!(_.isRegExp(route))) {
          route = routeToRegExp(route);
        }
        newCallback = function(actualFragment) {
          var args;
          args = extractParameters(route, actualFragment);
          return callback.apply(null, args);
        };
        return routesList.push([route, newCallback]);
      };
      _.each(routes, function(callback, route) {
        return addRoute(route, callback);
      });
      testRoutes = self.testRoutes = function(fragment) {
        return _.any(routesList, function(_arg) {
          var callback, route;
          route = _arg[0], callback = _arg[1];
          if (route.test(fragment)) {
            callback(fragment);
            return true;
          }
        });
      };
      oldHash = "";
      checkUrl = function(callback) {
        var hash;
        hash = location.hash.slice(1);
        if (hash !== oldHash) {
          callback();
        }
        return oldHash = hash;
      };
      self.initHashWatch = function(callback) {
        callback || (callback = function(e) {
          var hash;
          hash = location.hash.slice(1);
          return testRoutes(hash);
        });
        callback();
        if ("onhashchange" in window) {
          return $(window).bind("hashchange", callback);
        } else {
          return setInterval((function() {
            return checkUrl(callback);
          }), 50);
        }
      };
      return self;
    };
    return Router;
  });
}).call(this);
(function() {
  define("mobilemin", function() {
    var drews, nimble, self, server, _;
    _ = require("underscore");
    drews = require("drews-mixins");
    nimble = require("nimble");
    server = drews.jsonRpcMaker("http://drewl.us:8010/rpc/");
    self = {};
    self.saveSite = function(name, html, cb) {
      return server("saveSite", name, html, cb);
    };
    return self;
  });
}).call(this);
(function() {
  var __slice = Array.prototype.slice;
  define("severus2", function() {
    return function() {
      var credentials, drews, extend, find, log, login, nimble, remove, save, self, serv, server, serverCallMaker, _;
      _ = require("underscore");
      drews = require("drews-mixins");
      nimble = require("nimble");
      server = drews.jsonRpcMaker("http://severus.drewl.us/rpc/");
      extend = _.extend, log = _.log;
      self = {};
      self.db = "severus_drewl_us";
      credentials = {};
      self.credentials = credentials;
      serverCallMaker = function(call) {
        return function() {
          var args, cb, collection, extra, obj, _i;
          args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
          collection = args[0], obj = args[1], extra = args[2];
          extra || (extra = {});
          args = {
            sessionId: self.sessionId,
            db: self.db,
            collection: collection,
            obj: obj
          };
          extend(args, extra);
          return server(call, args, cb);
        };
      };
      save = serverCallMaker("save");
      find = serverCallMaker("find");
      remove = serverCallMaker("remove");
      serv = function() {
        var args, call, cb, _i;
        call = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
        return server.apply(null, [call, self.sessionId, self.db].concat(__slice.call(args), [cb]));
      };
      login = function(username, password, cb) {
        return server("login", self.db, username, password, function(err, user) {
          self.sessionId = user.sessionId;
          self.user = user;
          return cb(null, user);
        });
      };
      return _.extend(self, {
        save: save,
        find: find,
        remove: remove,
        login: login,
        serv: serv,
        server: server
      });
    };
  });
}).call(this);
(function() {
  var $, AppPresenter, drews, eventer, loadScript, severus;
  define("zepto", function() {
    return Zepto;
  });
  define("underscore", function() {
    return _;
  });
  define("nimble", function() {
    return _;
  });
  $ = require("zepto");
  drews = require("drews-mixins");
  severus = require("severus2")();
  eventer = require("drews-event");
  define("app-view", function() {
    var AppView, Router, days, daysMonday, getDayRow, timeToMili;
    days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    daysMonday = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    timeToMili = function(time, date) {
      var am, hours, minutes, newDate, pm, ret;
      if (date == null) {
        date = new Date();
      }
      pm = _.s(time, -2, 2) === "pm";
      am = _.s(time, -2, 2) === "am";
      hours = 0;
      minutes = 0;
      if (am || pm) {
        time = _.s(time, 0, -2);
      }
      if (time.indexOf(":") >= 0) {
        time = time.split(":");
        hours = time[0];
        minutes = time[1];
      } else {
        hours = time;
      }
      if (pm) {
        hours = hours - 0 + 12;
      }
      console.log(pm);
      console.log(hours);
      newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
      return ret = newDate.getTime();
    };
    getDayRow = function(day, model) {
      var dayHtml, hoursHtml;
      if (model[day + "Open"]) {
        hoursHtml = "<td align=\"right\">" + model["" + day + "Start"] + "</td>\n<td> to </td>\n<td align=\"right\">" + model["" + day + "End"] + "</td>";
      } else {
        hoursHtml = "<td> Closed </td>";
      }
      return dayHtml = "<tr>\n  <td>" + (_.capitalize(day)) + "</td>\n    " + hoursHtml + "\n</tr>";
    };
    Router = require("router");
    AppView = {};
    AppView.init = function(options) {
      var displayDirections, displayHours, emit, extraStyles, initHome, mapText, menuMaker, model, nav, navItems, self, showPage;
      model = options.model;
      self = eventer({});
      emit = self.emit;
      extraStyles = $("<style>\n  \n  .phone-bar a {\n    color: " + model.phoneColor + "  \n  }\n\n  body {\n    color: " + model.bodyTextColor + ";\n    background-image: url('" + model.promo + "');\n    background-repeat: no-repeat;\n  }\n  \n  .headline {\n    color: " + model.headlineColor + "\n  }\n\n\n  .promo-wrapper {\n    color: " + model.promoTextColor + "\n  }\n\n  .nav-item, .full-site {\n    color: " + model.buttonsTextColor + "\n  }\n\n  .item .title {\n    color: " + (model.menuTitleTextColor || "black") + "\n  }\n\n  .item .price{\n    color: " + (model.menuPriceTextColor || "gray") + "\n  }\n\n  .item .description{\n    color: " + model.menuDescriptionTextColor + "\n  }\n  \n  .menu-gradient {\n    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%," + (model.menuColor1 || "white") + "), color-stop(1," + (model.menuColor2 || "#EFEFEF") + "));\n  }\n\n\n  .tile {\n    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%," + model.bodyColor1 + "), color-stop(1," + model.bodyColor2 + "));\n    \n  }\n\n  .promo-gradient {\n    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%," + model.promoColor1 + "), color-stop(1," + model.promoColor2 + "));\n  }\n\n</style>");
      extraStyles.appendTo($("head"));
      $("h1").bind("click", function() {
        return location.href = "#";
      });
      showPage = function(className) {
        var phoneText;
        $(".content .tile").hide();
        $(".content .tile." + className).show();
        if (className === "home") {
          className = "";
        }
        if (className !== "") {
          phoneText = model.phone;
        } else {
          phoneText = "";
        }
        return $(".headline").html("<div class=\"left\">" + navItems[className] + "</div>\n\n<div class=\"right phone-bar\"><a href=\"tel:" + phoneText + "\">" + phoneText + "</a></div>");
      };
      $(".content").append("<div class=\"clear\"></div>");
      if (model.address) {
        mapText = "Map";
      } else {
        mapText = "Locations";
      }
      navItems = {
        specials: "Specials",
        menu: model.itemsText,
        map: mapText,
        hours: "Hours",
        phone: "<span style=\"\">" + model.phone + "</span>",
        facebook: "facebook",
        twitter: "Twitter",
        "": model.headline
      };
      nav = self.nav = function(className) {
        var existingPhone, phone;
        scrollTo(0, 0, 1);
        if (className === "") {
          className = "home";
        }
        if (className === "specials") {
          existingPhone = localStorage.existingPhone;
          if (existingPhone != null ? existingPhone.match(/[\d]{10}/) : void 0) {
            showPage("specials");
            return;
          }
          phone = prompt("Enter your 10 digit phone number to view the Specials!");
          if (phone) {
            phone = phone.replace(/[^\d]/g, "");
            if (!phone.match(/[\d]{10}/)) {
              alert("Phone number must be 10 digits.");
              nav("specials");
              return;
            }
            emit("phone", phone);
            localStorage.existingPhone = phone;
            return showPage("specials");
          } else {
            return location.href = "#";
          }
        } else {
          return showPage(className);
        }
      };
      initHome = function() {
        var navHtml, promoImage, router, routes;
        routes = {};
        navHtml = "";
        _.each(navItems, function(navItemText, navItem) {
          var href, navItemUrl;
          routes[navItem] = function() {
            return nav(navItem);
          };
          if (navItem === "") {
            return;
          }
          href = "#" + navItem;
          if (navItem === "call") {
            href = "tel:" + model.phone;
          }
          if (navItem === "twitter") {
            if (model.twitterUrl) {
              href = model.twitterUrl;
            } else {
              return;
            }
          }
          if (navItem === "facebook") {
            if (model.facebookUrl) {
              href = model.facebookUrl;
            } else {
              return;
            }
          }
          navItemUrl = model[navItem + "Icon"] || ("http://drewl.us:8010/icons/" + navItem + ".png");
          return navHtml += "<a class=\"nav-item\" data-nav=\"" + navItem + "\" href=\"" + href + "\" style=\"background-image: url('" + navItemUrl + "')\">\n  <span>" + (_.capitalize(navItemText)) + "</span>\n</a>";
        });
        if (model.promo) {
          promoImage = "<img src=\"" + model.promo + "\" />";
        } else {
          promoImage = "";
        }
        navHtml = $("<div class=\"home tile page \">\n  <div class=\"promo\" style=\"position:absolute; z-index: -100;\">\n    <div class=\"promo-wrapper promo-gradient\" style=\"display:none;\">\n      <div class=\"promo-text paddinglr\">\n        " + model.promoText + "\n      </div>\n      <form class=\"phone-form paddinglr\" action=\"/\" method=\"POST\">\n        <div class=\"clearfix\">\n          <div class=\"input\">\n            <input id=\"phone\" name=\"phone\" type=\"tel\">\n            <input class=\"send\" type=\"submit\" value=\"Send\">\n          </div>\n        </div> <!-- /clearfix -->\n      </form>\n    </div>\n  </div>\n  <div class=\"nav\">\n    " + navHtml + "\n  </div>\n  <div class=\"clear\">\n  <br />\n  <br />\n<a class=\"full-site\" href=\"" + model.fullUrl + "\">Full Site</a><a class=\"full-site\" href=\"javascript:delete localStorage.existingPhone;void(0);\">.</a>\n</div>");
        $(".content").append(navHtml);
        navHtml.find("form").bind("submit", function(e) {
          e.preventDefault();
          return emit("phone", $("#phone").val());
        });
        router = Router.init(routes);
        return router.initHashWatch();
      };
      displayDirections = function() {
        var directionsHtml, htmlAddress, urlAddress;
        urlAddress = encodeURIComponent(model.address.replace(/\n/g, " "));
        htmlAddress = model.address.replace(/\n/g, "<br />");
        directionsHtml = "<div class=\"tile map hidden\">\n  <div class=\"paddinglr\">" + htmlAddress + "</div>\n\n  <!--<a target=\"blank\" href=\"http://maps.google.com/maps?daddr=" + urlAddress + "\">Google Map Directions</a>-->\n  <a target=\"blank\" href=\"http://maps.google.com/maps?q=" + urlAddress + "\">\n  <img src=\"http://maps.googleapis.com/maps/api/staticmap?center=" + urlAddress + "&zoom=14&size=320x320&markers=color:red|" + urlAddress + "&maptype=roadmap&sensor=false\" />\n  </a>\n</div>";
        return $(".content").append(directionsHtml);
      };
      displayDirections();
      displayHours = function() {
        var day, dayRows, hoursTable, _i, _len;
        dayRows = "";
        for (_i = 0, _len = daysMonday.length; _i < _len; _i++) {
          day = daysMonday[_i];
          dayRows += getDayRow(day, model);
        }
        hoursTable = " \n<table class=\"paddinglr\">\n  <tbody>\n    " + dayRows + "\n  </tbody>\n</table>";
        return $(".content").append("<div class=\"hours tile hidden\">" + hoursTable + "</hours>");
      };
      displayHours();
      menuMaker = function(name) {
        var displayItems;
        displayItems = function() {
          var itemsTable;
          itemsTable = " \n<div class=\"items-table\">\n\n</div>";
          return $(".content").append("<div class=\"" + name + " tile hidden\">" + itemsTable + "</hours>");
        };
        displayItems();
        return self["add" + drews.capitalize(name)] = function(items) {
          if (name === "items") {
            console.log("you are adding an item");
          }
          return _.each(items, function(item) {
            console.log(item);
            return $(".content ." + name).append($("<div class=\"item menu-gradient\">\n    <div class=\"left\">\n      <img class=\"\"  src=\"" + (item.image || model.headerUrl) + "\" />\n    </div>\n    <div class=\"right relative\">\n      <div class=\"item-top-bar relative\">\n        <div class=\"title\">" + (item.title || "") + "</div>\n        <div class=\"price\">" + (item.price || "") + "</div>\n      </div>\n      <div class=\"description\">" + (item.description || "") + "</div>\n    </div>\n    <div class=\"clear\"></div>\n</div>"));
          });
        };
      };
      menuMaker("specials");
      menuMaker("menu");
      self.doHours = function() {
        var closeText, closeTime, date, day, isEvenOpen, openText, openTime, time;
        date = new Date();
        day = days[date.getDay()];
        isEvenOpen = model["" + day + "Open"];
        if (!isEvenOpen) {
          return $(".open").html("<a href=\"#hours\">Hours</a>");
        }
        openText = model["" + day + "Start"];
        closeText = model["" + day + "End"];
        openTime = timeToMili(openText);
        closeTime = timeToMili(closeText);
        time = drews.time();
        if (time >= openTime && time <= closeTime) {
          openText = "Open til " + (drews.s(closeText, 0, -2));
        } else {
          openText = "<a href=\"#hours\">Hours</a>";
        }
        $(".hours").text(openText);
        return $("[data-nav=hours] > span").html(openText);
      };
      initHome();
      return self;
    };
    return AppView;
  });
  loadScript = function(url, callback) {
    var script;
    return script = document.createElement("script");
  };
  define("app-presenter", function() {
    var AppPresenter, AppView, model;
    model = require("model");
    AppView = require("app-view");
    AppPresenter = {};
    AppPresenter.init = function() {
      var loadScripts, view;
      loadScripts = function() {};
      loadScripts(function() {
        return alert("ready");
      });
      severus.db = "mobilemin_" + model.name;
      view = AppView.init({
        model: model
      });
      view.doHours();
      severus.find("items", function(err, items) {
        items = items.sort(function(a, b) {
          return a.order - b.order;
        });
        return view.addMenu(items);
      });
      severus.find("specials", function(err, items) {
        items = items.sort(function(a, b) {
          return a.order - b.order;
        });
        return view.addSpecials(items);
      });
      return view.on("phone", function(phone) {
        return severus.save("phones", {
          phone: phone
        }, function(err) {});
      });
    };
    return AppPresenter;
  });
  AppPresenter = require("app-presenter");
  $(function() {
    AppPresenter.init();
    return drews.wait(1000, function() {
      return scrollTo(0, 0, 1);
    });
  });
}).call(this);
