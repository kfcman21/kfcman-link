import os

filepath = r"C:\Users\박찬규\.gemini\antigravity\scratch\kfcman-link\public\js\app.js"
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "switchClassroomTab" in line or "nav-item-shortener" in line or "nav-item-polls" in line or "nav-item-classroom" in line or "switchMainTab" in line:
        print(f"Line {i+1}: {line.strip()}")
