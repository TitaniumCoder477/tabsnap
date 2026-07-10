
//Call init each time we load the popup menu
init();

let snapBtn = document.getElementById('snapBtn');
snapBtn.onclick = function() {
	let me = "snapBtn.onclick: "

	let dateNow = new Date();
	saveSnap(dateNow, function() {
		// Refresh only AFTER save completes
		document.getElementById("snapshots").innerHTML = "";
		init();
	});
};

//var windowMap = new Map;
//var tabCollections = new Array;

/**
	* @desc initializes the popup menu html with saved snapshot timestamps
	* @param nothing
	* @return nothing
	*/
function init() {
	let me = "init: ";
	console.log(me);

	//Get everything from the local storage
	chrome.storage.local.get(null, function(possibilities) {
		console.log(me + "examining possibilities");

		let snapshotsDiv = document.getElementById("snapshots");
		//Iterate through each possible pair from the local storage
		let load = Object.entries(possibilities);
		load.forEach(pair => {
			let key = pair[0];
			let val = pair[1];
			if (key.startsWith("TabSnapWindow")) {

				//// TODO: We don't do anything with the window on the popup menu at
				//this time; maybe we can do something useful with it later? For now,
				//just log.

				console.log(me + "Found a window!");
			} else if (key.startsWith("TabSnapTabCollection")) {
				console.log(me + "Found a tab collection!");

				//This block of code handles parsing the timestamp and adding it to
				//the html popup menu.

				let time = key.substr(key.indexOf('_')+1);
				let timestamp = new Date(new Number(time));
				
				// Container for flex layout (timestamp + delete X)
				let snapDiv = document.createElement("div");
				snapDiv.style.display = "flex";
				snapDiv.style.justifyContent = "space-between";
				snapDiv.style.alignItems = "center";
				snapDiv.style.margin = "4px 0";
				snapDiv.style.padding = "2px";
				
				let snapPara = document.createElement("span");
				snapPara.textContent = timestamp.toLocaleString();
				snapPara.style.cursor = "pointer";
				snapPara.style.flexGrow = "1";
				snapPara.addEventListener('click', function() {
					loadSnap(time);
				});
				
				let deleteBtn = document.createElement("span");
				deleteBtn.textContent = "X";
				deleteBtn.style.cursor = "pointer";
				deleteBtn.style.color = "#d32f2f";
				deleteBtn.style.fontWeight = "bold";
				deleteBtn.style.marginLeft = "8px";
				deleteBtn.addEventListener('click', function(e) {
					e.stopPropagation(); // Prevent triggering load
					deleteSnap(time);
				});
				
				snapDiv.appendChild(snapPara);
				snapDiv.appendChild(deleteBtn);
				snapshotsDiv.appendChild(snapDiv);

			} else {
				console.log(me + "Found something I was not expecting.");
			}
		});
	});
}

/**
	* @desc saves the a snapshot of all the windows and tabs
	* @param Date $dateNow - a date object that represents the timestamp
	* @return nothing
	*/
function saveSnap(dateNow, callback) {
	let me = "saveSnap: ";
	console.log(me + "Snap date is " + dateNow.toLocaleString());

	let savedCount = 0;
	const totalSaves = 2;
	const checkDone = () => {
		savedCount++;
		if (savedCount === totalSaves && callback) {
			callback();
		}
	};

	getOpenWindows(function(windows) {
		let snapKey = "TabSnapWindow_" + dateNow.getTime().toString();
		let snapVal = JSON.stringify(windows);
		let snapMap = {};
		snapMap[snapKey] = snapVal;
		chrome.storage.local.set(snapMap, function() {
			if(chrome.runtime.lastError !== null && typeof chrome.runtime.lastError === "object") {
				console.log(me + chrome.runtime.lastError.message);
			} else {
				console.log(me + 'Saved snap windows as ' + snapKey);
			}
			checkDone();
		});
	});

	getOpenTabs(function(tabs) {
		let snapKey = "TabSnapTabCollection_" + dateNow.getTime().toString();
		let snapVal = JSON.stringify(tabs);
		let snapMap = {};
		snapMap[snapKey] = snapVal;
		chrome.storage.local.set(snapMap, function() {
			if(chrome.runtime.lastError !== null && typeof chrome.runtime.lastError === "object") {
				console.log(me + chrome.runtime.lastError.message);
			} else {
				console.log(me + 'Saved snap tabs as ' + snapKey);
			}
			checkDone();
		});
	});
}

/**
	* @desc gets all the open windows
	* @param function $callback - a function to call with results
	* @return nothing
	*/
function getOpenWindows(callback) {
	let me = "getOpenWindows: ";
	console.log(me);

	chrome.windows.getAll({},
		function(windows) {
			var windowResults = {};
			windows.forEach(window => {
				windowResults[window.id] = JSON.stringify(window);
			});
			if(callback) {
				callback(windowResults);
			}
		}
	);
}

/**
	* @desc gets all the open tabs
	* @param function $callback - a function to call with results
	* @return nothing
	*/
function getOpenTabs(callback) {
	chrome.tabs.query({}, function(tabs) {
		const tabResults = tabs.map(tab => ({
			url: tab.url,
			pinned: tab.pinned,
			active: tab.active,
			index: tab.index,
			windowId: tab.windowId
		}));

		if (callback) callback(tabResults);
	});
}

/**
	* @desc loads a snapshot of all the windows and tabs
	* @param number $time - milliseconds based on the Date.getTime() function
	* @return nothing
	*/
function loadSnap(time) {
	const tabKey = "TabSnapTabCollection_" + time;
	const windowKey = "TabSnapWindow_" + time;

	getSavedTabs(tabKey, function(tabs) {
		const tabMap = new Map();

		tabs.forEach(tab => {
			const winId = tab.windowId || 0;
			if (!tabMap.has(winId)) tabMap.set(winId, []);
			tabMap.get(winId).push(tab);
		});

		getSavedWindows(windowKey, function(windows) {
			for (const [key, winOpts] of windows.entries()) {
				const tabsForWindow = (tabMap.get(key) || []).sort((a, b) => a.index - b.index);

				if (!tabsForWindow.length) continue;

				const pinnedTabs = tabsForWindow.filter(t => t.pinned);
				const unpinnedTabs = tabsForWindow.filter(t => !t.pinned);

				const firstTab = pinnedTabs[0] || unpinnedTabs[0];
				const remainingTabs = firstTab.pinned
				? pinnedTabs.slice(1).concat(unpinnedTabs)
				: pinnedTabs.concat(unpinnedTabs.slice(1));

				chrome.windows.create(
					{
						...winOpts,
						url: firstTab.url
					},
					function(createdWindow) {
						if (!createdWindow || !createdWindow.id) return;

						chrome.tabs.query({ windowId: createdWindow.id }, function(existingTabs) {
							const initialTab = existingTabs[0];
							if (initialTab) {
								chrome.tabs.update(initialTab.id, {
									pinned: firstTab.pinned,
									active: firstTab.active
								});
							}

							remainingTabs.forEach(tab => {
								chrome.tabs.create({
									windowId: createdWindow.id,
									url: tab.url,
									pinned: tab.pinned,
									active: tab.active
								});
							});
						});
					}
				);
			}
		});
	});
}

/**
	* @desc uses a key to locate windows from the local storage
	* @param string $key - a string of the format "TabsnapWindow_" +
	*   Date.getTime().toString()
	* @param function $callback - a function to call with the result
	* @return nothing
	*/

function getSavedWindows(key, callback) {
	let me = "getSavedWindows: ";
	console.log(me);

	chrome.storage.local.get([key],
		function(result) {
			var windowResults = new Map();
			//Parse the JSON string into an object map
			let windowVal = JSON.parse(Object.values(result)[0]);
			//Iterate through the object map
			for (let [key, value] of Object.entries(windowVal)) {
				let window = JSON.parse(value);
				let windowId = window.id;

				//This block of code handles properties that we saved but that cannot be
				//used for creating a new window. While this code works now, it
				//unfortunately will have to evolve over time with the Chrome API.

				delete window['alwaysOnTop'];
				delete window['id'];
				switch(window['state']) {
				  case 'maximized':
				  case 'fullscreen':
				    if(window['focused'] === false) {
				      delete window['focused'];
				    }
				  case 'minimized':
				    if(window['state'] === 'minimized' && window['focused'] === true) {
				      delete window['focused'];
				    }
				    //Delete all of these if maximized, fullscreen, or minimized
				    delete window['left'];
				    delete window['top'];
				    delete window['width'];
				    delete window['height'];
				}

				console.log(me + "Window:");
				console.log(window);

				windowResults.set(windowId,window);
			}
			if(callback) {
				callback(windowResults);
			}
		}
	);
}

function getSavedTabs(key, callback) {
	chrome.storage.local.get([key], function(result) {
		const storedData = result[key];
		if (!storedData) {
			if (callback) callback([]);
			return;
		}

		let tabs;
		try {
			tabs = JSON.parse(storedData);
		} catch (e) {
			console.error("Parse error:", e);
			if (callback) callback([]);
			return;
		}

		const cleanTabs = tabs
		.filter(tab => tab && tab.url)
		.map(tab => ({
			url: tab.url,
			pinned: !!tab.pinned,
			active: !!tab.active,
			index: tab.index ?? 0,
			windowId: tab.windowId
		}));

		if (callback) callback(cleanTabs);
	});
}

/**
 * Deletes both the window and tab collection entries for a snapshot
 */
function deleteSnap(time) {
	let me = "deleteSnap: ";
	const windowKey = "TabSnapWindow_" + time;
	const tabKey = "TabSnapTabCollection_" + time;
	
	chrome.storage.local.remove([windowKey, tabKey], function() {
		if (chrome.runtime.lastError) {
			console.error(me + chrome.runtime.lastError.message);
		} else {
			console.log(me + "Deleted snapshot for time: " + time);
			// Refresh the list
			document.getElementById("snapshots").innerHTML = "";
			init();
		}
	});
}
