from flask import Flask, request, Response, render_template, jsonify
import json
import logging
import os
import requests
import urllib3
import time
import sys
import traceback
from datetime import datetime, timedelta
from collections import deque
import re
import importlib.util
import shutil

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class TokenStats:
    def __init__(self):
        self.total_tokens = 1000000
        self.remaining_tokens = 1000000
        self.daily_limit = 10000
        self.monthly_limit = 200000
        self.today_calls = 0
        self.month_calls = 0
        self.last_call_time = None
        self.response_times = deque(maxlen=100)
        self.success_count = 0
        self.total_count = 0
        self.token_usages = deque(maxlen=100)
        self.last_reset_day = datetime.now().day
        self.last_reset_month = datetime.now().month

    def reset_daily(self):
        current_day = datetime.now().day
        if current_day != self.last_reset_day:
            self.today_calls = 0
            self.last_reset_day = current_day

    def reset_monthly(self):
        current_month = datetime.now().month
        if current_month != self.last_reset_month:
            self.month_calls = 0
            self.last_reset_month = current_month

    def record_call(self, success=True, response_time=0, tokens_used=0):
        self.reset_daily()
        self.reset_monthly()
        
        self.last_call_time = datetime.now()
        self.today_calls += 1
        self.month_calls += 1
        self.total_count += 1
        
        if success:
            self.success_count += 1
        
        self.response_times.append(response_time)
        if tokens_used > 0:
            self.token_usages.append(tokens_used)
            self.remaining_tokens = max(0, self.remaining_tokens - tokens_used)

    @property
    def avg_response_time(self):
        return sum(self.response_times) / len(self.response_times) if self.response_times else 0

    @property
    def success_rate(self):
        return self.success_count / self.total_count if self.total_count > 0 else 1.0

    @property
    def avg_token_usage(self):
        return int(sum(self.token_usages) / len(self.token_usages)) if self.token_usages else 0

    def to_dict(self):
        return {
            "remaining_tokens": self.remaining_tokens,
            "total_tokens": self.total_tokens,
            "today_calls": self.today_calls,
            "daily_limit": self.daily_limit,
            "month_calls": self.month_calls,
            "monthly_limit": self.monthly_limit,
            "last_call_time": self.last_call_time.isoformat() if self.last_call_time else None,
            "avg_response_time": self.avg_response_time,
            "success_rate": self.success_rate,
            "avg_token_usage": self.avg_token_usage
        }

token_stats = TokenStats()

# 当前选择的API模型
current_api_model = None
api_module = None

# 初始化API，不再自动连接
def init_api(model_name=None):
    global current_api_model, api_module
    
    if model_name is None:
        # 从配置文件中读取当前选择的API模型
        try:
            with open('api/config.json', 'r', encoding='utf-8') as f:
                config = json.load(f)
                model_name = config.get('current_model', 'gemini')
        except Exception as e:
            app.logger.error(f"读取API配置失败: {str(e)}")
            model_name = 'gemini'
    
    # 如果当前模型已经加载，且与请求的模型相同，则不重新加载
    if current_api_model == model_name and api_module is not None:
        return api_module
    
    # 加载指定的API模块
    try:
        # 尝试加载没有"app-"前缀的模块文件
        module_path = f'api/{model_name}.py'
        if not os.path.exists(module_path):
            # 如果没有找到，尝试加载带有"app-"前缀的模块文件（向后兼容）
            module_path = f'api/app-{model_name}.py'
            if not os.path.exists(module_path):
                app.logger.error(f"API模块文件不存在: {module_path}")
                return None
        
        # 动态加载模块
        spec = importlib.util.spec_from_file_location(f"api_{model_name}", module_path)
        api_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(api_module)
        
        current_api_model = model_name
        app.logger.info(f"成功加载API模块: {model_name}")
        return api_module
    except Exception as e:
        app.logger.error(f"加载API模块失败: {str(e)}")
        traceback.print_exc()
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/gen', methods=['POST'])
def generate():
    data = request.json
    prompt = data.get('prompt', '')
    app.logger.debug(f"Received prompt for gen: {prompt}")
    
    def generate_stream():
        max_retries = 5
        retry_count = 0
        retry_delay = 1
        
        # 加载当前选择的API模块
        api_module = init_api()
        if api_module is None:
            yield "API模块加载失败，请检查API配置。"
            return
        
        while retry_count < max_retries:
            try:
                start_time = time.time()
                
                # 使用API模块的generate_content函数
                response = api_module.generate_content(prompt, stream=True)
                
                total_tokens = 0
                for chunk in response:
                    if hasattr(chunk, 'text') and chunk.text:
                        app.logger.debug(f"Yielding chunk: {chunk.text}")
                        total_tokens += len(chunk.text.split())
                        yield chunk.text
                
                response_time = (time.time() - start_time) * 1000
                token_stats.record_call(success=True, response_time=response_time, tokens_used=total_tokens)
                break
                        
            except Exception as e:
                retry_count += 1
                error_msg = f"Error in generate (attempt {retry_count}/{max_retries}): {str(e)}"
                app.logger.error(error_msg)
                token_stats.record_call(success=False, response_time=5000)
                
                if retry_count >= max_retries:
                    yield f"生成失败（已重试{retry_count}次）。错误信息：{str(e)}\n建议：\n1. 请稍后重试\n2. 尝试简化或修改提示词\n3. 如果问题持续，请联系管理员"
                else:
                    retry_delay = min(retry_delay * 2, 8)
                    time.sleep(retry_delay)
                    yield f"正在重试 ({retry_count}/{max_retries})...\n"
                    continue
    
    return Response(generate_stream(), mimetype='text/plain')

@app.route('/gen2', methods=['POST'])
def generate2():
    data = request.json
    prompt = data.get('prompt', '')
    app.logger.debug(f"Received prompt for gen2: {prompt}")
    
    def generate_stream():
        max_retries = 5
        retry_count = 0
        retry_delay = 1
        
        # 加载当前选择的API模块
        api_module = init_api()
        if api_module is None:
            yield "API模块加载失败，请检查API配置。"
            return
        
        while retry_count < max_retries:
            try:
                start_time = time.time()
                
                # 使用API模块的generate_content函数
                response = api_module.generate_content(prompt, stream=True)
                
                total_tokens = 0
                for chunk in response:
                    if hasattr(chunk, 'text') and chunk.text:
                        app.logger.debug(f"Yielding chunk: {chunk.text}")
                        total_tokens += len(chunk.text.split())
                        yield chunk.text
                
                response_time = (time.time() - start_time) * 1000
                token_stats.record_call(success=True, response_time=response_time, tokens_used=total_tokens)
                break
                        
            except Exception as e:
                retry_count += 1
                error_msg = f"Error in generate2 (attempt {retry_count}/{max_retries}): {str(e)}"
                app.logger.error(error_msg)
                token_stats.record_call(success=False, response_time=5000)
                
                if retry_count >= max_retries:
                    yield f"生成失败（已重试{retry_count}次）。错误信息：{str(e)}\n建议：\n1. 请稍后重试\n2. 尝试简化或修改提示词\n3. 如果问题持续，请联系管理员"
                else:
                    retry_delay = min(retry_delay * 2, 8)
                    time.sleep(retry_delay)
                    yield f"正在重试 ({retry_count}/{max_retries})...\n"
                    continue
    
    return Response(generate_stream(), mimetype='text/plain')

@app.route('/api-info')
def api_info():
    try:
        # 加载当前选择的API模块
        api_module = init_api()
        if api_module is None:
            return jsonify({
                "error": "API模块加载失败，请检查API配置。"
            }), 500
        
        # 使用API模块的get_api_info函数
        if hasattr(api_module, 'get_api_info'):
            info = api_module.get_api_info()
        else:
            # 如果模块没有get_api_info函数，则返回基本信息
            info = {
                "name": current_api_model,
                "status": "已加载，但无法获取详细信息"
            }
        
        return Response(
            json.dumps(info, indent=2, ensure_ascii=False),
            mimetype='application/json'
        )
        
    except Exception as e:
        error_info = {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        return Response(
            json.dumps(error_info, indent=2, ensure_ascii=False),
            status=500,
            mimetype='application/json'
        )

@app.route('/api-dashboard')
def api_dashboard():
    return render_template('api-info.html')

@app.route('/save-outline', methods=['POST'])
def save_outline():
    try:
        data = request.get_json()
        outline_text = data.get('outline', '')
        if not os.path.exists('data'):
            os.makedirs('data')
        with open('data/outline.txt', 'w', encoding='utf-8') as f:
            f.write(outline_text)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'failed', 'message': str(e)}), 500

@app.route('/load-outline', methods=['GET'])
def load_outline():
    try:
        if not os.path.exists('data/outline.txt'):
            return jsonify({'outline': ''})
        with open('data/outline.txt', 'r', encoding='utf-8') as f:
            outline_text = f.read()
        return jsonify({'outline': outline_text})
    except Exception as e:
        return jsonify({'outline': '', 'message': str(e)}), 500

# 保存章节细纲接口
@app.route('/save-detailed-outline', methods=['POST'])
def save_detailed_outline():
    try:
        data = request.get_json()
        detailed_outline = data.get('detailed_outline', '')
        if not os.path.exists('data'):
            os.makedirs('data')
        file_path = os.path.join('data', 'detailed-outline.txt')
        delimiter = "##【章节分隔符】"
        # 分割新章节
        new_chapters = [chap.strip() for chap in detailed_outline.split(delimiter) if chap.strip()]
        app.logger.debug("New chapters raw: %s", new_chapters)
        # 使用宽容的正则表达式匹配章节标记，匹配例如 '第一章' 或 '第  1 章'
        pattern = re.compile(r'第\s*(\S+?)\s*章')
        new_chapter_numbers = set()
        for chap in new_chapters:
            m = pattern.search(chap)
            if m:
                new_chapter_numbers.add("第" + m.group(1) + "章")
            else:
                app.logger.debug("No match in new chapter: %s", chap)
        app.logger.debug("New chapter numbers: %s", new_chapter_numbers)
        
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                existing_content = f.read()
            existing_chapters = [chap.strip() for chap in existing_content.split(delimiter) if chap.strip()]
            app.logger.debug("Existing chapters raw: %s", existing_chapters)
            existing_chapter_numbers = set()
            for chap in existing_chapters:
                m = pattern.search(chap)
                if m:
                    existing_chapter_numbers.add("第" + m.group(1) + "章")
                else:
                    app.logger.debug("No match in existing chapter: %s", chap)
            # 检查是否存在相同章节编号
            conflict = new_chapter_numbers & existing_chapter_numbers
            if conflict:
                conflict_str = ', '.join(conflict)
                return jsonify({'status': 'failed', 'message': f'{conflict_str} 已存在，请检查文件内容！'})
            # 没有冲突则追加新章节
            with open(file_path, 'a', encoding='utf-8') as f:
                if existing_content.strip():
                    f.write("\n" + delimiter + "\n" + detailed_outline)
                else:
                    f.write(detailed_outline)
        else:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(detailed_outline)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'failed', 'message': str(e)}), 500

# 加载章节细纲接口
@app.route('/load-detailed-outline', methods=['GET'])
def load_detailed_outline():
    try:
        file_path = os.path.join('data', 'detailed-outline.txt')
        if not os.path.exists(file_path):
            return jsonify({'detailed_outline': ''})
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return jsonify({'detailed_outline': content})
    except Exception as e:
        return jsonify({'detailed_outline': '', 'message': str(e)}), 500

# 添加API配置相关的路由
@app.route('/api/get-api-key', methods=['GET'])
def get_api_key():
    model = request.args.get('model', 'gemini')
    
    try:
        # 检查统一的配置文件是否存在
        config_file = 'api/config.json'
        if os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
                api_keys = config.get('api_keys', {})
                if model in api_keys:
                    return jsonify({
                        'success': True,
                        'api_key': api_keys.get(model, '')
                    })
        
        return jsonify({
            'success': True,
            'api_key': ''
        })
    except Exception as e:
        app.logger.error(f"获取API密钥失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/api/save-api-config', methods=['POST'])
def save_api_config():
    data = request.json
    model = data.get('model')
    api_key = data.get('api_key')
    
    if not model:
        return jsonify({
            'success': False,
            'message': '缺少模型参数'
        })
    
    try:
        # 读取现有的配置文件
        config_file = 'api/config.json'
        config = {}
        if os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
        
        # 更新配置
        config['current_model'] = model
        
        # 确保api_keys字段存在
        if 'api_keys' not in config:
            config['api_keys'] = {}
        
        # 更新API密钥
        config['api_keys'][model] = api_key
        
        # 保存配置
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        
        # 重新初始化API
        init_api(model)
        
        return jsonify({
            'success': True
        })
    except Exception as e:
        app.logger.error(f"保存API配置失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/test-connection', methods=['POST'])
def test_connection():
    data = request.json
    model = data.get('model')
    api_key = data.get('api_key')
    
    if not model:
        return jsonify({
            'success': False,
            'message': '缺少模型参数'
        })
    
    try:
        # 临时保存API配置
        temp_config_file = f'api/{model}_temp_config.json'
        with open(temp_config_file, 'w', encoding='utf-8') as f:
            json.dump({
                'API_KEY': api_key
            }, f, ensure_ascii=False, indent=2)
        
        # 尝试加载API模块
        # 首先尝试没有"app-"前缀的模块文件
        module_path = f'api/{model}.py'
        if not os.path.exists(module_path):
            # 如果没有找到，尝试带有"app-"前缀的模块文件
            module_path = f'api/app-{model}.py'
            if not os.path.exists(module_path):
                return jsonify({
                    'success': False,
                    'message': f'API模块文件不存在: {module_path}'
                })
        
        # 动态加载模块
        spec = importlib.util.spec_from_file_location(f"api_{model}_test", module_path)
        test_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(test_module)
        
        # 尝试初始化API
        if hasattr(test_module, 'test_api_connection'):
            result = test_module.test_api_connection(api_key)
            if result.get('success'):
                # 测试成功，删除临时配置文件
                os.remove(temp_config_file)
                return jsonify(result)
            else:
                return jsonify(result)
        else:
            # 如果模块没有测试函数，则假设连接成功
            return jsonify({
                'success': True,
                'message': '模块加载成功，但无法测试连接'
            })
    except Exception as e:
        app.logger.error(f"测试API连接失败: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': str(e)
        })

# 记忆管理器API路由
@app.route('/save-memories', methods=['POST'])
def save_memories():
    try:
        data = request.get_json()
        memories = data.get('memories', {})
        
        if not os.path.exists('data'):
            os.makedirs('data')
            
        # 保存记忆数据到文件
        with open('data/memories.json', 'w', encoding='utf-8') as f:
            json.dump(memories, f, ensure_ascii=False, indent=2)
            
        return jsonify({
            'success': True,
            'message': '记忆数据保存成功'
        })
    except Exception as e:
        app.logger.error(f"保存记忆数据失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'保存记忆数据失败: {str(e)}'
        }), 500

@app.route('/load-memories', methods=['GET'])
def load_memories():
    try:
        file_path = 'data/memories.json'
        
        if not os.path.exists(file_path):
            return jsonify({
                'success': True,
                'memories': {}
            })
            
        # 从文件加载记忆数据
        with open(file_path, 'r', encoding='utf-8') as f:
            memories = json.load(f)
            
        return jsonify({
            'success': True,
            'memories': memories
        })
    except Exception as e:
        app.logger.error(f"加载记忆数据失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'加载记忆数据失败: {str(e)}'
        }), 500

@app.route('/summarize-text', methods=['POST'])
def summarize_text():
    try:
        data = request.get_json()
        text = data.get('text', '')
        max_length = data.get('max_length', 500)
        
        if not text:
            return jsonify({
                'success': False,
                'message': '文本内容为空'
            })
        
        # 加载当前选择的API模块
        api_module = init_api()
        if api_module is None:
            return jsonify({
                'success': False,
                'message': 'API模块加载失败，请检查API配置'
            })
        
        # 构建提示词
        prompt = f"""请对以下文本进行总结，保留关键情节和重要信息，总结后的长度不超过{max_length}个字符：

{text}

总结："""
        
        # 调用API生成总结
        response = api_module.generate_content(prompt)
        summary = response.text if hasattr(response, 'text') else str(response)
        
        return jsonify({
            'success': True,
            'summary': summary
        })
    except Exception as e:
        app.logger.error(f"文本总结失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'文本总结失败: {str(e)}'
        }), 500

# 确保API配置目录存在
if not os.path.exists('api'):
    os.makedirs('api')

# 确保API配置文件存在
if not os.path.exists('api/config.json'):
    with open('api/config.json', 'w', encoding='utf-8') as f:
        json.dump({
            'current_model': 'gemini',
            'api_keys': {}
        }, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    app.run(debug=True, port=60001, host="0.0.0.0") 