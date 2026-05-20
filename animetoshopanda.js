export default new class AnimeToshoPanda {
  url = atob("aHR0cHM6Ly9hbmltZXRvc2hvLnh5ei9qc29u");
  
  async batch(query) {
    if (!navigator.onLine) return;
    const { hash, fetch: injectedFetch } = query;
    const fetchMethod = injectedFetch || fetch;

    const res = await fetchMethod(this.url + "?show=torrent&btih=" + hash);
    if (!res.ok) return;
    
    const data = await res.json();
    return data.nzb_url;
  }
  
  async single() {}
  
  async test() {
    try {
      if (!(await fetch(this.url)).ok) throw new Error(`Failed to load data from AnimeTosho! Is the site down?`);
      return !0;
    } catch (error) {
      throw new Error(`Could not reach AnimeTosho! Does the site work in your region?`);
    }
  }
};
