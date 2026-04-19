import re
import json

html_path = "painel_utf8.html"
with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Parse season mapping
season_map = {}
season_matches = re.finditer(r'data-season-id="(\d+)"\s*data-season-number="(\d+)"', content)
for m in season_matches:
    season_map[m.group(1)] = m.group(2)

# 2. Parse episodes for Dublado
# We find the first card-body which is Dublado
dublado_content = content.split('<h2 class="card-title">Legendado</h2>')[0]

episodes = [] # list of (season_number, ep_number, ep_id)
ep_matches = re.finditer(r'<li\s+data-season-id="(\d+)"\s+data-episode-id="(\d+)".*?<a href="#\d+_\d+">\s*(.*?)\s*</a>', dublado_content, re.DOTALL)
for m in ep_matches:
    season_id = m.group(1)
    ep_id = m.group(2)
    ep_text = m.group(3).strip()
    
    # Try to extract episode number from text like "Episódio 1" or "1 - Episódio"
    ep_num_match = re.search(r'\d+', ep_text)
    if ep_num_match:
        ep_num = ep_num_match.group(0)
        season_num = season_map.get(season_id)
        if season_num:
            episodes.append((int(season_num), int(ep_num), ep_id, ep_text))

# Deduplicate and sort
unique_eps = {}
for s, e, eid, text in episodes:
    if (s, e) not in unique_eps:
        unique_eps[(s, e)] = (eid, text)

# Build JSON structure
data = {}
for (s, e), (eid, text) in unique_eps.items():
    if s not in data:
        data[s] = []
    data[s].append({"episode": e, "id": eid, "text": f"Episódio {e}"})

for s in data:
    data[s] = sorted(data[s], key=lambda x: x["episode"])

with open("episodes.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Parsed successfully!")
