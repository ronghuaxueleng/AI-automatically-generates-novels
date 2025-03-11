import google.generativeai as genai
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

# 设置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# 可选的代理设置
os.environ['HTTPS_PROXY'] = 'http://127.0.0.1:9910'
os.environ['HTTP_PROXY'] = 'http://127.0.0.1:9910'

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

def trigger_smart_placement():
    try:
        us_urls = [
            'https://www.google.com',
            'https://cloud.google.com',
            'https://ai.google.dev'
        ]
        
        for url in us_urls:
            try:
                start_time = time.time()
                response = requests.get(url, timeout=5, verify=False)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    token_stats.record_call(success=True, response_time=response_time)
                    logger.info(f"Successfully connected to {url}")
                    time.sleep(1)
                    return True
                else:
                    token_stats.record_call(success=False, response_time=response_time)
            except Exception as e:
                logger.warning(f"Failed to connect to {url}: {str(e)}")
                token_stats.record_call(success=False, response_time=5000)
                continue
                
        return False
    except Exception as e:
        logger.error(f"Error in trigger_smart_placement: {str(e)}")
        return False

# 从统一配置文件获取API密钥
def get_api_key():
    try:
        config_file = 'api/config.json'
        if os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
                api_keys = config.get('api_keys', {})
                if 'gemini' in api_keys:
                    return api_keys['gemini']
        
        # 默认API密钥
        return "AIzaSyBezSvi2MQ-vnVol-Aby_fCgn3eY-PIhTU"
    except Exception as e:
        logger.error(f"获取API密钥失败: {str(e)}")
        return "AIzaSyBezSvi2MQ-vnVol-Aby_fCgn3eY-PIhTU"

# 初始化API
def init_api():
    try:
        api_key = get_api_key()
        genai.configure(api_key=api_key)
        
        if not trigger_smart_placement():
            logger.warning("Failed to trigger smart-placement")
        
        start_time = time.time()
        models = genai.list_models()
        response_time = (time.time() - start_time) * 1000
        
        token_stats.record_call(success=True, response_time=response_time)
        logger.info(f"Available models: {[model.name for model in models]}")
        return True
    except Exception as e:
        logger.error(f"Error during API initialization: {str(e)}")
        token_stats.record_call(success=False, response_time=5000)
        return False

# 测试API连接
def test_api_connection(api_key=None):
    try:
        if api_key is None:
            api_key = get_api_key()
        
        genai.configure(api_key=api_key)
        
        start_time = time.time()
        models = genai.list_models()
        response_time = (time.time() - start_time) * 1000
        
        model_names = [model.name for model in models]
        return {
            'success': True,
            'message': f"连接成功！可用模型: {', '.join(model_names[:3])}{'...' if len(model_names) > 3 else ''}",
            'response_time': response_time
        }
    except Exception as e:
        logger.error(f"API连接测试失败: {str(e)}")
        return {
            'success': False,
            'message': str(e)
        }

# 生成内容
def generate_content(prompt, stream=True):
    try:
        api_key = get_api_key()
        genai.configure(api_key=api_key)
        
        model = genai.GenerativeModel('gemini-exp-1206')
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                top_p=0.95,
                max_output_tokens=4096
            ),
            stream=stream
        )
        
        return response
    except Exception as e:
        logger.error(f"生成内容失败: {str(e)}")
        raise

# 获取API信息
def get_api_info():
    return {
        "name": "Google Gemini",
        "version": "gemini-exp-1206",
        "provider": "Google",
        "status": token_stats.to_dict()
    }

# 初始化API
init_api() 