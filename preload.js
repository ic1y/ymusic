const ytdl = require("ytdl-core"),
ytsr = require("ytsr"),
fs = require("fs"),
path = require("path");
window.addEventListener("load", async () => {
	try{
		if (!fs.existsSync(path.join(getAppDataPath(), "audio"))) fs.mkdirSync(path.join(getAppDataPath(), "audio"));
		await clear();
		const searchInput = document.getElementById("search"),
		results = document.getElementById("results"),
		audioContainer = document.getElementById("audioctn"),
		alertText = document.getElementById("alert"),
		alertContainer = document.getElementById("alertctn");
		var processing = false;
		if(localStorage.getItem("search") != null) searchInput.value = localStorage.getItem("search");
		if(localStorage.getItem("lastPlayed") != null) {
			alert("resuming last session...");
			await play(JSON.parse(localStorage.getItem("lastPlayed")));
		};
		function getAppDataPath() {
			switch (process.platform) {
				case "darwin": {
					return path.join(process.env.HOME, "Library", "Application Support", "YMusic");
				}
				case "win32": {
					return path.join(process.env.APPDATA, "YMusic");
				}
				case "linux": {
					return path.join(process.env.HOME, ".YMusic");
				}
				default: {
					console.log("Unsupported platform!");
					process.exit(1);
				}
			}
		}
		function removeAllChildren(parent) {
			while (parent.lastChild) {
				parent.removeChild(parent.lastChild);
			}
		}
		function alert(text) {
			if(text) {
				alertText.innerText = text;
				alertContainer.classList.remove("hidden");
			} else {
				alertContainer.classList.add("hidden");
			}
		}
		async function clear() {
			const directory = path.join(getAppDataPath(),'audio');
			fs.readdir(directory, (err, files) => {
				if (err) throw err;
				for (const file of files) {
					fs.unlink(path.join(directory, file), err => {if (err) throw err;});
				}
			});		
		}
		async function search() {
			if(processing || searchInput.value.trim() == "") return;
			processing = true;
			alert("searching...")
			const filters = await ytsr.getFilters(searchInput.value),
			videoFilter = filters.get("Type").get("Video");
			ytsr(videoFilter.url, {
				limit: 100,
			}).then(res => {
				alert();
				removeAllChildren(results)
				results.classList.remove("hidden")
				res.items.forEach(item => {
					const result = document.createElement("a");
					result.href = item.url;
					result.classList.add("result");
					if(item.bestThumbnail) {
						const thumb = document.createElement("img");
						thumb.src = item.bestThumbnail.url;
						result.appendChild(thumb);
					}
					if(item.title) {
						const title = document.createElement("h2");
						title.innerText = item.title;
						result.appendChild(title);
					}
					if(item.author) {
						const author = document.createElement("h3");
						author.innerText = item.author.name;
						result.appendChild(author);	
					}
					result.addEventListener("click",e=>{
						e.preventDefault();
						alert("downloading audio to play...");
						play(item);
					})
					results.appendChild(result);
				})
				results.firstChild.scrollIntoView();
				results.firstChild.focus();
				processing = false;
			});
		}
		async function play(item) {
			if(processing) return;
			processing = true;
			await clear();
			const source = path.join(getAppDataPath(), "audio", ytdl.getVideoID(item.url));
			const stream = ytdl(ytdl.getVideoID(item.url), {quality:"highestaudio",filter:"audioonly"}).pipe(fs.createWriteStream(source));
			stream.addListener("finish", async () => {
				stream.end();
				alert();
				removeAllChildren(audioContainer);
				audioContainer.classList.remove("hidden")
				localStorage.setItem("lastPlayed",JSON.stringify(item));
				if(item.bestThumbnail) {
					const thumb = document.createElement("img");
					thumb.src = item.bestThumbnail.url;
					audioContainer.appendChild(thumb);
				}
				const audio = document.createElement("audio");
				audio.src = source;
				audioContainer.appendChild(audio);
				if(item.title) {
					const title = document.createElement("h2");
					title.innerText = item.title;
					audioContainer.appendChild(title);
				}
				if(item.author) {
					const author = document.createElement("h3");
					author.innerText = item.author.name;
					audioContainer.appendChild(author);	
				}
				audioContainer.scrollIntoView();
				audioContainer.focus();
				audio.play();
				window.dispatchEvent(new Event("plyr"));
				processing = false;
			})	
		}
		searchInput.addEventListener("input",()=>{
			localStorage.setItem("search",searchInput.value);
		})
		searchInput.addEventListener("keydown",e=>{
			if(e.key == "Enter") search();
		});
		document.getElementById("searchbtn").addEventListener("click",search)
		document.getElementById("clearbtn").addEventListener("click",()=>{
			localStorage.clear();
			alert("cleared localStorage!");
		})
		window.addEventListener("keydown", async (e) => {
			if(e.target.tagName == "INPUT") return;
			switch (e.key) {
				case "/":
					e.preventDefault();
					searchInput.focus();
					break;
			}
		})
	} catch(err) {
		console.error(err);
	}
})