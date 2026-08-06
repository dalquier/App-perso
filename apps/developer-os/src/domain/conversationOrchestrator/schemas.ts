type Schema = Readonly<Record<string, unknown>>;
const string = { type: "string", minLength: 1 } as const;
const nullableString = { type: ["string", "null"] } as const;
const positiveInteger = { type: "integer", minimum: 1 } as const;
const strictObject = (
  required: readonly string[],
  properties: Readonly<Record<string, Schema>>,
): Schema => ({ type: "object", additionalProperties: false, required, properties });
const stringArray = { type: "array", items: string, uniqueItems: true } as const;
const extensions = { type: "object", additionalProperties: true } as const;
const channel = { enum: ["openai_api", "chatgpt_plus_manual"] } as const;
const dependencyMode = { enum: ["raw", "normalized"] } as const;
const jobState = { enum: ["pending", "blocked_by_dependency", "ready", "prepared_manual", "launched_manual", "queued_api", "running_api", "waiting_response_import", "completed", "failed_retryable", "failed_terminal", "cancelled", "superseded"] } as const;
const runState = { enum: ["draft", "validated", "ready", "running", "waiting_manual_input", "partially_completed", "completed", "failed", "cancelled", "archived"] } as const;
const resultStatus = { enum: ["completed", "failed_terminal", "cancelled"] } as const;

const requestJob = strictObject(["job_id", "prompt", "depends_on"], {
  job_id: string, role: string, execution_channel: channel, instructions: string,
  prompt: string, depends_on: stringArray, dependency_input_mode: dependencyMode,
  output_format: string, extensions,
});
export const runRequestSchemaV1 = strictObject(["schema_version", "run", "master", "jobs"], {
  schema_version: { const: "1.0" },
  run: strictObject(["run_id", "master_prompt_name", "default_execution_channel"], {
    run_id: string, master_prompt_name: string, default_execution_channel: channel,
    max_api_concurrency: positiveInteger,
    failure_policy: { enum: ["fail_fast", "continue_independent", "manual_decision"] },
    extensions,
  }),
  defaults: strictObject([], {
    model_profile: string, max_output_tokens: positiveInteger,
    dependency_input_mode: dependencyMode, extensions,
  }),
  master: strictObject(["final_prompt", "required_jobs"], {
    execution_channel: channel, instructions: string, final_prompt: string,
    required_jobs: stringArray, extensions,
  }),
  jobs: { type: "array", minItems: 1, items: requestJob },
  extensions,
});

const plannedJob = strictObject(["job_id", "sequence", "conversation_title", "execution_channel", "depends_on", "dependency_input_mode", "prompt_source_hash", "initial_state"], {
  job_id: string, sequence: positiveInteger, conversation_title: string,
  execution_channel: channel, model_profile: string, depends_on: stringArray,
  dependency_input_mode: dependencyMode,
  prompt_source_hash: { type: "string", pattern: "^sha256:[a-f0-9]{64}$" },
  initial_state: jobState,
});
export const runPlanSchemaV1 = strictObject(["schema_version", "run_id", "revision", "master_prompt_name", "state", "jobs"], {
  schema_version: { const: "1.0" }, run_id: string, revision: positiveInteger,
  master_prompt_name: string, state: { const: "validated" },
  jobs: { type: "array", minItems: 1, items: plannedJob },
});

export const runStateSchemaV1 = strictObject(["schema_version", "run_id", "state", "jobs", "updated_at"], {
  schema_version: { const: "1.0" }, run_id: string, state: runState,
  jobs: { type: "object", additionalProperties: jobState },
  updated_at: { type: "string", format: "date-time" },
});

const integrity = strictObject(["identity_marker_found", "manually_confirmed", "source_hash"], {
  identity_marker_found: { type: "boolean" }, manually_confirmed: { type: "boolean" },
  source_hash: { type: "string", pattern: "^sha256:.+" },
});
export const jobResultSchemaV1 = strictObject(["schema_version", "run_id", "job_id", "sequence", "conversation_title", "execution_channel", "attempt", "status", "response_raw", "response_normalized", "provider_refs", "usage_observed", "started_at", "completed_at", "integrity"], {
  schema_version: { const: "1.0" }, run_id: string, job_id: string,
  sequence: positiveInteger, conversation_title: string, execution_channel: channel,
  attempt: positiveInteger, status: resultStatus, response_raw: { type: "string" },
  response_normalized: { type: "string" },
  provider_refs: { type: "object", additionalProperties: { type: "string" } },
  usage_observed: { oneOf: [{ type: "null" }, { type: "object", additionalProperties: { type: "number", minimum: 0 } }] },
  started_at: { type: "string", format: "date-time" }, completed_at: nullableString,
  integrity,
});
