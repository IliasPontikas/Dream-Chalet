"""Fetch a 5-day forecast for the chalet from MET Norway and write data/weather.json.

MET Norway's data is free for any use, including commercial, under CC BY 4.0
(credit "MET Norway" on the site). Their terms ask for an identifying
User-Agent and coordinates with at most 4 decimals.
https://api.met.no/doc/TermsOfService
"""

import json
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

LAT, LON = 39.6039, 21.7472
URL = f"https://api.met.no/weatherapi/locationforecast/2.0/complete?lat={LAT}&lon={LON}"
UA = "DreamChaletTrikala/1.0 (+https://github.com/IliasPontikas/Dream-Chalet)"
TZ = ZoneInfo("Europe/Athens")
OUT = Path(__file__).resolve().parent.parent / "data" / "weather.json"
DAYS = 5


def fetch():
    req = urllib.request.Request(URL, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)


def build(data):
    temps = defaultdict(list)
    symbols = {}  # date -> (distance from midday, symbol)
    for entry in data["properties"]["timeseries"]:
        t = datetime.fromisoformat(entry["time"].replace("Z", "+00:00")).astimezone(TZ)
        day = t.date().isoformat()
        d = entry["data"]
        temp = d.get("instant", {}).get("details", {}).get("air_temperature")
        if temp is not None:
            temps[day].append(temp)
        six = d.get("next_6_hours", {})
        for key in ("air_temperature_max", "air_temperature_min"):
            v = six.get("details", {}).get(key)
            if v is not None:
                temps[day].append(v)
        # The day's symbol: the 6-hour block that starts closest to 09:00 local
        sym = six.get("summary", {}).get("symbol_code")
        if sym:
            dist = abs(t.hour - 9)
            if day not in symbols or dist < symbols[day][0]:
                symbols[day] = (dist, sym)

    today = datetime.now(TZ).date().isoformat()
    days = []
    for day in sorted(temps):
        if day < today or day not in symbols:
            continue
        days.append({
            "date": day,
            "max": round(max(temps[day])),
            "min": round(min(temps[day])),
            "symbol": symbols[day][1].split("_")[0],  # drop _day/_night
        })
    return days[:DAYS]


def main():
    try:
        days = build(fetch())
    except Exception as e:  # keep the previous forecast if MET is unreachable
        print(f"Weather fetch failed: {e}", file=sys.stderr)
        return
    if len(days) < 3:
        print("Too few days in forecast, keeping the previous file", file=sys.stderr)
        return
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps({"source": "MET Norway", "days": days}, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(days)} days")


if __name__ == "__main__":
    main()
