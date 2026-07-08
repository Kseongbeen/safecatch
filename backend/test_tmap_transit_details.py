import urllib.request
import urllib.parse
import json

def test_tmap_transit_details(key):
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
        "lang": 0,
        "format": "json",
        "count": 1
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
            if "metaData" in res_data:
                meta = res_data["metaData"]
                plan = meta.get("plan", {})
                itineraries = plan.get("itineraries", [])
                if itineraries:
                    itin = itineraries[0]
                    # Print high-level keys
                    print("Itinerary keys:", list(itin.keys()))
                    print("Fare:", itin.get("fare"))
                    print("Total Time:", itin.get("totalTime"))
                    print("Total Walk Time:", itin.get("totalWalkTime"))
                    print("Total Walk Distance:", itin.get("totalWalkDistance"))
                    
                    # Print legs
                    legs = itin.get("legs", [])
                    print(f"\nFound {len(legs)} legs:")
                    for idx, leg in enumerate(legs):
                        print(f"Leg {idx}:")
                        print(f"  mode: {leg.get('mode')}")
                        print(f"  sectionTime: {leg.get('sectionTime')}")
                        print(f"  distance: {leg.get('distance')}")
                        print(f"  startName: {leg.get('start', {}).get('name')}")
                        print(f"  endName: {leg.get('end', {}).get('name')}")
                        
                        # Transit details
                        if leg.get('mode') in ['BUS', 'SUBWAY']:
                            route = leg.get('route')
                            print(f"  route: {route}")
                            
                            # Let's inspect passStopList
                            pass_stops = leg.get('passStopList', {})
                            stations = pass_stops.get('stations', [])
                            print(f"  stations count: {len(stations)}")
                            if stations:
                                print(f"    first station: {stations[0].get('stationName')}")
                                print(f"    last station: {stations[-1].get('stationName')}")
                                print(f"    sample station data: {stations[0]}")
                        
                        print(f"  sample leg data: {list(leg.keys())}")
            else:
                print("No metadata in response")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    key = "0gS4QFML3g7MtQD3P3lu418Fm55g0hXJ6mNU4pX3"
    test_tmap_transit_details(key)
