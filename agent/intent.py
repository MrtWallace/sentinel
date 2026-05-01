# Sentinel Agent — main entry point
# Phase 3 will implement the actual agent loop

from openai import OpenAI
from dotenv import load_dotenv
import os, json

load_dotenv()

def parse_intent(user_input: str) -> dict:
    client = OpenAI(
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        base_url="https://api.deepseek.com"
    )
    # TODO: 调用 client.chat.completions.create()
    # model="deepseek-chat"
    # messages 里放 system prompt 和 user_input
    # 返回 json.loads(response的文本内容)
    system_prompt = """你是一个区块链交易解析器。从用户输入中提取：action、to地址、amount。只输出 JSON，格式为：{"action": "transfer", "to": "0x...", "amount_eth": 0.001} 如果无法识别，输出：{"action": "unknown"} 不要输出任何其他文字。"""
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input}
        ]
    )
    return json.loads(response.choices[0].message.content)

if __name__ == "__main__":
    result = parse_intent("Send 0.001 ETH to 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    print(result)
