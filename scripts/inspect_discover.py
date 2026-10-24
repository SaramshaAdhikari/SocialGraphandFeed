import subprocess, time, json, urllib.request, base64
import websocket

EDGE_EXE = r'C:\Program Files (x86)\Microsoft\EdgeCore\155.0.4283.62\msedge.exe'
USER_DATA = r'C:\Users\Dell\AppData\Local\Temp\edge_cdp_profile'

def check_discover(w=1440, h=900, name='discover_desktop'):
    proc = subprocess.Popen([
        EDGE_EXE,
        '--headless',
        '--disable-gpu',
        '--remote-debugging-port=9222',
        '--remote-allow-origins=*',
        f'--user-data-dir={USER_DATA}',
        f'--window-size={w},{h}',
        'http://localhost:3000/explore'
    ])
    time.sleep(2.5)

    try:
        with urllib.request.urlopen('http://localhost:9222/json') as resp:
            tabs = json.loads(resp.read().decode())
        ws = websocket.create_connection(tabs[0]['webSocketDebuggerUrl'])
        
        def send_cmd(method, params=None):
            msg_id = int(time.time() * 1000) % 1000000
            ws.send(json.dumps({'id': msg_id, 'method': method, 'params': params or {}}))
            while True:
                res = json.loads(ws.recv())
                if res.get('id') == msg_id:
                    return res.get('result', {})

        send_cmd('Page.enable')
        send_cmd('Runtime.enable')
        send_cmd('Emulation.setDeviceMetricsOverride', {
            'width': w,
            'height': h,
            'deviceScaleFactor': 1,
            'mobile': w < 768
        })

        wait_script = """
        new Promise((resolve) => {
            let tries = 0;
            const check = () => {
                tries++;
                if (document.querySelectorAll('[data-testid^="discovery-pin-"]').length > 0 || tries > 30) {
                    resolve(true);
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        })
        """
        send_cmd('Runtime.evaluate', {'expression': wait_script, 'awaitPromise': True})

        eval_script = """
        (() => {
            const pins = Array.from(document.querySelectorAll('[data-testid^="discovery-pin-"]'));
            const columns = Array.from(document.querySelectorAll('.flex-1.flex.flex-col'));
            return {
                viewport: { w: window.innerWidth, h: window.innerHeight },
                pinsCount: pins.length,
                columnsCount: columns.length,
                columnWidths: columns.map(c => Math.round(c.getBoundingClientRect().width)),
                hasPageHScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                headerVisible: !!document.querySelector('header')
            };
        })()
        """
        res = send_cmd('Runtime.evaluate', {'expression': eval_script, 'returnByValue': True})
        print(f"=== {name} ===")
        print(json.dumps(res.get('result', {}).get('value', {}), indent=2))

        shot = send_cmd('Page.captureScreenshot', {'format': 'png'})
        if 'data' in shot:
            filename = f"packages/frontend/public/{name}.png"
            with open(filename, 'wb') as f:
                f.write(base64.b64decode(shot['data']))
            print(f"Saved {filename}")

        ws.close()
    finally:
        proc.terminate()

if __name__ == '__main__':
    check_discover(1440, 900, 'discover_1440')
