// api-config.js - API配置功能

// 添加API配置按钮到顶部操作栏
function addApiConfigButton() {
    // 等待DOM加载完成
    setTimeout(() => {
        // 查找bookinfo.js创建的顶部操作栏
        let topBar = document.querySelector('.top-bar');
        if (topBar) {
            // 如果顶部操作栏存在，直接添加按钮
            const apiConfigButton = document.createElement('button');
            apiConfigButton.textContent = 'API配置';
            apiConfigButton.onclick = showApiConfig;
            apiConfigButton.style = 'background-color: #1e90ff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;';
            
            // 将API配置按钮添加到顶部操作栏的最前面
            topBar.insertBefore(apiConfigButton, topBar.firstChild);
        } else {
            // 如果顶部操作栏不存在，创建一个新的
            topBar = document.createElement('div');
            topBar.className = 'top-bar';
            topBar.style = 'position: fixed; top: 0; left: 0; right: 0; background: white; padding: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 1000; display: flex; gap: 10px;';
            
            const apiConfigButton = document.createElement('button');
            apiConfigButton.textContent = 'API配置';
            apiConfigButton.onclick = showApiConfig;
            apiConfigButton.style = 'background-color: #1e90ff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;';
            
            topBar.appendChild(apiConfigButton);
            document.body.prepend(topBar);
            
            // 调整顶部操作栏的样式，增加上边距，避免遮挡内容
            document.body.style.marginTop = '50px';
        }

        // 创建API配置模态窗口
        if (!document.getElementById('apiConfigModal')) {
            const modalHtml = `
            <div id="apiConfigModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1001;">
                <div class="modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; width: 80%; max-width: 800px; max-height: 90vh; overflow-y: auto;">
                    <span class="close" onclick="closeApiConfigModal()" style="position: absolute; right: 20px; top: 20px; cursor: pointer;">&times;</span>
                    <div id="apiConfigModalContent"></div>
                </div>
            </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
    }, 500); // 延迟500毫秒，确保bookinfo.js已经加载
}

// 显示API配置模态窗口
function showApiConfig() {
    const apiModels = [
        { id: 'gemini', name: 'Google Gemini', file: 'gemini.py' },
        { id: 'chatgpt', name: 'OpenAI ChatGPT', file: 'chatgpt.py' },
        { id: 'claude', name: 'Anthropic Claude', file: 'claude.py' },
        { id: 'doubao', name: '豆包', file: 'doubao.py' },
        { id: 'tongyiqianwen', name: '通义千问', file: 'tongyiqianwen.py' },
        { id: 'deepseek', name: 'DeepSeek', file: 'deepseek.py' },
        { id: 'ollama', name: 'Ollama', file: 'ollama.py' },
        { id: 'wenxinyiyang', name: '文心一言', file: 'wenxinyiyang.py' }
    ];

    // 获取当前选择的API模型
    const currentApiModel = localStorage.getItem('selectedApiModel') || 'gemini';

    // 构建API配置内容
    let configHtml = `
    <div class="api-config-panel">
        <h3>API配置</h3>
        <div class="mb-4">
            <label>选择大模型</label>
            <select id="apiModelSelector" class="text-area" onchange="updateApiKeyField()">
                ${apiModels.map(model => `<option value="${model.id}" ${model.id === currentApiModel ? 'selected' : ''}>${model.name}</option>`).join('')}
            </select>
        </div>
        
        <div class="mb-4">
            <label>API密钥</label>
            <input type="text" id="apiKey" class="text-area" placeholder="请输入API密钥" style="width: 100%; box-sizing: border-box;" />
        </div>
        
        <div class="button-group">
            <button onclick="saveApiConfig()">保存配置</button>
            <button onclick="testApiConnection()">测试连接</button>
        </div>
        
        <div id="apiTestResult" class="mt-4" style="display: none;"></div>
    </div>
    `;

    // 显示模态窗口
    document.getElementById('apiConfigModalContent').innerHTML = configHtml;
    document.getElementById('apiConfigModal').style.display = 'block';
    
    // 加载当前API密钥
    loadApiKey();
}

// 更新API密钥输入框
function updateApiKeyField() {
    loadApiKey();
}

// 加载API密钥
async function loadApiKey() {
    const selectedModel = document.getElementById('apiModelSelector').value;
    const apiKeyField = document.getElementById('apiKey');
    
    try {
        const response = await fetch(`/api/get-api-key?model=${selectedModel}`);
        const data = await response.json();
        
        if (data.success) {
            apiKeyField.value = data.api_key || '';
        } else {
            apiKeyField.value = '';
        }
    } catch (error) {
        console.error('加载API密钥失败:', error);
        apiKeyField.value = '';
    }
}

// 保存API配置
async function saveApiConfig() {
    const selectedModel = document.getElementById('apiModelSelector').value;
    const apiKey = document.getElementById('apiKey').value.trim();
    
    try {
        const response = await fetch('/api/save-api-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: selectedModel,
                api_key: apiKey
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 保存成功，更新本地存储
            localStorage.setItem('selectedApiModel', selectedModel);
            alert('API配置保存成功！');
            closeApiConfigModal();
        } else {
            alert(`保存失败: ${data.message}`);
        }
    } catch (error) {
        console.error('保存API配置失败:', error);
        alert('保存API配置失败，请检查网络连接或服务器状态。');
    }
}

// 测试API连接
async function testApiConnection() {
    const selectedModel = document.getElementById('apiModelSelector').value;
    const apiKey = document.getElementById('apiKey').value.trim();
    
    const resultDiv = document.getElementById('apiTestResult');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p>正在测试连接，请稍候...</p>';
    
    try {
        const response = await fetch('/api/test-connection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: selectedModel,
                api_key: apiKey
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultDiv.innerHTML = `<p style="color: green;">连接成功！${data.message || ''}</p>`;
        } else {
            resultDiv.innerHTML = `<p style="color: red;">连接失败: ${data.message || '未知错误'}</p>`;
        }
    } catch (error) {
        console.error('测试API连接失败:', error);
        resultDiv.innerHTML = '<p style="color: red;">测试连接失败，请检查网络连接或服务器状态。</p>';
    }
}

// 显示模态窗口
function showModal(id) {
    document.getElementById(id).style.display = 'block';
}

// 关闭模态窗口
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// 确保我们的closeModal函数不会与bookinfo.js的closeModal函数冲突
window.closeApiConfigModal = function() {
    document.getElementById('apiConfigModal').style.display = 'none';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 添加API配置按钮
    addApiConfigButton();
}); 