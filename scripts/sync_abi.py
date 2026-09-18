import json
import os

def sync():
    contract_path = "contracts/out/AvaxGuard.sol/AvaxGuard.json"
    target_dir = "frontend/src/contracts"
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, "AvaxGuard.json")

    if not os.path.exists(contract_path):
        print(f"File not found: {contract_path}. Please run 'forge build' first.")
        return

    with open(contract_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    abi = data.get("abi", [])
    bytecode = data.get("bytecode", {}).get("object", "")

    export_data = {
        "contractName": "AvaxGuard",
        "abi": abi,
        "bytecode": bytecode
    }


    with open(target_path, "w", encoding="utf-8") as f:
        json.dump(export_data, f, indent=2)

    print(f"[OK] Successfully synced ABI to {target_path} ({len(abi)} items)")

if __name__ == "__main__":
    sync()
