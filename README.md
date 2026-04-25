# Panelr Line Exporter

A Chrome extension that extracts subscriber lines from your IPTV reseller panel, lets you review and clean the data, and exports a CSV ready for import into Panelr.

Panelr is an IPTV middleware platform that automates activations, billing, and subscriber management.

Website: https://panelr.app  
Developer Docs: https://panelr.app/developers.php  

---
## Supported Panels

| Panel | Notes |
|-------|-------|
| **Strong8k** | Full pagination support |
| **T-Rex** | Full pagination support |

---

## Installation

This extension is not published to the Chrome Web Store. Install it manually as an unpacked extension.

1. Download or clone this repository to your computer
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** using the toggle in the top-right corner
4. Click **Load unpacked**
5. Select the folder containing the extension files
6. The **Panelr Line Exporter** icon will appear in your Chrome toolbar

> **Tip:** Pin the extension to your toolbar for easy access — click the puzzle piece icon in Chrome and pin Panelr Line Exporter.

---

## How to Use

### Step 1 — Navigate to your panel's Lines page

Log into your IPTV reseller panel and open the **Lines** (or Users) page — the page that shows the full table of your lines. The extension needs this table to be visible before extraction begins.

### Step 2 — Open the extension

Click the Panelr Line Exporter icon in your Chrome toolbar.

### Step 3 — Select your panel type

Choose your panel from the **Panel Type** dropdown. A hint will confirm which page you need to be on.

### Step 4 — Extract

Click **Extract Lines**. The extension will automatically paginate through every page of your lines table, collecting all records. 

- Keep the panel tab open and in the foreground while extraction runs
- A progress bar shows how many lines have been collected
- Extraction stops automatically when all pages have been processed

### Step 5 — Review your data

Once extraction is complete, click **Open Review Tab**. This opens a full-page review screen where you can:

| Action | How |
|--------|-----|
| Edit customer name or email | Click directly in the cell and type |
| Edit reseller notes | Click directly in the cell and type |
| Assign a product to a line | Use the dropdown in the Product column |
| Bulk assign a product to all lines | Select a product in the toolbar → **Apply to All** |
| Bulk assign a product to active lines only | Select a product in the toolbar → **Active Only** |
| Remove all expired lines | Click **✕ Remove Expired** |

### Step 6 — Download CSV

Click **⬇ Download CSV** to save the file as `panelr-lines-import.csv`. This file is formatted for direct import into Panelr.app.

---

## CSV Output Format

The exported CSV contains the following columns:

| Column | Description |
|--------|-------------|
| `panel_user_id` | Internal user/line ID from the source panel |
| `username` | Line username |
| `password` | Line password |
| `expiration_date` | Expiration date as shown in the panel |
| `status` | `active`, `expired`, or `disabled` |
| `customer_name` | Customer name (editable in review) |
| `customer_email` | Customer email address (editable in review) |
| `reseller_notes` | Reseller notes field (editable in review) |
| `product_id` | Panelr product ID assigned during review |

---

## Products

Each panel type maps to a standard set of products used during the review step provided by that panel, example:

| Product ID | Label | Duration |
|------------|-------|----------|
| `trial` | 24hr Free Trial | — |
| `monthly` | Monthly Connection | 1 month |
| `quarterly` | Quarterly Connection | 3 months |
| `semi_annual` | Semi-Annual Connection | 6 months |
| `annual` | Annual Connection | 12 months |

---

## Notes & Limitations

- **All data stays local.** No data is sent to any server. Everything is processed in your browser and stored temporarily in Chrome's local extension storage until you close the review tab.
- **One extraction at a time.** Running a new extraction overwrites the previous session's data.
- **Page must remain open.** Navigating away from the panel tab during extraction will interrupt the process.
- **Max pages:** Extraction will stop after 500 pages as a safety limit.
- The extension detects duplicate usernames across pages to prevent double-counting if pagination behaves unexpectedly.

---

## Adding a New Panel

To add support for a new panel type, open `panels.js` and add a new entry to the `PANELS` object. Each panel requires five functions:

| Key | Purpose |
|-----|---------|
| `detect()` | Returns `true` if the current page is the correct lines table |
| `getTotal()` | Returns the total number of lines (used for progress display) |
| `extractPage()` | Scrapes and returns all rows from the current page |
| `nextPage()` | Clicks the next pagination button, returns `true` if successful |
| `products` | Array of product definitions for the review dropdown |

Once added, register the new panel in the `popup.html` dropdown.
