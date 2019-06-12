class Interceptor {
    constructor() {
        this.handler = [];
    }
    add(obj) {
        this.handler.push({
            request: obj.request,
            requestErr: obj.requestErr,
            response: obj.response,
            responseErr: obj.responseErr
        });
        return this.handler.length - 1;
    }
    remove(index) {
        delete this.handler[index];
    }
}

class Http {
    constructor() {
        this._init();
    }
    addInterceptor(obj) {
        this.interceptor.add(obj);
    }
    _init() {
        this._initInterceptor();
        this._initMethods();
    }
    _initInterceptor() {
        this.interceptor = new Interceptor();
        this.interceptor.add({
            request: function() {
                console.log('request');
            },
            requestErr: function() {
                console.log('request err');
            },
            response: function() {
                return new Promise(() => {
                    console.log('response');
                })
            },
            responseErr: function() {
                console.log('response err');
            }
        })
    }
    _initMethods() {
        const methods = ['get', 'post', 'delete', 'put'],
            requestInterceptor = () => {
                let result = [];
                this.interceptor.handler.forEach(v => {
                    result.push(v.request, v.requestErr);
                })
                return result;
            },
            responseInterceptor = () => {
                let result = [];
                this.interceptor.handler.forEach(v => {
                    result.push(v.response, v.responseErr);
                })
                return result;
            },
            injectBeforeRequest = (promise) => {
                let _requestInterceptors = requestInterceptor();
                for (let i = 0, len = _requestInterceptors.length; i < len;) {
                    let _r = _requestInterceptors[i++],
                        _rr = _requestInterceptors[i++];
                    promise.then(_r, _rr);
                }
                return promise;
            },
            injectAfterRequest = (promise) => {
                let _responseInterceptors = responseInterceptor();
                for (let i = 0, len = _responseInterceptors.length; i < len;) {
                    let _r = _responseInterceptors[i++],
                        _rr = _responseInterceptors[i++];
                    promise.then(_r, _rr);
                }
                return promise;
            },
            defaulRequest = (config = {}) => {
                return new Promise((resolve, reject) => {
                    config.success = (res) => {
                        console.log(res);
                    }
                    setTimeout(() => {
                        console.log('request ing');
                        resolve();
                    }, 1000);
                })
            };
        methods.forEach((v) => {
            this[v] = function(params) {
                let promise = Promise.resolve();
                //1.拦截请求
                promise = injectBeforeRequest(promise);
                //2.请求
                promise = promise.then(defaulRequest);
                // promise = promise.then(defaulRequest);
                //3.拦截结果
                promise = injectAfterRequest(promise);
                return promise;
            }
        })
    }
}

/**
 * Promise 封装 wx 原生方法
 */
class WxService {
    constructor() {
        this.__init()
    }
    __init() {
        this.__initTools()
        this.__initDefaults()
        this.__initMethods()
    }
    __initTools() {
        this.tools = {
            isArray(value) {
                return Array.isArray(value)
            },
            isObject(value) {
                return value !== null && typeof value === 'object'
            },
            isNumber(value) {
                return typeof value === 'number'
            },
            isDate(value) {
                return Object.prototype.toString.call(value) === '[object Date]'
            },
            isUndefined(value) {
                return typeof value === 'undefined'
            },
            toJson(obj, pretty) {
                if (this.isUndefined(obj)) return undefined
                if (!this.isNumber(pretty)) {
                    pretty = pretty ? 2 : null
                }
                return JSON.stringify(obj, null, pretty)
            },
            serializeValue(value) {
                if (this.isObject(value)) return this.isDate(value) ? value.toISOString() : this.toJson(value)
                return value
            },
            encodeUriQuery(value, pctEncodeSpaces) {
                return encodeURIComponent(value)
                    .replace(/%40/gi, '@')
                    .replace(/%3A/gi, ':')
                    .replace(/%24/g, '$')
                    .replace(/%2C/gi, ',')
                    .replace(/%3B/gi, ';')
                    .replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'))
            },
            paramSerializer(obj) {
                if (!obj) return ''
                let parts = []
                for (let key in obj) {
                    const value = obj[key]
                    if (value === null || this.isUndefined(value)) return
                    if (this.isArray(value)) {
                        value.forEach((v) => {
                            parts.push(this.encodeUriQuery(key) + '=' + this.encodeUriQuery(this.serializeValue(v)))
                        })
                    } else {
                        parts.push(this.encodeUriQuery(key) + '=' + this.encodeUriQuery(this.serializeValue(value)))
                    }
                }
                return parts.join('&')
            },
            buildUrl(url, obj) {
                const serializedParams = this.paramSerializer(obj)
                if (serializedParams.length > 0) {
                    url += ((url.indexOf('?') == -1) ? '?' : '&') + serializedParams
                }
                return url
            },
        }
    }

    /**
     * __initDefaults
     */
    __initDefaults() {
        // 缓存非异步方法
        this.noPromiseMethods = [
            'stopRecord',
            'pauseVoice',
            'stopVoice',
            'pauseBackgroundAudio',
            'stopBackgroundAudio',
            'showNavigationBarLoading',
            'hideNavigationBarLoading',
            'createAnimation',
            'createContext',
            'hideKeyboard',
            'stopPullDownRefresh',
            'createSelectorQuery',
        ]

        // 缓存 wx 接口方法名
        this.instanceSource = {
            method: Object.keys(wx)
        }
    }

    /**
     * 遍历 wx 方法对象，判断是否为异步方法，是则构造 Promise
     */
    __initMethods() {
        for (let key in this.instanceSource) {
            this.instanceSource[key].forEach((method, index) => {
                this[method] = (...args) => {
                    // 判断是否为非异步方法或以 wx.on 开头，或以 Sync 结尾的方法
                    if (this.noPromiseMethods.indexOf(method) !== -1 || method.substr(0, 2) === 'on' || /\w+Sync$/.test(method)) {
                        return wx[method](...args)
                    }
                    return this.__defaultRequest(method, ...args)
                }
            })
        }

        const navigate = [
            'navigateTo',
            'redirectTo',
            'switchTab',
            // 'navigateBack',
            'reLaunch',
        ]

        /**
         * 重写导航 API
         * @param {String} url  路径
         * @param {Object} params 参数
         */
        navigate.forEach((method, index) => {
            this[method] = (url, params) => {
                const obj = {
                    url,
                }
                if (method !== 'switchTab') {
                    obj.url = this.tools.buildUrl(url, params)
                }
                return this.__defaultRequest(method, obj)
            }
        })

        /**
         * 关闭当前页面，返回上一页面或多级页面
         * @param {Number} delta  返回的页面数，如果 delta 大于现有页面数，则返回到首页
         */
        this.navigateBack = (delta = 1) => {
            return wx.navigateBack({
                delta,
            })
        }
    }

    /**
     * 以 wx 下 API 作为底层方法
     * @param {String} method 方法名
     * @param {Object} obj    接收参数
     */
    __defaultRequest(method = '', obj = {}) {
        return new Promise((resolve, reject) => {
            obj.success = (res) => resolve(res)
            obj.fail = (res) => reject(res)
            wx[method](obj)
        })
    }
}

/**
 * 表单验证
 *
 * @param {Object} rules 验证字段的规则
 * @param {Object} messages 验证字段的提示信息
 *
 */
class Validator {
    constructor(rules = {}, messages = {}) {
        Object.assign(this, {
            rules,
            messages,
        })
        this.__init()
    }
    __init() {
        this.__initMethods()
        this.__initDefaults()
        this.__initData()
    }
    __initData() {
        this.form = {}
        this.errorList = []
    }
    __initDefaults() {
            this.defaults = {
                messages: {
                    required: '这是必填字段。',
                    email: '请输入有效的电子邮件地址。',
                    tel: '请输入11位的手机号码。',
                    phone: '请输入正确的联系方式。',
                    url: '请输入有效的网址。',
                    date: '请输入有效的日期。',
                    dateISO: '请输入有效的日期（ISO），例如：2009-06-23，1998/01/22。',
                    number: '请输入有效的数字。',
                    digits: '只能输入数字。',
                    idcard: '请输入18位的有效身份证。',
                    equalTo: this.formatTpl('输入值必须和 {0} 相同。'),
                    contains: this.formatTpl('输入值必须包含 {0}。'),
                    minlength: this.formatTpl('最少要输入 {0} 个字符。'),
                    maxlength: this.formatTpl('最多可以输入 {0} 个字符。'),
                    rangelength: this.formatTpl('请输入长度在 {0} 到 {1} 之间的字符。'),
                    min: this.formatTpl('请输入不小于 {0} 的数值。'),
                    max: this.formatTpl('请输入不大于 {0} 的数值。'),
                    range: this.formatTpl('请输入范围在 {0} 到 {1} 之间的数值。'),
                }
            }
        }
        /**
         * 初始化默认验证方法
         */
    __initMethods() {
        const that = this
        that.methods = {
            /**
             * 验证必填元素
             */
            required(value, param) {
                if (!that.depend(param)) {
                    return 'dependency-mismatch'
                } else if (typeof value === 'number') {
                    value = value.toString()
                } else if (typeof value === 'boolean') {
                    return !0
                }

                return value.length > 0
            },
            /**
             * 验证电子邮箱格式
             */
            email(value) {
                return that.optional(value) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value)
            },
            /**
             * 验证手机号码
             */
            tel(value) {
                return that.optional(value) || /^1[3456789]\d{9}$/.test(value)

            },
            /**
             * 验证手机固话
             */
            phone(value) {
                return that.optional(value) || /^(1[0-9][0-9])\d{8}$|^0\d{2,3}-?\d{7,8}$/.test(value)
            },
            /**
             * 验证URL格式
             */
            url(value) {
                return that.optional(value) || /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value)
            },
            /**
             * 验证日期格式
             */
            date(value) {
                return that.optional(value) || !/Invalid|NaN/.test(new Date(value).toString())
            },
            /**
             * 验证ISO类型的日期格式
             */
            dateISO(value) {
                return that.optional(value) || /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(value)
            },
            /**
             * 验证十进制数字
             */
            number(value) {
                return that.optional(value) || /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value)
            },
            /**
             * 验证整数
             */
            digits(value) {
                return that.optional(value) || /^\d+$/.test(value)
            },
            /**
             * 验证身份证号码
             */
            idcard(value) {
                return that.optional(value) || /^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}([0-9]|X)$/.test(value)
            },
            /**
             * 验证两个输入框的内容是否相同
             */
            equalTo(value, param) {
                return that.optional(value) || value === that.scope.detail.value[param]
            },
            /**
             * 验证是否包含某个值
             */
            contains(value, param) {
                return that.optional(value) || value.indexOf(param) >= 0
            },
            /**
             * 验证最小长度
             */
            minlength(value, param) {
                return that.optional(value) || value.length >= param
            },
            /**
             * 验证最大长度
             */
            maxlength(value, param) {
                return that.optional(value) || value.length <= param
            },
            /**
             * 验证一个长度范围[min, max]
             */
            rangelength(value, param) {
                return that.optional(value) || (value.length >= param[0] && value.length <= param[1])
            },
            /**
             * 验证最小值
             */
            min(value, param) {
                return that.optional(value) || value >= param
            },
            /**
             * 验证最大值
             */
            max(value, param) {
                return that.optional(value) || value <= param
            },
            /**
             * 验证一个值范围[min, max]
             */
            range(value, param) {
                return that.optional(value) || (value >= param[0] && value <= param[1])
            },
        }
    }

    /**
     * 添加自定义验证方法
     * @param {String} name 方法名
     * @param {Function} method 函数体，接收两个参数(value, param)，value表示元素的值，param表示参数
     * @param {String} message 提示信息
     */
    addMethod(name, method, message) {
            this.methods[name] = method
            this.defaults.messages[name] = message !== undefined ? message : this.defaults.messages[name]
        }
        /**
         * 判断验证方法是否存在
         */
    isValidMethod(value) {
            let methods = []
            for (let method in this.methods) {
                if (method && typeof this.methods[method] === 'function') {
                    methods.push(method)
                }
            }
            return methods.indexOf(value) !== -1
        }
        /**
         * 格式化提示信息模板
         */
    formatTpl(source, params) {
            const that = this
            if (arguments.length === 1) {
                return function() {
                    let args = Array.from(arguments)
                    args.unshift(source)
                    return that.formatTpl.apply(this, args)
                }
            }
            if (params === undefined) {
                return source
            }
            if (arguments.length > 2 && params.constructor !== Array) {
                params = Array.from(arguments).slice(1)
            }
            if (params.constructor !== Array) {
                params = [params]
            }
            params.forEach(function(n, i) {
                source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function() {
                    return n
                })
            })
            return source
        }
        /**
         * 判断规则依赖是否存在
         */
    depend(param) {
            switch (typeof param) {
                case 'boolean':
                    param = param
                    break
                case 'string':
                    param = !!param.length
                    break
                case 'function':
                    param = param()
                default:
                    param = !0
            }
            return param
        }
        /**
         * 判断输入值是否为空
         */
    optional(value) {
        return !this.methods.required(value) && 'dependency-mismatch'
    }

    /**
     * 获取自定义字段的提示信息
     * @param {String} param 字段名
     * @param {Object} rule 规则
     */
    customMessage(param, rule) {
        const params = this.messages[param]
        const isObject = typeof params === 'object'
        if (params && isObject) return params[rule.method]
    }

    /**
     * 获取某个指定字段的提示信息
     * @param {String} param 字段名
     * @param {Object} rule 规则
     */
    defaultMessage(param, rule) {
        let message = this.customMessage(param, rule) || this.defaults.messages[rule.method]
        let type = typeof message

        if (type === 'undefined') {
            message = `Warning: No message defined for ${rule.method}.`
        } else if (type === 'function') {
            message = message.call(this, rule.parameters)
        }

        return message
    }

    /**
     * 缓存错误信息
     * @param {String} param 字段名
     * @param {Object} rule 规则
     * @param {String} value 元素的值
     */
    formatTplAndAdd(param, rule, value) {
        let msg = this.defaultMessage(param, rule)

        this.errorList.push({
            param: param,
            msg: msg,
            value: value,
        })
    }

    /**
     * 验证某个指定字段的规则
     * @param {String} param 字段名
     * @param {Object} rules 规则
     * @param {Object} event 表单数据对象
     * @param {boolean} bool 是否是表单数据
     */
    checkParam(param, rules, event, bool = true) {
        let data = {};
        if (!bool) {
            let _event = {
                    detail: {
                        value: event
                    }
                }
                // 缓存表单数据对象
            this.scope = _event

            // 缓存字段对应的值
            data = _event.detail.value
        } else {
            // 缓存表单数据对象
            this.scope = event

            // 缓存字段对应的值
            data = event.detail.value
        }

        const value = data[param] || ''

        // 遍历某个指定字段的所有规则，依次验证规则，否则缓存错误信息
        for (let method in rules) {

            // 判断验证方法是否存在
            if (this.isValidMethod(method)) {

                // 缓存规则的属性及值
                const rule = {
                    method: method,
                    parameters: rules[method]
                }

                // 调用验证方法
                const result = this.methods[method](value, rule.parameters)

                // 若result返回值为dependency-mismatch，则说明该字段的值为空或非必填字段
                if (result === 'dependency-mismatch') {
                    continue
                }

                this.setValue(param, method, result, value)

                // 判断是否通过验证，否则缓存错误信息，跳出循环
                if (!result) {
                    this.formatTplAndAdd(param, rule, value)
                    break
                }
            }
        }
    }

    /**
     * 设置字段的默认验证值
     * @param {String} param 字段名
     */
    setView(param) {
        this.form[param] = {
            $name: param,
            $valid: true,
            $invalid: false,
            $error: {},
            $success: {},
            $viewValue: ``,
        }
    }

    /**
     * 设置字段的验证值
     * @param {String} param 字段名
     * @param {String} method 字段的方法
     * @param {Boolean} result 是否通过验证
     * @param {String} value 字段的值
     */
    setValue(param, method, result, value) {
        const params = this.form[param]
        params.$valid = result
        params.$invalid = !result
        params.$error[method] = !result
        params.$success[method] = result
        params.$viewValue = value
    }

    /**
     * 验证所有字段的规则，返回验证是否通过
     * @param {Object} event 表单数据对象
     */
    checkForm(event) {
        this.__initData()

        for (let param in this.rules) {
            this.setView(param)
            this.checkParam(param, this.rules[param], event)
        }

        return this.valid()
    }

    /**
     * 验证所有字段的规则，返回验证是否通过
     * @param {Object} obj json对象
     */
    checkObj(obj) {
        this.__initData()

        for (let param in this.rules) {
            this.setView(param)
            this.checkParam(param, this.rules[param], obj, false)
        }

        return this.valid()
    }

    /**
     * 返回验证是否通过
     */
    valid() {
        return this.size() === 0
    }

    /**
     * 返回错误信息的个数
     */
    size() {
        return this.errorList.length
    }

    /**
     * 返回所有错误信息
     */
    validationErrors() {
        return this.errorList
    }
}



export {
    Http,
    WxService,
    Validator
}