# Sentinel CAW Setup Spike

> Purpose: verify the real Cobo Agentic Wallet path before CP6.
> Do not commit real API keys, wallet credentials, screenshots, or private evidence files.

## Scope

CP4.5 is a setup spike, not business execution integration.

Goal:

```text
caw CLI installed
-> wallet onboarded
-> owner paired
-> testnet address funded
-> transfer pact submitted
-> pact approved and active
-> api_url / api_key / wallet_id / pact_id recorded locally
```

CP6 will use those values to implement `CawExecutor.transfer_tokens`.

## References

- CAW Introduction: https://www.cobo.com/products/agentic-wallet/manual/start-here/introduction
- CAW CLI: https://www.cobo.com/products/agentic-wallet/manual/developer/cli
- CAW Python SDK: https://www.cobo.com/products/agentic-wallet/manual/developer/api-client-python
- Pact Policies: https://www.cobo.com/products/agentic-wallet/manual/reference/pact-policies

## Install Script Review

Downloaded script:

```bash
/tmp/caw-install.sh
```

Observed behavior:

- Downloads `caw` CLI from `https://download.agenticwallet.cobo.com/binary-release`.
- Downloads TSS node assets from `https://download.tss.cobo.com/binary-release/latest`.
- Verifies the CAW binary checksum.
- Installs under `~/.cobo-agentic-wallet`.
- Symlinks `caw` into `~/.local/bin` by default for non-root Linux users.
- May append `~/.local/bin` to shell config if it is not already on `PATH`.
- Does not run `caw onboard`.
- Does not submit pacts.
- Does not create or move funds by itself.

Manual install command:

```bash
bash /tmp/caw-install.sh
```

After install:

```bash
export PATH="$HOME/.local/bin:$PATH"
caw --version
```

## Manual Setup Steps

These steps should be run by the project owner, not automated by Sentinel.

### 1. Onboard Wallet

```bash
caw onboard --wait
```

Expected result:

- Wallet reaches `active`.
- Local CAW config is created under the user's CAW home directory.

### 2. Pair Owner App

Generate pairing token:

```bash
caw wallet pair --code-only
```

Then enter the token in the Cobo Agentic Wallet app.

Check status:

```bash
caw wallet pair-status
```

### 3. Get Wallet Address And Testnet Funds

List addresses:

```bash
caw address list
```

Request Sepolia test ETH:

```bash
caw faucet deposit --token-id SETH --address <your-seth-address>
```

Check balance:

```bash
caw wallet balance
```

### 4. Get Agent Credentials

```bash
caw wallet current --show-api-key
```

Record locally in `.env`, not in git:

```bash
AGENT_WALLET_API_URL=<api_url>
AGENT_WALLET_API_KEY=<api_key>
AGENT_WALLET_WALLET_ID=<wallet_uuid>
```

### 5. Submit Transfer Pact

MVP transfer pact for Sepolia native ETH:

```bash
caw pact submit \
  --intent "Sentinel demo transfer on Sepolia" \
  --execution-plan "Allow Sentinel to submit bounded Sepolia ETH transfers for the Cobo demo." \
  --policies '[{"name":"sentinel-demo-transfer","type":"transfer","rules":{"effect":"allow","when":{"chain_in":["SETH"],"token_in":[{"chain_id":"SETH","token_id":"SETH"}]},"deny_if":{"amount_gt":"0.002"}}}]' \
  --completion-conditions '[{"type":"time_elapsed","threshold":"86400"}]'
```

Owner approves this pact in the CAW app.

Check status:

```bash
caw pact status --pact-id <pact-id>
```

Record locally:

```bash
COBO_PACT_ID=<pact-id>
```

### 6. Optional CLI Transfer Smoke Test

Allowed transfer:

```bash
caw tx transfer \
  --pact-id "$COBO_PACT_ID" \
  --src-address "$COBO_SRC_ADDRESS" \
  --dst-address 0x1111111111111111111111111111111111111111 \
  --token-id SETH \
  --amount 0.001 \
  --chain-id SETH
```

Policy-denied transfer:

```bash
caw tx transfer \
  --pact-id "$COBO_PACT_ID" \
  --src-address "$COBO_SRC_ADDRESS" \
  --dst-address 0x1111111111111111111111111111111111111111 \
  --token-id SETH \
  --amount 0.005 \
  --chain-id SETH
```

Expected denial includes structured fields such as `code`, `reason`, `details`, and `suggestion`.

Check transfer status:

```bash
caw tx get --request-id <request-id>
```

Observed CP4.5 note:

- `--src-address` was required in the local smoke test, even though CLI help says source auto-selection may be available.
- Policy deny returned `TRANSFER_LIMIT_EXCEEDED` with reason `matched_pact_transfer_deny_if`.
- Allowed transfer returned `Success`, `sub_status=completed`, and a Sepolia tx hash.

## Local Evidence Checklist

Store evidence outside git, for example under `hackathon/evidence/caw/` if ignored, or in a private notes folder.

Required for demo:

- CAW wallet address.
- Wallet active / paired status.
- Active pact ID and screenshot or command output.
- Allowed transfer request ID or tx ID.
- Policy-denied transfer output.
- Sentinel `/api/execute` response showing hard-rule reject does not call execution.

## Backend CP6 Inputs

CP6 `CawExecutor` should read:

```bash
EXECUTION_BACKEND=caw
ENABLE_REAL_TX=false
AGENT_WALLET_API_URL=
AGENT_WALLET_API_KEY=
AGENT_WALLET_WALLET_ID=
COBO_PACT_ID=
COBO_ENV=testnet
COBO_CHAIN_ID=SETH
COBO_TOKEN_ID=SETH
COBO_SRC_ADDRESS=
```

CP6 code path:

```text
Sentinel decision == execute
-> load active pact scoped credentials
-> transfer_tokens(wallet_id, chain_id, dst_addr, token_id, amount)
-> capture request_id / tx_id / tx_hash
-> handle policy denial as rejection_source="caw"
```
