// 时间线管理模块
class TimelineManager {
    constructor() {
        this.timelines = [];
        this.currentTimelineId = null;
        this.zoomLevel = 100;
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
            this.zoomLevel = parseInt(e.target.value);
            $('#zoomValue').text(this.zoomLevel + '%');
            this.updateTimelineScales();
        });
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
                    <div class="timeline-track" id="track-${timeline.id}">
                        <div class="timeline-scale" id="scale-${timeline.id}"></div>
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
        timeline.events.forEach(event => {
            if (event.year >= minYear && event.year <= adjustedMaxYear) {
                const position = ((event.year - minYear) / yearRange) * (scaledWidth - 40) + 20;
                const node = $(`<div class="event-node ${event.severity}" data-event-id="${event.id}"></div>`);
                node.css('left', position + 'px');
                
                // 添加月份指示器（如果有月份信息）
                if (event.month) {
                    const monthIndicator = $(`<div class="month-indicator">${event.month}月</div>`);
                    node.append(monthIndicator);
                }
                
                scaleElement.append(node);
            }
        });

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

        // 如果时间跨度超过25年，显示提示
        if (maxYear - minYear > 24) {
            const warning = $(`
                <div class="time-range-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    时间跨度超过25年，仅显示最近25年的事件
                </div>
            `);
            trackElement.before(warning);
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
