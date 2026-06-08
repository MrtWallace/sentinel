"""
Swap calldata encoder for Sentinel.

Encodes Uniswap V3 exactInputSingle calldata for CAW contract_call.
Uses deterministic encoding (no web3 dependency) for demo stability.
"""

from decimal import Decimal
from typing import Optional


# Uniswap V3 SwapRouter on Sepolia
UNISWAP_V3_ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"

# Common Sepolia token addresses
SEPOLIA_TOKENS = {
    "ETH": "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",   # WETH
    "WETH": "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    "USDC": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    "USDT": "0xaA8E23FB1079EA71e0a56F48a2aA51851D8433D0",
}

# Uniswap V3 fee tiers
FEE_TIERS = {
    ("ETH", "USDC"): 3000,   # 0.3%
    ("WETH", "USDC"): 3000,
    ("ETH", "USDT"): 3000,
    ("WETH", "USDT"): 3000,
    ("USDC", "USDT"): 100,   # 0.01% for stable pairs
    ("USDC", "ETH"): 3000,
    ("USDC", "WETH"): 3000,
}

# exactInputSingle function selector
# function exactInputSingle(ExactInputSingleParams calldata params)
EXACT_INPUT_SINGLE_SELECTOR = "0x414bf389"


def encode_swap_calldata(
    from_token: str,
    to_token: str,
    amount_wei: int,
    recipient: str,
    slippage_bps: int = 300,  # 3% default
    deadline_seconds: int = 300,
) -> tuple[str, str]:
    """
    Encode Uniswap V3 exactInputSingle calldata.

    Returns:
        (calldata_hex, value_wei_hex)
        value_wei_hex is non-zero only for ETH→Token swaps (msg.value)
    """
    from_token = from_token.upper()
    to_token = to_token.upper()

    token_in = _resolve_token(from_token)
    token_out = _resolve_token(to_token)
    fee = _get_fee(from_token, to_token)

    # Calculate minimum output with slippage
    # For demo, use a conservative estimate (1 ETH = 2000 USDC)
    estimated_output = _estimate_output(from_token, to_token, amount_wei)
    min_output = estimated_output * (10000 - slippage_bps) // 10000

    # Encode ExactInputSingleParams tuple:
    # (address tokenIn, address tokenOut, uint24 fee, address recipient,
    #  uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)
    params = _encode_params(
        token_in=token_in,
        token_out=token_out,
        fee=fee,
        recipient=recipient,
        deadline=deadline_seconds,
        amount_in=amount_wei,
        amount_out_min=max(min_output, 1),  # at least 1 wei
        sqrt_price_limit=0,
    )

    calldata = EXACT_INPUT_SINGLE_SELECTOR + params

    # ETH→Token requires msg.value; Token→Token value is 0
    value = amount_wei if from_token in ("ETH", "WETH") else 0

    return calldata, _int_to_hex(value)


def _resolve_token(symbol: str) -> str:
    """Resolve token symbol to address."""
    addr = SEPOLIA_TOKENS.get(symbol.upper())
    if not addr:
        raise ValueError(f"Unknown token: {symbol}")
    return addr.lower().replace("0x", "")


def _get_fee(from_token: str, to_token: str) -> int:
    """Get Uniswap V3 fee tier for token pair."""
    return FEE_TIERS.get((from_token.upper(), to_token.upper()), 3000)


def _estimate_output(from_token: str, to_token: str, amount_wei: int) -> int:
    """Estimate output amount for demo purposes."""
    # Simplified: 1 ETH = 2000 USDC
    eth_usdc_rate = 2000

    if from_token in ("ETH", "WETH") and to_token == "USDC":
        return amount_wei * eth_usdc_rate
    elif from_token == "USDC" and to_token in ("ETH", "WETH"):
        return amount_wei // eth_usdc_rate
    elif from_token in ("ETH", "WETH") and to_token == "USDT":
        return amount_wei * eth_usdc_rate
    elif from_token == "USDT" and to_token in ("ETH", "WETH"):
        return amount_wei // eth_usdc_rate
    elif from_token == "USDC" and to_token == "USDT":
        return amount_wei  # 1:1
    elif from_token == "USDT" and to_token == "USDC":
        return amount_wei  # 1:1
    else:
        return amount_wei  # fallback 1:1


def _encode_params(
    token_in: str,
    token_out: str,
    fee: int,
    recipient: str,
    deadline: int,
    amount_in: int,
    amount_out_min: int,
    sqrt_price_limit: int,
) -> str:
    """Encode ExactInputSingleParams as ABI-encoded bytes (no web3 dependency)."""
    # Each parameter is 32 bytes (64 hex chars), padded left with zeros
    parts = [
        _pad_address(token_in),
        _pad_address(token_out),
        _pad_uint24(fee),
        _pad_address(recipient.replace("0x", "")),
        _pad_uint256(deadline),
        _pad_uint256(amount_in),
        _pad_uint256(amount_out_min),
        _pad_uint160(sqrt_price_limit),
    ]
    return "".join(parts)


def _pad_address(addr: str) -> str:
    """Pad address to 32 bytes (left-padded with zeros)."""
    return addr.zfill(64)


def _pad_uint256(value: int) -> str:
    """Encode uint256 as 32-byte hex."""
    return hex(value)[2:].zfill(64)


def _pad_uint24(value: int) -> str:
    """Encode uint24 as 32-byte hex (left-padded)."""
    return hex(value)[2:].zfill(64)


def _pad_uint160(value: int) -> str:
    """Encode uint160 as 32-byte hex (left-padded)."""
    return hex(value)[2:].zfill(64)


def _int_to_hex(value: int) -> str:
    """Convert int to hex string."""
    if value == 0:
        return "0x0"
    return hex(value)


def build_swap_proposal(
    from_token: str,
    to_token: str,
    amount_eth: str,
    slippage: float = 0.03,
    recipient: str = "0x0000000000000000000000000000000000000000",
) -> dict:
    """
    Build a complete swap proposal with calldata.

    Args:
        from_token: Source token (e.g., "ETH")
        to_token: Target token (e.g., "USDC")
        amount_eth: Amount in ETH (e.g., "0.001")
        slippage: Slippage tolerance (e.g., 0.03 for 3%)
        recipient: Recipient address for output tokens

    Returns:
        Dict with all fields needed for TxProposal
    """
    amount_wei = int(Decimal(amount_eth) * Decimal("1e18"))
    slippage_bps = int(slippage * 10000)

    calldata, value = encode_swap_calldata(
        from_token=from_token,
        to_token=to_token,
        amount_wei=amount_wei,
        recipient=recipient,
        slippage_bps=slippage_bps,
    )

    return {
        "action": "swap",
        "amount": amount_eth,
        "from_token": from_token,
        "to_token": to_token,
        "to_contract": UNISWAP_V3_ROUTER,
        "slippage": slippage,
        "deadline": 300,
        "calldata": calldata,
        "value": value,
    }
