"""
Test script: drives @playwright/mcp over stdio JSON-RPC.
Navigates to the running app, fills a todo, takes screenshots.
"""
import subprocess
import json
import threading
import queue
import time
import os

SCREENSHOTS = "/Users/andreabozzelli/Projects/bmad-todo-app/_mcp_screenshots"
os.makedirs(SCREENSHOTS, exist_ok=True)

proc = subprocess.Popen(
    ["npx", "-y", "@playwright/mcp@0.0.68", "--headless"],
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
time.sleep(2)  # give npx time to start the browser

def send(msg: dict):
    proc.stdin.write(json.dumps(msg) + "\n")
    proc.stdin.flush()
    try:
        return response_queue.get(timeout=30)
    except queue.Empty:
        return None

# MCP handshake
send({"jsonrpc": "2.0", "id": 0, "method": "initialize", "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "mcp-test", "version": "1.0"}
}})
send({"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}})

msg_id = [1]

def call(tool, args=None):
    r = send({"jsonrpc": "2.0", "id": msg_id[0], "method": "tools/call",
              "params": {"name": tool, "arguments": args or {}}})
    msg_id[0] += 1
    label = f"[{tool}]"
    if r and "result" in r:
        content = r["result"]["content"]
        for c in content:
            if c.get("type") == "text":
                text = c["text"][:600] if len(c["text"]) > 600 else c["text"]
                print(f"{label} {text}")
                return text
        print(f"{label} (no text content)")
        return None
    else:
        print(f"{label} ERROR: {r}")
        return None

print("=== 1. Navigate to app ===")
call("browser_navigate", {"url": "http://localhost:5173"})
time.sleep(2)

print("\n=== 2. Accessibility snapshot — initial load ===")
call("browser_snapshot")

print("\n=== 3. Screenshot — initial state ===")
call("browser_take_screenshot", {"filename": f"{SCREENSHOTS}/01_initial.png"})

print("\n=== 4. Fill add-task input ===")
call("browser_fill_form", {"fields": [{"label": "New task", "value": "MCP test task"}]})

print("\n=== 5. Press Enter to submit ===")
call("browser_press_key", {"key": "Enter"})
time.sleep(1)

print("\n=== 6. Screenshot — after adding todo ===")
call("browser_take_screenshot", {"filename": f"{SCREENSHOTS}/02_after_add.png"})

print("\n=== 7. Accessibility snapshot — list with new item ===")
call("browser_snapshot")

print("\n=== 8. Network requests ===")
call("browser_network_requests", {})

print("\n=== 9. Console errors ===")
call("browser_console_messages", {"level": "error"})

print("\n=== 10. Resize to mobile 375x812 ===")
call("browser_resize", {"width": 375, "height": 812})
time.sleep(1)
call("browser_take_screenshot", {"filename": f"{SCREENSHOTS}/03_mobile.png"})

print("\n=== 11. Click delete on the MCP test task ===")
call("browser_click", {"element": "Delete task 'MCP test task'", "ref": ""})
time.sleep(1)
call("browser_take_screenshot", {"filename": f"{SCREENSHOTS}/04_after_delete.png"})

print(f"\nScreenshots saved to: {SCREENSHOTS}")
call("browser_close")
proc.terminate()
proc.wait(timeout=5)
print("Done.")
