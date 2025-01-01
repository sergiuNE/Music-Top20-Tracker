const youtubeApiKey = "AIzaSyDT9eqr297LW_xPwnUle2cTpbayB0P8n2g";
const spotifyClientId = "YOUR_SPOTIFY_CLIENT_ID";
const spotifyClientSecret = "YOUR_SPOTIFY_CLIENT_SECRET";
const appleMusicToken = "YOUR_APPLE_MUSIC_TOKEN";

async function fetchYouTubeData(genre) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${genre}&type=video&order=viewCount&key=${youtubeApiKey}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.items.map(item => ({
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.default.url,
        views: "--" // Placeholder as views require an additional API call
    }));
}

async function fetchSpotifyData(genre) {
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=client_credentials&client_id=${spotifyClientId}&client_secret=${spotifyClientSecret}`
    });
    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    const apiUrl = `https://api.spotify.com/v1/search?q=genre:${genre}&type=track&limit=3`;
    const response = await fetch(apiUrl, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    const data = await response.json();
    return data.tracks.items.map(track => ({
        title: track.name,
        artist: track.artists[0].name,
        thumbnail: track.album.images[0].url,
        views: "--" // Spotify does not provide views
    }));
}

async function fetchAppleMusicData(genre) {
    const apiUrl = `https://api.music.apple.com/v1/catalog/us/charts?types=songs&genre=${genre}&limit=3`;
    const response = await fetch(apiUrl, {
        headers: {
            "Authorization": `Bearer ${appleMusicToken}`
        }
    });
    const data = await response.json();
    return data.results.songs[0].data.map(song => ({
        title: song.attributes.name,
        artist: song.attributes.artistName,
        thumbnail: song.attributes.artwork.url.replace("{w}", "200").replace("{h}", "200"),
        views: "--" // Apple Music does not provide views
    }));
}

async function updateMusicData() {
    const platform = document.getElementById("platformDropdown").value;
    const genre = document.getElementById("genreDropdown").value;
    const container = document.getElementById("musicContainer");
    container.innerHTML = "Loading...";

    let data;
    if (platform === "youtube") {
        data = await fetchYouTubeData(genre);
    } else if (platform === "spotify") {
        data = await fetchSpotifyData(genre);
    } else if (platform === "applemusic") {
        data = await fetchAppleMusicData(genre);
    }

    container.innerHTML = "";
    data.forEach(song => {
        const songDiv = document.createElement("div");
        songDiv.innerHTML = `
            <img src="${song.thumbnail}" alt="${song.title}" style="width:100px;height:auto;">
            <h3>${song.title}</h3>
            <p>Artist: ${song.artist}</p>
            <p>Views: ${song.views}</p>
        `;
        container.appendChild(songDiv);
    });
}

document.getElementById("platformDropdown").addEventListener("change", updateMusicData);
document.getElementById("genreDropdown").addEventListener("change", updateMusicData);

// Initialize with default data
document.addEventListener("DOMContentLoaded", updateMusicData);