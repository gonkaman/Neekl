(function (window, ko) {

    (function (funcName, baseObj) {
        // The public function name defaults to window.docReady
        // but you can pass in your own object and own function name and those will be used
        // if you want to put them in a different namespace
        funcName = funcName || "docReady";
        baseObj = baseObj || window;
        var readyList = [];
        var readyFired = false;
        var readyEventHandlersInstalled = false;

        // call this when the document is ready
        // this function protects itself against being called more than once
        function ready() {
            if (!readyFired) {
                // this must be set to true before we start calling callbacks
                readyFired = true;
                for (var i = 0; i < readyList.length; i++) {
                    // if a callback here happens to add new ready handlers,
                    // the docReady() function will see that it already fired
                    // and will schedule the callback to run right after
                    // this event loop finishes so all handlers will still execute
                    // in order and no new ones will be added to the readyList
                    // while we are processing the list
                    readyList[i].fn.call(window, readyList[i].ctx);
                }
                // allow any closures held by these functions to free
                readyList = [];
            }
        }

        function readyStateChange() {
            if (document.readyState === "complete") {
                ready();
            }
        }

        // This is the one public interface
        // docReady(fn, context);
        // the context argument is optional - if present, it will be passed
        // as an argument to the callback
        baseObj[funcName] = function (callback, context) {
            // if ready has already fired, then just schedule the callback
            // to fire asynchronously, but right away
            if (readyFired) {
                setTimeout(function () { callback(context); }, 1);
                return;
            } else {
                // add the function and context to the list
                readyList.push({ fn: callback, ctx: context });
            }
            // if document already ready to go, schedule the ready function to run
            if (document.readyState === "complete") {
                setTimeout(ready, 1);
            } else {
                if (!readyEventHandlersInstalled) {
                    readyEventHandlersInstalled = true;

                    // otherwise if we don't have event handlers installed, install them
                    if (document.addEventListener) {
                        // first choice is DOMContentLoaded event
                        document.addEventListener("DOMContentLoaded", ready, false);
                        // backup is window load event
                        window.addEventListener("load", ready, false);
                    } else {
                        // must be IE
                        document.attachEvent("onreadystatechange", readyStateChange);
                        window.attachEvent("onload", ready);
                    }
                }
            }
        };
    })("documentReady", window);

    window.nk = {};

    (function (api) {

        var _xcnt = 1;
        var _apiObjTypes = {
            TEMPLATE: 1,
            COMPONENT: 0
        };
        var _defaults = {
            TAG: 'div',
            CONTENT_TAG: 'virtual',
            PAIRED_TAG: true,
            BINDINGS: 'attr: ATTR(), style: STYLE(), css: CSS(), event: EVENT(), visible: VISIBLE, disable: DISABLE, ready:{init: INIT, update: UPDATE}'
        };

        var _updateMode = {
            NONE: 0,
            OVERRIDE: 1,
            MERGE: 2
        };

        var _registeredThemes = ko.observableArray(),
            _registeredComponents = ko.observableArray(),
            _baseComponentType = 'BaseComponent';


        function getRandomId(type) {
            var rid = (Math.random() * 10 + 1) + '' + _xcnt + '' + (Math.random() * 10 + 1);
            _xcnt++;
            switch (type) {
                case _apiObjTypes.TEMPLATE:
                    return 'nk_' + rid + '_tmpl';
                case _apiObjTypes.COMPONENT:
                    return 'nk_' + rid + '_cpt';
                default:
                    return 'nk_' + rid;
            }
        }

        api.Error = {};
        (function (err) {
            err.TrimStringError = function (message) {
                this.message = message;
                this.name = 'TrimStringError';
            };
            err.TrimStringError.prototype = new Error();

            err.ConfigError = function (message, option) {
                this.message = message;
                this.name = 'ConfigError';
                this.option = option;
            };
            err.ConfigError.prototype = new Error();

            err.TemplateError = function (message) {
                this.message = message;
                this.name = 'ConfigError';
            };
            err.TemplateError.prototype = new Error();

            err.ComponentError = function (message) {
                this.message = message;
                this.name = 'ComponentError';
            };
            err.ComponentError.prototype = new Error();

        }(api.Error));

        api.Utils = {};
        (function (utils) {

            utils.Types = {
                UNDEFINED: 'undefined', NUMBER: 'number', STRING: 'string', BOOLEAN: 'boolean',
                DATE: 'date', OBJECT: 'object', FUNCTION: 'function', ARRAY: 'array', NULL: 'null'
            };

            utils.ContentTypes = {
                TEXT: 'text',
                HTML: 'html',
                INPUT: 'input',
                INPUT_TEXT: 'text_input',
                FILE: 'file',
                CHOICE: 'choice',
                SELECT: 'select',
                CANVAS: 'canvas',
                IMAGE: 'img',
                IFRAME: 'iframe'
            };

            utils.UpdateMode = _updateMode;

            utils.getType = function (value) {
                switch (typeof value) {
                    case 'string':
                        return utils.Types.STRING;
                    case 'number':
                        return utils.Types.NUMBER;
                    case 'boolean':
                        return utils.Types.BOOLEAN;
                    case 'function':
                        return utils.Types.FUNCTION;
                    case 'object':
                        switch (Object.prototype.toString.call(value)) {
                            case '[object Array]':
                                return utils.Types.ARRAY;
                            case '[object Date]':
                                return utils.Types.DATE;
                            case '[object Null]':
                                return utils.Types.NULL;
                            default:
                                return value === null ? utils.Types.NULL : utils.Types.OBJECT;
                        }
                    default:
                        return utils.Types.UNDEFINED;
                }
            };
            utils.isArray = function (value) {
                return utils.getType(value) === utils.Types.ARRAY;
            };
            utils.isFunction = function (value) {
                return utils.getType(value) === utils.Types.FUNCTION;
            };
            utils.isBoolean = function (value) {
                return utils.getType(value) === utils.Types.BOOLEAN;
            };
            utils.isString = function (value) {
                return utils.getType(value) === utils.Types.STRING;
            };
            utils.isNumber = function (value) {
                return utils.getType(value) === utils.Types.NUMBER;
            };
            utils.isDate = function (value) {
                return utils.getType(value) === utils.Types.DATE;
            };
            utils.isObject = function (value) {
                return utils.getType(value) === utils.Types.OBJECT;
            };
            utils.isUndefined = function (value) {
                return value === undefined;
            };
            utils.isNull = function (value) {
                return value === null;
            };
            utils.isNullOrUndefined = function (value) {
                return value === undefined || value === null;
            };
            utils.typeMatch = function (value, type) {
                return this.getType(value) === type;
            };
            utils.trimString = function (value) {
                try {
                    return value.replace(/^\s+|\s+$/gm, '');
                }
                catch (e) {
                    if (e instanceof TypeError) {
                        throw new api.Error.TrimStringError("Utils.trimString() >> Unable to trim value: value is not a string");
                    } else {
                        throw new api.Error.TrimStringError("Utils.trimString() >> Unable to trim value");
                    }
                }
            };
            utils.isEmptyString = function (value) {
                return !utils.isString(value) || value === '';
            };
            utils.isWhiteSpaceString = function (value) {
                return !utils.isString(value) || utils.trimString(value) === '';
            };

            function getObjectProperty(object, arPropH) {
                return arPropH.length === 1 || object[arPropH[0]] === undefined
                    ? object[arPropH[0]]
                    : ko.isObservable(object[arPropH[0]])
                        ? getObjectProperty(object[arPropH[0]](), arPropH.splice(1))
                        : getObjectProperty(object[arPropH[0]], arPropH.splice(1));
            }

            function setObjectProperty(object, arPropH, value, setting, context) {
                if (arPropH.length === 1) {
                    if (!api.Utils.isWhiteSpaceString(arPropH[0])) {
                        updateObjectByMode(object, arPropH[0], value, setting, context);
                    }
                }
                else {
                    if (utils.isNullOrUndefined(object[arPropH[0]])) object[arPropH[0]] = {};
                    ko.isObservable(object[arPropH[0]])
                        ? setObjectProperty(object[arPropH[0]](), arPropH.splice(1), value, setting, context)
                        : setObjectProperty(object[arPropH[0]], arPropH.splice(1), value, setting, context);

                }
            }

            function updateObjectByMode(dest, property, value, mode, context) {
                if (typeof mode === 'function') {
                    mode(dest, property, value, context);
                } else {
                    switch (mode) {
                        case _updateMode.MERGE:
                            if (utils.isObject(value)) {
                                for (var subProp in value) {
                                    if (value.hasOwnProperty(subProp)) {
                                        setObjectProperty(dest[property], subProp.split('.'), value[subProp],
                                            utils.isObject(value[subProp]) ? _updateMode.MERGE : _updateMode.OVERRIDE);
                                    }
                                }
                            } else {
                                ko.isObservable(dest[property]) || ko.isComputed(dest[property])
                                    ? dest[property](value) : dest[property] = value;
                            }
                            break;
                        case _updateMode.NONE:
                            break;
                        default:
                            ko.isObservable(dest[property]) || ko.isComputed(dest[property])
                                ? dest[property](value) : dest[property] = value;
                            break;
                    }
                }

            }

            function deleteObjectProperty(object, arPropH) {
                if (arPropH.length === 1) delete object[arPropH[0]];
                else {
                    if (object[arPropH[0]] === undefined) return;
                    ko.isObservable(object[arPropH[0]])
                        ? deleteObjectProperty(object[arPropH[0]](), arPropH.splice(1))
                        : deleteObjectProperty(object[arPropH[0]], arPropH.splice(1));

                }
            }

            utils.getProperty = function (object, propertyName) {
                return getObjectProperty(object, propertyName.split('.'));
            };
            utils.setProperty = function (object, propertyName, value, setting, context) {
                setObjectProperty(object, propertyName.split('.'), value, setting, context);
            };
            utils.deleteProperty = function (object, propertyName) {
                deleteObjectProperty(object, propertyName.split('.'));
            };

            function parseOption(dest, source, option) {

                if (utils.isNullOrUndefined(option.from) && utils.isNullOrUndefined(option.to)) {
                    throw new api.Error.ConfigError("Utils.UpdateFrom() >> missing fields 'from' or 'to' in option", option);
                } else {
                    if (utils.isNullOrUndefined(option.from)) {
                        option.from = option.to;
                    } else {
                        if (utils.isNullOrUndefined(option.to)) {
                            option.to = option.from;
                        }
                    }
                }

                //if (!(utils.isUndefined(option.transform) || utils.isFunction(option.transform)))
                //    throw new api.Error.ConfigError("Utils.UpdateFrom() >> field 'transform' value must be a function", option);

                var srcValue = utils.getProperty(source, option.from);
                var rawValue = srcValue === undefined ? option.value : srcValue;
                if (rawValue === undefined) return;
                var value = ko.isObservable(rawValue) || ko.isComputed(rawValue) ? rawValue() : rawValue;
                if (value === undefined) return;

                if (!(utils.isNullOrUndefined(option.type) || utils.typeMatch(value, option.type)))
                    throw new api.Error.ConfigError("Utils.UpdateFrom() >> wrong type: source field " + option.from + " type do not match " + option.type + " type", option);

                if (option.updateMode === undefined
                    && option.isObservable === true
                    && api.Utils.getProperty(dest, option.to) === undefined) {
                    api.Utils.setProperty(dest, option.to, ko.isObservable(rawValue) || ko.isComputed(rawValue) ? rawValue : ko.observable(rawValue));
                } else {
                    api.Utils.setProperty(dest, option.to, value, option.updateMode, { SRC: source, DEST: dest, OPTIONS: option });
                }

            }

            function parseOption_old(dest, source, option) {

                for (var prop in option) {
                    if (option.hasOwnProperty(prop)) {
                        if (prop !== 'value' && prop !== 'transform'
                            && utils.isFunction(option[prop])) option[prop] = option[prop](dest, source, option);
                    }
                }

                if (utils.isWhiteSpaceString(option.from) && utils.isWhiteSpaceString(option.to)) {
                    throw new api.Error.ConfigError("Utils.UpdateFrom() >> missing fields 'from' or 'to' in option", option);
                } else {
                    if (utils.isWhiteSpaceString(option.from)) {
                        option.from = option.to;
                    } else {
                        if (utils.isWhiteSpaceString(option.to)) {
                            option.to = option.from;
                        }
                    }
                }

                if (utils.getProperty(source, option.from) === undefined && option.value === undefined) {
                    if (utils.isBoolean(option.required) && option.required)
                        throw new api.Error.ConfigError("Utils.UpdateFrom() >> field '" + option.from + "' is required!", option);
                    else return;
                }

                if (!(utils.isUndefined(option.isObservable) || utils.isBoolean(option.isObservable)))
                    throw new api.Error.ConfigError("Utils.UpdateFrom() >> field 'isObservable' value must be a boolean", option);

                if (!(utils.isUndefined(option.transform) || utils.isFunction(option.transform)))
                    throw new api.Error.ConfigError("Utils.UpdateFrom() >> field 'transform' value must be a function", option);

                if (!(utils.getProperty(source, option.from + '_COMPUTED') === undefined || utils.isBoolean(utils.getProperty(source, option.from + '_COMPUTED'))))
                    throw new api.Error.ConfigError("Utils.UpdateFrom() >> config field '" + option.from + "_COMPUTED' value must be a boolean", option);

                var value = utils.getProperty(source, option.from) === undefined
                            ? option.value
                            : utils.isFunction(option.transform)
                                        ? option.transform(source[option.from], source)
                                        : utils.getProperty(source, option.from);

                if (!(utils.isNullOrUndefined(option.type) || utils.typeMatch(value, option.type)))
                    throw new api.Error.ConfigError("Utils.UpdateFrom() >> wrong type: source field " + option.from + " type do not match " + option.type + " type", option);

                if (utils.isBoolean(option.isObservable) && option.isObservable) {
                    if (utils.getProperty(dest, option.to) === undefined) {
                        utils.setProperty(dest, option.to, utils.isArray(value) ? ko.observableArray() : ko.observable());
                        //dest[option.to] = utils.isArray(value) ? ko.observableArray() : ko.observable();
                    } else {
                        if (!ko.isObservable(utils.getProperty(dest, option.to)))
                            utils.setProperty(dest, option.to, utils.isArray(value) ? ko.observableArray() : ko.observable());
                        //dest[option.to] = utils.isArray(value) ? ko.observableArray() : ko.observable();
                    }
                    if (ko.isObservable(value) || ko.isComputed(value)) {
                        utils.setProperty(dest, option.to, value);
                        //dest[option.to] = value;
                    } else {
                        if (utils.isFunction(value)) {
                            if (utils.isBoolean(utils.getProperty(source, option.from + '_COMPUTED'))
                                && utils.getProperty(source, option.from + '_COMPUTED')) {
                                utils.setProperty(dest, option.to, ko.pureComputed(value));
                                //dest[option.to] = ko.computed(value);
                            } else {
                                utils.setProperty(dest, option.to, value, function (obj, prop, val) { obj[prop](val); });
                                //dest[option.to](value);
                            }
                        } else {
                            if (utils.isObject(value)) {
                                if (utils.isBoolean(utils.getProperty(source, option.from + '_COMPUTED'))
                                    && utils.getProperty(source, option.from + '_COMPUTED')
                                    && (utils.isFunction(value.read) || utils.isFunction(value.write))) {
                                    utils.setProperty(dest, option.to, ko.pureComputed(value));
                                    //dest[option.to] = ko.computed(value);
                                } else {
                                    utils.setProperty(dest, option.to, value, function (obj, prop, val) { obj[prop](val); });
                                    //dest[option.to](value);
                                }
                            } else {
                                utils.setProperty(dest, option.to, value, function (obj, prop, val) { obj[prop](val); });
                                //dest[option.to](value);
                            }
                        }
                    }
                } else {
                    utils.setProperty(dest, option.to, value);
                    //dest[option.to] = value;
                }
            };

            utils.updateFrom = function (dest, source, options) {
                if (!utils.isObject(source))
                    throw new api.Error.ConfigError("Utils.UpdateFrom() >> config must be an object!");
                if (!utils.isArray(options))
                    throw new api.Error.ConfigError("Utils.UpdateFrom() >> options must be an array!");
                for (var i = 0, option; option = options[i]; i++) {
                    parseOption(dest, source, option);
                }
            };

            utils.mergeBindings = function (bindings, mergeOptions) {

                function lexicalParse(bindingOptions) {

                    var index = -1,
                        lastReturn = 0,
                        state = 1,
                        lastState = 1,
                        lexRes = [],
                        end = false,
                        stack = [],
                        car = '',
                        stackActive = true,
                        stackActiveKey = '',
                        lexTab = [
                            ["State", "Steps", "$", "+", "-", ":", ",", "#", ''],
                            [1, 1, 2, 8, 8, 8, 4, 6, ''],
                            [2, 1, 8, 3, 3, 8, 8, 8, 'O'],
                            [3, 0, 1, 1, 1, 1, 1, 1, 'O'],
                            [4, 1, 5, 5, 5, 5, 5, 5, 'S'],
                            [5, -1, 1, 1, 1, 1, 1, 1, 'S'],
                            [6, 1, 7, 7, 7, 7, 7, 6, 'P'],
                            [7, -1, 1, 1, 1, 1, 1, 1, 'P'],
                            [8, 1, 9, 8, 8, 8, 10, 8, 'V'],
                            [9, 1, 8, 11, 11, 8, 10, 8, 'V'],
                            [10, -1, 1, 1, 1, 1, 1, 1, 'V'],
                            [11, -2, 1, 1, 1, 1, 1, 1, 'V']
                        ];

                    while (!end) {
                        index += lexTab[state][1];
                        end = index >= bindingOptions.length;
                        if (end) {
                            lexRes.push({ Type: lexTab[lastState][8], Value: bindingOptions.substring(lastReturn, index + 1) });
                            continue;
                        }
                        var y = 7;
                        car = bindingOptions[index];
                        switch (car) {
                            case '"':
                                if (stackActive) {
                                    stackActive = false;
                                    stackActiveKey = '"';
                                } else {
                                    if (stackActiveKey === '"') {
                                        stackActive = true;
                                        stackActiveKey = '';
                                    }
                                }
                                break;
                            case "'":
                                if (stackActive) {
                                    stackActive = false;
                                    stackActiveKey = "'";
                                } else {
                                    if (stackActiveKey === "'") {
                                        stackActive = true;
                                        stackActiveKey = '';
                                    }
                                }
                                break;
                            case '{':
                                if (stackActive) stack.push('{');
                                break;
                            case '}':
                                if (stackActive) stack.splice(-1, 1);
                                break;
                            case '(':
                                if (stackActive) stack.push('(');
                                break;
                            case ')':
                                if (stackActive) stack.splice(-1, 1);
                                break;
                            case '[':
                                if (stackActive) stack.push('[');
                                break;
                            case ']':
                                if (stackActive) stack.splice(-1, 1);
                                break;
                            case ',':
                                if (stackActive && stack.length > 0) car = '#';
                                break;
                            default:
                                break;
                        }

                        for (var i = 0, ch; ch = lexTab[0][i]; i++) {
                            if (ch === car) {
                                y = i;
                                break;
                            }
                        }

                        lastState = state;
                        state = lexTab[state][y];
                        if (state === 1) {
                            lexRes.push({ Type: lexTab[lastState][8], Value: bindingOptions.substring(lastReturn, index + 1) });
                            lastReturn = index + 1;
                        }

                    }

                    return lexRes;

                }

                function syntaxParse(bindingTokens) {
                    var index = 0,
                        lastIndex = 0,
                        state = 1,
                        synTab = [
                            ['s', 'O', 'P', 'V', 'S'], [1, 5, 2, 'x', 'x'], [2, 'x', 'x', 3, 'x'],
                            [3, 'x', 'x', 'x', 4], [4, 'x', 2, 'x', 'x'], [5, 'x', 6, 'x', 'x'],
                            [6, 5, 'x', 7, 8], [7, 5, 'x', 'x', 8], [8, 'x', 6, 'x', 'x']
                        ];

                    var statut = { INITIAL: 0, IN: 1, END: 2, FINAL: 3, BIN: 4 };
                    var s = statut.INITIAL;
                    var execTokens = [];


                    if (bindingTokens[0].Type === 'P') execTokens.push({ Operation: '$$', Bindings: [] });
                    while (s !== statut.FINAL && index < bindingTokens.length) {
                        switch (bindingTokens[index].Type) {
                            case 'O':
                                if (s === statut.END || s === statut.INITIAL || s === statut.BIN) {
                                    execTokens.push({ Operation: bindingTokens[index].Value, Bindings: [] });
                                    s = statut.IN;
                                } else {
                                    lastIndex = index - 1;
                                    s = statut.FINAL;
                                }
                                break;
                            case 'P':
                                if (s === statut.INITIAL || s === statut.IN) {
                                    execTokens[execTokens.length - 1].Bindings.push({
                                        Property: api.Utils.trimString(bindingTokens[index].Value),
                                        Value: ''
                                    });
                                    s = statut.BIN;
                                } else {
                                    lastIndex = index - 1;
                                    s = statut.FINAL;
                                }
                                break;
                            case 'V':
                                if (s === statut.BIN) {
                                    execTokens[execTokens.length - 1]
                                        .Bindings[execTokens[execTokens.length - 1]
                                            .Bindings.length - 1].Value = api.Utils.trimString(bindingTokens[index].Value);
                                    s = statut.END;
                                } else {
                                    lastIndex = index - 1;
                                    s = statut.FINAL;
                                }
                                break;
                            case 'S':
                                if (s === statut.END || s === statut.BIN) {
                                    s = statut.IN;
                                } else {
                                    lastIndex = index - 1;
                                    s = statut.FINAL;
                                }
                                break;
                            default:
                                break;
                        }

                        var y = -1;
                        for (var i = 0, type; type = synTab[0][i]; i++) {
                            if (type === bindingTokens[index].Type) {
                                y = i;
                                break;
                            }
                        }
                        if (y === -1) break;
                        state = synTab[state][y];
                        if (state === 'x') {
                            lastIndex = index;
                            break;
                        }
                        index++;
                    }

                    return execTokens;

                }

                function interpretor(execTokens, initialBindings) {

                    var finalTokens = syntaxParse(lexicalParse(initialBindings))[0].Bindings, tempTokens = [];

                    for (var i = 0, xtoken; xtoken = execTokens[i]; i++) {
                        switch (xtoken.Operation) {
                            case "$$":
                                finalTokens = xtoken.Bindings;
                                break;
                            case "$+":
                                for (var j = 0, btoken; btoken = xtoken.Bindings[j]; j++) {
                                    var exist = false;
                                    for (var k = 0, ftoken; ftoken = finalTokens[k]; k++) {
                                        if (ftoken.Property === btoken.Property) {
                                            ftoken.Value = btoken.Value;
                                            exist = true;
                                            break;
                                        }
                                    }
                                    if (!exist) {
                                        finalTokens.push(btoken);
                                    }
                                }
                                break;
                            case "$-":
                                tempTokens = [];
                                for (var j = 0, ftoken; ftoken = finalTokens[j]; j++) {
                                    var exist = false;
                                    for (var k = 0, btoken; btoken = xtoken.Bindings[k]; k++) {
                                        if (ftoken.Property === btoken.Property) {
                                            exist = true;
                                            break;
                                        }
                                    }
                                    if (!exist) tempTokens.push(ftoken);
                                }
                                finalTokens = tempTokens;
                                break;
                            default:
                                break;

                        }

                    }

                    var res = "";
                    for (var i = 0, token; token = finalTokens[i]; i++) {
                        if (i > 0) res += ', ';
                        res += token.Property + token.Value;
                    }
                    return res;

                }

                return interpretor(syntaxParse(lexicalParse(mergeOptions)), bindings);

            };

            //utils.renderTemplate = function (template) {
            //    if (!utils.isFunction(template.GetType) || template.GetType() !== _apiObjTypes.TEMPLATE) return;
            //    template.render();
            //};

        }(api.Utils));

        api.Routing = {};
        (function (router) {
            router.__currentData = null;
            router.__ignored = [];
            router.__useHash = ko.observable(true);

            router.Route = function (route, data, title) {
                if (!(window.history && history.pushState) || router.__useHash()) {
                    if (data !== null && data !== 'undefined') router.__currentData = data;
                    if (title !== null && title !== 'undefined') window.document.title = title;
                    window.location.hash = route;
                } else {
                    history.pushState(data, title, route);
                }
            };

            router.ReplaceRoute = function (route, data, title) {
                if (!(window.history && history.pushState) || router.__useHash()) {
                    if (data !== null && data !== 'undefined') router.__currentData = data;
                    if (title !== null && title !== 'undefined') window.document.title = title;
                    router.__ignored.push(window.location.hash);
                    window.location.hash = route;
                } else {
                    history.replaceState(data, title, route);
                }
            };

            router.ParseRoute = ko.observable(function (route, data) { });

            router.onRouteChanged = function () {
                var route = (!(window.history && history.pushState) || router.__useHash()) ? window.location.hash.split('#')[1] : window.location.pathname;
                if (!(window.history && history.pushState) && router.__ignored.length > 0) {
                    for (var r, i; r = router.__currentData[i]; i++) {
                        if (r === route) {
                            history.back();
                            break;
                        }
                    }
                }
                router.ParseRoute()(route, router.__currentData);
            };

            router.Start = function () {
                var ev = (!(window.history && history.pushState) || router.__useHash()) ? 'hashchange' : 'popstate';
                //window.documentReady(router.onRouteChanged);
                if (window.addEventListener) {                    // For all major browsers, except IE 8 and earlier
                    window.addEventListener(ev, router.onRouteChanged, false);
                } else if (window.attachEvent) {                  // For IE 8 and earlier versions
                    window.attachEvent('on' + ev, router.onRouteChanged, false);
                }
            };

            //router.Enable = ko.observable(false);

            //router.Enable.subscribe(function (value) {
            //    var ev = (!(window.history && history.pushState)) ? 'hashchange' : 'popstate';
            //    if (value) {
            //        //documentReady(router.onRouteChanged);
            //        if (window.addEventListener) {                    // For all major browsers, except IE 8 and earlier
            //            window.addEventListener(ev, router.onRouteChanged, false);
            //        } else if (window.attachEvent) {                  // For IE 8 and earlier versions
            //            window.attachEvent('on' + ev, router.onRouteChanged, false);
            //        }
            //    } else {
            //        if (window.removeEventListener) {                    // For all major browsers, except IE 8 and earlier
            //            window.removeEventListener(ev, router.onRouteChanged, false);
            //        } else if (window.detachEvent) {                  // For IE 8 and earlier versions
            //            window.detachEvent('on' + ev, router.onRouteChanged, false);
            //        }
            //    }
            //});

        }(api.Routing));

        api.Component = function (name, config) {
            var res = name === _baseComponentType ? api.BaseComponent : api.Component.get(name);
            return typeof res === 'function' ? new res(config) : undefined;
        };
        (function (manager) {

            manager.create = function (options) {

                if (typeof options.NAME !== 'string') return;
                if (manager.isRegistered(options.NAME)) return;

                var entry = {
                    KEY: options.NAME,
                    PARENT: typeof options.PARENT === 'string' && manager.isRegistered(options.PARENT) ? options.PARENT : null,
                    VALUE: function (config) {
                        entry.VALUE.init(this, config);
                    },
                    SPECS: options.SPECS,
                    TEMPLATE: options.TEMPLATE
                };

                for (var property in api.BaseComponent.prototype) {
                    if (api.BaseComponent.prototype.hasOwnProperty(property)) {
                        entry.VALUE.prototype[property] = api.BaseComponent.prototype[property];
                    }
                }
                entry.VALUE.prototype.isComponent = function () { return true; }
                entry.VALUE.prototype.getType = function () { return entry.KEY; };
                entry.VALUE.prototype.is = function (type) { return entry.KEY === type || (entry.PARENT !== null && manager.get(entry.PARENT).is(type)); };
                entry.VALUE.prototype.getSpecs = function () { return entry.SPECS; };
                entry.VALUE.prototype.getBaseTemplate = function () { return entry.TEMPLATE; };

                if (api.Utils.isObject(options.PROTOTYPE)) {
                    for (var property in options.PROTOTYPE) {
                        if (options.PROTOTYPE.hasOwnProperty(property)) {
                            entry.VALUE.prototype[property] = options.PROTOTYPE[property];
                        }
                    }
                }


                entry.VALUE.beforeInit = options.BEFORE_INIT;
                entry.VALUE.afterInit = options.AFTER_INIT;

                entry.VALUE.init = function (cp, config) {

                    if (typeof entry.VALUE.beforeInit === 'function')
                        entry.VALUE.beforeInit(cp, config);

                    if (entry.PARENT === null) api.BaseComponent.init(cp, entry.SPECS, config);
                    else manager.get(entry.PARENT).init(cp, entry.SPECS, config);

                    if (api.Utils.isNullOrUndefined(entry.TEMPLATE)
                        && entry.PARENT !== null)
                        entry.TEMPLATE = manager.get(entry.PARENT).TEMPLATE;

                    if (!api.Utils.isNullOrUndefined(entry.TEMPLATE)
                        && api.Utils.isNullOrUndefined(config.TEMPLATE))
                        cp.TEMPLATE(entry.TEMPLATE);

                    if (typeof entry.VALUE.afterInit === 'function')
                        entry.VALUE.afterInit(cp, config);
                };

                _registeredComponents.push(entry);
            };

            manager.register = function (name, component, parent) {

                if (typeof name !== 'string' || typeof component !== 'function') return;
                if (manager.isRegistered(name)) return;
                var entry = {
                    KEY: name,
                    PARENT: typeof parent === 'string' && manager.isRegistered(options.PARENT) ? parent : null,
                    VALUE: component
                };

                for (var property in api.BaseComponent.prototype) {
                    if (api.BaseComponent.prototype.hasOwnProperty(property)) {
                        entry.VALUE.prototype[property] = api.BaseComponent.prototype[property];
                    }
                }

                if (entry.VALUE.getType === undefined) {
                    entry.VALUE.prototype.getType = function () {
                        return entry.KEY;
                    };
                }
                if (entry.VALUE.is === undefined) {
                    entry.VALUE.prototype.is = function (type) {
                        return entry.KEY === type || (entry.PARENT !== null && manager.get(entry.PARENT).is(type));
                    };
                }
                if (entry.VALUE.isComponent === undefined) {
                    entry.VALUE.prototype.isComponent = function () {
                        return true;
                    };
                }

                _registeredComponents.push(entry);
            };

            manager.remove = function (componentName) {
                if (_registeredComponents().length < 1) return;
                var _res = [];
                for (var i = 0, entry; entry = _registeredComponents()[i]; i++) {
                    if (entry.KEY !== componentName) {
                        _res.push(entry);
                    }
                }
                _registeredComponents(_res);
            };

            manager.get = function (componentName) {
                if (_registeredComponents().length < 1) return undefined;
                for (var i = 0, entry; entry = _registeredComponents()[i]; i++) {
                    if (entry.KEY === componentName) {
                        return entry.VALUE;
                    }
                }
                return undefined;
            };

            manager.isRegistered = function (componentName) {
                if (_registeredComponents().length < 1) return false;
                for (var i = 0, entry; entry = _registeredComponents()[i]; i++) {
                    if (entry.KEY === componentName) {
                        return true;
                    }
                }
                return false;
            };

            manager.display = function (component, element) {
                if (element !== null && element !== undefined) {
                    var att = document.createAttribute("data-bind");
                    if (api.Utils.isArray(component)) {
                        att.value = 'foreach: $data';
                        element.innerHTML += '<!--ko if: TEMPLATE().renderedAs === nk.Template.RenderingType.TEMPLATE -->'
                                           + '<!--ko template: { name: TEMPLATE().ID, data: $data, afterRender: AfterRender }--><!--/ko-->'
                                           + '<!--/ko-->'
                                           + '<!--ko if: TEMPLATE().renderedAs === nk.Template.RenderingType.COMPONENT -->'
                                           + '<!--ko component: { name: TEMPLATE().ID, params: $data } --><!--/ko-->'
                                           + '<!--/ko-->';
                    } else {
                        att.value = component.TEMPLATE().renderedAs === api.Template.RenderingType.TEMPLATE
                            ? "template: { name: TEMPLATE().ID, data: $data, afterRender: AfterRender }"
                            : "component: { name: TEMPLATE().ID, params: $data }";
                    }
                    element.setAttributeNode(att);
                    ko.applyBindings(component, element);
                } else {
                    var content = '';
                    if (api.Utils.isArray(component)) {
                        content = '<!--ko foreach: $data -->'
                            + '<!--ko if: TEMPLATE().renderedAs === nk.Template.RenderingType.TEMPLATE -->'
                            + '<!--ko template: { name: TEMPLATE().ID, data: $data, afterRender: AfterRender }--><!--/ko-->'
                            + '<!--/ko-->'
                            + '<!--ko if: TEMPLATE().renderedAs === nk.Template.RenderingType.COMPONENT -->'
                            + '<!--ko component: { name: TEMPLATE().ID, params: $data } --><!--/ko-->'
                            + '<!--/ko-->'
                            + '<!--/ko-->';
                    } else {
                        content = component.TEMPLATE().renderedAs === api.Template.RenderingType.TEMPLATE
                        ? '<!--ko data-bind="template: { name: TEMPLATE().ID, data: $data }" --><!--/ko-->'
                        : '<!--ko data-bind="component: { name: TEMPLATE().ID, params: $data }" --><!--/ko-->';
                    }
                    document.body.innerHTML = content + document.body.innerHTML;
                    ko.applyBindings(component);
                }
            };

        }(api.Component));

        function templateContent(content) {
            var self = this;
            self.VALUE = ko.observable('');
            self.FROM_VALUE = ko.observable(true);

            if (!api.Utils.isNullOrUndefined(content)) self.parse(content);

            function childsHtml() {
                var res = '';
                for (var i = 0, child; child = self.CHILDS()[i]; i++) {
                    res += child.html();
                }
                return res;
            };
            self.html = function () {
                return self.FROM_VALUE()
                    ? self.VALUE()
                    : self.TAG() === 'virtual'
                        ? '<!-- ko ' + self.BINDINGS() + ' -->' + childsHtml() + '<!-- /ko -->'
                        : self.TAG() === 'none'
                            ? childsHtml()
                            : self.PAIRED_TAG()
                                ? '<' + self.TAG() + ' data-bind="' + self.BINDINGS() + '">' + childsHtml() + '</' + self.TAG() + '>'
                                : '<' + self.TAG() + ' data-bind="' + self.BINDINGS() + '"/>';
            };

        }

        templateContent.prototype = {
            render: function (id, renderAsTemplate, noUpdate) {
                if (api.Utils.isWhiteSpaceString(id))
                    throw new api.Error.TemplateError("Template.Render() >> An error occured while rendering template!\n Template id must be a string");
                if (api.Utils.isWhiteSpaceString(this.html())) return;
                if (!(api.Utils.isBoolean(renderAsTemplate) && renderAsTemplate)) {

                    if (ko.components.isRegistered(id)) {
                        if (!noUpdate) {
                            ko.components.unregister(id);
                            ko.components.register(id, {
                                template: this.html()
                            });
                        }
                    } else {
                        ko.components.register(id, {
                            template: this.html()
                        });
                    }
                    //if (!(noUpdate && ko.components.isRegistered(id))) {
                    //    ko.components.register(id, {
                    //        template: this.html()
                    //    });
                    //}
                } else {
                    var tmpl = document.getElementById(id);
                    if (api.Utils.isNullOrUndefined(tmpl)) {
                        document.body.innerHTML += '<script type="text/html" id="' + id + '">' + this.html() + '</script>';
                    } else {
                        if (!noUpdate || tmpl.tagName !== 'script' || tmpl.getAttribute('type') !== 'text/html') {
                            tmpl.innerHTML = this.html();
                        } else {
                            throw new api.Error.TemplateError("Template.Render() >> An error occured while rendering template!\n Existing element with the same id '"
                                + id + "' that is not a script element!");
                        }
                    }
                }
            },
            parse: function (content) {
                if (api.Utils.isString(content)) {
                    if (api.Utils.isWhiteSpaceString(content))
                        throw new api.Error.TemplateError("Template() >> empty or white space strings are not allowed as content!");
                    this.FROM_VALUE(true);
                    this.VALUE(content);
                } else {
                    if (!api.Utils.isObject(content))
                        throw new api.Error.TemplateError("Template.Render() >> An error occured while rendering template!\n Template config must be an object");
                    this.FROM_VALUE(false);
                    api.Utils.updateFrom(this, content, [
                        { from: 'TAG', to: 'TAG', isObservable: true, value: _defaults.TAG, type: nk.Utils.Types.STRING },
                        { from: 'PAIRED', to: 'PAIRED_TAG', isObservable: true, value: true, type: nk.Utils.Types.BOOLEAN },
                        { from: 'BINDINGS', to: 'BINDINGS', isObservable: true, value: '', type: nk.Utils.Types.STRING },
                        {
                            from: 'CHILDS', to: 'CHILDS', isObservable: true, value: [], type: nk.Utils.Types.ARRAY,
                            updateMode: function (dest, property, value) {
                                dest[property] = ko.observableArray();
                                for (var i = 0, child; child = value[i]; i++) {
                                    dest[property].push(new templateContent(child));
                                }
                            }
                        }
                    ]);

                }

            }
        };

        function template(config, noRender, noUpdate) {
            var self = this;
            self._content = new templateContent();
            self.CONTENT = ko.pureComputed({
                read: function () {
                    return self._content;
                },
                write: function (value) {
                    self._content.parse(value);
                }
            });

            if (!api.Utils.isNullOrUndefined(config)) self.parse(config);
            if (!noRender) self.render(noUpdate);
        };

        template.prototype = {
            parse: function (config) {
                if (!api.Utils.isObject(config))
                    throw new api.Error.TemplateError("Template() >> config must be a string or an object!");
                try {
                    api.Utils.updateFrom(this, config, [
                        { from: 'ID', to: 'ID', type: api.Utils.Types.STRING, value: getRandomId(_apiObjTypes.TEMPLATE) },
                        { from: 'CONTENT', to: 'CONTENT', isObservable: true },
                        { from: 'AFTER_RENDER', to: 'AfterRender', type: api.Utils.Types.FUNCTION },
                        { from: 'RENDER_AS', to: 'RENDERING_TYPE', type: api.Utils.Types.STRING }
                    ]);
                } catch (e) {
                    if (e instanceof api.Error.ConfigError) {
                        throw new api.Error.TemplateError("Template() >> an error has occured while parsing template config!\n"
                            + "Source: " + e.option.from
                            + "\n" + e.message);
                    } else {
                        throw new api.Error.TemplateError("Template() >> an error has occured while parsing template config!\n" + e.message);
                    }

                }
            },
            render: function (noUpdate) {
                this._content.render(
                    this.ID,
                    api.Utils.isFunction(this.AfterRender)
                    || api.Utils.isWhiteSpaceString(this._content.html())
                    || this.RENDERING_TYPE === nk.Template.RenderingType.TEMPLATE
                    || (!ko.components),
                    noUpdate
                    );
            },
            renderedAs: function () {
                return api.Utils.isFunction(this.AfterRender)
                    || api.Utils.isWhiteSpaceString(this._content.html())
                    || this.RENDERING_TYPE === nk.Template.RenderingType.TEMPLATE
                    || (!ko.components)
                    ? nk.Template.RenderingType.TEMPLATE
                    : nk.Template.RenderingType.COMPONENT;
            },
            getType: function () {
                return _apiObjTypes.TEMPLATE;
            },
            isRendered: function () {
                return this.renderedAs() === nk.Template.RenderingType.COMPONENT
                    ? ko.components.isRegistered(this.ID)
                    : !api.Utils.isNullOrUndefined(document.getElementById(this.ID))
                    && document.getElementById(this.ID).tagName === 'SCRIPT'
                    && document.getElementById(this.ID).getAttribute('type') === 'text/html';
            },
            is: function (type) { return type === _apiObjTypes.TEMPLATE; }
        };

        api.Template = {};
        (function (tmpl) {

            tmpl.RenderingType = {
                TEMPLATE: 1,
                COMPONENT: 0
            };

            tmpl.isRendered = function (id) {
                return ko.components.isRegistered(id) || (
                    !api.Utils.isNullOrUndefined(document.getElementById(id))
                    && document.getElementById(id).tagName === 'SCRIPT'
                    && document.getElementById(id).getAttribute('type') === 'text/html');
            };

            tmpl.getTemplateToRender = function (property, type) {
                return api.Utils.isWhiteSpaceString(type)
                   ? {
                       TAG: 'virtual',
                       BINDINGS: 'with: '+ property,
                       CHILDS: [
                           {
                               TAG: 'virtual', BINDINGS: 'if: TEMPLATE().renderedAs === nk.Template.RenderingType.TEMPLATE',
                               CHILDS: [
                                    { TAG: 'virtual', BINDINGS: 'template: TEMPLATE().ID(), data: $data' }
                               ]
                           },
                           {
                               TAG: 'virtual', BINDINGS: 'if: TEMPLATE().renderedAs === nk.Template.RenderingType.COMPONENT',
                               CHILDS: [
                                    {
                                        TAG: 'virtual', BINDINGS: 'if:  ko.isObservable($data) || ko.isComputed($data) ',
                                        CHILDS: [
                                            { TAG: 'virtual', BINDINGS: 'component: { name: $data().TEMPLATE().ID, params: $data() }' }
                                        ]
                                    },
                                    {
                                        TAG: 'virtual', BINDINGS: 'if:  !ko.isObservable($data) && !ko.isComputed($data) ',
                                        CHILDS: [
                                            { TAG: 'virtual', BINDINGS: 'component: { name: TEMPLATE().ID, params: $data }' }
                                        ]
                                    }
                               ]
                           }
                       ]
                   }
                   : type === template.RenderingType.TEMPLATE
                   ? {
                       TAG: 'virtual', BINDINGS: 'foreach: ' + property + ',  beforeRemove: BEFORE_REMOVE_CHILD, afterAdd: AFTER_ADD_CHILD',
                       CHILDS: [
                               { TAG: 'virtual', BINDINGS: 'template: TEMPLATE().ID(), data: $data' }
                       ]
                   }
                   : {
                       TAG: 'virtual', BINDINGS: 'foreach: ' + property + ',  beforeRemove: BEFORE_REMOVE_CHILD, afterAdd: AFTER_ADD_CHILD',
                       CHILDS: [
                           {
                               TAG: 'virtual', BINDINGS: 'if:  ko.isObservable($data) || ko.isComputed($data) ',
                               CHILDS: [
                                   { TAG: 'virtual', BINDINGS: 'component: { name: TEMPLATE().ID, params: $data() }' }
                               ]
                           },
                            {
                                TAG: 'virtual', BINDINGS: 'if:  !ko.isObservable($data) && !ko.isComputed($data) ',
                                CHILDS: [
                                    { TAG: 'virtual', BINDINGS: 'component: { name: TEMPLATE().ID, params: $data }' }
                                ]
                            }
                       ]
                   };
            }

            tmpl.getTemplateForChilds = function (property, type) {
                if (api.Utils.isWhiteSpaceString(property)) property = 'CHILDS()';
                return api.Utils.isWhiteSpaceString(type)
                    ? {
                        TAG: 'none',
                        CHILDS: [
                            {
                                TAG: 'virtual', BINDINGS: 'if: TEMPLATE().renderedAs === nk.Template.RenderingType.TEMPLATE',
                                CHILDS: [
                                    {
                                        TAG: 'virtual', BINDINGS: 'foreach: ' + property + ',  beforeRemove: BEFORE_REMOVE_CHILD, afterAdd: AFTER_ADD_CHILD',
                                        CHILDS: [
                                             { TAG: 'virtual', BINDINGS: 'template: TEMPLATE().ID(), data: $data' }
                                        ]
                                    }
                                ]
                            },
                            {
                                TAG: 'virtual', BINDINGS: 'if: TEMPLATE().renderedAs === nk.Template.RenderingType.COMPONENT',
                                CHILDS: [
                                     {
                                         TAG: 'virtual', BINDINGS: 'foreach: ' + property + ',  beforeRemove: BEFORE_REMOVE_CHILD, afterAdd: AFTER_ADD_CHILD',
                                         CHILDS: [
                                            {
                                                TAG: 'virtual', BINDINGS: 'if:  ko.isObservable($data) || ko.isComputed($data) ',
                                                CHILDS: [
                                                    { TAG: 'virtual', BINDINGS: 'component: { name: $data().TEMPLATE().ID, params: $data() }' }
                                                ]
                                            },
                                            {
                                                TAG: 'virtual', BINDINGS: 'if:  !ko.isObservable($data) && !ko.isComputed($data) ',
                                                CHILDS: [
                                                    { TAG: 'virtual', BINDINGS: 'component: { name: TEMPLATE().ID, params: $data }' }
                                                ]
                                            }
                                         ]
                                     }
                                ]
                            }
                        ]
                    }
                    : type === template.RenderingType.TEMPLATE
                    ? {
                        TAG: 'virtual', BINDINGS: 'foreach: ' + property + ',  beforeRemove: BEFORE_REMOVE_CHILD, afterAdd: AFTER_ADD_CHILD',
                        CHILDS: [
                                { TAG: 'virtual', BINDINGS: 'template: TEMPLATE().ID(), data: $data' }
                        ]
                    }
                    : {
                        TAG: 'virtual', BINDINGS: 'foreach: ' + property + ',  beforeRemove: BEFORE_REMOVE_CHILD, afterAdd: AFTER_ADD_CHILD',
                        CHILDS: [
                            {
                                TAG: 'virtual', BINDINGS: 'if:  ko.isObservable($data) || ko.isComputed($data) ',
                                CHILDS: [
                                    { TAG: 'virtual', BINDINGS: 'component: { name: TEMPLATE().ID, params: $data() }' }
                                ]
                            },
                             {
                                 TAG: 'virtual', BINDINGS: 'if:  !ko.isObservable($data) && !ko.isComputed($data) ',
                                 CHILDS: [
                                     { TAG: 'virtual', BINDINGS: 'component: { name: TEMPLATE().ID, params: $data }' }
                                 ]
                             }
                        ]
                    };
            };

            tmpl.getDefaultBindings = function () {
                return _defaults.BINDINGS;
            };

            tmpl.getElementTemplate = function (tag, id, bindings, override) {
                var tmplId = id == null ? 'nk-element-' + tag + '-tmpl' : id;
                var tmplBindings = bindings == null
                    ? tmpl.getDefaultBindings()
                    : override ? bindings : tmpl.getDefaultBindings() + ', ' + bindings;
                return {
                    ID: tmplId,
                    CONTENT: {
                        TAG: 'virtual',
                        BINDINGS: 'if: IF()',
                        CHILDS: [
                            {
                                TAG: tag,
                                PAIRED: false,
                                BINDINGS: tmplBindings
                            }
                        ]
                    }
                };
            }

            tmpl.getInputTemplate = function() {
                return tmpl.getElementTemplate('input', 'nk-element-input-tmpl', 'textInput: VALUE, hasFocus: FOCUS', false);
            }

            tmpl.getInputVUTemplate = function() {
                return tmpl.getElementTemplate('input', 'nk-element-input_vu-tmpl', 'value: VALUE, hasFocus: FOCUS, valueUpdate: VALUE_UPDATE', false);
            }

            tmpl.getCheckBoxTemplate = function () {
                return tmpl.getElementTemplate('input', 'nk-element-checkbox-tmpl', 'checked: VALUE, hasFocus: FOCUS', false);
            }

            tmpl.getCheckBoxVPTemplate = function () {
                return tmpl.getElementTemplate('input', 'nk-element-checkbox_vp-tmpl', 'checked: VALUE, hasFocus: FOCUS, checkedValue: VALUE_PROPERTY', false);
            }

            tmpl.getContainerTemplate = function (tag, id, bindings, override) {
                var tmplId = id == null ? 'nk-container-' + tag + '-tmpl' : id;
                var tmplBindings = bindings == null
                    ? tmpl.getDefaultBindings()
                    : override ? bindings : tmpl.getDefaultBindings() + ', ' + bindings;
                return {
                    ID: tmplId,
                    CONTENT: {
                        TAG: 'virtual',
                        BINDINGS: 'if: IF()',
                        CHILDS: [
                            {
                                TAG: tag,
                                BINDINGS: tmplBindings,
                                CHILDS: [
                                    {
                                        TAG: 'virtual',
                                        BINDINGS: "if: hasText()",
                                        CHILDS: [
                                            { TAG: 'virtual', BINDINGS: 'text: TEXT()' }
                                        ]
                                    },
                                    {
                                        TAG: 'virtual',
                                        BINDINGS: "if: hasValue()",
                                        CHILDS: [
                                            tmpl.getTemplateToRender('VALUE()')
                                        ]
                                    },
                                    tmpl.getTemplateForChilds()
                                ]
                            }
                        ]
                    }
                };
            };

            tmpl.getSelectTemplate = function() {
                return tmpl.getContainerTemplate(
                    'select',
                    'nk-container-select-tmpl',
                    'value: VALUE, hasFocus: FOCUS, options: OPTIONS, selectedOptions: SELECTED_OPTIONS, optionsCaption: OPTIONS_CAPTION',
                    false);
            }

            tmpl.getSelectOVTemplate = function () {
                return tmpl.getContainerTemplate(
                    'select',
                    'nk-container-select_ov-tmpl',
                    'value: VALUE, hasFocus: FOCUS, optionsValue: VALUE_PROPERTY(), options: OPTIONS(), selectedOptions: SELECTED_OPTIONS, optionsCaption: OPTIONS_CAPTION()',
                    false);
            }

            tmpl.getSelectOTTemplate = function () {
                return tmpl.getContainerTemplate(
                    'select',
                    'nk-container-select-tmpl',
                    'value: VALUE, hasFocus: FOCUS, optionsText: OPTIONS_TEXT(), options: OPTIONS(), selectedOptions: SELECTED_OPTIONS, optionsCaption: OPTIONS_CAPTION()',
                    false);
            }

            tmpl.getSelectOVOTTemplate = function () {
                return tmpl.getContainerTemplate(
                    'select',
                    'nk-container-select_ov-tmpl',
                    'value: VALUE, hasFocus: FOCUS, optionsValue: VALUE_PROPERTY(), optionsText: OPTIONS_TEXT(), options: OPTIONS(), selectedOptions: SELECTED_OPTIONS, optionsCaption: OPTIONS_CAPTION()',
                    false);
            }

            tmpl.getVirtualContainerTemplate = function() {
                return {
                    ID: 'nk-container-virtual-tmpl',
                    CONTENT: {
                        TAG: 'virtual',
                        BINDINGS: 'if: IF()',
                        CHILDS: [
                            {
                                TAG: 'virtual',
                                BINDINGS: "if: hasText()",
                                CHILDS: [
                                    { TAG: 'virtual', BINDINGS: 'text: TEXT()' }
                                ]
                            },
                            {
                                TAG: 'virtual',
                                BINDINGS: "if: hasValue()",
                                CHILDS: [
                                    tmpl.getTemplateToRender('VALUE()')
                                ]
                            },
                            tmpl.getTemplateForChilds()
                        ]
                    }
                };
            };

            tmpl.getHtmlContainerTemplate = function(tag) {
                return {
                    ID: 'nk-html-container-' + tag + '-tmpl',
                    CONTENT: {
                        TAG: 'virtual',
                        BINDINGS: 'if: IF()',
                        CHILDS: [
                            {
                                TAG: tag,
                                BINDINGS: nk.Template.getDefaultBindings() + ' html: HTML()'
                            }
                        ]
                    }
                };
            };

            tmpl.createOrUpdate = function (config, noRender) {
                return new template(config, noRender);
            };

            tmpl.create = function (config, noRender) {
                return new template(config, noRender, true);
            };

        }(api.Template));

        //DisplayMode
        function displayMode(config) {
            this.MODE = '';
            this.SETTINGS = {};
            api.Utils.updateFrom(this, config, [
                { from: 'MODE', to: 'MODE', type: api.Utils.Types.STRING },
                { from: 'SETTINGS', to: 'SETTINGS' }
            ]);

        };

        //DisplayMap
        //==> Array of
        //  MODE| string - name, SETTINGS | displayModeSettings, UPDATE_MODE
        //
        function displayMap(defaultModes) {
            this.update(defaultModes);
        };

        displayMap.prototype = [];
        displayMap.prototype.update = function (displayModes) {
            var self = this;
            if (!nk.Utils.isArray(displayModes) || displayModes.length < 1) return;
            for (var i = 0, mode; mode = displayModes[i]; i++) {
                if (api.Utils.isWhiteSpaceString(mode.MODE)) continue;
                var exist = false;
                for (var j = 0; j < self.length; j++) {
                    if (self[j].MODE === mode.MODE) {
                        exist = true;
                        //if (mode.SOURCE_WIN) {
                        //    for (var property in mode.SETTINGS) {
                        //        if (self[j].SETTINGS.hasOwnProperty(property)) delete mode.SETTINGS[property];
                        //    }
                        //}
                        for (var property in mode.SETTINGS) {
                            if (mode.SETTINGS.hasOwnProperty(property)) {

                                var updateMode = _updateMode.OVERRIDE;

                                if (api.Utils.isArray(mode.UPDATE_MODES)) {

                                    for (var k = 0, config; config = mode.UPDATE_MODES[k]; k++) {
                                        if (config["for"] === property) {
                                            updateMode = config.updateMode;
                                            break;
                                        }
                                    }

                                    switch (updateMode) {
                                        case _updateMode.MERGE:
                                            if (api.Utils.isObject(self[j].SETTINGS[property])
                                                && api.Utils.isObject(mode.SETTINGS[property])) {
                                                api.Utils.updateFrom(self[j].SETTINGS, mode.SETTINGS, [
                                                    { from: property, to: property, updateMode: updateMode }
                                                ]);
                                            } else {
                                                self[j].SETTINGS[property] = mode.SETTINGS[property];
                                            }
                                            break;
                                        case _updateMode.NONE:
                                            continue;
                                        default:
                                            self[j].SETTINGS[property] = mode.SETTINGS[property];
                                            break;
                                    }
                                } else {
                                    self[j].SETTINGS[property] = mode.SETTINGS[property];
                                }
                            }
                        }
                        break;
                    }
                }
                if (exist) continue;
                self.push(new displayMode(mode));
                //if (!api.Utils.isNullOrUndefined(mode.SETTINGS.TEMPLATE)) {
                //    nk.Template.create(mode.SETTINGS.TEMPLATE);
                //}
            }
        };
        displayMap.prototype.applyMode = function (modeName, component, specs) {
            var self = this;
            var modes = modeName.split(' ');
            for (var i = 0; i < self.length; i++) {
                for (var j = 0, mode; mode = modes[j]; j++) {
                    if (self[i].MODE === mode) {
                        api.Utils.updateFrom(
                            component, typeof self[i].SETTINGS === 'function' ? self[i].SETTINGS(component) : self[i].SETTINGS,
                            specs);
                        break;
                    }
                }
                //if (self[i].MODE === modeName) {
                //    api.Utils.updateFrom(
                //        component, typeof self[i].SETTINGS === 'function' ? self[i].SETTINGS(component) : self[i].SETTINGS,
                //        specs);
                //    if (self[i].SETTINGS.CHILDS_INHERIT) {
                //        for (var j = 0; j < component.CHILDS().length; j++) {
                //            component.CHILDS()[j].DISPLAY_MODE(modeName);
                //        }
                //    }
                //    break;
                //}
            }
        };


        //Themes
        api.Themes = {};
        (function (themes) {

            //configItems ==> Array of
            //  WHERE|function, MAP|displayMap, MODE|string for selected displayMode, REFRESH|bool - refresh components
            //
            themes.register = function (name, configItems) {
                if (typeof name !== 'string' || !nk.Utils.isArray(configItems)) return;
                _registeredThemes.push({
                    NAME: name,
                    CONFIG: configItems
                });
            };

            themes.remove = function (name) {
                if (typeof name !== 'string' || _registeredThemes().length < 1) return;
                var res = [];
                for (var i = 0, theme; theme = _registeredThemes()[i]; i++) {
                    if (theme.NAME !== name) res.push(name);
                }
                _registeredThemes(res);
            };

            themes.isRegistered = function (name) {
                if (typeof name !== 'string' || _registeredThemes().length < 1) return false;
                for (var i = 0, theme; theme = _registeredThemes()[i]; i++) {
                    if (theme.NAME === name) return true;
                }
                return false;
            };

            themes.applyTheme = function (theme, component) {
                var _realTheme = null;
                if (!nk.isArray(theme)) {
                    if (typeof theme !== 'string' || _registeredThemes().length < 1) return;
                    for (var i = 0, item; item = _registeredThemes()[i]; i++) {
                        if (theme === item.NAME) {
                            _realTheme = item.CONFIG;
                            break;
                        }
                    }
                    if (!nk.Utils.isArray(_realTheme) || _realTheme.length < 1) return;
                } else {
                    if (theme.length < 1) return;
                    _realTheme = theme;
                }

                for (var i = 0, config; config = _realTheme[i]; i++) {
                    if (!(typeof config.WHERE === 'function' || config.WHERE(component))
                        || !(api.Utils.isArray(config.MAP) || typeof config.MAP === 'function')
                        ) continue;
                    self.DISPLAY_MAP.update(
                        typeof config.MAP === 'function' ? config.MAP(component) : config.MAP
                    );

                    var mode = typeof config.MODE === 'function' ? config.MODE(component) : config.MODE;
                    if (mode === undefined || mode === null || mode === component.DISPLAY_MODE()) {
                        if (config.REFRESH) {
                            var val = component.DISPLAY_MODE();
                            component.DISPLAY_MODE('__x_nk_unset__');
                            component.DISPLAY_MODE(val);
                        }
                        continue;
                    };
                    component.DISPLAY_MODE(mode);
                }
            };

        }(api.Themes));

        //Components

        //Component viewer, for multiview

        var viewerTemplate = api.Template.create({
            ID: '___nk_viewer_tmpl__',
            CONTENT: {
                TAG: 'virtual', BINDINGS: 'template: VIEW().ID(), data: MODEL()' 
            }
        });

        function componentViewer(component, viewName) {
            var self = this;
            self.MODEL = component;
            self.VIEWNAME = viewName;
        }

        componentViewer.prototype.TEMPLATE = function() {
            return { ID: viewerTemplate.ID, renderedAs: viewerTemplate.renderedAs() }
        };

        componentViewer.prototype.VIEW = function () {
            var self = this;
            if (self.MODEL.VIEWS().length < 1) return self.MODEL.TEMPLATE();
            for (var i = 0, view; view = self.MODEL.VIEWS()[i]; i++) {
                if (view.NAME === self.VIEWNAME) {
                    if (!(typeof view.VALUE === 'function')) return view.VALUE();
                    //var tmplConfig = component.__template()(component);
                    if (api.Utils.isFunction(view.VALUE.getType) && view.VALUE.getType() === _apiObjTypes.TEMPLATE) {
                        return { ID: view.VALUE.ID, renderedAs: view.VALUE.renderedAs() };
                    } else {
                        var tmpl = nk.Template.createOrUpdate(view.VALUE);
                        return { ID: tmpl.ID, renderedAs: tmpl.renderedAs() };
                    }
                }
            }
            return self.MODEL.TEMPLATE();
        };

        //Base component

        function baseComponent(config) {
            baseComponent.init(this, [], config);
        };

        baseComponent.init = function (component, specs, config) {

            var __specs = [
                { from: 'IF', to: 'IF', isObservable: true },
                { from: 'VISIBLE', to: 'VISIBLE', isObservable: true },
                { from: 'DISABLE', to: 'DISABLE', isObservable: true },
                { from: 'ATTR', to: 'ATTR', type: api.Utils.Types.OBJECT, isObservable: true },
                { from: 'STYLE', to: 'STYLE', type: api.Utils.Types.OBJECT, isObservable: true },
                { from: 'EVENT', to: 'EVENT', type: api.Utils.Types.OBJECT, isObservable: true },
                { from: 'TEMPLATE', to: 'TEMPLATE', isObservable: true },
                {
                    from: 'VIEWS', to: 'VIEWS', type: api.Utils.Types.ARRAY, isObservable: true,
                    updateMode: function(dest, property, value) {
                        if (value.length > 0) {
                            for (var i = 0, item; item = value[i]; i++) {
                                if (api.Utils.isWhiteSpaceString(item.NAME)) continue;
                                if (api.Utils.isNullOrUndefined(item.VALUE)) continue;
                                dest[property].push(item);
                            }
                        }
                    }
                },
                { from: 'INIT', to: 'INIT', type: api.Utils.Types.FUNCTION },
                { from: 'UPDATE', to: 'UPDATE', type: api.Utils.Types.FUNCTION },
                {
                    from: 'CHILDS', to: 'CHILDS',
                    updateMode: function (dest, property, value) {
                        if (api.Utils.isArray(value)) {
                            dest[property](value);
                        } else {
                            if (typeof value === 'function') {
                                if (ko.isComputed(value)) {
                                    dest.__computed_childs = value;
                                    dest.CHILDS = function() {
                                        var childs = dest.__computed_childs();
                                        for (var i = 0, item; item = childs[i]; i++) {
                                            item.__parent(dest);
                                        }
                                        return childs;
                                    }
                                } else {
                                    for (var i = 0, item; item = value()[i]; i++) {
                                        dest[property].push(item);
                                    }
                                }
                            }
                        }
                    }
                },
                { from: 'BEFORE_REMOVE_CHILD', to: 'BEFORE_REMOVE_CHILD', type: api.Utils.Types.FUNCTION },
                { from: 'AFTER_ADD_CHILD', to: 'AFTER_ADD_CHILD', type: api.Utils.Types.FUNCTION },
                { from: 'ID', to: 'ID', isObservable: true, type: api.Utils.Types.STRING },
                { from: 'TEXT', to: 'TEXT', isObservable: true },
                { from: 'HTML', to: 'HTML', isObservable: true },
                { from: 'VALUE', to: 'VALUE', isObservable: true },
                { from: 'CSS', to: 'CSS', isObservable: true }
            ];

            if (nk.Utils.isArray(specs) && specs.length > 0) {
                for (var i = 0, spec; spec = specs[i]; i++) {
                    __specs.push(spec);
                }
            }

            component.getAllSpecs = function () { return __specs; };
            component.__template = ko.observable('');
            component.TEMPLATE = ko.computed({
                read: function () {
                    if (!(typeof component.__template() === 'function')) return component.__template();
                    var tmplConfig = component.__template()(component);
                    if (api.Utils.isFunction(tmplConfig.getType) && tmplConfig.getType() === _apiObjTypes.TEMPLATE) {
                        return { ID: tmplConfig.ID, renderedAs: tmplConfig.renderedAs() };
                    } else {
                        var tmpl = nk.Template.createOrUpdate(tmplConfig);
                        return { ID: tmpl.ID, renderedAs: tmpl.renderedAs() };
                    }
                },
                write: function (value) {
                    if (api.Utils.isObject(value)) {
                        if (api.Utils.isFunction(value.getType) && value.getType() === _apiObjTypes.TEMPLATE) {
                            component.__template({ ID: value.ID, renderedAs: value.renderedAs() });
                        } else {
                            var tmpl = nk.Template.createOrUpdate(value);
                            component.__template({ ID: tmpl.ID, renderedAs: tmpl.renderedAs() });
                        }
                    } else {
                        component.__template(value);
                    }
                }
            });
            component.VIEWS = ko.observableArray([]);
            component.IF = ko.observable(true);
            component.VISIBLE = ko.observable(true);
            component.DISABLE = ko.observable(false);
            component.ATTR = ko.observable({});
            component.STYLE = ko.observable({});
            component.EVENT = ko.observable({});
            component.TEXT = ko.observable();
            component.HTML = ko.observable();
            component.VALUE = ko.observable();
            component.CSS = ko.observable();
            component.INIT = function () { };
            component.UPDATE = function () { };
            component.DISPLAY_MAP = ko.observableArray();
            component.DISPLAY_MODE = ko.observable('__x_nk_unset');
            component.__parent = ko.observable();
            component.PARENT = ko.pureComputed({
                read: function () {
                    return component.__parent();
                },
                write: function (value) {
                    if (ko.isObservable(value.CHILDS) && api.Utils.isArray(value.CHILDS()))
                        value.CHILDS.push(component);
                }
            });
            component.CHILDS = ko.observableArray();
            component.CHILDS.subscribe(function (changes) {
                for (var i = 0, change; change = changes[i]; i++) {
                    if (change.value === undefined) continue;
                    switch (change.status) {
                        case 'added':
                            if (!ko.isObservable(change.value.__parent)) {
                                change.value.__parent = ko.observable();
                                change.value.PARENT = ko.pureComputed({
                                    read: function () {
                                        return change.value.__parent();
                                    },
                                    write: function (value) {
                                        if (ko.isObservable(value.CHILDS) && api.Utils.isArray(value.CHILDS()))
                                            value.CHILDS.push(change.value);
                                    }
                                });
                            }
                            change.value.__parent(component);
                            break;
                        case 'removed':
                            change.value.__parent = ko.observable();
                            break;
                    }
                }
            }, null, 'arrayChange');

            if (!api.Utils.isNullOrUndefined(config)) {

                if (api.Utils.isNullOrUndefined(config.ATTR)) {
                    config.ATTR = { id:  typeof config.ID === 'string' 
                                ? config.ID
                                : getRandomId(_apiObjTypes.COMPONENT) };
                } else {
                    if (ko.isObservable(config.ATTR)) {
                        if (api.Utils.isNullOrUndefined(config.ATTR().id)) {
                            config.ATTR().id =
                                typeof config.ID === 'string' 
                                ? config.ID
                                : getRandomId(_apiObjTypes.COMPONENT); 
                        }
                    } else {
                        if (api.Utils.isNullOrUndefined(config.ATTR.id)) {
                            config.ATTR.id = 
                                 typeof config.ID === 'string'
                                ? config.ID
                                : getRandomId(_apiObjTypes.COMPONENT);//'__jsui_cp-' + Component.TOTAL;
                        }
                    }
                }

                component.DISPLAY_MAP = new displayMap([{ MODE: 'default', SETTINGS: config }]);
                if (api.Utils.isArray(config.DISPLAY_MAP)) {
                    component.DISPLAY_MAP.update(config.DISPLAY_MAP);
                }

                component.DISPLAY_MODE.subscribe(function (newValue) {
                    component.DISPLAY_MAP.applyMode(newValue, component, __specs);
                });

                component.DISPLAY_MODE(typeof config.DISPLAY_MODE === 'string' ? config.DISPLAY_MODE : 'default');

                if (api.Utils.isFunction(config.PROCESS)) {
                    config.PROCESS(component, config);
                }
            }
        };

        baseComponent.prototype = {
            getParent: function (index) {
                if (api.Utils.isUndefined(index)) return this.PARENT();
                if (!api.Utils.isNumber(index) || api.Utils.isNullOrUndefined(this.PARENT())) {
                    return null;
                } else {
                    if (index > 0) return this.PARENT().getParent(index - 1);
                    return this.PARENT();
                }
            },
            getDescendantsWhere: function (condition) {
                if (!api.Utils.isFunction(condition)) return [];
                if (this.CHILDS().length < 1) return [];
                var result = [];
                for (var i = 0, child; child = this.CHILDS()[i]; i++) {
                    if (condition(child)) result.push(child);
                    else {
                        var subResult = child.getDescendantsWhere(condition);
                        for (var j = 0; j < subResult.length; j++) {
                            result.push(subResult[j]);
                        }
                    }
                }
                return result;
            },
            getDescendantById: function (id) {
                if (api.Utils.isNullOrUndefined(id)) return null;
                if (this.CHILDS().length < 1) return null;
                for (var i = 0, child; child = this.CHILDS()[i]; i++) {
                    if (api.Utils.isNullOrUndefined(child.ATTR().id)) continue;
                    var exist = false;
                    if (api.Utils.isFunction(child.ATTR().id)) {
                        exist = child.ATTR().id() === id;
                    }
                    else {
                        exist = child.ATTR().id === id;
                    }
                    if (exist) return child;
                    else {
                        var subResult = child.getDescendantById(id);
                        if (subResult == null) continue;
                        else return subResult;
                    }
                }
                return null;
            },
            view: function (viewName) {
                var self = this;
                return {
                    MODEL: self,
                    VIEWNAME: viewName,
                    TEMPLATE: function () { return { ID: viewerTemplate.ID, renderedAs: viewerTemplate.renderedAs() }; },
                    VIEW: function() {
                        
                    }
                };
            },
            setChildsAsComputed: function (computation) {
                var self = this;
                self.__computed_childs = ko.computed(computation);
                self.CHILDS = function () {
                    var childs = self.__computed_childs();
                    for (var i = 0, item; item = childs[i]; i++) {
                        item.__parent(self);
                    }
                    return childs;
                }
            },
            applyTheme: function (theme) {
                var _realTheme = null, self = this;
                if (!api.Utils.isArray(theme)) {
                    if (typeof theme !== 'string' || _registeredThemes().length < 1) return;
                    for (var i = 0, item; item = _registeredThemes()[i]; i++) {
                        if (theme === item.NAME) {
                            _realTheme = item.CONFIG;
                            break;
                        }
                    }
                    if (!api.Utils.isArray(_realTheme) || _realTheme.length < 1) return;
                } else {
                    if (theme.length < 1) return;
                    _realTheme = theme;
                }

                for (var i = 0, config; config = _realTheme[i]; i++) {
                    if (!(typeof config.WHERE === 'function' || config.WHERE(self))
                        || !(api.Utils.isArray(config.MAP) || typeof config.MAP === 'function')
                        ) continue;
                    self.DISPLAY_MAP.update(
                        typeof config.MAP === 'function' ? config.MAP(self) : config.MAP
                    );

                    var mode = typeof config.MODE === 'function' ? config.MODE(self) : config.MODE;
                    if (mode === undefined || mode === null || mode === self.DISPLAY_MODE()) {
                        if (config.REFRESH) {
                            var val = self.DISPLAY_MODE();
                            self.DISPLAY_MODE('__x_nk_unset__');
                            self.DISPLAY_MODE(val);
                        }
                        continue;
                    };
                    self.DISPLAY_MODE(mode);
                }
            },
            getType: function () { return _baseComponentType; },
            is: function (type) { return type === _baseComponentType; },
            isComponent: function () { return true; },
            hasText: function () {
                return (typeof this.TEXT === 'function' && this.TEXT() != null);
            },
            hasValue: function () {
                return (typeof this.VALUE === 'function' && this.VALUE() != null);
            }
        };

        api.BaseComponent = baseComponent;

        api.Element = function (tag, config, css, id) {
            if (config == null) config = {};
            if (config.TEMPLATE == null) config.TEMPLATE = api.Template.getElementTemplate(tag);
            if (config.ID == null) config.ID = id;
            if (config.CSS == null) config.CSS = css;
            return api.Component('BaseComponent', config);
        }

        api.Virtual = function (config) {
            if (config == null) config = {};
            if (typeof config === 'function') {
                return api.Component('BaseComponent',
                {
                    TEMPLATE: api.Template.getVirtualContainerTemplate(),
                    COMPUTED_CHILDS: config,
                    PROCESS: function(cp) {
                        cp.setChildsAsComputed(function() {
                            return cp.COMPUTED_CHILDS();
                        });
                    }
                });
            }
            if (api.Utils.isArray(config)) {
                var content = [];
                if (config.length > 0) {
                    for (var i = 0, item; item = config[i]; i++) {
                        content.push(typeof item === 'string' ? api.Text(item) : item);
                    }
                }
                return api.Component('BaseComponent',
                   { CHILDS: content, TEMPLATE: api.Template.getVirtualContainerTemplate() });
            }
            if (typeof config.isComponent === 'function' && config.isComponent()) {
                return api.Component('BaseComponent',
                    { VALUE: config, TEMPLATE: api.Template.getVirtualContainerTemplate() });
            }
            if (!api.Utils.isObject(config)) {
                return api.Component('BaseComponent',
                    { TEXT: config, TEMPLATE: api.Template.getVirtualContainerTemplate() });
            }
            if (config.TEMPLATE === undefined)
                config.TEMPLATE = api.Template.getVirtualContainerTemplate();
            return api.Component('BaseComponent', config);

        }

        api.Text = function (config) {
            if (api.Utils.isArray(config)) {
                var content = [];
                if (config.length > 0) {
                    for (var i = 0, item; item = config[i]; i++) {
                        content.push(api.Text(item));
                        content.push(api.Element('br'));
                    }
                }
                return api.Virtual({ CHILDS: content });
            }
            return api.Virtual({ TEXT: config });
        }

        api.Container = function (tag, config, ctnClass, ctnId) {
            if (config == null) config = {};
            if (typeof config === 'function') {
                return api.Component('BaseComponent',
                {
                    TEMPLATE: api.Template.getContainerTemplate(tag),
                    CSS: ctnClass,
                    ID: ctnId,
                    COMPUTED_CHILDS: config,
                    PROCESS: function (cp) {
                        cp.setChildsAsComputed(function () {
                            return cp.COMPUTED_CHILDS();
                        });
                    }
                });
            }
            if (api.Utils.isArray(config)) {
                var content = [];
                if (config.length > 0) {
                    for (var i = 0, item; item = config[i]; i++) {
                        content.push(typeof item === 'string' ? api.Text(item) : item);
                    }
                }
                return api.Component('BaseComponent',
                   {
                       CHILDS: content,
                       CSS: ctnClass,
                       ID: ctnId,
                       TEMPLATE: api.Template.getContainerTemplate(tag)
                   });
            }
            if (typeof config.isComponent === 'function' && config.isComponent()) {
                return api.Component('BaseComponent',
                    {
                        VALUE: config,
                        CSS: ctnClass,
                        ID: ctnId,
                        TEMPLATE: api.Template.getContainerTemplate(tag)
                    });
            }
            if (! api.Utils.isObject(config)) {
                return api.Component('BaseComponent',
                {
                    TEXT: config,
                    CSS: ctnClass,
                    ID: ctnId,
                    TEMPLATE: api.Template.getContainerTemplate(tag)
                });
            }
            if (config.TEMPLATE == null) config.TEMPLATE = api.Template.getContainerTemplate(tag);
            if (config.ID == null) config.ID = ctnId;
            if (config.CSS == null) config.CSS = ctnClass;
            return api.Component('BaseComponent', config);
        }

        api.HtmlContainer = function (tag, config, ctnClass, ctnId) {
            if (config == null) config = {};
            if (typeof config === 'string' || typeof config === 'function') {
                return api.Component('BaseComponent',
                {
                    HTML: config,
                    CSS: ctnClass,
                    ID: ctnId,
                    TEMPLATE: api.Template.getHtmlContainerTemplate(tag)
                });
            }
            if (api.Utils.isArray(config)) {
                var content = [];
                if (config.length > 0) {
                    for (var i = 0, item; item = config[i]; i++) {
                        content.push(api.HtmlContainer(tag, item, ctnClass, ctnId));
                    }
                }
                return api.Virtual({ CHILDS: content });
            }
            if (config.TEMPLATE == null) config.TEMPLATE = api.Template.getHtmlContainerTemplate(tag);
            if (config.ID == null) config.ID = ctnId;
            if (config.CSS == null) config.CSS = ctnClass;
            return api.Component('BaseComponent', config);
        }

        api.Component.create({
            NAME: 'Input',
            TEMPLATE:function(input) {
                return input.hasValueUpdate()
                    ? api.Template.getInputTemplate()
                    : api.Template.getInputVUTemplate();
            },
            SPECS: [
                { from: 'FOCUS', to: 'FOCUS', isObservable: true, type: nk.Utils.Types.BOOLEAN },
                { from: 'VALUE_UPDATE', to: 'VALUE_UPDATE', isObservable: true, type: nk.Utils.Types.STRING }
            ],
            PROTOTYPE: {
                hasValueUpdate: function () {
                    return typeof (this.VALUE_UPDATE()) === 'string'
                               && (this.VALUE_UPDATE() === 'input'
                                || this.VALUE_UPDATE() === 'keyup'
                                || this.VALUE_UPDATE() === 'keypress'
                                || this.VALUE_UPDATE() === 'afterkeydown');
                }
            },
            BEFORE_INIT: function (component, config) {
                component.FOCUS = ko.observable(false);
                component.VALUE_UPDATE = ko.observable();
            }
        });

        api.Input = function(config, name, type, css, id, value, valueUpdate) {
            if (config == null) config = {};
            if (!api.Utils.isObject(config)) {
                return api.Component('Input', {
                    CSS: css,
                    ID: id,
                    ATTR:{ type: type, name: name },
                    VALUE: config
                });
            }
            if (config.ID == null) config.ID = id;
            if (config.CSS == null) config.CSS = css;
            if (config.ATTR == null) config.ATTR = {};
            if (config.ATTR.type == null) config.ATTR.type = type;
            if (config.ATTR.name == null) config.ATTR.name = name;
            if (config.VALUE == null) config.VALUE = value == null ? '' : value;
            if (config.VALUE_UPDATE == null) config.VALUE_UPDATE = valueUpdate;
            return api.Component('Input', config);
        }

        api.Component.create({
            NAME: 'CheckBox',
            TEMPLATE: function (input) {
                return input.hasValueProperty()
                    ? api.Template.getCheckBoxTemplate()
                    : api.Template.getCheckBoxVPTemplate();
            },
            SPECS: [
                { from: 'FOCUS', to: 'FOCUS', isObservable: true, type: nk.Utils.Types.BOOLEAN },
                { from: 'VALUE_PROPERTY', to: 'VALUE_PROPERTY', isObservable: true, type: nk.Utils.Types.STRING }
            ],
            PROTOTYPE: {
                hasValueProperty: function () {
                    return typeof (this.VALUE_PROPERTY()) === 'string';
                }
            },
            BEFORE_INIT: function (component, config) {
                component.FOCUS = ko.observable(false);
                component.VALUE_PROPERTY = ko.observable();
            }
        });

        api.CheckBox = function (config, name, type, css, id, value, valueProperty) {
            if (config == null) config = {};
            if (!api.Utils.isObject(config)) {
                return api.Component('CheckBox', {
                    CSS: css,
                    ID: id,
                    ATTR: { type: type, name: name },
                    VALUE: config
                });
            }
            if (config.ID == null) config.ID = id;
            if (config.CSS == null) config.CSS = css;
            if (config.ATTR == null) config.ATTR = {};
            if (config.ATTR.type == null) config.ATTR.type = type;
            if (config.ATTR.name == null) config.ATTR.name = name;
            if (config.VALUE == null) config.VALUE = value == null ? false : value;
            if (config.VALUE_PROPERTY == null) config.VALUE_PROPERTY = valueProperty;
            return api.Component('CheckBox', config);
        }

        api.Component.create({
            NAME: 'Select',
            TEMPLATE: function (input) {
                return input.hasOptionText()
                    ? ( hasOptionValue()
                        ? api.Template.getSelectOVOTTemplate()
                        : api.Template.getSelectOTTemplate())
                    : ( hasOptionValue()
                        ? api.Template.getSelectOVTemplate()
                        : api.Template.getSelectTemplate());
            },
            SPECS: [
                { from: 'FOCUS', to: 'FOCUS', isObservable: true, type: nk.Utils.Types.BOOLEAN },
                { from: 'VALUE_PROPERTY', to: 'VALUE_PROPERTY', isObservable: true, type: nk.Utils.Types.STRING },
                { from: 'OPTIONS', to: 'OPTIONS', isObservable: true, type: nk.Utils.Types.ARRAY },
                { from: 'OPTIONS_TEXT', to: 'OPTIONS_TEXT', isObservable: true, type: nk.Utils.Types.STRING },
                { from: 'SELECTED_OPTIONS', to: 'SELECTED_OPTIONS', isObservable: true, type: nk.Utils.Types.ARRAY },
                { from: 'OPTIONS_CAPTION', to: 'OPTIONS_CAPTION', isObservable: true, type: nk.Utils.Types.STRING }
            ],
            PROTOTYPE: {
                hasOptionText: function () { return typeof (this.OPTIONS_TEXT()) === 'string'; },
                hasOptionValue: function () { return typeof (this.VALUE_PROPERTY()) === 'string'; }
            },
            BEFORE_INIT: function (component, config) {
                component.FOCUS = ko.observable(false);
                component.VALUE_PROPERTY = ko.observable();
                component.OPTIONS = ko.observableArray();
                component.OPTIONS_TEXT = ko.observable();
                component.SELECTED_OPTIONS = ko.observableArray();
                component.OPTIONS_CAPTION = ko.observable();
            }
        });

        api.Select = function (config, css, id, options, optionsText, valueProperty, multiple) {
            if (config == null) config = {};
            if (typeof config === 'string') {
                return api.Component('Select',
                {
                    OPTIONS_CAPTION: config,
                    OPTIONS: options,
                    OPTIONS_TEXT: optionsText,
                    VALUE_PROPERTY: valueProperty,
                    ATTR:{multiple: multiple},
                    CSS: css,
                    ID: id
                });
            }
            if (typeof config === 'function' || api.Utils.isArray(config)) {
                return api.Component('Select',
                {
                    CSS: css,
                    ID: id,
                    OPTIONS: config,
                    OPTIONS_TEXT: optionsText,
                    VALUE_PROPERTY: valueProperty,
                    ATTR: { multiple: multiple },
                });
            }
            if (config.ID == null) config.ID = id;
            if (config.CSS == null) config.CSS = css;
            if (config.OPTIONS == null) config.OPTIONS = options;
            if (config.OPTIONS_TEXT == null) config.OPTIONS_TEXT = optionsText;
            if (config.VALUE_PROPERTY == null) config.VALUE_PROPERTY = valueProperty;
            if (config.ATTR == null) config.ATTR = {};
            if (config.ATTR.multiple == null) config.ATTR.multiple = multiple;
            return api.Component('Select', config);
        }


    }(nk));

    ko.bindingHandlers.ready = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var param = ko.unwrap(valueAccessor());
            if (nk.Utils.isFunction(param.init)) param.init(element, bindingContext);
        },
        update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var param = ko.unwrap(valueAccessor());
            if (nk.Utils.isFunction(param.update)) param.update(element, bindingContext);
        }
    };

}(window, ko));
