from flask import Flask, request
import subprocess

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    event = request.headers.get('X-GitHub-Event', 'ping')
    if event == "ping":
        return "pong", 200

    if event == "push":
        subprocess.Popen(["/home/nexpocket/tugasin-main/deploy_tugasin_main.sh"])
        return "Build triggered", 200

    return "Ignored", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9090)
