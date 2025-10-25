// 数据管理模块 - 处理TXT文件导入导出
class DataManager {
    constructor() {
        this.fileInput = null;
        this.init();
    }

    init() {
        this.createFileInput();
        this.bindEvents();
    }

    createFileInput() {
        // 创建隐藏的文件输入元素
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.txt';
        this.fileInput.style.display = 'none';
        document.body.appendChild(this.fileInput);
    }

    bindEvents() {
        // 保存数据按钮
        $('#saveDataBtn').on('click', () => {
            this.exportToTxt();
        });

        // 加载数据按钮
        $('#loadDataBtn').on('click', () => {
            this.fileInput.click();
        });

        // 文件选择事件
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
    }

    // 导出数据到TXT文件
    exportToTxt() {
        const data = timelineManager.exportData();
        const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `rustwarfare_timelines_${this.getFormattedDate()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('数据已成功导出！', 'success');
    }

    // 处理文件选择
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                if (this.importFromTxt(content)) {
                    this.showNotification('数据导入成功！', 'success');
                } else {
                    this.showNotification('数据格式错误，导入失败！', 'error');
                }
            } catch (error) {
                console.error('文件读取错误:', error);
                this.showNotification('文件读取失败！', 'error');
            }
        };
        reader.readAsText(file);
        
        // 重置文件输入
        event.target.value = '';
    }

    // 从TXT文件导入数据
    importFromTxt(content) {
        return timelineManager.importData(content);
    }

    // 获取格式化日期
    getFormattedDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}${month}${day}_${hours}${minutes}`;
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 移除现有的通知
        $('.notification').remove();

        const notification = $(`
            <div class="notification notification-${type}">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                ${message}
            </div>
        `);

        $('body').append(notification);

        // 显示动画
        notification.css({
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            background: this.getNotificationColor(type),
            color: 'white',
            borderRadius: '5px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10000,
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '600'
        });

        // 动画显示
        setTimeout(() => {
            notification.css('transform', 'translateX(0)');
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            notification.css('transform', 'translateX(100%)');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // 获取通知图标
    getNotificationIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'info': 'fa-info-circle',
            'warning': 'fa-exclamation-triangle'
        };
        return icons[type] || 'fa-info-circle';
    }

    // 获取通知颜色
    getNotificationColor(type) {
        const colors = {
            'success': '#27ae60',
            'error': '#e74c3c',
            'info': '#3498db',
            'warning': '#f39c12'
        };
        return colors[type] || '#3498db';
    }

    // 生成示例数据
    generateSampleData() {
        const sampleTimelines = [
            {
                id: 'sample1',
                name: '世界大战时间线',
                color: '#e74c3c',
                description: '记录两次世界大战及相关冲突的时间线',
                events: [
                    {
                        id: 'event1',
                        year: 1914,
                        title: '第一次世界大战爆发',
                        description: '奥匈帝国向塞尔维亚宣战，第一次世界大战开始',
                        severity: 'critical',
                        tags: ['战争', '欧洲', '全球冲突'],
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'event2',
                        year: 1918,
                        title: '第一次世界大战结束',
                        description: '德国签署停战协定，第一次世界大战正式结束',
                        severity: 'high',
                        tags: ['战争结束', '和平条约'],
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'event3',
                        year: 1939,
                        title: '第二次世界大战爆发',
                        description: '德国入侵波兰，第二次世界大战开始',
                        severity: 'critical',
                        tags: ['战争', '全球冲突', '纳粹德国'],
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'event4',
                        year: 1945,
                        title: '第二次世界大战结束',
                        description: '日本投降，第二次世界大战正式结束',
                        severity: 'high',
                        tags: ['战争结束', '和平', '联合国成立'],
                        createdAt: new Date().toISOString()
                    }
                ],
                expanded: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'sample2',
                name: '科技发展时间线',
                color: '#3498db',
                description: '记录重要科技突破和发展的时间线',
                events: [
                    {
                        id: 'event5',
                        year: 1947,
                        title: '晶体管发明',
                        description: '贝尔实验室发明晶体管，开启电子时代',
                        severity: 'high',
                        tags: ['电子', '发明', '贝尔实验室'],
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'event6',
                        year: 1969,
                        title: '互联网诞生',
                        description: 'ARPANET建立，互联网的前身',
                        severity: 'critical',
                        tags: ['互联网', '网络', '通信'],
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'event7',
                        year: 2007,
                        title: 'iPhone发布',
                        description: '苹果发布第一代iPhone，开启智能手机时代',
                        severity: 'high',
                        tags: ['智能手机', '苹果', '移动计算'],
                        createdAt: new Date().toISOString()
                    }
                ],
                expanded: false,
                createdAt: new Date().toISOString()
            }
        ];

        timelineManager.timelines = sampleTimelines;
        timelineManager.renderAllTimelines();
        timelineManager.saveToStorage();
        this.showNotification('示例数据已加载！', 'info');
    }

    // 清空所有数据
    clearAllData() {
        if (confirm('确定要清空所有数据吗？此操作不可撤销！')) {
            timelineManager.timelines = [];
            timelineManager.renderAllTimelines();
            timelineManager.saveToStorage();
            this.showNotification('所有数据已清空！', 'info');
        }
    }

    // 导出为CSV格式
    exportToCSV() {
        let csvContent = '时间线名称,年份,事件标题,事件程度,标签,描述\\n';
        
        timelineManager.timelines.forEach(timeline => {
            timeline.events.forEach(event => {
                const row = [
                    `"${timeline.name}"`,
                    event.year,
                    `"${event.title}"`,
                    `"${timelineManager.getSeverityText(event.severity)}"`,
                    `"${event.tags.join(';')}"`,
                    `"${event.description.replace(/"/g, '""')}"`
                ].join(',');
                csvContent += row + '\\n';
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `rustwarfare_timelines_${this.getFormattedDate()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('CSV数据已成功导出！', 'success');
    }
}

// 创建全局实例
window.dataManager = new DataManager();
