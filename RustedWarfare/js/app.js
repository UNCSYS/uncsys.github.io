// 主应用程序 - 整合所有功能
class RustWarfareApp {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkEmptyState();
        this.addDemoControls();
    }

    bindEvents() {
        // 添加时间线按钮
        $('#addTimelineBtn').on('click', () => {
            this.showAddTimelineModal();
        });

        // 模态框关闭按钮
        $('.close').on('click', () => {
            this.hideAllModals();
        });

        // 点击模态框外部关闭
        $(window).on('click', (e) => {
            if ($(e.target).hasClass('modal')) {
                this.hideAllModals();
            }
        });

        // 时间线表单提交
        $('#timelineForm').on('submit', (e) => {
            e.preventDefault();
            this.handleTimelineFormSubmit();
        });

        // 事件表单提交
        $('#eventForm').on('submit', (e) => {
            e.preventDefault();
            this.handleEventFormSubmit();
        });

        // 年份输入变化时更新月份和日期选项
        $('#eventYear').on('change', () => {
            this.updateMonthDayOptions();
        });

        // 月份选择变化时更新日期选项
        $('#eventMonth').on('change', () => {
            const year = parseInt($('#eventYear').val());
            const month = parseInt($('#eventMonth').val());
            if (year && month) {
                this.updateDayOptions(year, month);
            }
        });

        // 编辑事件表单提交
        $('#editEventForm').on('submit', (e) => {
            e.preventDefault();
            this.handleEditEventFormSubmit();
        });

        // 删除事件按钮
        $('#deleteEventBtn').on('click', () => {
            this.handleDeleteEvent();
        });

        // 编辑事件年份变化时更新月份和日期选项
        $('#editEventYear').on('change', () => {
            this.updateEditMonthDayOptions();
        });

        // 编辑事件月份选择变化时更新日期选项
        $('#editEventMonth').on('change', () => {
            const year = parseInt($('#editEventYear').val());
            const month = parseInt($('#editEventMonth').val());
            if (year && month) {
                this.updateEditDayOptions(year, month);
            }
        });

        // 键盘快捷键
        $(document).on('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    // 显示添加时间线模态框
    showAddTimelineModal() {
        $('#timelineForm')[0].reset();
        $('#timelineColor').val('#3498db');
        $('#addTimelineModal').show();
        $('#timelineName').focus();
    }

    // 显示添加事件模态框
    showAddEventModal(timelineId) {
        $('#eventForm')[0].reset();
        $('#eventSeverity').val('medium');
        this.updateMonthDayOptions();
        $('#addEventModal').show();
        $('#eventYear').focus();
    }

    // 更新月份和日期选项
    updateMonthDayOptions() {
        const year = parseInt($('#eventYear').val());
        if (!year || year < 0 || year > 2100) {
            $('#eventMonth').val('');
            $('#eventDay').val('');
            return;
        }

        // 更新月份选项
        const monthSelect = $('#eventMonth');
        if (monthSelect.length === 0) return;
        
        // 更新日期选项
        const daySelect = $('#eventDay');
        if (daySelect.length === 0) return;
        
        // 根据选择的月份更新日期选项
        const selectedMonth = parseInt(monthSelect.val());
        if (selectedMonth) {
            this.updateDayOptions(year, selectedMonth);
        }
    }

    // 更新日期选项
    updateDayOptions(year, month) {
        const daySelect = $('#eventDay');
        const currentDay = parseInt(daySelect.val());
        daySelect.empty();
        daySelect.append('<option value="">选择日期</option>');
        
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            daySelect.append(`<option value="${day}">${day}日</option>`);
        }
        
        if (currentDay && currentDay <= daysInMonth) {
            daySelect.val(currentDay);
        }
    }

    // 更新编辑事件月份和日期选项
    updateEditMonthDayOptions() {
        const year = parseInt($('#editEventYear').val());
        if (!year || year < 0 || year > 2100) {
            $('#editEventMonth').val('');
            $('#editEventDay').val('');
            return;
        }

        // 根据选择的月份更新日期选项
        const selectedMonth = parseInt($('#editEventMonth').val());
        if (selectedMonth) {
            this.updateEditDayOptions(year, selectedMonth);
        }
    }

    // 更新编辑事件日期选项
    updateEditDayOptions(year, month) {
        const daySelect = $('#editEventDay');
        const currentDay = parseInt(daySelect.val());
        daySelect.empty();
        daySelect.append('<option value="">选择日期</option>');
        
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            daySelect.append(`<option value="${day}">${day}日</option>`);
        }
        
        if (currentDay && currentDay <= daysInMonth) {
            daySelect.val(currentDay);
        }
    }

    // 显示编辑事件模态框
    showEditEventModal(eventId, timelineId) {
        const timeline = timelineManager.timelines.find(t => t.id === timelineId);
        if (!timeline) return;

        const event = timeline.events.find(e => e.id === eventId);
        if (!event) return;

        // 填充表单数据
        $('#editEventId').val(event.id);
        $('#editTimelineId').val(timelineId);
        $('#editEventYear').val(event.year);
        $('#editEventMonth').val(event.month || '');
        $('#editEventTitle').val(event.title);
        $('#editEventDescription').val(event.description);
        $('#editEventSeverity').val(event.severity);
        $('#editEventTags').val(event.tags.join(', '));

        // 更新日期选项
        if (event.month) {
            this.updateEditDayOptions(event.year, event.month);
            $('#editEventDay').val(event.day || '');
        } else {
            $('#editEventDay').val('');
        }

        $('#editEventModal').show();
        $('#editEventTitle').focus();
    }

    // 处理编辑事件表单提交
    handleEditEventFormSubmit() {
        const eventId = $('#editEventId').val();
        const timelineId = $('#editTimelineId').val();
        const year = parseInt($('#editEventYear').val());
        const month = $('#editEventMonth').val() ? parseInt($('#editEventMonth').val()) : null;
        const day = $('#editEventDay').val() ? parseInt($('#editEventDay').val()) : null;
        const title = $('#editEventTitle').val().trim();
        const description = $('#editEventDescription').val().trim();
        const severity = $('#editEventSeverity').val();
        const tags = $('#editEventTags').val().trim();

        if (!year) {
            this.showFormError('editEventYear', '请输入年份');
            return;
        }

        if (year < 0 || year > 2100) {
            this.showFormError('editEventYear', '请输入合理的年份 (0-2100)');
            return;
        }

        if (month && (month < 1 || month > 12)) {
            this.showFormError('editEventMonth', '请输入有效的月份 (1-12)');
            return;
        }

        if (day && month) {
            const daysInMonth = new Date(year, month, 0).getDate();
            if (day < 1 || day > daysInMonth) {
                this.showFormError('editEventDay', `请输入有效的日期 (1-${daysInMonth})`);
                return;
            }
        }

        if (!title) {
            this.showFormError('editEventTitle', '请输入事件标题');
            return;
        }

        const eventData = {
            year: year,
            month: month,
            day: day,
            title: title,
            description: description,
            severity: severity,
            tags: tags
        };

        const success = timelineManager.updateEvent(timelineId, eventId, eventData);
        
        if (success) {
            this.hideAllModals();
            dataManager.showNotification(`事件 "${title}" 修改成功！`, 'success');
        } else {
            dataManager.showNotification('修改事件失败！', 'error');
        }
    }

    // 处理删除事件
    handleDeleteEvent() {
        const eventId = $('#editEventId').val();
        const timelineId = $('#editTimelineId').val();
        const eventTitle = $('#editEventTitle').val().trim();

        if (confirm(`确定要删除事件 "${eventTitle}" 吗？此操作不可撤销。`)) {
            const success = timelineManager.deleteEvent(timelineId, eventId);
            
            if (success) {
                this.hideAllModals();
                dataManager.showNotification(`事件 "${eventTitle}" 已删除！`, 'success');
            } else {
                dataManager.showNotification('删除事件失败！', 'error');
            }
        }
    }

    // 隐藏所有模态框
    hideAllModals() {
        $('.modal').hide();
    }

    // 处理时间线表单提交
    handleTimelineFormSubmit() {
        const name = $('#timelineName').val().trim();
        const color = $('#timelineColor').val();
        const description = $('#timelineDescription').val().trim();

        if (!name) {
            this.showFormError('timelineName', '请输入时间线名称');
            return;
        }

        timelineManager.createTimeline(name, color, description);
        this.hideAllModals();
        this.checkEmptyState();
        
        dataManager.showNotification(`时间线 "${name}" 创建成功！`, 'success');
    }

    // 处理事件表单提交
    handleEventFormSubmit() {
        const year = parseInt($('#eventYear').val());
        const month = $('#eventMonth').val() ? parseInt($('#eventMonth').val()) : null;
        const day = $('#eventDay').val() ? parseInt($('#eventDay').val()) : null;
        const title = $('#eventTitle').val().trim();
        const description = $('#eventDescription').val().trim();
        const severity = $('#eventSeverity').val();
        const tags = $('#eventTags').val().trim();

        if (!year) {
            this.showFormError('eventYear', '请输入年份');
            return;
        }

        if (year < 0 || year > 2100) {
            this.showFormError('eventYear', '请输入合理的年份 (0-2100)');
            return;
        }

        if (month && (month < 1 || month > 12)) {
            this.showFormError('eventMonth', '请输入有效的月份 (1-12)');
            return;
        }

        if (day && month) {
            const daysInMonth = new Date(year, month, 0).getDate();
            if (day < 1 || day > daysInMonth) {
                this.showFormError('eventDay', `请输入有效的日期 (1-${daysInMonth})`);
                return;
            }
        }

        if (!title) {
            this.showFormError('eventTitle', '请输入事件标题');
            return;
        }

        const eventData = {
            year: year,
            month: month,
            day: day,
            title: title,
            description: description,
            severity: severity,
            tags: tags
        };

        const event = timelineManager.addEvent(timelineManager.currentTimelineId, eventData);
        
        if (event) {
            this.hideAllModals();
            dataManager.showNotification(`事件 "${title}" 添加成功！`, 'success');
        } else {
            dataManager.showNotification('添加事件失败！', 'error');
        }
    }

    // 显示表单错误
    showFormError(fieldId, message) {
        const field = $(`#${fieldId}`);
        field.addClass('error');
        
        // 移除现有的错误消息
        field.next('.error-message').remove();
        
        // 添加错误消息
        field.after(`<div class="error-message" style="color: #e74c3c; font-size: 12px; margin-top: 5px;">${message}</div>`);
        
        // 移除错误状态
        setTimeout(() => {
            field.removeClass('error');
            field.next('.error-message').remove();
        }, 3000);
    }

    // 处理键盘快捷键
    handleKeyboardShortcuts(e) {
        // Ctrl+N: 新建时间线
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            this.showAddTimelineModal();
        }
        
        // Ctrl+S: 保存数据
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            dataManager.exportToTxt();
        }
        
        // Ctrl+O: 加载数据
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            $('#loadDataBtn').click();
        }
        
        // Escape: 关闭模态框
        if (e.key === 'Escape') {
            this.hideAllModals();
        }
    }

    // 检查空状态
    checkEmptyState() {
        if (timelineManager.timelines.length === 0) {
            this.showEmptyState();
        } else {
            this.hideEmptyState();
        }
    }

    // 显示空状态
    showEmptyState() {
        if ($('#emptyState').length === 0) {
            const emptyStateHtml = `
                <div id="emptyState" class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>还没有时间线</h3>
                    <p>点击"添加时间线"按钮开始创建您的第一个时间线</p>
                    <div style="margin-top: 20px;">
                        <button id="loadSampleData" class="btn btn-info">
                            <i class="fas fa-download"></i> 加载示例数据
                        </button>
                    </div>
                </div>
            `;
            $('#timelinesContainer').html(emptyStateHtml);
            
            // 绑定示例数据按钮
            $('#loadSampleData').on('click', () => {
                dataManager.generateSampleData();
                this.checkEmptyState();
            });
        }
    }

    // 隐藏空状态
    hideEmptyState() {
        $('#emptyState').remove();
    }

    // 添加演示控制按钮
    addDemoControls() {
        // 在控制面板添加演示按钮
        if ($('#demoControls').length === 0) {
            const demoControlsHtml = `
                <div id="demoControls" class="demo-controls" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                    <button id="loadSampleBtn" class="btn btn-outline">
                        <i class="fas fa-magic"></i> 加载示例
                    </button>
                    <button id="clearAllBtn" class="btn btn-outline">
                        <i class="fas fa-trash"></i> 清空数据
                    </button>
                    <button id="exportCSVBtn" class="btn btn-outline">
                        <i class="fas fa-file-csv"></i> 导出CSV
                    </button>
                </div>
            `;
            $('.controls').append(demoControlsHtml);

            // 绑定演示按钮事件
            $('#loadSampleBtn').on('click', () => {
                dataManager.generateSampleData();
                this.checkEmptyState();
            });

            $('#clearAllBtn').on('click', () => {
                dataManager.clearAllData();
                this.checkEmptyState();
            });

            $('#exportCSVBtn').on('click', () => {
                dataManager.exportToCSV();
            });
        }
    }

    // 搜索功能
    searchEvents(keyword) {
        const results = [];
        
        timelineManager.timelines.forEach(timeline => {
            timeline.events.forEach(event => {
                if (event.title.toLowerCase().includes(keyword.toLowerCase()) ||
                    event.description.toLowerCase().includes(keyword.toLowerCase()) ||
                    event.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))) {
                    results.push({
                        timeline: timeline,
                        event: event
                    });
                }
            });
        });

        return results;
    }

    // 显示搜索结果
    showSearchResults(results) {
        // 实现搜索结果显示逻辑
        console.log('搜索结果:', results);
        // 这里可以添加搜索结果的显示界面
    }

    // 统计信息
    getStatistics() {
        const totalTimelines = timelineManager.timelines.length;
        const totalEvents = timelineManager.timelines.reduce((sum, timeline) => sum + timeline.events.length, 0);
        
        const severityCount = {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
        };

        timelineManager.timelines.forEach(timeline => {
            timeline.events.forEach(event => {
                severityCount[event.severity]++;
            });
        });

        return {
            totalTimelines,
            totalEvents,
            severityCount
        };
    }

    // 显示统计信息
    showStatistics() {
        const stats = this.getStatistics();
        const message = `
            统计信息:
            - 时间线数量: ${stats.totalTimelines}
            - 事件总数: ${stats.totalEvents}
            - 事件程度分布:
              • 低: ${stats.severityCount.low}
              • 中: ${stats.severityCount.medium}
              • 高: ${stats.severityCount.high}
              • 关键: ${stats.severityCount.critical}
        `;
        
        alert(message);
    }
}

// 添加额外的CSS样式
$(document).ready(() => {
    // 添加错误状态样式
    const errorStyles = `
        <style>
            .error {
                border-color: #e74c3c !important;
                box-shadow: 0 0 5px rgba(231, 76, 60, 0.3) !important;
            }
            .btn-outline {
                background: transparent;
                border: 2px solid #3498db;
                color: #3498db;
            }
            .btn-outline:hover {
                background: #3498db;
                color: white;
            }
            .demo-controls {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
        </style>
    `;
    $('head').append(errorStyles);

    // 初始化应用
    window.app = new RustWarfareApp();

    // 显示欢迎信息
    setTimeout(() => {
        if (timelineManager.timelines.length === 0) {
            dataManager.showNotification('欢迎使用 Rusted Warfare 时间线系统！', 'info');
        }
    }, 1000);
});

// 添加全局帮助函数
window.RustedWarfare = {
    // 获取应用实例
    getApp: () => window.app,
    
    // 获取时间线管理器
    getTimelineManager: () => window.timelineManager,
    
    // 获取数据管理器
    getDataManager: () => window.dataManager,
    
    // 快速创建时间线
    quickCreateTimeline: (name, color = '#3498db') => {
        return timelineManager.createTimeline(name, color);
    },
    
    // 快速添加事件
    quickAddEvent: (timelineId, year, title, severity = 'medium') => {
        return timelineManager.addEvent(timelineId, {
            year: year,
            title: title,
            description: '',
            severity: severity,
            tags: []
        });
    }
};
