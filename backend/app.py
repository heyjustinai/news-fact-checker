import json
from flask import Flask, jsonify
from flask_cors import CORS
from google import genai
from google import genai
from google.genai import types
import json
import google.generativeai as generativeai
from google.genai.types import (
    GenerateContentConfig,
    GoogleSearch,
    Tool,
)

app = Flask(__name__)
CORS(app)


API_KEY = "YOUR_API_KEY"
MODEL_ID = "gemini-2.0-flash-exp"

client = genai.Client(api_key=API_KEY)


@app.route("/api/demo", methods=["GET"])
def demo_api():
    return jsonify({"message": "Whatsuppppppp, World!"}), 200


@app.route("/api/timestamps")


# Step 2: Extract claims from the video
def extract_facts(video_uri: str) -> list[dict]:
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


def fact_check_claim(claim: str) -> dict:
    try:
        SYSTEM_PROMPT = """Check the factual accuracy of the provided statement using web grounding. 
        Give me in the output the sources that you used to verify the statement, 
        a very crisp one sentence for why this is the case, and the score between 0 to 1, 
        where 1 means it's true and 0 means it's false."""

        USER_PROMPT = f"Verify if the following claim is factually correct: '{claim}'. Give me response in clean JSON format. Don't add extra information or characters at the end of JSON."
        google_search_tool = Tool(google_search=GoogleSearch())

        response = client.models.generate_content(
            model=MODEL_ID,
            contents=USER_PROMPT,
            config=GenerateContentConfig(
                tools=[google_search_tool],
                system_instruction=SYSTEM_PROMPT,
                temperature=0.0,
                response_mime_type="application/json",
            ),
        )

        # Get response text
        text = response.text

        # Find the last closing bracket "]" and slice up to it
        last_closing_bracket_index = text.rfind("]")
        if last_closing_bracket_index != -1:
            text = text[: last_closing_bracket_index + 1]
        else:
            print("Error: No closing bracket found in response.")
            return {"error": "Invalid response format", "details": response.text}

        print(f"Cleaned response: {text}")
        fact_check_result = json.loads(text)
        return fact_check_result
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print("Response causing issue:", response.text)
        return {"error": "JSON parsing failed", "details": str(e)}

    except Exception as e:
        print(f"Error during fact-checking: {e}")
        return {"error": "Fact-checking failed", "details": str(e)}


def get_fact_checked_timestamps(video_uri: str, mime_type: str) -> dict:
    facts = extract_facts(video_uri, mime_type)

    # Step 3: Fact-check each claim
    print("Fact-checking claims...")
    fact_check_results = {}
    print(facts)
    for object in facts:
        timestamp = object["timestamp"]
        claim = object["claim"]
        print(f"Fact-checking claim: {claim}")
        fact_check_results[timestamp] = fact_check_claim(claim)

    # Step 4: Display fact-check results
    print(json.dumps(fact_check_results, indent=4))
    return fact_check_results


if __name__ == "__main__":
    app.run(debug=True)
