from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/demo', methods=['GET'])
def demo_api():
    return jsonify({'message': 'Hello, World!'}), 200

if __name__ == '__main__':
    app.run(debug=True)
