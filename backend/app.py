import json
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
import yt_dlp
import os
from dotenv import load_dotenv
import time
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

logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()
API_KEY = os.getenv('GEMINI_API_KEY')
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

MODEL_ID = "gemini-2.0-flash-exp"

client = genai.Client(api_key=API_KEY)


@app.route("/api/demo", methods=["GET"])
def demo_api():
    return jsonify({"message": "Whatsuppppppp, World!"}), 200


def get_video_json_path(video_url):
    return f"{os.getcwd()}/{video_url}.json"


def download_youtube_video(video_url: str, save_path: str):
    ydl_opts = {
        "outtmpl": save_path,
        "format": "worst",  # Use lowest quality to speed up download
        "quiet": False,
        "no_warnings": False,
        "extract_flat": True,
        "youtube_include_dash_manifest": False,
        "youtube_include_hls_manifest": False,
        "retries": 10,
        "fragment_retries": 10,
        "skip_download": False,
        "writesubtitles": False,
        "writeautomaticsub": False,
        "verbose": True,
        "cookiefile": "youtube.com_cookies.txt"  # Optional: Add cookies if needed
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            logger.info(f"Attempting to download video: {video_url}")
            info = ydl.extract_info(video_url, download=True)
            logger.info("Video downloaded successfully!")
            return info
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error downloading video: {error_msg}")
        if "HTTP Error 403" in error_msg:
            raise ValueError("Access to YouTube video is forbidden. This might be due to rate limiting or video restrictions.")
        elif "HTTP Error 400" in error_msg:
            raise ValueError("Invalid YouTube video URL or API error. Please try again later.")
        else:
            raise ValueError(f"Failed to download video: {error_msg}")


# Step 2: Extract claims from the video
def extract_facts(video_uri: str) -> list[dict]:
    try:
        logger.info("Generating content with Gemini API...")
        # SYSTEM_PROMPT = ""
        USER_PROMPT = """
        When given a video and a query, call the relevant function only once with the video.
        Find all claims that are being made in this video. 
        Then give me only the major claims that may be facts, but not opinions and that are of importance. 
        For each such statement in the video, generate a timestamp with claim for that statement that states the statement being made.
        
        Additinally, for each claim, check the factual accuracy of the provided statement using web grounding. 
        Give me in the output the sources that you used to verify the statement, 
        a very crisp one sentence for why this is the case, and the score between 0 to 1, 
        where 1 means it's true and 0 means it's false. Give me the sources as list with links.
        """

        google_search_tool = Tool(google_search=GoogleSearch())

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
                tools=[google_search_tool],
                # system_instruction=SYSTEM_PROMPT,
                temperature=0.0,
                response_mime_type="application/json",
            ),
        )
        text = response.text

        # Find the last closing bracket "]" and slice up to it
        last_closing_bracket_index = text.rfind("]")
        if last_closing_bracket_index != -1:
            text = text[: last_closing_bracket_index + 1]
        else:
            logger.info("Error: No closing bracket found in response.")
            return {"error": "Invalid response format", "details": response.text}

        logger.info(f"Cleaned response: {text}")
        fact_check_result = json.loads(text)
        return fact_check_result
    except json.JSONDecodeError as e:
        logger.info(f"JSON parsing error: {e}")
        logger.info("Response causing issue:", response.text)
        return {"error": "JSON parsing failed", "details": str(e)}

    except Exception as e:
        logger.info(f"Error during fact-checking: {e}")
        return {"error": "Fact-checking failed", "details": str(e)}


def get_fact_checked_timestamps(video_uri: str) -> dict:
    video_json_path = get_video_json_path(video_url=video_uri)
    if os.path.exists(video_json_path):
        with open(video_json_path, "r") as f:
            metadata = json.load(f)
            video_uri = metadata.get("uri")
            mime_type = metadata.get("mime_type")
            if video_uri and mime_type:
                print(f"Using cached video metadata: {metadata}")
            else:
                raise ValueError("Cached metadata is incomplete.")
    else:
        # Download video if necessary
        video_path = video_json_path + ".mp4"
        download_youtube_video(video_uri, video_path)

        # Upload video and get URI and MIME type
        metadata = upload_video(video_path, video_uri)
        video_uri = metadata["uri"]
        mime_type = metadata["mime_type"]

    fact_check_results = extract_facts(video_uri)

    # Step 4: Display fact-check results
    logger.info(json.dumps(fact_check_results, indent=4))
    return fact_check_results


@app.route("/api/timestamps", methods=["POST"])
def get_fact_check_timestamps():
    try:
        # Get video URL from request
        data = request.get_json()
        if not data or 'video_url' not in data:
            return jsonify({"error": "Missing video_url parameter"}), 400
            
        video_url = data['video_url']
        if not video_url.startswith('https://www.youtube.com/'):
            return jsonify({"error": "Invalid YouTube URL"}), 400

        try:
            # Process video and get timestamps
            timestamps = get_fact_checked_timestamps(video_url)
            
            # Check for errors in the response
            if isinstance(timestamps, dict) and 'error' in timestamps:
                return jsonify(timestamps), 500

            return jsonify(timestamps), 200

        except ValueError as ve:
            # Handle specific errors from video download
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            logger.error(f"Error processing video: {str(e)}")
            return jsonify({"error": f"Failed to process video: {str(e)}"}), 500

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({"error": f"Failed to process request: {str(e)}"}), 500


@app.route("/demo_timestamps", methods=["GET"])
def get_timestamps():
    try:
        timestamps = {
            "00:00:01": [
                {
                    "statement": "Today I stand before the United Nations General Assembly.",
                    "sources": [],
                    "reason": "The statement is a generic statement and without context or a specific speaker, it cannot be verified.",
                    "score": "0"
                }
            ],
            "00:00:06": [
                {
                    "statement": "In less than two years, my administration has accomplished more than almost any administration in the history of our country.",
                    "sources": [
                        "https://www.whitehouse.gov/briefing-room/speeches-remarks/2023/01/19/remarks-by-president-biden-at-the-democratic-national-committee-winter-meeting/",
                        "https://www.washingtonpost.com/politics/2023/01/20/biden-accomplishments-two-years/"
                    ],
                    "accuracy": "This is a subjective claim and difficult to quantify, but the Biden administration has passed significant legislation.",
                    "score": "0.5"
                }
            ]
        }
        return jsonify(timestamps), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def upload_video(file_path: str, video_url: str):
    logger.info("Uploading video file to Gemini API...")
    file_upload = client.files.upload(path=file_path)

    while file_upload.state == "PROCESSING":
        logger.info("Waiting for video to be processed...")
        time.sleep(3)
        file_upload = client.files.get(name=file_upload.name)

    if file_upload.state == "FAILED":
        raise ValueError(f"File upload failed: {file_upload.state}")

    logger.info(f"Video processing complete: {file_upload.uri}")
    metadata = {
        "uri": file_upload.uri,
        "mime_type": file_upload.mime_type,
    }
    with open(get_video_json_path(video_url=video_url), "w") as f:
        json.dump(metadata, f)

    return metadata


if __name__ == "__main__":
    app.run(debug=True)
