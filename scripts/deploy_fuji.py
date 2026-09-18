import os
import sys
import subprocess
import json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def deploy():
    print("==========================================")
    print("[+] Avalanche Fuji Testnet Deployer")
    print("==========================================")

    
    # Check if PRIVATE_KEY is set in environment or prompt
    pk = os.environ.get("PRIVATE_KEY")
    if not pk:
        env_file = os.path.join("contracts", ".env")
        if os.path.exists(env_file):
            with open(env_file, "r") as f:
                for line in f:
                    if line.strip().startswith("PRIVATE_KEY=") and not "your_fuji_private_key" in line:
                        pk = line.strip().split("=", 1)[1].strip()
                        break
                        
    if not pk:
        print("[!] No PRIVATE_KEY detected in contracts/.env or environment.")
        print("Please export PRIVATE_KEY=0x... or write it to contracts/.env")
        print("Command to deploy manually via forge:")
        print("  cd contracts")
        print("  forge script script/DeployAvaxGuard.s.sol:DeployAvaxGuard --rpc-url fuji --broadcast --private-key <YOUR_KEY>")
        return

    print("[*] Compiling contracts with forge...")
    subprocess.run(["forge", "build"], cwd="contracts", check=True)

    print("[*] Broadcasting deployment to Avalanche Fuji (Chain ID 43113)...")
    cmd = [
        "forge", "script",
        "script/DeployAvaxGuard.s.sol:DeployAvaxGuard",
        "--rpc-url", "fuji",
        "--broadcast",
        "--private-key", pk
    ]

    res = subprocess.run(cmd, cwd="contracts", capture_output=True, text=True)
    print(res.stdout)
    if res.stderr:
        print(res.stderr)

    # Sync ABI
    subprocess.run(["python", "scripts/sync_abi.py"])

if __name__ == "__main__":
    deploy()
