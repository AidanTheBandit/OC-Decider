# Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Request                             │
│                 (OpenAI-compliant API call)                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express Server (server.js)                    │
│                POST /v1/chat/completions                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Decider Orchestrator                                │
│          (deciderOrchestrator.js)                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │   STEP 1    │
                    └──────┬──────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         Complexity Analyzer (complexityAnalyzer.js)              │
│         Model: gpt-3.5-turbo (fast & cheap)                      │
│                                                                   │
│  Analyzes:                                                        │
│  - Number of steps required                                       │
│  - Domain knowledge needed                                        │
│  - Ambiguity in request                                           │
│  - Multiple sub-tasks                                             │
│                                                                   │
│  Returns: {                                                       │
│    complexity: 1-10,                                              │
│    reasoning: "...",                                              │
│    needsPlanning: boolean                                         │
│  }                                                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
      Is Complexity >= 6?               │
              │                         │
        ┌─────┴─────┐                   │
        │    YES    │                   │ NO
        └─────┬─────┘                   │
              │                         │
       ┌──────┴──────┐                  │
       │   STEP 2    │                  │
       └──────┬──────┘                  │
              ▼                         │
┌─────────────────────────────────────┐ │
│   Planning Generator                │ │
│   (planningGenerator.js)            │ │
│   Model: gpt-4-turbo-preview        │ │
│                                     │ │
│ Generates structured plan:          │ │
│ - Break down into steps             │ │
│ - Identify dependencies             │ │
│ - Suggest approach                  │ │
│ - Provide structure                 │ │
└──────────────┬──────────────────────┘ │
               │                        │
        ┌──────┴──────┐                 │
        │   STEP 3    │                 │
        └──────┬──────┘                 │
               ▼                        │
┌──────────────────────────────────┐   │
│   Inject Plan into Prompt        │   │
│                                  │   │
│ Original: [user message]         │   │
│                                  │   │
│ Enhanced: [system: plan]         │   │
│           [user message]         │   │
└──────────────┬───────────────────┘   │
               │                       │
               └───────────┬───────────┘
                           │
                    ┌──────┴──────┐
                    │   STEP 4    │
                    └──────┬──────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Final LLM (OpenAI API)                              │
│              Model: gpt-4-turbo-preview (or user-specified)      │
│                                                                   │
│  Receives enhanced prompt and generates comprehensive response   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Response to User                             │
│              (OpenAI-compliant format)                           │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
                         EXAMPLE FLOWS
═══════════════════════════════════════════════════════════════════

SIMPLE QUERY (e.g., "What is 2+2?")
───────────────────────────────────────────────────────────────────
User Request
    ↓
Complexity: 2/10 (low)
    ↓
Skip Planning (threshold not met)
    ↓
Direct to Final LLM
    ↓
Quick Response


COMPLEX QUERY (e.g., "Design a microservices architecture...")
───────────────────────────────────────────────────────────────────
User Request
    ↓
Complexity: 9/10 (high)
    ↓
Generate Plan:
  "1. Define service boundaries
   2. Design API contracts
   3. Plan data management
   4. Address deployment..."
    ↓
Inject Plan into Prompt
    ↓
Final LLM (with structured guidance)
    ↓
Comprehensive, Well-Structured Response


═══════════════════════════════════════════════════════════════════
                        COST OPTIMIZATION
═══════════════════════════════════════════════════════════════════

Simple Query:
  - 1x gpt-3.5-turbo call (complexity analysis)
  - 1x final model call
  - Total: 2 API calls

Complex Query:
  - 1x gpt-3.5-turbo call (complexity analysis)
  - 1x gpt-4 call (planning)
  - 1x final model call
  - Total: 3 API calls

Result: Only pay for planning when needed!
```
