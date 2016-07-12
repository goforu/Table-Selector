/*!
 * Table Selector v0.0.1
 *
 * var options = {
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
 *          data:"data", //attribute set on tr or td
 *          splitter:"," //split multiple data
 *      },
 *      listener:{ //trigger when a certain function called
 *          scope:obj,//
 *          method:fn, //listened function
 *          action: function(){},//call after listened function called
 *          async:index// position of the argument in an async function
 *      }
 * }
 *
 * https://github.com/goforu/Table-Selector
 *
 * by Goforu
 */
+function ($) {

    $.fn.Selector = function (options) {
        var settings = {};
        var defaults = {
            selectedItems: [],
            actions: [],
            table: {
                data: "data",
                type: "row"
            },
            listeners: [],
            hidable: true
        };

        var _this = this;

        $.extend(true, settings, defaults, options);
        function Instance() {
            this._template = '<div class="table-selector"><div class="table-selector-title"></div><ul class="table-selector-item"></ul> <div class="selector-action-container"></div></div>';
            this.selectedItems = [];
            this.$tNode = $(_this);
            this.$node = $('#' + settings.id);
            this.type = settings.table.type == "cell" ? "td" : "tr";
        }

        Instance.prototype = {
            _init: function () {
                if (!this.$node || !this.$node[0] instanceof HTMLElement) throw new Error('object is undefined or is not an HTMLElement');
                this.$tNode.addClass('selectable').addClass('selectable-' + this.type);
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
                if (!settings.hidable) return false;
                if (this.selectedItems.length > 0) {
                    this.$node.show()
                } else {
                    this.$node.hide();
                }
            },
            //monkey patch
            bindListener: function (funObj) {
                if (funObj != undefined) {
                    Object.prototype.toString.call(funObj) === '[object Array]' ? settings.listeners.concat(funObj) : settings.listeners.push(funObj);
                }
                if (settings.listeners.length) {
                    $.each(settings.listeners, function (i, p) {
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
                $.each(settings.listeners, function (i, p) {
                    if (scope[fn] === p.scope[p.method]) {
                        scope[fn] = p.original;
                        settings.listeners.splice(i, 1);
                    }
                });
                return this;
            },
            unbindAllListeners: function () {
                $.each(settings.listeners, function (i, p) {
                    p.scope[p.method] = p.original
                });
                settings.listeners = [];
                return this;
            },
            //bind click events on table
            _bindEvent: function () {
                var _t = this;
                this.$tNode.unbind().on('click', this.type + '[' + settings.table.data + "]", function (e) {
                    if ($(e.target).is('a, input')) return;
                    if ($(this).toggleClass('selected').hasClass('selected')) {
                        _t.pushItem($(this).attr(settings.table.data).split(settings.table.splitter));
                    } else {
                        _t.removeItem($(this).attr(settings.table.data).split(settings.table.splitter));
                    }
                });

            },
            //refresh after data changes
            refreshTable: function (/*optional*/option, /*optional*/item) {
                var _t = this;
                var list = [].concat(this.selectedItems);
                this.$tNode.find(this.type + '[' + settings.table.data + ']').each(function (i, dom) {
                    switch (option) {
                        case "remove":
                            if (_t._isDataEqual(item, $(dom).attr(settings.table.data).split(settings.table.splitter)) && $(dom).hasClass('selected')) {
                                $(dom).removeClass('selected');
                                return false;
                            }
                            break;
                        default:
                            $(dom).hasClass('selected') && $(dom).removeClass('selected');
                            for (var p in list) {
                                var data = $(dom).attr(settings.table.data).split(settings.table.splitter);
                                if (_t._isDataEqual(list[p], data)) {
                                    $(dom).addClass('selected');
                                    list.splice(p, 1);
                                }
                            }
                    }
                });
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
                settings.style && this.$node.css($.extend(settings.style, {overflow: "auto"}));
                this.renderActionButton();
                settings.title && this.$node.find('.table-selector .table-selector-title').text(settings.title);
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
                settings.actions.length > 0 ? container.addClass("haschild") : container.removeClass("haschild");
                $.each(settings.actions, function (i, p) {
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
                    Object.prototype.toString.call(obj) === '[object Array]' ? settings.actions = settings.actions.concat(obj) : settings.actions.push(obj);
                }
                this.renderActionButton();
                return this;
            },

            pushItem: function (item) {
                var _t = this;
                if (typeof item === 'string') item = [item];
                var itemHtml = '<li><span class="selector-delete">×</span>' + item.join(':') + '</li>';
                $(itemHtml).appendTo(this.$node.find(' .table-selector .table-selector-item')).children('.selector-delete').on('click', function () {
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
                if (settings.index != undefined) {
                    var rst = [];
                    $.each(this.selectedItems, function (i, p) {
                        if (p.length < settings.index + 1) throw new Error('index out of bounds!');
                        rst.push(p[settings.index]);
                    });
                    return rst;
                }
                return this.selectedItems;
            },
            destroy: function () {
                this.unbindAllListeners();
                this.$node.removeClass('selectable').removeClass('selectable-' + this.type);
                this.$node.empty();
                settings = [];
            }
        };

        return new Instance();
    };
}(jQuery);