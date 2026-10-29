import subprocess, time, json, urllib.request, base64, os, sys
import websocket

from browser_finder import get_browser_exe
EDGE_EXE = get_browser_exe()
USER_DATA = r'C:\Users\Dell\AppData\Local\Temp\edge_cdp_profile_acceptance'
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
        'http://localhost:3000/'
    ])
    time.sleep(2.5)

    try:
        tabs = None
        for attempt in range(15):
            try:
                with urllib.request.urlopen('http://localhost:9222/json') as resp:
                    tabs = json.loads(resp.read().decode())
                if tabs:
                    break
            except Exception:
                time.sleep(1)
        
        if not tabs:
            raise RuntimeError("Failed to connect to Edge DevTools port 9222")
        
        target = None
        for t in tabs:
            if 'localhost:3000' in t.get('url', '') or t.get('type') == 'page':
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
            if url:
                send_cmd('Page.navigate', {'url': url})
                time.sleep(1.5)

            if eval_code:
                send_cmd('Runtime.evaluate', {'expression': eval_code, 'awaitPromise': True})
                time.sleep(1.2)
            
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
                time.sleep(0.6)

            shot = send_cmd('Page.captureScreenshot', {'format': 'png'})
            if 'data' in shot:
                raw = base64.b64decode(shot['data'])
                pub_path = os.path.join('packages', 'frontend', 'public', f'{filename}.png')
                with open(pub_path, 'wb') as f:
                    f.write(raw)
                art_path = os.path.join(ARTIFACT_DIR, f'{filename}.png')
                with open(art_path, 'wb') as f:
                    f.write(raw)
                print(f"Captured {filename}: {pub_path} and {art_path}")

        # Ensure starting in Dark mode with Royal Blue
        setup_default_dark = """
        (() => {
            window.localStorage.setItem('socialgraph_theme_mode', 'dark');
            window.localStorage.setItem('socialgraph_theme_palette', 'royal-blue');
            const html = document.documentElement;
            html.classList.add('dark');
            html.setAttribute('data-theme', 'dark');
            html.setAttribute('data-palette', 'royal-blue');
        })()
        """
        send_cmd('Runtime.evaluate', {'expression': setup_default_dark})

        # 1. 1440x900 Desktop Home Feed (Noir Dark Mode, Pure #000000 Canvas)
        capture('http://localhost:3000/', 1440, 900, 'acceptance_desktop_1440_home', wait_selector='article')

        # 2. 1440x900 Desktop Scrolled Feed
        scroll_feed_js = "window.scrollTo(0, 450);"
        capture(None, 1440, 900, 'acceptance_desktop_1440_feed_scrolled', eval_code=scroll_feed_js)

        # 3. 1440x900 Desktop Rail Scrolled Internally
        scroll_rail_js = """
        (() => {
            const rail = document.querySelector('aside[aria-label="Contextual Sidebar"]');
            if (rail) rail.scrollTop = 400;
        })()
        """
        capture(None, 1440, 900, 'acceptance_desktop_1440_rail_scrolled', eval_code=scroll_rail_js)

        # 4. 1280x720 Short Desktop Home Feed (Initial viewport)
        reset_scroll_js = """
        (() => {
            window.scrollTo(0, 0);
            const rail = document.querySelector('aside[aria-label="Contextual Sidebar"]');
            if (rail) rail.scrollTop = 0;
        })()
        """
        capture('http://localhost:3000/', 1280, 720, 'acceptance_desktop_1280_short', eval_code=reset_scroll_js, wait_selector='article')

        # 5. 1280x720 Short Desktop Rail Scrolled to Bottom
        scroll_short_rail_js = """
        (() => {
            const rail = document.querySelector('aside[aria-label="Contextual Sidebar"]');
            if (rail) rail.scrollTop = rail.scrollHeight;
        })()
        """
        capture(None, 1280, 720, 'acceptance_desktop_1280_rail_bottom', eval_code=scroll_short_rail_js)

        # 6. 1440x900 Desktop Pure Monochrome Light Mode (White canvas)
        toggle_light_js = """
        (() => {
            window.scrollTo(0, 0);
            const btn = document.querySelector('button[aria-label="Switch to light mode"]');
            if (btn) btn.click();
        })()
        """
        capture('http://localhost:3000/', 1440, 900, 'acceptance_desktop_1440_light', eval_code=toggle_light_js, wait_selector='article')

        # 7. Reset back to Dark mode
        toggle_dark_js = """
        (() => {
            const btn = document.querySelector('button[aria-label="Switch to dark mode"]');
            if (btn) btn.click();
        })()
        """
        send_cmd('Runtime.evaluate', {'expression': toggle_dark_js})
        time.sleep(1)

        # 8. 1440x900 Desktop Settings Appearance Page (/settings/appearance) with swatches & detail panel active
        hover_palette_js = """
        (() => {
            window.scrollTo(0, 360);
            const buttons = document.querySelectorAll('button[aria-label*="Select"]');
            if (buttons.length > 2) {
                buttons[2].focus();
                buttons[2].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            }
        })()
        """
        capture('http://localhost:3000/settings/appearance', 1440, 900, 'acceptance_desktop_1440_appearance', eval_code=hover_palette_js, wait_selector='h1')

        # 9. Register / Login test user to access authenticated composer
        auth_user_js = """
        new Promise((resolve) => {
            const ts = Date.now();
            const uname = 'noir_actor_' + ts;
            const pass = 'PassNoir_' + ts + '!';
            const uInput = document.querySelector('input[name="username"]');
            const pInput = document.querySelector('input[name="password"]');
            const pConf = document.querySelector('input[name="password_confirmation"]');
            const form = document.querySelector('form');
            if (uInput && pInput && pConf && form) {
                uInput.value = uname;
                uInput.dispatchEvent(new Event('input', { bubbles: true }));
                pInput.value = pass;
                pInput.dispatchEvent(new Event('input', { bubbles: true }));
                pConf.value = pass;
                pConf.dispatchEvent(new Event('input', { bubbles: true }));
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.click();
                let checks = 0;
                const iv = setInterval(() => {
                    checks++;
                    if (window.location.pathname === '/' || document.querySelector('article') || checks > 50) {
                        clearInterval(iv);
                        resolve(true);
                    }
                }, 100);
            } else {
                resolve(false);
            }
        })
        """
        capture('http://localhost:3000/register', 1440, 900, 'acceptance_auth_success', eval_code=auth_user_js, wait_selector='form')

        # 10. Multi-image Create Post Composer (/create)
        populate_multi_images_js = """
        new Promise((resolve) => {
            function setVal(el, val) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                nativeInputValueSetter.call(el, val);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Click Visual pin tab
            const visualTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Visual Pin'));
            if (visualTab) visualTab.click();

            setTimeout(() => {
                const titleInput = document.querySelector('input#post-title');
                if (titleInput) setVal(titleInput, 'Architectural Harmony — Minimalist Monoliths');

                const urlInput = document.querySelector('input#visual-image-url');
                if (urlInput) {
                    setVal(urlInput, 'http://localhost:3000/brand/icon.svg');
                }

                let checks = 0;
                const iv = setInterval(() => {
                    checks++;
                    const addInput = document.querySelector('input[placeholder*="additional image URL"]');
                    if (addInput || checks > 30) {
                        clearInterval(iv);
                        if (addInput) {
                            setVal(addInput, 'http://localhost:3000/brand/logo.svg');
                            const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Image'));
                            if (addBtn) addBtn.click();
                        }
                        setTimeout(() => {
                            window.scrollTo(0, 320);
                            resolve(true);
                        }, 800);
                    }
                }, 100);
            }, 600);
        })
        """
        capture('http://localhost:3000/create', 1440, 900, 'acceptance_desktop_1440_create_composer', eval_code=populate_multi_images_js, wait_selector='input#post-title')

        # 11. 1440x900 Desktop Discover Page (/explore, Pinterest-style masonry preserved)
        capture('http://localhost:3000/explore', 1440, 900, 'acceptance_desktop_1440_discover_masonry', wait_selector='div[data-testid^="discovery-pin-"]')

        # 12. Visual Post Modal (Instagram-style two-panel dialog from Discover)
        open_visual_modal_js = """
        new Promise((resolve) => {
            const pinCard = document.querySelector('div[data-testid^="discovery-pin-"]');
            if (pinCard) {
                pinCard.click();
                let tries = 0;
                const iv = setInterval(() => {
                    tries++;
                    const dialog = document.querySelector('div[role="dialog"]');
                    if (dialog || tries > 40) {
                        clearInterval(iv);
                        resolve(true);
                    }
                }, 100);
            } else {
                resolve(false);
            }
        })
        """
        capture(None, 1440, 900, 'acceptance_post_modal_visual', eval_code=open_visual_modal_js, wait_selector='div[role="dialog"]')

        # Close visual modal via Escape
        send_cmd('Input.dispatchKeyEvent', {'type': 'rawKeyDown', 'windowsVirtualKeyCode': 27, 'key': 'Escape'})
        send_cmd('Input.dispatchKeyEvent', {'type': 'keyUp', 'windowsVirtualKeyCode': 27, 'key': 'Escape'})
        time.sleep(1.0)

        # 13. Discussion Post Modal (Threaded discussion dialog from Home feed)
        open_discussion_modal_js = """
        new Promise((resolve) => {
            const discCard = document.querySelector('article[data-testid^="post-discussion-"]');
            if (discCard) {
                const titleLink = discCard.querySelector('h2') || discCard;
                titleLink.click();
                let tries = 0;
                const iv = setInterval(() => {
                    tries++;
                    const dialog = document.querySelector('div[role="dialog"]');
                    if (dialog || tries > 40) {
                        clearInterval(iv);
                        resolve(true);
                    }
                }, 100);
            } else {
                resolve(false);
            }
        })
        """
        capture('http://localhost:3000/', 1440, 900, 'acceptance_post_modal_discussion', eval_code=open_discussion_modal_js, wait_selector='div[role="dialog"]')

        # Close discussion modal via Escape
        send_cmd('Input.dispatchKeyEvent', {'type': 'rawKeyDown', 'windowsVirtualKeyCode': 27, 'key': 'Escape'})
        send_cmd('Input.dispatchKeyEvent', {'type': 'keyUp', 'windowsVirtualKeyCode': 27, 'key': 'Escape'})
        time.sleep(1.0)

        # 14. 768x1024 Tablet Viewport (Home Feed)
        capture('http://localhost:3000/', 768, 1024, 'acceptance_tablet_768_home', wait_selector='article')

        # 15. 390x844 Mobile Viewport (iPhone 14)
        capture('http://localhost:3000/', 390, 844, 'acceptance_mobile_390_home', wait_selector='article')

        # 16. 320x700 Narrow Mobile Viewport (Minimum boundary check)
        capture('http://localhost:3000/', 320, 700, 'acceptance_mobile_320_narrow', wait_selector='article')

        # 17. Automated Quantitative Audit (Verify 0 backdrop, true black canvas, high contrast)
        audit_js = r"""
        (() => {
            const body = document.body;
            const rail = document.querySelector('aside[aria-label="Contextual Sidebar"]');
            const svg = document.querySelector('svg.animate-network-breathe') || document.querySelector('div.network-edges');
            
            function getLuminance(rgbStr) {
                const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (!match) return 0;
                const r = parseInt(match[1]) / 255;
                const g = parseInt(match[2]) / 255;
                const b = parseInt(match[3]) / 255;
                const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
                return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
            }
            function getContrast(rgb1, rgb2) {
                const l1 = getLuminance(rgb1);
                const l2 = getLuminance(rgb2);
                const lighter = Math.max(l1, l2);
                const darker = Math.min(l1, l2);
                return (lighter + 0.05) / (darker + 0.05);
            }

            const canvasColor = window.getComputedStyle(body).backgroundColor;
            const card = document.querySelector('article');
            const cardBg = card ? window.getComputedStyle(card).backgroundColor : null;
            const titleEl = card ? card.querySelector('h2, h3, h1') : null;
            const titleColor = titleEl ? window.getComputedStyle(titleEl).color : null;
            const metaEl = card ? card.querySelector('time') || card.querySelector('span') : null;
            const metaColor = metaEl ? window.getComputedStyle(metaEl).color : null;

            return {
                backdropPresent: !!svg,
                railPresent: !!rail,
                railSticky: rail ? window.getComputedStyle(rail).position : null,
                railTop: rail ? window.getComputedStyle(rail).top : null,
                railMaxHeight: rail ? window.getComputedStyle(rail).maxHeight : null,
                railOverflowY: rail ? window.getComputedStyle(rail).overflowY : null,
                colors: {
                    canvas: canvasColor,
                    card: cardBg,
                    title: titleColor,
                    meta: metaColor
                },
                contrast: {
                    titleOnCard: (titleColor && cardBg) ? Math.round(getContrast(titleColor, cardBg) * 10) / 10 : null,
                    metaOnCard: (metaColor && cardBg) ? Math.round(getContrast(metaColor, cardBg) * 10) / 10 : null
                }
            };
        })()
        """
        audit_res = send_cmd('Runtime.evaluate', {'expression': audit_js, 'returnByValue': True})
        print("QUANTITATIVE AUDIT RESULT:")
        print(json.dumps(audit_res.get('result', {}).get('value', {}), indent=2))

        # Reset theme back to royal-blue dark
        reset_js = """
        (() => {
            window.localStorage.setItem('socialgraph_theme_mode', 'dark');
            window.localStorage.setItem('socialgraph_theme_palette', 'royal-blue');
        })()
        """
        send_cmd('Runtime.evaluate', {'expression': reset_js})

        ws.close()
    finally:
        proc.terminate()

if __name__ == '__main__':
    run_suite()
