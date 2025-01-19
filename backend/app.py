import json
import logging
from flask import Flask, jsonify
from flask_cors import CORS
import yt_dlp
import os
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


API_KEY = "YOUR_API_KEY"
MODEL_ID = "gemini-2.0-flash-exp"

client = genai.Client(api_key=API_KEY)


@app.route("/api/demo", methods=["GET"])
def demo_api():
    return jsonify({"message": "Whatsuppppppp, World!"}), 200


def get_video_json_path(video_url):
    return f"{os.getcwd()}/{video_url}.json"


def download_youtube_video(video_url: str, save_path: str):
    ydl_opts = {"outtmpl": save_path, "format": "mp4"}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([video_url])
    logger.info("Video downloaded successfully!")


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


if __name__ == "__main__":
    app.run(debug=True)
