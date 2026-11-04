# Student Dataset Cleaning Tool

A beginner-friendly, responsive, client-side CSV data cleaning application built with HTML5, CSS3, and vanilla JavaScript.

## Features

- Upload a CSV file from your computer.
- Preview, search, sort, and page through dataset records.
- View row count, column count, missing values, and exact duplicate rows.
- Remove exact duplicate rows (keeps the first occurrence).
- Trim leading/trailing spaces.
- Standardize text values to title case (numeric-looking values are preserved).
- Replace blank cells with `Not provided`.
- Check likely numeric columns and report non-numeric values in the completion message.
- Compare before/after row, missing-value, and duplicate counts, with a simple quality indicator.
- Export the working dataset as a CSV file.
- Restore the original uploaded data at any time.

## Run locally

1. Download and extract the project ZIP.
2. Keep all five files in the same folder.
3. Open the folder in Visual Studio Code.
4. Recommended: install the **Live Server** extension, right-click `index.html`, and choose **Open with Live Server**.
5. Alternatively, open `index.html` directly in a modern browser. If the sample CSV does not load due to browser file restrictions, the app includes a built-in sample fallback. Uploading a CSV works from the browser.

No build step, package installation, API key, or database is required.

## Files

- `index.html` — page structure and dashboard components.
- `style.css` — responsive layout and visual styling.
- `script.js` — CSV parsing, table rendering, validation, cleaning, and export logic.
- `sample-data.csv` — fictional student sample records.
- `README.md` — this guide.

## Data and privacy notes

All processing happens locally in the browser tab. The app does not upload data to a server and does not connect to an external database. The original dataset is kept in JavaScript memory while the page is open; the reset action restores that in-memory original. Refreshing or closing the tab clears the current session.

## CSV expectations and limitations

- The first row must contain unique, non-empty column names.
- Fields containing commas, quotes, or line breaks should use standard CSV double-quote escaping.
- Malformed quoting, empty files, duplicate headers, and records with too many values are rejected with a readable message.
- Short records are padded with blank cells.
- Numeric validation is heuristic: a column is treated as likely numeric when at least half of its non-empty values can be interpreted as numbers. Invalid values are reported, not silently changed or removed.
- Duplicate detection compares the complete row values exactly. It does not attempt fuzzy matching.

## Internship task

This project demonstrates a practical CSV collection and cleaning workflow: loading records, inspecting data quality, applying repeatable transformations, reviewing the result, and exporting a cleaned dataset.
