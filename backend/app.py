from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/demo', methods=['GET'])
def demo_api():
    return jsonify({'message': 'Whatsuppppppp, World!'}), 200

@app.route('/api/timestamps')
def get_timestamps():
    # Sample timestamp-text pairs for testing
    # Timestamps are in seconds
    timestamps = {
        "0": "Video starts - Introduction",
        "30": "First key point discussed",
        "65": "Important statistics shown",
        "120": "Main argument presented",
        "180": "Supporting evidence",
        "240": "Counter arguments addressed",
        "300": "Conclusion begins",
        "330": "Call to action"
    }
    return jsonify(timestamps)

if __name__ == '__main__':
    app.run(debug=True)
