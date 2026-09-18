import secrets
import hashlib
import binascii

# A simple zero-dependency Python script to generate a Fuji testnet account or inspect address
def generate_eth_compatible_key():
    try:
        from eth_account import Account
        Account.enable_unaudited_hdwallet_features()
        acct, mnemonic = Account.create_with_mnemonic()
        print("==========================================")
        print("🎉 Successfully generated Avalanche Testnet Wallet!")
        print(f"Address:     {acct.address}")
        print(f"Private Key: {acct.key.hex()}")
        print(f"Mnemonic:    {mnemonic}")
        print("==========================================")
        print("👉 Go to faucets to claim Fuji AVAX:")
        print("1. https://core.app/tools/testnet-faucet")
        print("2. https://build.avax.network/console/primary-network/faucet")
        print("==========================================")
    except ImportError:
        # Fallback raw hex key
        raw_key = secrets.token_hex(32)
        print("==========================================")
        print("Generated Raw 32-byte Private Key:")
        print(f"0x{raw_key}")
        print("Tip: Install 'eth-account' (pip install eth-account) to derive public address directly,")
        print("or import this private key directly into Core Wallet / MetaMask.")
        print("==========================================")

if __name__ == "__main__":
    generate_eth_compatible_key()
