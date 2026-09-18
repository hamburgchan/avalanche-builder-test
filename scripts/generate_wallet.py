import subprocess
import secrets
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def generate_wallet():
    try:
        res = subprocess.run(["cmd.exe", "/c", "cast wallet new"], capture_output=True, text=True, check=True)
        combined = (res.stderr + "\n" + res.stdout).strip()
        print("==========================================")
        print("[+] Avalanche Fuji Testnet Wallet Generated!")
        print("==========================================")
        print(combined)
        print("==========================================")
        print("[*] How to claim Fuji testnet AVAX:")
        print("1. Core Faucet:   https://core.app/tools/testnet-faucet")
        print("2. Builder Hub:   https://build.avax.network/console/primary-network/faucet")
        print("3. Check balance: cast balance <ADDRESS> --rpc-url fuji")
        print("==========================================")
    except Exception as e:
        raw_key = secrets.token_hex(32)
        print(f"Fallback Private Key: 0x{raw_key}")

if __name__ == "__main__":
    generate_wallet()
