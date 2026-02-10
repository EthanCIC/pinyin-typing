import webbrowser
import threading
import time

import uvicorn


def open_browser():
    time.sleep(1.5)
    webbrowser.open("http://localhost:8000")


def main():
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("app.api:app", host="127.0.0.1", port=8000, reload=True)


if __name__ == "__main__":
    main()
