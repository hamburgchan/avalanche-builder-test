import urllib.request
import json
import sys

def check_fuji_rpc(url):
    data = json.dumps({"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            res = json.loads(response.read().decode('utf-8'))
            block_hex = res.get("result")
            block_dec = int(block_hex, 16) if block_hex else None
            print(f"[OK] Successfully connected to {url}, current block: {block_dec} ({block_hex})")
            return True
    except Exception as e:
        print(f"[FAIL] Could not connect to {url}: {e}")
        return False

if __name__ == "__main__":
    rpcs = [
        "https://api.avax-test.network/ext/bc/C/rpc",
        "https://avalanche-fuji-c-chain-rpc.publicnode.com",
        "https://rpc.ankr.com/avalanche_fuji"
    ]
    for rpc in rpcs:
        check_fuji_rpc(rpc)
