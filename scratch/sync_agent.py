import os
import time
import requests
import json
import subprocess
import tkinter as tk
from tkinter import messagebox, filedialog
import threading

# Config
SERVER_URL = "http://140.245.76.33"  # Oracle VM IP
SYNC_DIR = os.path.join(os.path.expanduser("~"), "Desktop", "KFC_MAN_Sync")
os.makedirs(SYNC_DIR, exist_ok=True)

class SyncAgentApp:
    def __init__(self, root):
        self.root = root
        self.root.title("KFC MAN.HWP - 실시간 동기화 에이전트")
        self.root.geometry("480x360")
        self.root.configure(bg="#0f172a")
        
        self.watched_files = {}  # {filename: (doc_id, last_mtime)}
        self.running = True
        
        # UI Setup
        self.title_label = tk.Label(root, text="🍀 KFC MAN.HWP 폴더 동기화 에이전트", font=("Pretendard", 14, "bold"), fg="#38bdf8", bg="#0f172a")
        self.title_label.pack(pady=15)
        
        self.dir_label = tk.Label(root, text=f"📂 감시 폴더: {SYNC_DIR}", font=("Pretendard", 10), fg="#94a3b8", bg="#0f172a")
        self.dir_label.pack(pady=5)
        
        self.log_box = tk.Text(root, height=12, width=55, bg="#1e293b", fg="#e2e8f0", font=("Consolas", 9), bd=0)
        self.log_box.pack(pady=10)
        
        self.btn_open = tk.Button(root, text="공유 폴더 열기", command=self.open_folder, bg="#3b82f6", fg="white", font=("Pretendard", 9, "bold"), padx=10, pady=5)
        self.btn_open.pack(side=tk.LEFT, padx=30, pady=10)
        
        self.btn_sync = tk.Button(root, text="즉시 클라우드 동기화", command=self.force_sync, bg="#10b981", fg="white", font=("Pretendard", 9, "bold"), padx=10, pady=5)
        self.btn_sync.pack(side=tk.RIGHT, padx=30, pady=10)
        
        # Start Threads
        self.log("동기화 시스템이 작동을 시작했습니다.")
        self.log("kfcman.link 와 바탕화면 KFC_MAN_Sync 폴더를 감시합니다.")
        
        threading.Thread(target=self.sync_loop, daemon=True).start()
        
    def log(self, msg):
        self.log_box.insert(tk.END, f"[{time.strftime('%H:%M:%S')}] {msg}\n")
        self.log_box.see(tk.END)
        
    def open_folder(self):
        os.startfile(SYNC_DIR)
        
    def force_sync(self):
        self.log("🔄 서버로부터 새로운 문서 목록을 수신하여 동기화하는 중...")
        try:
            res = requests.get(f"{SERVER_URL}/api/docs")
            if res.status_code == 200:
                docs = res.json().get("docs", [])
                hwp_docs = [d for d in docs if d.get("hasHwpData")]
                self.log(f"발견된 클라우드 한글 문서: {len(hwp_docs)}개")
                
                for doc in hwp_docs:
                    doc_id = doc["id"]
                    filename = doc["hwpName"] or f"{doc['title']}.hwp"
                    file_path = os.path.join(SYNC_DIR, filename)
                    
                    # Download file if not exists
                    if not os.path.exists(file_path):
                        self.log(f"📥 다운로드 중: {filename}")
                        down_res = requests.get(f"{SERVER_URL}/api/docs/{doc_id}/download")
                        if down_res.status_code == 200:
                            with open(file_path, "wb") as f:
                                f.write(down_res.content)
                            mtime = os.path.getmtime(file_path)
                            self.watched_files[filename] = (doc_id, mtime)
                            self.log(f"✅ 다운로드 완료: {filename}")
            else:
                self.log("❌ 문서 목록 수신 실패")
        except Exception as e:
            self.log(f"❌ 동기화 에러: {str(e)}")
            
    def sync_loop(self):
        # Initial force sync
        self.force_sync()
        
        while self.running:
            time.sleep(2)
            try:
                # 1. Check local changes to upload
                for filename in os.listdir(SYNC_DIR):
                    if not (filename.endswith(".hwp") or filename.endswith(".hwpx")):
                        continue
                    
                    file_path = os.path.join(SYNC_DIR, filename)
                    mtime = os.path.getmtime(file_path)
                    
                    # If this is a new file or modified file
                    if filename not in self.watched_files:
                        # Skip initial adding if it was already handled by download
                        continue
                        
                    doc_id, last_mtime = self.watched_files[filename]
                    if mtime > last_mtime:
                        self.log(f"⚡ 변경사항 감지! 업로드 중: {filename}")
                        with open(file_path, "rb") as f:
                            import base64
                            binary_data = f.read()
                            base64_data = "data:application/x-hwp;base64," + base64.b64encode(binary_data).decode('utf-8')
                        
                        payload = {
                            "title": filename,
                            "hwpData": base64_data,
                            "hwpName": filename
                        }
                        res = requests.put(f"{SERVER_URL}/api/docs/{doc_id}", json=payload)
                        if res.status_code == 200:
                            self.watched_files[filename] = (doc_id, mtime)
                            self.log(f"✅ 클라우드 동기화 및 덮어쓰기 완료!")
                        else:
                            self.log(f"❌ 동기화 실패: {res.status_code}")
                            
            except Exception as e:
                pass

if __name__ == "__main__":
    root = tk.Tk()
    app = SyncAgentApp(root)
    root.mainloop()
