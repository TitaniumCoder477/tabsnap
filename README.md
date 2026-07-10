# TabSnap

Saves your collection of Chrome windows and tabs.

TabSnap is a simple, robust, open-source backup tool for your open tabs. With one click, it captures all open Chrome windows and tabs, preserves ordering and pinned tabs, and lets you restore a snapshot later.

## Features

- Snap all open windows and tabs in one click.
- Preserve tab order and pinned tabs.
- Restore a saved snapshot later.
- Delete individual snapshots.
- Store snapshots locally in Chrome storage.
- Lightweight popup UI.

## How It Works

TabSnap stores two records for each snapshot:

- A window collection that preserves the structure of each window.
- A tab collection that preserves each tab’s URL, pin state, active state, order, and window membership.

When you click a saved timestamp, TabSnap reconstructs the windows and tabs in the same general layout.

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the TabSnap project folder.

## Usage

### Save a snapshot

1. Open the tabs and windows you want to preserve.
2. Click the **Snap** button.
3. TabSnap saves the current state locally and adds a timestamp to the list.

### Restore a snapshot

1. Open the TabSnap popup.
2. Click a saved timestamp.
3. TabSnap recreates the saved windows and tabs.

### Delete a snapshot

1. Open the TabSnap popup.
2. Click **X** next to a saved timestamp.
3. The snapshot is removed from local storage.

## Permissions

TabSnap uses the following Chrome permissions:

- `storage` for saving snapshots locally.
- `tabs` for reading and restoring tab data.

## Notes

- Chrome internal pages such as `chrome://extensions/` may not restore like normal web pages.
- Pinned tabs are restored separately to preserve their left-side placement.
- Snapshots are stored locally in your browser and are not synced to a remote server.

## Project Structure

- `manifest.json` — extension manifest.
- `popup.html` — popup UI.
- `popup.js` — snapshot save/restore logic.
- `background.js` — service worker hooks.

## License
 
This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

Built with ❤ by myself in 2019. Bug fixed in 2026 using Perplexity!
