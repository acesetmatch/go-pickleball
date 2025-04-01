#!/usr/bin/env python3

import json
import urllib.request
import urllib.error
import time
import sys

# Path to the paddles.json file
PADDLES_FILE = "frontend/src/data/paddles.json"

# API endpoint
API_ENDPOINT = "http://localhost:8080/api/paddles"

def main():
    # Load paddles from file
    try:
        with open(PADDLES_FILE, 'r') as f:
            paddles = json.load(f)
    except FileNotFoundError:
        print(f"Error: Paddles file not found at {PADDLES_FILE}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {PADDLES_FILE}")
        sys.exit(1)
    
    print(f"Found {len(paddles)} paddles to upload")
    
    # Upload each paddle
    for i, paddle in enumerate(paddles):
        paddle_id = paddle.get('id', f'Paddle #{i+1}')
        print(f"Uploading paddle: {paddle_id} ({i+1}/{len(paddles)})")
        
        # Create paddle input format (removing the 'id' field)
        paddle_input = {
            'metadata': paddle.get('metadata', {}),
            'specs': paddle.get('specs', {}),
            'performance': paddle.get('performance', {})
        }
        
        # Send the paddle data to the API
        try:
            # Prepare the request
            data = json.dumps(paddle_input).encode('utf-8')
            req = urllib.request.Request(
                url=API_ENDPOINT,
                data=data,
                headers={
                    'Content-Type': 'application/json',
                    'Content-Length': len(data)
                },
                method='POST'
            )
            
            # Send the request
            try:
                with urllib.request.urlopen(req) as response:
                    status_code = response.getcode()
                    response_data = response.read().decode('utf-8')
                    
                    if status_code == 201:
                        print(f"Upload successful (HTTP {status_code})")
                        
                        # Pretty print the response for debugging
                        try:
                            print(f"Response: {json.dumps(json.loads(response_data), indent=2)}")
                        except:
                            print(f"Raw response: {response_data}")
                    else:
                        print(f"Error uploading paddle (HTTP {status_code}): {response_data}")
                        print("Continuing with next paddle...")
            except urllib.error.HTTPError as e:
                print(f"HTTP Error: {e.code} - {e.reason}")
                # Try to read error response body
                error_body = e.read().decode('utf-8')
                print(f"Error details: {error_body}")
                print("Continuing with next paddle...")
            except urllib.error.URLError as e:
                print(f"URL Error: {e.reason}")
                print("Continuing with next paddle...")
        except Exception as e:
            print(f"Failed to upload: {e}")
            print("Continuing with next paddle...")
        
        # Small delay to avoid overwhelming the server
        time.sleep(0.5)
    
    print("Upload complete!")

if __name__ == "__main__":
    main() 