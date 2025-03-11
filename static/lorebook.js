// lorebook.js - Novel.ai风格的世界观管理系统

class Lorebook {
    constructor() {
        this.entries = [];
        this.categories = ['世界观', '角色', '地点', '事件', '物品', '概念', '其他'];
        this.activeEntry = null;
        this.searchTerm = '';
        this.filterCategory = '全部';
        this.panel = null;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.createUI();
        this.bindEvents();
    }

    // 从localStorage加载数据
    loadFromStorage() {
        try {
            const data = localStorage.getItem('lorebook_data');
            if (data) {
                this.entries = JSON.parse(data);
            } else {
                // 初始化示例条目
                this.entries = [
                    {
                        id: this.generateId(),
                        name: '示例世界观条目',
                        category: '世界观',
                        content: '这是一个示例世界观条目，描述了故事发生的背景和规则。',
                        keywords: ['世界', '背景', '规则'],
                        enabled: true,
                        priority: 100,
                        contextWindow: 1000,
                        created: new Date().toISOString()
                    }
                ];
                this.saveToStorage();
            }
        } catch (error) {
            console.error('加载Lorebook数据失败:', error);
            this.entries = [];
        }
    }

    // 保存到localStorage
    saveToStorage() {
        try {
            localStorage.setItem('lorebook_data', JSON.stringify(this.entries));
        } catch (error) {
            console.error('保存Lorebook数据失败:', error);
            alert('保存Lorebook数据失败，可能是由于存储空间不足');
        }
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 创建用户界面
    createUI() {
        // 创建主面板
        const panel = document.createElement('div');
        panel.className = 'lorebook-panel';
        panel.innerHTML = `
            <div class="lorebook-header">
                <h2>Lorebook世界观管理</h2>
                <div class="lorebook-controls">
                    <input type="text" class="lorebook-search" placeholder="搜索条目...">
                    <select class="lorebook-category-filter">
                        <option value="全部">全部分类</option>
                        ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                    <button class="lorebook-add-btn">添加条目</button>
                    <button class="lorebook-close-btn">关闭</button>
                </div>
            </div>
            <div class="lorebook-content">
                <div class="lorebook-sidebar">
                    <div class="lorebook-entries"></div>
                </div>
                <div class="lorebook-editor">
                    <div class="lorebook-no-selection">
                        <p>请选择或创建一个条目</p>
                    </div>
                    <div class="lorebook-edit-form" style="display:none;">
                        <div class="form-group">
                            <label>名称</label>
                            <input type="text" class="lorebook-entry-name">
                        </div>
                        <div class="form-group">
                            <label>分类</label>
                            <select class="lorebook-entry-category">
                                ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>内容</label>
                            <textarea class="lorebook-entry-content" rows="10"></textarea>
                        </div>
                        <div class="form-group">
                            <label>关键词（用逗号分隔）</label>
                            <input type="text" class="lorebook-entry-keywords">
                        </div>
                        <div class="form-group">
                            <label>优先级 (0-100)</label>
                            <input type="number" class="lorebook-entry-priority" min="0" max="100" value="50">
                        </div>
                        <div class="form-group">
                            <label>上下文窗口大小</label>
                            <input type="number" class="lorebook-entry-context" min="100" max="5000" value="1000">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" class="lorebook-entry-enabled" checked>
                                启用此条目
                            </label>
                        </div>
                        <div class="lorebook-buttons">
                            <button class="lorebook-save-btn">保存</button>
                            <button class="lorebook-delete-btn">删除</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .lorebook-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 1200px;
                height: 80vh;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                display: flex;
                flex-direction: column;
                z-index: 1000;
                overflow: hidden;
            }
            
            .lorebook-header {
                padding: 16px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .lorebook-header h2 {
                margin: 0;
                color: #333;
            }
            
            .lorebook-controls {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .lorebook-content {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            
            .lorebook-sidebar {
                width: 300px;
                border-right: 1px solid #eee;
                overflow-y: auto;
                padding: 10px;
            }
            
            .lorebook-entries {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .lorebook-entry {
                padding: 10px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .lorebook-entry:hover {
                background: #f5f5f5;
            }
            
            .lorebook-entry.active {
                background: #e6f7ff;
                border-left: 3px solid #1890ff;
            }
            
            .lorebook-entry-disabled {
                opacity: 0.5;
            }
            
            .lorebook-editor {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            }
            
            .lorebook-no-selection {
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #999;
            }
            
            .form-group {
                margin-bottom: 16px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
            }
            
            .form-group input[type="text"],
            .form-group input[type="number"],
            .form-group select,
            .form-group textarea {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-family: inherit;
            }
            
            .form-group textarea {
                resize: vertical;
            }
            
            .lorebook-buttons {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            
            .lorebook-buttons button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .lorebook-save-btn {
                background: #1890ff;
                color: white;
            }
            
            .lorebook-delete-btn {
                background: #ff4d4f;
                color: white;
            }
            
            .lorebook-add-btn {
                background: #52c41a;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .lorebook-close-btn {
                background: #f5f5f5;
                border: 1px solid #d9d9d9;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .lorebook-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 999;
            }
        `;
        document.head.appendChild(style);
        
        // 添加到DOM
        const overlay = document.createElement('div');
        overlay.className = 'lorebook-overlay';
        document.body.appendChild(overlay);
        document.body.appendChild(panel);
        
        this.panel = panel;
        this.overlay = overlay;
        
        // 默认隐藏
        this.hide();
    }

    // 绑定事件
    bindEvents() {
        // 关闭按钮
        this.panel.querySelector('.lorebook-close-btn').addEventListener('click', () => {
            this.hide();
        });
        
        // 添加条目按钮
        this.panel.querySelector('.lorebook-add-btn').addEventListener('click', () => {
            this.createNewEntry();
        });
        
        // 搜索框
        this.panel.querySelector('.lorebook-search').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.renderEntries();
        });
        
        // 分类过滤器
        this.panel.querySelector('.lorebook-category-filter').addEventListener('change', (e) => {
            this.filterCategory = e.target.value;
            this.renderEntries();
        });
        
        // 保存按钮
        this.panel.querySelector('.lorebook-save-btn').addEventListener('click', () => {
            this.saveCurrentEntry();
        });
        
        // 删除按钮
        this.panel.querySelector('.lorebook-delete-btn').addEventListener('click', () => {
            this.deleteCurrentEntry();
        });
        
        // 点击背景关闭
        this.overlay.addEventListener('click', () => {
            this.hide();
        });
    }

    // 显示Lorebook面板
    show() {
        this.panel.style.display = 'flex';
        this.overlay.style.display = 'block';
        this.renderEntries();
    }

    // 隐藏Lorebook面板
    hide() {
        this.panel.style.display = 'none';
        this.overlay.style.display = 'none';
    }

    // 渲染条目列表
    renderEntries() {
        const entriesContainer = this.panel.querySelector('.lorebook-entries');
        entriesContainer.innerHTML = '';
        
        // 过滤条目
        const filteredEntries = this.entries.filter(entry => {
            const matchesSearch = this.searchTerm === '' || 
                entry.name.toLowerCase().includes(this.searchTerm) || 
                entry.content.toLowerCase().includes(this.searchTerm);
                
            const matchesCategory = this.filterCategory === '全部' || 
                entry.category === this.filterCategory;
                
            return matchesSearch && matchesCategory;
        });
        
        // 按优先级排序
        filteredEntries.sort((a, b) => b.priority - a.priority);
        
        // 创建条目元素
        filteredEntries.forEach(entry => {
            const entryElement = document.createElement('div');
            entryElement.className = `lorebook-entry ${!entry.enabled ? 'lorebook-entry-disabled' : ''} ${this.activeEntry && this.activeEntry.id === entry.id ? 'active' : ''}`;
            entryElement.innerHTML = `
                <div class="entry-name">${entry.name}</div>
                <div class="entry-category">${entry.category}</div>
            `;
            
            entryElement.addEventListener('click', () => {
                this.selectEntry(entry);
            });
            
            entriesContainer.appendChild(entryElement);
        });
        
        // 如果没有条目
        if (filteredEntries.length === 0) {
            entriesContainer.innerHTML = '<div class="no-entries">没有找到匹配的条目</div>';
        }
    }

    // 选择条目
    selectEntry(entry) {
        this.activeEntry = entry;
        this.renderEntries();
        this.showEntryForm();
    }

    // 显示条目编辑表单
    showEntryForm() {
        const form = this.panel.querySelector('.lorebook-edit-form');
        const noSelection = this.panel.querySelector('.lorebook-no-selection');
        
        if (this.activeEntry) {
            // 填充表单
            form.querySelector('.lorebook-entry-name').value = this.activeEntry.name;
            form.querySelector('.lorebook-entry-category').value = this.activeEntry.category;
            form.querySelector('.lorebook-entry-content').value = this.activeEntry.content;
            form.querySelector('.lorebook-entry-keywords').value = this.activeEntry.keywords.join(', ');
            form.querySelector('.lorebook-entry-priority').value = this.activeEntry.priority;
            form.querySelector('.lorebook-entry-context').value = this.activeEntry.contextWindow;
            form.querySelector('.lorebook-entry-enabled').checked = this.activeEntry.enabled;
            
            // 显示表单
            form.style.display = 'block';
            noSelection.style.display = 'none';
        } else {
            // 隐藏表单
            form.style.display = 'none';
            noSelection.style.display = 'flex';
        }
    }

    // 创建新条目
    createNewEntry() {
        const newEntry = {
            id: this.generateId(),
            name: '新条目',
            category: '世界观',
            content: '',
            keywords: [],
            enabled: true,
            priority: 50,
            contextWindow: 1000,
            created: new Date().toISOString()
        };
        
        this.entries.push(newEntry);
        this.activeEntry = newEntry;
        this.renderEntries();
        this.showEntryForm();
    }

    // 保存当前条目
    saveCurrentEntry() {
        if (!this.activeEntry) return;
        
        const form = this.panel.querySelector('.lorebook-edit-form');
        
        this.activeEntry.name = form.querySelector('.lorebook-entry-name').value;
        this.activeEntry.category = form.querySelector('.lorebook-entry-category').value;
        this.activeEntry.content = form.querySelector('.lorebook-entry-content').value;
        this.activeEntry.keywords = form.querySelector('.lorebook-entry-keywords').value
            .split(',')
            .map(k => k.trim())
            .filter(k => k);
        this.activeEntry.priority = parseInt(form.querySelector('.lorebook-entry-priority').value);
        this.activeEntry.contextWindow = parseInt(form.querySelector('.lorebook-entry-context').value);
        this.activeEntry.enabled = form.querySelector('.lorebook-entry-enabled').checked;
        
        this.saveToStorage();
        this.renderEntries();
        
        // 显示保存成功提示
        this.showNotification('条目已保存');
    }

    // 删除当前条目
    deleteCurrentEntry() {
        if (!this.activeEntry) return;
        
        if (confirm(`确定要删除条目 "${this.activeEntry.name}" 吗？`)) {
            this.entries = this.entries.filter(entry => entry.id !== this.activeEntry.id);
            this.saveToStorage();
            this.activeEntry = null;
            this.renderEntries();
            this.showEntryForm();
            
            // 显示删除成功提示
            this.showNotification('条目已删除');
        }
    }

    // 显示通知
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `lorebook-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // 自动消失
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 处理提示词，注入Lorebook内容
    processPrompt(prompt) {
        if (!prompt || this.entries.length === 0) return prompt;
        
        // 获取启用的条目
        const enabledEntries = this.entries.filter(entry => entry.enabled);
        if (enabledEntries.length === 0) return prompt;
        
        // 按优先级排序
        enabledEntries.sort((a, b) => b.priority - a.priority);
        
        // 检查关键词匹配
        const matchedEntries = enabledEntries.filter(entry => {
            return entry.keywords.some(keyword => 
                prompt.toLowerCase().includes(keyword.toLowerCase())
            );
        });
        
        if (matchedEntries.length === 0) return prompt;
        
        // 构建Lorebook部分
        let lorebookSection = "--- Lorebook 世界观信息 ---\n";
        
        matchedEntries.forEach(entry => {
            lorebookSection += `[${entry.name} - ${entry.category}]\n${entry.content}\n\n`;
        });
        
        lorebookSection += "-------------------------\n\n";
        
        // 将Lorebook信息添加到提示词开头
        return lorebookSection + prompt;
    }

    // 导出数据
    exportData() {
        const dataStr = JSON.stringify(this.entries, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `lorebook-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 导入数据
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (Array.isArray(data)) {
                // 验证数据结构
                const isValid = data.every(entry => 
                    entry.id && 
                    entry.name && 
                    entry.category && 
                    Array.isArray(entry.keywords)
                );
                
                if (isValid) {
                    this.entries = data;
                    this.saveToStorage();
                    this.renderEntries();
                    this.showNotification('导入成功');
                    return true;
                }
            }
            
            throw new Error('数据格式无效');
        } catch (error) {
            console.error('导入数据失败:', error);
            this.showNotification('导入失败: ' + error.message, 'error');
            return false;
        }
    }

    // 从生成的内容中提取并创建Lorebook条目
    extractFromContent(content, chapterTitle = '', presetCategory = null) {
        // 创建一个提取面板
        const extractPanel = document.createElement('div');
        extractPanel.className = 'lorebook-extract-panel';
        extractPanel.innerHTML = `
            <div class="lorebook-extract-header">
                <h2>提取Lorebook条目</h2>
                <button class="lorebook-extract-close">关闭</button>
            </div>
            <div class="lorebook-extract-content">
                <div class="lorebook-form-group">
                    <label>选择类型</label>
                    <select id="extract-category">
                        ${this.categories.map(cat => `<option value="${cat}" ${presetCategory === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                    </select>
                </div>
                <div class="lorebook-form-group">
                    <label>条目名称</label>
                    <input type="text" id="extract-name" placeholder="输入条目名称">
                </div>
                <div class="lorebook-form-group">
                    <label>关键词（用逗号分隔）</label>
                    <input type="text" id="extract-keywords" placeholder="输入关键词，用逗号分隔">
                </div>
                <div class="lorebook-form-group">
                    <label>内容</label>
                    <textarea id="extract-content" rows="8" placeholder="输入条目内容"></textarea>
                </div>
                <div class="lorebook-form-group">
                    <label>优先级 (1-100)</label>
                    <input type="number" id="extract-priority" min="1" max="100" value="50">
                </div>
                <div class="lorebook-buttons">
                    <button id="extract-save" class="lorebook-save">保存到Lorebook</button>
                    <button id="extract-ai" class="lorebook-save">AI提取关键信息</button>
                    <button class="lorebook-cancel">取消</button>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .lorebook-extract-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 600px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 1001;
                overflow: hidden;
            }
            
            .lorebook-extract-header {
                padding: 16px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .lorebook-extract-header h2 {
                margin: 0;
                color: #333;
            }
            
            .lorebook-extract-content {
                padding: 20px;
            }
            
            .lorebook-extract-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
            }
        `;
        document.head.appendChild(style);

        // 添加到DOM
        const overlay = document.createElement('div');
        overlay.className = 'lorebook-extract-overlay';
        document.body.appendChild(overlay);
        document.body.appendChild(extractPanel);

        // 预填充内容
        if (content) {
            // 尝试提取名称（使用章节标题或第一行）
            let name = chapterTitle || '';
            if (!name && content.trim()) {
                const firstLine = content.split('\n')[0];
                name = firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
            }
            document.getElementById('extract-name').value = name;
            
            // 预填充内容
            document.getElementById('extract-content').value = content;
            
            // 根据不同类型生成不同的关键词
            if (presetCategory === '世界观') {
                // 为世界观提取关键词
                const worldKeywords = [];
                
                // 提取可能的世界名称
                const worldNameMatch = content.match(/[《【「][^》】」]{2,10}[》】」]世界|[^，。；！？\s]{2,6}世界/);
                if (worldNameMatch) {
                    worldKeywords.push(worldNameMatch[0].replace(/[《【「」】》]/g, ''));
                }
                
                // 提取时代背景
                const timeMatch = content.match(/[古今现未来]代|[东西南北]方|[春夏秋冬]季|[前中后]期|[上中下]古/g);
                if (timeMatch && timeMatch.length > 0) {
                    worldKeywords.push(...timeMatch.slice(0, 3));
                }
                
                // 提取特殊元素
                const specialElements = ['魔法', '科技', '仙术', '武道', '灵气', '妖魔', '神明', '帝国', '王国', '联邦', '修真', '异能'];
                specialElements.forEach(element => {
                    if (content.includes(element)) {
                        worldKeywords.push(element);
                    }
                });
                
                // 如果关键词太少，添加一些通用关键词
                if (worldKeywords.length < 3) {
                    worldKeywords.push('世界观', '背景', '设定');
                }
                
                document.getElementById('extract-keywords').value = [...new Set(worldKeywords)].join('，');
                
            } else if (presetCategory === '事件') {
                // 为事件提取关键词
                const eventKeywords = [];
                
                // 提取章节标题中的关键词
                if (chapterTitle && chapterTitle.includes('章')) {
                    const titleWords = chapterTitle.replace(/第.+章[：:]?/, '').match(/[^，。；！？\s]{2,6}/g);
                    if (titleWords && titleWords.length > 0) {
                        eventKeywords.push(...titleWords.slice(0, 3));
                    }
                }
                
                // 提取动作词
                const actionMatch = content.match(/[^，。；！？\s]{1,2}[了过起]/g);
                if (actionMatch && actionMatch.length > 0) {
                    eventKeywords.push(...actionMatch.slice(0, 3));
                }
                
                // 提取人名
                const nameMatch = content.match(/[赵钱孙李周吴郑王][^，。；！？\s]{1,2}/g);
                if (nameMatch && nameMatch.length > 0) {
                    eventKeywords.push(...nameMatch.slice(0, 2));
                }
                
                // 如果关键词太少，添加一些通用关键词
                if (eventKeywords.length < 3) {
                    eventKeywords.push('事件', '情节', '剧情');
                }
                
                document.getElementById('extract-keywords').value = [...new Set(eventKeywords)].join('，');
                
            } else {
                // 通用关键词提取（原有逻辑）
                const text = content.substring(0, 1000); // 只分析前1000个字符
                const words = text.match(/[\u4e00-\u9fa5]{2,4}/g) || []; // 提取2-4个汉字的词
                const wordCount = {};
                words.forEach(word => {
                    if (!wordCount[word]) wordCount[word] = 0;
                    wordCount[word]++;
                });
                
                // 取出现频率最高的5个词作为关键词
                const keywords = Object.entries(wordCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(entry => entry[0]);
                    
                document.getElementById('extract-keywords').value = keywords.join('，');
            }
        }

        // 绑定事件
        extractPanel.querySelector('.lorebook-extract-close').addEventListener('click', () => {
            document.body.removeChild(extractPanel);
            document.body.removeChild(overlay);
        });

        overlay.addEventListener('click', () => {
            document.body.removeChild(extractPanel);
            document.body.removeChild(overlay);
        });

        // 保存按钮
        document.getElementById('extract-save').addEventListener('click', () => {
            const name = document.getElementById('extract-name').value;
            const category = document.getElementById('extract-category').value;
            const keywords = document.getElementById('extract-keywords').value.split(/[,，、]/);
            const content = document.getElementById('extract-content').value;
            const priority = parseInt(document.getElementById('extract-priority').value);

            if (!name || !content) {
                alert('名称和内容不能为空');
                return;
            }

            // 创建新条目
            const entry = {
                id: this.generateId(),
                name,
                category,
                content,
                keywords: keywords.map(k => k.trim()).filter(k => k),
                enabled: true,
                priority,
                contextWindow: 1000,
                created: new Date().toISOString()
            };

            // 添加到条目列表
            this.entries.push(entry);
            this.saveToStorage();

            // 显示通知
            this.showNotification(`已将"${name}"添加到Lorebook`);

            // 关闭面板
            document.body.removeChild(extractPanel);
            document.body.removeChild(overlay);
        });

        // AI提取按钮
        document.getElementById('extract-ai').addEventListener('click', async () => {
            const content = document.getElementById('extract-content').value;
            if (!content) {
                alert('内容不能为空');
                return;
            }

            // 显示加载状态
            const aiButton = document.getElementById('extract-ai');
            const originalText = aiButton.textContent;
            aiButton.textContent = '正在分析...';
            aiButton.disabled = true;

            try {
                // 获取当前选择的类别
                const currentCategory = document.getElementById('extract-category').value;
                
                // 根据不同类型构建不同的提示词
                let promptTemplate = '';
                
                if (currentCategory === '世界观') {
                    promptTemplate = `请分析以下小说大纲，提取关键的世界观设定信息，并按以下格式输出：
1. 条目类型：世界观
2. 条目名称：[提取的核心世界观名称]
3. 关键词：[5-10个关键词，用逗号分隔]
4. 内容摘要：[200-300字的世界观设定摘要，包括背景、规则、特殊元素等]

文本内容：
${content.substring(0, 2000)}`;
                } else if (currentCategory === '事件') {
                    promptTemplate = `请分析以下章节细纲，提取关键的事件信息，并按以下格式输出：
1. 条目类型：事件
2. 条目名称：[提取的核心事件名称]
3. 关键词：[5-10个关键词，用逗号分隔]
4. 内容摘要：[200-300字的事件摘要，包括起因、经过、结果等]

文本内容：
${content.substring(0, 2000)}`;
                } else if (currentCategory === '角色') {
                    promptTemplate = `请分析以下文本，提取关键的角色信息，并按以下格式输出：
1. 条目类型：角色
2. 条目名称：[角色名称]
3. 关键词：[角色的称呼、别名等，用逗号分隔]
4. 内容摘要：[200-300字的角色描述，包括外貌、性格、背景、能力等]

文本内容：
${content.substring(0, 2000)}`;
                } else if (currentCategory === '地点') {
                    promptTemplate = `请分析以下文本，提取关键的地点信息，并按以下格式输出：
1. 条目类型：地点
2. 条目名称：[地点名称]
3. 关键词：[地点的别称、标志性特征等，用逗号分隔]
4. 内容摘要：[200-300字的地点描述，包括位置、环境、历史、特点等]

文本内容：
${content.substring(0, 2000)}`;
                } else {
                    // 默认提示词
                    promptTemplate = `请分析以下文本，提取关键信息，并按以下格式输出：
1. 条目类型：[世界观/角色/地点/事件/物品/概念]
2. 条目名称：[提取的核心名称]
3. 关键词：[5-10个关键词，用逗号分隔]
4. 内容摘要：[200-300字的摘要，保留关键信息]

文本内容：
${content.substring(0, 2000)}`;
                }

                // 调用API
                const response = await fetch('/gen2', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({prompt: promptTemplate})
                });

                // 处理响应
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let result = '';

                while (true) {
                    const {value, done} = await reader.read();
                    if (done) break;
                    result += decoder.decode(value, {stream: true});
                }

                // 解析结果
                const categoryMatch = result.match(/条目类型：\s*([^\n]+)/);
                const nameMatch = result.match(/条目名称：\s*([^\n]+)/) || result.match(/名称：\s*([^\n]+)/);
                const keywordsMatch = result.match(/关键词：\s*([^\n]+)/);
                const contentMatch = result.match(/内容摘要：\s*([\s\S]+)/) || result.match(/摘要：\s*([\s\S]+)/);

                // 填充表单
                if (categoryMatch && categoryMatch[1] && !currentCategory) {
                    const extractedCategory = categoryMatch[1].trim();
                    const select = document.getElementById('extract-category');
                    for (let i = 0; i < select.options.length; i++) {
                        if (select.options[i].text.includes(extractedCategory)) {
                            select.selectedIndex = i;
                            break;
                        }
                    }
                }

                if (nameMatch && nameMatch[1]) {
                    document.getElementById('extract-name').value = nameMatch[1].trim();
                }

                if (keywordsMatch && keywordsMatch[1]) {
                    document.getElementById('extract-keywords').value = keywordsMatch[1].trim();
                }

                if (contentMatch && contentMatch[1]) {
                    document.getElementById('extract-content').value = contentMatch[1].trim();
                }

            } catch (error) {
                console.error('AI分析失败:', error);
                alert('AI分析失败: ' + error.message);
            } finally {
                // 恢复按钮状态
                aiButton.textContent = originalText;
                aiButton.disabled = false;
            }
        });
    }
}

// 创建全局实例
const lorebook = new Lorebook();

// 添加到窗口对象，以便其他脚本访问
window.lorebook = lorebook;

// 添加顶部菜单按钮和悬浮按钮
document.addEventListener('DOMContentLoaded', () => {
    // 创建顶部菜单按钮
    const button = document.createElement('button');
    button.textContent = 'Lorebook';
    button.style.marginLeft = '10px';
    
    // 添加到顶部栏
    const topBar = document.querySelector('.top-bar');
    if (topBar) {
        topBar.appendChild(button);
        
        // 点击事件
        button.addEventListener('click', () => {
            lorebook.show();
        });
    }
    
    // 重写原始的提示词处理函数
    const originalBuildPrompt = window.buildPrompt;
    if (typeof originalBuildPrompt === 'function') {
        window.buildPrompt = function(...args) {
            let prompt = originalBuildPrompt.apply(this, args);
            return lorebook.processPrompt(prompt);
        };
    }
});

/* 新增辅助函数：立即为指定章节容器添加'保存到Lorebook'按钮 */
function addLorebookButtonToChapter(container) {
    const contentButtons = container.querySelector('.chapter-content .chapter-buttons');
    if (contentButtons) {
        const existingSaveButton = Array.from(contentButtons.querySelectorAll('button')).find(
            btn => btn.textContent === '保存到Lorebook'
        );
        if (!existingSaveButton) {
            const resetButton = Array.from(contentButtons.querySelectorAll('button')).find(
                btn => btn.textContent.includes('重置正文')
            );
            const saveButton = document.createElement('button');
            saveButton.textContent = '保存到Lorebook';
            saveButton.className = 'save-to-lorebook';
            saveButton.onclick = function(e) {
                e.preventDefault();
                const content = container.querySelector('.chapter-content-text').value;
                const title = container.querySelector('.chapter-header span:first-child').textContent;
                lorebook.extractFromContent(content, title);
            };
            if (resetButton) {
                resetButton.insertAdjacentElement('afterend', saveButton);
            } else {
                contentButtons.appendChild(saveButton);
            }
        }
    }
}

/* 修改已有章节按钮立即添加，移除延迟 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('立即为所有章节添加Lorebook按钮');
        const chapterContainers = document.querySelectorAll('.chapter-container');
        chapterContainers.forEach(container => {
            addLorebookButtonToChapter(container);
        });
    } catch (error) {
        console.error('立即添加Lorebook按钮时出错:', error);
    }
});

/* 新增MutationObserver，监听新增章节，并立即添加按钮 */
document.addEventListener('DOMContentLoaded', () => {
    const chaptersContainer = document.getElementById('chapters');
    if (chaptersContainer) {
        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList.contains('chapter-container')) {
                        addLorebookButtonToChapter(node);
                    }
                });
            });
        });
        observer.observe(chaptersContainer, { childList: true });
    }
});

/* 修改大纲区域和章节细纲生成区域按钮：移除延迟，立即添加 */
document.addEventListener('DOMContentLoaded', () => {
    // 立即为大纲区域添加"保存到Lorebook"按钮
    const outlineElement = document.getElementById('outline');
    if (outlineElement) {
        const outlineContainer = outlineElement.closest('div');
        if (outlineContainer) {
            const buttonContainer = outlineContainer.querySelector('.chapter-buttons');
            if (buttonContainer && !buttonContainer.querySelector('.save-outline-to-lorebook')) {
                const saveButton = document.createElement('button');
                saveButton.textContent = '保存到Lorebook';
                saveButton.className = 'save-outline-to-lorebook';
                saveButton.onclick = function(e) {
                    e.preventDefault();
                    const content = document.getElementById('outline').value;
                    if (content) {
                        lorebook.extractFromContent(content, '小说大纲', '世界观');
                    } else {
                        alert('大纲内容为空，无法保存');
                    }
                };
                buttonContainer.appendChild(saveButton);
            }
        }
    }
    
    // 立即为章节细纲生成区域添加按钮
    const chapterTempContainer = document.getElementById('chapter-temp-container');
    if (chapterTempContainer) {
        const tempButtons = chapterTempContainer.querySelector('.chapter-buttons');
        if (tempButtons && !tempButtons.querySelector('.save-detailed-outline-to-lorebook')) {
            const saveButton = document.createElement('button');
            saveButton.textContent = '保存到Lorebook';
            saveButton.className = 'save-detailed-outline-to-lorebook normal-button';
            saveButton.onclick = function(e) {
                e.preventDefault();
                const content = document.getElementById('chapter-temp-content').value;
                if (content) {
                    lorebook.extractFromContent(content, '章节细纲', '事件');
                } else {
                    alert('章节细纲内容为空，无法保存');
                }
            };
            tempButtons.appendChild(saveButton);
        }
    }
});

/* 修改思维导图生成区域按钮：移除延迟，立即添加 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        document.addEventListener('jsmind-content-generated', function(e) {
            const targetElement = e.detail.targetElement;
            if (targetElement && targetElement.classList.contains('chapter-content-text')) {
                const chapterContainer = targetElement.closest('.chapter-container');
                if (chapterContainer) {
                    const buttonContainer = chapterContainer.querySelector('.chapter-content .chapter-buttons');
                    const resetButton = Array.from(buttonContainer.querySelectorAll('button')).find(
                        btn => btn.textContent.includes('重置正文')
                    );
                    if (resetButton) {
                        const nextSibling = resetButton.nextElementSibling;
                        if (nextSibling && nextSibling.classList.contains('save-to-lorebook')) {
                            nextSibling.remove();
                        }
                        const saveButton = document.createElement('button');
                        saveButton.textContent = '保存到Lorebook';
                        saveButton.className = 'save-to-lorebook';
                        saveButton.onclick = function(evt) {
                            evt.preventDefault();
                            const content = targetElement.value;
                            const title = chapterContainer.querySelector('.chapter-header span:first-child').textContent;
                            if (content) {
                                lorebook.extractFromContent(content, title);
                            } else {
                                alert('内容为空，无法保存');
                            }
                        };
                        resetButton.insertAdjacentElement('afterend', saveButton);
                    }
                }
            }
        });
    } catch (error) {
        console.error('添加思维导图章节Lorebook按钮时出错:', error);
    }
});

// 重写原始的提示词处理函数
document.addEventListener('DOMContentLoaded', () => {
    // 延迟执行，确保记忆管理器已加载
    setTimeout(() => {
        try {
            console.log('设置Lorebook提示词处理函数');
            
            // 获取原始的buildPrompt函数
            const originalBuildPrompt = window.buildPrompt;
            if (typeof originalBuildPrompt === 'function') {
                // 重写buildPrompt函数
                window.buildPrompt = function(...args) {
                    // 先调用原始函数
                    let prompt = originalBuildPrompt.apply(this, args);
                    
                    // 然后应用Lorebook处理
                    console.log('Lorebook处理提示词');
                    return lorebook.processPrompt(prompt);
                };
                
                console.log('Lorebook提示词处理函数设置完成');
            } else {
                console.warn('未找到原始buildPrompt函数，Lorebook提示词处理未设置');
            }
        } catch (error) {
            console.error('设置Lorebook提示词处理函数时出错:', error);
        }
    }, 500); // 延迟0.5秒执行
}); 