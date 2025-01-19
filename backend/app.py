import json
from flask import Flask, jsonify
from flask_cors import CORS
from google import genai
from typing import List, Dict
from google import genai
from google.genai import types
import json
import google.generativeai as generativeai
from google.genai.types import (
    FunctionDeclaration,
    GenerateContentConfig,
    GoogleSearch,
    Part,
    Retrieval,
    SafetySetting,
    Tool,
    VertexAISearch,
)

app = Flask(__name__)
CORS(app)


API_KEY = "AIzaSyCBDI8tAj5FC7Vse05m7xw3anObMtcFN24"
MODEL_ID = "gemini-2.0-flash-exp"

client = genai.Client(api_key=API_KEY)


@app.route("/api/demo", methods=["GET"])
def demo_api():
    return jsonify({"message": "Whatsuppppppp, World!"}), 200


@app.route("/api/timestamps")


# Step 2: Extract claims from the video
def get_timestamps(video_uri: str) -> list[dict]:
    try:
        print("Generating content with Gemini API...")
        SYSTEM_PROMPT = "When given a video and a query, call the relevant function only once with the video."
        USER_PROMPT = """
        Find all claims that are being made in this video. 
        Then give me only the major claims that may be facts, but not opinions and that are of importance. 
        For each such statement in the video, generate a timestamp with claim for that statement that states the statement being made.
        """
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_uri(file_uri=video_uri, mime_type="video/mp4"),
                    ],
                ),
                USER_PROMPT,
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.0,
                response_mime_type="application/json",
            ),
        )
        print(response.text)
        facts = json.loads(response.text)
        return facts
    except Exception as e:
        print(f"Error during fact extraction: {e}")
        raise e


if __name__ == "__main__":
    app.run(debug=True)
