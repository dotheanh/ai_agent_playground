"""
Build single-file exe cho Smart Auto Click.
Chạy: python build_exe.py

Output: dist/SmartAutoClick.exe
Scripts folder: dist/scripts/ (copy thủ công từ project/scripts/)
"""
import subprocess
import sys
import shutil
import os

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")
SPEC_FILE = os.path.join(PROJECT_ROOT, "SmartAutoClick.spec")

def build():
    # Clean dist
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)

    # Build command
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onefile",
        "--windowed",          # GUI app, không show console
        "--name", "SmartAutoClick",
        "--distpath", DIST_DIR,
        "--specpath", PROJECT_ROOT,
        # --add-data: scripts folder sẽ copy thủ công
        "--paths", PROJECT_ROOT,  # để import được các module trong project
        "main.py"
    ]

    print("Building exe...")
    result = subprocess.run(cmd)
    if result.returncode != 0:
        print("Build failed!")
        return False

    # Copy scripts folder vào dist
    src_scripts = os.path.join(PROJECT_ROOT, "scripts")
    dst_scripts = os.path.join(DIST_DIR, "scripts")
    if os.path.exists(src_scripts):
        shutil.copytree(src_scripts, dst_scripts)
        print(f"Copied scripts to: {dst_scripts}")

    # Tạo shortcut batch để chạy cùng folder
    bat_path = os.path.join(DIST_DIR, "SmartAutoClick.bat")
    with open(bat_path, "w") as f:
        f.write('@echo off\ncd /d "%~dp0"\nstart "" "SmartAutoClick.exe"\n')
    print(f"Created: {bat_path}")

    print(f"\nBuild thành công!")
    print(f"Output: {os.path.join(DIST_DIR, 'SmartAutoClick.exe')}")
    print(f"Scripts: {dst_scripts}")
    print(f"\nLưu ý: Copy thủ công scripts/ vào dist/ nếu cần (đã tự động làm)")
    return True

if __name__ == "__main__":
    build()
