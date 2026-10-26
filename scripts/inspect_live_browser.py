import subprocess, time, json, urllib.request, base64
import websocket

def inspect():
    edge_exe = r'C:\Program Files (x86)\Microsoft\EdgeCore\155.0.4283.62\msedge.exe'
    user_data = r'C:\Users\Dell\AppData\Local\Temp\edge_cdp_profile'
    proc = subprocess.Popen([
        edge_exe,
        '--headless',
        '--disable-gpu',
        '--remote-debugging-port=9222',
        '--remote-allow-origins=*',
        f'--user-data-dir={user_data}',
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
            
        print('Connected to target:', target.get('url'))
        ws_url = target['webSocketDebuggerUrl']
        
        ws = websocket.create_connection(ws_url)
        
        def send_cmd(method, params=None):
            msg_id = int(time.time() * 1000) % 1000000
            req = {'id': msg_id, 'method': method, 'params': params or {}}
            ws.send(json.dumps(req))
            while True:
                res = json.loads(ws.recv())
                if res.get('id') == msg_id:
                    return res.get('result', {})

        send_cmd('Page.enable')
        send_cmd('Runtime.enable')
        time.sleep(1.5)

        # Check initial state
        eval_script = """
        (() => {
            const getBg = (sel) => {
                const el = document.querySelector(sel);
                if (!el) return 'NOT_FOUND';
                return window.getComputedStyle(el).backgroundColor;
            };
            return {
                themeAttr: document.documentElement.getAttribute('data-theme'),
                rootStyleCanvas: document.documentElement.style.getPropertyValue('--color-canvas'),
                rootStyleCard: document.documentElement.style.getPropertyValue('--color-surface-card'),
                rootStyleBorder: document.documentElement.style.getPropertyValue('--color-border'),
                htmlBg: getBg('html'),
                bodyBg: getBg('body'),
                asideBg: getBg('aside'),
                headerBg: getBg('header'),
                mainBg: getBg('main'),
                cardBg: getBg('article'),
            };
        })()
        """
        styles_res = send_cmd('Runtime.evaluate', {'expression': eval_script, 'returnByValue': True})
        print('Computed Styles:', json.dumps(styles_res.get('result', {}).get('value', {}), indent=2))

        # Check buttons inspection in visible RightRail
        btn_script = """
        (() => {
            const btn = document.querySelector('aside[aria-label="Contextual Sidebar"] button');
            if (!btn) return 'BUTTON_NOT_FOUND';
            const rect = btn.getBoundingClientRect();
            const icon = btn.querySelector('svg');
            const iconRect = icon ? icon.getBoundingClientRect() : null;
            const textSpan = btn.querySelector('span:nth-child(2)');
            const textRect = textSpan ? textSpan.getBoundingClientRect() : null;
            return {
                btnText: btn.textContent.trim(),
                btnBox: { w: rect.width, h: rect.height, top: rect.top },
                btnDisplay: window.getComputedStyle(btn).display,
                btnAlignItems: window.getComputedStyle(btn).alignItems,
                iconBox: iconRect ? { w: iconRect.width, h: iconRect.height, top: iconRect.top } : null,
                textBox: textRect ? { w: textRect.width, h: textRect.height, top: textRect.top } : null,
                iconTextVertDelta: (iconRect && textRect) ? Math.abs((iconRect.top + iconRect.height/2) - (textRect.top + textRect.height/2)) : null,
            };
        })()
        """
        btn_res_join = send_cmd('Runtime.evaluate', {'expression': btn_script, 'returnByValue': True})
        print('Join Button Details:', json.dumps(btn_res_join.get('result', {}).get('value', {}), indent=2))

        # Click the button to test Joined state
        click_script = """
        (() => {
            const btn = document.querySelector('aside[aria-label="Contextual Sidebar"] button');
            if (btn) {
                btn.click();
                return 'clicked';
            }
            return 'not_found';
        })()
        """
        send_cmd('Runtime.evaluate', {'expression': click_script, 'returnByValue': True})
        time.sleep(1)

        btn_res_joined = send_cmd('Runtime.evaluate', {'expression': btn_script, 'returnByValue': True})
        print('Joined Button Details (after click):', json.dumps(btn_res_joined.get('result', {}).get('value', {}), indent=2))

        shot = send_cmd('Page.captureScreenshot', {'format': 'png'})
        if 'data' in shot:
            data = base64.b64decode(shot['data'])
            with open('packages/frontend/public/live_render_noir.png', 'wb') as f:
                f.write(data)
            print('Saved packages/frontend/public/live_render_noir.png')

        ws.close()
    finally:
        proc.terminate()

if __name__ == '__main__':
    inspect()
