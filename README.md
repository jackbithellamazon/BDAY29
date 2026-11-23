# Becki's Birthday Getaway

A birthday quest web app, phone-first. This repo is only the **empty shell**: the engine code and styles.

**All the content lives privately in Supabase**: questions, answers, codes, photos, the letters, her progress, and the Discord link.
Without the private magic link (or a PIN on a device that has opened it before) the site shows nothing personal.

- `index.html`: loads the styles and scripts below, in order
- `css/1-5`: styles, numbered in load order
- `js/util.js`: helpers + answer checking
- `js/state.js`: game state, money, notifications
- `js/ui.js`: home, sections, challenge sheet, popups, letters
- `js/games.js`: every challenge type
- `js/planner.js`: trip planner + boarding pass
- `js/jack.js`: Jack's view, dashboard and settings
- `js/cloud.js`: Supabase login (magic link / PIN), content, saving, Discord
- `js/main.js`: start-up

**Updating:** change the private content on Jack's Mac, run `python3 build.py && python3 upload.py`.
Only re-upload these files if the engine itself changed.
