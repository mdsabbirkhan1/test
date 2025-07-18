#!/usr/bin/env python3
"""
Simple HTTP Server for ToolHub development
Run with: python3 server.py
"""

import http.server
import socketserver
import os
import mimetypes

# Add MIME types for PWA
mimetypes.add_type('application/manifest+json', '.webmanifest')
mimetypes.add_type('application/manifest+json', '.json')
mimetypes.add_type('text/javascript', '.js')

PORT = 8000

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        
        # Add PWA headers
        if self.path.endswith('.json'):
            self.send_header('Content-Type', 'application/manifest+json')
        
        # Add cache headers for static assets
        if any(self.path.endswith(ext) for ext in ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2']):
            self.send_header('Cache-Control', 'public, max-age=31536000')
        
        super().end_headers()
    
    def do_GET(self):
        # Handle root path
        if self.path == '/':
            self.path = '/index.html'
        
        # Serve files
        return super().do_GET()

def main():
    # Change to the directory where this script is located
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"🚀 ToolHub development server running at:")
        print(f"   http://localhost:{PORT}")
        print(f"   http://127.0.0.1:{PORT}")
        print(f"\n📱 To test PWA features:")
        print(f"   - Use Chrome/Edge for full PWA support")
        print(f"   - Enable Developer Tools > Application > Service Workers")
        print(f"   - Test offline mode by checking 'Offline' in Network tab")
        print(f"\n🛑 Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n\n✅ Server stopped")

if __name__ == "__main__":
    main()