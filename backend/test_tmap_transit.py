import urllib.request
import urllib.parse
import json

def test_tmap_transit(key):
    print(f"Testing TMap Transit key: {key}")
    # Endpoint according to SK Open API TMap Transit Route:
    # URL: https://apis.openapi.sk.com/transit/routes
    url = "https://apis.openapi.sk.com/transit/routes"
    
    headers = {
        "appKey": key,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    # Coordinates for Jamsil (start) to Sangmyung (end)
    data = {
        "startX": "127.10017812",
        "startY": "37.51332367",
        "endX": "126.95521656",
        "endY": "37.60269957",
        "lang": 0, # 0: Korean, 1: English
        "format": "json",
        "count": 5
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            print("Response keys:", list(res_data.keys()))
            if "metaData" in res_data:
                meta = res_data["metaData"]
                plan = meta.get("plan", {})
                itineraries = plan.get("itineraries", [])
                print(f"Success! Found {len(itineraries)} routes.")
                if itineraries:
                    print("First itinerary total time:", itineraries[0].get("totalTime"), "seconds")
            else:
                print("Failed response structure. Response:", res_data)
    except Exception as e:
        print("Error:", e)
        if hasattr(e, 'read'):
            print("Error response:", e.read().decode("utf-8"))

if __name__ == '__main__':
    key = "0gS4QFML3g7MtQD3P3lu418Fm55g0hXJ6mNU4pX3"
    test_tmap_transit(key)
