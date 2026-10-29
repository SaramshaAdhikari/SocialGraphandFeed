import subprocess, time, json, urllib.request, base64, os
import websocket

from browser_finder import get_browser_exe
EDGE_EXE = get_browser_exe()
USER_DATA = r'C:\Users\Dell\AppData\Local\Temp\edge_cdp_profile_acceptance'
ARTIFACT_DIR = r'C:\Users\Dell\.gemini\antigravity\brain\851dd127-77a7-4703-88a9-94e5fc499c2f'

proc = subprocess.Popen([
    EDGE_EXE,
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--remote-allow-origins=*',
    f'--user-data-dir={USER_DATA}',
    '--window-size=1440,900',
    'http://localhost:3000/login'
])
time.sleep(2)

try:
    with urllib.request.urlopen('http://localhost:9222/json') as resp:
        tabs = json.loads(resp.read().decode())
    target = tabs[0]
    ws = websocket.create_connection(target['webSocketDebuggerUrl'])

    def send_cmd(method, params=None):
        msg_id = int(time.time() * 1000) % 1000000
        ws.send(json.dumps({'id': msg_id, 'method': method, 'params': params or {}}))
        while True:
            res = json.loads(ws.recv())
            if res.get('id') == msg_id:
                return res.get('result', {})

    send_cmd('Page.enable')
    send_cmd('Runtime.enable')

    # Type username and password into form and click submit
    fill_and_submit = """
    (() => {
        const uInput = document.querySelector('input[name="username"]');
        const pInput = document.querySelector('input[name="password"]');
        const btn = document.querySelector('button[type="submit"]');
        if (uInput && pInput && btn) {
            uInput.value = 'alex_dev';
            uInput.dispatchEvent(new Event('input', { bubbles: true }));
            pInput.value = 'Password123!';
            pInput.dispatchEvent(new Event('input', { bubbles: true }));
            btn.click();
            return true;
        }
        return false;
    })()
    """
    res = send_cmd('Runtime.evaluate', {'expression': fill_and_submit})
    print('Fill & submit result:', res)

    time.sleep(2)
    send_cmd('Page.navigate', {'url': 'http://localhost:3000/create'})
    time.sleep(2)

    shot = send_cmd('Page.captureScreenshot', {'format': 'png'})
    if 'data' in shot:
        raw = base64.b64decode(shot['data'])
        pub_path = os.path.join('packages', 'frontend', 'public', 'acceptance_desktop_1440_create_composer.png')
        with open(pub_path, 'wb') as f:
            f.write(raw)
        art_path = os.path.join(ARTIFACT_DIR, 'acceptance_desktop_1440_create_composer.png')
        with open(art_path, 'wb') as f:
            f.write(raw)
        print("Captured authenticated create composer screenshot!")

finally:
    try:
        ws.close()
    except:
        pass
    proc.terminate()
