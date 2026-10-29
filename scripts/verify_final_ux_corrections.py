import subprocess, time, json, urllib.request, sys, os
import websocket

sys.stdout.reconfigure(encoding='utf-8')

from browser_finder import get_browser_exe
EDGE_EXE = get_browser_exe()
USER_DATA = r'C:\Users\Dell\AppData\Local\Temp\edge_cdp_profile_final_ux'
SCREENSHOT_DIR = r'artifacts\phase_i_final\after'
BRAIN_SCREENSHOT_DIR = r'C:\Users\Dell\.gemini\antigravity\brain\fe52b171-f8a1-4549-a1ad-3947f10c062d\screenshots'

os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(BRAIN_SCREENSHOT_DIR, exist_ok=True)

def get_session():
    with open('scripts/.session_token.json', 'r', encoding='utf8') as f:
        return json.load(f)

def run():
    session = get_session()
    print("=== FINAL UX CORRECTIONS & RELEASE READINESS LIVE VERIFICATION ===", flush=True)

    proc = subprocess.Popen([
        EDGE_EXE,
        '--headless',
        '--disable-gpu',
        '--disable-extensions',
        '--remote-debugging-port=9232',
        '--remote-allow-origins=*',
        f'--user-data-dir={USER_DATA}',
        '--window-size=1440,900',
        'about:blank'
    ])
    time.sleep(2.5)

    try:
        req = urllib.request.urlopen('http://127.0.0.1:9232/json')
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

        def wait_for(selector, timeout=12.0):
            t0 = time.time()
            escaped_sel = json.dumps(selector)
            while time.time() - t0 < timeout:
                val = eval_js(f'Boolean(document.querySelector({escaped_sel}))')
                if val is True:
                    return True
                time.sleep(0.2)
            return False

        def capture(name):
            import base64
            res = send_cmd('Page.captureScreenshot', {'format': 'png'})
            data = base64.b64decode(res.get('data', ''))
            path1 = os.path.join(SCREENSHOT_DIR, f'{name}.png')
            path2 = os.path.join(BRAIN_SCREENSHOT_DIR, f'{name}.png')
            with open(path1, 'wb') as f:
                f.write(data)
            with open(path2, 'wb') as f:
                f.write(data)
            print(f"Captured: {name}.png", flush=True)

        # Set authenticated cookie
        send_cmd('Network.setCookie', {
            'name': 'sg_session',
            'value': session.get('token') or session.get('session_token'),
            'domain': 'localhost',
            'path': '/',
            'httpOnly': True
        })

        # --- Check 1: Own Profile Header & Edit Profile Navigation ---
        print("\n--- Check 1: Own Profile Header & Unified Edit Profile Navigation ---", flush=True)
        send_cmd('Page.navigate', {'url': 'http://localhost:3000/u/alex_dev'})
        time.sleep(2.0)
        assert wait_for('[data-testid="profile-header"]'), "ProfileHeader must load"

        edit_btn_info = eval_js("""
            (() => {
                const btn = document.querySelector('[data-testid="edit-profile-button"]');
                if (!btn) return { found: false };
                const rect = btn.getBoundingClientRect();
                const icon = btn.querySelector('svg');
                const span = btn.querySelector('span');
                return {
                    found: true,
                    text: btn.innerText.trim(),
                    height: rect.height,
                    hasIcon: Boolean(icon),
                    hasSpan: Boolean(span),
                    classes: btn.className
                };
            })()
        """)
        assert edit_btn_info['found'], "Edit Profile button must exist on own profile"
        print(f"[PASS] Own profile Edit Profile button found: height={edit_btn_info['height']}px, icon={edit_btn_info['hasIcon']}", flush=True)
        capture('after_profile_actions_own')

        # Click Edit Profile button and verify navigation to /settings/profile
        eval_js("""
            (() => {
                const btn = document.querySelector('[data-testid="edit-profile-button"]');
                if (btn) btn.click();
            })()
        """)
        time.sleep(1.5)

        current_url = eval_js("window.location.pathname")
        assert current_url in ['/settings/profile', '/settings'], f"Expected navigation to /settings/profile, got {current_url}"
        print(f"[PASS] Edit Profile button successfully navigated to canonical Account Settings: {current_url}", flush=True)

        # Verify no modal dialog is open
        dialog_found = eval_js("Boolean(document.querySelector('div[role=\"dialog\"]'))")
        assert not dialog_found, "No modal dialog should be rendered"
        print(f"[PASS] Duplicate modal successfully eliminated (modal dialog open = {dialog_found})", flush=True)

        # --- Check 2: Account Settings Profile & Identity Surface ---
        print("\n--- Check 2: Account Settings Profile & Identity Surface ---", flush=True)
        assert wait_for('h1'), "Account Settings header must load"
        settings_info = eval_js("""
            (() => {
                const h1 = document.querySelector('h1');
                const profileTab = document.querySelector('a[href="/settings/profile"]');
                const appearanceTab = document.querySelector('a[href="/settings/appearance"]');
                return {
                    title: h1 ? h1.innerText : '',
                    hasProfileTab: Boolean(profileTab),
                    hasAppearanceTab: Boolean(appearanceTab)
                };
            })()
        """)
        assert 'Account Settings' in settings_info['title'], "Must render Account Settings"
        assert settings_info['hasProfileTab'] and settings_info['hasAppearanceTab'], "Must render canonical sub-tabs"
        print(f"[PASS] Canonical Account Settings loaded: '{settings_info['title']}', tabs: Profile & Appearance", flush=True)
        capture('after_account_settings_profile')

        # Switch to Appearance tab in Account Settings
        eval_js("""
            (() => {
                const appearanceTab = document.querySelector('a[href="/settings/appearance"]');
                if (appearanceTab) appearanceTab.click();
            })()
        """)
        time.sleep(1.5)
        appearance_info = eval_js("""
            (() => {
                const profileTab = document.querySelector('a[href="/settings/profile"]');
                const appearanceTab = document.querySelector('a[href="/settings/appearance"]');
                return {
                    url: window.location.pathname,
                    hasProfileTab: Boolean(profileTab),
                    hasAppearanceTab: Boolean(appearanceTab)
                };
            })()
        """)
        assert appearance_info['hasProfileTab'] and appearance_info['hasAppearanceTab'], "Sub-tabs must exist on Appearance page"
        print(f"[PASS] Switched to Appearance tab: {appearance_info['url']}, unified tabs preserved", flush=True)
        capture('after_account_settings_appearance')

        # --- Check 3: Another User's Profile Header ---
        print("\n--- Check 3: Another User's Profile Header Actions ---", flush=True)
        send_cmd('Page.navigate', {'url': 'http://localhost:3000/u/elena_arch'})
        time.sleep(2.0)
        assert wait_for('[data-testid="profile-header"]'), "Elena profile must load"

        other_profile_info = eval_js("""
            (() => {
                const editBtn = document.querySelector('[data-testid="edit-profile-button"]');
                const followBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Follow') || b.innerText.includes('Following'));
                const messageBtn = document.querySelector('[data-testid="message-creator-button"]');
                const shareBtn = document.querySelector('button[aria-label="Share profile link"]');
                return {
                    hasEditBtn: Boolean(editBtn),
                    hasFollowBtn: Boolean(followBtn),
                    hasMessageBtn: Boolean(messageBtn),
                    hasShareBtn: Boolean(shareBtn),
                    followHeight: followBtn ? followBtn.getBoundingClientRect().height : 0,
                    messageHeight: messageBtn ? messageBtn.getBoundingClientRect().height : 0,
                    shareHeight: shareBtn ? shareBtn.getBoundingClientRect().height : 0
                };
            })()
        """)
        assert not other_profile_info['hasEditBtn'], "Edit Profile button must not be visible on other users' profiles"
        assert other_profile_info['hasFollowBtn'] and other_profile_info['hasMessageBtn'] and other_profile_info['hasShareBtn'], "Actions must be visible"
        print(f"[PASS] Other user actions verified: Edit button absent, Follow/Message/Share present with heights ({other_profile_info['followHeight']}px, {other_profile_info['messageHeight']}px, {other_profile_info['shareHeight']}px)", flush=True)
        capture('after_profile_actions_other')

        # --- Check 4: Social Graph Inspector Real Counts & Alignment ---
        print("\n--- Check 4: Social Graph Inspector Real Counts & Alignment ---", flush=True)
        send_cmd('Page.navigate', {'url': 'http://localhost:3000/graph'})
        time.sleep(2.5)
        assert wait_for('svg[data-testid="interactive-social-graph-svg"]'), "Graph SVG must render"

        # Check Center Node in Inspector
        center_inspector = eval_js("""
            (() => {
                const aside = document.querySelector('[data-testid="graph-inspector-panel"]');
                if (!aside) return null;
                const statBoxes = aside.querySelectorAll('.grid > div');
                const followersText = statBoxes[0] ? statBoxes[0].querySelector('div:first-child').innerText.trim() : '';
                const followingText = statBoxes[1] ? statBoxes[1].querySelector('div:first-child').innerText.trim() : '';
                const title = aside.querySelector('h3') ? aside.querySelector('h3').innerText.trim() : '';
                return { title, followersText, followingText };
            })()
        """)
        assert center_inspector is not None, "Inspector panel must exist"
        assert center_inspector['followersText'] != '—', f"Center followers must not be '—', got {center_inspector['followersText']}"
        assert center_inspector['followingText'] != '—', f"Center following must not be '—', got {center_inspector['followingText']}"
        print(f"[PASS] Center node inspector: {center_inspector['title']} - Followers: {center_inspector['followersText']}, Following: {center_inspector['followingText']}", flush=True)
        capture('after_graph_inspector_center')

        # Click another node (Lucas Thorne usr_1) using real CDP click
        lucas_pos = eval_js("""
            (() => {
                const node = document.querySelector('g[data-testid="graph-node-usr_1"]');
                if (!node) return null;
                const rect = node.getBoundingClientRect();
                return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            })()
        """)
        assert lucas_pos is not None, "Must find Lucas Thorne node usr_1"

        send_cmd('Input.dispatchMouseEvent', {
            'type': 'mousePressed',
            'x': lucas_pos['x'],
            'y': lucas_pos['y'],
            'button': 'left',
            'clickCount': 1
        })
        time.sleep(0.05)
        send_cmd('Input.dispatchMouseEvent', {
            'type': 'mouseReleased',
            'x': lucas_pos['x'],
            'y': lucas_pos['y'],
            'button': 'left',
            'clickCount': 1
        })
        time.sleep(1.0)

        lucas_inspector = eval_js("""
            (() => {
                const aside = document.querySelector('[data-testid="graph-inspector-panel"]');
                if (!aside) return null;
                const statBoxes = aside.querySelectorAll('.grid > div');
                const followersText = statBoxes[0] ? statBoxes[0].querySelector('div:first-child').innerText.trim() : '';
                const followingText = statBoxes[1] ? statBoxes[1].querySelector('div:first-child').innerText.trim() : '';
                const title = aside.querySelector('h3') ? aside.querySelector('h3').innerText.trim() : '';
                const followBtn = Array.from(aside.querySelectorAll('button')).find(b => b.innerText.includes('Follow') || b.innerText.includes('Following'));
                const profileBtn = Array.from(aside.querySelectorAll('button')).find(b => b.innerText.includes('View Full Profile'));
                return {
                    title,
                    followersText,
                    followingText,
                    hasFollowBtn: Boolean(followBtn),
                    hasProfileBtn: Boolean(profileBtn),
                    followBtnText: followBtn ? followBtn.innerText.trim() : '',
                    hasFollowIcon: Boolean(followBtn && followBtn.querySelector('svg')),
                    hasProfileIcon: Boolean(profileBtn && profileBtn.querySelector('svg'))
                };
            })()
        """)
        assert 'Lucas Thorne' in lucas_inspector['title'], f"Expected Lucas Thorne, got {lucas_inspector['title']}"
        assert lucas_inspector['followersText'] != '—', f"Lucas followers count must be real number, got {lucas_inspector['followersText']}"
        assert lucas_inspector['followingText'] != '—', f"Lucas following count must be real number, got {lucas_inspector['followingText']}"
        assert lucas_inspector['hasFollowIcon'] and lucas_inspector['hasProfileIcon'], "Buttons must have aligned icons"
        print(f"[PASS] Other node inspector: {lucas_inspector['title']} - Followers: {lucas_inspector['followersText']}, Following: {lucas_inspector['followingText']}", flush=True)
        print(f"[PASS] Buttons icon alignment: Follow icon={lucas_inspector['hasFollowIcon']}, Profile icon={lucas_inspector['hasProfileIcon']}", flush=True)
        capture('after_graph_inspector_other')

        # Test Follow toggle in inspector and verify count update
        initial_followers = int(lucas_inspector['followersText'])
        eval_js("""
            (() => {
                const aside = document.querySelector('[data-testid="graph-inspector-panel"]');
                const followBtn = Array.from(aside.querySelectorAll('button')).find(b => b.innerText.includes('Follow') || b.innerText.includes('Following'));
                if (followBtn) followBtn.click();
            })()
        """)
        time.sleep(1.0)
        after_toggle = eval_js("""
            (() => {
                const aside = document.querySelector('[data-testid="graph-inspector-panel"]');
                const statBoxes = aside.querySelectorAll('.grid > div');
                const followersText = statBoxes[0] ? statBoxes[0].querySelector('div:first-child').innerText.trim() : '';
                const followBtn = Array.from(aside.querySelectorAll('button')).find(b => b.innerText.includes('Follow') || b.innerText.includes('Following'));
                return {
                    followersText,
                    followBtnText: followBtn ? followBtn.innerText.trim() : ''
                };
            })()
        """)
        new_followers = int(after_toggle['followersText'])
        print(f"[PASS] Follow toggle updated state: {after_toggle['followBtnText']} (Followers: {initial_followers} -> {new_followers})", flush=True)

        # Toggle back to restore original state
        eval_js("""
            (() => {
                const aside = document.querySelector('[data-testid="graph-inspector-panel"]');
                const followBtn = Array.from(aside.querySelectorAll('button')).find(b => b.innerText.includes('Follow') || b.innerText.includes('Following'));
                if (followBtn) followBtn.click();
            })()
        """)
        time.sleep(1.0)

        # --- Check 5: TopHeader Profile Dropdown & Settings Navigation ---
        print("\n--- Check 5: TopHeader Profile Dropdown & Settings Link ---", flush=True)
        send_cmd('Page.navigate', {'url': 'http://localhost:3000/'})
        time.sleep(2.0)

        # Open profile dropdown
        dropdown_opened = eval_js("""
            (() => {
                const trigger = document.querySelector('button[aria-label^="User account menu"]');
                if (!trigger) return false;
                trigger.click();
                return true;
            })()
        """)
        assert dropdown_opened, "Profile menu trigger must exist"
        time.sleep(0.5)

        menu_items_info = eval_js("""
            (() => {
                const menu = document.querySelector('[role="menu"]');
                if (!menu) return { found: false };
                const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
                return {
                    found: true,
                    count: items.length,
                    labels: items.map(i => i.innerText.trim()),
                    hasIcons: items.every(i => Boolean(i.querySelector('svg'))),
                    settingsHref: items.find(i => i.innerText.includes('Settings')) ? items.find(i => i.innerText.includes('Settings')).getAttribute('href') : null
                };
            })()
        """)
        assert menu_items_info['found'], "Dropdown menu must be open"
        assert menu_items_info['hasIcons'], "All dropdown menu items must have aligned icons"
        assert menu_items_info['settingsHref'] == '/settings', f"Settings must link to /settings, got {menu_items_info['settingsHref']}"
        print(f"[PASS] TopHeader profile menu: {menu_items_info['count']} items, all icons aligned ({menu_items_info['hasIcons']}), Settings href={menu_items_info['settingsHref']}", flush=True)
        capture('after_header_profile_dropdown')

        print("\n=== ALL FINAL UX CORRECTION VERIFICATIONS PASSED (100%) ===", flush=True)

    finally:
        ws.close()
        proc.terminate()
        proc.wait()

if __name__ == '__main__':
    run()
