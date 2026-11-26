# Changelog

## 1.4.0

- Ghost Panel: a new panel option for its Manage Users page. Reads line id, login, password, status, trial and expiry, pages through the table, marks trial lines as the trial product, and takes the note and any email in it. The expiry is written in UTC from the table's own timestamp, so it is right whatever time zone the panel shows.
- The hint under the panel list now says which page to open for the panel chosen.

## 1.3.1

- XUI.One: an expiry the panel shows as a date above a time is written on one line. It used to put a line break in the middle of the CSV row. Dates are read whether the panel shows day-month-year or year-month-day.
- XUI.One: the MAG page. A MAG device is exported by its MAC address, with no username or password, into the MAC Address column, and with its device number from the panel so Panelr can renew it there.
- Strong8k: a row whose first cell is a MAC address is exported as a MAG device, whatever the page's first heading says.
- A line break inside any value is written to the CSV as a space, so each line stays one row.

## 1.3.0

- Strong8k: MAG devices. On the panel's MAG page the extension reads each device by its MAC address (a MAG device has no username), with its line id, expiry, status and notes. The review page and the CSV have a MAC Address column, and a file of MAG devices is saved as `panelr-mag-import.csv`. Panelr's line import reads the column and brings them in as MAG lines.
- Strong8k, T-Rex: a note written as "Name (email)" no longer leaves empty brackets after the customer's name.

## 1.2.0

- XUI.One: a new panel adapter for the Lines page. Reads line id, login, password, expiry (converted from day-month-year) and status, pages through the table, and marks trial lines as the trial product. The table carries no customer name or email, so those are filled in on the review page or in Panelr. Contributed by a Panelr customer.

## 1.1.0

- WHMCS mode: export every customer and every service from a WHMCS install through its API, as one file for Panelr's Migrate from WHMCS page. Customer login hashes are kept where WHMCS still hands them out.
- The extension asks for permission to reach the WHMCS address at export time, and saves the file through the browser's download prompt.

## 1.0.0

- First release: Strong8k and T-Rex, with the review page and CSV export.
