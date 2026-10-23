# AWS Builder Mini-Challenge: Amazon Bedrock Native Integration
### Autonomous Agent Orchestration via Amazon Bedrock Converse API

---

## 1. Overview & Architecture

As part of the **AWS Builder Mini-Challenge**, this project integrates **Amazon Bedrock** directly into the agentic decision pipeline. Rather than limiting tool calls to rigid static scripts, the agent can use foundation models hosted on AWS Bedrock—such as **Anthropic Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20241022-v2:0`) or **Amazon Nova Pro** (`amazon.nova-pro-v1:0`)—to dynamically decide which Model Context Protocol (MCP) tools to invoke across multiple services.

```
                    USER GOAL
                       │
                       ▼
               AGENT ORCHESTRATOR
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
    AMAZON BEDROCK        AUTONOMOUS FALLBACK
   Converse API Call      (Zero-Key Fallback)
   (@aws-sdk/client-bedrock-runtime)
             │                   │
             └─────────┬─────────┘
                       │
                       ▼
                 MCP TOOL CALLS
             (calendar_get_events,
              gmail_search,
              drive_search,
              drive_get_file,
              document_analyze)
                       │
                       ▼
             SELF-HOSTED MCP SERVER
                (:3001/mcp)
```

---

## 2. Implementation Details

1. **SDK:** `@aws-sdk/client-bedrock-runtime` (`v3.x`)
2. **Provider Module:** [`src/agent/llm/bedrock.mjs`](../src/agent/llm/bedrock.mjs)
3. **API Employed:** AWS Bedrock **`ConverseCommand`**, the industry-standard structured tool-calling API on AWS.
4. **Tool Conversion:**
   The `formatBedrockTools()` method dynamically transforms registered MCP tool schemas into AWS Bedrock's native `toolConfig.tools` specification format with JSON schema parameter validation.
5. **Message Mapping:**
   `formatBedrockMessages()` structures the conversation history into Bedrock's `toolUse` and `toolResult` block hierarchy.

---

## 3. Configuration & Runtime Usage

To activate Amazon Bedrock in your environment:

```bash
# In your .env file or terminal environment:
LLM_PROVIDER=bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Optional: override the model ID (defaults to Claude 3.5 Sonnet v2)
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
# Or Amazon Nova Pro:
# BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
```

### Zero-Downtime Resilience & Keyless Evaluation
If AWS credentials are not configured or the network is unavailable, [`AmazonBedrockProvider`](../src/agent/llm/bedrock.mjs) logs an observability notice and automatically switches to the deterministic local `AutonomousDecisionEngine`. On the live public cloud deployment (`https://alexa-beta.onrender.com`), AWS credentials are intentionally omitted so evaluators can test every feature without configuring AWS IAM credentials.

---

## 4. Verification

Run the dedicated AWS Bedrock integration test suite:

```bash
node tests/aws-bedrock-integration.test.mjs
```

Expected output:
```text
[Test 1] Instantiating AmazonBedrockProvider with defaults... [PASS]
[Test 2] Verifying MCP Tool to Bedrock Converse toolConfig conversion... [PASS]
[Test 3] Verifying agent conversation messages to Bedrock Converse format... [PASS]
[Test 4] Verifying provider factory activation for Bedrock... [PASS]
[Test 5] Verifying zero-downtime graceful fallback... [PASS]
ALL AWS BUILDER MINI-CHALLENGE INTEGRATION TESTS PASSED (100%)
```
