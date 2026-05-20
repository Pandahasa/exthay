const QUALITIES = [ "1080", "720", "540", "480" ];

export default new class SubsPlease {
  url=atob("aHR0cHM6Ly9zdWJzcGxlYXNlLm9yZy9hcGkvP2Y9c2VhcmNoJnR6PVVUQyZxPQ==");
  
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
        size: 0,
        accuracy: "high",
        type: void 0,
        date: new Date(entry.release_date)
      };
    });
  }

  _extractHash(magnet) {
    const match = magnet.match(/xt=urn:btih:([^&]+)/i);
    return match ? match[1].toLowerCase() : null;
  }

  async single({titles: titles, episode: episode, resolution: resolution}) {
    if (!navigator.onLine) return [];
    if (!titles?.length) throw new Error("No titles provided");

    const targetRes = resolution || "1080";
    const epStr = (episode && Number(episode) < 10) ? `0${episode}` : (episode || "");
    const query = encodeURIComponent(`${titles[0]} ${epStr}`.trim());

    try {
      const res = await fetch(this.url + query), data = await res.json();
      if (data.error || Object.keys(data).length === 0) return [];
      
      const entries = Object.values(data).filter(entry => !episode || entry.episode === String(epStr) || entry.episode === String(episode));
      return entries.length ? this.map(entries, targetRes) : [];
    } catch (error) {
      return [];
    }
  }

  batch=() => [];
  
  movie=() => [];

  async test() {
    try {
      if (!(await fetch(atob("aHR0cHM6Ly9zdWJzcGxlYXNlLm9yZy9hcGkvP2Y9c2NoZWR1bGUmdHo9VVRD"))).ok) throw new Error("Failed to load data from SubsPlease! Is the site down?");
      return !0;
    } catch (error) {
      throw new Error("Could not reach SubsPlease! Does the site work in your region?");
    }
  }
};
