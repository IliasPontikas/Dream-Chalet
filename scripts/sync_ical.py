#!/usr/bin/env python3
"""Fetch the Airbnb / Booking.com iCal export feeds and write data/booked.json.

The feed URLs come from environment variables (GitHub Actions secrets):
  AIRBNB_ICAL_URL, BOOKING_ICAL_URL   (either may be empty)

Output: {"updated": "<ISO time>", "ranges": [{"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}]}
`end` is the check-out day (that night is free), like iCal's DTEND.
Standard library only.
"""
import datetime as dt
import json
import os
import re
import sys
import urllib.request

OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'booked.json')


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'dream-chalet-calendar-sync'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', errors='replace')


def unfold(text):
    # iCal lines may be folded: a newline followed by a space continues the previous line
    return re.sub(r'\r?\n[ \t]', '', text)


def parse_date(value):
    m = re.search(r'(\d{4})(\d{2})(\d{2})', value)
    return dt.date(int(m.group(1)), int(m.group(2)), int(m.group(3))) if m else None


def events(text):
    out = []
    for block in re.findall(r'BEGIN:VEVENT(.*?)END:VEVENT', unfold(text), flags=re.S):
        start = end = None
        for line in block.splitlines():
            if line.startswith('DTSTART'):
                start = parse_date(line.split(':', 1)[-1])
            elif line.startswith('DTEND'):
                end = parse_date(line.split(':', 1)[-1])
        if start and end and end > start:
            out.append((start, end))
    return out


def merge(ranges):
    ranges.sort()
    merged = []
    for s, e in ranges:
        if merged and s <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))
    return merged


def main():
    urls = [os.environ.get(k, '').strip() for k in ('AIRBNB_ICAL_URL', 'BOOKING_ICAL_URL')]
    urls = [u for u in urls if u]
    if not urls:
        print('No iCal URLs configured; leaving data/booked.json unchanged.')
        return 0

    today = dt.date.today()
    ranges, failures = [], 0
    for url in urls:
        try:
            ranges += events(fetch(url))
        except Exception as exc:  # keep the old file if a feed is down
            failures += 1
            print(f'Feed failed: {exc}', file=sys.stderr)
    if failures == len(urls):
        print('All feeds failed; keeping the previous data.', file=sys.stderr)
        return 0

    upcoming = [(s, e) for s, e in merge(ranges) if e > today]
    data = {
        'updated': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'ranges': [{'start': s.isoformat(), 'end': e.isoformat()} for s, e in upcoming],
    }
    old = {}
    if os.path.exists(OUT):
        with open(OUT, encoding='utf-8') as f:
            old = json.load(f)
    if old.get('ranges') == data['ranges']:
        print('No change in bookings.')
        return 0
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        f.write('\n')
    print(f'Wrote {len(upcoming)} booked ranges.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
