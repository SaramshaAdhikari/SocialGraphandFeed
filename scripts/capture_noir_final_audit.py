import subprocess, time, json, urllib.request, base64, os, sys
import websocket

EDGE_EXE = r'C:\Program Files (x86)\Microsoft\EdgeCore\155.0.4283.62\msedge.exe'
USER_DATA = r'C:\Users\Dell\AppData\Local\Temp\edge_cdp_profile_audit'
ARTIFACT_DIR = r'C:\Users\Dell\.gemini\antigravity\brain\851dd127-77a7-4703-88a9-94e5fc499c2f'

def run_suite():
    proc = subprocess.Popen([
        EDGE_EXE,
        '--headless',
        '--disable-gpu',
        '--remote-debugging-port=9222',
        '--remote-allow-origins=*',
        f'--user-data-dir={USER_DATA}',
        '--window-size=1440,900',
        'http://localhost:3000'
    ])
    time.sleep(2.5)

    try:
        with urllib.request.urlopen('http://localhost:9222/json') as resp:
            tabs = json.loads(resp.read().decode())
        
        target = None
        for t in tabs:
            if 'localhost:3000' in t.get('url', ''):
                target = t
                break
        if not target:
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

        def capture(url, width, height, filename, eval_code=None, wait_selector=None):
            send_cmd('Emulation.setDeviceMetricsOverride', {
                'width': width,
                'height': height,
                'deviceScaleFactor': 1,
                'mobile': width < 768
            })
            send_cmd('Page.navigate', {'url': url})
            
            # Wait loop
            time.sleep(1.5)
            if wait_selector:
                wait_js = f"""
                new Promise((resolve) => {{
                    let tries = 0;
                    const check = () => {{
                        tries++;
                        if (document.querySelector('{wait_selector}') || tries > 40) resolve(true);
                        else setTimeout(check, 100);
                    }};
                    check();
                }})
                """
                send_cmd('Runtime.evaluate', {'expression': wait_js, 'awaitPromise': True})
                time.sleep(0.5)

            if eval_code:
                send_cmd('Runtime.evaluate', {'expression': eval_code})
                time.sleep(0.5)

            shot = send_cmd('Page.captureScreenshot', {'format': 'png'})
            if 'data' in shot:
                raw = base64.b64decode(shot['data'])
                # write to public
                pub_path = os.path.join('packages', 'frontend', 'public', f'{filename}.png')
                with open(pub_path, 'wb') as f:
                    f.write(raw)
                # write to artifact dir
                art_path = os.path.join(ARTIFACT_DIR, f'{filename}.png')
                with open(art_path, 'wb') as f:
                    f.write(raw)
                print(f"Captured {filename}: {pub_path} and {art_path}")

        # 1. Desktop 1440 Home Feed Noir
        capture('http://localhost:3000', 1440, 900, 'audit_desktop_1440_home', wait_selector='article')

        # 2. Inspect computed styles on Home Feed
        check_styles_js = """
        (() => {
            const body = document.body;
            const main = document.querySelector('main');
            const asideNav = document.querySelector('aside[aria-label="Sidebar Navigation"]') || document.querySelector('aside');
            const rightRail = document.querySelector('aside[aria-label="Contextual Sidebar"]');
            const card = document.querySelector('article');
            const svgBackdrop = document.querySelector('svg.animate-network-breathe');
            
            return {
                bodyBg: window.getComputedStyle(body).backgroundColor,
                mainBg: main ? window.getComputedStyle(main).backgroundColor : null,
                asideClass: asideNav ? asideNav.className : null,
                cardBg: card ? window.getComputedStyle(card).backgroundColor : null,
                cardBorder: card ? window.getComputedStyle(card).borderColor : null,
                backdropPresent: !!svgBackdrop,
                backdropPointerEvents: svgBackdrop ? window.getComputedStyle(svgBackdrop.parentElement).pointerEvents : null,
                rightRail: rightRail ? {
                    className: rightRail.className,
                    position: window.getComputedStyle(rightRail).position,
                    top: window.getComputedStyle(rightRail).top,
                    maxHeight: window.getComputedStyle(rightRail).maxHeight,
                    overflowY: window.getComputedStyle(rightRail).overflowY
                } : null
            };
        })()
        """
        res = send_cmd('Runtime.evaluate', {'expression': check_styles_js, 'returnByValue': True})
        print("Home Feed Style Audit:", json.dumps(res.get('result', {}).get('value', {}), indent=2))

        # 3. Authenticated Create Post
        login_script = """
        new Promise(async (resolve) => {
            try {
                const res = await fetch('/api/v1/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'test_designer', password: 'Password123!' }),
                    credentials: 'include'
                });
                const data = await res.json();
                console.log('Login result:', data);
                // Also trigger session reload in window
                window.location.href = '/create';
                resolve(true);
            } catch (err) {
                console.error(err);
                resolve(false);
            }
        })
        """
        send_cmd('Runtime.evaluate', {'expression': login_script, 'awaitPromise': True})
        time.sleep(2)

        capture('http://localhost:3000/create', 1440, 900, 'audit_desktop_1440_create_composer', wait_selector='input#post-title')

        # 4. Settings Appearance
        capture('http://localhost:3000/settings/appearance', 1440, 900, 'audit_desktop_1440_appearance', wait_selector='h1')

        # 5. Mobile 390 Home Feed
        capture('http://localhost:3000', 390, 844, 'audit_mobile_390_home', wait_selector='article')

        # 6. Mobile 390 scrolled
        scroll_eval = "window.scrollTo(0, 300);"
        capture('http://localhost:3000', 390, 844, 'audit_mobile_390_scrolled', eval_code=scroll_eval, wait_selector='article')

        # 7. Light Mode check by clicking the TopHeader toggle
        capture('http://localhost:3000', 1440, 900, 'audit_desktop_1440_light_mode', 
                eval_code="""
                (() => {
                    const btn = document.querySelector('button[aria-label="Switch to light mode"]');
                    if (btn) btn.click();
                })()
                """, 
                wait_selector='article')

        # Reset theme back to dark for consistency
        send_cmd('Runtime.evaluate', {'expression': """
        (() => {
            const btn = document.querySelector('button[aria-label="Switch to dark mode"]');
            if (btn) btn.click();
        })()
        """})
        time.sleep(1)

        ws.close()
    finally:
        proc.terminate()

if __name__ == '__main__':
    run_suite()
