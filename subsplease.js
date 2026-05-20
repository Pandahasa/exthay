const QUALITIES = ["1080", "720", "540", "480"];

export default new class SubsPlease {
  url = atob("aHR0cHM6Ly9zdWJzcGxlYXNlLm9yZy9hcGkvP2Y9c2VhcmNoJnR6PVVUQyZxPQ==");

  map(entries, targetResolution) {
    return entries.map(entry => {
      const targetDownload = entry.downloads.find(d => d.res === targetResolution) || entry.downloads[0];

      return {
        title: `[SubsPlease] ${entry.show} - ${entry.episode} (${targetDownload.res}p)`,
        link: targetDownload.magnet,
        seeders: 0,
        leechers: 0,
        downloads: 0,
        hash: this._extractHash(targetDownload.magnet),
        size: null,
        accuracy: "high",
        type: "episode",
        date: new Date(entry.release_date)
      };
    });
  }

  _extractHash(magnet) {
    const match = magnet.match(/xt=urn:btih:([^&]+)/i);
    return match ? match[1].toLowerCase() : null;
  }

  _extractTitle(args) {
    // Attempt to extract the title from standard Hayase metadata parameters
    const title = args.romaji || args.english || args.title || args.name || args.query || (args.aliases && args.aliases.length > 0 ? args.aliases[0] : null);
    
    if (!title) {
      // If none exist, output the exact keys provided by the application engine for debugging
      throw new Error(`Metadata missing. Available Hayase parameters: ${Object.keys(args).join(", ")}`);
    }
    
    return title;
  }

  async single(args, options) {
    if (!navigator.onLine) return [];
    
    const title = this._extractTitle(args);
    const targetRes = args.resolution || "1080";
    const searchQuery = encodeURIComponent(`${title} ${args.episode || ''}`.trim());

    try {
      const res = await fetch(this.url + searchQuery);
      const data = await res.json();
      const entries = Object.values(data).filter(entry => entry.episode === String(args.episode));

      return entries.length ? this.map(entries, targetRes) : [];
    } catch (err) {
      return [];
    }
  }

  async batch(args, options) {
    if (!navigator.onLine) return [];
    
    const title = this._extractTitle(args);
    const targetRes = args.resolution || "1080";
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

  async movie(args, options) {
    return this.single({ ...args, episode: "" }, options);
  }

  async test() {
    try {
      const res = await fetch(atob("aHR0cHM6Ly9zdWJzcGxlYXNlLm9yZy9hcGkvP2Y9c2NoZWR1bGUmdHo9VVRD"));
      if (!res.ok) throw new Error("Failed to load data.");
      return true;
    } catch (error) {
      throw new Error("Could not reach SubsPlease.");
    }
  }
};
