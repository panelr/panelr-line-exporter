# Changelog

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
