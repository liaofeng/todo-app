import http.server
import socketserver

class UTF8Handler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        mimetype = super().guess_type(path)
        if mimetype.startswith('text/'):
            mimetype += '; charset=utf-8'
        return mimetype

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

PORT = 53823
Handler = UTF8Handler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()