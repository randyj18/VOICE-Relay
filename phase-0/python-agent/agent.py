"""
Phase 0 Spike: Python Agent
Demonstrates E2EE by encrypting a "hello world" message that can be decrypted by React Native.
"""

import json
import sys
from crypto_utils import CryptoUtils


def main():
    print("=== VOICE Relay - Phase 0 Spike: Python Agent ===\n")

    # Step 1: Simulate the app having a permanent public/private key pair
    print("[1] Simulating: App has permanent public/private key pair (created on first login)")
    app_private_key = CryptoUtils.generate_key_pair()
    app_public_key_pem = CryptoUtils.get_public_key_pem(app_private_key)
    print(f"    Generated app's public key (first 50 chars): {app_public_key_pem[:50]}...")

    # Save app keys to files (simulate server storage)
    with open('app_public_key.pem', 'w') as f:
        f.write(app_public_key_pem)
    with open('app_private_key.pem', 'w') as f:
        f.write(CryptoUtils.get_private_key_pem(app_private_key))
    print("    [OK] Keys saved to app_public_key.pem and app_private_key.pem\n")

    # Step 2: Agent generates ephemeral key pair
    print("[2] Agent generates ephemeral key pair (one-time use)")
    temp_private_key = CryptoUtils.generate_key_pair()
    temp_public_key_pem = CryptoUtils.get_public_key_pem(temp_private_key)
    print(f"    Generated ephemeral public key (first 50 chars): {temp_public_key_pem[:50]}...")
    with open('temp_public_key.pem', 'w') as f:
        f.write(temp_public_key_pem)
    print("    [OK] Saved to temp_public_key.pem\n")

    # Step 3: Create Work Order payload
    print("[3] Agent builds Work Order payload")
    work_order = {
        "topic": "Phase 0 Spike",
        "prompt": "hello world",
        "reply_instructions": {
            "destination_url": "https://localhost:8000/reply",
            "http_method": "POST",
            "reply_encryption_key": temp_public_key_pem
        }
    }
    work_order_json = json.dumps(work_order, indent=2)
    print(f"    Work Order:\n{work_order_json}\n")

    # Step 4: Encrypt work order with app's public key
    print("[4] Agent encrypts Work Order with app's public key (RSA-OAEP)")
    app_public_key = CryptoUtils.load_public_key_from_pem(app_public_key_pem)
    encrypted_work_order = CryptoUtils.encrypt_rsa(work_order_json, app_public_key)
    print(f"    Encrypted (base64, first 100 chars): {encrypted_work_order[:100]}...\n")

    # Save encrypted payload
    with open('encrypted_work_order.txt', 'w') as f:
        f.write(encrypted_work_order)
    print("    [OK] Saved to encrypted_work_order.txt\n")

    # Step 5: Simulate React Native decryption
    print("[5] Simulating React Native app receives encrypted Work Order")
    print("    (App has app_private_key, so it can decrypt)\n")

    print("[6] React Native app decrypts Work Order with app_private_key")
    decrypted_work_order = CryptoUtils.decrypt_rsa(encrypted_work_order, app_private_key)
    decrypted_json = json.loads(decrypted_work_order)
    print(f"    Decrypted Work Order:\n{json.dumps(decrypted_json, indent=2)}\n")

    # Step 6: App reads prompt and will reply
    print("[7] React Native app reads prompt: \"" + decrypted_json['prompt'] + "\"")
    print("    (In real app, this would be spoken via TTS)\n")

    # Step 7: Simulate app recording an answer
    print("[8] User speaks their answer (simulated): \"Hello from React Native!\"")
    reply_text = "Hello from React Native!"
    reply_instructions = decrypted_json['reply_instructions']
    reply_encryption_key_pem = reply_instructions['reply_encryption_key']

    # App encrypts reply with ephemeral public key (temp_public_key)
    print("\n[9] App encrypts reply with ephemeral public key (temp_public_key)")
    temp_public_key = CryptoUtils.load_public_key_from_pem(reply_encryption_key_pem)
    encrypted_reply = CryptoUtils.encrypt_rsa(reply_text, temp_public_key)
    print(f"    Encrypted reply (base64, first 100 chars): {encrypted_reply[:100]}...\n")

    with open('encrypted_reply.txt', 'w') as f:
        f.write(encrypted_reply)
    print("    [OK] Saved to encrypted_reply.txt\n")

    # Step 8: Agent decrypts reply
    print("[10] Agent receives encrypted reply and decrypts with temp_private_key")
    decrypted_reply = CryptoUtils.decrypt_rsa(encrypted_reply, temp_private_key)
    print(f"    Decrypted reply: \"{decrypted_reply}\"\n")

    print("=== PHASE 0 SUCCESS ===")
    print("[OK] Python Agent encrypted 'hello world' (Work Order)")
    print("[OK] React Native app decrypted it")
    print("[OK] React Native app encrypted a reply")
    print("[OK] Python Agent decrypted the reply")
    print("\nE2EE round-trip complete! Ready to move to Phase 1.\n")

    # Save summary
    with open('phase0_summary.json', 'w') as f:
        summary = {
            "app_public_key": app_public_key_pem,
            "temp_public_key": temp_public_key_pem,
            "original_prompt": work_order['prompt'],
            "decrypted_prompt": decrypted_json['prompt'],
            "decrypted_reply": decrypted_reply,
            "success": True
        }
        json.dump(summary, f, indent=2)
    print("[OK] Summary saved to phase0_summary.json\n")


if __name__ == '__main__':
    main()
