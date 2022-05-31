// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const ytdl = require("ytdl-core"),
ytsr = require("ytsr"),
fs = require("fs"),
path = require("path");
window.addEventListener("load", () => {
	try{
		if (!fs.existsSync('./audio')) fs.mkdirSync('./audio');
		clear();
		const searchInput = document.getElementById("search"),
		results = document.getElementById("results"),
		audioContainer = document.getElementById("audioctn"),
		alertText = document.getElementById("alert");
		var processing = false;
		if(localStorage.getItem("search") != null) searchInput.value = localStorage.getItem("search");
		function alert(text) {
			text?alertText.innerText = text:alertText.innerHTML = "&nbsp;";
		}
		async function clear() {
			const directory = "audio";
			fs.readdir(directory, (err, files) => {
				if (err) throw err;
				for (const file of files) {
					fs.unlink(path.join(directory, file), err => {if (err) throw err;});
				}
			});		
		}
		async function search() {
			if(processing) return;
			processing = true;
			alert("processing...")
			const filters = await ytsr.getFilters(searchInput.value),
			videoFilter = filters.get("Type").get("Video");
			ytsr(videoFilter.url, {
				limit: 20,
			}).then(res => {
				alert();
				audioContainer.textContent = results.textContent = "";
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
						alert("downloading audio to play...");
						e.preventDefault();
						play(item);
					})
					results.appendChild(result);
					processing = false;
				})
			});
		}
		async function play(item) {
			if(processing) return;
			processing = true;
			clear();
			const source = "./audio/" + ytdl.getVideoID(item.url);
			const stream = ytdl(ytdl.getVideoID(item.url), {quality:"highestaudio",filter:"audioonly"}).pipe(fs.createWriteStream(source));
			stream.addListener("finish", async () => {
				stream.end();
				alert();
				audioContainer.textContent = results.textContent = "";
				if(item.bestThumbnail) {
					const thumb = document.createElement("img");
					thumb.src = item.bestThumbnail.url;
					audioContainer.appendChild(thumb);
				}
				const audio = document.createElement("audio");
				audio.src = source;
				audio.controls = true;
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
				audio.play();
				processing = false;
			})	
		}
		searchInput.addEventListener("input",()=>{
			localStorage.setItem("search",searchInput.value);
		})
		searchInput.addEventListener("keydown",e=>{if(e.key == "Enter")search();});
		document.getElementById("searchbtn").addEventListener("click",search)
		window.addEventListener("keydown",e=>{
			if(e.key == "/" && e.ctrlKey) {
				e.preventDefault();
				searchInput.focus();
			}
		})		
	} catch(err) {
		console.error(err)
	}
})