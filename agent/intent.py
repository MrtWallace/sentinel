# Sentinel Agent — main entry point
# Phase 3 will implement the actual agent loop

from openai import OpenAI
from dotenv import load_dotenv
import os, json, re, time
from datetime import datetime


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
    system_prompt = """你是一个区块链交易解析器。从用户输入中提取：action、to地址、amount。只输出 JSON，格式为：{"action": "transfer", "to": "0x...", "amount_eth": 0.001}, 如果无法识别，输出：{"action": "unknown"}, 如果 amount 不是具体数字，或者 to 地址缺失，必须返回 {"action": "unknown"}, 新增支持 swap：{"action": "swap", "from_token": "...", "from_amount": ..., "to_token": "..."},不要输出其他任何文字"""
    start = time.time()
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input}
        ]
    )
    latency = time.time() - start
    _log(user_input, latency, response.usage)
    content = response.choices[0].message.content.strip()
    # 提取花括号内的 JSON，去掉可能的 markdown 包装
    match = re.search(r'\{.*\}', content, re.DOTALL)
    if match:
        result = json.loads(match.group())
        # Python 层强制校验：transfer 必须有 to 和 amount_eth
        if result.get("action") == "transfer":
            if not result.get("to") or not result.get("amount_eth"):
                return {"action": "unknown"}
        return result
    return {"action": "unknown"}
    
def _log(user_input, latency, usage):
    os.makedirs("logs", exist_ok=True)
    entry = {
        "timestamp": datetime.now().isoformat(),
        "latency_s": round(latency, 3),
        "input_tokens": usage.prompt_tokens,
        "output_tokens": usage.completion_tokens,
        "est_cost_usd": round((usage.prompt_tokens * 0.14 + usage.completion_tokens * 0.28) / 1_000_000, 6)
    }
    with open("logs/cost_log.jsonl", "a") as f:
        f.write(json.dumps(entry) + "\n")

if __name__ == "__main__":
    result = parse_intent("Send 0.001 ETH to 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    print(result)
