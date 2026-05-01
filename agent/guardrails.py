BLACKLIST = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",  # 已知问题地址
]
CONFIRM_THRESHOLD_ETH = 0.01  # 超过这个金额需要二次确认

def check(to: str, amount_eth: float) -> tuple[bool, str]:
    # 返回 (allowed, reason)
    # TODO 1: 检查 to 是否在黑名单（大小写不敏感）
    if to.lower() in [addr.lower() for addr in BLACKLIST]:
        return (False, "Recipient address is blacklisted.")
    # TODO 2: 超过阈值则 input("Confirm? yes/no") 让用户确认
    if amount_eth > CONFIRM_THRESHOLD_ETH:
        confirmation = input(f"Amount {amount_eth} ETH exceeds threshold. Confirm? (yes/no) > ")
        if confirmation.lower() != "yes":
            return (False, "User did not confirm the transaction.")
    return (True, "ok")
    # 通过返回 (True, "ok")，拒绝返回 (False, "原因")