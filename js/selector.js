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
 *          scope:obj,//
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
        this.table.splitter = jsn.table.splitter;
        this.table.data = jsn.table.data || "data";
        this.table.type = jsn.table.type == "cell" ? "td" : "tr";
        this.$tNode = $('#' + this.table.id);
        this.$node = $('#' + jsn.id);
        this.title = jsn.title;
        this.listeners = jsn.listeners || [];
        this.hidable = jsn.hidable == undefined ? true : jsn.hidable;
        this.style = jsn.style;
    };

    Selector.prototype = {
        _init: function () {
            if (!this.$node || !this.$node[0] instanceof HTMLElement) throw new Error('object is undefined or is not an HTMLElement');
            this.$tNode.addClass('selectable').addClass('selectable-' + this.table.type);
            this.$node.html(this._template);
        },
        //clear selected items
        clear: function () {
            this.selectedItems = [];
            this.refreshTable();
            this.$node.find('.table-selector .table-selector-item').empty();
            this._showOrHide();
        },
        _showOrHide: function () {
            if (!this.hidable) return false;
            if (this.selectedItems.length > 0) {
                this.$node.show()
            } else {
                this.$node.hide();
            }
        },
        //monkey patch
        bindListener: function (funObj) {
            if (funObj != undefined) {
                Object.prototype.toString.call(funObj) === '[object Array]' ? this.listeners.concat(funObj) : this.listeners.push(funObj);
            }
            if (this.listeners.length) {
                $.each(this.listeners, function (i, p) {
                    if (!p.original) {
                        p.original = p.scope[p.method];
                    }
                    p.scope[p.method] = function () {
                    var async = p.async != undefined && typeof arguments[p.async] === "function";
                        if (async) {
                            var tempFun = arguments[p.async];
                            arguments[p.async] = function () {
                                var r = tempFun.apply(this, arguments);// won't work if callback function rely on scope
                                p.action();
                                return r;
                            }
                        }
                        var result = p.original.apply(this, arguments);
                        !async && p.action();
                        return result;
                    }
                });
            }
            return this;
        },
        unbindListener: function (scope/*object*/, fn/*string*/) {
            var _t = this;
            $.each(_t.listeners, function (i, p) {
                if (scope[fn] === p.scope[p.method]) {
                    scope[fn] = p.original;
                    _t.listeners.splice(i, 1);
                }
            });
            return this;
        },
        unbindAllListeners: function () {
            $.each(this.listeners, function (i, p) {
                p.scope[p.method] = p.original
            });
            this.listeners = [];
            return this;
        },
        //bind click events on table
        _bindEvent: function () {
            var _t = this;
            if (this.table.id) {
                this.$tNode.unbind().on('click', this.table.type + '[' + this.table.data + "]", function (e) {
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
        refreshTable: function (/*optional*/option, /*optional*/item) {
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
            this.style && this.$node.css($.extend(this.style, {overflow: "auto"}));
            this.renderActionButton();
            this.title && this.$node.find('.table-selector .table-selector-title').text(this.title);
            this.refreshTable();
            this._showOrHide();
        },

        show: function (obj) {
            this._init(obj);
            this._render();
            this.bindListener();
            this._bindEvent();
            return this;
        },

        renderActionButton: function () {
            var _t = this;
            var container = this.$node.find('.table-selector .selector-action-container').empty();
            this.actions.length > 0 ? container.addClass("haschild") : container.removeClass("haschild");
            $.each(this.actions, function (i, p) {
                var actionButton = '<input type="button" value="' + p.name + '"/>';
                $(actionButton).appendTo(container).on('click', function () {
                    p.action.apply(p.scope || _t);
                    //p.action();
                });
            });
        },
        //add button
        addActionButton: function (obj) {
            if (obj != undefined) {
                Object.prototype.toString.call(obj) === '[object Array]' ? this.actions = this.actions.concat(obj) : this.actions.push(obj);
            }
            this.renderActionButton();
            return this;
        },

        pushItem: function (item) {
            var _t = this;
            if (typeof item === 'string') item = [item];
            var itemHtml = '<li><span class="selector-delete">×</span>' + item.join(':') + '</li>';
            $(itemHtml).appendTo(_t.$node.find(' .table-selector .table-selector-item')).children('.selector-delete').on('click', function () {
                var index = $(this).parent().index();
                $(this).parent().remove();
                _t.refreshTable("remove", _t.selectedItems.splice(index, 1)[0]);
                _t._showOrHide();
                //$('.table-selector #selector-action-container').children().slice(i).remove();
            });
            this.selectedItems.push(item);
            this._showOrHide();
            return this;
        },

        removeItem: function (item) {
            var _t = this;
            //var index = _t.index;
            $.each(this.selectedItems, function (i, p) {
                if (_t._isDataEqual(p, item)) {
                    _t.selectedItems.splice(i, 1);
                    _t._showOrHide();
                    _t.$node.find('.table-selector .table-selector-item').children().slice(i, i + 1).remove();
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
            this.unbindAllListeners();
            this.table.id && $('#' + this.table.id).removeClass('selectable').removeClass('selectable-' + this.table.type);
            this.$node.empty();
            this.actions = [];
            this.selectedItems = [];
        }
    };
}(jQuery);