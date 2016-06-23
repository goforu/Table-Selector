/*!
 * Table Selector v0.0.1
 *
 * var selector = new Selector(
 *      id:selectorId, //selector id
 *      index:0, //index of key data
 *      title:title, //selector title
 *      hidable:true, //hide without selection; default:true
 *      actions:[ //add button
 *          {
 *              name:name,//button name
 *              action:function(){},//button action
 *          }
 *      ],
 *      table:{
 *          id:tableId,//table id
 *          data:"data", //attribute set on tr or td
 *          splitter:"," //split multiple data
 *      },
 *      listener:{ //trigger when a certain function called
 *          context:obj,//
 *          method:fn, //listened function
 *          action: function(){},//call after listened function called
 *          async:index// position of the argument in an async function
 *      }
 * );
 */
+function ($) {
    this.Selector = function (jsn) {
        this._template = '<div class="table-selector"><div class="table-selector-title"></div><ul class="table-selector-item"></ul> <div class="selector-action-container"></div></div>';
        this.selectedItems = [];
        this.index = jsn.index;
        this.actions = jsn.actions || [];
        this.table = jsn.table || {};
        this.table.splitter = jsn.table.splitter || ",";
        this.table.data = jsn.table.data || "data";
        this.table.type = jsn.table.type == "cell" ? "td" : "tr";
        //this.id = jsn.id;
        this.node = $('#' + jsn.id);
        this.title = jsn.title;
        //this.context = jsn.context;
        this.listeners = jsn.listeners || [];
        this.hidable = jsn.hidable == undefined ? true : jsn.hidable;
        this.style = jsn.style;
    };

    Selector.prototype = {
        _init: function (obj) {
            var _t = this;
            this.node = obj || this.node;
            if (!this.node || !this.node[0] instanceof HTMLElement) throw new Error('object is undefined or is not an HTMLElement');
            _t.table.id && $('#' + _t.table.id).addClass('selectable').addClass('selectable-' + _t.table.type);
            _t.node.html(_t._template);
        },
        //clear selected items
        clear: function () {
            this.selectedItems = [];
            this.refreshRows();
            this.node.find('.table-selector .table-selector-item').empty();
            this._showOrHide();
        },
        _showOrHide: function () {
            var _t = this;
            if (!_t.hidable) return false;
            if (_t.selectedItems.length > 0) {
                _t.node.show()
            } else {
                _t.node.hide();
            }
        },
        //monkey patch
        bindListener: function (funObj) {
            var _t = this;
            if (funObj != undefined) {
                Object.prototype.toString.call(funObj) === '[object Array]' ? _t.listeners.concat(funObj) : _t.listeners.push(funObj);
            }
            if (_t.listeners.length) {
                $.each(_t.listeners, function (i, p) {
                    if (!p.original) {
                        p.original = p.context[p.method];
                    }
                    p.context[p.method] = function () {
                    var async = p.async != undefined && typeof arguments[p.async] === "function";
                        if (async) {
                            var tempFun = arguments[p.async];
                            arguments[p.async] = function () {
                                var r = tempFun.apply(this, arguments);// won't work if callback function rely on context
                                p.action();
                                return r;
                            }
                        }
                        var result = p.original.apply(p.context, arguments);
                        !async && p.action();
                        return result;
                    }
                });
            }
            return this;
        },
        unbindListener: function (context/*object*/, fn/*string*/) {
            var _t = this;
            $.each(_t.listeners, function (i, p) {
                if (context[fn] === p.context[p.method]) {
                    context[fn] = p.original;
                    _t.listeners.splice(i, 1);
                }
            });
            return this;
        },
        unbindAllListeners: function () {
            var _t = this;
            $.each(_t.listeners, function (i, p) {
                p.context[p.method] = p.original
            });
            _t.listeners = [];
            return this;
        },
        //bind click events on table
        _bindEvent: function () {
            var _t = this;
            if (_t.table.id) {
                $('#' + _t.table.id).unbind().on('click', _t.table.type + '[' + _t.table.data + "]", function (e) {
                    if ($(e.target).is('a, input')) return;
                    if ($(this).toggleClass('selected').hasClass('selected')) {
                        _t.pushItem($(this).attr(_t.table.data).split(_t.table.splitter));
                    } else {
                        _t.removeItem($(this).attr(_t.table.data).split(_t.table.splitter));
                    }
                });

            }
        },
        //refresh after data changes
        refreshRows: function (/*optional*/option, /*optional*/item) {
            var _t = this;
            if (_t.table.id) {
                var list = [].concat(_t.selectedItems);
                $('#' + _t.table.id + ' ' + _t.table.type + '[' + _t.table.data + ']').each(function (i, dom) {
                    switch (option) {
                        case "remove":
                            if (_t._isDataEqual(item, $(dom).attr(_t.table.data).split(_t.table.splitter)) && $(dom).hasClass('selected')) {
                                $(dom).removeClass('selected');
                                return false;
                            }
                            break;
                        default:
                            $(dom).hasClass('selected') && $(dom).removeClass('selected');
                            for (var p in list) {
                                var data = $(dom).attr(_t.table.data).split(_t.table.splitter);
                                if (_t._isDataEqual(list[p], data)) {
                                    $(dom).addClass('selected');
                                    list.splice(p, 1);
                                }
                            }
                    }
                });
            }
            return this;
        },

        _isDataEqual: function (data1, data2) {
            for (var i = 0; i < data1.length; ++i) {
                if (data1[i] !== data2[i]) {
                    return false;
                }
            }
            return true;
        },

        _render: function () {
            var _t = this;
            _t.style && _t.node.css($.extend(_t.style, {overflow: "auto"}));
            _t.node.find('.table-selector .selector-action-container').empty();
            _t._renderActionButton();
            _t.title && _t.node.find('.table-selector .table-selector-title').text(_t.title);
            _t.refreshRows();
            _t._showOrHide();
        },

        show: function (obj) {
            this._init(obj);
            this._render();
            this.bindListener();
            this._bindEvent();
            return this;
        },

        _renderActionButton: function () {
            var _t = this;
            _t.node.find('.table-selector .selector-action-container').empty();
            $.each(_t.actions, function (i, p) {
                var actionButton = '<input type="button" value="' + p.name + '"/>';
                $(actionButton).appendTo(_t.node.find('.table-selector .selector-action-container')).on('click', function () {
                    p.action.apply(p.context || _t);
                    //p.action();
                });
            });
        },
        //add button
        addActionButton: function (obj) {
            var _t = this;
            if (obj != undefined) {
                Object.prototype.toString.call(obj) === '[object Array]' ? _t.actions = _t.actions.concat(obj) : _t.actions.push(obj);
            }
            _t._renderActionButton();
            return this;
        },

        pushItem: function (item) {
            var _t = this;
            if (typeof item === 'string') item = [item];
            var itemHtml = '<li><span class="selector-delete">×</span>' + item.join(':') + '</li>';
            $(itemHtml).appendTo(_t.node.find(' .table-selector .table-selector-item')).children('.selector-delete').on('click', function () {
                var index = $(this).parent().index();
                $(this).parent().remove();
                _t.refreshRows("remove", _t.selectedItems.splice(index, 1)[0]);
                _t._showOrHide();
                //$('.table-selector #selector-action-container').children().slice(i).remove();
            });
            this.selectedItems.push(item);
            _t._showOrHide();
            return this;
        },

        removeItem: function (item) {
            var _t = this;
            //var index = _t.index;
            $.each(this.selectedItems, function (i, p) {
                if (_t._isDataEqual(p, item)) {
                    _t.selectedItems.splice(i, 1);
                    _t._showOrHide();
                    _t.node.find('.table-selector .table-selector-item').children().slice(i, i + 1).remove();
                    return false;
                }
            });
            return this;
        },

        getSelectedItems: function () {
            var _t = this;
            if (_t.index != null) {
                var rst = [];
                $.each(this.selectedItems, function (i, p) {
                    if (p.length < _t.index + 1) throw new Error('index out of bounds!');
                    rst.push(p[_t.index]);
                });
                return rst;
            }
            return this.selectedItems;
        },
        destroy: function(){
            var _t = this;
            _t.unbindAllListeners();
            _t.table.id && $('#' + _t.table.id).removeClass('selectable').removeClass('selectable-' + _t.table.type);
            _t.node.empty();
        }
    };
}(jQuery);