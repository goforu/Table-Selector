/*!
 * Common Selector v1.0.0
 *
 * var selector = new Selector(
 *      id:selectorId, //selector显示位置（必填）
 *      context:context, //selector所在上下文（必填）
 *      index:0, //关键字段所在列，若不设置则返回选中项时返回全部字段
 *      title:title, //selector标题
 *      hidable:true, //是否允许未选中时隐藏，默认为true
 *      actions:{ //添加操作按钮（名称:操作）
 *          actionName1:fun1,
 *          actionName2:fun2,
 *      },
 *      table:{
 *          id:tableId,//操作的表单id
 *          data:"data", //表单提取数据的tr属性名，默认为data。若数据有多个用","隔开
 *          spliter:"," //data的分隔符，默认为","
 *      },
 *      listener:{ //监听某对象方法(同步)。主要用于更新数据时，重新渲染页面（对象方法：方法上下文）
 *          listenFun1:funContext1,
 *          listenFun2:funContext2
 *      }
 * );
 */
+function ($) {
    this.Selector = function (jsn) {
        this.template = '<div class="table-selector"><div id="table-selector-title"></div> <span class="selector-delete-all">×</span><ul id="table-selector-item"></ul> <div id="selector-action-container"></div></div>';
        this.selectedItems = [];
        this.index = jsn.index;
        this.actions = jsn.actions;
        this.table = jsn.table || {};
        this.table.spliter = jsn.table.spliter || ",";
        this.table.data = jsn.table.data || "data";
        this.node = $('#' + jsn.id);
        this.title = jsn.title;
        this.context = jsn.context;
        this.listener = jsn.listener || [];//监听方法触发
        this.hidable = jsn.hidable == undefined ? true : jsn.hidable;//无选中时，是否可以隐藏
        this.prop = jsn.prop;
    };

    Selector.prototype = {
        //初始化
        _init: function (obj) {
            var _t = this;
            this.node = obj || this.node;
            if (!this.node || !this.node[0] instanceof HTMLElement) throw new Error('object is undefined or is not an HTMLElement');
            _t.table.id && $('#' + _t.table.id).addClass('selectable');
            _t.node.html(_t.template);
        },
        //清空数据
        clear: function () {
            this.selectedItems = [];
            this.refreshRows();
            $('.table-selector #table-selector-item').empty();
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
        //猴子补丁，监听操作
        bindListener: function (funObj) {
            var _t = this;
            if(funObj != undefined) {
                Object.prototype.toString.call( funObj ) === '[object Array]'  ? _t.listener.concat(funObj) : _t.listener.push(funObj);
            }
            if (_t.listener.length) {
                $.each(_t.listener, function (i, p) {
                    if (!p.original) {
                        p.original = p.context[p.target];
                    }
                    var async = p.async != undefined && typeof arguments[p.async] === "function";
                    p.context[p.target] = function () {
                        if (async) {
                            var tempFun = arguments[p.async];
                            arguments[p.async] = function () {
                                var r = tempFun.apply(this, arguments);
                                p.listen.apply(p.context, p.param);
                                return r;
                            }
                        }
                        var result = p.original.apply(this, arguments);
                        !async && p.listen.apply(p.context, p.param);
                        return result;
                    }
                });
            }
            return this;
        },
        unbindListener: function (context/*object*/, fn/*string*/) {
            var _t = this;
            $.each(_t.listener, function(i, p) {
                if(context[fn] === p.context[p.target]){
                    context[fn] = p.original;
                    _t.listener.splice(i, 1);
                }
            });
            return this;
        },
        unbindAllListener: function(){
            var _t = this;
            $.each(_t.listener, function(i, p) {
                p.context[p.target] = p.original
            });
            _t.listener = [];
            return this;
        },
        //绑定click事件
        _bindEvent: function () {
            var _t = this;
            $('.table-selector .selector-delete-all').on('click', function () {
                _t.clear();
            });
            if (_t.table.id) {
                $('#' + _t.table.id).unbind().on('click', 'tr[' + _t.table.data + "]", function (e) {
                    if ($(e.target).is('a, input')) return;
                    if ($(this).toggleClass('selected').hasClass('selected')) {
                        _t.pushItem($(this).attr(_t.table.data).split(_t.table.spliter));
                    } else {
                        _t.removeItem($(this).attr(_t.table.data).split(_t.table.spliter));
                    }
                });

            }
        },
        //删除、更新等操作后，重新渲染表格
        refreshRows: function (/*optional*/option, /*optional*/item) {
            var _t = this;
            if (_t.table.id) {
                var list = [].concat(_t.selectedItems);
                $('#' + _t.table.id + ' tr[' + _t.table.data + ']').each(function (i, dom) {
                    switch (option) {
                        case "remove":
                            if (_t._isDataEqual(item, $(dom).attr(_t.table.data).split(_t.table.spliter)) && $(dom).hasClass('selected')) {
                                $(dom).removeClass('selected');
                                return false;
                            }
                            break;
                        default:
                            for (var p in list) {
                                var data = $(dom).attr(_t.table.data).split(_t.table.spliter);
                                if (_t._isDataEqual(list[p], data)) {
                                    $(dom).addClass('selected');
                                    list.splice(p, 1);
                                }
                            }
                            $(dom).hasClass('selected') && $(dom).removeClass('selected');
                    }
                });
            }
            return this;
        },
        //判断数据是否相等
        _isDataEqual: function (data1, data2) {
            for (var i = 0; i < data1.length; ++i) {
                if (data1[i] !== data2[i]) {
                    return false;
                }
            }
            return true;
        },
        //渲染
        _render: function () {
            var _t = this;
            _t.prop && _t.node.css($.extend(_t.prop, {overflow: "auto"}));
            $('.table-selector #selector-action-container').empty();
            _t._renderActionButton();
            _t.title && $('.table-selector #table-selector-title').text(_t.title);
            _t.refreshRows();
            _t._showOrHide();
        },
        //显示控件
        show: function (obj) {
            this._init(obj);
            this._render();
            this.bindListener();
            this._bindEvent();
            return this;
        },
        //
        _renderActionButton: function () {
            var _t = this;
            $('.table-selector #selector-action-container').empty();
            $.each(_t.actions, function (i, p) {
                var actionButton = '<input type="button" value="' + p.name + '"/>';
                $(actionButton).appendTo('.table-selector #selector-action-container').on('click', function () {
                    p.action.apply(p.context || _t.context, p.param);
                    //p.action();
                });
            });
        },
        //添加操作按钮
        addActionButton: function (obj) {
            var _t = this;
            if(obj != undefined) {
                Object.prototype.toString.call( obj ) === '[object Array]'  ? _t.actions.concat(obj) : _t.actions.push(obj);
            }
            _t._renderActionButton();
            return this;
        },
        //添加选中项
        pushItem: function (item) {
            var _t = this;
            if (typeof item === 'string') item = [item];
            var itemHtml = '<li><span class="selector-delete">×</span>' + item.join(':') + '</li>';
            $(itemHtml).appendTo('.table-selector #table-selector-item').children('.selector-delete').on('click', function () {
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
        //删除选中项
        removeItem: function (item) {
            var _t = this;
            //var index = _t.index;
            $.each(this.selectedItems, function (i, p) {
                if (_t._isDataEqual(p, item)) {
                    _t.selectedItems.splice(i, 1);
                    _t._showOrHide();
                    $('.table-selector #table-selector-item').children().slice(i, i + 1).remove();
                    return false;
                }
            });
            return this;
        },
        //获得所有选中项
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
        }
    };
}(jQuery);