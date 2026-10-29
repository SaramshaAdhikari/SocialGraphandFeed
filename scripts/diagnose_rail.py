from browser_finder import get_browser_exe
import urllib.request, json, websocket, time, subprocess

proc = subprocess.Popen([
    get_browser_exe(),
    '--headless', '--disable-gpu', '--remote-debugging-port=9222',
    '--remote-allow-origins=*', '--user-data-dir=C:\\Users\\Dell\\AppData\\Local\\Temp\\edge_rail_diag2',
    '--window-size=1440,900', 'http://localhost:3000/'
])
time.sleep(2.5)
try:
    with urllib.request.urlopen('http://localhost:9222/json') as r:
        tabs = json.loads(r.read().decode())
    target = None
    for t in tabs:
        if 'localhost:3000' in t.get('url', '') or t.get('type') == 'page':
            target = t
            break
    if not target: target = tabs[0]
    ws = websocket.create_connection(target['webSocketDebuggerUrl'])
    def cmd(m, p=None):
        mid = 1
        ws.send(json.dumps({'id': mid, 'method': m, 'params': p or {}}))
        while True:
            res = json.loads(ws.recv())
            if res.get('id') == mid: return res.get('result', {})
    
    cmd('Page.enable')
    cmd('Runtime.enable')
    cmd('Page.navigate', {'url': 'http://localhost:3000/'})
    time.sleep(2)
    
    check_code = """
    (() => {
        const rail = document.querySelector('aside[aria-label="Contextual Sidebar"]');
        if (!rail) {
            return {
                error: 'Rail not found',
                href: window.location.href,
                asides: Array.from(document.querySelectorAll('aside')).map(a => ({ className: a.className, ariaLabel: a.getAttribute('aria-label') })),
                viewportWidth: window.innerWidth,
                bodyWidth: document.body.clientWidth
            };
        }
        
        const parent = rail.parentElement;
        const main = document.querySelector('main');
        
        const r0 = rail.getBoundingClientRect();
        const p0 = parent.getBoundingClientRect();
        
        // Scroll page
        window.scrollTo(0, 400);
        const r1 = rail.getBoundingClientRect();
        const p1 = parent.getBoundingClientRect();
        
        // Test rail internal scrolling
        const initialRailScroll = rail.scrollTop;
        rail.scrollTop = 500;
        const afterRailScroll = rail.scrollTop;
        
        return {
            href: window.location.href,
            mainOverflowX: window.getComputedStyle(main).overflowX,
            mainOverflowY: window.getComputedStyle(main).overflowY,
            railStyle: {
                position: window.getComputedStyle(rail).position,
                top: window.getComputedStyle(rail).top,
                maxHeight: window.getComputedStyle(rail).maxHeight,
                overflowY: window.getComputedStyle(rail).overflowY
            },
            parentTag: parent.tagName,
            parentClass: parent.className,
            parentHeight: p0.height,
            railHeight: r0.height,
            railScrollHeight: rail.scrollHeight,
            railClientHeight: rail.clientHeight,
            initialTop: r0.top,
            scrolledTop: r1.top,
            scrollY: window.scrollY,
            stickyWorked: Math.abs(r1.top - 80) < 5,
            railCanScrollInternally: afterRailScroll > initialRailScroll,
            railScrollTopAfter500: afterRailScroll
        };
    })()
    """
    res = cmd('Runtime.evaluate', {'expression': check_code, 'returnByValue': True})
    print("DIAGNOSIS RESULT:", json.dumps(res.get('result', {}).get('value', {}), indent=2))
    ws.close()
finally:
    proc.terminate()
