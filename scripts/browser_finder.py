import os

def get_browser_exe():
    """
    Dynamically discovers the installed Microsoft Edge or Google Chrome executable
    without relying on brittle hardcoded version folder strings.
    """
    # 1. EdgeCore dynamic version folder (checks highest version first)
    edge_core_base = r'C:\Program Files (x86)\Microsoft\EdgeCore'
    if os.path.exists(edge_core_base):
        try:
            for entry in sorted(os.listdir(edge_core_base), reverse=True):
                cand = os.path.join(edge_core_base, entry, 'msedge.exe')
                if os.path.exists(cand):
                    return cand
        except Exception:
            pass

    # 2. Standard Microsoft Edge installation paths
    edge_standards = [
        r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
        os.path.expanduser('~') + r'\AppData\Local\Microsoft\Edge\Application\msedge.exe',
    ]
    for p in edge_standards:
        if os.path.exists(p):
            return p

    # 3. Google Chrome installation paths
    chrome_standards = [
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        os.path.expanduser('~') + r'\AppData\Local\Google\Chrome\Application\chrome.exe',
    ]
    for p in chrome_standards:
        if os.path.exists(p):
            return p

    raise FileNotFoundError(
        "Could not locate Microsoft Edge or Google Chrome binary. "
        "Please ensure a Chromium-based browser is installed."
    )

if __name__ == '__main__':
    print('Resolved browser binary:', get_browser_exe())
