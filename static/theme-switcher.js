// theme-switcher.js
// 确保在页面加载时初始化主题切换器
(function() {
    // 等待DOM完全加载后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeSwitcher);
    } else {
        initThemeSwitcher();
    }
    
    function initThemeSwitcher() {
        if (!window.themeSwitcherInitialized) {
            window.themeSwitcherInitialized = true;
            new EnhancedStyleSwitcher();
            console.log('主题切换器已初始化');
        }
    }
})();

class EnhancedStyleSwitcher {
    constructor() {
        this.themes = this.initializeThemes();
        this.layouts = this.initializeLayouts();
        this.currentTheme = 'elegant';
        this.currentLayout = 'grid';
        this.textAreas = [];
        this.menuOpen = false;
        this.activeTextArea = null;
        this.init();
    }

    init() {
        this.createSwitcher();
        this.initializeTextAreas();
        this.initializeResizeObserver();
        this.loadSavedSettings();
    }

    initializeThemes() {
        return {
            elegant: {
                vars: {
                    '--primary-color': '#2196F3',
                    '--secondary-color': '#1976D2',
                    '--accent-color': '#00BCD4',
                    '--bg-light': '#E3F2FD',
                    '--bg-dark': '#BBDEFB',
                    '--text-color': '#333',
                    '--text-secondary': '#666',
                    '--border-color': '#BBDEFB',
                    '--shadow': '0 4px 12px rgba(33, 150, 243, 0.1)',
                    '--shadow-hover': '0 8px 24px rgba(33, 150, 243, 0.2)',
                    '--transition': 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                },
                styles: {
                    borderRadius: '12px',
                    transformScale: '1.02',
                    textAreaPadding: '16px'
                }
            },
            dark: {
                vars: {
                    '--primary-color': '#455A64',
                    '--secondary-color': '#263238',
                    '--accent-color': '#607D8B',
                    '--bg-light': '#37474F',
                    '--bg-dark': '#263238',
                    '--text-color': '#ECEFF1',
                    '--text-secondary': '#B0BEC5',
                    '--border-color': '#546E7A',
                    '--shadow': '0 4px 12px rgba(0, 0, 0, 0.3)',
                    '--shadow-hover': '0 8px 24px rgba(0, 0, 0, 0.4)',
                    '--transition': 'all 0.3s ease'
                },
                styles: {
                    borderRadius: '8px',
                    transformScale: '1',
                    textAreaPadding: '14px'
                }
            },
            flat: {
                vars: {
                    '--primary-color': '#9E9E9E',
                    '--secondary-color': '#757575',
                    '--accent-color': '#616161',
                    '--bg-light': '#F5F5F5',
                    '--bg-dark': '#EEEEEE',
                    '--text-color': '#212121',
                    '--text-secondary': '#757575',
                    '--border-color': '#E0E0E0',
                    '--shadow': 'none',
                    '--shadow-hover': '0 2px 4px rgba(0, 0, 0, 0.1)',
                    '--transition': 'all 0.2s linear'
                },
                styles: {
                    borderRadius: '4px',
                    transformScale: '1',
                    textAreaPadding: '12px'
                }
            },
            nature: {
                vars: {
                    '--primary-color': '#4CAF50',
                    '--secondary-color': '#388E3C',
                    '--accent-color': '#8BC34A',
                    '--bg-light': '#E8F5E9',
                    '--bg-dark': '#C8E6C9',
                    '--text-color': '#1B5E20',
                    '--text-secondary': '#2E7D32',
                    '--border-color': '#A5D6A7',
                    '--shadow': '0 4px 12px rgba(76, 175, 80, 0.1)',
                    '--shadow-hover': '0 8px 24px rgba(76, 175, 80, 0.2)',
                    '--transition': 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                },
                styles: {
                    borderRadius: '16px',
                    transformScale: '1.03',
                    textAreaPadding: '18px'
                }
            },
            sunset: {
                vars: {
                    '--primary-color': '#FF9800',
                    '--secondary-color': '#F57C00',
                    '--accent-color': '#FFB74D',
                    '--bg-light': '#FFF3E0',
                    '--bg-dark': '#FFE0B2',
                    '--text-color': '#E65100',
                    '--text-secondary': '#EF6C00',
                    '--border-color': '#FFCC80',
                    '--shadow': '0 4px 12px rgba(255, 152, 0, 0.1)',
                    '--shadow-hover': '0 8px 24px rgba(255, 152, 0, 0.2)',
                    '--transition': 'all 0.3s ease-in-out'
                },
                styles: {
                    borderRadius: '20px',
                    transformScale: '1.02',
                    textAreaPadding: '16px'
                }
            }
        };
    }

    initializeLayouts() {
        return {
            grid: {
                containerStyle: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px',
                    padding: '20px'
                },
                textAreaStyle: {
                    height: 'auto',
                    minHeight: '100px',
                    maxHeight: '400px',
                    width: '100%',
                    overflowY: 'auto'
                }
            },
            flex: {
                containerStyle: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '20px',
                    padding: '20px'
                },
                textAreaStyle: {
                    flex: '1 1 300px',
                    minHeight: '150px',
                    maxHeight: '400px',
                    width: '100%',
                    overflowY: 'auto'
                }
            },
            masonry: {
                containerStyle: {
                    columnCount: 'auto',
                    columnWidth: '300px',
                    columnGap: '20px',
                    padding: '20px'
                },
                textAreaStyle: {
                    breakInside: 'avoid',
                    marginBottom: '20px',
                    width: '100%',
                    maxHeight: 'none'
                },
                responsiveRules: [
                    { breakpoint: 768, columns: 1 },
                    { breakpoint: 1024, columns: 2 },
                    { breakpoint: 1440, columns: 3 }
                ]
            },
            centered: {
                containerStyle: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '20px'
                },
                textAreaStyle: {
                    width: '100%',
                    maxWidth: '1200px',
                    height: 'auto'
                }
            }
        };
    }

    createSwitcher() {
        const switcher = document.createElement('div');
        switcher.className = 'enhanced-theme-switcher';
        
        const switcherHTML = `
            <div class="theme-ball">
                <div class="theme-text">主题切换,可拖拽</div>
                <div class="theme-menu">
                    <div class="menu-section">
                        <h3>主题风格</h3>
                        <button class="theme-btn elegant-theme" data-theme="elegant">优雅蓝</button>
                        <button class="theme-btn dark-theme" data-theme="dark">冷峻黑</button>
                        <button class="theme-btn flat-theme" data-theme="flat">简约白</button>
                        <button class="theme-btn nature-theme" data-theme="nature">自然绿</button>
                        <button class="theme-btn sunset-theme" data-theme="sunset">夕阳橙</button>
                    </div>
                    <div class="menu-section">
                        <h3>布局方式</h3>
                        <button class="layout-btn" data-layout="grid">网格</button>
                        <button class="layout-btn" data-layout="flex">弹性</button>
                        <button class="layout-btn" data-layout="masonry">瀑布</button>
                        <button class="layout-btn" data-layout="centered">居中</button>
                    </div>
                    <div class="menu-section">
                        <h3>编辑模式</h3>
                        <button class="edit-btn" id="toggleFocus">专注模式</button>
                        <button class="edit-btn" id="toggleAutoCenter">自动居中</button>
                    </div>
                    <div class="menu-section">
                        <h3>其他设置</h3>
                        <button class="settings-btn" id="resetData">清除所有数据</button>
                        <button class="settings-btn" id="toggleAnimations">动画开关</button>
                    </div>
                </div>
            </div>
        `;

        switcher.innerHTML = switcherHTML;
        this.addSwitcherStyles();
        document.body.appendChild(switcher);
        
        this.initializeButtons(switcher);
        this.initializeDragging(switcher);
        this.initializeMenuBehavior(switcher);
    }

    addSwitcherStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .enhanced-theme-switcher {
                pointer-events: auto;
                touch-action: none;
                user-select: none;
                position: fixed !important;
                right: 20vw !important;
                bottom: 20vh !important;
                z-index: 9999;
            }

            .theme-ball {
                width: 80px;
                height: 80px;
                background: var(--primary-color);
                border-radius: 50%;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                transition: transform 0.3s ease;
                position: relative;
                z-index: 9999;
                opacity: 1 !important;
            }

            .theme-ball:hover {
                transform: scale(1.1);
            }

            .theme-text {
                color: white;
                font-size: 12px;
                text-align: center;
                line-height: 1.2;
                padding: 5px;
                pointer-events: none;
            }

            .theme-menu {
                position: absolute;
                top: -250px;
                left: -150px;
                width: 320px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                padding: 15px;
                display: none;
                z-index: 10000;
            }

            .theme-menu.open {
                display: block;
                animation: menuFadeIn 0.3s forwards;
            }

            @keyframes menuFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            .menu-section {
                margin-bottom: 15px;
            }

            .menu-section h3 {
                color: #333;
                font-size: 14px;
                margin-bottom: 8px;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }

            .theme-btn, .layout-btn, .edit-btn, .settings-btn {
                border: none;
                padding: 6px 12px;
                margin: 3px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s ease;
                background: #f0f0f0;
                color: #333;
                outline: none;
                display: inline-block;
                text-align: center;
            }

            .theme-btn:hover, .layout-btn:hover, .edit-btn:hover, .settings-btn:hover {
                background: #e0e0e0;
            }

            .active-mode {
                background: var(--primary-color);
                color: white;
            }
            
            /* 主题特定样式 */
            .elegant-theme {
                background-color: #2196F3;
                color: white;
            }

            .dark-theme {
                background-color: #455A64;
                color: white;
            }

            .flat-theme {
                background-color: #f9f9f9;
                color: #333;
                border: 1px solid #ddd;
            }

            .nature-theme {
                background-color: #4CAF50;
                color: white;
            }

            .sunset-theme {
                background-color: #FF9800;
                color: white;
            }

            /* 自定义布局样式 */
            .grid-layout .container {
                display: grid !important;
            }

            .flex-layout .container {
                display: flex !important;
                flex-wrap: wrap !important;
            }

            .masonry-layout .container {
                column-count: auto !important;
                column-width: 300px !important;
            }

            .centered-layout .container {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
            }

            .centered-layout .text-area {
                max-width: 1200px !important;
            }

            /* 响应式样式 */
            @media screen and (max-width: 768px) {
                .theme-menu {
                    left: -100px;
                    width: 280px;
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .enhanced-theme-switcher {
                    right: 20px !important;
                    bottom: 20px !important;
                }
                
                .theme-ball {
                    width: 60px;
                    height: 60px;
                }
                
                .grid-layout .container {
                    grid-template-columns: 1fr !important;
                }
                
                .masonry-layout .container {
                    column-count: 1 !important;
                }
                
                .flex-layout .text-area {
                    flex: 1 1 100% !important;
                }
                
                .centered-layout .container > * {
                    width: 95% !important;
                    max-width: 950px !important;
                }
            }
            
            @media screen and (min-width: 769px) and (max-width: 1024px) {
                .masonry-layout .container {
                    column-count: 2 !important;
                }
            }
            
            @media screen and (min-width: 1025px) {
                .masonry-layout .container {
                    column-count: 3 !important;
                }
            }
            
            /* 章节容器样式优化 */
            .grid-layout .chapter-container {
                grid-column: 1 / -1 !important;
                display: grid;
                grid-template-columns: 1fr;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .flex-layout .chapter-container {
                flex: 1 1 100%;
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .masonry-layout .chapter-container {
                break-inside: avoid;
                page-break-inside: avoid;
                margin-bottom: 20px;
            }
            
            .centered-layout .chapter-container {
                width: 100%;
                max-width: 800px;
                margin: 0 auto 20px auto;
            }
            
            /* 改进文本区域滚动条样式 */
            .text-area {
                scrollbar-width: thin;
                scrollbar-color: var(--primary-color) transparent;
            }
            
            .text-area::-webkit-scrollbar {
                width: 8px;
            }
            
            .text-area::-webkit-scrollbar-thumb {
                background-color: var(--primary-color);
                border-radius: 4px;
            }
            
            .text-area::-webkit-scrollbar-track {
                background: transparent;
            }
        `;

        document.head.appendChild(styles);
    }

    initializeMenuBehavior(switcher) {
        const themeBall = switcher.querySelector('.theme-ball');
        const themeMenu = switcher.querySelector('.theme-menu');
        
        // 点击切换菜单显示状态
        themeBall.addEventListener('click', (e) => {
            if (e.target.closest('.theme-menu')) return;
            this.menuOpen = !this.menuOpen;
            
            if (this.menuOpen) {
                themeMenu.classList.add('open');
            } else {
                themeMenu.classList.remove('open');
            }
        });

        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.enhanced-theme-switcher')) {
                this.menuOpen = false;
                themeMenu.classList.remove('open');
            }
        });

        // 按ESC键关闭菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menuOpen) {
                this.menuOpen = false;
                themeMenu.classList.remove('open');
            }
        });
    }

    initializeButtons(switcher) {
        // 主题按钮
        switcher.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.applyTheme(theme);
                
                // 更新按钮状态
                switcher.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active-mode'));
                btn.classList.add('active-mode');
            });
            
            // 设置初始选中状态
            if (btn.dataset.theme === this.currentTheme) {
                btn.classList.add('active-mode');
            }
        });
        
        // 布局按钮
        switcher.querySelectorAll('.layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const layout = btn.dataset.layout;
                this.applyLayout(layout);
                
                // 更新按钮状态
                switcher.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active-mode'));
                btn.classList.add('active-mode');
            });
            
            // 设置初始选中状态
            if (btn.dataset.layout === this.currentLayout) {
                btn.classList.add('active-mode');
            }
        });
        
        // 专注模式
        const focusBtn = switcher.querySelector('#toggleFocus');
        if (focusBtn) {
            focusBtn.addEventListener('click', () => {
                this.toggleFocusMode();
            });
            
            // 设置初始状态
            if (document.body.classList.contains('focus-mode')) {
                focusBtn.classList.add('active-mode');
            }
        }
        
        // 自动居中
        const autoCenterBtn = switcher.querySelector('#toggleAutoCenter');
        if (autoCenterBtn) {
            autoCenterBtn.addEventListener('click', () => {
                this.toggleAutoCenter();
            });
            
            // 设置初始状态
            if (document.body.classList.contains('auto-center')) {
                autoCenterBtn.classList.add('active-mode');
            }
        }
        
        // 清除数据
        const resetBtn = switcher.querySelector('#resetData');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('确定要清除所有保存的数据吗？这将恢复默认设置。')) {
                    localStorage.removeItem('theme-switcher-settings');
                    this.applyTheme('elegant');
                    this.applyLayout('grid');
                    document.body.classList.remove('focus-mode', 'auto-center');
                    this.showNotification('已恢复默认设置', 'success');
                    
                    // 重新加载页面
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                }
            });
        }
        
        // 动画开关
        const toggleAnimationsBtn = switcher.querySelector('#toggleAnimations');
        if (toggleAnimationsBtn) {
            toggleAnimationsBtn.addEventListener('click', () => {
                this.toggleAnimations();
            });
            
            // 设置初始状态
            if (!this.animationsEnabled) {
                toggleAnimationsBtn.classList.add('active-mode');
                document.documentElement.style.setProperty('--transition', 'none');
            }
        }
    }

    initializeDragging(element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        const dragStart = (e) => {
            if (e.target.closest('.theme-menu')) return;
            
            isDragging = true;
            
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - element.offsetLeft;
                initialY = e.touches[0].clientY - element.offsetTop;
            } else {
                initialX = e.clientX - element.offsetLeft;
                initialY = e.clientY - element.offsetTop;
            }
        };

        const dragMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            let clientX, clientY;
            if (e.type === "touchmove") {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            currentX = clientX - initialX;
            currentY = clientY - initialY;

            // 边界检查
            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;

            currentX = Math.min(Math.max(0, currentX), maxX);
            currentY = Math.min(Math.max(0, currentY), maxY);

            element.style.left = `${currentX}px`;
            element.style.top = `${currentY}px`;
        };

        const dragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            this.saveSwitcherPosition(element);
        };

        // 鼠标事件
        element.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);

        // 触摸事件
        element.addEventListener('touchstart', dragStart, { passive: false });
        document.addEventListener('touchmove', dragMove, { passive: false });
        document.addEventListener('touchend', dragEnd);
    }

    initializeTextAreas() {
        this.textAreas = Array.from(document.querySelectorAll('.text-area'));
        this.textAreas.forEach(textArea => {
            this.setupTextArea(textArea);
        });

        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        document.body.appendChild(overlay);
    }

    setupTextArea(textArea) {
        // 设置基础样式
        this.applyTextAreaStyles(textArea);

        // 自动调整高度
        textArea.addEventListener('input', () => {
            this.autoResizeTextArea(textArea);
        });

        // 焦点事件处理
        textArea.addEventListener('focus', () => {
            this.handleTextAreaFocus(textArea);
        });

        textArea.addEventListener('blur', () => {
            this.handleTextAreaBlur(textArea);
        });

        // 保存内容变化
        textArea.addEventListener('change', () => {
            this.saveTextAreaContent(textArea);
        });

        // 初始化内容
        this.loadTextAreaContent(textArea);
    }

    autoResizeTextArea(textArea) {
        textArea.style.height = 'auto';
        textArea.style.height = textArea.scrollHeight + 'px';
    }

    handleTextAreaFocus(textArea) {
        this.activeTextArea = textArea;
        textArea.style.borderColor = 'var(--primary-color)';
        textArea.style.boxShadow = 'var(--shadow-hover)';

        if (document.body.classList.contains('focus-mode')) {
            document.querySelector('.overlay').classList.add('active');
        }
    }

    handleTextAreaBlur(textArea) {
        this.activeTextArea = null;
        textArea.style.borderColor = 'var(--border-color)';
        textArea.style.boxShadow = 'var(--shadow)';

        if (document.body.classList.contains('focus-mode')) {
            document.querySelector('.overlay').classList.remove('active');
        }
    }

    toggleFocusMode() {
        const focusBtn = document.querySelector('#toggleFocus');
        const isFocusMode = document.body.classList.toggle('focus-mode');
        
        focusBtn.classList.toggle('active-mode');
        this.showNotification(`专注模式已${isFocusMode ? '开启' : '关闭'}`, 'info');
        this.saveSettings();
    }

    toggleAutoCenter() {
        const autoCenterBtn = document.querySelector('#toggleAutoCenter');
        const isAutoCenter = document.body.classList.toggle('auto-center');
        
        autoCenterBtn.classList.toggle('active-mode');
        this.showNotification(`自动居中已${isAutoCenter ? '开启' : '关闭'}`, 'info');
        this.saveSettings();
    }

    applyTextAreaStyles(textArea) {
        const theme = this.themes[this.currentTheme];
        const baseStyles = {
            width: '100%',
            minHeight: '80px',
            padding: theme.styles.textAreaPadding,
            borderRadius: theme.styles.borderRadius,
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-light)',
            color: 'var(--text-color)',
            transition: 'var(--transition)',
            boxShadow: 'var(--shadow)',
            fontFamily: 'inherit',
            fontSize: '16px',
            lineHeight: '1.6',
            resize: 'vertical',
            outline: 'none'
        };

        Object.assign(textArea.style, baseStyles);
    }

    initializeResizeObserver() {
        // 创建一个新的MutationObserver来监视DOM变化
        this.observer = new MutationObserver((mutations) => {
            let shouldReapplyLayout = false;
            
            // 检查是否有相关变化
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    // 如果添加了新节点
                    if (mutation.addedNodes.length > 0) {
                        // 检查是否添加了新的文本区域或章节
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) { // 元素节点
                                if (node.classList && 
                                    (node.classList.contains('text-area') || 
                                     node.classList.contains('chapter-container'))) {
                                    shouldReapplyLayout = true;
                                }
                                // 检查是否有文本区域的子节点
                                const textAreas = node.querySelectorAll ? 
                                    node.querySelectorAll('.text-area') : [];
                                if (textAreas.length > 0) {
                                    shouldReapplyLayout = true;
                                }
                            }
                        });
                    }
                }
            });
            
            // 如果有相关变化，重新应用布局
            if (shouldReapplyLayout && this.currentLayout) {
                // 延迟执行以确保DOM更新完成
                setTimeout(() => {
                    this.applyLayout(this.currentLayout);
                }, 100);
            }
        });
        
        // 开始观察整个文档的变化
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // 添加一个滚动事件处理器，记住居中布局的滚动位置
        window.addEventListener('scroll', this.debounce(() => {
            if (this.currentLayout === 'centered') {
                localStorage.setItem('centered-scroll-position', window.scrollY.toString());
            }
        }, 200));
    }
    
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }

    applyLayoutToChapters(chaptersContainer, layoutName) {
        const layout = this.layouts[layoutName];
        const chapterContainers = chaptersContainer.querySelectorAll('.chapter-container');
        
        chapterContainers.forEach(container => {
            // 清除之前的布局样式
            this.clearChapterContainerStyles(container);
            
            // 根据布局类型设置章节样式
            if (layoutName === 'grid') {
                container.style.gridColumn = '1 / -1'; // 章节占满整行
                container.style.display = 'grid';
                container.style.gridTemplateColumns = '1fr';
                container.style.gap = '10px';
            } 
            else if (layoutName === 'flex') {
                container.style.flex = '1 1 100%'; // 占满整行
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.gap = '10px';
            }
            else if (layoutName === 'masonry') {
                container.style.breakInside = 'avoid';
                container.style.pageBreakInside = 'avoid';
                container.style.width = '100%';
                container.style.marginBottom = '20px';
            }
            else if (layoutName === 'centered') {
                container.style.width = '100%';
                container.style.maxWidth = '1200px';
                container.style.margin = '0 auto 20px auto';
            }
            
            // 确保文本区域正确样式
            const textAreas = container.querySelectorAll('.text-area');
            textAreas.forEach(textArea => {
                // 清除文本区域样式
                this.clearTextAreaStyles(textArea);
                // 应用新样式
                Object.assign(textArea.style, layout.textAreaStyle);
                this.autoResizeTextArea(textArea);
            });
        });
    }
    
    clearChapterContainerStyles(container) {
        // 清除章节容器的布局相关样式
        const stylesToClear = [
            'display', 'gridColumn', 'gridTemplateColumns', 'flex',
            'flexDirection', 'breakInside', 'pageBreakInside',
            'width', 'maxWidth', 'margin', 'gap'
        ];
        
        stylesToClear.forEach(style => {
            container.style[style] = '';
        });
    }

    setupResizeHandler(layoutName) {
        // 移除旧的resize事件监听器
        window.removeEventListener('resize', this.resizeHandler);
        
        // 创建新的resize事件处理函数
        this.resizeHandler = () => {
            // 防抖处理
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                // 重新应用当前布局
                this.applyLayout(layoutName);
            }, 250);
        };
        
        // 添加resize事件监听器
        window.addEventListener('resize', this.resizeHandler);
    }

    applyTheme(themeName) {
        if (!this.themes[themeName]) return;

        const theme = this.themes[themeName];
        const root = document.documentElement;

        // 应用CSS变量
        Object.entries(theme.vars).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // 应用其他样式
        root.style.setProperty('--border-radius', theme.styles.borderRadius);
        root.style.setProperty('--transform-scale', theme.styles.transformScale);
        root.style.setProperty('--textarea-padding', theme.styles.textAreaPadding);

        // 更新文本区域样式
        this.textAreas.forEach(textArea => {
            this.applyTextAreaStyles(textArea);
        });

        this.currentTheme = themeName;
        this.saveSettings();
        
        // 更新主题按钮状态
        this.updateActiveButtons('theme-btn', themeName);

        this.showNotification(`主题已切换到: ${themeName}`, 'success');
    }

    applyLayout(layoutName) {
        if (!this.layouts[layoutName]) return;
        
        // 如果当前布局已经是目标布局，避免重复操作
        if (this.currentLayout === layoutName && document.body.dataset.currentLayout === layoutName) {
            return;
        }

        const layout = this.layouts[layoutName];
        const containers = document.querySelectorAll('.container');

        // 设置全局布局标记
        document.body.dataset.currentLayout = layoutName;
        
        // 移除其他布局类
        document.body.classList.remove('grid-layout', 'flex-layout', 'masonry-layout', 'centered-layout');
        // 添加当前布局类
        document.body.classList.add(`${layoutName}-layout`);

        containers.forEach(container => {
            // 清除先前布局的所有特殊样式
            this.clearPreviousLayoutStyles(container);
            
            // 应用新布局的样式
            Object.assign(container.style, layout.containerStyle);
            
            const textAreas = container.querySelectorAll('.text-area');
            textAreas.forEach(textArea => {
                // 清除文本区域的特殊样式
                this.clearTextAreaStyles(textArea);
                // 应用新布局的文本区域样式
                Object.assign(textArea.style, layout.textAreaStyle);
                this.autoResizeTextArea(textArea);
            });
            
            // 获取大纲和章节生成区域
            const outlineArea = document.getElementById('outline');
            const chapterTempArea = document.getElementById('chapter-temp-content');
            
            if (outlineArea && chapterTempArea) {
                // 清除大纲和章节区域的特殊样式
                this.clearSpecialAreaStyles(outlineArea);
                this.clearSpecialAreaStyles(chapterTempArea);
                
                // 特殊处理瀑布流布局
                if (layoutName === 'masonry') {
                    // 确保两个区域宽度相同
                    outlineArea.style.width = '100%';
                    chapterTempArea.style.width = '100%';
                    
                    // 确保它们的父容器也占据整列
                    const outlineParent = outlineArea.closest('div');
                    const chapterTempParent = chapterTempArea.closest('div');
                    
                    if (outlineParent && chapterTempParent) {
                        outlineParent.style.breakInside = 'avoid';
                        outlineParent.style.width = '100%';
                        chapterTempParent.style.breakInside = 'avoid';
                        chapterTempParent.style.width = '100%';
                    }
                    
                    // 应用响应式列数
                    if (layout.responsiveRules) {
                        const viewportWidth = window.innerWidth;
                        for (let i = 0; i < layout.responsiveRules.length; i++) {
                            const rule = layout.responsiveRules[i];
                            if (viewportWidth <= rule.breakpoint) {
                                container.style.columnCount = rule.columns;
                                break;
                            } else if (i === layout.responsiveRules.length - 1) {
                                // 最大断点，使用最多列
                                container.style.columnCount = rule.columns;
                            }
                        }
                    }
                }
                // 网格布局特殊处理
                else if (layoutName === 'grid') {
                    outlineArea.style.width = '100%';
                    chapterTempArea.style.width = '100%';
                    
                    // 确保大纲和章节生成区域的父容器占据相同宽度
                    const outlineParent = outlineArea.closest('div');
                    const chapterTempParent = chapterTempArea.closest('div');
                    
                    if (outlineParent && chapterTempParent) {
                        outlineParent.style.gridColumn = '1 / -1';
                        chapterTempParent.style.gridColumn = '1 / -1';
                    }
                    
                    // 响应式调整网格
                    const viewportWidth = window.innerWidth;
                    if (viewportWidth < 768) {
                        container.style.gridTemplateColumns = '1fr'; // 小屏幕单列
                    }
                }
                // 弹性布局特殊处理
                else if (layoutName === 'flex') {
                    outlineArea.style.width = '100%';
                    chapterTempArea.style.width = '100%';
                    
                    // 确保大纲和章节生成区域的父容器占据相同宽度
                    const outlineParent = outlineArea.closest('div');
                    const chapterTempParent = chapterTempArea.closest('div');
                    
                    if (outlineParent && chapterTempParent) {
                        outlineParent.style.flex = '1 1 100%';
                        chapterTempParent.style.flex = '1 1 100%';
                    }
                    
                    // 响应式调整
                    const viewportWidth = window.innerWidth;
                    if (viewportWidth < 768) {
                        // 小屏幕下增加基础大小
                        container.querySelectorAll('.text-area').forEach(el => {
                            el.style.flex = '1 1 100%';
                        });
                    }
                }
                // 居中布局特殊处理
                else if (layoutName === 'centered') {
                    outlineArea.style.width = '100%';
                    // 响应式宽度设置
                    const viewportWidth = window.innerWidth;
                    const maxWidth = viewportWidth < 768 ? '95%' : 
                                     viewportWidth < 1200 ? '80%' : '1200px';
                    
                    outlineArea.style.maxWidth = maxWidth;
                    chapterTempArea.style.width = '100%';
                    chapterTempArea.style.maxWidth = maxWidth;
                    
                    // 添加滚动位置记忆功能
                    const scrollPosition = localStorage.getItem('centered-scroll-position');
                    if (scrollPosition) {
                        setTimeout(() => {
                            window.scrollTo(0, parseInt(scrollPosition));
                        }, 100);
                    }
                }
            }
        });

        // 为章节容器特殊处理
        const chaptersContainer = document.getElementById('chapters');
        if (chaptersContainer) {
            this.applyLayoutToChapters(chaptersContainer, layoutName);
        }

        this.currentLayout = layoutName;
        this.saveSettings();
        
        // 重新绑定窗口大小变化事件
        this.setupResizeHandler(layoutName);
        
        // 更新布局按钮状态
        this.updateActiveButtons('layout-btn', layoutName);
        
        this.showNotification(`布局已切换到: ${layoutName}`, 'success');
    }

    updateActiveButtons(className, activeValue) {
        document.querySelectorAll(`.${className}`).forEach(btn => {
            btn.classList.remove('active-mode');
            if (btn.dataset.theme === activeValue || btn.dataset.layout === activeValue) {
                btn.classList.add('active-mode');
            }
        });
    }

    saveSettings() {
        const settings = {
            theme: this.currentTheme,
            layout: this.currentLayout,
            position: this.getSwitcherPosition(),
            focusMode: document.body.classList.contains('focus-mode'),
            autoCenter: document.body.classList.contains('auto-center'),
            animations: this.animationsEnabled
        };
        localStorage.setItem('theme-switcher-settings', JSON.stringify(settings));
    }

    loadSavedSettings() {
        const savedSettings = localStorage.getItem('theme-switcher-settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            // 应用主题和布局
            this.applyTheme(settings.theme);
            this.applyLayout(settings.layout);
            
            // 恢复位置
            this.restoreSwitcherPosition(settings.position);
            
            // 恢复模式设置
            if (settings.focusMode) document.body.classList.add('focus-mode');
            if (settings.autoCenter) document.body.classList.add('auto-center');
            
            // 恢复动画设置
            this.animationsEnabled = settings.animations ?? true;
            if (!this.animationsEnabled) {
                document.documentElement.style.setProperty('--transition', 'none');
            }

            // 更新按钮状态
            this.updateActiveButtons('theme-btn', settings.theme);
            this.updateActiveButtons('layout-btn', settings.layout);
        }
    }

    getSwitcherPosition() {
        const switcher = document.querySelector('.enhanced-theme-switcher');
        return {
            left: switcher.style.left || '20px',
            top: switcher.style.top || '20px'
        };
    }

    saveSwitcherPosition(element) {
        const position = {
            left: element.style.left,
            top: element.style.top
        };
        this.saveSettings();
    }

    restoreSwitcherPosition(position) {
        const switcher = document.querySelector('.enhanced-theme-switcher');
        if (switcher && position) {
            switcher.style.left = position.left;
            switcher.style.top = position.top;
        }
    }

    saveTextAreaContent(textArea) {
        const id = textArea.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
        if (!textArea.id) textArea.id = id;
        localStorage.setItem(`textarea-content-${id}`, textArea.value);
    }

    loadTextAreaContent(textArea) {
        const id = textArea.id;
        if (id) {
            const savedContent = localStorage.getItem(`textarea-content-${id}`);
            if (savedContent) {
                textArea.value = savedContent;
                this.autoResizeTextArea(textArea);
            }
        }
    }

    resetAllData() {
        if (confirm('确定要清除所有本地存储的数据吗？此操作不可撤销。')) {
            localStorage.clear();
            this.showNotification('所有数据已清除，页面将在3秒后刷新...', 'success');
            setTimeout(() => window.location.reload(), 3000);
        }
    }

    toggleAnimations() {
        const animationsBtn = document.querySelector('#toggleAnimations');
        this.animationsEnabled = !this.animationsEnabled;
        
        if (this.animationsEnabled) {
            document.documentElement.style.setProperty('--transition', this.themes[this.currentTheme].vars['--transition']);
            animationsBtn.classList.remove('active-mode');
        } else {
            document.documentElement.style.setProperty('--transition', 'none');
            animationsBtn.classList.add('active-mode');
        }
        
        this.saveSettings();
        this.showNotification(`动画效果已${this.animationsEnabled ? '开启' : '关闭'}`, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✓' : 'ℹ'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        if (!document.querySelector('.notification-container')) {
            const container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        const container = document.querySelector('.notification-container');
        container.appendChild(notification);

        // 添加通知样式
        if (!document.querySelector('#notification-styles')) {
            const notificationStyles = document.createElement('style');
            notificationStyles.id = 'notification-styles';
            notificationStyles.textContent = `
                .notification-container {
                    position: fixed !important;
                    top: 20px;
                    right: 20vw !important;
                    z-index: 10000;
                }

                .notification {
                    background: white;
                    border-radius: 8px;
                    box-shadow: var(--shadow);
                    margin-bottom: 10px;
                    transform-origin: top right;
                    animation: notificationSlide 0.3s ease, notificationFade 0.3s ease 2.7s;
                }

                .notification-content {
                    display: flex;
                    align-items: center;
                    padding: 12px 20px;
                    gap: 10px;
                }

                .notification-icon {
                    color: var(--primary-color);
                    font-weight: bold;
                }

                .notification-message {
                    color: var(--text-color);
                }

                @keyframes notificationSlide {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                @keyframes notificationFade {
                    to { opacity: 0; transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(notificationStyles);
        }

        setTimeout(() => notification.remove(), 3000);
    }

    clearPreviousLayoutStyles(container) {
        // 清除容器的布局相关样式
        const stylesToClear = [
            'display', 'gridTemplateColumns', 'flexDirection', 'flexWrap',
            'alignItems', 'justifyContent', 'columnCount', 'columnWidth',
            'gap', 'padding'
        ];
        
        stylesToClear.forEach(style => {
            container.style[style] = '';
        });
    }
    
    clearTextAreaStyles(textArea) {
        // 清除文本区域的布局相关样式
        const stylesToClear = [
            'width', 'maxWidth', 'height', 'minHeight', 'maxHeight',
            'flex', 'breakInside', 'marginBottom'
        ];
        
        stylesToClear.forEach(style => {
            textArea.style[style] = '';
        });
    }
    
    clearSpecialAreaStyles(element) {
        if (!element) return;
        
        // 清除特殊区域的布局相关样式
        const stylesToClear = [
            'width', 'maxWidth', 'margin', 'padding', 'breakInside'
        ];
        
        stylesToClear.forEach(style => {
            element.style[style] = '';
        });
        
        // 清除父元素的特殊样式
        const parent = element.closest('div');
        if (parent) {
            const parentStylesToClear = [
                'gridColumn', 'flex', 'breakInside', 'width', 'maxWidth'
            ];
            
            parentStylesToClear.forEach(style => {
                parent.style[style] = '';
            });
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const styleSwitcher = new EnhancedStyleSwitcher();
});