export default new class SubsPlease {
  // Base64 decodes to: https://subsplease.org/api/?f=search&tz=UTC&q=
  url = atob("aHR0cHM6Ly9zdWJzcGxlYXNlLm9yZy9hcGkvP2Y9c2VhcmNoJnR6PVVUQyZxPQ==");

  _extractHash(magnet) {
    const match = magnet.match(/xt=urn:btih:([^&]+)/i);
    return match ? match[1].toLowerCase() : "";
  }

  _mapResults(entries, resolution, exclusions) {
    const targetRes = resolution || "1080";
    const results = [];

    for (const entry of entries) {
      const targetDownload = entry.downloads.find(d => d.res === targetRes) || entry.downloads[0];
      if (!targetDownload) continue;

      const title = `[SubsPlease] ${entry.show} - ${entry.episode} (${targetDownload.res}p)`;

      if (exclusions && exclusions.length > 0) {
        const lowerTitle = title.toLowerCase();
        if (exclusions.some(ex => lowerTitle.includes(ex.toLowerCase()))) {
          continue;
        }
      }

      results.push({
        title: title,
        link: targetDownload.magnet,
        seeders: 0,
        leechers: 0,
        downloads: 0,
        hash: this._extractHash(targetDownload.magnet),
        size: 0, 
        date: new Date(entry.release_date),
        accuracy: "high"
      });
    }

    return results;
  }

  async single(query) {
    if (!navigator.onLine) return [];
    
    const { titles, episode, resolution, exclusions, fetch: injectedFetch } = query;
    
    if (!titles || !titles.length) throw new Error("SubsPlease: No titles provided in the query data.");
    if (!injectedFetch) throw new Error("SubsPlease: Internal fetch method not provided by the application environment.");

    const epStr = (episode !== undefined && episode !== null && Number(episode) < 10) 
      ? `0${episode}` 
      : String(episode || "");
      
    const searchQuery = encodeURIComponent(`${titles[0]} ${epStr}`.trim());

    try {
      const res = await injectedFetch(this.url + searchQuery);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      if (data.error || Object.keys(data).length === 0) return [];

      const entries = Object.values(data).filter(entry => !episode || entry.episode === epStr);
      
      return this._mapResults(entries, resolution, exclusions);
    } catch (error) {
      throw new Error(`SubsPlease search failed: ${error.message}`);
    }
  }

  async batch() {
    return [];
  }

  async movie(query) {
    if (!navigator.onLine) return [];
    
    const { titles, resolution, exclusions, fetch: injectedFetch } = query;
    
    if (!titles || !titles.length) throw new Error("SubsPlease: No titles provided for movie search.");
    if (!injectedFetch) throw new Error("SubsPlease: Internal fetch method not provided by the application environment.");

    const searchQuery = encodeURIComponent(titles[0].trim());

    try {
      const res = await injectedFetch(this.url + searchQuery);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      if (data.error || Object.keys(data).length === 0) return [];

      const entries = Object.values(data);
      return this._mapResults(entries, resolution, exclusions);
    } catch (error) {
      throw new Error(`SubsPlease movie search failed: ${error.message}`);
    }
  }

  async test() {
    try {
      const testUrl = atob("aHR0cHM6Ly9zdWJzcGxlYXNlLm9yZy9hcGkvP2Y9c2NoZWR1bGUmdHo9VVRD");
      const res = await fetch(testUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (error) {
      throw new Error("Could not reach SubsPlease. The domain may be offline, or your ISP may be actively blocking the connection.");
    }
  }
};
