import sys
import subprocess
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 19999
ALLOWED_SCHEMES = ('http://', 'https://', 'magnet:', 'rtsp://', 'rtmp://', 'mms://', 'acestream://')


def is_allowed_target(url: str) -> bool:
    if not url or not isinstance(url, str):
        return False
    u = url.strip()
    if not u or u.startswith('-'):
        return False
    return u.lower().startswith(ALLOWED_SCHEMES)


class MPVBridgeHandler(BaseHTTPRequestHandler):
    def _send_cors(self, status_code: int, body: bytes = b"") -> None:
        self.send_response(status_code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.end_headers()
        if body:
            self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_cors(200)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        target_url = params.get('url', [None])[0]
        if target_url:
            self._dispatch_mpv(target_url)
        else:
            self._send_cors(200, b"OK")

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8', errors='replace')
        params = urllib.parse.parse_qs(post_data)
        target_url = params.get('url', [None])[0]
        self._dispatch_mpv(target_url)

    def _dispatch_mpv(self, target_url):
        if is_allowed_target(target_url):
            subprocess.Popen(['mpv', '--force-window=yes', '--', target_url.strip()])
            self._send_cors(200, b"OK")
        else:
            self._send_cors(400, b"BAD_REQUEST")


if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', PORT), MPVBridgeHandler)
    print(f"⦒ █▓░ 4NDR0666OS MPV Bridge listening on http://127.0.0.1:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)
