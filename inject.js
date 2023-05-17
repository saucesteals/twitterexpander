const urls = {};

const proxy = (object, prop, shortened) => {
  Object.defineProperty(object, prop, {
    get: function () {
      if (urls[shortened]) return urls[shortened];

      console.log("Unshortened URL not found:", shortened);
      return shortened;
    },
  });
};

const expand = (obj) => {
  if (Array.isArray(obj)) return obj.forEach(expand);

  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value == "object") return expand(value);

    if (typeof value !== "string") return;

    if (key === "expanded_url" && typeof obj.url === "string") {
      urls[obj.url] = obj.expanded_url;
    }

    if (key !== "full_text" && value.startsWith("https://t.co/")) {
      proxy(obj, key, value);
    }
  });
};

const getAllResponseHeaders = XMLHttpRequest.prototype.getAllResponseHeaders;
XMLHttpRequest.prototype.getAllResponseHeaders = function () {
  const headers = getAllResponseHeaders.call(this);

  if (this.readyState !== XMLHttpRequest.DONE) return headers;

  if (this.responseURL.startsWith("https://twitter.com/i/api/graphql")) {
    const data = JSON.parse(this.responseText);
    expand(data);
    const expanded = JSON.stringify(data);
    Object.defineProperty(this, "responseText", {
      get: function () {
        return expanded;
      },
    });
  }

  return headers;
};
