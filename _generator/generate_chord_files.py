import yaml
import os

# Path file input dan output
INPUT_FILE = "_generator/denny-caknan.yml"
OUTPUT_FOLDER = "_chords"
LAYOUT = "chord"

# Bikin folder _chords kalau belum ada
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Baca file yml
with open(INPUT_FILE, 'r', encoding='utf-8') as f:
    songs = yaml.safe_load(f)

created = 0
skipped = 0

for song in songs:
    slug = song['slug']
    filepath = os.path.join(OUTPUT_FOLDER, f"{slug}.md")
    
    # Cek kalau file udah ada dan isinya bukan template kosong
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        # Kalau file > 150 karakter dan nggak ada teks template, berarti udah diisi manual
        if len(content.strip()) > 150 and "[isi lirik + chord di sini]" not in content:
            print(f"[SKIP] {slug}.md - udah ada lirik")
            skipped += 1
            continue
    
    # Buat frontmatter
    frontmatter = f"""---
layout: {LAYOUT}
title: "{song['title']}"
artist: "{song['artist']}"
genre: "{song['genre']}"
category: {song['category']}
date: {song['date']}
last_modified_at: {song['last_modified_at']}
youtube_id: "{song['youtube_id']}"
slug: {song['slug']}
excerpt: "{song['excerpt']}"
tags: {song['tags']}
key: {song['key']}
---"""

    # Buat body
    body = f"""
## Lirik & Chord
{song['lyrics']}
"""

    # Tulis file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(frontmatter + body)
    
    print(f"[CREATED] {slug}.md")
    created += 1

print(f"\nSelesai!")
print(f"File baru dibuat: {created}")
print(f"File di-skip karena udah ada: {skipped}")
print(f"Lokasi: {OUTPUT_FOLDER}/")