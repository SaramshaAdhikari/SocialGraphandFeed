import subprocess, time, json, urllib.request, base64, os, sys
from PIL import Image, ImageDraw, ImageFont
import websocket

EDGE_EXE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
FONT_PATH = r'C:\Windows\Fonts\consola.ttf'
BOLD_FONT_PATH = r'C:\Windows\Fonts\consolab.ttf'

def get_font(size=14, bold=False):
    path = BOLD_FONT_PATH if bold and os.path.exists(BOLD_FONT_PATH) else FONT_PATH
    if os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()

def capture_browser(url, output_path, wait_selector=None, width=1280, height=800, delay=2.5):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    user_data = os.path.join(os.environ.get('TEMP', r'C:\Temp'), f'edge_cdp_{int(time.time()*1000)%100000}')
    proc = subprocess.Popen([
        EDGE_EXE,
        '--headless=new',
        '--remote-debugging-port=9222',
        '--remote-allow-origins=*',
        f'--user-data-dir={user_data}',
        f'--window-size={width},{height}',
        url
    ])
    time.sleep(delay)
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
            raise RuntimeError("Could not connect to browser CDP port 9222")
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
        time.sleep(1.0)
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

        res = send_cmd('Page.captureScreenshot', {'format': 'png'})
        with open(output_path, 'wb') as f:
            f.write(base64.b64decode(res['data']))
        ws.close()
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            pass

def capture_terminal(title, test_id, command, output_lines, status, output_path, metrics=None):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    width = 1100
    line_height = 20
    header_height = 65
    footer_height = 50
    content_lines = output_lines if isinstance(output_lines, list) else output_lines.splitlines()
    height = header_height + (len(content_lines) + 4) * line_height + footer_height

    img = Image.new('RGB', (width, height), color='#0f141c')
    draw = ImageDraw.Draw(img)

    # Window title bar
    draw.rectangle([(0, 0), (width, 40)], fill='#1a2130')
    draw.ellipse([(14, 14), (26, 26)], fill='#ff5f56')
    draw.ellipse([(34, 14), (46, 26)], fill='#ffbd2e')
    draw.ellipse([(54, 14), (66, 26)], fill='#27c93f')

    font_title = get_font(13, bold=True)
    title_text = f"SocialGraph QA Runner — {test_id}: {title}"
    draw.text((80, 12), title_text, fill='#cbd5e1', font=font_title)

    # Status badge in header
    badge_bg = '#166534' if status == 'PASS' else ('#991b1b' if status == 'FAIL' else '#854d0e')
    badge_fg = '#86efac' if status == 'PASS' else ('#fca5a5' if status == 'FAIL' else '#fde047')
    draw.rounded_rectangle([(width - 110, 10), (width - 20, 30)], radius=4, fill=badge_bg)
    draw.text((width - 95, 12), status, fill=badge_fg, font=get_font(12, bold=True))

    font_body = get_font(13)
    font_bold = get_font(13, bold=True)

    y = header_height
    # Prompt command
    draw.text((25, y), "$", fill='#38bdf8', font=font_bold)
    draw.text((45, y), command, fill='#f8fafc', font=font_bold)
    y += line_height + 5

    draw.line([(25, y), (width - 25, y)], fill='#334155', width=1)
    y += 10

    for line in content_lines:
        color = '#e2e8f0'
        if 'PASS' in line or '✓' in line or 'passed' in line or 'Success' in line:
            color = '#4ade80'
        elif 'FAIL' in line or '✗' in line or 'failed' in line or 'Error' in line:
            color = '#f87171'
        elif 'WARN' in line or '⚠' in line:
            color = '#fbbf24'
        elif line.startswith('>') or line.startswith('RUN') or line.startswith('Test Files'):
            color = '#94a3b8'
        elif line.startswith('[') and ']' in line:
            color = '#38bdf8'
        draw.text((25, y), line, fill=color, font=font_body)
        y += line_height

    # Footer separator
    y += 10
    draw.line([(25, y), (width - 25, y)], fill='#334155', width=1)
    y += 10

    metrics_text = metrics or f"Executed against Commit 94540883 | Status: {status} | Timestamp: {time.strftime('%Y-%m-%d %H:%M:%SZ', time.gmtime())}"
    draw.text((25, y), metrics_text, fill='#94a3b8', font=get_font(11))

    img.save(output_path, 'PNG')
    return output_path
