(function () {
    var ResizeColumns = function (settings) {
        this.options = {
            target: '',
            colMinWidth: 35,
            noResizeClass: 'js-no-resize',
            resizeClass: 'g-clip',
            columnName: 'resize-column-name'
        }
        $.extend(this.options, settings);

        if (this.options.target == '') {
            console.error('please set resize tables!')
            return;
        } else {
            var $table = $(this.options.target);
            $table.data('resizeColumns', this.init($table));
        }
    };

    $.extend(ResizeColumns.prototype, {
        init: function ($table) {
            var _this = this;
            var $ths = $table.find('th:not(.' + _this.options.noResizeClass + '):visible');
            var $tbodyTrs = $table.find('tbody').find('tr');
            if ($tbodyTrs.length > 0 && $ths.length > 0) {
                $ths.splice(0, 1);
                $ths.addClass(_this.options.resizeClass);
                $tbodyTrs.each(function () {
                    var $tds = $(this).find('td:not(.' + _this.options.noResizeClass + '):visible');
                    $tds.splice(0, 1);
                    $tds.addClass(_this.options.resizeClass);
                })
            }

            _this.$table = $table;
            _this.tableId = this.$table.data('resize-columns-id');
            _this.mousedown = this.bind(this.mousedown, this);
            _this.createHandles();
            _this.restoreColumnWidths();
            _this.syncHandleWidths();
            $(window).on('resize.rc', (function () {
                return _this.syncHandleWidths();
            }))
            return _this;
        },
        /**
         * 销毁拖拽区域
         */
        destroy: function () {
            this.$handleContainer.remove();
            this.$table.removeData('resizeColumns');
            this.$table.css({ 'width': 'auto' });
            this.$table.find('tr th').filter('.' + this.options.resizeClass).css({ 'width': '', 'min-width': '' });
            return $(window).off('.rc');

        },
        /**
         * 创建拖拽区域
         */
        createHandles: function () {
            var _this = this;
            _this.$table.before((_this.$handleContainer = $('<div class="rc-handle-container"></div>')));
            this.$table.find('tr th').filter('.' + this.options.resizeClass).each(function (i, el) {
                var $handle = $('<div class="rc-handle"></div>');
                $handle.data('th', $(el));
                return $handle.appendTo(_this.$handleContainer);
            })
            _this.$table.width(10 + 'px');
            return _this.$handleContainer.on('mousedown', '.rc-handle', _this.mousedown);
        },
        /**
         * 鼠标点击事件
         */
        mousedown: function (e) {
            e.preventDefault();
            var _this = this;
            var $table = _this.$table;
            var tableWidth = $table.width() - 1;  // table宽度获取的时候减去1px宽度，否则拖动时会抖动
            var $currentGrip = $(e.currentTarget);
            var $leftColumn = $currentGrip.data('th');
            var leftColumnStartWidth = $leftColumn.width();
            _this.startPostion = e.pageX;
            $(document).on('mousemove.rc', function (e) {
                var difference = e.pageX - _this.startPostion;
                var newLeftColumnWidth = leftColumnStartWidth + difference;
                if ((parseInt($leftColumn.css('width')) < $leftColumn.width()) && (newLeftColumnWidth < $leftColumn.width())) {
                    return;
                }
                // 如果超过最小拖动距离
                if (newLeftColumnWidth >= _this.options.colMinWidth) {
                    $leftColumn.width(newLeftColumnWidth);
                    _this.$table.width(tableWidth + difference);
                    return _this.syncHandleWidths();
                }
            });

            return $(document).one('mouseup', function () {
                $(document).off('mousemove.rc');
                return _this.saveColumnWidths();
            })

        },
        /**
         * 同步拖拽区域
         */
        syncHandleWidths: function () {
            var _this = this;
            _this.$handleContainer.width(_this.$table.width());
            return _this.$handleContainer.find('.rc-handle').each(function (_, el) {
                return $(el).css({
                    left: $(el).data('th').outerWidth() + ($(el).data('th').offset().left - _this.$handleContainer.offset().left - _this.$handleContainer.offset().left),
                    height: _this.$table.height()
                })
            })
        },
        /**
         * 暂存拖拽信息
         */
        saveColumnWidths: function () {
            var _this = this;
            var storage = window.localStorage;
            var key = '', value = {}, valueJSON = '';
            var path = location.pathname;
            if (_this.isLocalStorage()) {
                key = path + '-' + _this.$table.attr('id');
                _this.$table.find('tr th').filter('.' + _this.options.resizeClass).each(function (_, el) {
                    var columnName = $(el).attr(_this.options.columnName);
                    if (columnName != '') {
                        value[columnName] = $(el).width();
                    } else {
                        console.log('表格th属性' + _this.options.columnName + '为空！')
                        return true;
                    }
                })
                if (value) {
                    valueJSON = JSON.stringify(value);
                    storage.setItem(key, valueJSON);
                }
            }
        },
        /**
         * 根据暂存数据同步拖拽位置
         */
        restoreColumnWidths: function () {
            var _this = this;
            var storage = window.localStorage;
            var key = '', value = {}, valueJSON = '';
            var path = location.pathname;
            if (_this.isLocalStorage()) {
                key = path + '-' + _this.$table.attr('id');
                valueJSON = storage.getItem(key);
                value = JSON.parse(valueJSON);
                _this.$table.find('tr th').filter('.' + _this.options.resizeClass).each(function (_, el) {
                    var columnName = $(el).attr(_this.options.columnName);
                    if (value && columnName != '' && columnName != undefined && value[columnName]) {
                        $(el).css({ 'width': value[columnName] + 'px' });
                    } else {
                        var iMinWidth = parseInt($(el).css('min-width'));
                        iMinWidth = iMinWidth == 0 ? _this.options.colMinWidth : iMinWidth;
                        $(el).css({ 'width': iMinWidth + 'px' });
                    }
                    // 移除min-width IE下拖拽不能小于min-width
                    $(el).css({ 'min-width': 'auto' });
                })
            }
        },
        isLocalStorage: function () {
            var testKey = 'test', testValue = 'testValue';
            var storage = window.localStorage;
            try {
                storage.setItem(testKey, testValue);
                storage.removeItem(testKey);
                return true;
            } catch (error) {
                console.log('当前浏览器不支持localStorage');
                return false;
            }
        },
        bind: function (fn, me) {
            return function () {
                return fn.apply(me, arguments);
            }
        }
    })

    window.ResizeColumns = ResizeColumns;
})();