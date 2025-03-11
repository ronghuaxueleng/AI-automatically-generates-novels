// memory-manager.js - 增强的上下文记忆系统

class MemoryManager {
    constructor() {
        this.memories = {
            chapters: [],  // 章节记忆
            characters: {},  // 角色记忆
            events: [],  // 事件记忆
            settings: {}  // 设置
        };
        
        this.settings = {
            maxChaptersToRemember: 10,  // 记忆的最大章节数
            compressionEnabled: true,  // 是否启用记忆压缩
            compressionRatio: 0.5,  // 压缩比例
            prioritizeRecent: true,  // 优先记忆最近内容
            autoSummarize: true,  // 自动总结
            summarizeThreshold: 5000  // 总结阈值（字符数）
        };
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.loadMemories();
        this.setupHooks();
    }
    
    // 加载设置
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('memory_manager_settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.error('加载记忆管理器设置失败:', error);
        }
    }
    
    // 保存设置
    saveSettings() {
        try {
            localStorage.setItem('memory_manager_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('保存记忆管理器设置失败:', error);
        }
    }
    
    // 加载记忆
    loadMemories() {
        try {
            // 尝试从localStorage加载
            const savedMemories = localStorage.getItem('memory_manager_data');
            if (savedMemories) {
                this.memories = JSON.parse(savedMemories);
            }
            
            // 如果localStorage中没有数据，尝试从服务器加载
            if (!savedMemories || this.memories.chapters.length === 0) {
                this.loadMemoriesFromServer();
            }
        } catch (error) {
            console.error('加载记忆数据失败:', error);
        }
    }
    
    // 从服务器加载记忆
    async loadMemoriesFromServer() {
        try {
            const response = await fetch('/load-memories');
            if (response.ok) {
                const data = await response.json();
                if (data && data.memories) {
                    this.memories = data.memories;
                    this.saveMemoriesToStorage();
                }
            }
        } catch (error) {
            console.error('从服务器加载记忆失败:', error);
        }
    }
    
    // 保存记忆到localStorage
    saveMemoriesToStorage() {
        try {
            localStorage.setItem('memory_manager_data', JSON.stringify(this.memories));
        } catch (error) {
            console.error('保存记忆到localStorage失败:', error);
            
            // 如果localStorage存储失败（可能是因为数据太大），尝试保存到服务器
            this.saveMemoriesToServer();
        }
    }
    
    // 保存记忆到服务器
    async saveMemoriesToServer() {
        try {
            const response = await fetch('/save-memories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memories: this.memories })
            });
            
            if (!response.ok) {
                throw new Error('服务器响应错误');
            }
        } catch (error) {
            console.error('保存记忆到服务器失败:', error);
            alert('保存记忆失败，请手动导出备份');
        }
    }
    
    // 设置钩子函数，拦截章节生成和保存
    setupHooks() {
        // 拦截章节生成函数
        if (typeof window.generateContent === 'function') {
            const originalGenerateContent = window.generateContent;
            window.generateContent = async (button) => {
                // 在生成内容前，确保记忆已更新
                this.updateMemoriesFromDOM();
                
                // 调用原始函数
                const result = await originalGenerateContent.call(window, button);
                
                // 生成完成后，更新记忆
                this.updateMemoriesFromDOM();
                
                return result;
            };
        }
        
        // 拦截保存状态函数
        if (typeof window.saveState === 'function') {
            const originalSaveState = window.saveState;
            window.saveState = () => {
                // 调用原始函数
                originalSaveState.call(window);
                
                // 更新记忆
                this.updateMemoriesFromDOM();
            };
        }
    }
    
    // 从DOM更新记忆
    updateMemoriesFromDOM() {
        // 获取所有章节
        const chapterContainers = document.querySelectorAll('.chapter-container');
        const chapters = [];
        
        chapterContainers.forEach((container, index) => {
            const outlineElement = container.querySelector('.chapter-outline');
            const contentElement = container.querySelector('.chapter-content-text');
            
            if (outlineElement && contentElement) {
                chapters.push({
                    index,
                    title: container.querySelector('.chapter-header span:first-child')?.textContent || `章节 ${index + 1}`,
                    outline: outlineElement.value,
                    content: contentElement.value,
                    timestamp: Date.now()
                });
            }
        });
        
        // 更新章节记忆
        this.updateChapterMemories(chapters);
        
        // 提取角色记忆
        this.extractCharacterMemories();
        
        // 提取事件记忆
        this.extractEventMemories();
        
        // 保存记忆
        this.saveMemoriesToStorage();
    }
    
    // 更新章节记忆
    updateChapterMemories(chapters) {
        // 如果没有章节，不更新
        if (!chapters || chapters.length === 0) return;
        
        // 按索引排序
        chapters.sort((a, b) => a.index - b.index);
        
        // 如果启用了压缩，对旧章节进行压缩
        if (this.settings.compressionEnabled && chapters.length > this.settings.maxChaptersToRemember) {
            // 保留最新的N章不压缩
            const recentChapters = chapters.slice(-this.settings.maxChaptersToRemember);
            const olderChapters = chapters.slice(0, -this.settings.maxChaptersToRemember);
            
            // 压缩旧章节
            const compressedOlderChapters = olderChapters.map(chapter => {
                return {
                    ...chapter,
                    content: this.compressText(chapter.content),
                    outline: this.compressText(chapter.outline)
                };
            });
            
            // 更新记忆
            this.memories.chapters = [...compressedOlderChapters, ...recentChapters];
        } else {
            // 不压缩，但可能需要限制数量
            this.memories.chapters = chapters.slice(-this.settings.maxChaptersToRemember * 2);
        }
    }
    
    // 压缩文本
    compressText(text) {
        if (!text || text.length < this.settings.summarizeThreshold) {
            return text;
        }
        
        if (this.settings.autoSummarize) {
            // 这里应该调用AI进行总结，但为了简化，我们使用简单的截断
            // 在实际应用中，可以调用AI API进行更智能的总结
            return text.substring(0, text.length * this.settings.compressionRatio) + 
                   "\n[...内容已压缩...]\n" + 
                   text.substring(text.length * (1 - this.settings.compressionRatio / 2));
        } else {
            // 简单截断
            return text.substring(0, text.length * this.settings.compressionRatio) + 
                   "\n[...内容已截断...]\n";
        }
    }
    
    // 提取角色记忆
    extractCharacterMemories() {
        // 从人物设定中提取
        const charactersText = document.getElementById('characters')?.value || '';
        if (charactersText) {
            // 简单的解析逻辑，实际应用中可能需要更复杂的解析
            const characterLines = charactersText.split('\n');
            const characters = {};
            
            let currentCharacter = null;
            
            characterLines.forEach(line => {
                // 假设角色名以"-"或"："开头
                if (line.match(/^[-–—•]\s*([^:：]+)/) || line.match(/^([^:：]+)[：:]/)) {
                    const match = line.match(/^[-–—•]\s*([^:：]+)/) || line.match(/^([^:：]+)[：:]/);
                    if (match && match[1]) {
                        currentCharacter = match[1].trim();
                        characters[currentCharacter] = { traits: [], appearances: [] };
                    }
                } else if (currentCharacter && line.trim()) {
                    // 添加到当前角色的特征
                    characters[currentCharacter].traits.push(line.trim());
                }
            });
            
            // 从章节内容中提取角色出场信息
            this.memories.chapters.forEach(chapter => {
                Object.keys(characters).forEach(characterName => {
                    if (chapter.content.includes(characterName)) {
                        // 记录角色在哪些章节出现
                        if (!characters[characterName].appearances.includes(chapter.index)) {
                            characters[characterName].appearances.push(chapter.index);
                        }
                    }
                });
            });
            
            this.memories.characters = characters;
        }
    }
    
    // 提取事件记忆
    extractEventMemories() {
        // 从章节中提取关键事件
        // 这里使用简单的启发式方法，实际应用中可能需要AI辅助
        const events = [];
        
        this.memories.chapters.forEach(chapter => {
            // 从章节大纲中提取事件
            if (chapter.outline) {
                const outlineLines = chapter.outline.split('\n');
                outlineLines.forEach(line => {
                    // 寻找可能的事件描述（以动词开头的句子）
                    if (line.match(/^[^，。！？,.!?]+[了过起]/)) {
                        events.push({
                            description: line.trim(),
                            chapterIndex: chapter.index,
                            type: 'outline'
                        });
                    }
                });
            }
            
            // 从章节内容中提取对话（可能包含重要事件）
            if (chapter.content) {
                const dialogues = chapter.content.match(/[""][^""]+[""]/g) || [];
                dialogues.forEach(dialogue => {
                    if (dialogue.length > 20) {  // 只记录较长的对话
                        events.push({
                            description: dialogue,
                            chapterIndex: chapter.index,
                            type: 'dialogue'
                        });
                    }
                });
            }
        });
        
        // 限制事件数量，避免记忆过载
        this.memories.events = events.slice(-50);  // 只保留最近的50个事件
    }
    
    // 获取记忆摘要
    getMemorySummary() {
        // 构建记忆摘要，用于提示词
        let summary = "--- 故事记忆摘要 ---\n";
        
        // 添加角色摘要
        summary += "主要角色：\n";
        Object.entries(this.memories.characters).forEach(([name, data]) => {
            summary += `- ${name}: ${data.traits.slice(0, 3).join(', ')}\n`;
        });
        
        // 添加最近事件
        summary += "\n最近事件：\n";
        this.memories.events.slice(-5).forEach(event => {
            summary += `- ${event.description}\n`;
        });
        
        // 添加章节摘要
        summary += "\n章节摘要：\n";
        this.memories.chapters.slice(-3).forEach(chapter => {
            summary += `- ${chapter.title}: ${chapter.outline.split('\n')[0]}\n`;
        });
        
        summary += "-------------------\n\n";
        
        return summary;
    }
    
    // 获取特定章节的上下文
    getChapterContext(chapterIndex) {
        // 找到目标章节的前几章作为上下文
        const relevantChapters = this.memories.chapters
            .filter(ch => ch.index < chapterIndex)
            .sort((a, b) => b.index - a.index)  // 按索引降序排序
            .slice(0, 5);  // 取最近的5章
        
        if (relevantChapters.length === 0) {
            return "";
        }
        
        // 按正确顺序（索引升序）排列
        relevantChapters.sort((a, b) => a.index - b.index);
        
        let context = "--- 前文回顾 ---\n";
        
        relevantChapters.forEach(chapter => {
            context += `【${chapter.title}】\n`;
            context += `${chapter.outline.split('\n')[0]}\n`;
            
            // 如果内容太长，只添加摘要
            if (chapter.content.length > 500) {
                context += `${chapter.content.substring(0, 200)}...\n`;
            } else {
                context += `${chapter.content}\n`;
            }
            
            context += "\n";
        });
        
        context += "-------------------\n\n";
        
        return context;
    }
    
    // 增强提示词
    enhancePrompt(prompt, chapterIndex) {
        // 添加记忆摘要
        const memorySummary = this.getMemorySummary();
        
        // 添加章节上下文
        const chapterContext = this.getChapterContext(chapterIndex);
        
        // 将记忆信息添加到提示词开头
        return memorySummary + chapterContext + prompt;
    }
    
    // 导出记忆
    exportMemories() {
        const dataStr = JSON.stringify(this.memories, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `story-memories-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // 导入记忆
    importMemories(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data && data.chapters) {
                this.memories = data;
                this.saveMemoriesToStorage();
                return true;
            }
            
            throw new Error('数据格式无效');
        } catch (error) {
            console.error('导入记忆失败:', error);
            return false;
        }
    }
    
    // 创建设置面板
    createSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'memory-settings-panel';
        panel.innerHTML = `
            <div class="memory-settings-header">
                <h2>记忆管理器设置</h2>
                <button class="memory-settings-close">关闭</button>
            </div>
            <div class="memory-settings-content">
                <div class="form-group">
                    <label>记忆的最大章节数</label>
                    <input type="number" id="maxChaptersToRemember" min="1" max="50" value="${this.settings.maxChaptersToRemember}">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="compressionEnabled" ${this.settings.compressionEnabled ? 'checked' : ''}>
                        启用记忆压缩
                    </label>
                </div>
                <div class="form-group">
                    <label>压缩比例 (0.1-0.9)</label>
                    <input type="range" id="compressionRatio" min="0.1" max="0.9" step="0.1" value="${this.settings.compressionRatio}">
                    <span id="compressionRatioValue">${this.settings.compressionRatio}</span>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="prioritizeRecent" ${this.settings.prioritizeRecent ? 'checked' : ''}>
                        优先记忆最近内容
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="autoSummarize" ${this.settings.autoSummarize ? 'checked' : ''}>
                        自动总结长文本
                    </label>
                </div>
                <div class="form-group">
                    <label>总结阈值（字符数）</label>
                    <input type="number" id="summarizeThreshold" min="1000" max="10000" step="500" value="${this.settings.summarizeThreshold}">
                </div>
                <div class="memory-buttons">
                    <button id="saveMemorySettings">保存设置</button>
                    <button id="exportMemories">导出记忆</button>
                    <button id="importMemories">导入记忆</button>
                    <input type="file" id="importMemoriesFile" style="display:none" accept=".json">
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .memory-settings-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 500px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 1000;
                overflow: hidden;
            }
            
            .memory-settings-header {
                padding: 16px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .memory-settings-header h2 {
                margin: 0;
                color: #333;
            }
            
            .memory-settings-content {
                padding: 20px;
            }
            
            .memory-buttons {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            
            .memory-buttons button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            #saveMemorySettings {
                background: #1890ff;
                color: white;
            }
            
            #exportMemories, #importMemories {
                background: #f5f5f5;
                border: 1px solid #d9d9d9;
            }
            
            .memory-settings-close {
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
            }
            
            .memory-overlay {
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
        overlay.className = 'memory-overlay';
        document.body.appendChild(overlay);
        document.body.appendChild(panel);
        
        // 绑定事件
        panel.querySelector('.memory-settings-close').addEventListener('click', () => {
            document.body.removeChild(panel);
            document.body.removeChild(overlay);
        });
        
        overlay.addEventListener('click', () => {
            document.body.removeChild(panel);
            document.body.removeChild(overlay);
        });
        
        // 压缩比例滑块
        const compressionRatio = panel.querySelector('#compressionRatio');
        const compressionRatioValue = panel.querySelector('#compressionRatioValue');
        compressionRatio.addEventListener('input', () => {
            compressionRatioValue.textContent = compressionRatio.value;
        });
        
        // 保存设置
        panel.querySelector('#saveMemorySettings').addEventListener('click', () => {
            this.settings.maxChaptersToRemember = parseInt(panel.querySelector('#maxChaptersToRemember').value);
            this.settings.compressionEnabled = panel.querySelector('#compressionEnabled').checked;
            this.settings.compressionRatio = parseFloat(panel.querySelector('#compressionRatio').value);
            this.settings.prioritizeRecent = panel.querySelector('#prioritizeRecent').checked;
            this.settings.autoSummarize = panel.querySelector('#autoSummarize').checked;
            this.settings.summarizeThreshold = parseInt(panel.querySelector('#summarizeThreshold').value);
            
            this.saveSettings();
            
            alert('设置已保存');
            document.body.removeChild(panel);
            document.body.removeChild(overlay);
        });
        
        // 导出记忆
        panel.querySelector('#exportMemories').addEventListener('click', () => {
            this.exportMemories();
        });
        
        // 导入记忆
        panel.querySelector('#importMemories').addEventListener('click', () => {
            panel.querySelector('#importMemoriesFile').click();
        });
        
        panel.querySelector('#importMemoriesFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const success = this.importMemories(event.target.result);
                    if (success) {
                        alert('记忆导入成功');
                    } else {
                        alert('记忆导入失败，请检查文件格式');
                    }
                };
                reader.readAsText(file);
            }
        });
    }
    
    // 显示设置面板
    showSettings() {
        this.createSettingsPanel();
    }
}

// 创建全局实例
const memoryManager = new MemoryManager();

// 添加到窗口对象，以便其他脚本访问
window.memoryManager = memoryManager;

// 添加顶部菜单按钮
document.addEventListener('DOMContentLoaded', () => {
    // 创建顶部菜单按钮
    const button = document.createElement('button');
    button.textContent = '记忆管理';
    button.style.marginLeft = '10px';
    
    // 添加到顶部栏
    const topBar = document.querySelector('.top-bar');
    if (topBar) {
        topBar.appendChild(button);
        
        // 点击事件
        button.addEventListener('click', () => {
            memoryManager.showSettings();
        });
    }
    
    // 延迟执行，确保Lorebook已经设置了它的处理函数
    setTimeout(() => {
        try {
            console.log('设置记忆管理器提示词处理函数');
            
            // 获取当前的buildPrompt函数（可能已被Lorebook修改）
            const currentBuildPrompt = window.buildPrompt;
            if (typeof currentBuildPrompt === 'function') {
                // 重写buildPrompt函数
                window.buildPrompt = function(...args) {
                    // 先调用当前函数（包含Lorebook的处理）
                    let prompt = currentBuildPrompt.apply(this, args);
                    
                    // 获取当前章节索引
                    let chapterIndex = 0;
                    if (this.currentTarget) {
                        const chapterContainers = document.querySelectorAll('.chapter-container');
                        for (let i = 0; i < chapterContainers.length; i++) {
                            if (chapterContainers[i].contains(this.currentTarget[0])) {
                                chapterIndex = i;
                                break;
                            }
                        }
                    }
                    
                    // 然后应用记忆管理器处理
                    console.log('记忆管理器处理提示词，章节索引:', chapterIndex);
                    return memoryManager.enhancePrompt(prompt, chapterIndex);
                };
                
                console.log('记忆管理器提示词处理函数设置完成');
            } else {
                console.warn('未找到当前buildPrompt函数，记忆管理器提示词处理未设置');
            }
            
            // 重写生成内容函数
            if (typeof window.generateContent === 'function') {
                console.log('设置记忆管理器内容生成钩子');
                
                const originalGenerateContent = window.generateContent;
                window.generateContent = async (button) => {
                    // 在生成内容前，确保记忆已更新
                    console.log('生成内容前更新记忆');
                    memoryManager.updateMemoriesFromDOM();
                    
                    // 调用原始函数
                    const result = await originalGenerateContent.call(window, button);
                    
                    // 生成完成后，更新记忆
                    console.log('生成内容后更新记忆');
                    memoryManager.updateMemoriesFromDOM();
                    
                    return result;
                };
                
                console.log('记忆管理器内容生成钩子设置完成');
            } else {
                console.warn('未找到generateContent函数，记忆管理器内容生成钩子未设置');
            }
        } catch (error) {
            console.error('设置记忆管理器钩子函数时出错:', error);
        }
    }, 1000); // 延迟1秒执行，确保在Lorebook之后
}); 