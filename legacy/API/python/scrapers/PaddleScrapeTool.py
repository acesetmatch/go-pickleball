from smolagents import Tool
import requests
from bs4 import BeautifulSoup
import re

class HeuristicScrapeTool(Tool):
    name = "heuristic_scrape_tool"
    description = "Scrapes websites using heuristics to detect product information like brand, model, and specs without requiring CSS selectors."
    inputs = {
        "url": {
            "type": "string",
            "description": "The URL of the website to scrape."
        }
    }
    output_type = "object"

    def forward(self, url: str):
        # Send request to fetch the page content
        response = requests.get(url)
        
        if response.status_code != 200:
            return {"error": "Failed to fetch the webpage."}
        
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')

        # Initialize the dictionary to store the extracted information
        scraped_data = {
            "metadata": {
                "brand": None,
                "model": None
            },
            "specs": {
                "shape": None,
                "surface": None,
                "average_weight": None,
                "core": None,
                "paddle_length": None,
                "paddle_width": None,
                "grip_length": None,
                "grip_type": None,
                "grip_circumference": None
            },
            "performance": {
                "power": None,
                "pop": None,
                "spin": None,
                "twist_weight": None,
                "swing_weight": None,
                "balance_point": None
            }
        }

        # Heuristic Parsing for Brand and Model:
        scraped_data["metadata"]["brand"] = self.extract_from_text(soup, ["brand", "manufacturer", "make", "label", "company"])
        scraped_data["metadata"]["model"] = self.extract_from_text(soup, ["model", "name", "type", "version"])

        # Heuristic Parsing for Specs (e.g., shape, surface, weight, etc.)
        specs = self.extract_from_text(soup, ["spec", "specs", "features", "details", "description"])
        if specs:
            # We need to attempt to map the found specs to the paddle specs format
            scraped_data["specs"]["shape"] = self.extract_spec_value(specs, "shape")
            scraped_data["specs"]["surface"] = self.extract_spec_value(specs, "surface")
            scraped_data["specs"]["average_weight"] = self.extract_spec_value(specs, "weight")
            scraped_data["specs"]["core"] = self.extract_spec_value(specs, "core")
            scraped_data["specs"]["paddle_length"] = self.extract_spec_value(specs, "length")
            scraped_data["specs"]["paddle_width"] = self.extract_spec_value(specs, "width")
            scraped_data["specs"]["grip_length"] = self.extract_spec_value(specs, "grip length")
            scraped_data["specs"]["grip_type"] = self.extract_spec_value(specs, "grip type")
            scraped_data["specs"]["grip_circumference"] = self.extract_spec_value(specs, "grip circumference")

        # You can add additional performance metrics based on the site content (if applicable)
        scraped_data["performance"]["power"] = self.extract_spec_value(specs, "power")
        scraped_data["performance"]["pop"] = self.extract_spec_value(specs, "pop")
        scraped_data["performance"]["spin"] = self.extract_spec_value(specs, "spin")
        scraped_data["performance"]["twist_weight"] = self.extract_spec_value(specs, "twist weight")
        scraped_data["performance"]["swing_weight"] = self.extract_spec_value(specs, "swing weight")
        scraped_data["performance"]["balance_point"] = self.extract_spec_value(specs, "balance point")

        return scraped_data

    def extract_from_text(self, soup, keywords):
        """
        Extracts text that contains keywords (e.g., 'brand', 'model', etc.)
        from the page's text content, attempting to match patterns.
        """
        # Convert the entire page to text
        page_text = soup.get_text(separator=' ', strip=True)

        # Try to find text based on common keywords related to brand, model, etc.
        for keyword in keywords:
            # Search for keyword occurrences in the text
            if keyword in page_text.lower():
                # Extract surrounding text that might contain the brand/model/specs
                surrounding_text = self.get_surrounding_text(page_text, keyword)
                if surrounding_text:
                    return surrounding_text.strip()

        # Return None if no matching content is found
        return None

    def get_surrounding_text(self, text, keyword):
        """
        Returns the surrounding text around a keyword, assuming it might indicate relevant information.
        """
        # Look for the keyword and get a chunk of text around it
        match = re.search(r"([^.]*\b" + re.escape(keyword) + r"\b[^.]*\.)", text, re.IGNORECASE)
        if match:
            return match.group(0)
        return None

    def extract_spec_value(self, specs_text, keyword):
        """
        Tries to extract specific spec values from the text. This could be weight, size, etc.
        """
        if specs_text and keyword in specs_text.lower():
            match = re.search(r"([0-9\.]+)\s*(lbs|oz|inches|cm|g|mm)?", specs_text, re.IGNORECASE)
            if match:
                return float(match.group(1))
        return None

# Comment out or remove these lines at the bottom of the file
'''
# Example usage:
scraper = HeuristicScrapeTool()
url = "https://pickleballcentral.com/proton-series-three-pickleball-paddle-project-flamingo/?sku=PRO109-0004&gad_source=1&gbraid=0AAAAAD9qX1zBnmwCbSAl6fDaij-9HQF07&gclid=Cj0KCQjwzrzABhD8ARIsANlSWNMWO_r6iaCZ7weouGbSV9Us8cUVV8R0XcG9Ie8s-auP4hAkBTzXdJ4aAh1bEALw_wcB"
result = scraper.forward(url)
print(result)
'''
