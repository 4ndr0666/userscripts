import sys
import subprocess
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 19999

class MPVBridgeHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        params = urllib.parse.parse_qs(post_data)
        
        target_url = params.get('url', [None])[0]
        if target_url:
            # Spawn mpv detached from the bridge process
            subprocess.Popen(['mpv', '--force-window=yes', target_url])
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b"OK")
        else:
            self.send_response(400)
            self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', PORT), MPVBridgeHandler)
    print(f"⦒ █▓░ 4NDR0666OS MPV Bridge listening on http://127.0.0.1:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)
