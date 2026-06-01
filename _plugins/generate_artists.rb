# encoding: UTF-8
require 'yaml'
require 'fileutils'
require 'date'

Jekyll::Hooks.register :site, :pre_render do |site|
  OUT_DIR = 'artist'
  FileUtils.mkdir_p(OUT_DIR)

  artists_chords = Hash.new { |h, k| h[k] = [] }

  # 1. Scan semua file chord
  Dir.glob('_chords/*.md').each do |file|
    next unless File.file?(file)

    content = File.read(file, encoding: 'UTF-8') # <- ini diganti
    parts = content.split('---', 3)
    next if parts.size < 3

    frontmatter = YAML.safe_load(parts[1], permitted_classes: [Date, Time]) rescue nil
    next unless frontmatter && frontmatter['artist']

    artists = frontmatter['artist'].to_s.split('|').map(&:strip).reject(&:empty?)
    artists.each { |a| artists_chords[a] << file }
  end

  # 2. Sort A-Z biar urutan presisi. Nggak peduli huruf besar/kecil
  sorted_artists = artists_chords.sort_by { |artist, _| artist.downcase }

  Jekyll.logger.info "Artists:", "Ditemukan #{sorted_artists.size} artis, urut A-Z"

  created = 0
  skipped = 0

  # 3. Generate cuma buat artis baru
  sorted_artists.each do |artist, files|
    slug = artist.downcase.gsub(/[^a-z0-9]+/, '-').gsub(/^-|-$/, '')
    path = File.join(OUT_DIR, "#{slug}.html")

    # Skip kalau udah ada
    if File.exist?(path)
      skipped += 1
      next
    end

    # Bikin baru kalau belum ada
    File.write(path, <<~HTML)
---
layout: artist
title: "Chord #{artist}"
artist_name: "#{artist}"
slug: "#{slug}"
permalink: /artist/#{slug}/
---

<!-- Auto-generate A-Z. Aman diedit manual -->
HTML

    created += 1
    Jekyll.logger.info "Created:", "#{artist} → #{slug}.html | Chord: #{files.size}"
  end

  Jekyll.logger.info "Selesai:", "Baru: #{created} | Skip: #{skipped}"
end