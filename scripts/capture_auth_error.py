import subprocess, time, json, urllib.request, base64, os
import websocket

from browser_finder import get_browser_exe
EDGE_EXE = get_browser_exe()
USER_DATA = r'C:\Users\Dell\AppData\Local\Temp\edge_clean_auth'
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
time.sleep(2.5)

try:
    tabs = None
    for _ in range(10):
        try:
            with urllib.request.urlopen('http://localhost:9222/json') as resp:
                tabs = json.loads(resp.read().decode())
            if tabs:
                break
        except Exception:
            time.sleep(0.5)

    if not tabs:
        raise RuntimeError("Could not connect to Edge 9222")

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

    # Ensure dark mode
    send_cmd('Runtime.evaluate', {'expression': """
    (() => {
        window.localStorage.setItem('socialgraph_theme_mode', 'dark');
        window.localStorage.setItem('socialgraph_theme_palette', 'royal-blue');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
    })()
    """})

    # Wait for form to render after session check
    wait_form_js = """
    new Promise((resolve) => {
        let count = 0;
        const interval = setInterval(() => {
            count++;
            const form = document.querySelector('form');
            if (form || count > 50) {
                clearInterval(interval);
                resolve(Boolean(form));
            }
        }, 100);
    })
    """
    has_form = send_cmd('Runtime.evaluate', {'expression': wait_form_js, 'awaitPromise': True})
    print("Form ready:", has_form)

    # Fill invalid credentials and submit
    fill_and_submit = """
    new Promise((resolve) => {
        const u = document.querySelector('input[name="username"]');
        const p = document.querySelector('input[name="password"]');
        const btn = document.querySelector('button[type="submit"]');
        if (u && p && btn) {
            u.value = 'invalid_user';
            u.dispatchEvent(new Event('input', { bubbles: true }));
            p.value = 'wrong_password_xyz';
            p.dispatchEvent(new Event('input', { bubbles: true }));
            btn.click();
            let c = 0;
            const iv = setInterval(() => {
                c++;
                const alert = document.querySelector('div[role="alert"]');
                if (alert || c > 40) {
                    clearInterval(iv);
                    resolve(true);
                }
            }, 100);
        } else {
            resolve(false);
        }
    })
    """
    res = send_cmd('Runtime.evaluate', {'expression': fill_and_submit, 'awaitPromise': True})
    print("Submitted invalid credentials:", res)

    # Wait for error message banner to appear
    time.sleep(1.5)

    shot = send_cmd('Page.captureScreenshot', {'format': 'png'})
    if 'data' in shot:
        raw = base64.b64decode(shot['data'])
        pub_path = os.path.join('packages', 'frontend', 'public', 'acceptance_auth_error.png')
        with open(pub_path, 'wb') as f:
            f.write(raw)
        art_path = os.path.join(ARTIFACT_DIR, 'acceptance_auth_error.png')
        with open(art_path, 'wb') as f:
            f.write(raw)
        print(f"Captured acceptance_auth_error: {pub_path} and {art_path}")

    ws.close()
finally:
    proc.terminate()
