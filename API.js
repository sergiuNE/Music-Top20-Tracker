const youtubeApiKey = "AIzaSyDT9eqr297LW_xPwnUle2cTpbayB0P8n2g";
const spotifyClientId = "YOUR_SPOTIFY_CLIENT_ID";
const spotifyClientSecret = "YOUR_SPOTIFY_CLIENT_SECRET";
const appleMusicToken = "YOUR_APPLE_MUSIC_TOKEN";

function getLastMonthDate() { //Songs from the last month
    const now = new Date();
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
    return lastMonth.toISOString(); // Formatteert de datum in ISO 8601
}

async function fetchYouTubeDurations(videoIds) { // API offers no explicit way to distinguish shorts from regular videos. So: Videos shorter than 60 seconds will be deleted.
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(",")}&key=${youtubeApiKey}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.items.map(item => ({
        id: item.id,
        duration: item.contentDetails.duration,
    }));
}

async function fetchYouTubeViews(videoId) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${youtubeApiKey}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.items[0]?.statistics.viewCount || "--";
}

async function fetchYouTubeData(genre) {
    const publishedAfter = getLastMonthDate(); // Date from one month ago
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${genre}+song&type=video&videoCategoryId=10&order=viewCount&publishedAfter=${publishedAfter}&key=${youtubeApiKey}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
        console.error("Error fetching data from YouTube API:", response.statusText);
        return [];
    }

    const data = await response.json();

    const videoIds = data.items.map(item => item.id.videoId);
    const durations = await fetchYouTubeDurations(videoIds);

    const videoData = await Promise.all(
        data.items.map(async (item) => {
            const durationInfo = durations.find(d => d.id === item.id.videoId);
            if (!durationInfo) return null;

            // Exclude shorts (videos under 60 seconds)
            const duration = durationInfo.duration;
            const isShort = /^PT(\d+S)$/.test(duration) && parseInt(duration.match(/^PT(\d+)S$/)[1]) < 60;
            if (isShort) return null;

            const views = await fetchYouTubeViews(item.id.videoId);
            return {
                title: item.snippet.title,
                artist: item.snippet.channelTitle,
                thumbnail: item.snippet.thumbnails.medium.url,
                views: parseInt(views), // Convert views to number for sorting
            };
        })
    );

    return videoData.filter(item => item !== null) // Remove shorts and non-music videos
                    .sort((a, b) => b.views - a.views) // Sort by views (high to low)
                    .slice(0, 3); // Top 3
}

/*async function fetchSpotifyData(genre) {
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
}*/

/*async function fetchAppleMusicData(genre) {
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
}*/

async function updateMusicData() {
    const genre = document.getElementById("genreDropdown").value;
    const container = document.getElementById("musicContainer");
    container.innerHTML = "<p>Loading...</p>";

    try {
        const data = await fetchYouTubeData(genre);
        container.innerHTML = "";

        if (data.length === 0) {
            container.innerHTML = "<p>No results found for this genre in the past month.</p>";
            return;
        }

        data.forEach((song, index) => {
            const songDiv = document.createElement("div");
            songDiv.classList.add("song-card");
            songDiv.innerHTML = `
                <h3>Top${index + 1}</h3>
                <img src="${song.thumbnail}" alt="${song.title}">
                <h4>${song.title}</h4>
                <p>Artist: ${song.artist}</p>
                <p>Views: ${song.views.toLocaleString()}</p>
            `;
            container.appendChild(songDiv);
        });
    } catch (error) {
        console.error("Error updating music data:", error);
        container.innerHTML = "<p>Failed to load music data. Please try again later.</p>";
    }
}

// Initialize with default data on page load
document.addEventListener("DOMContentLoaded", updateMusicData);
document.getElementById("genreDropdown").addEventListener("change", updateMusicData);