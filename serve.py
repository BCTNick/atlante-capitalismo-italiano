from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os


ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)

server = ThreadingHTTPServer(("127.0.0.1", 8000), SimpleHTTPRequestHandler)
print("Atlas available at http://127.0.0.1:8000/app/")
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
