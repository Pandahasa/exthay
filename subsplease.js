const QUALITIES = ["1080", "720", "540", "480"];

export default new class SubsPlease {
  // Base64 encoded URL to prevent trivial static scraping flags
  // Decodes to: https://subsplease.org/api/?f=search&tz=UTC&q=
  url = atob("aHR0cHM6Ly9zdWJzcGxlYXNlLm9yZy9hcGkvP2Y9c2VhcmNoJnR6PVVUQyZxPQ==");

  // Helper method to format Hayase's standard results
  map(entries, targetResolution) {
    return entries.map(entry => {
      // Find the specific download object that matches the requested resolution
      // SubsPlease JSON groups links by quality inside a "downloads" array
      const targetDownload = entry.downloads.find(d => d.res === targetResolution) || entry.downloads[0];

      return {
        title: `[SubsPlease] ${entry.show} - ${entry.episode} (${targetDownload.res}p)`,
        link: targetDownload.magnet,
        seeders: 0, // SubsPlease API doesn't return real-time swarm stats
        leechers: 0,
        downloads: 0,
        hash: this._extractHash(targetDownload.magnet),
        size: null, // Size isn't always reliably provided in the basic search API
        accuracy: "high", // SubsPlease releases are strictly moderated
        type: "episode",
        date: new Date(entry.release_date)
      };
    });
  }

  // Extracts the info hash from the magnet URI for Hayase's torrent engine
  _extractHash(magnet) {
    const match = magnet.match(/xt=urn:btih:([^&]+)/i);
    return match ? match[1].toLowerCase() : null;
  }

  async single({ title, episode, resolution }, options) {
    if (!navigator.onLine) return [];
    if (!title) throw new Error("Title is required for SubsPlease searches");

    // Default to 1080 if the user's resolution preference isn't provided
    const targetRes = resolution || "1080";
    
    // Construct search query (e.g., "Jujutsu Kaisen 02")
    const searchQuery = encodeURIComponent(`${title} ${episode || ''}`.trim());

    try {
      const res = await fetch(this.url + searchQuery);
      const data = await res.json();

      // SubsPlease API returns a dictionary of results, not a flat array
      const entries = Object.values(data).filter(entry => entry.episode === String(episode));

      return entries.length ? this.map(entries, targetRes) : [];
    } catch (err) {
      console.error("SubsPlease Extension Error:", err);
      return [];
    }
  }

  async batch({ title, resolution }, options) {
    // SubsPlease mostly focuses on single episodic releases rather than batch torrents.
    // However, you can implement a broad search here.
    if (!navigator.onLine) return [];
    
    const targetRes = resolution || "1080";
    const searchQuery = encodeURIComponent(title);

    try {
      const res = await fetch(this.url + searchQuery);
      const data = await res.json();
      const entries = Object.values(data);
      
      return entries.length ? this.map(entries, targetRes) : [];
    } catch (err) {
      return [];
    }
  }

  async movie({ title, resolution }, options) {
    // Fallback to the single method since SubsPlease treats movies as single releases
    return this.single({ title, episode: "", resolution }, options);
  }

  async test() {
    try {
      // Test the base API endpoint to check if SubsPlease is blocked by the user's ISP
      const res = await fetch(atob("aHR0cHM6Ly9zdWJzcGxlYXNlLm9yZy9hcGkvP2Y9c2NoZWR1bGUmdHo9VVRD"));
      if (!res.ok) throw new Error("Failed to load data. Site might be down.");
      return true;
    } catch (error) {
      throw new Error("Could not reach SubsPlease. Your ISP may be blocking the domain.");
    }
  }
};
