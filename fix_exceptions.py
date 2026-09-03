import re

def fix_riot_client():
    with open('backend/riot_client.py', 'r') as f:
        content = f.read()

    # Fix indentation on line 164
    content = content.replace('            headers=local, verify=False, timeout=5).json()  # nosec B501\n', '                headers=local, verify=False, timeout=5).json()  # nosec B501\n')

    with open('backend/riot_client.py', 'w') as f:
        f.write(content)

fix_riot_client()
