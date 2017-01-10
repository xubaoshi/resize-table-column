(function () {
    var ResizeColumns = function (settings) {
        var options = {
            target: '',
            store: window.localStorage,
            colMinWidth: 35,
            noResizeClass: '.js-no-resize',
            resizeClass: 'g-clip'
        }
        $.extend(options, settings);

        if (options.target == '') {
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
        destroy: function () {
            this.$handleContainer.remove();
            this.$table, removeData('resizeColumns');
            this.$table.css({ 'width': 'auto' });
            this.$table.find('tr th').filter('.g-clip').css({ 'width': '', 'min-width': '' });
            return $(window).off('.rc');

        },
        createHandles: function () {
            var _this = this;
            _this.$table.before((_this.$handleContainer = $('<div class="rc-handle-container"></div>')));
            this.$table.find('tr th').filter('.g-clip').each(function (i, el) {
                var $handle = $('<div class="rc-handle"></div>');
                $handle.data('th', $(el));
                return $handle.appendTo(_this.$handleContainer);
            })
            _this.$table.width(10 + 'px');
            return _this.$handleContainer.on('mousedown', '.rc-handle', _this.mousedown);
        },
        mousedown: function (e) {
            e.preventDefault();
            var _this = this;
            var $table = _this.$table;
            var tableWidth = $table.width() - 1; // table宽度获取的时候减去1px宽度，否则拖动时会抖动
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
                $(document).off('mousedown.rc');
                return _this.saveColumnWidths();
            })

        },
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
        saveColumnWidths: function () {

        },
        restoreColumnWidths: function () {

        },
        bind: function (fn, me) {
            return function () {
                return fn.apply(me, arguments);
            }
        }

    })
})();