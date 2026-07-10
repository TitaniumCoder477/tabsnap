'use strict';

chrome.runtime.onInstalled.addListener(function(details) {
	console.log("DEBUG: TabSnap installed", details);
});

chrome.runtime.onStartup.addListener(() => {
	console.log("DEBUG: TabSnap startup");
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
	for(var key in changes) {
		let data = changes[key].newValue;
		console.log('key = "%s" and data = "%s"', key, data);
	}
});
