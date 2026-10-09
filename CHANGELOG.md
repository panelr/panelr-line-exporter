# Changelog

## 1.2.0

- XUI.One: a new panel adapter for the Lines page. Reads line id, login, password, expiry (converted from day-month-year) and status, pages through the table, and marks trial lines as the trial product. The table carries no customer name or email, so those are filled in on the review page or in Panelr. Contributed by a Panelr customer.

## 1.1.0

- WHMCS mode: export every customer and every service from a WHMCS install through its API, as one file for Panelr's Migrate from WHMCS page. Customer login hashes are kept where WHMCS still hands them out.
- The extension asks for permission to reach the WHMCS address at export time, and saves the file through the browser's download prompt.

## 1.0.0

- First release: Strong8k and T-Rex, with the review page and CSV export.
