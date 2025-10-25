// 时间线管理模块
class TimelineManager {
    constructor() {
        this.timelines = [];
        this.currentTimelineId = null;
        this.zoomLevel = 100;
        this.scrollPosition = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartScroll = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadFromStorage();
    }

    bindEvents() {
        // 时间线头部点击事件
        $(document).on('click', '.timeline-header', (e) => {
            if (!$(e.target).closest('.timeline-actions').length) {
                this.toggleTimeline($(e.currentTarget).closest('.timeline').data('id'));
            }
        });

        // 事件节点点击事件
        $(document).on('click', '.event-node', (e) => {
            this.showEventDetails($(e.currentTarget).data('event-id'));
        });

        // 缩放控制
        $('#zoomLevel').on('input', (e) => {
            const newZoomLevel = parseInt(e.target.value);
            this.smoothZoomTransition(newZoomLevel);
        });

        // 绑定拖拽事件
        this.bindDragEvents();
    }

    // 绑定拖拽事件
    bindDragEvents() {
        // 鼠标按下事件
        $(document).on('mousedown', '.timeline-track', (e) => {
            this.startDragging(e);
        });

        // 鼠标移动事件
        $(document).on('mousemove', (e) => {
            this.handleDragging(e);
        });

        // 鼠标释放事件
        $(document).on('mouseup', (e) => {
            this.stopDragging(e);
        });

        // 触摸事件支持
        $(document).on('touchstart', '.timeline-track', (e) => {
            this.startDragging(e.originalEvent.touches[0]);
        });

        $(document).on('touchmove', (e) => {
            this.handleDragging(e.originalEvent.touches[0]);
        });

        $(document).on('touchend', (e) => {
            this.stopDragging(e);
        });
    }

    // 开始拖拽
    startDragging(e) {
        this.isDragging = true;
        this.dragStartX = e.clientX;
        const track = $(e.target).closest('.timeline-track');
        this.dragStartScroll = track.scrollLeft();
        track.addClass('dragging');
    }

    // 处理拖拽
    handleDragging(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.dragStartX;
        const track = $('.timeline-track.dragging');
        track.scrollLeft(this.dragStartScroll - deltaX);
    }

    // 停止拖拽
    stopDragging(e) {
        this.isDragging = false;
        $('.timeline-track').removeClass('dragging');
    }

    // 平滑缩放过渡
    smoothZoomTransition(newZoomLevel) {
        const oldZoomLevel = this.zoomLevel;
        const zoomChange = newZoomLevel - oldZoomLevel;
        
        // 更新显示
        $('#zoomValue').text(newZoomLevel + '%');
        
        // 保存当前滚动位置（基于百分比）
        const tracks = $('.timeline-track');
        const scrollPositions = [];
        tracks.each((index, track) => {
            const $track = $(track);
            const scrollLeft = $track.scrollLeft();
            const trackWidth = $track[0].scrollWidth;
            const scrollPercentage = trackWidth > 0 ? scrollLeft / trackWidth : 0;
            scrollPositions.push(scrollPercentage);
        });
        
        // 应用新缩放级别
        this.zoomLevel = newZoomLevel;
        
        // 使用动画更新所有时间线
        this.updateTimelineScales();
        
        // 恢复滚动位置（基于百分比）
        setTimeout(() => {
            tracks.each((index, track) => {
                const $track = $(track);
                const trackWidth = $track[0].scrollWidth;
                const newScrollLeft = scrollPositions[index] * trackWidth;
                $track.scrollLeft(newScrollLeft);
            });
        }, 50);
    }

    // 改进的拖拽处理（带惯性效果）
    handleDragging(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.dragStartX;
        const track = $('.timeline-track.dragging');
        
        // 应用惯性效果
        const inertiaFactor = 0.8; // 惯性系数
        const newScrollLeft = this.dragStartScroll - deltaX * inertiaFactor;
        
        track.scrollLeft(newScrollLeft);
    }

    // 计算垂直偏移量，基于日期信息
    calculateVerticalOffset(event) {
        // 使用日期信息生成伪随机偏移量
        let seed = event.year;
        if (event.month) seed = seed * 31 + event.month;
        if (event.day) seed = seed * 31 + event.day;
        
        // 使用简单的哈希函数生成偏移量 (-15px 到 +15px)
        const hash = this.simpleHash(seed);
        const offset = (hash % 30) - 15; // -15px 到 +15px 的范围
        
        return offset;
    }

    // 计算事件位置，基于年份和月份进行精确偏移
    calculateEventPosition(event, minYear, yearRange, scaledWidth) {
        // 基础位置（基于年份）
        const basePosition = ((event.year - minYear) / yearRange) * (scaledWidth - 40) + 20;
        
        // 如果没有月份信息，直接返回基础位置
        if (!event.month) {
            return basePosition;
        }
        
        // 计算月份偏移量（将一年分为12个月份段）
        const monthOffset = (event.month - 1) / 12; // 0-1 的范围，表示在一年中的位置
        
        // 计算一年的宽度（在缩放后的时间线上）
        const yearWidth = (scaledWidth - 40) / yearRange;
        
        // 应用月份偏移
        const monthAdjustedPosition = basePosition + (monthOffset * yearWidth);
        
        return monthAdjustedPosition;
    }

    // 简单的哈希函数
    simpleHash(num) {
        return Math.abs((num * 9301 + 49297) % 233280) / 233280;
    }

    // 添加事件节点拖拽功能
    enableEventDragging(timelineId) {
        const timeline = this.timelines.find(t => t.id === timelineId);
        if (!timeline) return;

        $(`.event-node[data-event-id]`).each((index, element) => {
            const eventId = $(element).data('event-id');
            const event = timeline.events.find(e => e.id === eventId);
            if (!event) return;

            // 添加双击编辑功能
            $(element).on('dblclick', () => {
                app.showEditEventModal(eventId, timelineId);
            });

            // 添加右键菜单
            $(element).on('contextmenu', (e) => {
                e.preventDefault();
                this.showEventContextMenu(e, eventId, timelineId);
            });
        });
    }

    // 显示事件右键菜单
    showEventContextMenu(e, eventId, timelineId) {
        // 移除现有的右键菜单
        $('.event-context-menu').remove();

        const menu = $(`
            <div class="event-context-menu">
                <div class="menu-item" data-action="edit">编辑事件</div>
                <div class="menu-item" data-action="delete">删除事件</div>
                <div class="menu-item" data-action="goto">转到时间轴</div>
            </div>
        `);

        menu.css({
            position: 'fixed',
            left: e.pageX,
            top: e.pageY,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            zIndex: 1000,
            minWidth: '120px'
        });

        $('body').append(menu);

        // 绑定菜单项点击事件
        menu.find('.menu-item').on('click', (e) => {
            const action = $(e.target).data('action');
            this.handleContextMenuAction(action, eventId, timelineId);
            menu.remove();
        });

        // 点击其他地方关闭菜单
        $(document).one('click', () => {
            menu.remove();
        });
    }

    // 处理右键菜单操作
    handleContextMenuAction(action, eventId, timelineId) {
        switch (action) {
            case 'edit':
                app.showEditEventModal(eventId, timelineId);
                break;
            case 'delete':
                if (confirm('确定要删除这个事件吗？')) {
                    this.deleteEvent(timelineId, eventId);
                }
                break;
            case 'goto':
                this.goToTimeline(eventId, timelineId);
                break;
        }
    }

    // 创建新时间线
    createTimeline(name, color = '#3498db', description = '') {
        const timeline = {
            id: this.generateId(),
            name: name,
            color: color,
            description: description,
            events: [],
            expanded: false,
            createdAt: new Date().toISOString()
        };

        this.timelines.push(timeline);
        this.renderTimeline(timeline);
        this.saveToStorage();
        return timeline;
    }

    // 渲染时间线
    renderTimeline(timeline) {
        const timelineHtml = `
            <div class="timeline" data-id="${timeline.id}">
                <div class="timeline-header">
                    <div class="timeline-title">
                        <div class="timeline-color-indicator" style="background-color: ${timeline.color}"></div>
                        ${timeline.name}
                    </div>
                    <div class="timeline-actions">
                        <button class="btn btn-warning btn-sm add-event-btn" data-timeline-id="${timeline.id}">
                            <i class="fas fa-plus"></i> 添加事件
                        </button>
                        <button class="btn btn-danger btn-sm delete-timeline-btn" data-timeline-id="${timeline.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="timeline-content ${timeline.expanded ? 'expanded' : ''}">
                    ${timeline.description ? `<div class="timeline-description">${timeline.description}</div>` : ''}
                    <div class="timeline-track-container">
                        <div class="timeline-track" id="track-${timeline.id}">
                            <div class="timeline-scale" id="scale-${timeline.id}"></div>
                        </div>
                    </div>
                    <div class="events-container" id="events-${timeline.id}"></div>
                </div>
            </div>
        `;

        $('#timelinesContainer').append(timelineHtml);
        this.renderTimelineEvents(timeline);
        this.updateTimelineScale(timeline.id);
        
        // 绑定新创建的时间线的按钮事件
        this.bindTimelineActions(timeline.id);
    }

    // 绑定时间线操作事件
    bindTimelineActions(timelineId) {
        $(`.add-event-btn[data-timeline-id="${timelineId}"]`).on('click', (e) => {
            e.stopPropagation();
            this.currentTimelineId = timelineId;
            $('#addEventModal').show();
        });

        $(`.delete-timeline-btn[data-timeline-id="${timelineId}"]`).on('click', (e) => {
            e.stopPropagation();
            if (confirm('确定要删除这个时间线吗？所有事件也将被删除。')) {
                this.deleteTimeline(timelineId);
            }
        });
    }

    // 绑定编辑事件按钮
    bindEditEventButtons(timelineId) {
        $(`.edit-event-btn[data-timeline-id="${timelineId}"]`).on('click', (e) => {
            e.stopPropagation();
            const eventId = $(e.currentTarget).data('event-id');
            app.showEditEventModal(eventId, timelineId);
        });

        $(`.go-to-timeline-btn[data-timeline-id="${timelineId}"]`).on('click', (e) => {
            e.stopPropagation();
            const eventId = $(e.currentTarget).data('event-id');
            this.goToTimeline(eventId, timelineId);
        });
    }

    // 切换时间线展开状态
    toggleTimeline(timelineId) {
        const timeline = this.timelines.find(t => t.id === timelineId);
        if (timeline) {
            timeline.expanded = !timeline.expanded;
            $(`.timeline[data-id="${timelineId}"] .timeline-content`).toggleClass('expanded');
            this.saveToStorage();
        }
    }

    // 删除时间线
    deleteTimeline(timelineId) {
        this.timelines = this.timelines.filter(t => t.id !== timelineId);
        $(`.timeline[data-id="${timelineId}"]`).remove();
        this.saveToStorage();
    }

    // 添加事件到时间线
    addEvent(timelineId, eventData) {
        const timeline = this.timelines.find(t => t.id === timelineId);
        if (!timeline) return null;

        const event = {
            id: this.generateId(),
            year: parseInt(eventData.year),
            month: eventData.month ? parseInt(eventData.month) : null,
            day: eventData.day ? parseInt(eventData.day) : null,
            title: eventData.title,
            description: eventData.description,
            severity: eventData.severity,
            tags: eventData.tags ? eventData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            createdAt: new Date().toISOString()
        };

        timeline.events.push(event);
        timeline.events.sort((a, b) => this.compareEvents(a, b)); // 按日期排序

        this.renderTimelineEvents(timeline);
        this.updateTimelineScale(timelineId);
        this.saveToStorage();

        return event;
    }

    // 比较两个事件的日期
    compareEvents(a, b) {
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return (a.month || 0) - (b.month || 0);
        return (a.day || 0) - (b.day || 0);
    }

    // 获取事件的完整日期显示（只显示年份后两位）
    getEventDateDisplay(event) {
        const shortYear = event.year % 100; // 只显示年份后两位
        if (event.month && event.day) {
            return `${shortYear}年${event.month}月${event.day}日`;
        } else if (event.month) {
            return `${shortYear}年${event.month}月`;
        } else {
            return `${shortYear}年`;
        }
    }

    // 渲染时间线事件
    renderTimelineEvents(timeline) {
        const container = $(`#events-${timeline.id}`);
        container.empty();

        if (timeline.events.length === 0) {
            container.html(`
                <div class="empty-state">
                    <i class="fas fa-calendar-plus"></i>
                    <p>暂无事件，点击"添加事件"按钮开始记录</p>
                </div>
            `);
            return;
        }

        // 按年份分组显示事件
        const eventsByYear = {};
        timeline.events.forEach(event => {
            if (!eventsByYear[event.year]) {
                eventsByYear[event.year] = [];
            }
            eventsByYear[event.year].push(event);
        });

        Object.keys(eventsByYear).sort((a, b) => a - b).forEach(year => {
            const yearEvents = eventsByYear[year];
            yearEvents.forEach(event => {
                const eventHtml = `
                    <div class="event-details" data-event-id="${event.id}">
                        <div class="event-header">
                            <h4>
                                <span class="event-date">${this.getEventDateDisplay(event)}</span>
                                <span class="event-severity ${event.severity}">
                                    ${this.getSeverityText(event.severity)}
                                </span>
                                ${event.title}
                            </h4>
                            <div class="event-actions">
                                <button class="btn btn-sm btn-outline go-to-timeline-btn" data-event-id="${event.id}" data-timeline-id="${timeline.id}">
                                    <i class="fas fa-crosshairs"></i> 转到时间轴
                                </button>
                                <button class="btn btn-sm btn-outline edit-event-btn" data-event-id="${event.id}" data-timeline-id="${timeline.id}">
                                    <i class="fas fa-edit"></i> 编辑
                                </button>
                            </div>
                        </div>
                        <p>${event.description}</p>
                        ${event.tags.length > 0 ? `
                            <div class="event-tags">
                                ${event.tags.map(tag => `<span class="event-tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
                container.append(eventHtml);
            });
        });

        // 绑定编辑事件按钮
        this.bindEditEventButtons(timeline.id);
        
        // 启用事件节点交互功能
        this.enableEventDragging(timeline.id);
    }

    // 更新时间线刻度
    updateTimelineScale(timelineId) {
        const timeline = this.timelines.find(t => t.id === timelineId);
        if (!timeline || timeline.events.length === 0) return;

        const scaleElement = $(`#scale-${timelineId}`);
        const trackElement = $(`#track-${timelineId}`);
        scaleElement.empty();

        // 计算年份范围（最大25年跨度）
        const years = timeline.events.map(event => event.year);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        
        // 限制时间跨度为25年
        const yearRange = Math.min(maxYear - minYear, 24); // 最大25年跨度
        const adjustedMaxYear = minYear + yearRange;

        // 设置轨道宽度
        const baseWidth = 2000; // 基础宽度
        const scaledWidth = baseWidth * (this.zoomLevel / 100);
        trackElement.css('width', scaledWidth + 'px');

        // 添加事件节点
        const eventPositions = {};
        timeline.events.forEach(event => {
            if (event.year >= minYear && event.year <= adjustedMaxYear) {
                // 计算基于月份的水平偏移
                const position = this.calculateEventPosition(event, minYear, yearRange, scaledWidth);
                const node = $(`<div class="event-node ${event.severity}" data-event-id="${event.id}"></div>`);
                node.css('left', position + 'px');
                
                // 添加日期相关的垂直偏移，避免所有点都在一条直线上
                const verticalOffset = this.calculateVerticalOffset(event);
                node.css('top', `calc(50% + ${verticalOffset}px)`);
                
                // 添加月份指示器（如果有月份信息）
                if (event.month) {
                    const monthIndicator = $(`<div class="month-indicator">${event.month}月</div>`);
                    node.append(monthIndicator);
                }
                
                scaleElement.append(node);
                
                // 记录事件位置用于连接线
                eventPositions[event.id] = position;
            }
        });

        // 为相同标签的相邻事件添加连接线
        this.addConnectionLines(timeline, eventPositions, scaledWidth, scaleElement);

        // 添加刻度标记（每年一个标记，只显示年份后两位）
        for (let year = minYear; year <= adjustedMaxYear; year++) {
            const position = ((year - minYear) / yearRange) * (scaledWidth - 40) + 20;
            const shortYear = year % 100; // 只显示年份后两位
            const mark = $(`
                <div class="scale-mark" style="left: ${position}px">
                    ${shortYear}
                </div>
            `);
            scaleElement.append(mark);
        }

        // 如果时间跨度超过25年，显示提示（只在第一次渲染时显示）
        if (maxYear - minYear > 24 && !timeline.hasShownWarning) {
            const warning = $(`
                <div class="time-range-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    时间跨度超过25年，仅显示最近25年的事件
                </div>
            `);
            trackElement.parent().before(warning);
            timeline.hasShownWarning = true;
        }
    }

    // 更新所有时间线刻度
    updateTimelineScales() {
        this.timelines.forEach(timeline => {
            this.updateTimelineScale(timeline.id);
        });
    }

    // 显示事件详情
    showEventDetails(eventId) {
        // 查找事件
        let targetEvent = null;
        let targetTimeline = null;

        for (const timeline of this.timelines) {
            const event = timeline.events.find(e => e.id === eventId);
            if (event) {
                targetEvent = event;
                targetTimeline = timeline;
                break;
            }
        }

        if (!targetEvent) return;

        // 展开对应的时间线
        if (!targetTimeline.expanded) {
            this.toggleTimeline(targetTimeline.id);
        }

        // 滚动到事件位置
        const eventElement = $(`.event-details[data-event-id="${eventId}"]`);
        if (eventElement.length) {
            $('html, body').animate({
                scrollTop: eventElement.offset().top - 100
            }, 500);

            // 高亮显示
            eventElement.css('background', '#f8f9fa');
            setTimeout(() => {
                eventElement.css('background', '');
            }, 2000);
        }

        // 在时间轴上显示十字动画标注
        this.showCrossAnimation(eventId, targetTimeline.id);
    }

    // 显示十字动画标注
    showCrossAnimation(eventId, timelineId) {
        // 移除现有的十字动画
        $('.cross-animation').remove();

        const eventNode = $(`.event-node[data-event-id="${eventId}"]`);
        if (!eventNode.length) return;

        const timelineTrack = $(`#track-${timelineId}`);
        const nodePosition = eventNode.position();
        const nodeWidth = eventNode.outerWidth();
        const nodeHeight = eventNode.outerHeight();

        // 创建十字动画元素
        const crossAnimation = $(`
            <div class="cross-animation">
                <div class="cross-line horizontal"></div>
                <div class="cross-line vertical"></div>
            </div>
        `);

        timelineTrack.append(crossAnimation);

        // 设置十字位置
        const crossSize = 40;
        crossAnimation.css({
            position: 'absolute',
            left: nodePosition.left + nodeWidth / 2 - crossSize / 2,
            top: nodePosition.top + nodeHeight / 2 - crossSize / 2,
            width: crossSize,
            height: crossSize,
            pointerEvents: 'none',
            zIndex: 100
        });

        // 3秒后自动移除十字动画
        setTimeout(() => {
            crossAnimation.remove();
        }, 3000);
    }

    // 为相同标签的相邻事件添加连接线
    addConnectionLines(timeline, eventPositions, scaledWidth, scaleElement) {
        // 移除现有的连接线
        $('.connection-line').remove();

        // 按标签分组事件
        const eventsByTag = {};
        timeline.events.forEach(event => {
            event.tags.forEach(tag => {
                if (!eventsByTag[tag]) {
                    eventsByTag[tag] = [];
                }
                eventsByTag[tag].push(event);
            });
        });

        // 为每个标签的事件添加连接线
        Object.keys(eventsByTag).forEach(tag => {
            const events = eventsByTag[tag];
            if (events.length < 2) return;

            // 按时间排序
            events.sort((a, b) => this.compareEvents(a, b));

            // 为相邻事件添加连接线
            for (let i = 0; i < events.length - 1; i++) {
                const currentEvent = events[i];
                const nextEvent = events[i + 1];
                
                const currentPos = eventPositions[currentEvent.id];
                const nextPos = eventPositions[nextEvent.id];
                
                if (currentPos && nextPos) {
                    // 计算连接线位置和长度
                    const startX = currentPos;
                    const endX = nextPos;
                    const lineWidth = endX - startX;
                    
                    // 根据事件的重要程度确定连接线颜色
                    const severity = this.getHigherSeverity(currentEvent.severity, nextEvent.severity);
                    const lineColor = this.getSeverityColor(severity);
                    
                    // 创建连接线
                    const connectionLine = $(`
                        <div class="connection-line ${severity}" data-tag="${tag}"></div>
                    `);
                    
                    connectionLine.css({
                        position: 'absolute',
                        left: startX + 'px',
                        top: '50%',
                        width: lineWidth + 'px',
                        height: '2px',
                        background: lineColor,
                        transform: 'translateY(-50%)',
                        zIndex: 5,
                        opacity: 0.7
                    });
                    
                    scaleElement.append(connectionLine);
                }
            }
        });
    }

    // 获取两个事件中较高的严重程度
    getHigherSeverity(severity1, severity2) {
        const severityLevels = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4
        };
        
        const level1 = severityLevels[severity1] || 1;
        const level2 = severityLevels[severity2] || 1;
        
        return level1 >= level2 ? severity1 : severity2;
    }

    // 获取严重程度对应的颜色
    getSeverityColor(severity) {
        const colors = {
            'low': '#27ae60',
            'medium': '#f39c12',
            'high': '#e74c3c',
            'critical': '#8e44ad'
        };
        return colors[severity] || '#3498db';
    }

    // 转到时间轴并显示十字动画
    goToTimeline(eventId, timelineId) {
        const timeline = this.timelines.find(t => t.id === timelineId);
        if (!timeline) return;

        // 展开时间线
        if (!timeline.expanded) {
            this.toggleTimeline(timelineId);
        }

        // 滚动到时间线位置
        const timelineElement = $(`.timeline[data-id="${timelineId}"]`);
        if (timelineElement.length) {
            $('html, body').animate({
                scrollTop: timelineElement.offset().top - 50
            }, 500);
        }

        // 显示十字动画
        setTimeout(() => {
            this.showCrossAnimation(eventId, timelineId);
        }, 600);
    }

    // 获取事件程度文本
    getSeverityText(severity) {
        const severityMap = {
            'low': '低',
            'medium': '中',
            'high': '高',
            'critical': '关键'
        };
        return severityMap[severity] || '中';
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 保存到本地存储
    saveToStorage() {
        localStorage.setItem('rustwarfare_timelines', JSON.stringify(this.timelines));
    }

    // 从本地存储加载
    loadFromStorage() {
        const stored = localStorage.getItem('rustwarfare_timelines');
        if (stored) {
            try {
                this.timelines = JSON.parse(stored);
                this.renderAllTimelines();
            } catch (e) {
                console.error('加载时间线数据失败:', e);
                this.timelines = [];
            }
        }
    }

    // 渲染所有时间线
    renderAllTimelines() {
        $('#timelinesContainer').empty();
        this.timelines.forEach(timeline => {
            this.renderTimeline(timeline);
        });
    }

    // 导出数据
    exportData() {
        return JSON.stringify(this.timelines, null, 2);
    }

    // 更新事件
    updateEvent(timelineId, eventId, eventData) {
        const timeline = this.timelines.find(t => t.id === timelineId);
        if (!timeline) return false;

        const eventIndex = timeline.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return false;

        // 更新事件数据
        timeline.events[eventIndex] = {
            ...timeline.events[eventIndex],
            year: parseInt(eventData.year),
            month: eventData.month ? parseInt(eventData.month) : null,
            day: eventData.day ? parseInt(eventData.day) : null,
            title: eventData.title,
            description: eventData.description,
            severity: eventData.severity,
            tags: eventData.tags ? eventData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            updatedAt: new Date().toISOString()
        };

        // 重新排序
        timeline.events.sort((a, b) => this.compareEvents(a, b));

        this.renderTimelineEvents(timeline);
        this.updateTimelineScale(timelineId);
        this.saveToStorage();

        return true;
    }

    // 删除事件
    deleteEvent(timelineId, eventId) {
        const timeline = this.timelines.find(t => t.id === timelineId);
        if (!timeline) return false;

        const eventIndex = timeline.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return false;

        timeline.events.splice(eventIndex, 1);

        this.renderTimelineEvents(timeline);
        this.updateTimelineScale(timelineId);
        this.saveToStorage();

        return true;
    }

    // 导入数据
    importData(data) {
        try {
            const imported = JSON.parse(data);
            if (Array.isArray(imported)) {
                this.timelines = imported;
                this.renderAllTimelines();
                this.saveToStorage();
                return true;
            }
        } catch (e) {
            console.error('导入数据失败:', e);
        }
        return false;
    }
}

// 创建全局实例
window.timelineManager = new TimelineManager();
