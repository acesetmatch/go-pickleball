from smolagents import agents
from PaddleScrapeTool import HeuristicScrapeTool

import requests
import json

# --- Custom LLM (Mistral via Ollama) ---
def call_mistral(prompt, stop_sequences=None, **kwargs):
    # If prompt is a list of messages, convert it to a string
    if isinstance(prompt, list):
        prompt_text = ""
        for message in prompt:
            role = message.get("role", "")
            content = message.get("content", "")
            if isinstance(content, list):  # Handle content that might be a list
                content = " ".join(str(item) for item in content)
            prompt_text += f"{role}: {content}\n"
        prompt = prompt_text
    
    # Prepare the request payload
    payload = {
        "model": "mistral",  # This uses the Mistral model in Ollama
        "prompt": prompt,
        "stream": False
    }
    
    # Add stop sequences if provided
    if stop_sequences:
        payload["stop"] = stop_sequences
    
    # Make the API call to Ollama
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json=payload
        )
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        return {
            "content": response.json().get('response', '')
        }  # Extract the 'response' part of the JSON
    except requests.exceptions.RequestException as e:
        print(f"Error during the request: {e}")
        return {"content": ""}  # Return empty content in case of error
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}, response text: {response.text}")
        return {"content": ""}
    

agent = agents.CodeAgent(
    # system_prompt="You are a web scraper that prepares PaddleInput struct data for Go programs.",
    model=call_mistral,
    tools=[HeuristicScrapeTool()]
)

task = """
Scrape pickleball paddles from this sample page:
https://pickleballcentral.com/proton-series-three-pickleball-paddle-project-flamingo/

For each paddle, extract the following fields:

Metadata:
- Brand
- Model

Specs:
- Shape (either 'Elongated', 'Hybrid', or 'Wide-body')
- Surface
- Average Weight (float, in ounces)
- Core (thickness in mm, float)
- Paddle Length (inches, float)
- Paddle Width (inches, float)
- Grip Length (inches, float)
- Grip Type (text)
- Grip Circumference (inches, float)

Performance:
- Power (rating 0-10, float)
- Pop (rating 0-10, float)
- Spin (rating 0-10, float)
- Twist Weight (float)
- Swing Weight (float)
- Balance Point (inches, float)

Output the scraped data in a JSON array where each object matches the Go PaddleInput struct format, but do not include the 'id' field.

Make sure numerical fields are parsed as floats (not strings).
"""

result = agent.run(task)

print(result)

# Optional: Save result to a file
with open("paddles.json", "w") as f:
    f.write(result)
