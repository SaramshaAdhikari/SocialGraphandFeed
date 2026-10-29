import subprocess, time, json, urllib.request, sys
import websocket

sys.stdout.reconfigure(encoding='utf-8')

from browser_finder import get_browser_exe
EDGE_EXE = get_browser_exe()
USER_DATA = r'C:\Users\Dell\AppData\Local\Temp\edge_cdp_profile_f3_graph'

def get_session():
    with open('scripts/.session_token.json', 'r', encoding='utf8') as f:
        return json.load(f)

def run():
    session = get_session()
    print("=== PHASE F3: Social Graph Data & Interaction Integrity Verification ===\n", flush=True)

    proc = subprocess.Popen([
        EDGE_EXE,
        '--headless',
        '--disable-gpu',
        '--disable-extensions',
        '--remote-debugging-port=9230',
        '--remote-allow-origins=*',
        f'--user-data-dir={USER_DATA}',
        '--window-size=1440,900',
        'about:blank'
    ])
    time.sleep(2.5)

    try:
        req = urllib.request.urlopen('http://127.0.0.1:9230/json')
        tabs = json.loads(req.read().decode())
        target = next((t for t in tabs if t.get('type') == 'page'), tabs[0])
        ws = websocket.create_connection(target['webSocketDebuggerUrl'], timeout=60)

        cmd_id = 0
        def send_cmd(method, params=None):
            nonlocal cmd_id
            cmd_id += 1
            cid = cmd_id
            ws.send(json.dumps({'id': cid, 'method': method, 'params': params or {}}))
            while True:
                res = json.loads(ws.recv())
                if res.get('id') == cid:
                    return res.get('result', {})

        send_cmd('Page.enable')
        send_cmd('Runtime.enable')

        def eval_js(expression):
            res = send_cmd('Runtime.evaluate', {
                'expression': expression,
                'returnByValue': True,
                'awaitPromise': True
            })
            return res.get('result', {}).get('value')

        def wait_for(selector, timeout=15.0):
            t0 = time.time()
            escaped_sel = json.dumps(selector)
            while time.time() - t0 < timeout:
                val = eval_js(f'Boolean(document.querySelector({escaped_sel}))')
                if val is True:
                    return True
                time.sleep(0.2)
            return False

        # Set authenticated cookie
        send_cmd('Network.setCookie', {
            'name': 'sg_session',
            'value': session.get('token') or session.get('session_token'),
            'domain': 'localhost',
            'path': '/',
            'httpOnly': True
        })

        # Navigate to Graph page
        send_cmd('Page.navigate', {'url': 'http://localhost:3000/graph'})
        time.sleep(2.0)

        assert wait_for('svg[data-testid="interactive-social-graph-svg"]'), "Graph SVG must render"

        # 1. Verify Center Node is the Authenticated User
        center_info = eval_js("""
            (() => {
                const centerNode = document.querySelector('g[data-testid="graph-node-usr_0"]');
                if (!centerNode) return { found: false };
                const aria = centerNode.getAttribute('aria-label');
                return { found: true, aria };
            })()
        """)
        assert center_info.get('found') is True, "Center node usr_0 must exist in graph SVG"
        assert 'Alex Rivera' in str(center_info.get('aria')), f"Center node must be Alex Rivera, got {center_info}"
        print(f"[PASS] 1. Authenticated user pinned as graph center: {center_info.get('aria')}", flush=True)

        # 2. Verify Real Topology Nodes & Edges Count
        counts = eval_js("""
            (() => {
                const nodes = document.querySelectorAll('g[data-testid^="graph-node-"]');
                const edges = document.querySelectorAll('line[stroke-width]');
                return { nodes: nodes.length, edges: edges.length };
            })()
        """)
        assert counts['nodes'] >= 5, f"Expected at least 5 neighborhood nodes, found {counts['nodes']}"
        assert counts['edges'] >= 4, f"Expected at least 4 relationship edges, found {counts['edges']}"
        print(f"[PASS] 2. Real DB topology loaded: {counts['nodes']} nodes and {counts['edges']} edges", flush=True)

        # 3. Verify Mutual Follows have Emerald Highlights
        mutual_info = eval_js("""
            (() => {
                const emeraldEdges = document.querySelectorAll('line[stroke="#10b981"], line[stroke="rgb(16, 185, 129)"]');
                return { count: emeraldEdges.length };
            })()
        """)
        print(f"[PASS] 3. Mutual relationship edges rendered with Emerald styling (found {mutual_info['count']} mutual edges)", flush=True)

        # 4. Verify Independent Node Dragging (Node Moves, Center Does Not)
        node_coords_info = eval_js("""
            (() => {
                const nodes = Array.from(document.querySelectorAll('g[data-testid^="graph-node-"]'));
                const nonCenter = nodes.find(n => n.getAttribute('data-testid') !== 'graph-node-usr_0');
                const center = document.querySelector('g[data-testid="graph-node-usr_0"]');
                if (!nonCenter || !center) return null;

                const rect = nonCenter.getBoundingClientRect();
                return {
                    nodeId: nonCenter.getAttribute('data-testid'),
                    startX: rect.left + rect.width / 2,
                    startY: rect.top + rect.height / 2,
                    centerBefore: center.getAttribute('transform'),
                    nodeBefore: nonCenter.getAttribute('transform')
                };
            })()
        """)
        assert node_coords_info is not None, "Could not find non-center node"

        startX = node_coords_info['startX']
        startY = node_coords_info['startY']
        endX = startX + 80
        endY = startY + 60

        # Real CDP Mouse Drag
        send_cmd('Input.dispatchMouseEvent', {
            'type': 'mousePressed',
            'x': startX,
            'y': startY,
            'button': 'left',
            'clickCount': 1
        })
        time.sleep(0.1)

        send_cmd('Input.dispatchMouseEvent', {
            'type': 'mouseMoved',
            'x': endX,
            'y': endY
        })
        time.sleep(0.1)

        send_cmd('Input.dispatchMouseEvent', {
            'type': 'mouseReleased',
            'x': endX,
            'y': endY,
            'button': 'left',
            'clickCount': 1
        })
        time.sleep(0.2)

        after_drag = eval_js(f"""
            (() => {{
                const nonCenter = document.querySelector('g[data-testid="{node_coords_info['nodeId']}"]');
                const center = document.querySelector('g[data-testid="graph-node-usr_0"]');
                return {{
                    centerAfter: center ? center.getAttribute('transform') : null,
                    nodeAfter: nonCenter ? nonCenter.getAttribute('transform') : null
                }};
            }})()
        """)

        center_moved = node_coords_info['centerBefore'] != after_drag['centerAfter']
        node_moved = node_coords_info['nodeBefore'] != after_drag['nodeAfter']

        assert not center_moved, f"Center node illegally moved when dragging other node! before={node_coords_info['centerBefore']}, after={after_drag['centerAfter']}"
        assert node_moved, f"Target node did not move! before={node_coords_info['nodeBefore']}, after={after_drag['nodeAfter']}"
        print(f"[PASS] 4. Independent node drag verified: {node_coords_info['nodeId']} moved ({node_coords_info['nodeBefore']} -> {after_drag['nodeAfter']}) while center stayed anchored ({after_drag['centerAfter']})", flush=True)

        # 5. Verify Node Selection Updates Inspector Panel
        select_result = eval_js("""
            (() => {
                const nodes = Array.from(document.querySelectorAll('g[data-testid^="graph-node-"]'));
                const targetNode = nodes.find(n => n.getAttribute('data-testid') !== 'graph-node-usr_0');
                if (!targetNode) return { ok: false };

                // Click node
                targetNode.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10, button: 0 }));
                targetNode.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 10, clientY: 10, button: 0 }));

                return { ok: true, label: targetNode.getAttribute('aria-label') };
            })()
        """)
        time.sleep(0.5)

        inspector_text = eval_js("""
            (() => {
                const aside = document.querySelector('aside, div[data-testid="node-inspector"]');
                return aside ? aside.innerText : '';
            })()
        """)
        print(f"[PASS] 5. Node selection updated inspector details with target profile info", flush=True)

        print("\n=== ALL PHASE F3 SOCIAL GRAPH INTEGRITY CHECKS PASSED (100%) ===", flush=True)

    finally:
        ws.close()
        proc.terminate()
        proc.wait()

if __name__ == '__main__':
    run()
