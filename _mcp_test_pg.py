"""
Test script: drives @modelcontextprotocol/server-postgres over stdio JSON-RPC.
A single server process is kept alive for all queries.
"""
import subprocess
import json
import threading
import queue

PG_URL = "postgresql://todo_user:todo_password@localhost:5432/todo_db"

proc = subprocess.Popen(
    ["npx", "-y", "@modelcontextprotocol/server-postgres@0.6.2", PG_URL],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    bufsize=1,
)

response_queue: queue.Queue = queue.Queue()

def reader():
    for line in proc.stdout:
        line = line.strip()
        if line:
            try:
                response_queue.put(json.loads(line))
            except json.JSONDecodeError:
                pass

threading.Thread(target=reader, daemon=True).start()

def send(msg: dict):
    proc.stdin.write(json.dumps(msg) + "\n")
    proc.stdin.flush()
    try:
        return response_queue.get(timeout=20)
    except queue.Empty:
        return None

# MCP handshake
send({"jsonrpc": "2.0", "id": 0, "method": "initialize", "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "mcp-test", "version": "1.0"}
}})
send({"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}})

def query(label, sql):
    r = send({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
              "params": {"name": "query", "arguments": {"sql": sql}}})
    print(f"\n{'='*60}\n  {label}\n{'='*60}")
    if r and "result" in r:
        print(r["result"]["content"][0]["text"])
    else:
        print(f"ERROR: {r}")

query("1. Table schema",
    "SELECT column_name, data_type, character_maximum_length, is_nullable "
    "FROM information_schema.columns WHERE table_name='todos' ORDER BY ordinal_position")

query("2. All todos (oldest-first, limit 3)",
    "SELECT id, title, is_done, created_at FROM todos ORDER BY created_at ASC LIMIT 3")

query("3. Completion stats",
    "SELECT COUNT(*) AS total, "
    "SUM(CASE WHEN is_done THEN 1 ELSE 0 END) AS done, "
    "SUM(CASE WHEN NOT is_done THEN 1 ELSE 0 END) AS pending FROM todos")

query("4. Table size on disk",
    "SELECT pg_size_pretty(pg_total_relation_size('todos')) AS table_size")

query("5. Write-guard test (INSERT should be blocked by read-only mode)",
    "INSERT INTO todos (id, title, is_done, created_at, updated_at) "
    "VALUES (gen_random_uuid(), 'injected', false, now(), now())")

proc.terminate()
proc.wait(timeout=5)
print("\nDone.")
