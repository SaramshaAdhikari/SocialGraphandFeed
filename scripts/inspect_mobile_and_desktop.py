import subprocess, time, json, urllib.request, base64, sys
import websocket

EDGE_EXE = r'C:\Program Files (x86)\Microsoft\EdgeCore\155.0.4283.62\msedge.exe'
USER_DATA = r'C:\Users\Dell\AppData\Local\Temp\edge_cdp_profile'

def run_inspection(width=390, height=844, output_prefix='mobile_390'):
    proc = subprocess.Popen([
        EDGE_EXE,
        '--headless',
        '--disable-gpu',
        '--remote-debugging-port=9222',
        '--remote-allow-origins=*',
        f'--user-data-dir={USER_DATA}',
        f'--window-size={width},{height}',
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
        send_cmd('Emulation.setDeviceMetricsOverride', {
            'width': width,
            'height': height,
            'deviceScaleFactor': 1,
            'mobile': width < 768
        })

        # Wait for feed articles to render
        wait_script = """
        new Promise((resolve) => {
            let tries = 0;
            const check = () => {
                tries++;
                if (document.querySelector('article') || tries > 30) resolve(true);
                else setTimeout(check, 100);
            };
            check();
        })
        """
        send_cmd('Runtime.evaluate', {'expression': wait_script, 'awaitPromise': True})

        script = """
        (() => {
            const header = document.querySelector('header');
            const hRect = header ? header.getBoundingClientRect() : null;
            const hStyle = header ? window.getComputedStyle(header) : null;
            
            // Check ancestors for overflow
            const overflowAncestors = [];
            let p = header ? header.parentElement : null;
            while (p) {
                const s = window.getComputedStyle(p);
                if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
                    overflowAncestors.push({
                        tag: p.tagName,
                        className: p.className,
                        overflowX: s.overflowX,
                        overflowY: s.overflowY
                    });
                }
                p = p.parentElement;
            }
            
            const bottomNav = document.querySelector('nav[aria-label="Mobile Navigation"]');
            const bRect = bottomNav ? bottomNav.getBoundingClientRect() : null;
            
            const card = document.querySelector('article');
            const cRect = card ? card.getBoundingClientRect() : null;
            
            const actionRow = card ? card.querySelector('.border-t') : null;
            const aRect = actionRow ? actionRow.getBoundingClientRect() : null;
            
            const buttons = actionRow ? Array.from(actionRow.querySelectorAll('button, a')).map(el => {
                const r = el.getBoundingClientRect();
                return {
                    text: el.textContent.trim(),
                    left: Math.round(r.left),
                    right: Math.round(r.right),
                    width: Math.round(r.width),
                    overflowingCard: cRect ? (r.right > cRect.right + 1) : false
                };
            }) : [];

            return {
                viewport: { w: window.innerWidth, h: window.innerHeight },
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
                hasPageHScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                header: hRect ? {
                    top: Math.round(hRect.top),
                    bottom: Math.round(hRect.bottom),
                    position: hStyle.position,
                    zIndex: hStyle.zIndex
                } : null,
                overflowAncestors: overflowAncestors,
                bottomNav: bRect ? {
                    top: Math.round(bRect.top),
                    bottom: Math.round(bRect.bottom),
                    visible: bRect.height > 0
                } : null,
                card: cRect ? { width: Math.round(cRect.width), right: Math.round(cRect.right) } : null,
                actionRow: aRect ? { width: Math.round(aRect.width), right: Math.round(aRect.right) } : null,
                buttons: buttons,
                anyButtonOverflowing: buttons.some(b => b.overflowingCard)
            };
        })()
        """
        init_res = send_cmd('Runtime.evaluate', {'expression': script, 'returnByValue': True})
        val = init_res.get('result', {}).get('value', {})
        print(f"=== {output_prefix} (Initial) ===")
        print(json.dumps(val, indent=2))

        # Test scroll
        scroll_script = """
        (() => {
            window.scrollTo(0, 350);
            const header = document.querySelector('header');
            const hRect = header ? header.getBoundingClientRect() : null;
            const bottomNav = document.querySelector('nav[aria-label="Mobile Navigation"]');
            const bRect = bottomNav ? bottomNav.getBoundingClientRect() : null;
            return {
                scrollY: window.scrollY,
                headerTop: hRect ? Math.round(hRect.top) : null,
                headerBottom: hRect ? Math.round(hRect.bottom) : null,
                headerVisible: hRect ? (hRect.bottom > 0 && hRect.top < window.innerHeight) : false,
                bottomNavVisible: bRect ? (bRect.top < window.innerHeight && bRect.bottom > 0) : false
            };
        })()
        """
        scroll_res = send_cmd('Runtime.evaluate', {'expression': scroll_script, 'returnByValue': True})
        print(f"=== {output_prefix} (After Scroll 350px) ===")
        print(json.dumps(scroll_res.get('result', {}).get('value', {}), indent=2))

        shot = send_cmd('Page.captureScreenshot', {'format': 'png'})
        if 'data' in shot:
            filename = f"packages/frontend/public/{output_prefix}.png"
            with open(filename, 'wb') as f:
                f.write(base64.b64decode(shot['data']))
            print(f"Saved {filename}")

        ws.close()
    finally:
        proc.terminate()

if __name__ == '__main__':
    w = int(sys.argv[1]) if len(sys.argv) > 1 else 390
    h = int(sys.argv[2]) if len(sys.argv) > 2 else 844
    prefix = sys.argv[3] if len(sys.argv) > 3 else f"viewport_{w}"
    run_inspection(w, h, prefix)
